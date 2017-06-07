/*global phantom:false, require:false, console:false, window:false, QUnit:false */
/*
 * This file is ment to be executed with PhantomJS directly so it must use ES5 syntax only
 */

(function() {
    'use strict';
    var url;
    var page;
    var timeout;
    var abortTimer;
    var system = require('system');
    var args = system.args;
    var DEFAULT_TIMEOUT_SECONDS = 5;

    // small hack to redirect errors to stderr instead of stdout
    console.error = function() {
        system.stderr.write(Array.prototype.join.call(arguments, ' ') + '\n');
    };

    // arg[0]: scriptName, args[1...]: arguments
    if (args.length < 2) {
        console.error('Usage:\n  phantomjs [phantom arguments] runner.js [timeout-in-seconds] <url-of-your-qunit-testsuite> [<url-of-your-qunit-testsuite>...]');
        exit(1);
    }

    page = require('webpage').create();

    // this function will be executed inside phantomjs js-vm, so it mustn't depends on any entities from outer scope
    function addLogging() {
        window.document.addEventListener('DOMContentLoaded', function() {
            var currentTestAssertions = [];

            QUnit.log(function(details) {
                var response;

                // Ignore passing assertions
                if (details.result){
                    return;
                }

                response = details.message ? details.message + ', ' : '';

                if (details.expected) {
                    response += 'expected: ' + details.expected + ', but was: ' + details.actual;
                }

                if (details.source) {
                    response += '\n\t' + details.source.split('\n')[0];
                }

                currentTestAssertions.push('Failed assertion: ' + response);
            });

            QUnit.testDone(function(result) {
                var i;
                var len;
                var name = '';

                if (result.module) {
                    name += result.module + ': ';
                }
                name += result.name;

                text = '';
                if (result.failed) {
                    text += name;

                    for (i = 0, len = currentTestAssertions.length; i < len; i++) {
                        text += '\n\t' + currentTestAssertions[i];
                    }
                    console.log(JSON.stringify({"assertsFailed": text}));
                }

                currentTestAssertions.length = 0;
            });

            QUnit.done(function(result) {
                if (typeof window.callPhantom === 'function') {
                    window.callPhantom({
                        'name': 'QUnit.done',
                        'data': result
                    });
                }
            });
        }, false);
    }

    function open(url) {
        // Set a default timeout value if the user does not provide one
        if (typeof timeout === 'undefined') {
            timeout = DEFAULT_TIMEOUT_SECONDS;
        }

        // Set a timeout on the test running, otherwise tests with async problems will hang forever
        abortTimer = setTimeout(function() {
            console.error('The specified timeout of ' + timeout + ' seconds has expired while running tests on ' + getSuitName(url));
            exit(1);
        }, timeout * 1000);

        page.open(url, pageHandler.bind(this));
    }

    function exit(code) {
        if (page) {
            page.close();
        }
        setTimeout(function() {
            phantom.exit(code);
        }, 0);
    }

    function pageHandler(status) {
        if (status !== 'success') {
            console.error('Unable to access network: ' + status);
            exit(1);
        } else {
            // Cannot do this verification with the 'DOMContentLoaded' handler because it
            // will be too late to attach it if a page does not have any script tags.
            var qunitMissing = page.evaluate(function() {
                return (typeof QUnit === 'undefined' || !QUnit);
            });
            if (qunitMissing) {
                console.error('The `QUnit` object is not present on this page.');
                exit(1);
            }
        }
    }

    function getSuitName(path) {
        return path.replace(/.*\/(.+)\.html$/, '$1')
    }

    // Route `console.log()` calls from within the Page context to the main Phantom context (i.e. current `this`)
    page.onConsoleMessage = function(msg) {
        console.log(JSON.stringify({file: getSuitName(page.url), data: JSON.parse(msg)}));
    };

    page.onInitialized = function() {
        page.evaluate(addLogging);
    };

    page.onCallback = function(message) {
        var result;
        var failed;

        if (message && message.name === 'QUnit.done') {
            result = message.data;
            failed = !result || !result.total || result.failed;

            if (!result.total) {
                console.error('No tests were executed. Are you loading tests asynchronously?');
                exit(1);
            }

            if (failed) {
                console.error('some tests were failed in '+ getSuitName(page.url));
            }

            if (args.length === 0) {
                exit(0);
            }

            clearTimeout(abortTimer);
            // open next page with test suite
            open(args.shift())
        }
    };

    // removing runner itself from args
    args.shift()

    if (!isNaN(parseInt(args[0], 10))) {
        timeout = args.shift();
    }

    // open first page from array of tests
    open(args.shift());
})();

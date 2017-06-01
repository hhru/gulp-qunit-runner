/*global phantom:false, require:false, console:false, window:false, QUnit:false */

(function () {
    'use strict';
    var url, page, timeout, abortTimer;
    var args = require('system').args;

    // arg[0]: scriptName, args[1...]: arguments
    if (args.length < 2) {
        console.error('Usage:\n  phantomjs [phantom arguments] runner.js [timeout-in-seconds] [[url-of-your-qunit-testsuite]...]');
        exit(1);
    }

    // small hack to redirect errors to stderr instead of stdout
    console.error = function () {
        require("system").stderr.write(Array.prototype.join.call(arguments, ' ') + '\n');
    };

    page = require('webpage').create();

    // this function will be executed inside phantomjs js-vm, so it mustn't depends on any entities from outer scope
    function addLogging() {
        window.document.addEventListener('DOMContentLoaded', function () {
            var currentTestAssertions = [];

            QUnit.log(function (details) {
                var response;

                // Ignore passing assertions
                if (details.result) {
                    return;
                }

                response = details.message || '';

                if (typeof details.expected !== 'undefined') {
                    if (response) {
                        response += ', ';
                    }

                    response += 'expected: ' + details.expected + ', but was: ' + details.actual;
                }

                if (details.source) {
                    response += '\n' + details.source;
                }

                currentTestAssertions.push('Failed assertion: ' + response);
            });

            QUnit.testDone(function (result) {
                var i,
                    len,
                    name = '';

                if (result.module) {
                    name += result.module + ': ';
                }
                name += result.name;

                text = '';
                if (result.failed) {
                    text += '\n' + 'Test failed: ' + name;

                    for (i = 0, len = currentTestAssertions.length; i < len; i++) {
                        text += '\t' + currentTestAssertions[i];
                    }
                    console.log(text);
                }

                currentTestAssertions.length = 0;
            });

            QUnit.done(function (result) {
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
            timeout = 5;
        }

        // Set a timeout on the test running, otherwise tests with async problems will hang forever
        abortTimer = setTimeout(function () {
            console.error('The specified timeout of ' + timeout + ' seconds has expired while running tests on ' + getSuitName(url));
            exit(1);
        }, timeout * 1000);

        page.open(url, pageHandler.bind(this));
    }

    function exit(code) {
        if (page) {
            page.close();
        }
        setTimeout(function () {
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
            var qunitMissing = page.evaluate(function () {
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

        if (message) {
            if (message.name === 'QUnit.done') {
                result = message.data;
                failed = !result || !result.total || result.failed;

                if (!result.total) {
                    console.error('No tests were executed. Are you loading tests asynchronously?');
                }

                if (args.length === 0) {
                    exit(0);
                }

                clearTimeout(abortTimer);
                // open next page with test suite
                open(args.shift())
            }
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

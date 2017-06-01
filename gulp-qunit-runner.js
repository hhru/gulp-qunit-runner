'use strict';

var path = require('path');
var childProcess = require('child_process');
var gutil = require('gulp-util');
var phantomjs = require('phantomjs-prebuilt');
var binPath = phantomjs.path;
var EventEmitter = require('events');
var readline = require('readline');


module.exports = function(testPaths, params) {
    var options = params || {};
    var emitter = new EventEmitter();
    var hasError = false;
    var childArgs = [];

    binPath = options.binPath || binPath;

    if (options.phantomjsOptions && options.phantomjsOptions.length) {
        childArgs.push(options.phantomjsOptions);
    }

    childArgs.push(require.resolve('./runner'));

    if (options.suitTimeoutSeconds) {
        childArgs.push(options.suitTimeoutSeconds);
    }

    childArgs = childArgs.concat(testPaths);

    var phantom = childProcess.execFile(binPath, childArgs);

    readline.createInterface({
        input: phantom.stdout,
        output: null
    }).on('line', function(result) {
        emitter.emit('gulp-qunit-result', result);
    });

    readline.createInterface({
        input: phantom.stderr,
        output: null
    }).on('line', function(result) {
        hasError = true;
        emitter.emit('error', result);
    });

    phantom.on('close', function() {
        if (!hasError) {
            emitter.emit('close');
        }
    })

    return emitter;
};

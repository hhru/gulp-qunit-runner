'use strict';

var path = require('path');
var childProcess = require('child_process');
var gutil = require('gulp-util');
var chalk = require('chalk');
var through = require('through2');
var phantomjs = require('phantomjs-prebuilt');
var binPath = phantomjs.path;
var EventEmitter = require('events');
var spawn = require('child_process').spawn;
var readline = require('readline');


module.exports = function(testPaths, params) {
    var options = params || {};
    binPath = options.binPath || binPath;
    var emitter = new EventEmitter();

    var childArgs = [];

    if (options['phantomjs-options'] && options['phantomjs-options'].length) {
        childArgs.push(options['phantomjs-options']);
    }

    childArgs.push(require.resolve('./runner'));

    if (options.timeout) {
        childArgs.push(options.timeout);
    }

    childArgs = childArgs.concat(testPaths);
    var phantom = childProcess.execFile(binPath, childArgs);
    var currentFile = '';

    readline.createInterface({
        input: phantom.stdout,
        output: null
    }).on('line', function(result) {
        emitter.emit('gulp-qunit-result', null, result);
    });

    readline.createInterface({
        input: phantom.stderr,
        output: null
    }).on('line', function(data) {
        emitter.emit('error', new gutil.PluginError('gulp-qunit', data.toString()));
    });

    phantom.on('close', function() {
        emitter.emit('close');
    })

    return emitter;
};

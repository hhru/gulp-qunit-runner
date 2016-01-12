'use strict';

var path = require('path');
var childProcess = require('child_process');
var gutil = require('gulp-util');
var chalk = require('chalk');
var through = require('through2');
var phantomjs = require('phantomjs');
var binPath = phantomjs.path;

module.exports = function(params) {
    var options = params || {};

    binPath = options.binPath || binPath;

    return through.obj(function(file, enc, cb) {
        var absolutePath = path.resolve(file.path);
        var isAbsolutePath = absolutePath.indexOf(file.path) >= 0;
        var childArgs = [];

        if (options['phantomjs-options'] && options['phantomjs-options'].length) {
            childArgs.push(options['phantomjs-options']);
        }

        childArgs.push(
            require.resolve('qunit-phantomjs-runner'),
            (isAbsolutePath ? 'file:///' + absolutePath.replace(/\\/g, '/') : file.path)
        );

        if (options.timeout) {
            childArgs.push(options.timeout);
        }

        if (file.isStream()) {
            this.emit('error', new gutil.PluginError('gulp-qunit', 'Streaming not supported'));
            return cb();
        }

        childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {

            if (stderr) {
                gutil.log(stderr);
                this.emit('error', new gutil.PluginError('gulp-qunit', stderr));
            }

            this.emit('gulp-qunit-result', err, stdout, file);
            if (err) {
                this.emit('error', new gutil.PluginError('gulp-qunit-runner', err));
            }

            this.push(file);

            return cb();

        }.bind(this));
    });
};

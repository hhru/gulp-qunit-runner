const path = require('path');
const childProcess = require('child_process');
const gutil = require('gulp-util');
const phantomjs = require('phantomjs-prebuilt');
const EventEmitter = require('events');
const readline = require('readline');
let binPath = phantomjs.path;
const runnerPath = require.resolve('./runner');

const KILOBYTE = 1024;
const DEFAULT_BUFFER_SIZE = 200;

module.exports = function(testPaths, params = {}) {
    const emitter = new EventEmitter();
    const childArgs = [];

    binPath = params.binPath || binPath;

    if (params.phantomjsOptions && params.phantomjsOptions.length) {
        childArgs.push(params.phantomjsOptions);
    }

    childArgs.push(runnerPath);

    if (params.suitTimeoutSeconds) {
        childArgs.push(params.suitTimeoutSeconds);
    }

    const phantom = childProcess.execFile(
        binPath, 
        childArgs.concat(testPaths), 
        {maxBuffer: KILOBYTE * params.bufferSizeInKB || DEFAULT_BUFFER_SIZE}, 
        (error, stdout, stderr) => {
            if (error) {                        
                emitter.emit('error', error);
            }        
        }
    );

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
        emitter.emit('error', result);
    });

    phantom.on('close', function() {        
        emitter.emit('close');
    });    

    return emitter;
};


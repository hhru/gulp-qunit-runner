var gutil = require('gulp-util');
var chalk = require('chalk');

module.exports = function(result) {
    'use strict';

    var passed = true;
    var out;
    var stats;
    var color;

    if (result) {
        try {
            if (result.indexOf('{') !== -1) {
                out = JSON.parse(result);

                stats = out.data.stats;

                color = stats.failures > 0 ? chalk.red : chalk.green;

                gutil.log('Took ' + stats.duration + ' ms to run ' + chalk.blue(stats.tests) + ' tests. ' + color(stats.passes + ' passed, ' + stats.failures + ' failed.'));

                if (stats.failures > 0) {
                    gutil.log('gulp-qunit: ' + chalk.red('✖ ') + 'QUnit assertions failed in ' + chalk.blue(out.file));
                } else {
                    gutil.log('gulp-qunit: ' + chalk.green('✔ ') + 'QUnit assertions all passed in ' + chalk.blue(out.file));
                }

                if (out.data.failures) {
                    out.data.failures.forEach(function(item) {
                        gutil.log(chalk.red('Test failed') + ': ' + chalk.red(item.fullTitle) + ': \n' + item.error);
                    });
                }
            }
        } catch (e) {
            gutil.log(chalk.red(e));
        }
    }
};

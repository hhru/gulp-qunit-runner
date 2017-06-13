const gutil = require('gulp-util');
const chalk = require('chalk');

module.exports = function(result, verbose) {
    if (!result || !result.includes('{')) {
        return
    }

    try {
        const out = JSON.parse(result);
        if (out.data.assertsFailed) {
            gutil.log(`${chalk.red('✖')} QUnit assertions failed in ${chalk.blue(out.file)}`);
            gutil.log(`${chalk.red(out.data.assertsFailed)}`);

            return;
        }

        if (!verbose) {
            // if we are not in verbose mode then no further logging is needed
            return;
        }

        const stats = out.data.stats;
        const color = stats.failures > 0 ? chalk.red : chalk.green;

        if (stats.failures === 0) {
            gutil.log(`${chalk.green('✔ ')} QUnit assertions all passed in ${chalk.blue(out.file)}`);
        }

        gutil.log(`Took ${stats.duration} ms to run ${chalk.blue(stats.tests)} tests. ${color(stats.passes)} passed, ${stats.failures} failed.\n`);
    } catch (e) {
        gutil.log(chalk.red(e));
    }
};

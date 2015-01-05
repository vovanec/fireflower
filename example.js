/**
 * Created by vovan on 1/4/15.
 */

/**
 * Created by vovan on 1/4/15.
 */

'use strict';

(function () {

    var log4js = require('log4js'),
        fireflower = require('./fireflower');

    log4js.setGlobalLogLevel(log4js.levels.DEBUG);

    fireflower.runServer({
        init: function () {
            this.log.info('Master process is up and running');
        },
        onStop: function () {
            this.log.info('Master process is stopped.');
        },
        log: log4js.getLogger('master')
    }, {
        init: function () {
            this.log.info('Worker process with PID %s is up and running',
                process.pid);
        },
        onStop: function () {
            this.log.info('Worker process with PID %s is stopped.',
                process.pid);
        },
        log: log4js.getLogger('worker-' + process.pid)
    }, 2);
}());

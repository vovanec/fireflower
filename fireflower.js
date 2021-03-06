/* Copyright (c) 2015 year, Volodymyr Kuznetsov

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE. */

'use strict';

var cluster = require('cluster'),
    os = require('os'),
    _ = require('underscore');


var DEF_NUM_WORKERS = os.cpus().length;
var DEF_WORKER_RESTART_DELAY = 1000;

var DEFAULT_LOGGER = {
    trace: console.log.bind(console),
    debug: console.log.bind(console),
    info:  console.log.bind(console),
    warn:  console.log.bind(console),
    error: console.log.bind(console)
};


var master = function (ctx, numWorkers, workerRestartDelay) {

    var log = ctx.log || DEFAULT_LOGGER;

    log.info('Master process is coming up.');

    if (_.isFunction(ctx.init)) {
        ctx.init({numWorkers: numWorkers,
                  workerRestartDelay: workerRestartDelay});
    }

    cluster.on('online', function (worker) {
        log.debug('Worker with PID %s is online.', worker.process.pid);
    }).on('exit', function (worker, code, signal) {
        log.debug('Worker with PID %s exited with code %s on signal %s.',
            worker.process.pid, code, signal);
        if (!worker.suicide) {
            var restartDelay = workerRestartDelay + _.random(-workerRestartDelay / 2,
                    workerRestartDelay / 2);
            log.debug('Will restart in %s ms', restartDelay);
            setTimeout(function () {
                log.info('Starting the new one worker.');
                cluster.fork();
            }, restartDelay);

        }
    }).on('disconnect', function (worker) {
        log.info('The worker with PID %s is disconnected.',
            worker.process.pid);
    });

    function eachWorker(cb) {
        var id;
        for (id in cluster.workers) {
            if (cluster.workers.hasOwnProperty(id)) {
                cb(cluster.workers[id]);
            }
        }
    }

    var onSignal = function (signum) {
        log.info('Received signal %s. Exiting...', signum);

        eachWorker(function (worker) {
            log.info('Killing worker %s.', worker.process.pid);
            worker.kill('SIGTERM');
        });

        if (_.isFunction(ctx.onStop)) {
            ctx.onStop();
        }

        process.exit(0);
    };

    _(['SIGINT', 'SIGTERM', 'SIGQUIT']).each(function (signum) {
        process.on(signum, onSignal.bind(null, signum));
    });

    _.times(numWorkers, function () {
        cluster.fork();
    });
};


var worker = function (ctx) {

    var log = ctx.log || DEFAULT_LOGGER;

    log.info('Worker with PID %s is coming up.', process.pid);

    if (_.isFunction(ctx.init)) {
        ctx.init();
    }

    var onSignal = function (signum) {
        log.info('Received signal %s Exiting.', signum);

        if (_.isFunction(ctx.onStop)) {
            ctx.onStop();
        }

        process.exit(0);
    };

    _(['SIGTERM', 'SIGQUIT']).each(function (signum) {
        process.on(signum, onSignal.bind(null, signum));
    });

    process.on('SIGINT', _.noop);
};


exports.runServer = function (masterCtx, workerCtx, numWorkers, workerRestartDelay) {

    if (cluster.isMaster) {
        master(masterCtx, numWorkers || DEF_NUM_WORKERS,
               workerRestartDelay || DEF_WORKER_RESTART_DELAY);
    } else {
        worker(workerCtx);
    }
};
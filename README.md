## Multinode

Simple multi-worker framework. Built as a wrapper around standard cluster module.
Example usage:

```javascript

    var log4js = require('log4js'),
        fireflower = require('fireflower');

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
```

Will produce the following output:

    bash-3.2$ node example.js
    [2015-01-04 21:45:17.935] [INFO] master - Master process is coming up.
    [2015-01-04 21:45:17.938] [INFO] master - Master process is up and running
    [2015-01-04 21:45:17.971] [DEBUG] master - Worker with PID 18288 is online.
    [2015-01-04 21:45:17.975] [DEBUG] master - Worker with PID 18289 is online.
    [2015-01-04 21:45:17.992] [INFO] worker-18288 - Worker with PID 18288 is coming up.
    [2015-01-04 21:45:17.995] [INFO] worker-18288 - Worker process with PID 18288 is up and running
    [2015-01-04 21:45:17.997] [INFO] worker-18289 - Worker with PID 18289 is coming up.
    [2015-01-04 21:45:18.000] [INFO] worker-18289 - Worker process with PID 18289 is up and running

    ^C[2015-01-04 21:45:24.900] [INFO] master - Received signal SIGINT. Exiting...
    [2015-01-04 21:45:24.900] [INFO] master - Killing worker 18288.
    [2015-01-04 21:45:24.901] [INFO] master - The worker with PID 18288 is disconnected.
    [2015-01-04 21:45:24.902] [INFO] master - Killing worker 18289.
    [2015-01-04 21:45:24.902] [INFO] master - The worker with PID 18289 is disconnected.
    [2015-01-04 21:45:24.902] [INFO] master - Master process is stopped.

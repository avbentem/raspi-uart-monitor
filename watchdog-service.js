/**
 * Configures one or more watchdogs and delegates heartbeats and messages to each one of them.
 */

'use strict';

const Watchdog = require('./watchdog');

class WatchdogService {

    constructor(config, logger) {
        this.watchdogs = config.map(c => new Watchdog(c, logger));
    }

    heartbeat() {
        this.watchdogs.forEach(w => w.heartbeat());
    }

    message(msg) {
        this.watchdogs.forEach(w => w.message(msg));
    }

}

module.exports = WatchdogService;

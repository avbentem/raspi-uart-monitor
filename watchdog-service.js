/**
 * Checks every second if a heartbeat was registered within some configured timeout, and if not, logs an error. Also
 * repeats this error every now and then as long as the problem is not resolved, and logs a warning when things are
 * okay again.
 */

'use strict';

class WatchdogService {

    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.lastHeartbeat = null;
        this.firstWatchdogError = null;
        this.lastWatchdogError = null;

        if (config && config.timeout) {
            this.heartbeat();
            setInterval(() => this._check(), 1000);
        }
        else {
            this.logger.warn('No watchdog timeout in configuration; not enabling watchdog');
        }
    }

    heartbeat() {
        this.lastHeartbeat = Date.now();
        this._check();
    }

    _check() {
        const now = Date.now();

        if ((now - this.lastHeartbeat) > this.config.timeout) {
            if (this.lastWatchdogError && (now - this.lastWatchdogError) < this.config.repeat) {
                // Don't flood the logs with the same error
                return;
            }
            this.logger.error('No UART message since ' + (new Date(this.lastHeartbeat)).toISOString());
            if (!this.firstWatchdogError) {
                this.firstWatchdogError = this.lastHeartbeat;
            }
            this.lastWatchdogError = now;
            return;
        }

        // All fine (again)
        if (this.firstWatchdogError) {
            this.logger.warn('First UART message since ' + (new Date(this.firstWatchdogError)).toISOString());
            this.firstWatchdogError = this.lastWatchdogError = null;
        }
    }

}

module.exports = WatchdogService;

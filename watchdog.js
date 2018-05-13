/**
 * Checks every second if a generic heartbeat or specific message was registered within some configured timeout, and if
 * not, logs an error. Also repeats this error every now and then as long as the problem is not resolved, and logs a
 * warning when things are okay again.
 */

'use strict';

class Watchdog {

    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.lastHeartbeat = null;
        this.firstWatchdogError = null;
        this.lastWatchdogError = null;

        if (config && config.timeout) {
            this.lastHeartbeat = Date.now();
            setInterval(() => this._check(), 1000);
        }
        else {
            this.logger.warn('No watchdog timeout in configuration; not enabling watchdog ' + this.config.name);
        }
    }

    /**
     * Registers a plain heartbeat, if no patterns have been configured to match specific messages.
     *
     * If patterns have been configured then this is ignored and {@link Watchdog.message} is handled instead.
     */
    heartbeat() {
        if (!this.config.include) {
            this.lastHeartbeat = Date.now();
        }
    }

    /**
     * Registers a heartbeat if the given message matches at least one of the configured patterns (and is not
     * explicitly excluded).
     *
     * If no patterns have been configured then this is ignored, and {@link Watchdog#heartbeat} is handled instead.
     *
     * @param msg The message to compare against the configured patterns, if any.
     */
    message(msg) {
        if (!this.config.include) {
            return;
        }
        if (this.config.include.some(p => p.test(msg)) && !(this.config.exclude || []).some(p => p.test(msg))) {
            this.lastHeartbeat = Date.now();
        }
    }

    _check() {
        const now = Date.now();

        if ((now - this.lastHeartbeat) > this.config.timeout) {
            if (this.lastWatchdogError && (now - this.lastWatchdogError) < this.config.repeat) {
                // Don't flood the logs with the same error
                return;
            }
            this.logger.error('No ' + this.config.name + ' since ' + (new Date(this.lastHeartbeat)).toISOString());
            if (!this.firstWatchdogError) {
                this.firstWatchdogError = this.lastHeartbeat;
            }
            this.lastWatchdogError = now;
            return;
        }

        // All fine (again)
        if (this.firstWatchdogError) {
            this.logger.warn('First ' + this.config.name + ' since ' + (new Date(this.firstWatchdogError)).toISOString());
            this.firstWatchdogError = this.lastWatchdogError = null;
        }
    }

}

module.exports = Watchdog;

/**
 * Configures one or more counters for regular expressions, and reports the collected statistics at the configured
 * interval.
 */

'use strict';

class Reporter {

    constructor(reports, schedule, logger) {
        this.reports = reports;
        this.schedule = schedule;
        this.logger = logger;
        this.lastRun = Date.now();
        this.counts = {};

        if (schedule.interval) {
            // The first run might use an interval that is a lot smaller than the configured interval; see below
            this._schedule();
        }
        else {
            this.logger.warn('No reporting interval in configuration; not enabling reporter ' + schedule.name);
        }
    }

    /**
     * Compares the given message to the known regular expressions, and increases the report's counter if matched.
     *
     * @param msg The message to compare against the configured patterns
     */
    message(msg) {
        this.reports.forEach(report => {
            if (report.include.some(p => p.test(msg)) && !(report.exclude || []).some(p => p.test(msg))) {
                this.counts[report.name] = (this.counts[report.name] || 0) + 1;
            }
        });
    }

    /**
     * Schedules the next report.
     *
     * @private
     */
    _schedule() {
        setTimeout(() => this._report(), this._minimizeInterval(this.schedule.interval));
    }

    /**
     * Decreases the given `interval` to match the last possible time that coincides with the unit of the given
     * interval, if any.
     *
     * Like if the interval is an exact number of days, this yields the milliseconds until some next day (local time),
     * and when called just before midnight the returned interval might be quite small. Likewise this detects multiples
     * of hours, 30 minutes, 15 minutes, 10 minutes, 5 minutes, 1 minute, 30 seconds, 15 seconds, 10 seconds, 5 seconds
     * and a single second. If no unit is detected, this just returns the given interval. But as, e.g., 11 minutes will
     * be matched as a multiple of 1 minute, and 62 seconds as a multiple of 1 second, such will only happen when
     * explicitly passing an interval that cannot be rounded to a second.
     *
     * @param interval the maximum number of milliseconds until the expected time
     * @private
     */
    _minimizeInterval(interval) {
        const unit = [24 * 3600, 3600, 30 * 60, 15 * 60, 10 * 60, 5 * 60, 60, 30, 15, 10, 5, 1].find(s => interval % (s * 1000) === 0) * 1000;
        if (!unit) {
            return interval;
        }
        const utc = new Date();
        // Ensure daily reports start at midnight in the local timezone
        const now = utc.getTime() - (utc.getTimezoneOffset() * 60 * 1000);
        const next = Math.floor((now + interval) / unit) * unit;
        return next - now;
    }

    /**
     * Reports the collected statistics at the configured log level, and schedules a new report.
     *
     * @private
     */
    _report() {
        const msg = this.schedule.name + ' since ' + (new Date(this.lastRun)).toISOString()
            + ':\n'
            + this.reports.map(report => '\u2022 ' + report.name + ": " + (this.counts[report.name] || 0)).join('\n');

        this.logger.log(this.schedule.level || 'info', msg);

        this.lastRun = Date.now();
        this.counts = {};
        this._schedule();
    }

}

module.exports = Reporter;

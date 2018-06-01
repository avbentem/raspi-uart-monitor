/**
 * Configures one or more reporters, each with one or more schedules, and delegates messages to each one of them.
 */

'use strict';

const Reporter = require('./reporter');

class ReportingService {

    constructor(config, logger) {
        this.reporters = [];
        config.forEach(reporter => {
            // In case of multiple schedules: duplicate each reporter for each schedule
            reporter.schedules.forEach(schedule => this.reporters.push(new Reporter(reporter.reports, schedule, logger)));
        });
    }

    message(msg) {
        this.reporters.forEach(reporter => reporter.message(msg));
    }

}

module.exports = ReportingService;

/**
 * Saves messages to rotating log files.
 *
 * This uses the Winston logger's [winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file),
 * which works great but is [not very tail-friendly](https://github.com/winstonjs/winston-daily-rotate-file/issues/23):
 * whenever the files are rotated, the current file gets a new name too. Consider using some external logrotate if
 * that's an issue.
 */

'use strict';

const Logger = require('winston').Logger;
const DailyRotateFile = require('winston-daily-rotate-file');

class LogService {

    constructor(fileConfig) {
        this.logger = new Logger();

        Object.keys(fileConfig).forEach(name => {
            const config = fileConfig[name];
            this.logger.add(DailyRotateFile, {
                name: name,
                level: config.level,
                filename: config.filename,
                dirname: config.dirname,
                datePattern: config.datePattern || 'yyyyMMdd',
                zippedArchive: typeof config.zippedArchive !== 'undefined' ? config.zippedArchive : true,
                json: false,
                formatter: config.formatter || LogService._formatter
            });
        });

        this.logger.on('error', err => {
            console.error('Error while trying to save to log file', err);
        });
    }

    /**
     * Winston formatter used for the log file(s). This does not log the message level (which is only used to determine
     * in which file a message should be logged, and if it should trigger a notification on Slack and/or Telegram).
     */
    static _formatter(options) {
        return `[${ (new Date()).toISOString() }] ${ options.message }`;
    }

    log(level, msg) {
        this.logger.log(level, msg,
            (err, level, msg, meta) => {
                // When the message is not included due to its level, all parameters will be null.
                if (err) {
                    console.error(`Error while sending notification; err: ${err}; level: ${level}; msg: ${msg}; meta: ${meta}`);
                }
            })
    }

    debug(msg) {
        this.log('debug', msg);
    }

    info(msg) {
        this.log('info', msg);
    }

    warn(msg) {
        this.log('warn', msg);
    }

    error(msg) {
        this.log('error', msg);
    }

}

module.exports = LogService;

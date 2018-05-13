/**
 * Sends messages to Slack or Telegram, if configured for the message's log level, prefixing each message with an icon
 * matching its log level.
 *
 * This assumes notifications just work. If we can get proper errors below, we could buffer (or at least count) failed
 * notifications, but that has not been implemented; see the error handlers in the code below.
 */

'use strict';

const Logger = require('winston').Logger;
const WinstonSlack = require('slack-winston').Slack;
const WinstonTelegram = require('winston-telegram').Telegram;

/**
 * Icons to be prefixed to the Slack and Telegram messages.
 */
const icons = {
    // Telegram does not support codes such as `:warning:`, so use Unicode; see https://www.fileformat.info/info/emoji
    error: '\u274C ',
    warn: '\u26A0 ',
    info: '\u2139 '
};

class NotificationService {

    constructor(config) {
        if (!config) {
            return;
        }

        this.logger = new Logger();

        if (config.slack) {
            // For slack-winston, the metadata is passed to a Lodash template as a JSON string
            config.slack.message = '{{ JSON.parse(meta).icon }}{{message}}';
            this.logger.add(WinstonSlack, config.slack);
        }

        if (config.telegram) {
            // winston-telegram uses a basic string formatter (or a custom function in `formatMessage`)
            config.telegram.template = '{metadata.icon}{message}';
            this.logger.add(WinstonTelegram, config.telegram);
        }

        this.logger.on('error', err => {
            // It seems this is not invoked when Slack or Telegram fails (like due to invalid tokens)? Not tested with
            // a failing network connection.
            console.error(`Error while sending notification; err: ${err}`);
        });
    }

    /**
     * Enhances the message with meta data to specify an icon which is used in the logger's template/formatter above,
     * and passes the message to the Winston logger(s), if any.
     */
    log(level, msg) {
        if (!this.logger) {
            return;
        }
        this.logger.log(level, msg,
            {
                icon: icons[level]
            },
            (err, level, msg, meta) => {
                // When the message is not included due to its level, all parameters will be null.
                if (err) {
                    // When using an invalid configuration, this is only called when Slack fails, but not when Telegram
                    // fails? Not tested with a failing network connection.
                    console.error(`Error while sending notification; err: ${err}; level: ${level}; msg: ${msg}; meta: ${meta}`);
                }
            }
        );
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

module.exports = NotificationService;

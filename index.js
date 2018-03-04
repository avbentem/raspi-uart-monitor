/**
 * Monitors a Raspberry Pi UART, combining the stream of received bytes into single-line messages, determining a log
 * level based on regular expressions, saving the messages to rotating log files while prefixing each message with a
 * timestamp, and optionally sending notifications to Slack and/or Telegram for some minimum log level or when the UART
 * has been inactive for too long.
 */

'use strict';

const raspi = require('raspi');
const Serial = require('raspi-serial').Serial;
const NotificationService = require('./notification-service');
const LogService = require('./log-service');
const WatchdogService = require('./watchdog-service');

const config = require('./config');

const logService = new LogService(config.logfiles);
logService.warn('[monitor] Starting UART monitor');

const notificationService = new NotificationService(config.notifications);
notificationService.warn('Starting UART monitor');

// The watchdog only sends notifications to Telegram and/or Slack, if configured
const watchdogService = new WatchdogService(config.watchdog, notificationService);

/**
 * Gets (guesses) a log level based on the message's text, using the regular expressions from the configuration.
 */
function getLevel(msg) {
    return Object.keys(config.levels).find(level => {
            return config.levels[level].include.some(p => p.test(msg)) && !config.levels[level].exclude.some(p => p.test(msg))
        }
    ) || 'debug';
}

let buffer = '';

/**
 * Combines series of bytes into single-line messages, guesses a log level, and passes the messages to the file logger
 * and notification services.
 */
function log(data) {
    // To debug the raw stream, don't use `console.log` as that will output newlines, even when logging a partial line.
    // Instead, use `stdout` to output only the newlines that the UART receives: process.stdout.write(data);
    buffer += data.toString();
    if (buffer.indexOf('\n') > -1) {
        const lines = buffer.split('\n');
        // Log whatever complete lines are in the buffer, so: up to the last newline
        for (let i = 0; i < lines.length - 1; i++) {
            const msg = lines[i];
            const level = getLevel(msg);
            logService.log(level, msg);
            notificationService.log(level, msg);
        }
        // The message following the last newline might not be complete yet; handle at a later time
        buffer = lines[lines.length - 1];
    }
}

raspi.init(() => {
    const serial = new Serial(config.serial);
    serial.open(() => {
        serial.on('data', data => {
            watchdogService.heartbeat();
            log(data);
        });
    });
});

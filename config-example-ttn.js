/**
 * Example configuration for the Raspberry Pi UART monitor, to monitor output of a The Things Network LoRaWAN Gateway.
 *
 * See https://www.thethingsnetwork.org/forum/t/ttn-gateway-faq/11173 for the UART connector; note that the pin marked
 * `RX` is actually _transmitting_ its serial data, so should indeed be connected to the Raspberry Pi's `RXD` which
 * is properly labeled for _receiving_ data.
 */

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;

module.exports = {

    // See README.md and https://github.com/nebrius/raspi-serial#new-serialoptions
    serial: {
        portId: '/dev/ttyAMA0',
        baudRate: 115200
    },

    // Regular expressions to determine the log level, defaulting to DEBUG. The `i` denotes case-insensitive matching.
    levels: {
        error: {
            include: [/error/i, /failed/i, /firmware name/i, /reboot/i],
            exclude: [/report .* error/i, /error sending probe/i]
        },
        warn: {
            include: [/configuration/i, /gateway bridging/i, /no ethernet and wifi/i, /trying to connect/i, /connected/i, /report .* error/i],
            exclude: []
        },
        info: {
            include: [/./],
            exclude: [/^MON:/]
        }
    },

    logfiles: {
        // File to which all messages are saved, so also including INFO, WARN and ERROR, using the default formatter
        // which only prefixes a timestamp. Useful for bug reports.
        debug: {
            level: 'debug',
            // The directory defaults to the current folder, and can be specified in either `filename` or in `dirname`
            filename: 'uart-monitor-all-%DATE%.log',
            datePattern: 'yyyyMMdd'
            // Archives are compressed by default
            // zippedArchive: false
        },

        // Optional file to which only messages of levels INFO and above are saved, using a custom formatter that also
        // includes the message level.
        info: {
            level: 'info',
            filename: 'uart-monitor-info-%DATE%.log',
            datePattern: 'yyyyMMdd',
            formatter: options => `[${ (new Date()).toISOString() }] [${ options.level }] ${ options.message }`
        },

        // Optional file to which only error messages of levels WARN and above are saved.
        warn: {
            level: 'warn',
            filename: 'uart-monitor-warn-%DATE%.log',
            datePattern: 'yyyyMMdd'
        },

    },

    // notifications: {
    //
    //     // Optional configuration to post messages to a Slack channel; see README.md and https://www.npmjs.com/package/slack-winston
    //     slack: {
    //         level: 'warn',
    //         // The subdomain, like `myworkspace` for `myworkspace.slack.com`
    //         domain: 'mydomain',
    //         // It seems the Slack token is not currently used by the Winston transport; the webhook suffices
    //         token: 'xoxp-000000000000-111111111111-222222222222-1234567890abcdef1234567890abcdef',
    //         webhook_url: 'https://hooks.slack.com/services/AAAAAAAAA/BBBBBBBBB/CCCCCCCCCCCCCCCCCCCCCCCC',
    //         channel: 'gateway'
    //     },
    //
    //     // Optional configuration to post messages to a Telegram chat; see README.md and https://www.npmjs.com/package/winston-telegram
    //     telegram: {
    //         level: 'warn',
    //         token: '000000000:AAAAAAAAAAAAAAAAAAAAAAAAAAA__BBBBBB',
    //         // For a group chat this seems to be a negative value
    //         chatId: -12345
    //     }
    // },

    watchdogs: [
        {
            // No include/exclude patterns, hence the pure heartbeat watchdog that is satisfied for any UART byte
            name: 'UART data',
            // Timeout in milliseconds in which at least one UART byte is expected
            timeout: 10 * SECONDS,
            // Time in milliseconds during which to suppress repeated watchdog messages
            repeat: 30 * MINUTES
        },
        {
            // Specific include/exclude patterns, hence a watchdog that is satisfied if AT LEAST ONE of the patterns is
            // matched for a FULL line from the UART. To independently monitor multiple types of messages one should
            // configure multiple watchdogs, instead of listing multiple patterns within a single watchdog.
            name: 'LoRaWAN uplink',
            include: [/sending uplink ok/i],
            exclude: [],
            timeout: 15 * MINUTES,
            repeat: 2 * HOURS
        },
        {
            // The TTN Gateway sends a status message every 30 seconds, but booting might take a bit longer
            name: 'gateway status',
            include: [/sending status succeeded/i],
            exclude: [],
            timeout: 5 * MINUTES,
            repeat: 2 * HOURS
        },
        {
            // The TTN Gateway reboots for a firmware upgrade once per day
            name: 'daily firmware upgrade',
            include: [/rebooting gateway for firmware update check/i],
            exclude: [],
            timeout: 25 * HOURS,
            repeat: 12 * HOURS
        }
    ]

};

/**
 * Example configuration for the Raspberry Pi UART monitor, to monitor output of a The Things Network LoRaWAN Gateway.
 *
 * See https://www.thethingsnetwork.org/forum/t/ttn-gateway-faq/11173 for the UART connector; note that the pin marked
 * `RX` is actually _transmitting_ its serial data, so should indeed be connected to the Raspberry Pi's `RXD` which
 * is properly labeled for _receiving_ data.
 */
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
            filename: './uart-monitor-all-',
            datePattern: 'yyyyMMdd.log'
        },

        // Optional file to which only messages of levels INFO and above are saved, using a custom formatter that also
        // includes the message level.
        info: {
            level: 'info',
            filename: './uart-monitor-info-',
            datePattern: 'yyyyMMdd.log',
            formatter: options => `[${ (new Date()).toISOString() }] [${ options.level }] ${ options.message }`
        },

        // Optional file to which only error messages of levels WARN and above are saved.
        warn: {
            level: 'warn',
            filename: './uart-monitor-warn-',
            datePattern: 'yyyyMMdd.log'
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

    watchdog: {
        // Timeout in milliseconds in which at least one UART byte is expected
        timeout: 10 * 1000,
        // Time in milliseconds during which to suppress repeated watchdog messages
        repeat: 60 * 60 * 1000
    }

};

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
            // See http://momentjs.com/docs/#/displaying/format/
            datePattern: 'YYYYMMDD'
            // Archives are compressed by default
            // zippedArchive: false
        },

        // Optional file to which only messages of levels INFO and above are saved, using a custom formatter that also
        // includes the message level.
        info: {
            level: 'info',
            filename: 'uart-monitor-info-%DATE%.log',
            datePattern: 'YYYYMMDD',
            formatter: options => `[${ (new Date()).toISOString() }] [${ options.level }] ${ options.message }`
        },

        // Optional file to which only error messages of levels WARN and above are saved.
        warn: {
            level: 'warn',
            filename: 'uart-monitor-warn-%DATE%.log',
            datePattern: 'YYYYMMDD'
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

    // Optional watchdogs, only reported to Slack and/or Telegram.
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
            // MQTT: Sending UPLINK OK
            include: [/sending uplink ok/i],
            exclude: [],
            timeout: 15 * MINUTES,
            repeat: 2 * HOURS
        },
        {
            // The TTN Gateway sends a status message every 30 seconds, but booting might take a bit longer
            name: 'gateway status',
            // MQTT: Sending status succeeded
            include: [/sending status succeeded/i],
            exclude: [],
            timeout: 5 * MINUTES,
            repeat: 2 * HOURS
        },
        {
            // The TTN Gateway reboots for a firmware upgrade once per day
            name: 'daily firmware upgrade',
            // MAIN: Rebooting gateway for firmware update check
            include: [/firmware update/i],
            exclude: [],
            timeout: 25 * HOURS,
            repeat: 12 * HOURS
        }
    ],

    // Optional reporters, only sending notifications to Slack and/or Telegram.
    reporters: [
        {
            // One can define multiple schedules, where each will keep track of its own counts for its interval.
            schedules: [
                // Enable for quick testing:
                // {
                //     name: '5 minutes report',
                //     interval: 5 * MINUTES,
                //     level: 'warn'
                // },
                {
                    name: 'Hourly gateway report',
                    // The interval for which to collect and report the statistics. The very first report might use a
                    // smaller interval, as the monitor runs the reporting at recognizable times. Like if the interval
                    // is an exact number of days, the first report is sent to Slack and/or Telegram around midnight
                    // (LOCAL TIME), no matter when the monitor was started. Likewise this detects multiples of hours,
                    // 30 minutes, 15 minutes, 10 minutes, 5 minutes, 1 minute, 30 seconds, 15 seconds, 10 seconds,
                    // 5 seconds and a single second.
                    interval: 60 * MINUTES,
                    // The log level at which to report the statistics, matched against the minimum level for Slack and
                    // Telegram. Here: Slack only.
                    level: 'warn'
                },
                {
                    name: 'Daily gateway report',
                    interval: 24 * HOURS,
                    // Both Slack and Telegram
                    level: 'error'
                }
            ],
            reports: [
                {
                    name: 'dropped LoRa packets',
                    // LORA: Packet dropped! Bad CRC
                    include: [/LORA: Packet dropped/i],
                    exclude: []
                },
                {
                    name: 'accepted LoRa packets',
                    include: [/LORA: Accepted packet/i],
                    exclude: []
                },
                {
                    name: 'forwarded LoRa uplinks',
                    include: [/MQTT: Sending UPLINK OK/i],
                    exclude: []
                },
                {
                    name: 'received LoRa downlinks',
                    include: [/MQTT: Received DOWNLINK/i],
                    exclude: []
                },
                {
                    name: 'status packets',
                    include: [/MQTT: Sending status packet/i],
                    // MQTT: Sending status succeeded: 11
                    exclude: [/MQTT: Sending status succeeded/]
                },
                {
                    name: 'MQTT errors',
                    // MQTT: Connection failed
                    // MQTT: Sending status failed
                    // MQTT: Sending UPLINK failed: -1
                    // ...all followed by:
                    // MAIN: MQTT error
                    include: [/MQTT.* error/i],
                    // MQTT: Report reboot error: 0110
                    exclude: [/report .* error/i]
                },
                {
                    name: 'network errors',
                    // INET: Connected to a network, waiting for DHCP lease, checking validity with ping
                    // INET: Trying to connect to WiFi router again (after 120 seconds)
                    // INET: No Ethernet and WiFi link (after 10 seconds)
                    include: [/INET: No Ethernet and WiFi link/i],
                    // INET: Error sending probe on Eth
                    // INET: Error sending probe on WiFi
                    exclude: [/INET: Error sending probe/]
                },
                {
                    name: 'reboots',
                    // *** Application reboot
                    // Reboot reason: 0x10
                    include: [/Reboot reason/i],
                    // MAIN: Rebooting gateway for firmware update check
                    exclude: [/upgrade check/i]
                }
            ]
        },
        {
            schedules: [
                {
                    name: 'Hourly UART report',
                    interval: 60 * MINUTES,
                    // Slack only
                    level: 'warn'
                }
            ],
            reports: [
                {
                    name: 'UART messages',
                    include: [/.*/i],
                    exclude: []
                }
            ]
        }

    ]

};

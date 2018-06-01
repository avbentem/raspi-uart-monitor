
## [1.1.0](https://github.com/avbentem/raspi-uart-monitor/compare/v1.0.0...master) (future)

### New features

- Support for multiple watchdogs, to not just monitor heartbeats but to also monitor occurrences of specific messages.

- Support to count specific messages during a configurable interval, to report basic statistics (and to implicitly
  ensure the monitor itself is still operational).

- Displaying times in Slack and Telegram notifications in the local timezone rather than UTC.

- The log file's directory name can either be specified in `filename`, or in `dirname` (default: current folder).

### Breaking changes

- The filename suffix has moved from `datePattern` into `filename`. The latter now supports the `%DATE%` token, where
  the first now uses the [moment.js date format](http://momentjs.com/docs/#/displaying/format/), like
  `datePattern: 'YYYYMMDD'` (instead of `'yyyyMMdd.log'`) and `filename: 'uart-monitor-all-%DATE%.log'`.

- The configuration for the watchdogs is now an array, and has been renamed to `watchdogs`; see
  [`config-example-ttn.js`](./config-example-ttn.js).


## 1.0.0 (2018-04-02)

Initial release.


## [1.1.0](https://github.com/avbentem/raspi-uart-monitor/compare/v1.0.0...master) (future)

### New features

- Added support for multiple watchdogs, to monitor occurrences of specific messages.

- The log file's directory name can either be specified in `filename`, or in `dirname` (default: current folder).

### Breaking changes

- The filename suffix has moved from `datePattern` into `filename`. The latter now supports the `%DATE%` token, where
  the first now uses the [moment.js date format](http://momentjs.com/docs/#/displaying/format/), like
  `datePattern: 'YYYYMMDD'` (instead of `'yyyyMMdd.log'`) and `filename: 'uart-monitor-all-%DATE%.log'`.

- The configuration for the watchdogs is now an array, and has been renamed to `watchdogs`; see
  [`config-example-ttn.js`](./config-example-ttn.js).


## 1.0.0 (2018-04-02)

Initial release.

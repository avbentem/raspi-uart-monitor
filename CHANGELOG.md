
## [1.1.0](https://github.com/avbentem/raspi-uart-monitor/compare/v1.0.0...master) (future)

### New features

- Added support for multiple watchdogs, to monitor occurrences of specific messages.

- The log file's directory name can either be specified in `filename`, or in `dirname` (default: current folder).

### Breaking changes

- The filename suffix has moved from `datePattern` to `filename` and the latter supports the `%DATE%` token, like
  `datePattern: 'yyyyMMdd'` and `filename: 'uart-monitor-all-%DATE%.log'`.

- The configuration for the watchdogs is now an array, and has been renamed to `watchdogs`; see
  [`config-example-ttn.js`](./config-example-ttn.js).


## 1.0.0 (2018-04-02)

Initial release.

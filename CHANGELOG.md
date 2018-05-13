
## [1.1.0](https://github.com/avbentem/raspi-uart-monitor/compare/1.0.0...master) (future)

Upgraded dependencies, implying:

- No longer supporting Node.js 4.x.
- BREAKING: the filename suffix has moved from `datePattern` to `filename` and the latter supports the `%DATE%` token,
  like `datePattern: 'yyyyMMdd'` and `filename: 'uart-monitor-all-%DATE%.log'`.
- The log file's directory name can either be specified in `filename`, or in `dirname` (default: current folder).


## 1.0.0 (2018-04-02)

Initial release.

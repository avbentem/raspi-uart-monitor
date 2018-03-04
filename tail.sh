#!/usr/bin/env bash
# Tails the last created full log file (ending with ".log", not including "warn" or "info" in its name). Note that the
# file name will change when Winston log rotation is executed, at which point the tailing will stop.
tail -f `ls -t *.log | grep -v "warn|info" | head -n 1`

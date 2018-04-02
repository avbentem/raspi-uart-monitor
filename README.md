# Raspberry Pi UART Monitor

Monitors a Raspberry Pi [UART](https://en.wikipedia.org/wiki/Universal_asynchronous_receiver-transmitter) (asynchronous
serial):

- Combines the stream of received bytes into single-line messages.
- Uses [configurable](./config-example-ttn.js) regular expressions to determine a log level.
- Uses the log level to save the single-line messages to rotating log files, each line prefixed with a timestamp.
- Optionally sends notifications to Slack and/or Telegram for lines with some minimum log level, or when the UART has
  been inactive for some configurable time.

This is not intended to be a production-ready monitoring mechanism, if only as it has no fallback for losing its
internet connection.

## Contents

- [Installation](#installation)
- [Setting up the Raspberry Pi's UART](#setting-up-the-raspberry-pis-uart)
- [Configuration](#configuration)
  - [Creating `config.js`](#creating-configjs)
  - [Configuring Slack (optional)](#configuring-slack-optional)
  - [Configuring Telegram (optional)](#configuring-telegram-optional)
- [Using the log files](#using-the-log-files)
  - [Using `tail`](#using-tail)
  - [Reading the rotated gzip'd files](#reading-the-rotated-gzipd-files)
  - [Cleaning the resulting log files](#cleaning-the-resulting-log-files)
- [Alternatives](#alternatives)
- [Thanks!](#thanks)

## Installation

A modern Raspberry Pi probably includes [Node.js](https://nodejs.org/) and its package manager NPM. This has been tested
on a Pi&nbsp;3 running Raspbian Jessie with Node.js 6.9.4 and NPM 3.10.10; when in doubt run `node --version` and
`npm --version`.

- Run `git clone https://github.com/avbentem/raspi-uart-monitor.git`
- Run `cd raspi-uart-monitor`
- Run `npm install` to download all dependencies.
- Create a configuration file; see [below](#configuration).
- Set up your Pi's UART and connect it to whatever you want to monitor; see [below](#setting-up-the-raspberry-pis-uart).
- Test with `node index.js` (stop by pressing Ctrl+C).

To start the monitor on system boot, you could use [PM2](https://pm2.keymetrics.io/):

- Install PM2: `sudo npm install pm2@latest -g`
- Register and start the monitor script: `pm2 start index.js --name uart-monitor`
- Make PM2 start at boot: `pm2 startup`
- Whenever changing the code or configuration, restart the monitor: `pm2 restart uart-monitor`


## Setting up the Raspberry Pi's UART

- :warning: Beware that the Pi's UARTs are 3.3 volt.
- The [Raspberry Pi documentation](https://www.raspberrypi.org/documentation/configuration/uart.md) explains:

  > The SoCs used on the Raspberry Pis have two built-in UARTs, a PL011 and a mini UART. They are implemented using
  > different hardware blocks, so they have slightly different characteristics. \[...\]
  >
  > By default, on Raspberry Pis equipped with the wireless/Bluetooth module (Raspberry Pi 3 and Raspberry Pi Zero W),
  > the PL011 UART is connected to the BT module, while the mini UART is used for Linux console output. On all other
  > models the PL011 is used for the Linux console output. \[...\]
  >
  > The baud rate of the mini UART is linked to the core frequency of the VPU on the VC4 GPU. This means that as the
  > VPU frequency governor varies the core frequency, the baud rate of the UART also changes. This makes the UART of
  > limited use in the default state.

- For a Raspberry Pi 3 this boils down to disabling Bluetooth, which will make the pins on the Pi be mapped to the
  better PL011 UART:
  - edit `/boot/config.txt` (like using `sudo nano /boot/config.txt`) to add:

    ```text
    # Disable Bluetooth to make pins 8 and 10 be mapped to the PL011 UART
    dtoverlay=pi3-disable-bt
    enable_uart=1
    ```

  - run `sudo systemctl disable hciuart`
  - run `sudo reboot now`
- For older Raspberry Pis see the instructions about using `raspi-config` in the documentation linked above. That
  documentation also explains the options if you need Bluetooth.
- Connect the incoming serial cable to `GND` and `RXD` (pin 10); see [pinout.xyz/pinout/uart](https://pinout.xyz/pinout/uart).
- Test using, e.g., `minicom -b 115200 -o -D /dev/ttyAMA0`


## Configuration

### Creating `config.js`

Copy [`config-example-ttn.js`](./config-example-ttn.js) into a new file `config.js` and adjust as needed.

Restart the monitor whenever changing the configuration; like when using PM2: `pm2 restart uart-monitor`

### Configuring Slack (optional)

To post messages to Slack, an App must be created:

- Go to [slack.com/create](https://slack.com/create) if you want to register a new Slack workspace. (As Slack only
  preserves about 10,000 messages for free accounts, adding a bot to an existing workspace might get its history purged
  much sooner than expected!)
- In your (new) workspace, add a channel for the messages. (A dedicated channel allows for custom notifications.)
- Go to [api.slack.com/apps/new](https://api.slack.com/apps/new) to create a new App.
- After creating the App, in "Features", "Incoming Webhooks": enable "Activate Incoming Webhooks" and click 
  "Add New Webhook to Workspace". Select a channel and authorize it. Copy the URL to `config.json`.
- It seems the token is not currently used, but if you want to have a complete configuration: from "Features",
  "OAuth & Permissions" copy the token to `config.json`.

### Configuring Telegram (optional)

To post messages to Telegram, a bot is used. See [the official documentation](https://core.telegram.org/bots).

- Start a new chat [with @BotFather](https://telegram.me/BotFather).
- Type `/newbot` and follow the instructions. Copy the authorization token to `config.json`.
- Create a new chat group with [@RawDataBot](https://telegram.me/rawdatabot), which will respond with technical
  details about your new chat group.
- Copy the chat id to `config.json` (it seems that for group chats this is always a negative number).
- Kick `@RawDataBot` from the group.
- Invite your new bot to the group.


## Using the log files

### Using `tail`

This uses the Winston logger's [winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file),
which works great but is [not very tail-friendly](https://github.com/winstonjs/winston-daily-rotate-file/issues/23):
whenever the files are rotated, the current file gets a new name too. Consider using some external logrotate if
that's an issue.

### Reading the rotated gzip'd files

By default, a Raspbian's installation of `vi` might not recognize compressed files. A simple upgrade helps:

```bash
sudo apt-get update
sudo apt-get install vim
```

...after which `vi -R uart-monitor-debug-20180301.log.gz` just works. (Note that `grep` already works fine for
compressed logs.)

### Cleaning the resulting log files

The monitor logs a line `[monitor] Starting UART monitor`. One can easily remove those using something like:

```text
cat uart-monitor-debug-20180302.log | grep -v '\[monitor\]' > clean.log
```

Alternatively, just remove the creation of that that line from [`index.js`](./index.js).


## Alternatives

If you just want to add a timestamp to the logging and show it on the screen and save all to a file as well, like when
using [PlatformIO](https://platformio.org/), then all you need is:

```LOG="serial-`date +'%Y%m%d-%H%M%S'`.log"; pio serialports monitor --raw -b 115200 | while read l; do echo "[`date +'%F %T'`] $l" | tee -a $LOG; done```


## Thanks!

- [raspi](https://www.npmjs.com/package/raspi) and [raspi-serial](https://www.npmjs.com/package/raspi-serial) to access
  the Raspberry Pi's UART.
- [winston](https://github.com/winstonjs) for logging and file rotation.
- [slack-winston](https://www.npmjs.com/package/slack-winston) for integration with Slack.
- [winston-telegram](https://www.npmjs.com/package/winston-telegram) for integration with Telegram.

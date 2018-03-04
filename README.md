# Raspberry Pi UART Monitor

Monitors a Raspberry Pi [UART](https://en.wikipedia.org/wiki/Universal_asynchronous_receiver-transmitter) (asynchronous
serial):

- Combines the stream of received bytes into single-line messages.
- Uses configurable regular expressions to determine a log level.
- Uses the log level to save the single-line messages to rotating log files, each line prefixed with a timestamp.
- Optionally sends notifications to Slack and/or Telegram for lines with some minimum log level, or when the UART has
  been inactive for some configurable time.

This is not intended to be a production-ready monitoring mechanism, if only as it has no fallback for losing its
internet connection.


## Installation

A modern Raspberry Pi includes [Node.js](https://nodejs.org/) and its package manager NPM. This has been tested on a
Pi&nbsp;3 with Node.js 6.9.4 and NPM 3.10.10; when in doubt run `node --version` and `npm --version`.

- Run `npm install` to download all dependencies.
- Create a configuration file; see [below](#configuration).
- Set up your Pi's UART (see [below](#setting-up-the-raspberry-pis-uart)) and connect to whatever you want to monitor.
- Test with `node index.js` (stop with Ctrl+C).

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

Copy [`config-example-ttn.js`](./config-example-ttn.js) into a new file `config.js` and adjust as needed.

Restart the monitor whenever changing the configuration; like when using PM2: `pm2 restart uart-monitor`

### Configuring Slack (optional)

To post messages to Slack, an App must be created:

- Go to [slack.com/create](https://slack.com/create) if you want to register a new Slack workspace.
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


## Cleaning the resulting log files

The monitor logs a line `[monitor] Starting UART monitor`. One can easily remove those using something like:

```text
cat uart-monitor-debug-20180302.log | grep -v '\[monitor\]' > clean.log
```

Alternatively, just remove that line from [`index.js`](./index.js).

## Thanks!

- [raspi](https://www.npmjs.com/package/raspi) and [raspi-serial](https://www.npmjs.com/package/raspi-serial) to access
  the Raspberry Pi's UART.
- [winston](https://github.com/winstonjs) for logging and file rotation.
- [slack-winston](https://www.npmjs.com/package/slack-winston) for integration with Slack.
- [winston-telegram](https://www.npmjs.com/package/winston-telegram) for integration with Telegram.

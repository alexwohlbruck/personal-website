---
title: Turning my Metroboard into a smart light
date: 2026-10-05
summary: I got a Metroboard as a gift and mounted it on my wall, where I can't reach its buttons. I added an MQTT bridge to its firmware so Home Assistant can control it like the rest of my lights.
tags: [home-assistant, homelab, hardware, mqtt, micropython]
---

I got a Chicago [Metroboard](https://www.designrules.co/) as a gift. It's a map
of the L with 310 LEDs that show where the trains are in real time.

I run [Home Assistant](https://www.home-assistant.io/) at home, and all my other
lights are on it with routines and automations. The Metroboard wasn't. You
change its settings with four buttons on the back, and since I mounted it on the
wall, I can't really get to them.

<Video
  post="metroboard-home-assistant"
  file="other-lights.mp4"
  title="Dimming and switching the apartment's lights from Home Assistant"
  ratio="3 / 4"
  caption="My other lights, controlled from Home Assistant. The Metroboard is on the wall in the background."
/>

So I added a bridge to its firmware that talks MQTT, the messaging protocol a
lot of smart home devices use. Home Assistant picks it up automatically and adds
it as a device, with no config on the Home Assistant side.

<Figure
  post="metroboard-home-assistant"
  file="board-and-dashboard.jpg"
  alt="The Metroboard lit up on a wall, next to a Home Assistant dashboard showing its light controls"
  caption="The board on the wall, with its controls in Home Assistant."
/>

It shows up as a regular smart light. I can turn it on and off, change the
brightness, and switch between line colors and white.

<Video
  post="metroboard-home-assistant"
  file="board-controls.mp4"
  title="Turning the Metroboard off and on, dimming it, and switching it to white from Home Assistant"
  ratio="3 / 4"
  caption="Turning it off and on, dimming it, and switching it to white."
/>

The other button settings are there too, solid or pulsing trains and how often
it updates, along with night mode, which you can normally only set during Wi-Fi
setup. Since it's a normal light now, it works in the same routines and
automations as everything else.

<Figure
  post="metroboard-home-assistant"
  file="device-page.png"
  alt="The Metroboard (Chicago) device page in Home Assistant, with controls for color mode, the light, night mode, transit mode and update frequency, and diagnostic sensors"
  caption="The device page in Home Assistant, with the rest of the board's settings."
/>

All of this stays on my network. The board still gets its train data from Design
Rules' servers like it did before.

## Doing it yourself

The code is on GitHub at
[alexwohlbruck/metroboard-hass](https://github.com/alexwohlbruck/metroboard-hass).

<Callout kind="warning" title="At your own risk">

This changes the software on your Metroboard in a way Design Rules doesn't
support. It could void your warranty or leave your board not working. I'm not
responsible for any damage to your board, problems with your network or Home
Assistant, or anything Design Rules does about a modified board. The code is
provided as is, with no warranty, under the MIT license.

</Callout>

### What you need

- A Metroboard. I've only tried this on a Chicago board running app v0.8.0 and
  MicroPython 1.25. Other cities should work the same way, and the installer
  stops if it doesn't recognize your board's app.
- Home Assistant with the MQTT integration set up, and an MQTT broker like the
  [Mosquitto add-on](https://github.com/home-assistant/addons/blob/master/mosquitto/DOCS.md).
  The board has to be able to reach the broker over your Wi-Fi, and it has to
  be the same broker Home Assistant is connected to.
- A USB-C cable that carries data, not just power.
- A computer with Python 3. The installer finds the board on its own on macOS
  and Linux. On Windows, pass the port with `--port`, like `--port COM3`.

### 1. Get the code

```bash
git clone https://github.com/alexwohlbruck/metroboard-hass
cd metroboard-hass
python3 -m venv .venv
source .venv/bin/activate
pip install esptool littlefs-python "mpy-cross==1.25.0.post2"
```

`mpy-cross` has to be the 1.25 version so the compiled files match the board.

### 2. Plug in the board

Unplug the board from its power adapter and plug it into your computer. It runs
off USB power while it's connected.

### 3. Back it up

```bash
python3 tools/mb_flash.py backup
```

This saves the board's entire flash to a file like
`metroboard-20261005-120000.bin`. Keep it somewhere safe. It's how you get the
board back to exactly how it was, and you'll need it again after some vendor
updates. It also has your Wi-Fi password and the board's secret key in it, so
don't share it.

### 4. Set your broker

```bash
cp mb_hass.example.json mb_hass.json
```

Open `mb_hass.json` and set `broker` to your MQTT broker's IP address. If you
use the Mosquitto add-on, that's the IP of the machine running Home Assistant.
If your broker needs a login, fill in `user` and `password`. The Mosquitto
add-on accepts Home Assistant user accounts, so you can make a user just for the
board.

### 5. Install

```bash
python3 tools/mb_flash.py install
```

The board resets when it's done.

### 6. Find it in Home Assistant

Unplug the board from your computer and put it back on its power adapter. Within
about a minute it shows up under **Settings → Devices & services → MQTT** as
**Metroboard (Chicago)**, or whichever city yours is. You don't need to use "Add
MQTT device".

Add its **Display** light to a dashboard (I renamed mine to Metro Board). The
tile turns it on and off and sets the brightness. Line colors and white are
under **Effect** when you open the light. You can use it in automations and
scenes like any other light.

<Figure
  post="metroboard-home-assistant"
  file="light-controls.png"
  alt="The Metroboard light's controls in the Home Assistant app: a brightness slider at 33%, a power button, and an Effect menu with Line Colors and White"
  caption="The light's controls. Brightness snaps to three levels, and color is under Effect."
/>

### If it doesn't show up

- Check that `broker` is the one Home Assistant's MQTT integration uses, and that
  devices on your Wi-Fi can reach it on port 1883.
- To see what the board is doing, set `"debug": true` in `mb_hass.json`, run
  `install` again, and leave the board plugged into your computer. Its logs
  print on the USB serial port:

  ```bash
  python3 -m serial.tools.miniterm --dtr 0 --rts 0 /dev/cu.usbmodem* 115200
  ```

  On Linux the port is usually `/dev/ttyACM0`.

### After a vendor update

When Design Rules releases a new version, the board switches to it. The new
version doesn't have the bridge's hook, so Home Assistant control stops. Plug the board in
and run the installer again with your backup:

```bash
python3 tools/mb_flash.py install --app-from metroboard-20261005-120000.bin
```

### Undoing it

```bash
python3 tools/mb_flash.py uninstall
```

That removes the bridge and the hook, and switches the board back to the app it
was running before. To put the board back exactly how it was before you started,
write your backup to it:

```bash
python3 -m esptool write-flash 0 metroboard-20261005-120000.bin
```

## How it works

### The board

It's an ESP32-C3 with 4 MB of flash, running MicroPython 1.25. Flash encryption
and secure boot are off, and the USB-C port carries data, so the whole flash can
be read and written over the cable. The app is MicroPython code on a littlefs
filesystem.

Out of the box it's a cloud client. It connects to Wi-Fi and polls Design Rules'
realtime API every 5, 10 or 30 seconds. For each line, the response lists which
LEDs have a train stopped at a station and which have one in transit, and the
board lights them up. It doesn't run any local server, so there's nothing on the
network to talk to.

Design Rules leaves a README on the board saying local changes are fine, as long
as you don't poll their servers more often, change what the board reports to
them, or share the API key or URLs in the firmware. The bridge only adds local
control, its fastest update setting is their 5 second minimum, and the repo
doesn't include any of their code.

### The hook

The app runs on asyncio. The installer adds a few lines to its `main()`, right
after it sets up the buttons, that start the bridge as one more task:

```python
import mb_hass
asyncio.create_task(mb_hass.run(ctx))
```

They're wrapped in a `try`, so if the bridge fails to start, the app carries on
without it. `ctx` is the app's state, so the bridge changes settings on the same
objects the buttons use. It saves them to `/config.json` too, so they survive a
reboot and stay in sync with the buttons.

The installer writes all this with the board in bootloader mode: it reads the
filesystem partition with `esptool`, edits it with `littlefs-python`, and writes
it back. The bridge's files go at the root of the filesystem, which vendor
updates don't touch.

The board keeps two copies of the app. `base_app` is plain Python, and
`updated_app` holds the latest update from Design Rules, compiled to bytecode.
The hook can only go in the plain Python copy, so the installer switches the
board to `base_app` and tells it to skip the pending update. On my board, that
meant going from app v1.0.0 back to v0.8.0. Train data comes from Design Rules'
servers either way, so the map works the same.

A newer update will still install, and the board will switch to it, leaving the
hook behind. That's why the installer can restore `base_app` from your backup.

### The MQTT client

The bridge uses Peter Hinch's
[`mqtt_as`](https://github.com/peterhinch/micropython-mqtt), which does all its
socket I/O asynchronously, so a slow or unreachable broker can't stall the
display. By default it manages Wi-Fi itself, which would conflict with the app,
so the bridge subclasses it to wait for the app's connection instead.

Both the bridge and `mqtt_as` are installed precompiled as `.mpy` files. If the
board had to compile `mqtt_as` itself, next to the running app, it would run out
of memory.

### Home Assistant

The bridge uses
[MQTT discovery](https://www.home-assistant.io/integrations/mqtt/#mqtt-discovery).
When it connects, it publishes a config message for each entity, and Home
Assistant creates the device from those. The main entity is a light that takes
JSON commands:

```bash
mosquitto_pub -h <broker> -t metroboard/<device-id>/set/light \
  -m '{"state": "ON", "brightness": 170, "effect": "White"}'
```

The board only has three brightness levels, so the light's brightness snaps to
85, 170 or 255. Color is an effect rather than a color picker, because the board
can only show the real line colors or all white. The Brightness and Color Mode
dropdowns on the device page control the same settings and stay in sync with the
light.

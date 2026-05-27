---
title: Protect Your Home Minecraft Server’s IP with a VPS
description: Guide to installing and configuring sslh on Alpine Linux
date: 2025-08-30
---

## Introduction

Want to run a Minecraft server from home without revealing your IP address? You can! Let's set up sslh on a Alpine Linux VPS so clients connect to the VPS first, and the VPS forwards port 25565 traffic to your home server.

> [!note]
> All commands in this guide are being ran as root.

## Installation

### Install sslh and back up the config file

```sh
apk add sslh
cp /etc/init.d/sslh /etc/init.d/sslh.bak
```

### Edit the config file

```diff
<!-- /etc/conf.d/sslh -->
# Configuration for /etc/init.d/sslh

# The sslh binary to run; one of:
#
# fork    Forks a new process for each incoming connection. It is well-tested
#         and very reliable, but incurs the overhead of many processes.
# select  Uses only one thread, which monitors all connections at once. It is
#         more recent and less tested, but has smaller overhead per connection.
-#mode="fork"
+mode="select"

# Path of the configuration file.
#cfgfile="/etc/sslh.conf"

# Additional options to pass to the sslh daemon. See sslh(1) man page.
-#command_args=""
+command_args="--user root --listen 0.0.0.0:25565 --anyprot YOUR.HOME.IP.ADDRESS:25565"

# Uncomment to run the sslh daemon under process supervisor.
#supervisor=supervise-daemon
```

### Start sslh
```sh
rc-service sslh start
```

### Verify that the sslh started successfuly
```sh
rc-service sslh status
netstat -tulnp | grep :25565
```

`sslh` should now be running. Make sure your home router is port forwarding port 25565 traffic to your home server. You might want to give your home server a static IP address so that your rules don't break.

To see if people can access your server, type the VPS's IP address into an [online status checker](https://mcsrvstat.us). You can also type the VPS IP into your Minecraft client and try joining. If it doesn't work, make sure the 25565 port is open in both the VPS provider's firewall and the VPS's OS firewall, and that your home router is correctly forwarding port 25565 to your home server.

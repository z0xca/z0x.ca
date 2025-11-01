---
title: Protect your home Minecraft Server from DDOS attacks with a VPS
description: Guide to installing and configuring sslh on Alpine Linux
date: 2025-08-30
---

## Introduction

Want to run a Minecraft server from home without revealing your IP address? You can! Just set up a free proxy with a VPS to protect your server from denial-of-service attacks.

> [!note]
> All commands in this guide are being ran as root.

## Installation

### Install sslh and back up the config file

```sh
apk add sslh
cp /etc/init.d/sslh /etc/init.d/sslh.bak
```

### Edit the config file

> [!note]
> Replace `YOUR.MC.IP.ADDRESS` with your home IP address. If you don't know your IP, use [icanhazip.com](https://icanhazip.com/) or Cloudflare's [IP Address Information](https://radar.cloudflare.com/ip) page

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
+command_args="--user root --listen 0.0.0.0:25565 --anyprot YOUR.MC.IP.ADDRESS:25565"

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

`sslh` should now be running. Make sure your home router is port forwarding port 25565 traffic to your home server. You might want to give your computer a static IP address so this doesn't change.

To see if people can access your server, type the VPS's IP address into an [online status checker](https://mcsrvstat.us). You can also type the VPS IP into your Minecraft client and try to join. If it doesn't work, make sure the 25565 port is open in the VPS provider's and the VPS's OS firewalls.
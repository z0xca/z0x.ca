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

```
apk add sslh
cp /etc/init.d/sslh /etc/init.d/sslh.bak
```

### Configure the init script

> [!note]
> Replace `YOUR.MC.IP.ADDRESS` with your home IP address. If you don't know your IP, use [icanhazip.com](https://icanhazip.com/) or Cloudflare's [IP Address Information](https://radar.cloudflare.com/ip) page

```
<!-- /etc/init.d/sslh -->
#!/sbin/openrc-run

: ${mode:="select"}
: ${wait:=50}

description="Port multiplexer for SSH, HTTPS, OpenVPN etc."
command="/usr/sbin/sslh-select"
command_args="--user root --listen 0.0.0.0:25565 --anyprot YOUR.MC.IP.ADDRESS:25565 --pidfile /var/run/sslh/sslh.pid"
supervise_daemon_args=""
required_files=""
start_pre() {
    checkpath -d -p /var/run/sslh
    return 0
}
stop() {
    ebegin "Stopping sslh"
    start-stop-daemon --stop --pidfile "${pidfile}" \
        --name "sslh-select" --retry=TERM/5/KILL/5
    eend $?
}
```

### Start sslh
```
rc-service sslh start
```

### Verify that the sslh started successfuly
```
rc-service sslh status
netstat -tulnp | grep :25565
```

`sslh` should now be running. Make sure your home router is port forwarding port 25565 traffic to your home server. You might want to give your computer a static IP address so this doesn't change.

To see if people can access your server, type the VPS's IP address into an [online status checker](https://mcsrvstat.us). You can also type the VPS IP into your Minecraft client and try to join. If it doesn't work, make sure the 25565 port is open in the VPS provider's and the VPS's OS firewalls.
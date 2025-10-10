---
title: Alpine Linux install guide
description: Guide to installing Alpine Linux with full disk encryption
date: 2025-05-04
---

## Introduction

The goal of this guide is to set up a minimal installation of **Alpine Linux** with **full disk encryption**. Refer to the [Alpine installation wiki](https://wiki.alpinelinux.org/wiki/Installation) if encountering any issues

## Acquire an installation image

1. Go to the downloads page https://www.alpinelinux.org/downloads
2. Under the **Standard** section, download the `x86_64` version

## Prepare an installation medium

### Linux

1. Insert a USB flash drive into your PC with at least 2 GB of space available on it.
2. Find the corresponding block device for the flash drive in `/dev` folder. Usually it is `/dev/sdb1`.
3. Write the image to the flash drive (assuming your flash drive is `/dev/sdb1`).

> [!warning]
> This command will wipe the `/dev/sdb1` partition


```sh
doas dd bs=4M if=~/Downloads/alpine*x86_64.iso of=/dev/sdb1 conv=fsync oflag=direct status=progress
```

### Windows

Use [Rufus](https://rufus.ie/en)

## Boot the live environment

> [!info]
> Alpine Linux installation images do not support Secure Boot. You will need to disable Secure Boot in your BIOS to boot the installation medium.

1. Power off your PC.
2. Insert the flash drive into the computer on which you are installing Alpine Linux.
3. Power on your PC and press your *boot menu* key. 
4. Boot the installation medium.

## Enter the live environment 

Log in as the user `root`. Initially, the **root** user has no password.

> [!note]
> `nvme0n1` will be used as the target install drive throughout this guide, adapt it to your drive name.

> [!tip]
>Change `alpine` to your desired hostname and `system` to your desired username.
>
>Change `Asia/Dubai` to your timezone.

```sh
setup-alpine
```

```text
Select keyboard layout: us
Select variant: us
Enter system hostname: alpine
Which one do you want to initialize?: [enter]
Ip address for [your_interface]?: dhcp
Do you want to do any manual network configuration?: n
New password: [your_root_password]
Retype password: [your_root_password]
Which timezone are you in?: Asia/Dubai
HTTP/FTP proxy URL?: none
Enter mirror number: f
Setup a user?: system
Full name for user system?: system
New password:
Retype password:
Enter ssh key or URL for system: none
Which SSH server?: openssh
Which NTP client to run?: chrony
Which disks would you like to use?: nvme0n1
How would you like to use it?: cryptsys
Erase above disks and continue?: y
Enter passphrase for /dev/nvme0n1p2: [your_encryption_passphrase]
Verify passphrase: [your_encryption_passphrase]
```

## Reboot

1. You can now reboot and enter into your new installation

> [!note]
> Unplug your flash drive after the screen turns black

```sh
reboot
```

## Post install

After entering the decryption passphrase, you will be greeted with a similar screen as when you first booted from the flash drive.
Login using the credentials that you set, if you followed the example, your username would be `system`

### Add repositories

> [!note]
> Testing will not be used by default, but you can install a package from it like so
> 
>```sh
>doas apk add [your_package]@testing
>```


```sh
doas apk update
doas apk upgrade
```

### Add swap

```sh
doas apk add e2fsprogs-extra
doas fallocate -l 4G /swapfile
doas chmod 600 /swapfile
doas mkswap /swapfile
doas swapon /swapfile
doas cp /etc/fstab /etc/fstab.bak
echo '/swapfile none swap sw 0 0' | doas tee -a /etc/fstab

doas swapoff /dev/nvme0n1/lv_swap
doas lvremove /dev/nvme0n1/lv_swap
doas lvextend -l +100%FREE /dev/nvme0n1/lv_root
doas resize2fs /dev/nvme0n1/lv_root
```

```diff
<!-- /etc/fstab -->
-/dev/nvme0n1/lv_swap none swap defaults 0 0
```

### Install Docker

```md
<!-- ~/.zshenv -->
export EDITOR=nvim
export XDG_CONFIG_HOME="$HOME/.config"
export XDG_DATA_HOME="$HOME/.local/share"
export XDG_BIN_HOME="$HOME/.local/bin"
export XDG_STATE_HOME="$HOME/.local/state"
export XDG_CACHE_HOME="$HOME/.cache"
export XDG_RUNTIME_DIR=/tmp/1000-runtime-dir
export PATH="$XDG_BIN_HOME:$PATH"
export ZDOTDIR="$XDG_CONFIG_HOME/zsh"
```

```sh
doas apk add docker docker-cli-compose zsh shadow neovim
chsh -s zsh $USER 
doas addgroup $USER docker
doas rc-update add docker && rc-service docker start
doas apk del shadow
```

#### WG-Easy

If you're planning to use [wg-easy](https://github.com/wg-easy/wg-easy), save yourself hours of troubleshooting by running the following commands

```sh
doas apk add iptables ip6tables
doas reboot
doas modprobe ip_tables
doas echo 'ip_tables' >> /etc/modules
doas reboot
```

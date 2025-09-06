---
title: Artix Linux install guide
description: Guide to installing Artix Linux with OpenRC and full disk encryption for UEFI and BIOS systems
date: 2025-01-07
---

## Introduction

The goal of this guide is to set up a minimal installation of **Artix Linux** with **OpenRC** as an init system and **full disk encryption** on an **UEFI** or **BIOS** system. This guide is meant to be read alongside the [Artix](https://wiki.artixlinux.org/) and [Arch](https://wiki.archlinux.org/title/Installation_guide) wiki respectively. It does not cover implementing [Secure Boot](https://wiki.archlinux.org/title/Unified_Extensible_Firmware_Interface/Secure_Boot#Implementing_Secure_Boot)

## Acquire an installation image

1. Go to the downloads page https://artixlinux.org/download.php
2. Scroll down to the **Official ISO images** section.
3. Under the **base** section, download the file starting with `artix-base-openrc` and ending with `.iso`

## Prepare an installation medium

### Linux

1. Insert a USB flash drive into your PC with at least 2 GB of space available on it.
2. Find the corresponding block device for the flash drive in `/dev` folder. Usually it is `/dev/sdb1`
3. Write the image to the flash drive (assuming your flash drive is `/dev/sdb1`).

> [!warning]
> This command will wipe the `/dev/sdb1` partition


```sh
doas dd bs=4M if=~/Downloads/artix-base-openrc-*-x86_64.iso of=/dev/sdb1 conv=fsync oflag=direct status=progress
```

### Windows

Use [Rufus](https://rufus.ie/en)

## Boot the live environment

> [!info]
> Artix Linux installation images do not support Secure Boot. You will need to disable Secure Boot in your BIOS to boot the installation medium.

1. Power off your PC.
2. Insert the flash drive into the computer on which you are installing Artix Linux.
3. Power on your PC and press your *boot menu* key. 
4. Boot the installation medium.

## Enter the live environment 

Login with the default credentials.
* Username: `root`
* Password: `artix`

## Connect to the internet

### Via Ethernet

Connect the computer via an Ethernet cable

### Via WiFi

```sh
rfkill unblock wifi
ip link set wlan0 up
connmanctl
```

```sh
agent on
scan wifi
services
```

> [!tip]
> Network names can be tab-completed.

> [!example]
> connect wifi_dc85de_383039_managed_psk

```sh
connect {your WiFi name}
quit
```

### Verify internet connectivity

```sh
ping artixlinux.org
```

## Update the system clock

Activate the NTP daemon to synchronize the computer's real-time clock
```sh
rc-service ntpd start
```

## Partition the disk

1. Install and run `gdisk`
```sh
pacman -Sy gdisk
gdisk /dev/nvme0n1
```

> [!note]
> `nvme0n1` will be used as the target install drive throughout this guide, adapt it to your drive name.

2. Delete any existing partitions. Repeat until none are left.
```text
Command (m for help): d
```

3. Create a boot partition
```text
Command (m for help): n
Partition number (1-128, default 1):
First sector (...):
Last sector (...): +512M
Hex code or GUID (...): ef00
```

4. Create a root partition
```text
Command (m for help): n
Partition number (2-128, default 1):
First sector (...):
Last sector (...):
Hex code or GUID (...): 8300
```

5. Write the changes
```text
Command (m for help): w
Do you want to proceed? (Y/N): y
```

6. Verify partitioning
```sh
lsblk
```

> [!note]
> It should look something like this
>
> ```shell title="lsblk"
> NAME        MAJ:MIN RM   SIZE RO TYPE
> nvme0n1     259:0    0 465,8G  0 disk
> ├─nvme0n1p1 259:1    0   512M  0 part
> └─nvme0n1p2 259:2    0 465,3G  0 part
> ```

## Encrypt root partition

1. Encrypt your root partition

> [!tip]
>Make sure to enter a secure passphrase and to write it down

```sh
cryptsetup luksFormat /dev/nvme0n1p2
Are you sure (Type `yes` in capital letters): YES
```

2. Open the encrypted partition
```sh
cryptsetup open /dev/nvme0n1p2 root
```

## Create filesystems

1. Create the boot file system
```sh
mkfs.fat -F32 /dev/nvme0n1p1
```

1. Create the root file system
```sh
mkfs.ext4 /dev/mapper/root
```

## Mount file systems

1. Mount the root file system
```sh
mount /dev/mapper/root /mnt
```

2.  Mount the boot file system
```sh
mount -m /dev/nvme0n1p1 /mnt/boot
```

3. Verify mounting
```sh
lsblk
```

> [!note]
> It should look something like this
>
> ```shell title="lsblk"
> NAME        MAJ:MIN RM   SIZE RO TYPE  MOUNTPOINTS
> nvme0n1     259:0    0 465,8G  0 disk  
> ├─nvme0n1p1 259:1    0   512M  0 part  /mnt/boot
> └─nvme0n1p2 259:2    0 465,3G  0 part  
>   └─root    254:0    0 465,2G  0 crypt /mnt
> ```

## Install essentials

Install the base system, kernel, init system and other essential packages.

```sh
basestrap /mnt base linux linux-firmware openrc elogind-openrc cryptsetup cryptsetup-openrc efibootmgr doas nano
```

> [!note]
> Install AMD or Intel microcode, depending on your system's CPU

### AMD CPU

Install AMD CPU microcode updates

```sh
basestrap /mnt amd-ucode
```

### Intel CPU

Install Intel CPU microcode updates

```sh
basestrap /mnt intel-ucode
```

## Generate file system table

```sh
fstabgen -U /mnt >> /mnt/etc/fstab
```

## Switch to new Installation

```sh
artix-chroot /mnt bash
```

## Network stack

```sh
pacman -S wpa_supplicant networkmanager networkmanager-openrc iwd iwd-openrc
rc-update add NetworkManager
rc-update add iwd
```

```diff
<!-- /etc/NetworkManager/conf.d/wifi_backend.conf -->
+[device]
+wifi.backend=iwd
```

### MAC randomization

> [!info]
>MAC randomization can be used for increased privacy by not disclosing your real MAC address to the WiFi network. 

```diff
<!-- /etc/NetworkManager/conf.d/00-macrandomize.conf -->
+[device-mac-randomization]
+wifi.scan-rand-mac-address=yes

+[connection-mac-randomization]
+ethernet.cloned-mac-address=random
+wifi.cloned-mac-address=random
```

## Localization

### Set the locale

> [!tip]
>Feel free to change `en_DK.UTF-8` to your preferred locale such as `en_US.UTF-8` or `en_GB.UTF-8`

1. Uncomment `en_DK.UTF-8`

```ini showLineNumbers=true startLineNumber=150 {4}
<!-- /etc/locale.gen -->
#en_CA.UTF-8 UTF-8  
#en_CA ISO-8859-1  
en_DK.UTF-8 UTF-8  
#en_DK ISO-8859-1  
#en_GB.UTF-8 UTF-8  
#en_GB ISO-8859-1  
```

2. Generate locales
```sh
echo 'LANG=en_DK.UTF-8' > /etc/locale.conf
locale-gen
```

## Set the timezone

> [!example]
>`ln -sf /usr/share/zoneinfo/Asia/Dubai /etc/localtime`

```sh
ln -sf /usr/share/zoneinfo/Region/City /etc/localtime
```

## Set hardware clock from system clock

```sh
hwclock --systohc
```

## Hostname

Set your preferred hostname, in this case I will be using `artix`
```sh
echo 'artix' > /etc/hostname
```

```diff
<!-- /etc/conf.d/hostname -->
# Use fallback hostname if /etc/hostname doesn't exist
-hostname="localhost"
+hostname="artix"
```

```ini
<!-- /etc/hosts -->
# Static table lookup for hostnames.
# See hosts(5) for details.

127.0.0.1     localhost
::1           localhost
127.0.1.1     artix.localdomain     artix
```

## Initramfs

In the `HOOKS` array, add `encrypt` between `block` and `filesystems`

```diff ins="encrypt" showLineNumbers=false
<!-- /etc/mkinitcpio.conf -->
HOOKS=(... block encrypt filesystems ...)
```

Generate initramfs images

```sh
mkinitcpio -P
```
## Add a user

1. Set the root password.
```sh
passwd
```

2. Create a user and set his password.

> [!tip]
>Change `artix` to your desired username

```sh
useradd -m artix
passwd artix
```

## Configure doas

1. Create the config file and set the appropriate permissions
```sh
touch /etc/doas.conf
chown -c root:root /etc/doas.conf
chmod -c 0400 /etc/doas.conf
```

2. Add the following
```diff
<!-- /etc/doas.conf -->
+permit artix as root
+permit nopass artix as root cmd pacman
```

## Boot loader
### Check for UEFI support

> [!tip]
>If you see a bunch of files listed when executing the following command, use EFISTUB.
>If you do not see a bunch of files listed, your system does not support UEFI and you should use GRUB.
>```sh
>ls /sys/firmware/efi/efivars
>```

### EFISTUB

1. Get the UUID of your root partition
```sh
blkid -s UUID -o value /dev/nvme0n1p2
```

2. Create a boot entry

> [!tip]
>Replace xxxx with the UUID that you just obtained
>Replace `intel-ucode.img` with `amd-ucode.img` if you have an AMD CPU

```sh
efibootmgr -c -d /dev/nvme0n1 -p 1 -l /vmlinuz-linux -L "Artix" -u "cryptdevice=UUID=xxxx:root root=/dev/mapper/root rw initrd=\intel-ucode.img initrd=\initramfs-linux.img loglevel=3 quiet"
```

### GRUB

1. Install grub on your boot partition
```sh
pacman -S grub
grub-install /dev/nvme0n1
```

2. Get the UUID of your root partition
```sh
blkid -s UUID -o value /dev/nvme0n1p2
```

3. Edit the GRUB config file

> [!note]
> It should look something like this with xxxx being the UUID that you just obtained
> 
> ```ini
> GRUB_CMDLINE_LINUX="cryptdevice=UUID=550e8400-e29b-41d4-a716-446655440000:root root=/dev/mapper/root"
> GRUB_ENABLE_CRYPTODISK=y
> ```

```diff showLineNumbers=false del="#" ins="cryptdevice=UUID=xxxx:root root=/dev/mapper/root"
<!-- /etc/default/grub -->
GRUB_CMDLINE_LINUX_DEFAULT="cryptdevice=UUID=xxxx:root root=/dev/mapper/root"
#GRUB_ENABLE_CRYPTODISK=y
```

4. Generate the config file
```sh
grub-mkconfig -o /boot/grub/grub.cfg
```

## Reboot

1. You can now reboot and enter into your new installation

> [!note]
> Unplug your flash drive after the screen turns black

```sh
exit
umount -R /mnt
reboot now
```

## Post install

You will now be greeted with a similar screen as when you first booted from the flash drive.
Login using the credentials that you set, if you followed the example your username would be `artix`.

### Add arch repositories and sort for fastest mirrors
#### Add arch extra repository

1. Install packages and fetch mirrorlist
```sh
doas pacman -Syu artix-archlinux-support curl
doas pacman-key --populate archlinux
doas sh -c "curl https://archlinux.org/mirrorlist/all -o /etc/pacman.d/mirrorlist-arch"
```

2. Activate Arch mirrors

```diff del="#"
<!-- /etc/pacman.d/mirrorlist-arch -->
#Server = https://geo.mirror.pkgbuild.com/$repo/os/$arch
#Server = https://ftpmirror.infania.net/mirror/archlinux/$repo/os/$arch
#Server = http://mirror.rackspace.com/archlinux/$repo/os/$arch
#Server = https://mirror.rackspace.com/archlinux/$repo/os/$arch
```

3. Edit the pacman config file

```diff
<!-- /etc/pacman.conf -->
+##Arch
+[extra]
+Include = /etc/pacman.d/mirrorlist-arch

+##[multilib]
+##Include = /etc/pacman.d/mirrorlist-arch
```

#### Sort for fastest mirrors

```sh
doas pacman -Syu reflector pacman-contrib
doas reflector --verbose -p https -l 30 -f 5 --sort rate --save /etc/pacman.d/mirrorlist-arch
doas sh -c "curl https://gitea.artixlinux.org/packages/artix-mirrorlist/raw/branch/master/mirrorlist -o /etc/pacman.d/mirrorlist.bak"
doas sh -c "rankmirrors -v -n 5 /etc/pacman.d/mirrorlist.bak > /etc/pacman.d/mirrorlist"
```

###  AUR
####  Add Chaotic-AUR
```sh
doas pacman-key --recv-key 3056513887B78AEB --keyserver keyserver.ubuntu.com
doas pacman-key --lsign-key 3056513887B78AEB
doas pacman -U 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-keyring.pkg.tar.zst'
doas pacman -U 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-mirrorlist.pkg.tar.zst'
```

```diff showLineNumbers=false
<!-- /etc/pacman.conf -->
+[chaotic-aur]
+Include = /etc/pacman.d/chaotic-mirrorlist
```

####  Install paru

```sh
doas pacman -Syu
doas pacman -S paru
```

#### Replace sudo with doas

```sh
doas pacman -Rdd sudo
doas ln -s /usr/bin/doas /usr/bin/sudo
```

### Laptop power profiles

Install and enable the powerprofiles daemon

```sh
doas pacman -S power-profiles-daemon power-profiles-daemon-openrc
doas rc-update add power-profiles-daemon
doas rc-service power-profiles-daemon start
```

### Add swap

```sh
doas fallocate -l 4G /swapfile
doas chmod 600 /swapfile
doas mkswap /swapfile
doas swapon /swapfile
doas cp /etc/fstab /etc/fstab.bak
echo '/swapfile none swap sw 0 0' | doas tee -a /etc/fstab
```

### Auto-mount an external LUKS encrypted drive

```sh
doas pacman -S cryptsetup-openrc fdisk
doas fdisk /dev/sdb
>g, n, w

doas cryptsetup luksFormat /dev/sdb1
doas cryptsetup luksOpen /dev/sdb1 hdd1
doas mkfs.ext4 /dev/mapper/hdd1
doas mkdir /mnt/hdd1
doas mount /dev/mapper/hdd1 /mnt/hdd1
doas chown artix:artix /mnt/hdd1
doas dd if=/dev/urandom of=/root/keyfile_hdd1 bs=512 count=4
doas chmod 0400 /root/keyfile_hdd1
doas cryptsetup luksAddKey /dev/sdb1 /root/keyfile_hdd1
UUID=$(doas blkid -s UUID -o value /dev/sdb1)
```

```diff showLineNumbers=false
<!-- /etc/conf.d/dmcrypt -->
+target=hdd1
+source=UUID='$UUID'
+key=/root/keyfile_hdd1
+wait=2
```

```sh
doas rc-update add dmcrypt boot
doas reboot
``` 
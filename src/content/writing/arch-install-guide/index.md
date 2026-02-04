---
title: Arch Linux install guide
description: Guide to installing Arch Linux with full disk encryption for UEFI systems
date: 2026-02-01
---

## Introduction

The goal of this guide is to set up a minimal installation of **Arch Linux** with **full disk encryption** on an **UEFI** system. This guide is meant to be read alongside the [Arch](https://wiki.archlinux.org/title/Installation_guide) wiki. It does not cover implementing [Secure Boot](https://wiki.archlinux.org/title/Unified_Extensible_Firmware_Interface/Secure_Boot#Implementing_Secure_Boot)

> [!info]
>
> - I'll **skip** the Arch ISO installation media preparation.
> - I **won't** prepare the system for **secure boot** because the procedure of custom key enrollment in the` BIOS
> - I'll use a **wired** connection, so no wireless configuration steps will be shown. If you want to connect to wifi, you can either use [`iwctl`](https://wiki.archlinux.org/title/Iwd#iwctl) (CLI) or install and launch [`impala`](https://github.com/pythops/impala) (TUI).

## Preliminary steps

### Check that we are in UEFI mode

If this command prints 64 or 32 then you are in UEFI

```sh
cat /sys/firmware/efi/fw_platform_size
```

## Update the system clock

```sh
# Check if ntp is active and if the time is right
timedatectl

# In case it's not active you can do
timedatectl set-ntp true
```

## Partition the disk

Throughout this guide `nvme0n1` will be used as the target install drive.
The drive will be separated into two partitions:

| Number | Type             | Size                       |
| ------ | ---------------- | -------------------------- |
| 1      | EFI              | 512 Mb                     |
| 2      | Linux Filesystem | All of the remaining space |

> [!warning]
> The following steps will wipe completely your `nvme0n1` drive

1. Run `gdisk`

```sh
gdisk /dev/nvme0n1
```

2. Press `x` to enter expert mode. Then press z to _zap_ our drive. Then hit y when prompted about wiping out GPT and blanking out MBR.

3. Run `gdisk`

```sh
gdisk /dev/nvme0n1
```

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
> NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
> nvme0n1     259:0    0 465,8G  0 disk
> ├─nvme0n1p1 259:1    0   512M  0 part
> └─nvme0n1p2 259:2    0 465,3G  0 part
> ```
>
> **`nvme0n1`** is the main disk
> **`nvme0n1p1`** is the boot partition
> **`nvme0n1p2`** is the root partition

## Encrypt root partition

1. Encrypt your root partition

> [!tip]
> Make sure to enter a secure passphrase and to write it down

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
mount -m /dev/nvme0n1p1 /mnt/boot -o dmask=0077,fmask=0077
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
pacstrap /mnt base base-devel linux linux-firmware efibootmgr doas neovim
```

> [!note]
> Install AMD or Intel microcode, depending on your system's CPU

### Microcode

AMD CPU

```sh
pacstrap /mnt amd-ucode
```

Intel CPU

```sh
pacstrap /mnt intel-ucode
```

## Generate file system table

```sh
genfstab -U /mnt >> /mnt/etc/fstab
```

Now edit `/mnt/etc/fstab` and change `fmask=0022,dmask=0022` to `fmask=0077,dmask=0077`.

## Switch to new Installation

```sh
arch-chroot /mnt
```

## Network stack

```sh
pacman -S networkmanager iwd
systemctl enable NetworkManager
```

```diff
<!-- /etc/NetworkManager/conf.d/wifi_backend.conf -->
+[device]
+wifi.backend=iwd
```

## Localization

### Set the locale

> [!tip]
> Feel free to change `en_US.UTF-8` to your preferred locale such as en_GB.UTF-8.`

1. Uncomment `en_US.UTF-8`

```diff
<!-- /etc/locale.gen -->
-#en_US.UTF-8 UTF-8
+en_US.UTF-8 UTF-8
```

2. Generate locales

```sh
echo 'LANG=en_US.UTF-8' > /etc/locale.conf
locale-gen
```

## Set the timezone

> [!example]
> `ln -sf /usr/share/zoneinfo/Asia/Dubai /etc/localtime`

```sh
ln -sf /usr/share/zoneinfo/YourRegion/YourCity /etc/localtime
```

## Set hardware clock from system clock

```sh
hwclock --systohc
```

## Hostname

Set your preferred hostname, I will be using `MYHOSTNAME` throughout this guide.

```sh
echo 'MYHOSTNAME' > /etc/hostname
```

```ini
<!-- /etc/hosts -->
# Static table lookup for hostnames.
# See hosts(5) for details.

127.0.0.1     localhost
::1           localhost
127.0.1.1     MYHOSTNAME.localdomain     MYHOSTNAME
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

```sh
useradd -m MYUSERNAME
passwd MYUSERNAME
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
+permit MYUSERNAME as root
+permit nopass MYUSERNAME as root cmd pacman
```

## Boot loader

> [!note]
> Use EFISTUB if you dont need to boot into multiple OS's as it will boot you directly into Arch (very fast) and use systemd-boot if you need to boot into multiple OS's.

Get the UUID of your root partition

```sh
blkid -s UUID -o value /dev/nvme0n1p2
```

> [!tip]
> Replace xxxx with the UUID that you just obtained.
>
> Replace `amd-ucode.img` with `intel-ucode.img` if you have an Intel CPU.

### EFISTUB

```sh
efibootmgr -c -d /dev/nvme0n1 -p 1 -l /vmlinuz-linux -L "Arch Linux" -u "cryptdevice=UUID=xxxx:root root=/dev/mapper/root rw initrd=\amd-ucode.img initrd=\initramfs-linux.img loglevel=3 quiet"
```

### Systemd-boot

#### Initramfs

Replace the `HOOKS` array with the following one

```ini
<!-- /etc/mkinitcpio.conf -->
HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole sd-encrypt block filesystems fsck)
```

Regenerate initramfs images

```sh
mkinitcpio -P
```

#### Installation

```sh
bootctl install
```

```ini
<!-- /boot/loader/entries/arch.conf -->
title   Arch Linux
linux   /vmlinuz-linux
initrd  /amd-ucode.img
initrd  /initramfs-linux.img
options rd.luks.name=xxxx=root root=/dev/mapper/root rw loglevel=3 quiet
```

```diff
<!-- /boot/loader/loader.conf -->
-#timeout 3
+timeout 3
#console-mode keep
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
Login using the credentials that you set, if you followed the example your username would be `MYUSERNAME`.

### Swap

```sh
doas fallocate -l 4G /swapfile
doas chmod 600 /swapfile
doas mkswap /swapfile
doas swapon /swapfile
doas cp /etc/fstab /etc/fstab.bak
echo '/swapfile none swap sw 0 0' | doas tee -a /etc/fstab
```

### Video drivers

#### AMD

```
doas pacman -S mesa linux-firmware-amdgpu vulkan-radeon
```

#### Intel

```
doas pacman -S mesa linux-firmware-intel vulkan-intel
```

#### Nvidia

https://wiki.archlinux.org/title/NVIDIA

https://wiki.hypr.land/Nvidia

### Sort for fastest mirrors

```sh
doas pacman -Syu reflector
doas reflector --verbose -p https -l 30 -f 5 --sort rate --save /etc/pacman.d/mirrorlist
```

### AUR

#### Add Chaotic-AUR

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

#### Install paru

```sh
doas pacman -Syu
doas pacman -S paru
```

### Replace sudo with doas

```sh
doas pacman -Rdd sudo
doas ln -s /usr/bin/doas /usr/bin/sudo
```

### Laptop power profiles

Install and enable the powerprofiles daemon

```sh
pacman -S power-profiles-daemon
systemctl enable power-profiles-daemon
systemctl start power-profiles-daemon start
```

### MAC randomization

> [!info]
> MAC randomization can be used for increased privacy by not disclosing your real MAC address to the WiFi network.

```text
<!-- /etc/NetworkManager/conf.d/00-macrandomize.conf -->
[device-mac-randomization]
wifi.scan-rand-mac-address=yes

[connection-mac-randomization]
ethernet.cloned-mac-address=random
wifi.cloned-mac-address=random
```

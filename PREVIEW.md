## Supernova desktop and mobile preview

This build includes touch-friendly collection screens, a persistent mobile music player, and shared Supernova server features. Use a trusted HTTPS Supernova server URL on iOS and Android. Server plugins appear when your server reports them enabled. Open **Settings → Server** to check plugin status.

### iPhone and iPad

1. Download `Supernova-unsigned.ipa` and save it in Files. If downloading from a GitHub Actions artifact, extract the outer ZIP first.
2. If you already have SideStore, connect LocalDevVPN while on Wi-Fi. In SideStore, open **My Apps → +** and choose the IPA. Use the same Apple Account you used for your previous Supernova build.
3. If this is your first time using SideStore, use iloader and a USB data cable for the initial setup. Complete the trust, Developer Mode, and first refresh steps in the [official SideStore guide](https://docs.sidestore.io/docs/installation/install). After setup you can install and refresh Supernova directly from your iPhone.
4. With a free Apple Account, refresh the app in SideStore before its seven-day signing period expires.

### Android

1. Download and open `Supernova-Android.apk`. Extract the outer ZIP first if you downloaded a GitHub Actions artifact.
2. If Android prompts you, allow **Install unknown apps** for the browser or file manager that opened it.
3. The preview APK uses a CI debug signing key. If Android reports a signature conflict with an older preview, uninstall that preview first. Uninstalling also removes the app's local data, so expect to sign in again.

### Linux desktop (x86-64)

From the directory containing the download, use the command for your package.

**Ubuntu/Debian**

```sh
sudo apt install ./Supernova-Desktop-amd64.deb
```

**Fedora**

```sh
sudo dnf install ./Supernova-Desktop-x86_64.rpm
```

**AppImage**

```sh
chmod +x Supernova-Desktop-x86_64.AppImage
./Supernova-Desktop-x86_64.AppImage
```

If FUSE is unavailable, run the AppImage with `--appimage-extract-and-run`.

### Verify downloads

Download `SHA256SUMS` next to the packages and run `sha256sum --ignore-missing -c SHA256SUMS`.

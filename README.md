# GNOME PiP Always on Top

<p align="center">
  <img src="assets/pip-workspaces.png" alt="GNOME PiP Always on Top icon" width="240">
</p>

<p align="center">
  <a href="https://extensions.gnome.org/extension/11141/gnome-pip-always-on-top/">Install from GNOME Extensions</a>
</p>

Keep browser Picture-in-Picture videos visible above your normal windows and available on every GNOME workspace.

## Features

- Keeps PiP windows above normal windows.
- Shows PiP windows on every workspace.
- Preserves the same position and size when switching workspaces.
- Supports multiple PiP windows at the same time.
- Restores the original window state when the extension is disabled.
- English fallback with translations for Italian, German, Spanish, French, Brazilian Portuguese, Russian, Simplified Chinese, Japanese, and Korean.

## Install

Install it from the [GNOME Extensions marketplace](https://extensions.gnome.org/extension/11141/gnome-pip-always-on-top/).

You can also download a package from the [GitHub Releases page](https://github.com/Giuseppe-Compagnone/gnome-pip-always-on-top/releases) and install it with the GNOME Extensions app or:

```bash
gnome-extensions install --force pip-always-on-top@giuseppe.shell-extension.zip
gnome-extensions enable pip-always-on-top@giuseppe
```

## How to use

1. Open a video in your browser's Picture-in-Picture mode.
2. The extension detects the PiP window automatically.
3. Move or resize the window once; its position and size remain consistent across workspaces.

No configuration is required.

## Supported browsers

Firefox, Chromium, Google Chrome, Brave, Microsoft Edge, Vivaldi, and Opera are supported when they expose a recognizable PiP window title or window class.

## Compatibility and limitations

- GNOME Shell 45, 46, 47, 48, and 49.
- GNOME and Mutter do not expose a numeric `z-index`. The extension uses the highest always-on-top level available to a normal window.
- System overlays, exclusive fullscreen surfaces, and some compositor-owned windows can still appear above the PiP window.
- Browser-specific or heavily customized PiP windows may not be detected automatically.

## Privacy

The extension runs locally, does not collect data, and does not make network requests.

## License

MIT. See [LICENSE](LICENSE).

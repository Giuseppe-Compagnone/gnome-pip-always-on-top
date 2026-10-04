# GNOME PiP Always on Top

GNOME Shell extension that keeps browser Picture-in-Picture windows above normal windows, visible on every workspace, and synchronized to one position and size.

## Features

- Detects Picture-in-Picture windows from Firefox, Chromium, Chrome, Brave, Edge, Vivaldi, and Opera.
- Keeps matching windows above normal windows using Mutter's `above` state.
- Raises the PiP window within the always-on-top layer when the compositor permits it.
- Makes the window sticky so it is visible on every workspace.
- Preserves one position and size across workspace switches.
- Restores the window's original `above` and workspace state when the extension is disabled.
- Includes gettext translations for Italian, German, Spanish, French, Brazilian Portuguese, Russian, Simplified Chinese, Japanese, and Korean. English is the fallback language.

## Requirements

- GNOME Shell 45, 46, 47, 48, or 49.
- A browser that exposes its Picture-in-Picture window through a recognizable title or window class.

## Install locally

From the repository root:

```bash
sudo apt install gettext gnome-shell
bash scripts/build-extension.sh
gnome-extensions install --force dist/pip-always-on-top@giuseppe.shell-extension.zip
gnome-extensions enable pip-always-on-top@giuseppe
```

If GNOME Shell does not discover the extension immediately, log out and back in. On X11, restarting GNOME Shell with `Alt+F2`, then `r`, is also possible.

## How detection works

The extension periodically scans managed windows and checks their title and WM class for common Picture-in-Picture identifiers. It also listens for new windows, title changes, workspace switches, and geometry changes.

GNOME and Mutter do not expose a numeric `z-index` to extensions. `make_above()` is the highest normal-window layer available to an extension, while `raise()` keeps the PiP window at the top of that layer when supported. System overlays, exclusive fullscreen surfaces, and compositor-owned UI can still take precedence.

## Build

Install the gettext compiler and GNOME Shell tools, then run:

```bash
sudo apt install gettext gnome-shell
bash scripts/build-extension.sh
```

The resulting package is written to `dist/pip-always-on-top@giuseppe.shell-extension.zip` and contains the compiled translations under `locale/`.

## GitHub Actions

The workflow in `.github/workflows/build-and-publish.yml` runs on every commit pushed to `main` and can also be started manually. It:

1. validates the metadata and JavaScript;
2. compiles the gettext translations;
3. builds and verifies the GNOME extension bundle;
4. uploads the `.shell-extension.zip` as a downloadable GitHub Actions artifact;
5. publishes the extension to [extensions.gnome.org](https://extensions.gnome.org/) when the publishing secrets are configured.

To enable publishing, configure these repository secrets:

- `GNOME_EXTENSIONS_USERNAME`: your extensions.gnome.org account username;
- `GNOME_EXTENSIONS_PASSWORD`: your extensions.gnome.org account password.

The workflow sends `accept-tos: true` to the publishing action. Make sure the account has already accepted the GNOME Extensions Developer Agreement before enabling the workflow.

The publish step uses the community-maintained [`murar8/gnome-extensions-action`](https://github.com/murar8/gnome-extensions-action). Without these secrets, the build and artifact upload still run, while the market publish job is skipped.

The `url` field in `metadata.json` points to the expected public GitHub repository URL. Update it if the repository is published under a different GitHub owner or organization.

## Development checks

```bash
python3 -m json.tool metadata.json >/dev/null
node --check extension.js
bash scripts/build-extension.sh
unzip -t dist/pip-always-on-top@giuseppe.shell-extension.zip
```

## License

MIT. See [LICENSE](LICENSE).

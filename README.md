# PiP On Top

Estensione GNOME Shell che riconosce le finestre Picture-in-Picture dei browser e le mantiene:

- sempre sopra le normali finestre (`above` / always-on-top);
- visibili in tutti i workspace (`sticky`);
- nella stessa posizione e con la stessa dimensione mentre si cambia workspace.

## Installazione locale

```bash
mkdir -p ~/.local/share/gnome-shell/extensions/pip-ontop@giuseppe
cp -a ./* ~/.local/share/gnome-shell/extensions/pip-ontop@giuseppe/
gnome-extensions enable pip-ontop@giuseppe
```

Per ricaricare l'estensione dopo una modifica:

```bash
gnome-extensions disable pip-ontop@giuseppe
gnome-extensions enable pip-ontop@giuseppe
```

Su GNOME con sessione X11 può essere necessario riavviare GNOME Shell con `Alt+F2`, poi `r`.
Con Wayland è sufficiente disabilitare e riabilitare l'estensione oppure disconnettersi e riconnettersi.

## Rilevamento

Il rilevamento è automatico e non richiede permessi esterni. L'estensione cerca nei titoli e nelle classi delle finestre gli identificatori normalmente usati da Firefox, Chromium, Chrome, Brave, Edge, Vivaldi e Opera.

GNOME Shell non offre un vero indice numerico `z-index`: `make_above()` è il livello massimo esposto a un'estensione per una finestra normale. Finestre di sistema, overlay esclusivi e alcune superfici fullscreen possono comunque avere precedenza per decisione di Mutter o del compositore.

## Sviluppo

Il progetto non ha dipendenze di runtime. Il controllo più semplice è:

```bash
python3 -m json.tool metadata.json
```

## Licenza

MIT. Vedi [LICENSE](LICENSE).

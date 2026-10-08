/*
 * PiP On Top — GNOME Shell extension
 *
 * GNOME/Mutter non espone un "z-index" numerico alle estensioni. La modalità
 * above è il livello più alto disponibile per una normale finestra gestita
 * dal window manager.
 */

import Meta from 'gi://Meta';
import GLib from 'gi://GLib';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const SCAN_INTERVAL_SECONDS = 2;
const REAPPLY_INTERVAL_SECONDS = 5;

const PIP_TOKENS = [
    'picture-in-picture',
    'picture in picture',
    'picture_in_picture',
    'pictureinpicture',
    'pip window',
];

const BROWSER_CLASSES = [
    'firefox',
    'google-chrome',
    'chromium',
    'chromium-browser',
    'brave-browser',
    'microsoft-edge',
    'vivaldi-stable',
    'opera',
];

const BROWSER_APP_IDS = [
    'org.mozilla.firefox',
    'com.google.chrome',
    'org.chromium.chromium',
    'com.brave.browser',
    'com.microsoft.edge',
    'com.vivaldi.vivaldi',
    'com.operasoftware.opera',
];

function normalized(value) {
    return String(value ?? '').trim().toLowerCase();
}

function windowType(window) {
    return window.get_window_type?.() ?? window.window_type;
}

function isWindowAlive(window) {
    return Boolean(window?.is_alive ?? true);
}

function isPictureInPicture(window) {
    if (!window || windowType(window) === Meta.WindowType.DESKTOP) {
        return false;
    }

    const title = normalized(window.get_title?.());
    const wmClass = normalized(window.get_wm_class?.());
    const wmClassInstance = normalized(window.get_wm_class_instance?.());
    const gtkAppId = normalized(window.get_gtk_application_id?.());
    const sandboxedAppId = normalized(window.get_sandboxed_app_id?.());
    const haystack = `${title} ${wmClass} ${wmClassInstance} ${gtkAppId} ${sandboxedAppId}`;

    // I browser usano generalmente il titolo della finestra per il PiP.
    if (PIP_TOKENS.some(token => haystack.includes(token))) {
        return true;
    }

    // Fallback per alcune versioni di Chromium/Firefox che marcano il PiP
    // come dialogo senza mantenere "Picture-in-Picture" nel titolo.
    const isBrowser = [...BROWSER_CLASSES, ...BROWSER_APP_IDS].some(browserId =>
        wmClass === browserId || wmClassInstance === browserId ||
        gtkAppId === browserId || sandboxedAppId === browserId);
    const isDialog = windowType(window) === Meta.WindowType.DIALOG;
    return isBrowser && isDialog && /\bpip\b|picture/.test(title);
}

function getFrameGeometry(window) {
    const rect = window.get_frame_rect();
    return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
    };
}

export default class PiPOnTopExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._signals = [];
        this._managed = new Map();
        this._scanSource = null;
        this._reapplySource = null;
    }

    enable() {
        this._signals.push([
            global.display,
            global.display.connect('window-created', (_display, window) => {
                this._watchWindow(window);
                this._scanWindows();
            }),
        ]);

        this._signals.push([
            global.workspace_manager,
            global.workspace_manager.connect('workspace-switched', () => {
                // Una finestra sticky non dovrebbe cambiare workspace, ma il
                // riesame rende l'estensione robusta ai cambiamenti esterni.
                this._scanWindows();
            }),
        ]);

        this._scanSource = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            SCAN_INTERVAL_SECONDS,
            () => {
                this._scanWindows();
                return GLib.SOURCE_CONTINUE;
            },
        );

        this._reapplySource = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            REAPPLY_INTERVAL_SECONDS,
            () => {
                for (const window of this._managed.keys()) {
                    this._applyWindowState(window);
                }
                return GLib.SOURCE_CONTINUE;
            },
        );

        this._scanWindows();
    }

    disable() {
        if (this._scanSource !== null) {
            GLib.Source.remove(this._scanSource);
            this._scanSource = null;
        }

        if (this._reapplySource !== null) {
            GLib.Source.remove(this._reapplySource);
            this._reapplySource = null;
        }

        for (const [window, state] of this._managed) {
            this._disconnectWindow(state);
            this._restoreWindowState(window, state);
        }
        this._managed.clear();

        for (const [object, id] of this._signals) {
            object.disconnect(id);
        }
        this._signals = [];
    }

    _scanWindows() {
        for (const actor of global.get_window_actors()) {
            this._watchWindow(actor.meta_window);
        }
    }

    _watchWindow(window) {
        if (!window || !isWindowAlive(window)) {
            return;
        }

        if (!isPictureInPicture(window)) {
            if (this._managed.has(window)) {
                this._unmanageWindow(window);
            }
            return;
        }

        if (this._managed.has(window)) {
            this._applyWindowState(window);
            return;
        }

        const state = {
            originalAbove: window.is_above?.() ?? false,
            originalSticky: window.is_on_all_workspaces?.() ?? false,
            geometry: getFrameGeometry(window),
            signals: [],
        };

        this._managed.set(window, state);

        state.signals.push([
            window,
            window.connect('notify::title', () => this._watchWindow(window)),
        ]);
        state.signals.push([
            window,
            window.connect('position-changed', () => this._rememberGeometry(window)),
        ]);
        state.signals.push([
            window,
            window.connect('size-changed', () => this._rememberGeometry(window)),
        ]);
        state.signals.push([
            window,
            window.connect('notify::above', () => {
                if (!window.is_above?.()) {
                    this._applyWindowState(window);
                }
            }),
        ]);
        state.signals.push([
            window,
            window.connect('notify::on-all-workspaces', () => {
                if (!window.is_on_all_workspaces?.()) {
                    this._applyWindowState(window);
                }
            }),
        ]);
        state.signals.push([
            window,
            window.connect('unmanaged', () => this._forgetWindow(window)),
        ]);

        this._applyWindowState(window);
    }

    _rememberGeometry(window) {
        const state = this._managed.get(window);
        if (state && isWindowAlive(window)) {
            state.geometry = getFrameGeometry(window);
        }
    }

    _applyWindowState(window) {
        const state = this._managed.get(window);
        if (!state || !isWindowAlive(window)) {
            return;
        }

        if (!window.is_above?.()) {
            window.make_above();
        }

        if (!window.is_on_all_workspaces?.()) {
            window.stick();
        }

        // `above` definisce il livello; `raise` la porta in cima a quel
        // livello.
        window.raise();

        const current = getFrameGeometry(window);
        const target = state.geometry;
        if (current.x !== target.x || current.y !== target.y ||
            current.width !== target.width || current.height !== target.height) {
            window.move_resize_frame(
                true,
                target.x,
                target.y,
                target.width,
                target.height,
            );
        }
    }

    _unmanageWindow(window) {
        const state = this._managed.get(window);
        if (!state) {
            return;
        }
        this._disconnectWindow(state);
        this._restoreWindowState(window, state);
        this._managed.delete(window);
    }

    _forgetWindow(window) {
        const state = this._managed.get(window);
        if (!state) {
            return;
        }
        this._disconnectWindow(state);
        this._managed.delete(window);
    }

    _disconnectWindow(state) {
        for (const [object, id] of state.signals) {
            object.disconnect(id);
        }
        state.signals = [];
    }

    _restoreWindowState(window, state) {
        if (!isWindowAlive(window)) {
            return;
        }

        if (!state.originalAbove && window.is_above?.()) {
            window.unmake_above();
        }

        if (!state.originalSticky && window.is_on_all_workspaces?.()) {
            window.unstick();
        }
    }
}

/**
 * Solari - IPC API Bridge
 *
 * Single source of truth for all IPC communication from the Renderer.
 * Instead of scattering ipcRenderer.send/invoke calls throughout the
 * codebase, every interaction with the Main Process goes through this module.
 *
 * Usage:
 *   const api = require('./api');
 *   api.settings.save({ startWithWindows: true });
 *   const version = await api.app.getVersion();
 *
 * @module api
 */

'use strict';

const { ipcRenderer, shell } = require('electron');

// ───────────────────────────────────────────────────────────────────────────
// Core helpers
// ───────────────────────────────────────────────────────────────────────────

/**
 * Fire-and-forget IPC send (no response expected).
 * @param {string} channel
 * @param {...*} args
 */
const send = (channel, ...args) => ipcRenderer.send(channel, ...args);

/**
 * Invoke IPC and return a Promise with the result.
 * @param {string} channel
 * @param {*} [data]
 * @returns {Promise<*>}
 */
const invoke = (channel, data) => ipcRenderer.invoke(channel, data);

/**
 * Register a listener for an incoming IPC event.
 * Returns a cleanup function that removes the listener.
 * @param {string} channel
 * @param {function} handler  Receives (...args) — event object is stripped.
 * @returns {function}  Call to unsubscribe.
 */
const on = (channel, handler) => {
    const wrapper = (_event, ...args) => handler(...args);
    ipcRenderer.on(channel, wrapper);
    return () => ipcRenderer.removeListener(channel, wrapper);
};

// ───────────────────────────────────────────────────────────────────────────
// API Namespaces
// ───────────────────────────────────────────────────────────────────────────

const api = {

    // ── Application ─────────────────────────────────────────────────────────
    app: {
        /** Get current app version from main process. */
        getVersion: () => invoke('get-app-version'),
        /** Get data for initial load. */
        getData: () => send('get-data'),
        /** Get current theme. */
        getTheme: () => send('get-theme'),
        /** Open the auto-detect settings window. */
        openAutoDetect: () => send('open-autodetect-settings'),
        /** Open the developer tools. */
        toggleDevTools: () => send('toggle-devtools'),
        /** Mark the setup wizard as complete. */
        completeSetup: () => send('complete-setup'),
        /** Uninstall the application. */
        uninstall: () => send('uninstall-app'),

        /** Listen for initial data load. */
        onDataLoaded: (handler) => on('data-loaded', handler),
        /** Listen for data synchronization events. */
        onDataSynced: (handler) => on('app-data-synced', handler),
        /** Listen for the setup wizard trigger. */
        onRunWizard: (handler) => on('run-setup-wizard', handler),
        /** Listen for toast notifications from main. */
        onToast: (handler) => on('show-toast', handler),
        /** Listen for changelog modal trigger. */
        onChangelog: (handler) => on('show-changelog', handler),
        /** Listen for theme loads. */
        onThemeLoaded: (handler) => on('theme-loaded', handler),
    },

    // ── Settings ────────────────────────────────────────────────────────────
    settings: {
        /**
         * Persist one or more setting values.
         * @param {object} patch  e.g. { startWithWindows: true }
         */
        save: (patch) => send('save-app-settings', patch),
        /**
         * Set a single setting key/value pair.
         * @param {string} key
         * @param {*} value
         */
        set: (key, value) => send('set-setting', key, value),
        /** Save the active theme. */
        saveTheme: (theme) => send('save-theme', theme),
        /** Save eco mode state. */
        saveEcoMode: (enabled) => send('save-eco-mode', enabled),
        /** Save selected language code. */
        saveLanguage: (lang) => send('save-language', lang),
        /** Get the current language code. */
        getLanguage: () => invoke('get-current-language'),
        /** Get the global client ID. */
        getClientId: () => invoke('get-client-id'),
        /** Set the global client ID. */
        setClientId: (id) => send('set-client-id', id),

        /** Listen for language change events. */
        onLanguageChanged: (handler) => on('language-changed', handler),
    },

    // ── Rich Presence / Activity ─────────────────────────────────────────────
    rpc: {
        /** Send a new activity to Discord RPC. */
        updateActivity: (activity) => send('update-activity', activity),
        /** Toggle RPC on/off. */
        toggle: (enabled) => send('toggle-activity', enabled),
        /** Clear manual mode and return to auto-detect. */
        exitManualMode: () => send('exit-manual-mode'),
        /** Reset/clear the current activity. */
        reset: () => send('reset-activity'),
        /** Save default fallback activity. */
        saveDefault: (activity) => send('save-default', activity),
        /** Save form state for restoration. */
        saveFormState: (state) => send('save-form-state', state),

        /** Listen for RPC connection status changes. */
        onStatus: (handler) => on('rpc-status', handler),
        /** Listen for app name resolution from Discord API. */
        onAppNameLoaded: (handler) => on('app-name-loaded', handler),
        /** Listen for manual mode changes. */
        onManualModeChanged: (handler) => on('manual-mode-changed', handler),
    },

    // ── Presets ─────────────────────────────────────────────────────────────
    presets: {
        /** Save a new preset. */
        save: (preset) => send('save-preset', preset),
        /** Update an existing preset by index. */
        update: (index, preset) => send('update-preset', { index, preset }),
        /** Delete a preset by index. */
        delete: (index) => send('delete-preset', index),
        /** Update priority settings. */
        savePriorities: (priorities) => send('update-priority-settings', priorities),

        /** Listen for preset list updates. */
        onUpdated: (handler) => on('presets-updated', handler),
        /** Listen for auto-loaded preset notification. */
        onAutoLoaded: (handler) => on('preset-auto-loaded', handler),
    },

    // ── Auto-Detect ──────────────────────────────────────────────────────────
    autoDetect: {
        /** Toggle auto-detect on/off. */
        toggle: (enabled) => send('toggle-autodetect', enabled),

        /** Listen for auto-detect toggle events. */
        onToggled: (handler) => on('autodetect-toggled', handler),
    },

    // ── Identities (App Profiles) ────────────────────────────────────────────
    identities: {
        /** Get all app profiles. */
        getAll: () => invoke('get-identities'),
        /** Get the global client ID. */
        getGlobalClientId: () => invoke('get-global-client-id'),
        /** Set the global client ID. */
        setGlobalClientId: (id) => invoke('set-global-client-id', id),
        /** Add or update an identity. */
        add: (identity) => invoke('add-identity', identity),
        /** Delete an identity by ID. */
        delete: (id) => invoke('delete-identity', id),
    },

    // ── Plugins & BetterDiscord ──────────────────────────────────────────────
    plugins: {
        /** Get BD installation status. */
        getBDStatus: () => invoke('bd:get-status'),
        /** Check for BD update. */
        checkBDUpdate: () => invoke('bd:check-update'),
        /** Get list of installed BD plugins. */
        getPlugins: () => invoke('bd:get-plugins'),
        /** Enable or disable a plugin. */
        togglePlugin: (pluginName, enabled) => invoke('bd:toggle-plugin', { pluginName, enabled }),
        /** Install BetterDiscord. */
        installBD: () => invoke('plugin:install-bd'),
        /** Uninstall BetterDiscord. */
        uninstallBD: () => invoke('plugin:uninstall-bd'),
        /** Check if a plugin is installed. */
        checkInstalled: (fileName) => invoke('plugin:check-installed', fileName),
        /** Get locally installed plugin version. */
        getVersion: (fileName) => invoke('plugin:get-version', fileName),
        /** Get remote plugin version from URL. */
        getRemoteVersion: (url) => invoke('plugin:get-remote-version', url),
        /** Download and install a plugin. */
        download: (url, fileName) => invoke('plugin:download', { url, fileName }),
        /** Delete a plugin file. */
        delete: (fileName) => invoke('plugin:delete', fileName),
        /** Get BD runtime connection status (from SolariManager). */
        getRuntimeStatus: () => invoke('bd:get-runtime-status'),
        /** Toggle plugin feature (smartAfk, spotify). */
        toggleFeature: (feature, enabled) => send('plugin:toggle', feature, enabled),

        /** Listen for plugin list updates. */
        onListUpdated: (handler) => on('plugin-list-updated', handler),
        /** Listen for blocked plugin list updates. */
        onBlockedUpdated: (handler) => on('blocked-list-updated', handler),
        /** Listen for local plugin file changes. */
        onLocalChange: (handler) => on('plugins:local-change', handler),
        /** Listen for plugin update notifications. */
        onPluginsUpdated: (handler) => on('plugins-updated', handler),
        /** Listen for BD status updates. */
        onBDStatusUpdate: (handler) => on('bd-status-update', handler),
        /** Listen for BD runtime status updates. */
        onBDRuntimeStatus: (handler) => on('bd-runtime-status', handler),
        /** Listen for BD plugin list updates. */
        onBDPluginsUpdate: (handler) => on('bd-plugins-update', handler),
        /** Listen for user info updates. */
        onUserInfoUpdated: (handler) => on('user-info-updated', handler),
    },

    // ── Spotify ──────────────────────────────────────────────────────────────
    spotify: {
        /** Trigger Spotify login auth flow. */
        login: () => send('spotify-login'),
        /** Finish Spotify auth with code/URL. */
        finishAuth: (code) => send('spotify-finish-auth', code),
        /** Logout from Spotify. */
        logout: () => send('spotify-logout'),
        /** Set Spotify Client ID. */
        setClientId: (id) => send('set-spotify-client-id', id),
        /** Send a playback control command. */
        control: (action) => send('spotify-control', action),
        /** Update Spotify plugin settings. */
        saveSettings: (settings) => send('update-spotify-settings', settings),
        /** Update Spotify plugin internal settings. */
        savePluginSettings: (settings) => send('update-spotify-plugin-settings', settings),
        /** Request Spotify data. */
        getData: () => send('get-spotify-data'),

        /** Listen for Spotify status updates. */
        onStatusUpdate: (handler) => on('spotify-status-update', handler),
        /** Listen for Spotify data load events. */
        onDataLoaded: (handler) => on('spotify-data-loaded', handler),
        /** Listen for Spotify config changes. */
        onConfigUpdated: (handler) => on('spotify-config-updated', handler),
        /** Listen for track changes. */
        onTrackUpdated: (handler) => on('spotify-track-updated', handler),
    },

    // ── Hardware Monitor ─────────────────────────────────────────────────────
    hardware: {
        /** Toggle HW monitor on/off. */
        toggle: (enabled) => invoke('hw-monitor:toggle', enabled),
        /** Get current hardware stats. */
        getStats: () => invoke('hw-monitor:get-stats'),
        /** Get HW monitor settings. */
        getSettings: () => invoke('hw-monitor:get-settings'),
        /** Save HW monitor display settings. */
        saveSettings: (settings) => invoke('hw-monitor:save-settings', settings),

        /** Listen for hardware stats updates. */
        onStatsUpdate: (handler) => on('hw-stats-update', handler),
    },

    // ── AFK ──────────────────────────────────────────────────────────────────
    afk: {
        /** Update AFK settings. */
        saveSettings: (settings) => send('update-afk-settings', settings),

        /** Listen for AFK log updates. */
        onLogsUpdated: (handler) => on('afk-logs-updated', handler),
        /** Listen for AFK config updates. */
        onConfigUpdated: (handler) => on('afk-config-updated', handler),
        /** Listen for system AFK state changes. */
        onSystemUpdate: (handler) => on('system-afk-update', handler),
    },

    // ── Updater ──────────────────────────────────────────────────────────────
    updater: {
        /** Trigger manual update check with dialog. */
        check: () => send('trigger-update-check'),
        /** Trigger update download via splash. */
        triggerViaSplash: () => send('trigger-update-via-splash'),
        /** Silent update check (returns {hasUpdate, latestVersion, currentVersion}). */
        checkSilent: () => invoke('check-update-silent'),
        /** Open changelog page in browser. */
        openChangelog: () => send('request-changelog'),
    },

    // ── Network ──────────────────────────────────────────────────────────────
    net: {
        /** Fetch a remote resource via main process. */
        fetch: (url) => invoke('net:fetch-resource', url),
        /** Resolve an Imgur URL to a direct image link. */
        resolveImgur: (url) => invoke('resolve-imgur-url', url),
    },

    // ── Export / Import ──────────────────────────────────────────────────────
    data: {
        exportLogs: () => invoke('export-logs'),
        exportPresets: () => invoke('export-presets'),
        importPresets: () => invoke('import-presets'),
    },

    // ── Shell ────────────────────────────────────────────────────────────────
    shell: {
        /**
         * Open a URL in the default browser.
         * Only http/https are allowed.
         * @param {string} url
         */
        openExternal: (url) => {
            try {
                const protocol = new URL(url).protocol;
                if (['https:', 'http:'].includes(protocol)) shell.openExternal(url);
            } catch { /* invalid URL */ }
        }
    }
};

module.exports = api;

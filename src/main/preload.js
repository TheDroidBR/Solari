const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // IPC Messages (Outgoing from Renderer)
    send: (channel, data) => {
        const validChannels = [
            'get-data', 
            'save-app-settings', 
            'save-eco-mode', 
            'complete-setup', 
            'set-client-id', 
            'trigger-update-check',
            'trigger-update-via-splash',
            'request-changelog',
            'spotify-login',
            'spotify-finish-auth',
            'spotify-logout',
            'set-spotify-client-id',
            'save-language',
            'save-theme',
            'get-theme',
            'update-priority-settings',
            'spotify-control',
            'update-activity',
            'exit-manual-mode',
            'toggle-activity',
            'uninstall-app'
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    // IPC Listeners (Incoming to Renderer)
    on: (channel, func) => {
        const validChannels = [
            'data-loaded', 
            'app-data-synced', 
            'user-info-updated', 
            'afk-logs-updated', 
            'afk-config-updated',
            'spotify-status-update',
            'spotify-data-loaded',
            'spotify-config-updated',
            'notes-data-loaded',
            'notes-status-update',
            'update-status',
            'download-progress',
            'show-changelog',
            'show-toast',
            'language-changed',
            'preset-auto-loaded',
            'autodetect-toggled',
            'system-afk-update',
            'plugin-list-updated',
            'blocked-list-updated',
            'presets-updated',
            'soundboard:play-from-hotkey',
            'soundboard:play-direct',
            'plugins:local-change',
            'bd-status-update',
            'hw-stats-update',
            'ws-status',
            'manual-mode-changed',
            'rpc-status',
            'plugins-updated',
            'app-name-loaded',
            'run-setup-wizard',
            'theme-loaded',
            'spotify-track-updated',
            'bd-runtime-status',
            'bd-plugins-update'
        ];
        if (validChannels.includes(channel)) {
            // Use a specific wrapper to allow removal if needed
            const subscription = (event, ...args) => func(...args);
            ipcRenderer.on(channel, subscription);
            return subscription;
        }
    },
    // Remove specific listener
    off: (channel, subscription) => {
        ipcRenderer.removeListener(channel, subscription);
    },
    // Remove all listeners for a channel
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    },
    invoke: (channel, data) => {
        const validChannels = [
            'get-current-language',
            'get-spotify-status',
            'get-identities',
            'get-global-client-id',
            'set-global-client-id',
            'add-identity',
            'delete-identity',
            'check-update-silent',
            'soundboard:check-driver-installed',
            'get-client-id',
            'net:fetch-resource',
            'plugins:fetch-bypass',
            // SoundBoard handlers
            'soundboard:get-sounds',
            'soundboard:get-settings',
            'soundboard:get-categories',
            'soundboard:get-history',
            'soundboard:get-server-port',
            'soundboard:get-sound-data',
            'soundboard:stop-all',
            'soundboard:refresh-shortcuts',
            // Export/Import
            'export-logs',
            'export-presets',
            'import-presets',
            // BD / Plugin Management
            'bd:get-status',
            'bd:check-update',
            'bd:toggle-plugin',
            'bd:get-plugins',
            'plugin:check-bd',
            'plugin:install-bd',
            'plugin:uninstall-bd'
        ];
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, data);
        }
    },
    // Shell interactions (SEC-02: only allow http/https protocols)
    openExternal: (url) => {
        try {
            const parsed = new URL(url);
            if (['https:', 'http:'].includes(parsed.protocol)) {
                shell.openExternal(url);
            }
        } catch (e) {
            // Invalid URL, ignore
        }
    }
});

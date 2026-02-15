/*
 * Solari RPC - Premium Discord Rich Presence Manager
 * Copyright (C) 2026 TheDroid
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, shell, powerMonitor, globalShortcut, dialog } = require('electron');
app.setName('Solari');
app.setPath('userData', require('path').join(require('os').homedir(), 'AppData', 'Roaming', 'Solari'));

// Single Instance Lock - Prevent multiple Solari processes
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    console.log('[Solari] Another instance is already running. Quitting this one.');
    app.quit();
    process.exit(0); // Force exit the process immediately
}

app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
    }
});

const path = require('path');
const DiscordRPC = require('discord-rpc');
const WebSocket = require('ws');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const { installUpdateAndRestart } = require('./updater');
const CONSTANTS = require('./constants');
let SoundBoard = null;
let SoundServer = null;


let mainWindow;
let autoDetectWindow = null;
let tray = null;
let rpcClient;
let rpcConnected = false; // Track if RPC is actually connected
let wss;
let isEnabled = true;
let isQuitting = false;
let consoleVisible = true; // Track console window visibility

// Debug log collection
const debugLogs = [];

function addLog(message) {
    const timestamp = new Date().toISOString();
    debugLogs.push(`[${timestamp}] ${message}`);
    if (debugLogs.length > CONSTANTS.MAX_LOGS) {
        debugLogs.shift();
    }
    console.log(message);
}


let currentActivity = {};
let defaultActivity = {};
let presets = [];
let updateTimeout = null;
let lastFormState = {};

// Auto-detection state
let autoDetectEnabled = false;
let autoDetectMappings = [];
let websiteMappings = [];
let setupCompleted = false; // Track if wizard has run
let useExtensionForWeb = true; // true = use extension, false = use autoDetect websites
let websiteCheckFailCount = 0; // Debounce counter for website detection failures

// Spotify API State
let spotifyClientId = '';
let spotifyTokens = { accessToken: null, refreshToken: null, tokenExpiry: 0 };
let autoDetectInterval = null;
let currentDetectedProcess = null;
let currentDetectedWebsite = null;
let currentDetectedPresetName = null; // Track preset name for AFK disable check
let currentAutoDetectPreset = null; // Store the actual preset object to load when autoDetect has priority
let fallbackPresetIndex = -1;

// Process check mutex and backoff to prevent quota violation
let isProcessCheckRunning = false;
let isBrowserCheckRunning = false;
let processCheckErrorCount = 0;
let processCheckBackoffUntil = 0;
// Note: MAX_PROCESS_CHECK_ERRORS and BACKOFF_DURATION_MS are defined in constants.js

let appSettings = {
    startWithWindows: false,
    startMinimized: false,
    closeToTray: false,
    language: 'en', // 'en' or 'pt-BR'
    dontRemindAdmin: false, // Don't show admin warning
    theme: 'default', // 'default', 'dark', 'light'
    autoCheckAppUpdates: true,
    autoCheckPluginUpdates: true
};

let connectedPlugins = new Map();
let pluginIdCounter = 1;
let blockedPlugins = new Set();

// SoundBoard
let soundBoard = null;
let soundServer = null;

// System-wide AFK detection
let systemAFKCheckInterval = null;
let systemAFKSettings = {
    enabled: true,
    timeoutMinutes: 5,
    afkDisabledPresets: [] // Presets that disable AFK when active
};
let lastSystemIdleState = false; // Track state to only send on change
let cachedPluginAfkConfig = null; // Store last config from plugin to sync with Renderer on load

// Rich Presence Priority System
// Lower number = higher priority
let prioritySettings = {
    autoDetect: 1,      // Auto-detected game/app (highest priority)
    manualPreset: 2,    // Manually selected preset
    defaultFallback: 3  // Default/fallback (lowest priority)
};

let currentPrioritySource = null; // Track what's currently controlling RPC
let lastNotifiedPresetName = null; // Track last preset name that triggered a notification

const DATA_PATH = path.join(app.getPath('userData'), 'customrp-data.json');
// Icon path: works in both dev and packaged app
const ICON_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, '..', '..', 'SolariPhotoTransparente.png');
const DEFAULT_CLIENT_ID = ''; // User must configure their own Client ID
let clientId = DEFAULT_CLIENT_ID; // Can be changed by user (global default)
let identities = []; // Array of { id: string, name: string } - Multiple App Profiles
let currentClientId = null; // Currently active Client ID for RPC connection
let pendingActivity = null; // Activity to set after Client ID switch completes
let isSwitching = false; // Flag to prevent multiple concurrent switches

// ===== USER TRACKING SYSTEM =====
const TRACKER_URL = 'https://solarirpc.com/counter.php';
let trackerInterval = null;
let trackingUserId = null; // Unique ID for this instance

// Generate/load unique tracking ID
function getTrackingUserId() {
    if (trackingUserId) return trackingUserId;

    // Try to load existing ID from data file
    try {
        if (fs.existsSync(DATA_PATH)) {
            const data = JSON.parse(fs.readFileSync(DATA_PATH));
            if (data.trackingUserId) {
                trackingUserId = data.trackingUserId;
                return trackingUserId;
            }
        }
    } catch (e) { /* ignore */ }

    // Generate new ID
    trackingUserId = 'solari_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    return trackingUserId;
}

// Send heartbeat ping to tracker using invisible BrowserWindow (bypasses anti-bot)
let trackerWindow = null;

async function sendTrackerPing() {
    try {
        const { version } = require('../../package.json');
        const uid = getTrackingUserId();
        const url = `${TRACKER_URL}?action=ping&version=${encodeURIComponent(version)}&uid=${encodeURIComponent(uid)}`;

        console.log('[Solari Tracker] Sending ping via browser...');

        // Create invisible window ONLY if it doesn't exist
        if (!trackerWindow || trackerWindow.isDestroyed()) {
            trackerWindow = new BrowserWindow({
                width: 1,
                height: 1,
                show: false,
                skipTaskbar: true,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    javascript: true, // Enable JS to pass anti-bot
                    offscreen: true, // Use offscreen rendering for performance
                    backgroundThrottling: true // Throttle when hidden
                }
            });

            // Cleanup when closed
            trackerWindow.on('closed', () => {
                trackerWindow = null;
            });
        }

        // Load the URL (browser will handle any JS challenges)
        trackerWindow.loadURL(url).then(() => {
            // Get the response from the page
            trackerWindow.webContents.executeJavaScript('document.body.innerText')
                .then((bodyText) => {
                    console.log('[Solari Tracker] Response:', bodyText.substring(0, 150));
                    try {
                        const json = JSON.parse(bodyText);
                        if (json.success) {
                            console.log('[Solari Tracker] Ping successful!');
                        } else {
                            console.log('[Solari Tracker] Ping failed:', json.error);
                        }
                    } catch (e) {
                        // Might be anti-bot page on first request, will work next time
                        console.log('[Solari Tracker] Warming up session...');
                    }

                    // Navigate to blank page to free memory but keep window ready
                    if (trackerWindow && !trackerWindow.isDestroyed()) {
                        trackerWindow.loadURL('about:blank');
                    }
                })
                .catch(() => { });
        }).catch((err) => {
            console.error('[Solari Tracker] Load failed:', err.message);
        });
    } catch (e) {
        console.error('[Solari Tracker] Error:', e.message);
    }
}

// Send disconnect notification
async function sendTrackerDisconnect() {
    try {
        const uid = getTrackingUserId();
        if (!uid) return;

        const url = `${TRACKER_URL}?action=disconnect&uid=${encodeURIComponent(uid)}`;

        // If tracker window exists, use it
        if (trackerWindow && !trackerWindow.isDestroyed()) {
            trackerWindow.loadURL(url).catch(() => { });
        }
    } catch (err) {
        // Ignore errors on shutdown
    }
}

// Cleanup tracker window on app quit
function cleanupTrackerWindow() {
    if (trackerWindow && !trackerWindow.isDestroyed()) {
        trackerWindow.destroy();
        trackerWindow = null;
    }
}

// Start tracking heartbeat
function startTracking() {
    // Send initial ping
    sendTrackerPing();

    // Send ping every 60 seconds
    trackerInterval = setInterval(sendTrackerPing, 60000);
    console.log('[Solari Tracker] Tracking started');
}

// Stop tracking
function stopTracking() {
    if (trackerInterval) {
        clearInterval(trackerInterval);
        trackerInterval = null;
    }
    sendTrackerDisconnect();
    console.log('[Solari Tracker] Tracking stopped');
}

let dataLoadFailed = false;

function loadData() {
    try {
        if (fs.existsSync(DATA_PATH)) {
            const data = JSON.parse(fs.readFileSync(DATA_PATH));
            defaultActivity = data.defaultActivity || {};
            presets = data.presets || [];
            lastFormState = data.lastFormState || {};
            if (data.blockedPlugins) blockedPlugins = new Set(data.blockedPlugins);
            if (data.appSettings) {
                appSettings = { ...appSettings, ...data.appSettings };
            } else {
                // First run or no settings: Auto-detect language
                const systemLocale = app.getLocale();
                if (systemLocale && systemLocale.toLowerCase().startsWith('pt')) {
                    appSettings.language = 'pt-BR';
                    console.log(`[Solari] Auto-detected system language: ${systemLocale} -> Set to pt-BR`);
                } else {
                    appSettings.language = 'en';
                    console.log(`[Solari] Auto-detected system language: ${systemLocale} -> Set to en`);
                }
            }
            // Load auto-detection settings
            autoDetectEnabled = data.autoDetectEnabled || false;
            autoDetectMappings = data.autoDetectMappings || [];
            websiteMappings = data.websiteMappings || [];
            fallbackPresetIndex = data.fallbackPresetIndex !== undefined ? data.fallbackPresetIndex : -1;
            useExtensionForWeb = data.useExtensionForWeb !== undefined ? data.useExtensionForWeb : true;
            // Load custom client ID
            if (data.clientId) clientId = data.clientId;
            // Load identities (App Profiles)
            if (data.identities) identities = data.identities;

            // Load priority settings
            if (data.prioritySettings) prioritySettings = { ...prioritySettings, ...data.prioritySettings };

            if (data.setupCompleted !== undefined) setupCompleted = data.setupCompleted;

            if (data.ecoMode !== undefined) global.ecoMode = data.ecoMode;


            // Send Eco Mode state to renderer on load handled via data object passed in 'data-loaded'
            // We just need to make sure it's in the object we send back.
            // In 'get-data' handler (which we need to find and update if it doesn't just read the file directly or use a global var).

            // Actually, let's check how 'get-data' is handled. 
            // It seems 'get-data' sends the whole 'data' object read from file + extra runtime info.
            // So we just need to make sure we SAVE it.

            // Store soundBoard data to be applied after initialization
            if (data.soundBoardData) {
                global.pendingSoundBoardData = data.soundBoardData;
            }

            applyAppSettings();
        }
        dataLoadFailed = false;
    } catch (e) {
        console.error('Failed to load data', e);
        dataLoadFailed = true; // Mark as failed to prevent overwriting with empty data
    }
}

function saveData() {
    if (dataLoadFailed) {
        console.warn('[Solari] Data load failed previously. Saving to RESCUE file to protect original data.');
        try {
            const rescuePath = path.join(app.getPath('userData'), 'customrp-data-rescue.json');
            fs.writeFileSync(rescuePath, JSON.stringify({
                defaultActivity, presets, lastFormState,
                blockedPlugins: Array.from(blockedPlugins),
                appSettings, autoDetectEnabled, autoDetectMappings,
                websiteMappings, fallbackPresetIndex, useExtensionForWeb,
                clientId, identities, prioritySettings,
                soundBoardData: soundBoard ? soundBoard.toJSON() : null,
                trackingUserId,
                _rescueTimestamp: new Date().toISOString()
            }, null, 2));
        } catch (e) { console.error('Failed to save rescue file', e); }
        return;
    }

    try {
        // Create Backup before saving
        if (fs.existsSync(DATA_PATH)) {
            try {
                fs.copyFileSync(DATA_PATH, DATA_PATH + '.bak');
            } catch (copyError) {
                console.error('[Solari] Failed to create backup:', copyError);
            }
        }

        fs.writeFileSync(DATA_PATH, JSON.stringify({
            defaultActivity, presets, lastFormState,
            blockedPlugins: Array.from(blockedPlugins),
            appSettings,
            autoDetectEnabled,
            autoDetectMappings,
            websiteMappings,
            fallbackPresetIndex,
            useExtensionForWeb,
            clientId,
            identities,
            prioritySettings,
            soundBoardData: soundBoard ? soundBoard.toJSON() : null,
            trackingUserId: trackingUserId, // Persist tracking ID
            ecoMode: global.ecoMode || false,
            setupCompleted: setupCompleted
        }));
    } catch (e) {
        console.error('Failed to save data', e);
    }
}

// IPC handler for child windows to get current language
ipcMain.handle('get-current-language', () => {
    return appSettings.language || 'en';
});

// IPC handler for Spotify status
ipcMain.handle('get-spotify-status', () => {
    // Return current local state + check plugin if possible?
    // Actually, renderer listens for 'spotify-data-loaded' which comes from plugin.
    // But this handler is used for initial sync.
    return {
        connected: !!(spotifyTokens.accessToken && spotifyTokens.refreshToken),
        accessToken: spotifyTokens.accessToken,
        clientId: spotifyClientId || clientId // Use specific or global
    };
});

// IPC: Set Spotify Client ID
ipcMain.on('set-spotify-client-id', (event, id) => {
    spotifyClientId = id;
    saveData();
    console.log('[Solari] Spotify Client ID updated:', id);

    // Broadcast to plugins
    if (wss) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'update_spotify_settings',
                    settings: { spotifyClientId: id }
                }));
            }
        });
    }
});

// IPC: Spotify Login (Trigger Auth in Plugin)
ipcMain.on('spotify-login', () => {
    console.log('[Solari] Triggering Spotify Login in Plugin...');
    if (wss) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'start_spotify_auth'
                }));
            }
        });
    }
});

// IPC: Spotify Finish Auth
ipcMain.on('spotify-finish-auth', (event, codeOrUrl) => {
    console.log('[Solari] Finishing Spotify Auth in Plugin...');
    if (wss) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'finish_spotify_auth',
                    code: codeOrUrl
                }));
            }
        });
    }
});

// IPC: Spotify Logout
ipcMain.on('spotify-logout', () => {
    console.log('[Solari] Spotify Logout...');
    spotifyTokens = { accessToken: null, refreshToken: null, tokenExpiry: 0 };
    saveData(); // You might want to persist tokens? Usually no for security/freshness, but refresh token yes.

    // Tell plugin to clear tokens
    if (wss) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'update_spotify_settings',
                    settings: {
                        spotifyAccessToken: '',
                        spotifyRefreshToken: '',
                        spotifyTokenExpiry: 0
                    }
                }));
            }
        });
    }

    // Notify renderer
    if (mainWindow) {
        mainWindow.webContents.send('spotify-status-update', {
            loggedIn: false,
            clientId: spotifyClientId
        });
    }
});

// ===== IDENTITIES (App Profiles) IPC HANDLERS =====
ipcMain.handle('get-identities', () => {
    return identities;
});

ipcMain.handle('get-global-client-id', () => {
    return clientId;
});

ipcMain.handle('add-identity', (event, identity) => {
    // identity = { id: string, name: string }
    const existing = identities.find(i => i.id === identity.id);
    if (existing) {
        // Update existing
        existing.name = identity.name;
        if (identity.clientId) existing.clientId = identity.clientId;
    } else {
        identities.push(identity);
    }
    saveData();
    return { success: true, identities };
});

ipcMain.handle('delete-identity', (event, identityId) => {
    identities = identities.filter(i => i.id !== identityId);
    saveData();
    return { success: true, identities };
});



ipcMain.handle('set-global-client-id', (event, newClientId) => {
    clientId = newClientId;
    saveData();
    return { success: true };
});

ipcMain.on('save-eco-mode', (event, enabled) => {
    global.ecoMode = enabled;
    saveData();
});

ipcMain.on('complete-setup', () => {
    setupCompleted = true;
    saveData();
});

function applyAppSettings() {
    // Only register auto-launch in packaged builds, never in dev mode
    if (app.isPackaged) {
        // Register with --hidden arg when startMinimized is on, so Windows passes it during auto-launch
        const loginArgs = (appSettings.startWithWindows && appSettings.startMinimized) ? ['--hidden'] : [];

        app.setLoginItemSettings({
            openAtLogin: appSettings.startWithWindows,
            path: app.getPath('exe'),
            args: loginArgs
        });
    } else {
        console.log('[Solari] Dev mode: skipping auto-launch registration');
    }
}

// Helper to load translations dynamically from renderer/locales matching language code
function getLabels() {
    const pkg = require('../../package.json');
    const langCode = appSettings.language || 'en';
    const metadata = { version: pkg.version };

    let labels = {};

    try {
        // Load the locale file
        const localePath = path.join(__dirname, '../renderer/locales', `${langCode}.json`);

        // Fallback to en.json if specific locale doesn't exist
        if (!fs.existsSync(localePath)) {
            if (langCode !== 'en') {
                const enPath = path.join(__dirname, '../renderer/locales/en.json');
                if (fs.existsSync(enPath)) {
                    const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
                    labels = enData.menu || {};
                }
            }
        } else {
            const data = JSON.parse(fs.readFileSync(localePath, 'utf8'));
            labels = data.menu || {};
        }
    } catch (e) {
        console.error(`[Solari] Failed to load translations for ${langCode}:`, e);
    }

    // Interpolate variables (like ${version})
    Object.keys(labels).forEach(key => {
        if (typeof labels[key] === 'string') {
            labels[key] = labels[key].replace(/\$\{(\w+)\}/g, (_, v) => metadata[v] || '');
        }
    });

    return labels;
}

// Helper to get all available languages from files
function getAvailableLanguages() {
    const localesDir = path.join(__dirname, '../renderer/locales');
    const languages = [];

    // Auto-map common codes to native names
    const nativeNames = {
        'en': 'English',
        'pt-BR': 'Português (Brasil)',
        'es': 'Español',
        'fr': 'Français',
        'de': 'Deutsch',
        'it': 'Italiano',
        'ja': '日本語',
        'ko': '한국어',
        'zh-CN': '简体中文',
        'ru': 'Русский'
    };

    try {
        if (fs.existsSync(localesDir)) {
            const files = fs.readdirSync(localesDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const code = file.replace('.json', '');
                    languages.push({
                        code: code,
                        label: nativeNames[code] || code // Use code if no name mapping
                    });
                }
            });
        }
    } catch (e) {
        console.error('[Solari] Failed to scan locales:', e);
        // Fallback
        languages.push({ code: 'en', label: 'English' });
    }

    return languages;
}

function createMenu() {
    const labels = getLabels();
    const availableLanguages = getAvailableLanguages();

    const template = [
        {
            label: labels.file || 'File',
            submenu: [
                { label: labels.startWithWindows || 'Start with Windows', type: 'checkbox', checked: appSettings.startWithWindows, click: (item) => { appSettings.startWithWindows = item.checked; if (!item.checked) appSettings.startMinimized = false; applyAppSettings(); saveData(); createMenu(); } },
                ...(appSettings.startWithWindows ? [{ label: labels.startMinimized || 'Start Minimized', type: 'checkbox', checked: appSettings.startMinimized, click: (item) => { appSettings.startMinimized = item.checked; applyAppSettings(); saveData(); } }] : []),
                { label: labels.minimizeToTray || 'Minimize to Tray', type: 'checkbox', checked: appSettings.closeToTray, click: (item) => { appSettings.closeToTray = item.checked; saveData(); } },
                { type: 'separator' },
                { label: labels.exit || 'Exit', click: () => { isQuitting = true; app.quit(); } }
            ]
        },
        {
            label: labels.edit || 'Edit',
            submenu: [
                { label: labels.undo || 'Undo', role: 'undo' },
                { label: labels.redo || 'Redo', role: 'redo' },
                { type: 'separator' },
                { label: labels.cut || 'Cut', role: 'cut' },
                { label: labels.copy || 'Copy', role: 'copy' },
                { label: labels.paste || 'Paste', role: 'paste' },
                { type: 'separator' },
                { label: labels.clientId || 'Client ID...', click: () => { openClientIdDialog(); } }
            ]
        },
        {
            label: labels.view || 'View',
            submenu: [
                { label: labels.reload || 'Reload', role: 'reload' },
                { label: labels.forceReload || 'Force Reload', role: 'forceReload' },
                { label: labels.devTools || 'Developer Tools', role: 'toggleDevTools' },
                { type: 'separator' },
                { label: labels.zoomIn || 'Zoom In', role: 'zoomIn' },
                { label: labels.zoomOut || 'Zoom Out', role: 'zoomOut' },
                { label: labels.resetZoom || 'Reset Zoom', role: 'resetZoom' },
                { type: 'separator' },
                {
                    label: labels.language || 'Language',
                    submenu: availableLanguages.map(lang => ({
                        label: lang.label,
                        type: 'radio',
                        checked: appSettings.language === lang.code,
                        click: () => { setLanguage(lang.code); }
                    }))
                }
            ]
        },
        {
            label: labels.help,
            submenu: [
                { label: labels.autoCheckAppUpdates || 'Auto-check for app updates', type: 'checkbox', checked: appSettings.autoCheckAppUpdates, click: (item) => { appSettings.autoCheckAppUpdates = item.checked; saveData(); } },
                { label: labels.autoCheckPluginUpdates || 'Auto-check for plugin updates', type: 'checkbox', checked: appSettings.autoCheckPluginUpdates, click: (item) => { appSettings.autoCheckPluginUpdates = item.checked; saveData(); } },
                { type: 'separator' },
                { label: labels.checkForUpdates, click: async () => { await checkForUpdates(labels); } },
                { label: labels.runSetupWizard || 'Run Setup Wizard', click: () => { mainWindow.webContents.send('run-setup-wizard'); } },
                { label: labels.changelog, click: () => { require('electron').shell.openExternal('https://solarirpc.com/changelog.html'); } },
                { type: 'separator' },
                { label: labels.about, click: () => { mainWindow.webContents.send('open-about-modal'); } }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Check for updates via GitHub releases API
async function checkForUpdates(labels) {
    const https = require('https');
    const { dialog, shell } = require('electron');
    const pkg = require('../../package.json');
    const currentVersion = pkg.version;

    console.log('[Solari] Checking for updates...');

    const options = {
        hostname: 'api.github.com',
        path: '/repos/TheDroidBR/Solari/releases/latest',
        method: 'GET',
        headers: {
            'User-Agent': 'Solari-UpdateChecker',
            'Accept': 'application/vnd.github.v3+json'
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const release = JSON.parse(data);
                const latestVersion = release.tag_name?.replace('v', '') || '0.0.0';

                // Compare versions
                if (compareVersions(latestVersion, currentVersion) > 0) {
                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        title: labels.updateAvailable,
                        message: labels.updateMessage,
                        detail: `${labels.updateAvailable}\n\nVersão atual: v${currentVersion}\nNova versão: v${latestVersion}`,
                        buttons: [labels.downloadNow, labels.later]
                    }).then((result) => {
                        if (result.response === 0) {
                            shell.openExternal(release.html_url || 'https://github.com/TheDroidBR/Solari/releases/latest');
                        }
                    });
                } else {
                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        title: 'Solari',
                        message: labels.noUpdates,
                        detail: `Versão atual: v${currentVersion}`
                    });
                }
            } catch (err) {
                console.error('[Solari] Update check error:', err);
                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: 'Solari',
                    message: labels.noUpdates
                });
            }
        });
    });

    req.on('error', (err) => {
        console.error('[Solari] Update check failed:', err);
    });

    req.end();
}

// ===== AUTO UPDATE SYSTEM =====

async function checkAppUpdateOnStartup(labels) {
    if (process.env.NODE_ENV === 'development') return;

    const https = require('https');
    const pkg = require('../../package.json');
    const currentVersion = pkg.version;

    console.log('[Solari] Checking for startup updates...');

    const options = {
        hostname: 'api.github.com',
        path: '/repos/TheDroidBR/Solari/releases/latest',
        method: 'GET',
        headers: {
            'User-Agent': 'Solari-AutoUpdater',
            'Accept': 'application/vnd.github.v3+json'
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', async () => {
            try {
                const release = JSON.parse(data);
                const latestVersion = release.tag_name?.replace('v', '') || '0.0.0';

                // Look for .exe asset
                const exeAsset = release.assets?.find(a => a.name.endsWith('.exe'));

                if (compareVersions(latestVersion, currentVersion) > 0 && exeAsset) {
                    console.log('[Solari] Update available:', latestVersion);

                    const { response } = await dialog.showMessageBox(mainWindow, {
                        type: 'question',
                        title: labels.updateAvailable || 'Update Available',
                        message: `Solari v${latestVersion} is available!`,
                        detail: 'An automatic update is ready. The app needs to restart to apply it.\n\nDo you want to update now?',
                        buttons: ['Restart & Update', 'Later'],
                        defaultId: 0,
                        cancelId: 1
                    });

                    if (response === 0) {
                        downloadAndInstallUpdate(exeAsset.browser_download_url, exeAsset.name);
                    }
                }
            } catch (e) {
                console.error('[Solari] Startup update check failed:', e);
            }
        });
    });
    req.on('error', e => console.error('[Solari] Update request error:', e));
    req.end();
}

function downloadAndInstallUpdate(url, fileName) {
    const { app } = require('electron');
    const https = require('https');
    const tempPath = path.join(app.getPath('temp'), fileName); // e.g. SolariAPP.exe

    // Notify user
    sendToast('Downloading Update', 'Please wait...', 'info');

    const file = fs.createWriteStream(tempPath);
    https.get(url, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            downloadAndInstallUpdate(response.headers.location, fileName);
            return;
        }

        response.pipe(file);

        file.on('finish', () => {
            file.close(() => {
                console.log('[Solari] Update downloaded to:', tempPath);
                installUpdateAndRestart(tempPath);
            });
        });
    }).on('error', (err) => {
        fs.unlink(tempPath, () => { });
        sendToast('Update Failed', err.message, 'error');
    });
}



async function updatePluginsOnStartup() {
    console.log('[Solari] Checking for plugin updates...');
    const pluginsPath = getBDPluginsPath();
    if (!fs.existsSync(pluginsPath)) return;

    const plugins = [
        { name: 'SpotifySync.plugin.js', url: 'https://solarirpc.com/downloads/SpotifySync.plugin.js' },
        { name: 'SmartAFK.plugin.js', url: 'https://solarirpc.com/downloads/SmartAFK.plugin.js' }
    ];

    let updatedCount = 0;
    const https = require('https');

    for (const plugin of plugins) {
        const filePath = path.join(pluginsPath, plugin.name);
        if (fs.existsSync(filePath)) {
            // Download to memory/buffer to compare? Or just blindly update?
            // "Blind update" is safer/simpler for now as these are small files.
            // But let's verify size/content to avoid toast spam if nothing changed.
            // Actually, for simplicity and speed, just downloading and overwriting is fine. 
            // Better: Read local file, download remote to string, compare.

            downloadPluginToString(plugin.url).then(remoteContent => {
                if (!remoteContent) return;

                try {
                    const localContent = fs.readFileSync(filePath, 'utf8');
                    // Simple comparison (ignoring newlines slightly ideally, but exact match is fine)
                    if (localContent.trim() !== remoteContent.trim()) {
                        fs.writeFileSync(filePath, remoteContent);
                        console.log(`[Solari] Updated plugin: ${plugin.name}`);
                        updatedCount++;
                        // If last one, show toast? Hard to coordinate.
                        // We can just log it. Or show individual toasts?
                        // Let's increment count and show toast at end? No, async.
                        // Just show toast per plugin for now, or silence it. 
                        // User asked "fazer atualização automatica".
                        // Silent is usually preferred unless it's a major change.
                        // I'll show a toast if any update happens.
                        sendToast('Plugin Updated', `${plugin.name} was auto-updated`, 'success');
                    }
                } catch (e) {
                    console.error(`[Solari] Error updating ${plugin.name}:`, e);
                }
            });
        }
    }
}

function downloadPluginToString(url) {
    return new Promise(resolve => {
        const https = require('https');
        https.get(url, res => {
            if (res.statusCode !== 200) { resolve(null); return; }
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        }).on('error', () => resolve(null));
    });
}

// Compare version strings (returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal)
function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }
    return 0;
}

function setLanguage(lang) {
    appSettings.language = lang;
    saveData();
    createMenu(); // Rebuild menu with new language
    updateTrayMenu(); // Update tray menu with new language
    if (mainWindow) {
        mainWindow.webContents.send('language-changed', lang);
    }
    if (autoDetectWindow) {
        autoDetectWindow.webContents.send('language-changed', lang);
    }
    // Broadcast language change to all connected plugins
    if (wss) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'set_language', language: lang }));
            }
        });
    }
}

// IPC Listener for Language Change
ipcMain.on('save-language', (event, lang) => {
    setLanguage(lang);
});

function openClientIdDialog() {
    const { dialog } = require('electron');
    const labels = getLabels();

    // Create a simple input window
    const inputWindow = new BrowserWindow({
        width: 500,
        height: 300,
        parent: mainWindow,
        modal: true,
        resizable: false,
        title: labels.clientIdTitle,
        icon: ICON_PATH,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    inputWindow.setMenu(null);

    let currentId = labels.clientIdNotConfigured;
    if (clientId && clientId.length > 4) {
        currentId = '••••••' + clientId.slice(-4);
    } else if (clientId) {
        currentId = '••••••'; // If very short, mask all
    }
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: 'Segoe UI', sans-serif;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                color: white;
                padding: 20px;
                margin: 0;
            }
            h2 { margin-top: 0; color: #5865f2; }
            .info { font-size: 12px; color: #aaa; margin: 10px 0; }
            input {
                width: 100%;
                padding: 12px;
                font-size: 14px;
                border: 2px solid #5865f2;
                border-radius: 8px;
                background: #2a2a4a;
                color: white;
                box-sizing: border-box;
                margin: 10px 0;
            }
            input:focus { outline: none; border-color: #7289da; }
            .buttons { display: flex; gap: 10px; margin-top: 15px; }
            button {
                flex: 1;
                padding: 12px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .btn-cancel { background: #4a4a6a; color: white; }
            .btn-cancel:hover { background: #5a5a7a; }
            .btn-save { background: #5865f2; color: white; }
            .btn-save:hover { background: #4752c4; }
            .current { background: #2a2a4a; padding: 10px; border-radius: 8px; font-family: monospace; word-break: break-all; }
        </style>
    </head>
    <body>
        <h2>${labels.clientIdHeader}</h2>
        <p class="info">${labels.clientIdCurrent} <span class="current">${currentId}</span></p>
        <p class="info">
            ${labels.clientIdInstructions}<br>
            ${labels.clientIdStep1}<br>
            ${labels.clientIdStep2}
        </p>
        <div style="position: relative;">
            <input type="password" id="clientId" placeholder="${labels.clientIdPlaceholder}" value="${clientId}" style="padding-right: 40px;">
            <button onclick="toggleVisibility()" style="position: absolute; right: 5px; top: 11px; background: transparent; color: #aaa; width: auto; padding: 5px; font-size: 16px; border: none; cursor: pointer;">👁️</button>
        </div>
        <div class="buttons">
            <button class="btn-cancel" onclick="window.close()">${labels.clientIdCancel}</button>
            <button class="btn-save" onclick="save()">${labels.clientIdSave}</button>
        </div>
        <script>
            const { ipcRenderer } = require('electron');
            const errorMsg = "${labels.clientIdInvalid}";
            function save() {
                const newId = document.getElementById('clientId').value.trim();
                if (newId) {
                    ipcRenderer.send('set-client-id', newId);
                    window.close();
                } else {
                    alert(errorMsg);
                }
            }
            document.getElementById('clientId').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') save();
            });
            function toggleVisibility() {
                const input = document.getElementById('clientId');
                const btn = document.querySelector('button[onclick="toggleVisibility()"]');
                if (input.type === 'password') {
                    input.type = 'text';
                    btn.innerText = '🔒';
                } else {
                    input.type = 'password';
                    btn.innerText = '👁️';
                }
            }
        </script>
    </body>
    </html>
    `;

    inputWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
}

function createTray() {
    let icon;
    try {
        const iconBuffer = fs.readFileSync(ICON_PATH);
        // Check PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
        const header = iconBuffer.slice(0, 8);
        const isValidPNG = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
        icon = nativeImage.createFromBuffer(iconBuffer);
        if (!isValidPNG) {
            console.error('[Solari] Icon file is not a valid PNG');
        }
    } catch (error) {
        console.error('[Solari] Failed to read icon file:', error.message);
        icon = nativeImage.createEmpty();
    }

    if (icon.isEmpty()) {
        console.error('[Solari] Tray icon is empty! Skipping Tray creation to prevent crash.');
        return; // Don't create tray if icon is invalid
    }

    try {
        tray = new Tray(icon);
        tray.setToolTip('Solari');

        updateTrayMenu();
        tray.on('double-click', () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } });

        console.log('[DEBUG] Tray created successfully.');

        // Hide console on startup
        setTimeout(() => {
            toggleConsoleWindow(false);
        }, 500);
    } catch (error) {
        console.error('[ERROR] Failed to create Tray:', error);
    }
}

function updateTrayMenu() {
    const isPortuguese = appSettings.language === 'pt-BR';
    const labels = isPortuguese ? {
        open: 'Abrir Solari',
        showConsole: '🔳 Mostrar Console',
        hideConsole: '🔲 Esconder Console',
        autoDetect: 'Auto-Detectar',
        presets: 'Presets',
        noPresets: '(Nenhum preset)',
        exit: 'Sair'
    } : {
        open: 'Open Solari',
        showConsole: '🔳 Show Console',
        hideConsole: '🔲 Hide Console',
        autoDetect: 'Auto-Detect',
        presets: 'Presets',
        noPresets: '(No presets)',
        exit: 'Exit'
    };

    // Build presets submenu
    const presetMenuItems = presets.length > 0
        ? presets.map(preset => ({
            label: preset.name,
            click: () => {
                loadPresetActivity(preset, true); // True = Manual Mode
                if (mainWindow) {
                    mainWindow.webContents.send('preset-auto-loaded', preset.name);
                }
            }
        }))
        : [{ label: labels.noPresets, enabled: false }];

    const contextMenu = Menu.buildFromTemplate([
        { label: labels.open, click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
        { type: 'separator' },
        {
            label: `${autoDetectEnabled ? '✅' : '⬜'} ${labels.autoDetect}`,
            click: () => {
                console.log('[Solari] Tray auto-detect toggle clicked, current:', autoDetectEnabled);
                autoDetectEnabled = !autoDetectEnabled;
                console.log('[Solari] Auto-detect now:', autoDetectEnabled);
                saveData();
                if (autoDetectEnabled) {
                    startAutoDetection();
                } else {
                    stopAutoDetection();
                }
                updateTrayMenu(); // Refresh menu to show new state
                if (mainWindow) {
                    mainWindow.webContents.send('autodetect-toggled', autoDetectEnabled);
                }
            }
        },
        {
            label: `📋 ${labels.presets}`,
            submenu: presetMenuItems
        },
        // Console toggle - only show in dev mode (not packaged)
        ...(app.isPackaged ? [] : [{
            label: consoleVisible ? labels.hideConsole : labels.showConsole,
            click: () => { toggleConsoleWindow(!consoleVisible); }
        }]),
        { type: 'separator' },
        { label: labels.exit, click: () => { isQuitting = true; app.quit(); } }
    ]);
    if (tray) tray.setContextMenu(contextMenu);
}

function toggleConsoleWindow(show) {
    consoleVisible = show;

    // Use PowerShell to show/hide the console window by finding it by title
    const showState = show ? 5 : 0; // 5 = SW_SHOW, 0 = SW_HIDE

    // Create a temporary PowerShell script file
    const tempScriptPath = path.join(app.getPath('temp'), 'solari_console_toggle.ps1');
    const psScript = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class ConsoleHelper {
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    
    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    
    [DllImport("user32.dll")]
    public static extern int GetWindowTextLength(IntPtr hWnd);
    
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
}
"@

$found = $false
$callback = {
    param($hwnd, $lparam)
    $length = [ConsoleHelper]::GetWindowTextLength($hwnd)
    if ($length -gt 0) {
        $sb = New-Object System.Text.StringBuilder($length + 1)
        [ConsoleHelper]::GetWindowText($hwnd, $sb, $sb.Capacity) | Out-Null
        $title = $sb.ToString()
        if ($title -like "*cmd.exe*" -or $title -like "*Administrador*cmd*") {
            [ConsoleHelper]::ShowWindow($hwnd, ${showState})
            $script:found = $true
        }
    }
    return $true
}

[ConsoleHelper]::EnumWindows($callback, [IntPtr]::Zero)
`;

    try {
        fs.writeFileSync(tempScriptPath, psScript);
        exec(`powershell -ExecutionPolicy Bypass -File "${tempScriptPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.log('[Solari] Console toggle error:', stderr || error.message);
            } else {
                console.log(`[Solari] Console window ${show ? 'shown' : 'hidden'}`);
            }
            // Clean up temp file
            try { fs.unlinkSync(tempScriptPath); } catch (e) { }
            updateTrayMenu();
        });
    } catch (e) {
        console.log('[Solari] Failed to create temp script:', e.message);
        updateTrayMenu();
    }
}

// System-wide AFK detection using Electron's powerMonitor
function startSystemAFKCheck() {
    if (systemAFKCheckInterval) {
        clearInterval(systemAFKCheckInterval);
    }

    console.log(`[Solari] Starting system AFK check (timeout: ${systemAFKSettings.timeoutMinutes} min)`);

    let debugCounter = 0;

    systemAFKCheckInterval = setInterval(() => {
        if (!systemAFKSettings.enabled) return;

        try {
            // FEATURE: Disable AFK when specific preset is active
            // Only skip AFK if the current preset is in the afkDisabledPresets list
            const shouldDisableAfk = currentDetectedPresetName &&
                systemAFKSettings.afkDisabledPresets &&
                systemAFKSettings.afkDisabledPresets.includes(currentDetectedPresetName);

            if (shouldDisableAfk) {
                // Send "not idle" to plugins when AFK-disabled preset is active
                if (wss) {
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'system_idle_update',
                                idleSeconds: 0,
                                idleMinutes: 0,
                                isIdle: false,
                                presetActive: true, // Flag to indicate preset override
                                timeoutMinutes: systemAFKSettings.timeoutMinutes
                            }));
                        }
                    });
                }
                // Reset state so when preset ends, AFK can trigger again
                if (lastSystemIdleState === true) {
                    lastSystemIdleState = false;
                    console.log(`[Solari] AFK disabled for preset: ${currentDetectedPresetName}`);
                }
                return; // Skip normal idle check
            }

            const idleSeconds = powerMonitor.getSystemIdleTime();
            const idleMinutes = idleSeconds / 60;
            const isIdle = idleMinutes >= systemAFKSettings.timeoutMinutes;

            // Log every 6th check (every 30 seconds) for debugging
            // Log every check (every 5 seconds) for deep debugging requested by user
            debugCounter++;
            if (debugCounter >= 6) { // Log every 30 seconds
                debugCounter = 0;
                console.log(`[Solari] Idle check: ${idleSeconds}s (${idleMinutes.toFixed(2)} min) | State: ${isIdle ? 'IDLE' : 'ACTIVE'} | LastState: ${lastSystemIdleState ? 'IDLE' : 'ACTIVE'}`);
            }

            // Send update if:
            // 1. State changed (idle <-> active), OR
            // 2. Currently idle (so plugin can upgrade tiers based on increasing idle time)
            const stateChanged = isIdle !== lastSystemIdleState;

            // Update state tracking
            if (stateChanged) {
                lastSystemIdleState = isIdle;
                console.log(`[Solari] *** STATE CHANGED *** System idle: ${isIdle ? 'IDLE' : 'ACTIVE'} (idle for ${idleMinutes.toFixed(2)} min)`);
            }

            // Always send to renderer and plugins so they stay synced
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('system-afk-update', {
                    isIdle,
                    idleSeconds,
                    idleMinutes: parseFloat(idleMinutes.toFixed(2))
                });
            }

            // Send to all connected WebSocket clients (plugins) for tier progression
            if (wss) {
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'system_idle_update',
                            idleSeconds,
                            idleMinutes: parseFloat(idleMinutes.toFixed(2)),
                            isIdle,
                            timeoutMinutes: systemAFKSettings.timeoutMinutes
                        }));
                    }
                });
            }
        } catch (e) {
            console.error('[Solari] Error checking system idle time:', e);
        }
    }, 3000); // Check every 3 seconds
}

function stopSystemAFKCheck() {
    if (systemAFKCheckInterval) {
        clearInterval(systemAFKCheckInterval);
        systemAFKCheckInterval = null;
        console.log('[Solari] System AFK check stopped');
    }
}

function createWindow() {
    // Log process args for debugging auto-launch detection
    console.log('[Solari] process.argv:', JSON.stringify(process.argv));

    // Only start hidden if launched by Windows auto-start with --hidden flag
    // Manual launches (double-clicking exe) won't have this flag
    const launchedWithHidden = process.argv.includes('--hidden');
    const shouldStartHidden = appSettings.startMinimized && appSettings.startWithWindows && launchedWithHidden;

    mainWindow = new BrowserWindow({
        width: 1200, height: 950, minWidth: 1100, title: "Solari",
        icon: ICON_PATH,
        backgroundColor: '#0f0c29',
        show: !shouldStartHidden,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    mainWindow.loadFile('src/renderer/index.html');

    if (shouldStartHidden) {
        console.log('[Solari] Starting minimized to tray (auto-launch detected)');
    }

    mainWindow.on('close', (event) => {
        if (!isQuitting && appSettings.closeToTray) {
            event.preventDefault();
            mainWindow.hide();
            return false;
        }
        return true;
    });
}

app.on('before-quit', () => { isQuitting = true; });

let rpcHealthCheckInterval = null; // Global reference to health check interval

function initializeDiscordRPC(targetClientId = null) {
    // Stop any previous health checks from older instances
    if (rpcHealthCheckInterval) {
        clearInterval(rpcHealthCheckInterval);
        rpcHealthCheckInterval = null;
    }

    // Use specified targetClientId, or fall back to global clientId
    const useClientId = targetClientId || clientId;
    currentClientId = useClientId;

    // Register the client ID - required for activity types to work
    console.log('[Solari] Initializing Discord RPC with clientId:', useClientId || '(EMPTY)');
    if (!useClientId) {
        console.log('[Solari] WARNING: clientId is empty! RPC will not work.');
    }
    DiscordRPC.register(useClientId);

    let connectionAttempts = 0;
    let isReconnecting = false; // Prevent multiple simultaneous reconnection attempts
    let reconnectTimeout = null;
    const maxAttempts = CONSTANTS.RPC_MAX_ATTEMPTS;

    const scheduleReconnect = (delayMs) => {
        // GUARD: If global Client ID has changed since this closure was created, abort!
        if (currentClientId !== useClientId) {
            console.log('[Solari] Aborting reconnect for old Client ID:', useClientId);
            return;
        }

        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
        }
        reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            attemptConnection();
        }, delayMs);
    };

    const attemptConnection = () => {
        // GUARD: If global Client ID has changed since this closure was created, abort!
        if (currentClientId !== useClientId) {
            console.log('[Solari] Aborting connection attempt for old Client ID:', useClientId);
            return;
        }

        // Prevent multiple simultaneous connection attempts
        if (isReconnecting) {
            console.log('[Solari] Already attempting reconnection, skipping...');
            return;
        }
        isReconnecting = true;

        connectionAttempts++;
        if (connectionAttempts <= 3 || connectionAttempts % 10 === 0) {
            console.log('[Solari] Attempting RPC connection, attempt:', connectionAttempts);
        }

        try {
            // Properly cleanup old client if exists
            if (rpcClient) {
                try {
                    rpcClient.removeAllListeners();
                    if (rpcClient.transport) {
                        rpcClient.transport.removeAllListeners();
                    }
                    rpcClient.destroy().catch(() => { }); // Ignore errors on destroy
                } catch (e) {
                    // Ignore cleanup errors
                }
                rpcClient = null;
            }

            rpcClient = new DiscordRPC.Client({ transport: 'ipc' });

            rpcClient.on('ready', async () => {
                console.log('[Solari] Discord RPC Connected!');
                rpcConnected = true;
                connectionAttempts = 0;
                if (mainWindow) {
                    mainWindow.webContents.send('rpc-status', { connected: true });
                }

                // Try to get app name from rpcClient or fetch from Discord API
                let appName = rpcClient.application?.name;
                if (!appName) {
                    try {
                        // Fetch app info from Discord API with timeout
                        const https = require('https');
                        const res = await Promise.race([
                            new Promise((resolve, reject) => {
                                const req = https.get(`https://discord.com/api/v10/applications/${clientId}/rpc`, (resp) => {
                                    let data = '';
                                    resp.on('data', (chunk) => data += chunk);
                                    resp.on('end', () => {
                                        try {
                                            resolve(JSON.parse(data));
                                        } catch (e) {
                                            reject(e);
                                        }
                                    });
                                });
                                req.on('error', reject);
                                req.setTimeout(5000, () => {
                                    req.destroy();
                                    reject(new Error('Timeout'));
                                });
                            }),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
                        ]);
                        appName = res.name || 'Discord App';
                        console.log('[Solari] Fetched app name from API:', appName);
                    } catch (err) {
                        console.log('[Solari] Could not fetch app name:', err.message, '- using fallback');
                        appName = 'Discord App';
                    }
                }

                if (mainWindow) {
                    mainWindow.webContents.send('app-name-loaded', appName);
                }

                // ALWAYS restore activity on connection to prevent "away" status
                if (isEnabled) {
                    console.log('[Solari] RPC Ready - Waiting 2s before restoring activity...');

                    // Force clear again just to be safe
                    currentActivity = {};

                    // Check if we have a pending activity from Client ID switch
                    if (pendingActivity) {
                        console.log('[Solari] Applying pending activity from Client ID switch');
                        const activityToApply = pendingActivity;
                        pendingActivity = null; // Clear pending
                        setActivity(activityToApply); // Apply the stored activity
                    } else {
                        // Use priority system to get the best activity source
                        // Wait 2 seconds (2000ms) to ensure Discord is fully ready to receive commands
                        setTimeout(() => {
                            console.log('[Solari] Restoring activity now...');
                            updatePresence(); // Force update on reconnection
                        }, 2000);
                    }
                }
            });

            rpcClient.transport.on('close', () => {
                // If we are intentionally switching, ignore this close event
                if (isSwitching) return;

                console.log('[Solari] Discord RPC connection closed, retrying soon...');
                rpcConnected = false;
                currentActivity = {}; // Reset current activity so next update forces a refresh
                isReconnecting = false; // Allow new reconnection attempt
                connectionAttempts = 0; // Reset counter for fresh reconnection cycle
                if (mainWindow) {
                    mainWindow.webContents.send('rpc-status', { connected: false, reconnecting: true });
                }
                // Use shorter delay for faster recovery
                scheduleReconnect(3000); // 3 seconds
            });

            // Handle transport errors (e.g., pipe broken when Discord restarts)
            rpcClient.transport.on('error', (err) => {
                // If we are intentionally switching, ignore this error
                if (isSwitching) return;

                console.log('[Solari] Discord RPC transport error:', err.message, '- retrying soon...');
                rpcConnected = false;
                currentActivity = {}; // Reset current activity so next update forces a refresh
                isReconnecting = false; // Allow new reconnection attempt
                connectionAttempts = 0; // Reset counter for fresh reconnection cycle
                if (mainWindow) {
                    mainWindow.webContents.send('rpc-status', { connected: false, reconnecting: true });
                }
                // Use shorter delay for faster recovery
                scheduleReconnect(3000); // 3 seconds
            });

            rpcClient.login({ clientId: useClientId }).catch((err) => {
                // GUARD
                if (currentClientId !== useClientId) return;

                if (connectionAttempts <= 3 || connectionAttempts % 10 === 0) {
                    console.error('[Solari] Discord RPC connection failed (attempt ' + connectionAttempts + '):', err.message);
                }
                addLog('[RPC] Connection failed: ' + err.message);
                rpcConnected = false;
                currentActivity = {}; // Reset current activity
                isReconnecting = false; // Allow new reconnection attempt

                // ALWAYS send reconnecting status so UI never shows plain "Disconnected"
                if (mainWindow) {
                    mainWindow.webContents.send('rpc-status', { connected: false, reconnecting: true });
                }

                // Persistent Reconnection Logic — NEVER GIVE UP
                if (connectionAttempts >= 10) {
                    // Slow down after 10 attempts to reduce resource usage
                    scheduleReconnect(CONSTANTS.RPC_LONG_RETRY_DELAY_MS);
                } else {
                    scheduleReconnect(CONSTANTS.RPC_RETRY_DELAY_MS);
                }
            });

        } catch (unexpectedErr) {
            // SAFETY NET: If anything unexpected throws during attemptConnection,
            // reset isReconnecting and schedule another attempt
            console.error('[Solari] Unexpected error during connection attempt:', unexpectedErr.message);
            isReconnecting = false;
            scheduleReconnect(CONSTANTS.RPC_LONG_RETRY_DELAY_MS);
        }
    };
    attemptConnection();

    // Proactive health check & reconnection safety net
    // Runs every 5 seconds:
    // - If connected: verify the transport is still alive
    // - If NOT connected: ensure a reconnection attempt is scheduled (safety net)
    rpcHealthCheckInterval = setInterval(() => {
        // GUARD: If Client ID changed, this health check becomes stale — stop it
        if (currentClientId !== useClientId) {
            clearInterval(rpcHealthCheckInterval);
            rpcHealthCheckInterval = null;
            return;
        }

        if (rpcConnected && rpcClient && !isReconnecting) {
            // Connected: verify transport is alive
            try {
                const transport = rpcClient.transport;
                if (!transport || !transport.socket || transport.socket.destroyed) {
                    console.log('[Solari] RPC health check: Connection appears dead, scheduling reconnect...');
                    rpcConnected = false;
                    isReconnecting = false;
                    if (mainWindow) {
                        mainWindow.webContents.send('rpc-status', { connected: false, reconnecting: true });
                    }
                    scheduleReconnect(CONSTANTS.RPC_RETRY_DELAY_MS);
                }
            } catch (e) {
                console.log('[Solari] RPC health check error:', e.message);
                rpcConnected = false;
                currentActivity = {};
                isReconnecting = false;
                scheduleReconnect(CONSTANTS.RPC_RETRY_DELAY_MS);
            }
        } else if (!rpcConnected && !isReconnecting && !reconnectTimeout) {
            // SAFETY NET: Not connected, not reconnecting, and no reconnect scheduled.
            // This should NEVER happen, but if it does, force a reconnection attempt.
            console.log('[Solari] RPC safety net: No reconnect scheduled while disconnected! Forcing reconnect...');
            scheduleReconnect(CONSTANTS.RPC_RETRY_DELAY_MS);
        }
    }, 5000); // Check every 5 seconds
}

// Helper to switch RPC connection to a different Client ID (SMART POLLING METHOD)
async function switchRpcClient(newClientId) {
    // Prevent redundant switches
    // Sanitization: Remove spaces and invisible chars
    if (newClientId) newClientId = String(newClientId).trim();

    if (currentClientId === newClientId && rpcConnected) {
        return true;
    }

    if (isSwitching) {
        console.log('[Solari] Switch already in progress, ignoring...');
        return false;
    }

    isSwitching = true;
    console.log('[Solari] Switching RPC from', currentClientId, 'to', newClientId);

    // Notify UI
    if (mainWindow) {
        mainWindow.webContents.send('show-toast', {
            messageKey: 'rpc.switching',
            title: '🔄',
            type: 'info'
        });
    }

    // 1. Destroy current connection
    rpcConnected = false;
    if (rpcClient) {
        try {
            await rpcClient.clearActivity().catch(() => { });
            await rpcClient.destroy();
        } catch (e) { console.error('Error destroying RPC:', e); }
        rpcClient = null;
    }

    // 2. Update current ID immediately
    currentClientId = newClientId;

    // 3. Smart reconnection - poll FOREVER until Discord accepts the connection
    // Only aborts if: (a) user switches to a different Client ID, or (b) connection succeeds
    let retryDelay = 1000; // Start with 1s between attempts
    let attempt = 1;

    console.log('[Solari] Starting smart switch to', newClientId);

    while (true) {
        // ABORT CHECK 1: If user wants to switch to yet ANOTHER client ID, abort this one
        if (currentClientId !== newClientId) {
            console.log('[Solari] Switch aborted: Target Client ID changed');
            isSwitching = false;
            return false;
        }

        if (attempt === 1 || attempt % 5 === 0) {
            const elapsed = Math.round((attempt * retryDelay) / 1000);
            console.log(`[Solari] Switch attempt ${attempt} (${elapsed}s elapsed)...`);
        }

        try {
            // Create new client and try to connect
            DiscordRPC.register(newClientId);
            const newClient = new DiscordRPC.Client({ transport: 'ipc' });

            // Attempt login with timeout (Increased to 10s for stability)
            await Promise.race([
                newClient.login({ clientId: newClientId }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
            ]);

            // VALIDATION: Test if the connection actually works by attempting a simple operation
            // This catches "ghost connections" where login succeeds but the pipe is non-functional
            try {
                await newClient.clearActivity();
            } catch (validationErr) {
                console.log(`[Solari] Post-login validation failed: ${validationErr.message}. Connection is not functional.`);
                try { newClient.destroy(); } catch (_) { }
                throw new Error('Post-login validation failed: ' + validationErr.message);
            }

            // Success! Store the client and mark as connected
            rpcClient = newClient;
            rpcConnected = true;
            isSwitching = false;

            console.log(`[Solari] Switch successful on attempt ${attempt}! (validated)`);

            // Setup event handlers for the new client
            newClient.on('disconnected', () => {
                if (isSwitching) return; // Ignore if we are intentionally switching
                console.log('[Solari] Discord RPC disconnected after switch - will reconnect in 10s...');
                rpcConnected = false;
                currentActivity = {}; // Reset so next update forces refresh

                // Notify UI
                if (mainWindow) {
                    mainWindow.webContents.send('rpc-status', { connected: false, reconnecting: true });
                }

                // CRITICAL FIX: Re-initialize the RPC connection after delay
                setTimeout(() => {
                    console.log('[Solari] Reconnecting RPC after Discord restart...');
                    initializeDiscordRPC(currentClientId);
                }, 10000);
            });

            // Apply pending activity if any - but VALIDATE it's for THIS Client ID
            if (pendingActivity) {
                // RACE CONDITION FIX: Only apply if the pending activity is for this Client ID
                const pendingTarget = pendingActivity._targetClientId;
                if (!pendingTarget || pendingTarget === newClientId) {
                    console.log('[Solari] Applying pending activity after successful switch to:', newClientId);
                    const activityToApply = pendingActivity;
                    pendingActivity = null;
                    // Remove the tracking property before applying
                    delete activityToApply._targetClientId;
                    // CRITICAL: Pass newClientId so setActivity doesn't try to switch AGAIN
                    setActivity(activityToApply, newClientId);
                } else {
                    // Pending activity is for a DIFFERENT Client ID - need to switch again
                    console.log('[Solari] Pending activity is for different Client ID:', pendingTarget, '- Switching again...');
                    isSwitching = false; // Reset flag so switchRpcClient can run
                    switchRpcClient(pendingTarget);
                    return true; // Exit this switch, the new one will handle the activity
                }
            } else {
                // Trigger updatePresence to apply current state
                updatePresence();
            }

            // Notify UI of success
            if (mainWindow) {
                mainWindow.webContents.send('rpc-status', { connected: true });
                mainWindow.webContents.send('show-toast', {
                    messageKey: 'rpc.switched',
                    title: '✅',
                    type: 'success'
                });
            }

            return true;

        } catch (err) {
            // Only log errors every few attempts to avoid spam, unless it's the first one
            if (attempt <= 1 || attempt % 5 === 0) {
                console.log(`[Solari] Switch attempt ${attempt} failed: ${err.message}. Retrying...`);
            }

            // Slow down after 60 attempts (~60s) to reduce resource usage
            if (attempt >= 60) {
                retryDelay = 5000; // 5 seconds between attempts after 1 minute
            }

            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            attempt++;
        }
    }

    // This code is unreachable now (infinite loop above only exits via return)
    // Kept as safety net in case future changes break the loop
    isSwitching = false;
    rpcConnected = false;
    return false;
}

function setActivity(activity, presetClientId = null) {
    // Check if we need to switch Client ID for this preset
    // Priority: Explicit Argument > Activity Object Property > Global Default
    let targetClientId = presetClientId || (activity && activity.clientId) || clientId;

    // RESOLVE IDENTITY ID TO REAL CLIENT ID
    // If the targetClientId looks like an internal identity ID (identity_...), resolve it!
    if (targetClientId && String(targetClientId).startsWith('identity_')) {
        const foundIdentity = identities.find(i => i.id === targetClientId);
        if (foundIdentity && foundIdentity.clientId) {
            console.log(`[Solari] Resolved internal identity ${targetClientId} -> ${foundIdentity.clientId}`);
            targetClientId = foundIdentity.clientId;
        } else {
            console.warn(`[Solari] WARNING: Could not resolve identity ${targetClientId} to a Client ID!`);
        }
    }

    if (targetClientId && targetClientId !== currentClientId) {
        // RACE CONDITION FIX: Always update pendingActivity with the LATEST request
        // Even if a switch is already in progress, we want to apply the most recent activity
        pendingActivity = activity;
        pendingActivity._targetClientId = targetClientId; // Track which Client ID this is for

        if (!isSwitching) {
            console.log('[Solari] Preset requires different Client ID:', targetClientId);
            switchRpcClient(targetClientId);
        } else {
            console.log('[Solari] Switch in progress. Updated pending activity for:', targetClientId);
            // If the new target differs from the ongoing switch target, abort and restart
            if (currentClientId !== targetClientId) {
                console.log('[Solari] New target differs from ongoing switch. Will restart after current completes.');
            }
        }
        return;
    }

    const finalActivity = { ...activity };
    // Only apply fallback if the fields are not explicitly set (including undefined)
    // Check if the original activity had these fields - if not provided at all, use fallback
    if (!('details' in activity) && defaultActivity.details) finalActivity.details = defaultActivity.details;
    if (!('state' in activity) && defaultActivity.state) finalActivity.state = defaultActivity.state;

    // Get activity type (0=Playing, 1=Streaming, 2=Listening, 3=Watching, 5=Competing)
    const activityType = finalActivity.type !== undefined ? finalActivity.type : 0;
    console.log('[Solari] Activity type:', activityType);

    // DEDUPLICATION CHECK:
    // If the activity content is identical to the current one, SKIP the update.
    // This prevents timestamp resets and flickering when lower-priority sources trigger evaluations.
    if (currentActivity && rpcConnected && currentClientId === targetClientId) {
        const isContentSame =
            finalActivity.details === currentActivity.details &&
            finalActivity.state === currentActivity.state &&
            finalActivity.largeImageKey === currentActivity.largeImageKey &&
            finalActivity.largeImageText === currentActivity.largeImageText &&
            finalActivity.smallImageKey === currentActivity.smallImageKey &&
            finalActivity.smallImageText === currentActivity.smallImageText &&
            finalActivity.type === currentActivity.type &&
            JSON.stringify(finalActivity.buttons) === JSON.stringify(currentActivity.buttons) &&
            // Check party deeply if needed, or simple stringify if object
            JSON.stringify(finalActivity.partyCurrent) === JSON.stringify(currentActivity.partyCurrent) &&
            JSON.stringify(finalActivity.partyMax) === JSON.stringify(currentActivity.partyMax);

        if (isContentSame) {
            console.log('[Solari] Activity content matches current state. Skipping redundant update.');
            return;
        }
    }

    // Build assets object for Discord RPC - don't force default texts
    const assets = {};
    if (finalActivity.largeImageKey) {
        assets.large_image = finalActivity.largeImageKey;
        if (finalActivity.largeImageText) {
            assets.large_text = finalActivity.largeImageText;
        }
        console.log('[Solari] Using large image:', finalActivity.largeImageKey);
    } else {
        assets.large_image = 'logo';
    }

    if (finalActivity.smallImageKey) {
        assets.small_image = finalActivity.smallImageKey;
        if (finalActivity.smallImageText) {
            assets.small_text = finalActivity.smallImageText;
        }
        console.log('[Solari] Using small image:', finalActivity.smallImageKey);
    }

    // Build timestamps based on mode
    let timestamps = {};
    const timestampMode = finalActivity.timestampMode || 'normal';
    const useEndTimestamp = finalActivity.useEndTimestamp || false;

    // Calculate base timestamp
    let baseTimestamp;
    if (timestampMode === 'normal') {
        // Normal: timer since status was set
        baseTimestamp = Date.now();
    } else if (timestampMode === 'local') {
        // Local: sync with Windows clock (show current time as start of day)
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        baseTimestamp = startOfDay;
    } else if (timestampMode === 'custom' && finalActivity.customTimestamp) {
        // Custom: user-defined timestamp (ensure it's a number, not string)
        baseTimestamp = parseInt(finalActivity.customTimestamp, 10) || Date.now();
    } else {
        baseTimestamp = Date.now();
    }

    // Apply start or end timestamp
    if (useEndTimestamp) {
        // End timestamp: shows "ends in X" countdown
        timestamps.end = baseTimestamp;
        console.log('[Solari] Using end timestamp:', new Date(baseTimestamp).toISOString());
    } else {
        // Start timestamp: shows "X elapsed"
        timestamps.start = baseTimestamp;
    }

    // Build party info if provided
    let party = null;
    if (finalActivity.partyCurrent && finalActivity.partyMax && finalActivity.partyMax > 0) {
        party = {
            id: `solari_party_${Date.now()}`,
            size: [finalActivity.partyCurrent, finalActivity.partyMax]
        };
        console.log('[Solari] Using party:', JSON.stringify(party));
    }

    currentActivity = finalActivity;
    if (!rpcClient || !isEnabled || !rpcConnected) {
        if (!rpcConnected && rpcClient) {
            console.log('[Solari] Skipping setActivity - RPC not connected');
        }
        return;
    }
    if (updateTimeout) clearTimeout(updateTimeout);

    updateTimeout = setTimeout(async () => {
        // Build the activity object with proper Discord RPC format
        const rpcActivity = {
            type: activityType,
            details: finalActivity.details,
            state: finalActivity.state,
            timestamps: timestamps,
            assets: assets,
            instance: false
        };

        // Add party if provided
        if (party) {
            rpcActivity.party = party;
        }

        // Add buttons if provided
        if (finalActivity.buttons && finalActivity.buttons.length > 0) {
            rpcActivity.buttons = finalActivity.buttons;
            if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Using buttons:', JSON.stringify(finalActivity.buttons));
        }

        if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Setting activity:', JSON.stringify(rpcActivity));

        try {
            // Use request method directly to include type field
            await rpcClient.request('SET_ACTIVITY', {
                pid: process.pid,
                activity: rpcActivity
            });
            if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Activity set successfully');
        } catch (err) {
            console.error('[Solari] setActivity error:', err.message);
            // If failed, try to reconnect and retry
            if (err.message && (err.message.includes('connection') || err.message.includes('closed'))) {
                console.log('[Solari] Attempting to reconnect...');
                try {
                    await rpcClient.destroy();
                    await rpcClient.login({ clientId: targetClientId });
                    await rpcClient.request('SET_ACTIVITY', {
                        pid: process.pid,
                        activity: rpcActivity
                    });
                    console.log('[Solari] Retry successful after reconnect');
                } catch (retryErr) {
                    console.error('[Solari] Retry failed:', retryErr.message);
                }
            }
        }
    }, 300);
}

// ===== CENTRALIZED PRESENCE CONTROLLER =====
// Unified state for all presence sources
const presenceSources = {
    // 1. Browser Extension (Highest Priority) - Overrides everything when active
    browserExtension: {
        active: false,
        data: null,
        platform: null,
        clientId: null,
        presetName: null,
        timestamp: 0
    },

    // 2. Manual Preset (User clicked a button) - High priority
    manualPreset: {
        active: false,
        data: null,
        clientId: null,
        presetName: null
    },

    // 3. Auto-Detect (System Monitor) - Medium priority
    autoDetect: {
        active: false,
        data: null,
        clientId: null,
        presetName: null,
        source: null // 'process' or 'website'
    },

    // 4. Default/Fallback - Lowest priority
    defaultFallback: {
        active: true,
        data: null
    }
};

// Master function to decide and apply Rich Presence
async function updatePresence() {
    if (!isEnabled) return;

    // DEBUG: Log all source states
    console.log('[Solari-Core] updatePresence called. Source states:');
    console.log('  - manualPreset.active:', presenceSources.manualPreset.active, '| data:', !!presenceSources.manualPreset.data);
    console.log('  - autoDetect.active:', presenceSources.autoDetect.active, '| source:', presenceSources.autoDetect.source);
    console.log('  - browserExtension.active:', presenceSources.browserExtension.active, '| data:', !!presenceSources.browserExtension.data, '| platform:', presenceSources.browserExtension.platform);
    console.log('  - defaultFallback.active:', presenceSources.defaultFallback.active);

    // 1. EVALUATE SOURCES (in order of priority)
    // Priority: Manual > Auto-Process (games) > Extension > Auto-Website > Fallback
    let activeSource = null;
    let sourceType = null;

    // 1st Priority: Manual Override (user clicked a preset button)
    if (presenceSources.manualPreset.active && presenceSources.manualPreset.data) {
        activeSource = presenceSources.manualPreset;
        sourceType = 'manualPreset';
    }
    // 2nd Priority: Auto-Detect PROCESS (games override extension)
    else if (presenceSources.autoDetect.active && presenceSources.autoDetect.source === 'process') {
        activeSource = presenceSources.autoDetect;
        sourceType = 'autoDetect';
    }
    // 3rd Priority: Browser Extension (YouTube, Netflix, Twitch)
    else if (presenceSources.browserExtension.active && presenceSources.browserExtension.data) {
        activeSource = presenceSources.browserExtension;
        sourceType = 'browserExtension';
    }
    // 4th Priority: Auto-Detect WEBSITE (lower than extension)
    else if (presenceSources.autoDetect.active && presenceSources.autoDetect.source === 'website') {
        activeSource = presenceSources.autoDetect;
        sourceType = 'autoDetect';
    }
    // 5th Priority: Default Fallback
    else if (presenceSources.defaultFallback.active &&
        ((defaultActivity.details && defaultActivity.details !== '') ||
            (defaultActivity.state && defaultActivity.state !== ''))) {
        activeSource = presenceSources.defaultFallback;
        activeSource.data = defaultActivity; // Ensure data is fresh
        sourceType = 'defaultFallback';
    }

    console.log('[Solari-Core] Selected source:', sourceType || 'NONE');

    if (!activeSource) {
        // ALWAYS try to clear if we have no active source
        // This prevents zombie presence if a previous clear failed or state got desynced
        if (currentPrioritySource !== 'none' || (rpcClient && rpcConnected)) {
            console.log('[Solari-Core] No active source, clearing activity');
            currentPrioritySource = 'none';
            // CRITICAL FIX: Reset currentActivity BEFORE clearing
            // This ensures the deduplication check in setActivity won't skip the next update
            // when the same platform is reopened (e.g., close Twitch, reopen Twitch)
            currentActivity = {};
            if (rpcClient && rpcConnected) {
                rpcClient.clearActivity().catch(err => console.error('[Solari] Failed to clear activity:', err));
            }
        }
        return;
    }

    // 2. DETERMINE TARGET CLIENT ID
    let targetClientId = activeSource.clientId || clientId; // Use source ID or Global default

    // RESOLVE IDENTITY ID TO REAL CLIENT ID
    // If the targetClientId looks like an internal identity ID (identity_...), resolve it!
    if (targetClientId && String(targetClientId).startsWith('identity_')) {
        const foundId = identities.find(i => i.id === targetClientId);
        if (foundId && foundId.clientId) {
            targetClientId = foundId.clientId;
        }
    }

    console.log(`[Solari-Core] TargetClientID: ${targetClientId}, CurrentClientID: ${currentClientId}, Source.clientId: ${activeSource.clientId || 'null'}, Global: ${clientId}`);

    // 3. HANDLE CLIENT ID SWITCHING
    if (targetClientId !== currentClientId) {
        if (!isSwitching) {
            console.log(`[Solari-Core] Switching Client ID from ${currentClientId} to ${targetClientId}`);

            // Store this update as pending so it applies immediately after connect
            pendingActivity = activeSource.data;

            // IMPORTANT: Update lastNotifiedPresetName NOW to prevent duplicate notification
            // after reconnection. The toast "Switching RPC..." already notifies the user.
            // Without this, updatePresence would trigger another toast after reconnect.
            if (activeSource.presetName) {
                lastNotifiedPresetName = activeSource.presetName;
                console.log(`[Solari-Core] Pre-updating lastNotifiedPresetName to: ${activeSource.presetName}`);
            }

            // Also update current priority source to prevent source-change notification
            currentPrioritySource = sourceType;

            // Start the switch
            switchRpcClient(targetClientId);
        } else {
            // Already switching, just update the pending buffer
            // This fixes the "dropped update" bug during 2s switch window
            console.log('[Solari-Core] Switch in progress, updating pending buffer');
            pendingActivity = activeSource.data;
        }
        return;
    }

    // 4. APPLY PRESENCE
    // Only update if source changed or data changed significantly
    // (Implementation detail: setActivity handles the actual RPC call)

    const previousPrioritySource = currentPrioritySource;
    currentPrioritySource = sourceType;

    // Prepare activity object
    const finalActivity = activeSource.data;

    // Ensure Client ID is attached (for setActivity internal checks)
    finalActivity.clientId = targetClientId;

    // Apply
    console.log('[Solari-Core] Ready to apply activity. isSwitching:', isSwitching, 'rpcConnected:', rpcConnected);
    if (isSwitching) {
        // Still transitioning, keep buffer fresh
        console.log('[Solari-Core] Switch in progress, buffering activity instead of applying');
        pendingActivity = finalActivity;
    } else {
        console.log('[Solari-Core] Calling setActivity now...');
        setActivity(finalActivity, targetClientId);

        // UI Notifications - ONLY if source OR preset actually changed
        let notificationText = '';
        let currentPresetName = '';
        switch (sourceType) {
            case 'browserExtension':
                currentPresetName = presenceSources.browserExtension.presetName || presenceSources.browserExtension.platform || 'Extension';
                notificationText = `${currentPresetName} (Extension)`;
                break;
            case 'autoDetect':
                currentPresetName = presenceSources.autoDetect.presetName || 'Auto-Detect';
                notificationText = `🌐 ${currentPresetName}`;
                break;
            case 'manualPreset':
                currentPresetName = presenceSources.manualPreset.presetName || 'Manual';
                notificationText = currentPresetName;
                break;
            case 'defaultFallback':
                currentPresetName = 'Default Status';
                notificationText = currentPresetName;
                break;
        }

        // Only notify if the preset ACTUALLY changed (both source and name)
        const sourceChanged = currentPrioritySource !== previousPrioritySource;
        const presetChanged = currentPresetName !== lastNotifiedPresetName;

        if (mainWindow && notificationText && (sourceChanged || presetChanged)) {
            console.log(`[Solari-Core] Showing notification - Source changed: ${sourceChanged}, Preset changed: ${presetChanged} (${lastNotifiedPresetName} -> ${currentPresetName})`);
            mainWindow.webContents.send('preset-auto-loaded', notificationText);
            lastNotifiedPresetName = currentPresetName;
        } else if (mainWindow && !sourceChanged && !presetChanged) {
            console.log('[Solari-Core] Source and preset unchanged, skipping toast notification.');
        }
    }
}


// ===== BROWSER EXTENSION MEDIA UPDATE HANDLER =====

/**
 * ROBUST CLIENT ID RESOLVER
 * Resolves the correct Discord Client ID for a given platform/preset.
 * Priority:
 * 1. Direct preset.clientId (if preset has linked App Profile)
 * 2. Identity by preset.identityId 
 * 3. Identity matched by platform name (case-insensitive)
 * 4. Identity matched by preset name (case-insensitive)
 * 5. Returns null (falls back to global)
 */
function resolveClientIdForPlatform(platform, preset) {
    console.log(`[Solari Resolver] ========================================`);
    console.log(`[Solari Resolver] Starting resolution for platform: "${platform}"`);
    console.log(`[Solari Resolver] Preset: ${preset ? preset.name : 'null'}, preset.clientId: ${preset?.clientId || 'undefined'}`);
    console.log(`[Solari Resolver] Available identities (${identities?.length || 0}): ${JSON.stringify(identities?.map(i => ({ name: i.name, id: i.id?.substring(0, 10) + '...' })) || [])}`);

    // Priority 1: Direct clientId on preset
    if (preset && preset.clientId) {
        console.log(`[Solari Resolver] ✅ RESOLVED via preset.clientId: ${preset.clientId}`);
        return preset.clientId;
    }

    // Priority 2: Identity via preset.identityId
    if (preset && preset.identityId && identities && identities.length > 0) {
        const identity = identities.find(i => i.id === preset.identityId);
        if (identity) {
            const id = identity.id;
            console.log(`[Solari Resolver] ✅ RESOLVED via identityId link: ${id}`);
            return id;
        }
    }

    // Priority 3: Identity matched by PLATFORM name (most important for extension)
    if (platform && identities && identities.length > 0) {
        const platformLower = platform.toLowerCase();
        console.log(`[Solari Resolver] Trying platform name match: "${platformLower}"`);
        const identityByPlatform = identities.find(i =>
            i.name && i.name.toLowerCase() === platformLower
        );
        if (identityByPlatform) {
            console.log(`[Solari Resolver] ✅ RESOLVED via platform name match: ${identityByPlatform.id} (identity: "${identityByPlatform.name}")`);
            return identityByPlatform.id;
        }
    }

    // Priority 4: Identity matched by PRESET name
    if (preset && preset.name && identities && identities.length > 0) {
        const presetLower = preset.name.toLowerCase();
        console.log(`[Solari Resolver] Trying preset name match: "${presetLower}"`);
        const identityByPreset = identities.find(i =>
            i.name && i.name.toLowerCase() === presetLower
        );
        if (identityByPreset) {
            console.log(`[Solari Resolver] ✅ RESOLVED via preset name match: ${identityByPreset.id} (identity: "${identityByPreset.name}")`);
            return identityByPreset.id;
        }
    }

    // No match found
    console.log(`[Solari Resolver] ❌ NO CLIENT ID FOUND - will use Global default`);
    console.log(`[Solari Resolver] ========================================`);
    return null;
}

// ===== BROWSER EXTENSION INTEGRATION =====
function handleBrowserMediaUpdate(message, ws) {
    const { platform, data } = message;

    if (!platform) {
        console.log('[Solari Extension] Invalid media_update: missing platform');
        return;
    }

    // Skip extension data if user has chosen to use autoDetect website mode instead
    if (!useExtensionForWeb) {
        console.log('[Solari Extension] Ignoring extension data (autoDetect website mode is active)');
        return;
    }

    // 1. CLEAR LOGIC
    if (!data) {
        if (presenceSources.browserExtension.active && presenceSources.browserExtension.platform === platform) {
            console.log(`[Solari Extension] Clearing ${platform} state (debounce started)`);

            // Debounce: Wait 1s before actually clearing to prevent flickering on tab switches
            if (presenceSources.browserExtension.clearTimeout) {
                clearTimeout(presenceSources.browserExtension.clearTimeout);
            }

            presenceSources.browserExtension.clearTimeout = setTimeout(() => {
                console.log(`[Solari Extension] Debounce finished, clearing ${platform}`);
                presenceSources.browserExtension.active = false;
                presenceSources.browserExtension.data = null;
                presenceSources.browserExtension.platform = null;
                presenceSources.browserExtension.clearTimeout = null;
                presenceSources.browserExtension.startTimestamp = null; // Reset preserved timestamp

                // ALSO clear autoDetect if it's detecting the same platform via website
                // This prevents autoDetect from immediately taking over with stale data
                if (presenceSources.autoDetect.active &&
                    presenceSources.autoDetect.source === 'website' &&
                    presenceSources.autoDetect.presetName &&
                    presenceSources.autoDetect.presetName.toLowerCase().includes(platform.toLowerCase())) {
                    console.log(`[Solari Extension] Also clearing autoDetect website for ${platform}`);
                    presenceSources.autoDetect.active = false;
                    presenceSources.autoDetect.data = null;
                    presenceSources.autoDetect.source = null;
                    presenceSources.autoDetect.presetName = null;
                }

                // EXPLICIT CLEAR REMOVED: Rely on updatePresence() to manage priorities.
                // Previously, this forced a clear even if a higher priority source (like a game) was active,
                // causing the game status to vanish because setActivity's deduplication logic thought it was still set.

                // Trigger update to show next priority source (fallback handling)
                updatePresence();

                // Notify renderer
                if (mainWindow) {
                    mainWindow.webContents.send('extension-media-cleared', { platform });
                }
            }, 1000); // 1s grace period
        }
        return;
    }

    // 2. CANCEL PENDING CLEAR (if any) - Important for platform switching
    if (presenceSources.browserExtension.clearTimeout) {
        const pendingPlatform = presenceSources.browserExtension.platform;
        console.log(`[Solari Extension] Cancelling pending clear for ${pendingPlatform} (new data received for ${platform})`);
        clearTimeout(presenceSources.browserExtension.clearTimeout);
        presenceSources.browserExtension.clearTimeout = null;
    }

    // 2.5. Handle platform switch (e.g., Twitch -> YouTube)
    const previousPlatform = presenceSources.browserExtension.platform;
    if (previousPlatform && previousPlatform !== platform) {
        console.log(`[Solari Extension] Platform switch detected: ${previousPlatform} -> ${platform}`);
    }

    // 3. PREPARE DATA
    console.log(`[Solari Extension] Received ${platform} update:`, JSON.stringify(data));

    // Find matching preset for assets/Client ID
    const matchingPreset = presets.find(p => p.name.toLowerCase() === platform.toLowerCase()) ||
        presets.find(p => p.name.toLowerCase().includes(platform.toLowerCase()));

    if (matchingPreset) {
        console.log(`[Solari Debug] Found matching preset for ${platform}:`, matchingPreset.name, '| ClientID:', matchingPreset.clientId);
    } else {
        console.log(`[Solari Debug] NO matching preset found for ${platform}. Using fallback.`);
    }

    const presetToUse = matchingPreset || { name: platform, type: 3 }; // Fallback

    // Build buttons array from preset fields (same as loadPresetActivity)
    const buttons = [];
    if (presetToUse.button1Label && presetToUse.button1Url) {
        buttons.push({ label: presetToUse.button1Label, url: presetToUse.button1Url });
    }
    if (presetToUse.button2Label && presetToUse.button2Url) {
        buttons.push({ label: presetToUse.button2Label, url: presetToUse.button2Url });
    }

    // DEBUG: Log button building
    console.log('[Solari Extension] Preset button fields:', {
        button1Label: presetToUse.button1Label,
        button1Url: presetToUse.button1Url,
        button2Label: presetToUse.button2Label,
        button2Url: presetToUse.button2Url,
        builtButtons: buttons
    });

    // Construct Activity Object
    // NOTE: Don't include largeImageText for extension updates - it shows as extra text in Discord
    // The extension provides dynamic title/subtitle, so static preset text would be redundant

    // Skip details if it's just the platform name (redundant since app name shows "ASSISTINDO TWITCH" etc)
    let finalDetails = data.title || presetToUse.details;
    if (finalDetails && finalDetails.toLowerCase() === platform.toLowerCase()) {
        finalDetails = undefined; // Don't show redundant platform name
    }

    // TIMESTAMP PRESERVATION:
    // Only reset the timestamp when the platform actually changes.
    // When the platform stays the same but details change (viewer count, episode, category, channel),
    // we preserve the original timestamp to avoid the "elapsed time" resetting on Discord.
    const platformChanged = previousPlatform !== platform;
    if (platformChanged || !presenceSources.browserExtension.startTimestamp) {
        presenceSources.browserExtension.startTimestamp = Date.now();
        console.log(`[Solari Extension] New timestamp set for ${platform}:`, presenceSources.browserExtension.startTimestamp);
    } else {
        console.log(`[Solari Extension] Preserving existing timestamp for ${platform}:`, presenceSources.browserExtension.startTimestamp);
    }

    const activity = {
        type: presetToUse.type || 3, // Watching
        details: finalDetails,
        state: data.subtitle || presetToUse.state,
        largeImageKey: presetToUse.largeImageKey || 'logo',
        // largeImageText intentionally omitted for extension (causes duplicate text in Discord)
        smallImageKey: data.state === 'paused' ? 'pause' : (presetToUse.smallImageKey || 'play'),
        smallImageText: data.state === 'paused' ? 'Paused' : undefined,
        buttons: buttons.length > 0 ? buttons : undefined,
        // Use custom timestamp to preserve the original start time
        timestampMode: 'custom',
        customTimestamp: presenceSources.browserExtension.startTimestamp
    };

    // DEBUG: Log constructed activity with buttons
    console.log('[Solari Extension] Constructed activity:', JSON.stringify(activity, null, 2));

    // RESOLVE CLIENT ID (USING ROBUST RESOLVER)
    const finalClientId = resolveClientIdForPlatform(platform, presetToUse);

    // 4. UPDATE SOURCE STATE
    presenceSources.browserExtension.active = true;
    presenceSources.browserExtension.data = activity;
    presenceSources.browserExtension.platform = platform;
    presenceSources.browserExtension.clientId = finalClientId || null;
    presenceSources.browserExtension.presetName = presetToUse.name;
    presenceSources.browserExtension.timestamp = Date.now();

    // 5. TRIGGER UPDATE
    console.log(`[Solari Extension] Calling updatePresence for ${platform}...`);
    updatePresence();
    console.log(`[Solari Extension] updatePresence completed for ${platform}`);

    // 6. CONFIRMATION
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'media_update_applied',
            platform,
            preset: presetToUse.name
        }));
    }
}


function broadcastPluginList() {
    // Filter out blocked plugins AND the browser extension (not a real plugin)
    const plugins = Array.from(connectedPlugins.values())
        .filter(p => !blockedPlugins.has(p.name))
        .filter(p => p.name !== 'Solari Extension') // Browser extension is not a plugin
        .map(p => ({ id: p.id, name: p.name }));
    if (mainWindow) {
        mainWindow.webContents.send('plugin-list-updated', plugins);
        mainWindow.webContents.send('blocked-list-updated', Array.from(blockedPlugins));
    }
}

ipcMain.on('update-activity', (event, activity) => {
    // 1. Update Manual Source
    const hasData = (activity.details || activity.state);

    presenceSources.manualPreset.data = activity;
    presenceSources.manualPreset.active = hasData; // Only active if there's actual data
    presenceSources.manualPreset.clientId = activity.clientId;
    presenceSources.manualPreset.presetName = "Manual Update"; // Could be refined if we passed the name

    // Notify Renderer of manual mode state
    if (mainWindow) mainWindow.webContents.send('manual-mode-changed', presenceSources.manualPreset.active);

    // 2. Trigger Update
    if (isEnabled) {
        updatePresence();
        event.reply('activity-updated', true);
    } else {
        // Store it but don't apply if disabled
        event.reply('activity-updated', false);
    }
});

ipcMain.on('exit-manual-mode', (event) => {
    presenceSources.manualPreset.active = false;
    presenceSources.manualPreset.data = null;
    presenceSources.manualPreset.clientId = null;
    presenceSources.manualPreset.presetName = null;

    console.log('[Solari] Exiting manual mode via UI request');
    if (mainWindow) mainWindow.webContents.send('manual-mode-changed', false);

    updatePresence();
});

ipcMain.on('reset-activity', (event) => {
    // Clear manual source
    presenceSources.manualPreset.active = false;
    presenceSources.manualPreset.data = null;
    presenceSources.manualPreset.clientId = null;

    // Trigger update (will fallback to auto-detect or default)
    updatePresence();
    event.reply('activity-reset');
});

ipcMain.on('toggle-activity', (event, enabled) => {
    isEnabled = enabled;
    if (updateTimeout) clearTimeout(updateTimeout);

    if (isEnabled) {
        // Re-apply current state
        updatePresence();
    } else {
        // Clear RPC
        if (rpcClient) rpcClient.clearActivity().catch(() => { });
    }
});

// Theme System
ipcMain.on('save-theme', (event, theme) => {
    appSettings.theme = theme;
    saveData();
    console.log('[Solari] Theme saved:', theme);
});

ipcMain.on('get-theme', (event) => {
    event.reply('theme-loaded', appSettings.theme || 'default');
});


ipcMain.on('update-priority-settings', (event, priorities) => {
    prioritySettings = { ...prioritySettings, ...priorities };
    saveData();
    console.log('[Solari] Priority settings updated:', prioritySettings);

    // Re-evaluate priority (force update since priorities changed)
    currentPrioritySource = null; // Reset to force re-evaluation
    updateRichPresenceWithPriority(true);
});

ipcMain.on('spotify-control', (event, action) => {
    console.log('[Solari] Sending Spotify control to plugin:', action);
    if (wss) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'spotify_control',
                    action: action
                }));
            }
        });
    }
});

// Show toast to renderer
function sendToast(title, message, type = 'info') {
    if (mainWindow) {
        mainWindow.webContents.send('show-toast', { title, message, type });
    }
}

// Export debug logs
ipcMain.handle('export-logs', async () => {
    const { dialog } = require('electron');
    const labels = getLabels();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const result = await dialog.showSaveDialog(mainWindow, {
        title: labels.exportLogs,
        defaultPath: `solari-debug-${timestamp}.txt`,
        filters: [{ name: 'Text', extensions: ['txt'] }]
    });

    if (!result.canceled && result.filePath) {
        const logContent = [
            '=== Solari Debug Logs ===',
            `Generated: ${new Date().toLocaleString()}`,
            `Version: ${require('../../package.json').version}`,
            `Platform: ${process.platform}`,
            `Electron: ${process.versions.electron}`,
            '',
            '=== Logs ===',
            ...debugLogs
        ].join('\n');

        fs.writeFileSync(result.filePath, logContent);
        addLog('[Debug] Logs exported to: ' + result.filePath);
        return { success: true };
    }
    return { success: false };
});



// Export presets to JSON file
ipcMain.handle('export-presets', async () => {
    const { dialog } = require('electron');
    const labels = getLabels();
    const result = await dialog.showSaveDialog(mainWindow, {
        title: labels.exportPresets,
        defaultPath: 'solari-presets.json',
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (!result.canceled && result.filePath) {
        const exportData = {
            version: '1.0',
            presets: presets,
            autoDetectMappings: autoDetectMappings,
            websiteMappings: websiteMappings
        };
        fs.writeFileSync(result.filePath, JSON.stringify(exportData, null, 2));
        console.log('[Solari] Presets exported to:', result.filePath);
        return { success: true };
    }
    return { success: false };
});

// Import presets from JSON file
ipcMain.handle('import-presets', async () => {
    const { dialog } = require('electron');
    const labels = getLabels();
    const result = await dialog.showOpenDialog(mainWindow, {
        title: labels.importPresets,
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        try {
            const content = fs.readFileSync(result.filePaths[0], 'utf-8');
            const importData = JSON.parse(content);

            // Merge or replace presets
            if (importData.presets && Array.isArray(importData.presets)) {
                presets = [...presets, ...importData.presets];
            }
            if (importData.autoDetectMappings && Array.isArray(importData.autoDetectMappings)) {
                autoDetectMappings = [...autoDetectMappings, ...importData.autoDetectMappings];
            }
            if (importData.websiteMappings && Array.isArray(importData.websiteMappings)) {
                websiteMappings = [...websiteMappings, ...importData.websiteMappings];
            }

            saveData();
            mainWindow.webContents.send('presets-updated', presets);
            console.log('[Solari] Presets imported successfully');
            return { success: true };
        } catch (err) {
            console.error('[Solari] Import error:', err);
            return { success: false, error: err.message };
        }
    }
    return { success: false };
});

// Get App Version
ipcMain.handle('get-app-version', () => {
    return require('../../package.json').version;
});

// Resolve Imgur album/page URLs to direct image URLs
ipcMain.handle('resolve-imgur-url', async (event, url) => {
    const https = require('https');
    const http = require('http');

    console.log('[Solari] ========== IMGUR RESOLVER ==========');
    console.log('[Solari] Input URL:', url);

    try {
        // If it's already a direct image URL (i.imgur.com with extension), just clean and return
        if (url.includes('i.imgur.com') && /\.(png|jpg|jpeg|gif|webp)/i.test(url)) {
            console.log('[Solari] Already direct URL');
            return cleanImgurUrl(url);
        }

        // Function to fetch URL with redirect following
        const fetchWithRedirects = (targetUrl, maxRedirects = 5) => {
            return new Promise((resolve, reject) => {
                const doFetch = (currentUrl, redirectsLeft) => {
                    const protocol = currentUrl.startsWith('https') ? https : http;
                    const options = {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.5'
                        }
                    };

                    protocol.get(currentUrl, options, (res) => {
                        // Handle redirects
                        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                            if (redirectsLeft <= 0) {
                                reject(new Error('Too many redirects'));
                                return;
                            }
                            let newUrl = res.headers.location;
                            if (!newUrl.startsWith('http')) {
                                const urlObj = new URL(currentUrl);
                                newUrl = urlObj.origin + newUrl;
                            }
                            console.log('[Solari] Redirect to:', newUrl);
                            doFetch(newUrl, redirectsLeft - 1);
                            return;
                        }

                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => resolve(data));
                    }).on('error', reject);
                };
                doFetch(targetUrl, maxRedirects);
            });
        };

        const html = await fetchWithRedirects(url);
        console.log('[Solari] Fetched HTML length:', html.length);

        if (html.length < 100) {
            console.log('[Solari] HTML too short, likely error page');
            return url;
        }

        // Strategy 1: og:image meta tag - MOST RELIABLE
        // Try multiple regex patterns
        let ogUrl = null;
        const ogPatterns = [
            /property="og:image"\s+content="([^"]+)"/i,
            /content="([^"]+)"\s+property="og:image"/i,
            /property='og:image'\s+content='([^']+)'/i,
            /content='([^']+)'\s+property='og:image'/i,
            /<meta[^>]+og:image[^>]+content="([^"]+)"/i
        ];

        for (const pattern of ogPatterns) {
            const match = html.match(pattern);
            if (match && match[1] && match[1].includes('imgur')) {
                ogUrl = match[1].split('?')[0].replace('http://', 'https://');
                console.log('[Solari] Found og:image:', ogUrl);
                break;
            }
        }

        if (ogUrl) {
            return cleanImgurUrl(ogUrl);
        }

        // Strategy 2: Look for i.imgur.com URLs directly in HTML
        const directMatch = html.match(/https?:\/\/i\.imgur\.com\/[a-zA-Z0-9]+\.(png|jpg|jpeg|gif|webp)/i);
        if (directMatch) {
            console.log('[Solari] Found direct URL in HTML:', directMatch[0]);
            return cleanImgurUrl(directMatch[0]);
        }

        // Strategy 3: JSON data
        const hashMatch = html.match(/"hash"\s*:\s*"([a-zA-Z0-9]{5,10})"/);
        const extMatch = html.match(/"ext"\s*:\s*"\.?(png|jpg|jpeg|gif|webp)"/i);

        if (hashMatch && extMatch) {
            const ext = extMatch[1].replace('.', '');
            const imageUrl = `https://i.imgur.com/${hashMatch[1]}.${ext}`;
            console.log('[Solari] Found via JSON:', imageUrl);
            return imageUrl;
        }

        console.log('[Solari] Could not find image URL');
        console.log('[Solari] HTML preview:', html.substring(0, 500));
        return url;

    } catch (err) {
        console.error('[Solari] Error:', err.message);
        return url;
    }
});

// Helper function to clean Imgur URLs (remove thumbnail suffixes)
function cleanImgurUrl(url) {
    if (!url) return url;
    url = url.split('?')[0]; // Remove query params

    // Validate that the URL looks like a proper Imgur direct URL
    // Minimum ID length should be 5 characters (Imgur uses 5-7 char IDs)
    const validCheck = url.match(/https:\/\/i\.imgur\.com\/([a-zA-Z0-9]{5,})\.(png|jpg|jpeg|gif|webp)/i);
    if (!validCheck) {
        console.log('[Solari] URL does not match valid Imgur format:', url);
        return url;
    }

    // Pattern: https://i.imgur.com/ID[suffix].extension
    // Suffixes: s, b, t, m, l, h (thumbnails)
    // ID must be at least 4 chars + 1 suffix = 5 total
    const match = url.match(/https:\/\/i\.imgur\.com\/([a-zA-Z0-9]{4,})([sbtmlh])(\.(png|jpg|jpeg|gif|webp))/i);
    if (match) {
        const id = match[1];
        const suffix = match[2];
        const ext = match[3];
        console.log('[Solari] Cleaned URL:', `https://i.imgur.com/${id}${ext}`, '(removed suffix:', suffix + ')');
        return `https://i.imgur.com/${id}${ext}`;
    }
    return url;
}

ipcMain.on('send-toast', (event, message) => { if (wss) wss.clients.forEach(client => { if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify({ type: 'show_toast', message, toastType: 'info' })); }); });
ipcMain.on('update-afk-settings', (event, settings) => {
    // Sync with Solari's system AFK
    if (settings.timeoutMinutes) {
        systemAFKSettings.timeoutMinutes = settings.timeoutMinutes;
        console.log(`[Solari] Updated AFK timeout from UI: ${systemAFKSettings.timeoutMinutes} min`);
    }
    if (settings.enabled !== undefined) {
        systemAFKSettings.enabled = settings.enabled;
    }
    if (settings.afkDisabledPresets) {
        systemAFKSettings.afkDisabledPresets = settings.afkDisabledPresets;
        console.log(`[Solari] Updated AFK disabled presets: ${settings.afkDisabledPresets.join(', ') || 'none'}`);
    }
    // Forward to all connected plugins
    if (wss) wss.clients.forEach(client => { if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify({ type: 'update_afk_settings', settings })); });
});
ipcMain.on('save-default', (event, activity) => { defaultActivity = activity; saveData(); if (!currentActivity.details && !currentActivity.state) setActivity({}); event.reply('default-saved'); });
ipcMain.on('save-preset', (event, preset) => { presets.push(preset); saveData(); event.reply('presets-updated', presets); });
ipcMain.on('update-preset', (event, { index, preset }) => {
    if (index >= 0 && index < presets.length) {
        presets[index] = preset;
        saveData();
        event.reply('presets-updated', presets);
        console.log(`[Solari] Preset updated at index ${index}: ${preset.name}`);
    }
});
ipcMain.on('delete-preset', (event, index) => { presets.splice(index, 1); saveData(); event.reply('presets-updated', presets); });
ipcMain.on('get-data', (event) => {
    event.reply('data-loaded', {
        defaultActivity,
        presets,
        lastFormState,
        autoDetectEnabled,
        autoDetectMappings, // For AFK disable preset selection
        afkConfig: cachedPluginAfkConfig, // Send cached config from plugin
        language: appSettings.language, // Send current language
        manualMode: presenceSources.manualPreset.active, // Send manual mode status
        setupCompleted: setupCompleted, // Send setup completion status
        rpcConnected: rpcConnected, // Send current RPC connection status
        ecoMode: global.ecoMode // Send eco mode status
    });
    broadcastPluginList();
});
ipcMain.on('save-form-state', (event, formState) => { lastFormState = formState; saveData(); });
ipcMain.on('block-plugin', (event, pluginName) => { blockedPlugins.add(pluginName); saveData(); broadcastPluginList(); });
ipcMain.on('unblock-plugin', (event, pluginName) => { blockedPlugins.delete(pluginName); saveData(); broadcastPluginList(); });
ipcMain.on('update-spotify-plugin-settings', (event, settings) => {
    // Forward to all connected SpotifySync plugins
    if (wss) wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'spotify_sync_settings_update',
                settings: settings
            }));
        }
    });
});

// ===== SOUNDBOARD HOTKEY PLAYBACK HELPER =====
// Play sound via IPC to renderer (called when global hotkey is pressed)
function playSoundByIdFromHotkey(soundId) {
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('soundboard:play-from-hotkey', soundId);
    }
}

// Callback for global shortcut - this is called when user presses a registered hotkey
function handleShortcutPlay(soundId) {
    playSoundByIdFromHotkey(soundId);
}

// Initialize soundboard shortcuts after app is ready
function initializeSoundBoardShortcutsOnStartup() {
    if (soundBoard) {
        soundBoard.initializeShortcuts(handleShortcutPlay);
    }
}

// Call init after a delay to ensure soundBoard is loaded
app.whenReady().then(() => {
    setTimeout(initializeSoundBoardShortcutsOnStartup, 3000);
});

// ===== PLUGIN MANAGER HANDLERS =====

// Helper to get BetterDiscord plugins path (Standard Windows Path)
function getBDPluginsPath() {
    return path.join(app.getPath('appData'), 'BetterDiscord', 'plugins');
}

ipcMain.handle('plugin:check-installed', async (event, fileName) => {
    try {
        const pluginsPath = getBDPluginsPath();
        const filePath = path.join(pluginsPath, fileName);
        return fs.existsSync(filePath);
    } catch (e) {
        console.error('[Solari] Error checking plugin:', e);
        return false;
    }
});

ipcMain.handle('plugin:download', async (event, { url, fileName }) => {
    const https = require('https');
    const pluginsPath = getBDPluginsPath();
    const filePath = path.join(pluginsPath, fileName);

    console.log(`[Solari] Attempting to download plugin to: ${filePath}`);

    // Ensure directory exists
    if (!fs.existsSync(pluginsPath)) {
        console.log('[Solari] Plugins folder not found, creating:', pluginsPath);
        try {
            fs.mkdirSync(pluginsPath, { recursive: true });
        } catch (e) {
            console.error('[Solari] Failed to create plugins dir:', e);
            return { success: false, error: 'Could not create plugins directory' };
        }
    }

    return new Promise((resolve) => {
        const file = fs.createWriteStream(filePath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                fs.unlink(filePath, () => { }); // Delete partial
                resolve({ success: false, error: `HTTP Status ${response.statusCode}` });
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close(() => {
                    console.log('[Solari] Plugin downloaded successfully');
                    resolve({ success: true });
                });
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => { }); // Delete partial
            console.error('[Solari] Download error:', err);
            resolve({ success: false, error: err.message });
        });
    });
});

// ===== SOUNDBOARD IPC HANDLERS =====


// Check if VB-Cable driver is installed (detect CABLE Input/Output devices)
ipcMain.handle('soundboard:check-driver-installed', async () => {
    try {
        // Use PowerShell to list audio devices and check for VB-Cable
        return new Promise((resolve) => {
            exec('powershell -Command "Get-WmiObject Win32_SoundDevice | Select-Object Name | ConvertTo-Json"', (error, stdout) => {
                if (error) {
                    console.error('[Solari] Error checking audio devices:', error);
                    resolve({ installed: false, error: error.message });
                    return;
                }

                try {
                    const devices = JSON.parse(stdout || '[]');
                    const deviceList = Array.isArray(devices) ? devices : [devices];
                    const vbCableFound = deviceList.some(d =>
                        d && d.Name && (
                            d.Name.toLowerCase().includes('cable') ||
                            d.Name.toLowerCase().includes('vb-audio') ||
                            d.Name.toLowerCase().includes('voicemeeter')
                        )
                    );

                    console.log('[Solari] VB-Cable detection:', vbCableFound ? 'FOUND' : 'NOT FOUND');
                    resolve({
                        installed: vbCableFound,
                        devices: deviceList.map(d => d?.Name).filter(Boolean)
                    });
                } catch (parseError) {
                    console.error('[Solari] Error parsing audio devices:', parseError);
                    resolve({ installed: false, error: parseError.message });
                }
            });
        });
    } catch (e) {
        console.error('[Solari] Error checking VB-Cable installation:', e);
        return { installed: false, error: e.message };
    }
});

// Get available audio output devices for SoundBoard
ipcMain.handle('soundboard:get-audio-devices', async () => {
    try {
        // This will be called from renderer with Web Audio API
        // Just return success, actual enumeration happens in renderer
        return { success: true };
    } catch (e) {
        console.error('[Solari] Error getting audio devices:', e);
        return { success: false, error: e.message };
    }
});

ipcMain.handle('soundboard:get-sounds', () => {
    if (!soundBoard) return [];
    return soundBoard.sounds.map(s => ({
        id: s.id,
        name: s.name,
        filename: s.filename,
        category: s.category,
        customCategory: s.customCategory,
        size: s.size,
        shortcut: s.shortcut,
        volume: s.volume,
        favorite: s.favorite,
        color: s.color,
        loop: s.loop
    }));
});

ipcMain.handle('soundboard:get-settings', () => {
    return soundBoard ? soundBoard.settings : null;
});

// File picker dialog for adding sounds
ipcMain.removeHandler('soundboard:pick-file');
ipcMain.handle('soundboard:pick-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Audio Files',
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }
        ]
    });
    return result;
});

ipcMain.handle('soundboard:add-sound', async (event, sourcePath, name, category) => {
    try {
        if (!soundBoard) throw new Error('SoundBoard not initialized');
        const sound = soundBoard.addSound(sourcePath, name, category);
        saveData();
        return { success: true, sound };
    } catch (e) {
        console.error('[SoundBoard IPC] Error adding sound:', e);
        return { success: false, error: e.message };
    }
});

ipcMain.handle('soundboard:delete-sound', async (event, soundId) => {
    try {
        if (!soundBoard) throw new Error('SoundBoard not initialized');
        const success = soundBoard.deleteSound(soundId);
        if (success) saveData();
        return { success };
    } catch (e) {
        console.error('[SoundBoard IPC] Error deleting sound:', e);
        return { success: false, error: e.message };
    }
});

ipcMain.handle('soundboard:update-sound', async (event, soundId, updates) => {
    try {
        if (!soundBoard) throw new Error('SoundBoard not initialized');
        const sound = soundBoard.updateSound(soundId, updates);
        if (sound) {
            saveData();
            // Re-register shortcuts if shortcut was updated
            if (updates.shortcut !== undefined) {
                registerGlobalShortcuts();
            }
        }
        return { success: true, sound };
    } catch (e) {
        console.error('[SoundBoard IPC] Error updating sound:', e);
        return { success: false, error: e.message };
    }
});

ipcMain.handle('soundboard:update-settings', async (event, settings) => {
    try {
        if (!soundBoard) throw new Error('SoundBoard not initialized');
        soundBoard.updateSettings(settings);
        saveData();
        return { success: true, settings: soundBoard.settings };
    } catch (e) {
        console.error('[SoundBoard IPC] Error updating settings:', e);
        return { success: false, error: e.message };
    }
});

ipcMain.handle('soundboard:play', async (event, soundId) => {
    try {
        if (!soundBoard || !soundServer) {
            throw new Error('SoundBoard not initialized');
        }

        const sound = soundBoard.getSoundById(soundId);
        if (!sound) throw new Error('Sound not found');

        const url = `${soundServer.getBaseUrl()}/sounds/${soundId}`;
        const volume = sound.volume * soundBoard.settings.globalVolume;
        const loop = sound.loop || false;

        // Add to play history
        soundBoard.addToHistory(soundId);
        saveData();

        // Send to all connected plugins via WebSocket
        if (wss) {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'soundboard:play',
                        payload: { soundId, url, volume, loop }
                    }));
                }
            });
        }

        return { success: true };
    } catch (e) {
        console.error('[SoundBoard IPC] Error playing sound:', e);
        return { success: false, error: e.message };
    }
});

// Toggle favorite
ipcMain.handle('soundboard:toggle-favorite', async (event, soundId) => {
    try {
        if (!soundBoard) throw new Error('SoundBoard not initialized');
        const sound = soundBoard.toggleFavorite(soundId);
        if (sound) saveData();
        return { success: true, sound };
    } catch (e) {
        console.error('[SoundBoard IPC] Error toggling favorite:', e);
        return { success: false, error: e.message };
    }
});

// Get favorites
ipcMain.handle('soundboard:get-favorites', () => {
    if (!soundBoard) return [];
    return soundBoard.getFavorites();
});

// Get play history
ipcMain.handle('soundboard:get-history', () => {
    if (!soundBoard) return [];
    return soundBoard.playHistory;
});

// Stop all sounds
ipcMain.handle('soundboard:stop-all', async () => {
    console.log('[SoundBoard IPC] stop-all invoked');
    try {
        if (wss) {
            let sentCount = 0;
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'soundboard:stop-all'
                    }));
                    sentCount++;
                }
            });
            console.log('[SoundBoard IPC] stop-all sent to', sentCount, 'clients');
        }
        return { success: true };
    } catch (e) {
        console.error('[SoundBoard IPC] Error stopping all sounds:', e);
        return { success: false, error: e.message };
    }
});

// Get categories
ipcMain.handle('soundboard:get-categories', () => {
    if (!soundBoard) return ['default', 'custom'];
    return soundBoard.categories;
});

// Add category
ipcMain.handle('soundboard:add-category', async (event, name) => {
    try {
        if (!soundBoard) throw new Error('SoundBoard not initialized');
        const categories = soundBoard.addCategory(name);
        saveData();
        return { success: true, categories };
    } catch (e) {
        console.error('[SoundBoard IPC] Error adding category:', e);
        return { success: false, error: e.message };
    }
});

// Remove category
ipcMain.handle('soundboard:remove-category', async (event, name) => {
    try {
        if (!soundBoard) throw new Error('SoundBoard not initialized');
        const categories = soundBoard.removeCategory(name);
        saveData();
        return { success: true, categories };
    } catch (e) {
        console.error('[SoundBoard IPC] Error removing category:', e);
        return { success: false, error: e.message };
    }
});

// Export soundboard library
ipcMain.handle('soundboard:export', async () => {
    try {
        const result = await dialog.showSaveDialog(mainWindow, {
            title: 'Export SoundBoard Library',
            defaultPath: 'solari-soundboard-backup.json',
            filters: [{ name: 'JSON', extensions: ['json'] }]
        });

        if (!result.canceled && result.filePath && soundBoard) {
            const exportData = soundBoard.toJSON();
            fs.writeFileSync(result.filePath, JSON.stringify(exportData, null, 2));
            return { success: true, path: result.filePath };
        }
        return { success: false };
    } catch (e) {
        console.error('[SoundBoard IPC] Error exporting:', e);
        return { success: false, error: e.message };
    }
});

// Import soundboard library (metadata only, not files)
ipcMain.handle('soundboard:import', async () => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Import SoundBoard Library',
            filters: [{ name: 'JSON', extensions: ['json'] }],
            properties: ['openFile']
        });

        if (!result.canceled && result.filePaths.length > 0 && soundBoard) {
            const content = fs.readFileSync(result.filePaths[0], 'utf-8');
            const importData = JSON.parse(content);

            // Merge settings and categories
            if (importData.settings) {
                soundBoard.settings = { ...soundBoard.settings, ...importData.settings };
            }
            if (importData.categories) {
                importData.categories.forEach(cat => {
                    if (!soundBoard.categories.includes(cat)) {
                        soundBoard.categories.push(cat);
                    }
                });
            }

            saveData();
            return { success: true };
        }
        return { success: false };
    } catch (e) {
        console.error('[SoundBoard IPC] Error importing:', e);
        return { success: false, error: e.message };
    }
});

// ===== END SOUNDBOARD HANDLERS =====

function initializeWebSocketServer() {
    wss = new WebSocket.Server({ host: CONSTANTS.WS_HOST, port: CONSTANTS.WS_PORT });
    wss.on('connection', (ws) => {
        const wsId = `ws_${Date.now()}`;
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);

                // DEBUG: Log all incoming messages
                console.log('[Solari WSS] Received message type:', data.type, '| Content:', JSON.stringify(data).substring(0, 200));

                switch (data.type) {
                    case 'handshake':
                        const pluginName = data.source || 'UnknownPlugin';
                        // Remove any existing plugin with the same name to avoid duplicates
                        for (const [existingId, existingPlugin] of connectedPlugins.entries()) {
                            if (existingPlugin.name === pluginName) {
                                connectedPlugins.delete(existingId);
                            }
                        }
                        const pluginInfo = { id: pluginIdCounter++, name: pluginName, ws };
                        connectedPlugins.set(wsId, pluginInfo);
                        broadcastPluginList();
                        break;

                    case 'spotify_config':
                    case 'spotify-config-updated': // Handle both types
                        // Forward config from plugin to renderer
                        if (mainWindow) {
                            // Update Settings UI
                            mainWindow.webContents.send('spotify-data-loaded', { settings: data.config, schema: data.schema });

                            // Signal plugin is connected (Important for UI Green Dot)
                            mainWindow.webContents.send('spotify-config-updated', data.config);

                            // Update Auth UI
                            mainWindow.webContents.send('spotify-status-update', {
                                loggedIn: !!(data.config.spotifyAccessToken && data.config.spotifyRefreshToken),
                                clientId: data.config.spotifyClientId
                            });
                        }

                        // Update Main Process State
                        if (data.config && data.config.spotifyClientId) spotifyClientId = data.config.spotifyClientId;
                        if (data.config && data.config.spotifyAccessToken) {
                            spotifyTokens.accessToken = data.config.spotifyAccessToken;
                            spotifyTokens.refreshToken = data.config.spotifyRefreshToken;
                            spotifyTokens.tokenExpiry = data.config.spotifyTokenExpiry;
                        }
                        break;

                    case 'setActivity':
                        const plugin = connectedPlugins.get(wsId);
                        if (plugin && blockedPlugins.has(plugin.name)) return;

                        // Treat plugin update as manual preset update
                        // Treat plugin update as manual preset update
                        if (data.activity) {
                            // Smart Resolve: If no Client ID, try to find a mapping
                            if (!data.activity.clientId && websiteMappings.length > 0) {
                                const content = [
                                    data.activity.details,
                                    data.activity.state,
                                    data.activity.largeImageKey,
                                    data.activity.smallImageKey
                                ].filter(Boolean).join(' ').toLowerCase();

                                for (const mapping of websiteMappings) {
                                    if (content.includes(mapping.keyword.toLowerCase())) {
                                        const preset = presets.find(p => p.name === mapping.presetName);
                                        if (preset) {
                                            data.activity.clientId = preset.clientId;
                                            // Double check identity mapping
                                            if (!data.activity.clientId && preset.identityId) {
                                                const id = identities.find(i => i.id === preset.identityId);
                                                if (id) data.activity.clientId = id.clientId;
                                            }
                                            console.log(`[Solari] Extension Activity resolved to Preset: ${preset.name} (Client ID: ${data.activity.clientId})`);
                                            break;
                                        }
                                    }
                                }
                            }

                            presenceSources.manualPreset.active = true;
                            presenceSources.manualPreset.data = data.activity;
                            presenceSources.manualPreset.clientId = data.activity.clientId;
                            presenceSources.manualPreset.presetName = `PL: ${plugin ? plugin.name : 'External'}`;
                        }

                        if (isEnabled) {
                            updatePresence();
                            ws.send(JSON.stringify({ type: 'success', message: 'Activity updated' }));
                        }
                        break;
                    case 'clearActivity':
                        // Clear manual source
                        presenceSources.manualPreset.active = false;
                        presenceSources.manualPreset.data = null;
                        presenceSources.manualPreset.clientId = null;

                        updatePresence();
                        ws.send(JSON.stringify({ type: 'success', message: 'Activity reset' }));
                        break;
                    case 'user_info':
                        if (mainWindow) mainWindow.webContents.send('user-info-updated', data.user);
                        break;
                    case 'afk_logs':
                        const pLogs = connectedPlugins.get(wsId);
                        if (pLogs && blockedPlugins.has(pLogs.name)) return;
                        if (mainWindow) mainWindow.webContents.send('afk-logs-updated', data.logs);
                        break;
                    case 'afk_config':
                        // Plugin is sending its current config - sync with Solari's system AFK
                        if (data.config) {
                            cachedPluginAfkConfig = data.config; // Cache for Renderer init

                            if (data.config.timeoutMinutes) {
                                systemAFKSettings.timeoutMinutes = data.config.timeoutMinutes;
                                console.log(`[Solari] Synced AFK timeout from plugin: ${systemAFKSettings.timeoutMinutes} min`);
                            }
                            if (data.config.enabled !== undefined) {
                                systemAFKSettings.enabled = data.config.enabled;
                                console.log(`[Solari] Synced AFK enabled from plugin: ${systemAFKSettings.enabled}`);
                            }
                        }
                        // Forward to renderer
                        if (mainWindow) mainWindow.webContents.send('afk-config-updated', data.config);
                        break;

                    case 'spotify_control_clicked':
                        // Log control clicks
                        console.log(`[Solari] Spotify control: ${data.action}`);
                        break;

                    case 'media_update':
                        // Handle browser extension media updates (Netflix, YouTube, Twitch)
                        handleBrowserMediaUpdate(data, ws);
                        break;
                }
            } catch (error) { console.error('Message parse error:', error); }
        });
        ws.on('close', () => {
            const disconnectedPlugin = connectedPlugins.get(wsId);
            console.log('[Solari WSS] WebSocket closed for:', disconnectedPlugin?.name || wsId);
            connectedPlugins.delete(wsId);
            broadcastPluginList();
        });
    });
}

// ===== AUTO-DETECTION FUNCTIONS =====

function openAutoDetectSettings() {
    if (autoDetectWindow) {
        autoDetectWindow.focus();
        return;
    }

    autoDetectWindow = new BrowserWindow({
        width: 700,
        height: 500,
        parent: mainWindow,
        modal: false,
        resizable: false,
        backgroundColor: '#0f0c29',
        icon: ICON_PATH,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    autoDetectWindow.loadFile(path.join(__dirname, '..', 'renderer', 'autodetect.html'));

    autoDetectWindow.on('closed', () => {
        autoDetectWindow = null;
    });
}

function startAutoDetection() {
    if (autoDetectInterval) return;

    console.log('[Solari] Starting auto-detection...');
    autoDetectInterval = setInterval(() => checkRunningProcesses(false), 2000);
    checkRunningProcesses(true); // Run immediately with isFirstCheck=true
}

function stopAutoDetection() {
    if (autoDetectInterval) {
        clearInterval(autoDetectInterval);
        autoDetectInterval = null;
        currentDetectedProcess = null;
        console.log('[Solari] Auto-detection stopped');
    }
}

function checkRunningProcesses(isFirstCheck = false) {
    if (!autoDetectEnabled) return;
    if (autoDetectMappings.length === 0 && websiteMappings.length === 0) return;

    // Check if we're in backoff mode due to repeated errors
    if (Date.now() < processCheckBackoffUntil) {
        return; // Skip this check, we're backing off
    }

    // Prevent concurrent tasklist calls (mutex)
    if (isProcessCheckRunning) {
        return; // Previous check still running
    }

    // First check browser window titles for website detection
    if (websiteMappings.length > 0) {
        checkBrowserWindowTitles(isFirstCheck);
    }

    // Then check running processes
    if (autoDetectMappings.length > 0) {
        isProcessCheckRunning = true; // Lock

        exec('tasklist /FO CSV /NH', { encoding: 'utf8', timeout: 5000 }, (error, stdout, stderr) => {
            isProcessCheckRunning = false; // Unlock

            if (error) {
                processCheckErrorCount++;
                console.error('[Solari] Failed to get process list:', error);

                // If too many errors, enter backoff mode
                if (processCheckErrorCount >= CONSTANTS.MAX_PROCESS_CHECK_ERRORS) {
                    processCheckBackoffUntil = Date.now() + CONSTANTS.BACKOFF_DURATION_MS;
                    console.warn(`[Solari] Too many tasklist errors, backing off for ${CONSTANTS.BACKOFF_DURATION_MS / 1000}s`);
                    processCheckErrorCount = 0; // Reset for next cycle
                }
                return;
            }

            // Success! Reset error count
            processCheckErrorCount = 0;

            const runningProcesses = stdout.toLowerCase();
            let foundProcess = false;

            // Check each mapping
            for (const mapping of autoDetectMappings) {
                const processName = mapping.processName.toLowerCase();
                if (runningProcesses.includes(processName)) {
                    foundProcess = true;
                    // Process found! Check if it's already the current one
                    if (currentDetectedProcess !== processName) {
                        currentDetectedProcess = processName;
                        currentDetectedPresetName = mapping.presetName; // Track for AFK disable
                        currentDetectedWebsite = null; // Process takes priority
                        console.log(`[Solari] Detected: ${processName} -> Preset: ${mapping.presetName}`);

                        // NEW LOGIC: Update consolidated state
                        const preset = presets.find(p => p.name === mapping.presetName);
                        if (preset) {
                            // Resolve Client ID from Identity
                            let finalClientId = preset.clientId;
                            // Check for linked identity by ID
                            if (!finalClientId && preset.identityId && identities) {
                                const identity = identities.find(i => i.id === preset.identityId);
                                if (identity) finalClientId = identity.clientId;
                            }
                            // Check for linked identity by Name (Fallback)
                            if (!finalClientId && identities) {
                                const idName = identities.find(i => i.name && i.name.toLowerCase() === preset.name.toLowerCase());
                                if (idName) finalClientId = idName.clientId;
                            }

                            // Build buttons array from preset fields (same as loadPresetActivity)
                            const buttons = [];
                            if (preset.button1Label && preset.button1Url) {
                                buttons.push({ label: preset.button1Label, url: preset.button1Url });
                            }
                            if (preset.button2Label && preset.button2Url) {
                                buttons.push({ label: preset.button2Label, url: preset.button2Url });
                            }

                            const activity = {
                                type: preset.type || 0,
                                details: preset.details || 'Playing',
                                state: preset.state || undefined, // Don't fallback to preset name
                                largeImageKey: preset.largeImageKey,
                                largeImageText: preset.largeImageText,
                                smallImageKey: preset.smallImageKey,
                                smallImageText: preset.smallImageText,
                                buttons: buttons.length > 0 ? buttons : undefined,
                                clientId: finalClientId // Use resolved ID
                            };

                            // Update autoDetect source
                            presenceSources.autoDetect.active = true;
                            presenceSources.autoDetect.data = activity;
                            presenceSources.autoDetect.source = 'process';
                            presenceSources.autoDetect.clientId = finalClientId;
                            presenceSources.autoDetect.presetName = preset.name;

                            updatePresence();
                        }
                    } else {
                        // Process is still same, check if we need to "renew" presence
                        // (e.g. if extension was cleared, process should take over again immediately)
                        if (presenceSources.autoDetect.source === 'process' && !presenceSources.autoDetect.active) {
                            presenceSources.autoDetect.active = true;
                            updatePresence();
                        }
                    }
                    return; // Found a match, stop checking
                }
            }

            // No mapped process found
            if (!foundProcess) {
                const wasProcessActive = currentDetectedProcess !== null;
                currentDetectedProcess = null;
                currentDetectedPresetName = null;

                // If we also don't have a website active, clear the autoDetect state
                if (currentDetectedWebsite === null) {
                    // Force clear if we were tracking a process OR if we think we are active but shouldn't be
                    if (presenceSources.autoDetect.source === 'process' || presenceSources.autoDetect.active) {
                        console.log('[Solari] Process closed. Clearing auto-detect state.');
                        presenceSources.autoDetect.active = false;
                        presenceSources.autoDetect.data = null;
                        presenceSources.autoDetect.source = null;
                        presenceSources.autoDetect.presetName = null;

                        updatePresence();
                    }
                }

                // Note: If website IS active, checkBrowserWindowTitles will handle keeping it alive
                // or clearing it if that also closes. We don't need complex fallback logic here anymore
                // because updatePresence() automatically falls back to defaultFallback if autoDetect becomes inactive.
            }

            // Detect shutdown/startup edge case
            else if (isFirstCheck && currentDetectedProcess === null && currentDetectedWebsite === null) {
                // Just ensure we're clear
                updatePresence();
            }
        });
    } else if (isFirstCheck && websiteMappings.length === 0) {
        // No App mappings and no website mappings on startup
        updatePresence();
    }
}

// Website Monitor (Backwards compatibility mode for non-extension users)
// (Note: Extension data always overrides this via priority system)
function checkBrowserWindowTitles(isFirstCheck = false) {
    // Skip website detection if user has chosen to use extension instead
    if (useExtensionForWeb) {
        // Clear any existing website detection state
        if (presenceSources.autoDetect.source === 'website') {
            presenceSources.autoDetect.active = false;
            presenceSources.autoDetect.data = null;
            presenceSources.autoDetect.source = null;
            presenceSources.autoDetect.presetName = null;
        }
        return;
    }

    if (isBrowserCheckRunning || Date.now() < processCheckBackoffUntil) return;

    const psCommand = `powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle -and ($_.ProcessName -match 'brave|chrome|firefox|edge|opera')} | Select-Object -ExpandProperty MainWindowTitle"`;
    isBrowserCheckRunning = true;

    exec(psCommand, { encoding: 'utf8', timeout: 5000 }, (error, stdout, stderr) => {
        isBrowserCheckRunning = false;
        let shouldClear = false;
        let foundWebsite = false;
        let matchedMapping = null;

        // 1. Check Execution Validity
        if (error || !stdout) {
            shouldClear = true;
        } else {
            // 2. Check Content Match
            const windowTitles = stdout.toLowerCase();
            for (const mapping of websiteMappings) {
                const keyword = mapping.keyword.toLowerCase();
                if (windowTitles.includes(keyword)) {
                    foundWebsite = true;
                    matchedMapping = mapping;
                    break; // Stop on first match
                }
            }
            if (!foundWebsite) shouldClear = true;
        }

        // 3. Handle Match Found (Success)
        if (foundWebsite && matchedMapping) {
            websiteCheckFailCount = 0; // Reset fail counter immediately on success

            // PRIORITY CHECK: If a process is already detected, it takes precedence.
            // Do NOT overwrite the App presence with the Website presence.
            if (currentDetectedProcess !== null) {
                // We reset the fail count (because site IS there), but we don't apply it.
                return;
            }

            // Apply Update
            if (presenceSources.autoDetect.presetName !== matchedMapping.presetName) {
                console.log(`[Solari-Monitor] Website detected: "${matchedMapping.keyword}" -> Preset: ${matchedMapping.presetName}`);

                const preset = presets.find(p => p.name === matchedMapping.presetName);
                if (preset) {
                    // Build buttons array from preset fields (same as loadPresetActivity)
                    const buttons = [];
                    if (preset.button1Label && preset.button1Url) {
                        buttons.push({ label: preset.button1Label, url: preset.button1Url });
                    }
                    if (preset.button2Label && preset.button2Url) {
                        buttons.push({ label: preset.button2Label, url: preset.button2Url });
                    }

                    // Build Basic Activity
                    const activity = {
                        type: preset.type || 0,
                        details: preset.details || 'Browsing',
                        state: preset.state || undefined, // Don't fallback to keyword
                        largeImageKey: preset.largeImageKey,
                        largeImageText: preset.largeImageText,
                        smallImageKey: preset.smallImageKey,
                        smallImageText: preset.smallImageText,
                        buttons: buttons.length > 0 ? buttons : undefined,
                        clientId: preset.clientId
                    };

                    presenceSources.autoDetect.active = true;
                    presenceSources.autoDetect.data = activity;
                    presenceSources.autoDetect.source = 'website';
                    presenceSources.autoDetect.clientId = preset.clientId;
                    presenceSources.autoDetect.presetName = preset.name;

                    // CRITICAL FIX: Update control variable so Process Monitor knows we are active
                    currentDetectedWebsite = matchedMapping.keyword;

                    updatePresence();
                }
            }
            return;
        }

        // 4. Handle Clear (Fail) with Debounce
        if (shouldClear) {
            websiteCheckFailCount++;
            // Wait for 3 consecutive failures (approx 15s) before clearing
            if (websiteCheckFailCount < 3) {
                return;
            }

            // Confirmed Failure - Proceed to Clear
            const wasWebsiteActive = currentDetectedWebsite !== null || presenceSources.autoDetect.source === 'website';

            if (wasWebsiteActive) {
                console.log('[Solari-Monitor] Website check failed (confirmed 3x). Clearing website state.');

                presenceSources.autoDetect.active = false;
                presenceSources.autoDetect.data = null;
                presenceSources.autoDetect.source = null;
                presenceSources.autoDetect.presetName = null;

                currentDetectedWebsite = null;
                if (currentDetectedProcess === null) {
                    currentAutoDetectPreset = null;
                }

                // Fallback Logic
                if (currentDetectedProcess === null) {
                    if (fallbackPresetIndex === -2) {
                        console.log('[Solari] Fallback: Disabling RPC');
                        currentActivity = {};
                        if (rpcClient && rpcConnected) rpcClient.clearActivity();
                        if (mainWindow) mainWindow.webContents.send('preset-auto-loaded', '🚫 RPC Desativada');
                    } else if (fallbackPresetIndex >= 0 && presets[fallbackPresetIndex]) {
                        const fallbackPreset = presets[fallbackPresetIndex];
                        console.log(`[Solari] Fallback: Loading preset ${fallbackPreset.name}`);
                        loadPresetActivity(fallbackPreset);
                        if (mainWindow) mainWindow.webContents.send('preset-auto-loaded', `Padrão: ${fallbackPreset.name}`);
                    } else {
                        currentActivity = {};
                        if (rpcClient && rpcConnected) rpcClient.clearActivity();
                    }
                }

                // Final update call to sync everything
                updatePresence();
            }
        }
    });
}

function loadPresetActivity(preset, isManual = false) {
    if (CONSTANTS.DEBUG_MODE || true) console.log(`[Solari] Loading preset "${preset.name}" with Client ID: ${preset.clientId}`);
    // Build buttons array
    const buttons = [];
    if (preset.button1Label && preset.button1Url) {
        buttons.push({ label: preset.button1Label, url: preset.button1Url });
    }
    if (preset.button2Label && preset.button2Url) {
        buttons.push({ label: preset.button2Label, url: preset.button2Url });
    }

    const activity = {
        type: preset.type || 0,
        details: preset.details || undefined,
        state: preset.state || undefined,
        largeImageKey: preset.largeImageKey || undefined,
        largeImageText: preset.largeImageText || undefined,
        smallImageKey: preset.smallImageKey || undefined,
        smallImageText: preset.smallImageText || undefined,
        buttons: buttons.length > 0 ? buttons : undefined,
        instance: false,
        clientId: preset.clientId // Include Client ID for auto-detect switching
    };

    // If Manual Mode (Tray), update state listeners
    if (isManual) {
        presenceSources.manualPreset.active = true;
        presenceSources.manualPreset.data = activity;
        presenceSources.manualPreset.clientId = preset.clientId;
        presenceSources.manualPreset.presetName = preset.name;
        if (mainWindow) mainWindow.webContents.send('manual-mode-changed', true);
    }

    setActivity(activity, preset.clientId); // Pass clientId explicitly 2nd arg
}

// Auto-detection IPC handlers
ipcMain.on('open-autodetect-settings', () => {
    openAutoDetectSettings();
});

ipcMain.on('toggle-autodetect', (event, enabled) => {
    autoDetectEnabled = enabled;
    saveData();

    if (enabled) {
        startAutoDetection();
    } else {
        stopAutoDetection();
    }
});

ipcMain.on('get-autodetect-data', (event) => {
    event.reply('autodetect-data-loaded', {
        presets: presets,
        mappings: autoDetectMappings,
        websiteMappings: websiteMappings,
        fallbackPresetIndex: fallbackPresetIndex,
        useExtensionForWeb: useExtensionForWeb
    });
});

ipcMain.on('save-website-mappings', (event, mappings) => {
    websiteMappings = mappings;
    saveData();
    console.log('[Solari] Website mappings saved:', mappings);
});

ipcMain.on('save-autodetect-mappings', (event, mappings) => {
    autoDetectMappings = mappings;
    saveData();
    console.log('[Solari] Auto-detect mappings saved:', mappings);
});

ipcMain.on('save-fallback-preset', (event, index) => {
    fallbackPresetIndex = index;
    saveData();
    console.log('[Solari] Fallback preset saved:', index >= 0 ? presets[index]?.name : 'None');
});

ipcMain.on('set-use-extension-for-web', (event, useExtension) => {
    useExtensionForWeb = useExtension;
    saveData();
    console.log('[Solari] Use extension for web set to:', useExtension);

    // If switching to extension mode, clear any existing autoDetect website state
    if (useExtension && presenceSources.autoDetect.source === 'website') {
        presenceSources.autoDetect.active = false;
        presenceSources.autoDetect.data = null;
        presenceSources.autoDetect.source = null;
        presenceSources.autoDetect.presetName = null;
    }
    // If switching to autoDetect mode, clear any existing extension state
    if (!useExtension && presenceSources.browserExtension.active) {
        presenceSources.browserExtension.active = false;
        presenceSources.browserExtension.data = null;
        presenceSources.browserExtension.platform = null;
    }
    updatePresence();
});

ipcMain.on('set-client-id', (event, newClientId) => {
    const { dialog } = require('electron');
    const labels = getLabels();
    clientId = newClientId;
    saveData();
    console.log('[Solari] Client ID updated to:', newClientId);
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: labels.clientIdUpdated,
        message: `${labels.clientIdMessage}\n${newClientId}`,
        detail: labels.restartRequired
    });
});

// ===== END AUTO-DETECTION =====

// ===== GLOBAL SHORTCUTS HANDLER =====

function handleShortcutPlay(soundId) {
    if (!soundBoard || !soundServer || !wss || !soundBoard.settings.enabled) return;

    const sound = soundBoard.getSoundById(soundId);
    if (!sound) return;

    const url = `${soundServer.getBaseUrl()}/sounds/${soundId}`;
    const volume = sound.volume * soundBoard.settings.globalVolume;
    const loop = sound.loop || false;

    // Add to specific soundboard history (optional, kept mainly for consistency)
    // soundBoard.addToHistory(soundId); 

    // Send to all connected plugins/renderers via WebSocket
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'soundboard:play',
                payload: { soundId, url, volume, loop }
            }));
        }
    });

    // Also notify main window directly if desired (redundant if using WS everywhere)
    if (mainWindow) {
        mainWindow.webContents.send('soundboard:play-direct', { soundId, url, volume, loop });
    }
}

// ===== IPC HANDLERS =====
// IPC handler for get-sounds
ipcMain.removeHandler('soundboard:get-sounds'); // Safety removal
ipcMain.handle('soundboard:get-sounds', async () => {
    console.log('[Main] soundboard:get-sounds called');
    if (!soundBoard) {
        console.error('[Main] SoundBoard instance is null');
        return [];
    }
    return soundBoard.sounds || [];
});

// IPC handler for get-settings
ipcMain.removeHandler('soundboard:get-settings'); // Safety removal
ipcMain.handle('soundboard:get-settings', async () => {
    console.log('[Main] soundboard:get-settings called');
    if (!soundBoard) {
        console.error('[Main] SoundBoard instance is null');
        return { enabled: false, globalVolume: 1.0, previewVolume: 0.5 };
    }
    return soundBoard.settings;
});

// IPC handler for re-registering shortcuts after sound update
ipcMain.handle('soundboard:refresh-shortcuts', () => {
    if (soundBoard) {
        soundBoard.initializeShortcuts((soundId) => handleShortcutPlay(soundId));
    }
    return { success: true };
});

ipcMain.handle('soundboard:register-hotkey', (event, soundId, accelerator) => {
    if (!soundBoard) return { success: false, error: 'SoundBoard not initialized' };

    // Ensure playCallback is set before registering
    if (!soundBoard.playCallback) {
        soundBoard.playCallback = handleShortcutPlay;
    }

    const success = soundBoard.registerShortcut(soundId, accelerator);
    if (success) saveData(); // Persist shortcut change
    return { success };
});

ipcMain.handle('soundboard:unregister-hotkey', (event, soundId) => {
    if (!soundBoard) return { success: false, error: 'SoundBoard not initialized' };
    const success = soundBoard.unregisterShortcut(soundId);
    if (success) saveData(); // Persist change
    return { success };
});

// soundboard:pick-file handler is defined earlier in the file (see line ~1610)
// ===== END GLOBAL SHORTCUTS =====

// Check if running as administrator and show warning if not
function checkAdminStatus() {
    const { dialog } = require('electron');

    // Skip if user chose not to be reminded
    if (appSettings.dontRemindAdmin) {
        console.log('[Solari] Admin warning disabled by user preference');
        return;
    }

    // Check if running as admin on Windows
    if (process.platform === 'win32') {
        exec('net session', { windowsHide: true }, (error) => {
            if (error) {
                // Not running as admin
                console.log('[Solari] Not running as administrator');

                const adminWarning = {
                    en: {
                        title: '⚠️ Administrator Mode',
                        message: 'Solari is not running as Administrator',
                        detail: 'If your Discord runs as Administrator, the Rich Presence may not work correctly.\n\nTo fix this, close Solari and run it as Administrator (right-click → Run as administrator).\n\nIf your Discord does NOT run as admin, you can ignore this message.',
                        dontRemind: "Don't remind again"
                    },
                    pt: {
                        title: '⚠️ Modo Administrador',
                        message: 'Solari não está executando como Administrador',
                        detail: 'Se o seu Discord executa como Administrador, o Rich Presence pode não funcionar corretamente.\n\nPara corrigir, feche o Solari e execute-o como Administrador (clique direito → Executar como administrador).\n\nSe seu Discord NÃO executa como admin, você pode ignorar esta mensagem.',
                        dontRemind: 'Não lembrar novamente'
                    }
                };

                const lang = appSettings.language === 'pt-BR' ? 'pt' : 'en';
                const warning = adminWarning[lang];

                dialog.showMessageBox(mainWindow, {
                    type: 'warning',
                    title: warning.title,
                    message: warning.message,
                    detail: warning.detail,
                    buttons: ['OK'],
                    checkboxLabel: warning.dontRemind,
                    checkboxChecked: false
                }).then((result) => {
                    if (result.checkboxChecked) {
                        appSettings.dontRemindAdmin = true;
                        saveData();
                        console.log('[Solari] User chose not to be reminded about admin mode');
                    }

                });
            } else {
                console.log('[Solari] Running as administrator');
            }
        });
    }
}

// App Ready
app.whenReady().then(() => {
    loadData();
    createMenu();
    createTray();
    createWindow();
    initializeDiscordRPC();
    initializeWebSocketServer();

    // Fetch app name from Discord API early so preview shows real name even when RPC is disconnected
    if (clientId) {
        const https = require('https');
        const fetchUrl = `https://discord.com/api/v10/applications/${clientId}/rpc`;
        const req = https.get(fetchUrl, (resp) => {
            let data = '';
            resp.on('data', (chunk) => data += chunk);
            resp.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.name && mainWindow) {
                        console.log('[Solari] Early app name fetch:', parsed.name);
                        mainWindow.webContents.send('app-name-loaded', parsed.name);
                    }
                } catch (e) {
                    console.log('[Solari] Early app name fetch failed to parse:', e.message);
                }
            });
        });
        req.on('error', (e) => console.log('[Solari] Early app name fetch error:', e.message));
        req.setTimeout(5000, () => { req.destroy(); });
    }

    // Initialize SoundBoard (Safe Mode)
    // Initialize SoundBoard (Lazy Load for faster startup)
    // Initialize SoundBoard immediately to prevent race conditions with Renderer
    try {
        console.log('[Solari] Initializing SoundSystem...');
        if (!SoundBoard) SoundBoard = require('./soundboard');
        if (!SoundServer) SoundServer = require('./soundServer');

        soundBoard = new SoundBoard();

        // First, scan for sound files on disk
        soundBoard.loadSounds();

        // Then, apply saved metadata (shortcuts, favorites, volume) to scanned sounds
        try {
            if (global.pendingSoundBoardData) {
                soundBoard.fromJSON(global.pendingSoundBoardData);
                console.log('[Solari] Applied saved soundboard metadata from pending.');
            } else if (fs.existsSync(DATA_PATH)) {
                const savedData = JSON.parse(fs.readFileSync(DATA_PATH));
                if (savedData.soundBoardData) {
                    soundBoard.fromJSON(savedData.soundBoardData);
                    console.log('[Solari] Applied saved soundboard metadata from file.');
                }
            }
        } catch (e) {
            console.error('[Solari] Error loading saved soundboard data:', e);
        }

        soundServer = new SoundServer(soundBoard);
        soundServer.start().then(port => {
            console.log(`[Solari] SoundServer started on port ${port}`);
            // Register global shortcuts after everything is ready
            soundBoard.initializeShortcuts((soundId) => handleShortcutPlay(soundId));
        }).catch(err => {
            console.error('[Solari] Failed to start SoundServer:', err);
        });
    } catch (e) {
        console.error('[Solari] CRITICAL: Failed to initialize SoundBoard:', e);
    }

    // Check if running as admin and show warning if not
    checkAdminStatus();

    // Start system-wide AFK detection
    startSystemAFKCheck();

    // Start auto-detection if enabled (with delay to ensure RPC is ready)
    if (autoDetectEnabled) {
        console.log('[Solari] Auto-detection enabled, waiting for RPC to be ready...');
        setTimeout(() => {
            console.log('[Solari] Starting auto-detection on startup');
            startAutoDetection();

            // Auto-Update Checks (App & Plugins) — conditioned on user settings
            setTimeout(() => {
                if (appSettings.autoCheckAppUpdates) checkAppUpdateOnStartup(getLabels());
                if (appSettings.autoCheckPluginUpdates) updatePluginsOnStartup();
            }, 5000);

        }, 3000); // Wait 3 seconds for RPC to connect
    }

    // Start user tracking (analytics)
    startTracking();

    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        stopTracking(); // Send disconnect notification
        if (rpcClient) rpcClient.destroy();
        if (wss) wss.close();
        app.quit();
    }
});

// Also stop tracking on before-quit (catches more exit scenarios)
app.on('will-quit', () => {
    stopTracking();
});

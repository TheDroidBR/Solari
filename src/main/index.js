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

const _startupBegin = Date.now();
const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, shell, powerMonitor, globalShortcut, dialog, net, session } = require('electron');
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
let DiscordRPC = null;
let WebSocket = { OPEN: 1 };
const fs = require('fs');
const { exec, spawn } = require('child_process');
const UpdateManager = require('./updater_manager');
const TelemetryManager = require('./telemetryManager'); // v1.11.1
const CONSTANTS = require('./constants');
const crypto = require('crypto');
let SoundBoard = null;
let SoundServer = null;
let soundServer = null;
let telemetry = null; // v1.11.1
const soundboardToken = crypto.randomBytes(32).toString('hex'); // v1.11.1: Security token
let activeTasklistProcess = null; // v1.11.1: Track child processes
let activeNvidiaSmiProcess = null; // v1.11.1: Track child processes

// ── Managers (modularization) ────────────────────────────────────────────
const WindowManager = require('./managers/windowManager');
const DataManager = require('./managers/dataManager');
const HWMonitor = require('./managers/hwMonitor');

// v1.10: --debug CLI flag support
if (process.argv.includes('--debug')) {
    CONSTANTS.DEBUG_MODE = true;
    CONSTANTS.DEBUG_RPC = true;
    CONSTANTS.DEBUG_WS = true;
    CONSTANTS.DEBUG_AUTODETECT = true;
    CONSTANTS.DEBUG_HW = true;
    console.log('[Solari] DEBUG MODE enabled via --debug flag');
}

// v1.10: Version watermark
console.log(`[Solari] v${CONSTANTS.APP_VERSION} | Electron ${process.versions.electron} | Node ${process.versions.node} | ${process.platform}`);


let mainWindow;
let autoDetectWindow = null;
let tray = null;
let rpcClient;
let rpcConnected = false; // Track if RPC is actually connected
let extensionWsId = null;
let extensionVersion = '0.0.0';

function getRpcStatusPayload(additionalFields = {}) {
    const base = { connected: rpcConnected, ...additionalFields };
    if (!rpcConnected || !rpcClient || !rpcClient.user) {
        return base;
    }
    const discordUser = rpcClient.user;
    let avatarUrl = 'SolariPhotoTransparente.png';
    if (discordUser.avatar) {
        const isAnimated = discordUser.avatar.startsWith('a_');
        const ext = isAnimated ? 'gif' : 'png';
        avatarUrl = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${ext}?size=256`;
    }
    return {
        ...base,
        user: {
            id: discordUser.id,
            username: discordUser.username,
            globalName: discordUser.globalName || discordUser.global_name || discordUser.username,
            avatar: avatarUrl
        }
    };
}

let wss;
let isEnabled = true;
let isQuitting = false;
let telemetryWindow = null; // v1.11.1: Shared window for telemetry fallback
let extensionPingInterval = null;

// Debug log collection
const debugLogs = [];

function addLog(message) {
    const timestamp = new Date().toISOString();
    debugLogs.push(`[${timestamp}] ${message}`);
    if (debugLogs.length > CONSTANTS.MAX_LOGS) {
        debugLogs.splice(0, debugLogs.length - CONSTANTS.MAX_LOGS);
    }
    console.log(message);
}

/** 
 * Centralized error logger
 * @param {string} context - Where the error happened
 * @param {Error|string} error - The error object or message
 */
function logError(context, error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    addLog(`[ERROR][${context}] ${errMsg}`);
    if (stack && CONSTANTS.DEBUG_MODE) {
        console.error(`[${context}] Stack:`, stack);
    }
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
let lastSeenVersion = '0.0.0'; // Track last seen version for changelog
let useExtensionForWeb = true; // true = use extension, false = use autoDetect websites
let websiteCheckFailCount = 0; // Debounce counter for website detection failures (v1.10: reset on toggle)

// Spotify API State
let spotifyClientId = '';
let spotifyTokens = { accessToken: null, refreshToken: null, tokenExpiry: 0 };
let autoDetectInterval = null;
let currentDetectedProcess = null;
let currentDetectedWebsite = null;
let currentDetectedPresetName = null; // Track preset name for AFK disable check
// v1.10: removed orphan variable `currentAutoDetectPreset` (was never properly used)
let fallbackPresetIndex = -1;

// Process check mutex and backoff to prevent quota violation
let isProcessCheckRunning = false;
let isBrowserCheckRunning = false;
let processCheckErrorCount = 0;
let processCheckBackoffUntil = 0;
// Note: MAX_PROCESS_CHECK_ERRORS and BACKOFF_DURATION_MS are defined in constants.js

const DEFAULT_EXTENSION_CLIENT_IDS = {
    youtube: '1461859944390332496',
    youtubemusic: '1520432295255871498',
    twitch: '1461860225765347472',
    netflix: '1461881250498482409',
    primevideo: '1511842632240730112'
};

const DEFAULT_EXTENSION_IMAGES = {
    youtube: 'https://i.imgur.com/CwT4UbN.jpg',
    youtubemusic: 'https://i.imgur.com/8nxoBHs.gif',
    twitch: 'https://i.imgur.com/zUzEsWO.gif',
    netflix: 'https://i.imgur.com/hrk1OyC.gif',
    primevideo: 'https://i.imgur.com/huFfYqk.gif'
};

let appSettings = {
    startWithWindows: false,
    startMinimized: false,
    closeToTray: false,
    language: 'en', // 'en' or 'pt-BR'
    dontRemindAdmin: false, // Don't show admin warning
    theme: 'default', // 'default', 'dark', 'light'
    autoCheckAppUpdates: true,
    autoCheckPluginUpdates: true,
    showEcoMode: true,
    bdAutoRepair: true, // Background Auto-Repair for BetterDiscord
    advancedTelemetry: true, // v1.11.1: Detailed telemetry toggle
    useDefaultExtensionClientIds: true,
    extensionMappings: {
        youtube: { presetId: '', clientId: '1461859944390332496' },
        youtubemusic: { presetId: '', clientId: '1520432295255871498' },
        netflix: { presetId: '', clientId: '1461881250498482409' },
        twitch: { presetId: '', clientId: '1461860225765347472' },
        primevideo: { presetId: '', clientId: '1511842632240730112' }
    },
    extensionEverUsed: false
};

let extensionStats = {
    youtube: 0,
    youtubemusic: 0,
    netflix: 0,
    twitch: 0,
    primevideo: 0
};
let extensionStatsInterval = null;
let extensionStatsSaveCounter = 0;


let connectedPlugins = new Map();
let pluginIdCounter = 1;
let blockedPlugins = new Set();

// SolariManager — BD runtime confirmation
let solariManagerWsId = null;    // wsId of the active SolariManager client
let lastBDHeartbeat = 0;         // timestamp of last heartbeat from SolariManager
let cachedBDPlugins = [];        // last known plugin list from SolariManager
const BD_HEARTBEAT_TIMEOUT_MS = 90000; // 90s without heartbeat → fallback to 'ok'

// SoundBoard
let soundBoard = null;
// soundServer is already declared above

let consoleVisible = true; // Required for dev menu tray toggle

// ===== HARDWARE SYSTEM MONITOR =====
let hwMonitorEnabled = false;
let hwMonitorSettings = {
    showCPU: true,
    showRAM: true,
    showGPU: true,
    intervalMs: 3000,
    mode: 'overlay' // 'overlay' or 'dedicated'
};
let hwMonitorInterval = null;
let latestHwStats = null;
let hwGpuAvailable = null; // null = not checked yet, true/false after first check

// System-wide AFK detection
let systemAFKCheckInterval = null;
let systemAFKSettings = {
    enabled: true,
    timeoutMinutes: 5,
    afkDisabledPresets: [], // Presets that disable AFK when active
    afkTiers: [] // v1.11.1: Persisted tiers
};
let lastSystemIdleState = false; // Track state to only send on change
let cachedPluginAfkConfig = null; // Store last config from plugin to sync with Renderer on load

// Solari Notes Settings
let solariNotesSettings = {
    panelOpacity: 100,
    fontSize: 14,
    fontFamily: 'sans',
    language: 'pt-BR'
};

// Rich Presence Priority System
// Lower number = higher priority
let prioritySettings = {
    autoDetect: 1,      // Auto-detected game/app (highest priority)
    manualPreset: 2,    // Manually selected preset
    defaultFallback: 3  // Default/fallback (lowest priority)
};

let pluginWatcher = null; // Watcher for BetterDiscord plugins folder

// ===== MAIN PROCESS I18N SYSTEM =====
let currentLocaleData = {};
let fallbackLocaleData = {};
function loadLocale(lang = 'en') {
    try {
        const enPath = path.join(__dirname, '..', 'locales', 'en.json');
        if (fs.existsSync(enPath)) {
            fallbackLocaleData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
        }
        const localePath = path.join(__dirname, '..', 'locales', `${lang}.json`);
        if (fs.existsSync(localePath)) {
            currentLocaleData = JSON.parse(fs.readFileSync(localePath, 'utf8'));
            if (CONSTANTS.DEBUG_MODE) console.log(`[i18n] Loaded Main locale: ${lang}`);
        } else {
            currentLocaleData = fallbackLocaleData;
        }
    } catch (e) {
        console.error('[i18n] Failed to load locale:', e);
    }
}


/**
 * Basic translation helper for Main Process
 * @param {string} key Dot-notation key (ex: "tray.openSolari")
 * @param {string} defaultValue Optional default if key not found
 */
function t_main(key, defaultValue = '') {
    const keys = key.split('.');

    const getValue = (obj) => {
        let value = obj;
        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                return undefined;
            }
        }
        return typeof value === 'string' ? value : undefined;
    };

    const currentVal = getValue(currentLocaleData);
    if (currentVal !== undefined) return currentVal;

    const fallbackVal = getValue(fallbackLocaleData);
    if (fallbackVal !== undefined) return fallbackVal;

    return defaultValue !== undefined ? defaultValue : key;
}


// ===== BD AUTO-REPAIR SYSTEM (v1.8.2 ANTI-LOOP, v1.10: constants centralized) =====
let bdStatusPollInterval = null;
let bdBrokenCount = 0;
let isRepairing = false;
let isUninstalling = false;
let lastKnownBDStatus = 'unknown';
let bdRepairCooldownUntil = 0;
let bdRepairHistory = [];
// BD remote version cache (avoid GitHub API rate-limit)
let cachedBDRemoteVersion = null;
let bdRemoteVersionFetchedAt = 0;
const BD_VERSION_CACHE_MS = 30 * 60 * 1000; // 30 minutes
// v1.11.1: Startup grace period — skip incompatible detection for first N ms
const BD_STARTUP_GRACE_MS = 8000; // 8 seconds for SolariManager WS to connect
const BD_STARTUP_TIME = Date.now();
let bdIncompatibleCounter = 0; // Moved from inline to declared for clarity

let currentPrioritySource = null; // Track what's currently controlling RPC
let lastNotifiedPresetName = null; // Track last preset name that triggered a notification

const DATA_PATH = path.join(app.getPath('userData'), 'customrp-data.json');
// Icon path: works in both dev and packaged app
const ICON_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, '..', '..', 'SolariPhotoTransparente.png');
const DEFAULT_CLIENT_ID = ''; // User must configure their own Client ID
let clientId = DEFAULT_CLIENT_ID; // Can be changed by user (global default)
let globalAppName = 'Discord App'; // Real application name (persisted)
let identities = []; // Array of { id: string, name: string } - Multiple App Profiles
let currentClientId = null; // Currently active Client ID for RPC connection
let pendingActivity = null; // Activity to set after Client ID switch completes
let isSwitching = false; // Flag to prevent multiple concurrent switches
let switchingTargetClientId = null; // Target Client ID currently being switched to

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

// Start tracking heartbeat (v1.11.1: Refactored to Class)
function startTracking() {
    if (!telemetry) {
        telemetry = new TelemetryManager(TRACKER_URL, CONSTANTS.DEBUG_MODE);
        telemetry.setUserId(getTrackingUserId());
    }

    telemetry.setExtensionCheckers(
        () => appSettings.extensionEverUsed || false,
        () => extensionWsId !== null,
        () => extensionVersion
    );

    // v1.11.1: Set level based on user preference
    telemetry.setAdvancedEnabled(appSettings.advancedTelemetry);

    // v1.11.1: Ensure we have an initial BD status before first ping
    checkBDStatus().then(result => {
        if (telemetry) telemetry.setBDStatus(result.status);
    }).catch(() => { });

    telemetry.start();
}

function stopTracking() {
    if (telemetry) {
        telemetry.stop();
    }
}

function loadData() {
    DataManager.loadData();
}

// v1.10: Trailing debounce to prevent disk thrashing on rapid settings changes
function saveData() {
    DataManager.saveData();
}

// Force immediate save (for shutdown scenarios)
function saveDataSync() {
    DataManager.saveDataSync();
}


// IPC handler for child windows to get current language
// Resource fetcher for plugins (standard network sync)
ipcMain.handle('net:fetch-resource', async (event, url) => {
    return handleFetchResource(url);
});

// Compatibility alias for original plugins
ipcMain.handle('plugins:fetch-bypass', async (event, url) => {
    return handleFetchResource(url);
});

async function handleFetchResource(url) {
    console.log('[Solari Net] Fetching native:', url);
    return new Promise((resolve, reject) => {
        const request = net.request({
            url: url,
            method: 'GET',
            redirect: 'follow', // Automatically follow redirects
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*'
            }
        });

        request.on('response', (response) => {
            if (response.statusCode === 200) {
                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    const body = Buffer.concat(chunks).toString('utf-8');
                    resolve(body);
                });
            } else {
                reject(new Error(`Fetch failed: HTTP Status ${response.statusCode}`));
            }
        });

        request.on('error', (error) => {
            console.error('[Solari Net] Error:', error.message);
            reject(error);
        });

        request.end();
    });
}
;

ipcMain.handle('get-current-language', () => {
    return appSettings.language || 'en';
});

ipcMain.on('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.minimize();
});

ipcMain.on('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    }
});

ipcMain.on('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.close();
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

ipcMain.handle('get-presets', () => {
    return presets;
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

    // Unlink any preset associated with the deleted identity
    let presetsChanged = false;
    presets.forEach(p => {
        if (p.clientId === identityId) {
            p.clientId = '';
            presetsChanged = true;
        }
    });

    saveData();

    // Notify renderer if presets changed
    if (presetsChanged && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('presets-updated', presets);
    }

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
    startBDBackgroundPolling();
    startHWMonitor();
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


// Frontend IPC triggers for the Settings Tab
ipcMain.on('save-app-settings', (event, newSettings) => {
    // Merge newSettings into the global appSettings object
    Object.assign(appSettings, newSettings);

    // v1.11.1: Update telemetry level immediately
    if (telemetry) {
        telemetry.setAdvancedEnabled(appSettings.advancedTelemetry);
    }

    // Check if factory client IDs were disabled
    if (newSettings.useDefaultExtensionClientIds === false) {
        const factoryClientIds = [
            '1461859944390332496', // YouTube
            '1520432295255871498', // YouTube Music
            '1461860225765347472', // Twitch
            '1461881250498482409', // Netflix
            '1511842632240730112'  // Prime Video
        ];
        let presetsChanged = false;
        presets.forEach(p => {
            if (factoryClientIds.includes(p.clientId)) {
                p.clientId = '';
                presetsChanged = true;
            }
        });
        if (presetsChanged && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('presets-updated', presets);
        }
    }

    // Re-apply extension mapping immediately if it changed and extension is active
    if (newSettings.extensionMappings &&
        presenceSources.browserExtension.active &&
        presenceSources.browserExtension._rawData &&
        presenceSources.browserExtension.platform) {
        console.log('[Solari] Extension mapping changed — re-applying current media data immediately...');
        handleBrowserMediaUpdate({
            platform: presenceSources.browserExtension.platform,
            data: presenceSources.browserExtension._rawData
        }, null);
    }

    applyAppSettings(); // Re-register OS-level settings like auto-launch
    saveData();
    console.log('[Solari] Settings unified from frontend:', appSettings);
});

// Single setting update (useful for Wizard toggles)
ipcMain.on('set-setting', (event, key, value) => {
    appSettings[key] = value;

    if (key === 'clientId') {
        const val = String(value || '').trim();
        clientId = val;
        switchRpcClient(val).catch(err => {
            console.error('[Solari] Error switching RPC Client ID on set-setting:', err.message);
        });
    }

    // v1.11.1: Update telemetry level immediately if this key changed
    if (key === 'advancedTelemetry' && telemetry) {
        telemetry.setAdvancedEnabled(value);
    }

    // Check if factory client IDs were disabled
    if (key === 'useDefaultExtensionClientIds' && value === false) {
        const factoryClientIds = [
            '1461859944390332496', // YouTube
            '1520432295255871498', // YouTube Music
            '1461860225765347472', // Twitch
            '1461881250498482409', // Netflix
            '1511842632240730112'  // Prime Video
        ];
        let presetsChanged = false;
        presets.forEach(p => {
            if (factoryClientIds.includes(p.clientId)) {
                p.clientId = '';
                presetsChanged = true;
            }
        });
        if (presetsChanged && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('presets-updated', presets);
        }
    }

    applyAppSettings();
    saveData();
    console.log(`[Solari] Setting updated: ${key} = ${value}`);
});

let activeDialogPromise = null;

function showRendererDialog(options) {
    return new Promise((resolve) => {
        if (!mainWindow || mainWindow.isDestroyed()) {
            resolve({ response: -1, checkboxChecked: false });
            return;
        }
        if (activeDialogPromise) {
            activeDialogPromise.resolve({ response: -1, checkboxChecked: false });
        }
        activeDialogPromise = { resolve };
        mainWindow.webContents.send('show-custom-dialog', options);
    });
}

ipcMain.on('dialog-response', (event, result) => {
    if (activeDialogPromise) {
        activeDialogPromise.resolve(result);
        activeDialogPromise = null;
    }
});

// ===== UNINSTALL HANDLER =====
ipcMain.on('uninstall-app', async () => {
    // Step 1: Confirm with user
    const { response } = await showRendererDialog({
        type: 'warning',
        title: 'Desinstalar Solari',
        message: 'Tem certeza que quer desinstalar o Solari?',
        detail: 'O aplicativo será removido do sistema. Seus dados de configuração serão mantidos.',
        buttons: ['Cancelar', 'Desinstalar'],
        defaultId: 0,
        cancelId: 0
    });

    if (response !== 1) return; // User cancelled

    // Step 2: Find the NSIS uninstaller
    // Safer way: Look exactly where the current Solari.exe is running from
    const uninstallerPath = path.join(path.dirname(process.execPath), 'Uninstall Solari.exe');

    if (!fs.existsSync(uninstallerPath)) {
        // Fallback for some NSIS configurations that might put it in LocalAppData
        const fallbackPath = path.join(
            app.getPath('appData').replace('Roaming', 'Local'),
            'solari',
            'Uninstall Solari.exe'
        );

        if (fs.existsSync(fallbackPath)) {
            runUninstaller(fallbackPath);
            return;
        }

        // Portable/dev mode — no uninstaller available
        await showRendererDialog({
            type: 'info',
            title: 'Solari',
            message: 'Desinstalador não encontrado.',
            detail: `O desinstalador deveria estar em: ${uninstallerPath}\n\nSe você está em modo de desenvolvimento ou usando a versão portátil, não há desinstalador.`
        });
        return;
    }

    runUninstaller(uninstallerPath);

    function runUninstaller(p) {
        console.log('[Solari] Launching uninstaller:', p);
        const child = spawn(p, [], {
            detached: true,
            stdio: 'ignore'
        });
        child.unref();
        setTimeout(() => app.exit(0), 500);
    }
});

ipcMain.on('trigger-update-check', async (event, labels) => {
    // the label texts will now be built directly from the frontend strings
    await checkForUpdates(labels || {
        title: 'Atualizações',
        updateAvailable: 'Update Available!',
        updateMessage: 'A new version of Solari is available.',
        downloadNow: 'Download Now',
        later: 'Later',
        noUpdates: 'You are using the latest version!',
        checkingUpdates: 'Checking for updates...'
    });
});

// ===== IN-APP UPDATE BUTTON (v1.10.0) =====

// Obsolete fetch function removed. Manual flow now uses UpdateManager.

// Silent update check — returns {hasUpdate, latestVersion} without showing dialogs
ipcMain.handle('check-update-silent', async () => {
    return await UpdateManager.checkUpdateSilent();
});

// Trigger update via splash: use the SAME flow as the auto-update that already works
// Instead of relaunching, hide the main window and run checkUpdateViaSplash() directly
ipcMain.on('trigger-update-via-splash', async () => {
    console.log('[Solari] User requested update via in-app button. Running update flow in current instance...');

    // 1. Hide the main window (same as if we were on splash screen)
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide();
    }

    // 2. Create fresh splash window
    createSplashWindow();

    // 3. Connect updater_manager to this splash window
    UpdateManager.setSplashSenders(sendSplashStatus, sendSplashProgress);

    // 4. Run the update check via electron-updater
    const willRestart = await UpdateManager.checkUpdateViaSplash();

    if (willRestart) {
        // electron-updater will handle install and restart natively
        console.log('[Solari] Update downloaded, electron-updater will handle restart.');
        setTimeout(() => UpdateManager.installUpdateAndRestart(), 1000);
        return;
    }

    // 5. If no update found or error occurred, close splash and show main
    console.log('[Solari] No update found or error during download. Restoring main window.');

    // Notify renderer to stop the infinite loading spinner on the badge
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-check-finished', false);
    }

    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
    }
});


// Check for updates via UpdateManager (unified flow)
async function checkForUpdates(labels) {

    // 1. Show "Checking..." state to user if app is already open
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('show-toast', {
            title: labels.title || 'Atualizações',
            message: labels.checkingUpdates || 'Checking for updates...',
            type: 'info'
        });
    }

    try {
        const result = await UpdateManager.checkUpdateSilent();

        if (result.hasUpdate) {
            showRendererDialog({
                type: 'info',
                title: labels.updateAvailable,
                message: labels.updateMessage,
                detail: `${labels.updateAvailable}\n\nVersão atual: v${result.currentVersion}\nNova versão: v${result.latestVersion}`,
                buttons: [labels.downloadNow, labels.later],
                defaultId: 0,
                cancelId: 1
            }).then((boxResult) => {
                if (boxResult && boxResult.response === 0) {
                    // Trigger the splash download UI
                    ipcMain.emit('trigger-update-via-splash');
                }
            });
        } else {
            showRendererDialog({
                type: 'info',
                title: labels.title || 'Solari',
                message: labels.noUpdates,
                detail: `Versão atual: v${result.currentVersion}`
            });
        }
    } catch (err) {
        console.error('[Solari] Manual update check error:', err);
        showRendererDialog({
            type: 'info',
            title: labels.title || 'Solari',
            message: labels.noUpdates,
            detail: `Versão atual: v${CONSTANTS.APP_VERSION}`
        });
    }
}

// ===== SPLASH SCREEN & AUTO UPDATE SYSTEM =====

let splashWindow = null;

function createSplashWindow() {
    splashWindow = WindowManager.createSplashWindow();
    return splashWindow;
}

function sendSplashStatus(state, message) {
    WindowManager.sendSplashStatus(state, message);
    // Keep local ref in sync
    splashWindow = WindowManager.getSplashWindow();
}

function sendSplashProgress(percent, downloaded, total) {
    WindowManager.sendSplashProgress(percent, downloaded, total);
}

/**
 * Check for app updates during splash. Returns true if an update is being installed (app will restart).
 * Delegates to UpdateManager (electron-updater) with fallback support.
 */
async function checkUpdateViaSplash() {
    if (process.env.NODE_ENV === 'development') {
        return false;
    }

    // Connect updater_manager to the current splash window
    UpdateManager.setSplashSenders(sendSplashStatus, sendSplashProgress);

    const willRestart = await UpdateManager.checkUpdateViaSplash();

    if (willRestart) {
        // Give splash screen a moment to show "Installing..." before restart
        await new Promise(r => setTimeout(r, 1500));
        UpdateManager.installUpdateAndRestart();
    }

    return willRestart;
}

/**
 * Extract @version from BetterDiscord plugin metadata header.
 * Returns version string (e.g. '2.0.2') or null if not found.
 */
function extractPluginVersion(content) {
    const match = content.match(/@version\s+(\S+)/);
    return match ? match[1] : null;
}

/**
 * Update plugins during splash screen.
 * Compares @version metadata instead of raw content to avoid
 * false positives from line-ending differences (CRLF vs LF).
 */
function updatePluginsViaSplash() {
    return new Promise((resolve) => {
        const updatedPlugins = [];
        sendSplashStatus('updating-plugins', 'Checking plugin updates...');

        const pluginsPath = getBDPluginsPath();
        if (!pluginsPath || !fs.existsSync(pluginsPath)) {
            resolve(updatedPlugins);
            return;
        }

        const plugins = [
            { name: 'SpotifySync.plugin.js', url: 'https://gitlab.com/TheDroidBR/solari/-/raw/main/plugins/SpotifySync.plugin.js' },
            { name: 'SmartAFKDetector.plugin.js', url: 'https://gitlab.com/TheDroidBR/solari/-/raw/main/plugins/SmartAFKDetector.plugin.js' }
        ];

        let remaining = 0;
        let updatedCount = 0;

        // Count installed plugins
        for (const plugin of plugins) {
            if (fs.existsSync(path.join(pluginsPath, plugin.name))) {
                remaining++;
            }
        }

        if (remaining === 0) {
            resolve(updatedPlugins);
            return;
        }

        for (const plugin of plugins) {
            const filePath = path.join(pluginsPath, plugin.name);
            if (!fs.existsSync(filePath)) continue;

            downloadPluginToString(plugin.url).then(remoteContent => {
                if (remoteContent) {
                    try {
                        const localContent = fs.readFileSync(filePath, 'utf8');
                        const localVersion = extractPluginVersion(localContent);
                        const remoteVersion = extractPluginVersion(remoteContent);

                        console.log(`[Solari Updater] ${plugin.name}: local=${localVersion}, remote=${remoteVersion}`);

                        if (remoteVersion && localVersion !== remoteVersion) {
                            fs.writeFileSync(filePath, remoteContent, 'utf8');
                            updatedCount++;
                            updatedPlugins.push({ name: plugin.name, from: localVersion, to: remoteVersion });
                            console.log(`[Solari Updater] Plugin updated: ${plugin.name} (${localVersion} -> ${remoteVersion})`);
                        }
                    } catch (e) {
                        console.error(`[Solari Updater] Plugin update error (${plugin.name}):`, e);
                    }
                }

                remaining--;
                if (remaining <= 0) {
                    if (updatedCount > 0) {
                        sendSplashStatus('updating-plugins', `${updatedCount} plugin(s) updated!`);
                    }
                    resolve(updatedPlugins);
                }
            }).catch(() => {
                remaining--;
                if (remaining <= 0) resolve(updatedPlugins);
            });
        }
    });
}

/**
 * Show changelog if this is the first launch of a new version.
 * Uses the in-memory `lastSeenVersion` variable (loaded by loadData, saved by saveData).
 */
function showChangelog(force = false) {
    try {
        const pkg = { version: CONSTANTS.APP_VERSION };
        const currentVersion = pkg.version;

        if (!force && currentVersion === lastSeenVersion) {
            console.log('[Solari] Same version as last launch, skipping changelog.');
            return;
        }

        if (!force) {
            console.log(`[Solari] New version detected! ${lastSeenVersion} -> ${currentVersion}`);
            // Update in-memory variable and persist via saveData()
            lastSeenVersion = currentVersion;
            saveData();
        }

        // Fetch changelog from GitHub first
        const request = net.request({
            url: `https://api.github.com/repos/TheDroidBR/Solari/releases/tags/v${currentVersion}`,
            method: 'GET',
            headers: {
                'User-Agent': 'Solari-AutoUpdater',
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        request.on('response', (res) => {
            let data = Buffer.alloc(0);
            res.on('data', chunk => data = Buffer.concat([data, chunk]));
            res.on('end', async () => {
                if (res.statusCode === 200) {
                    try {
                        const release = JSON.parse(data.toString());
                        if (release.body && mainWindow && !mainWindow.isDestroyed()) {
                            console.log('[Solari] Sending GitHub changelog to renderer...');
                            mainWindow.webContents.send('show-changelog', {
                                version: currentVersion,
                                body: release.body,
                                name: release.name || `v${currentVersion}`
                            });
                        }
                    } catch (e) { console.error('[Solari] GitHub changelog parse error:', e); }
                } else {
                    console.warn(`[Solari] GitHub changelog failed (${res.statusCode}). Trying GitLab Fallback...`);
                    // FALLBACK: Fetch CHANGELOG.md from GitLab
                    try {
                        const gitlabUrl = 'https://gitlab.com/TheDroidBR/solari/-/raw/main/CHANGELOG.md';
                        const glRequest = net.request(gitlabUrl);
                        glRequest.on('response', (glRes) => {
                            let glData = '';
                            glRes.on('data', c => glData += c.toString('utf8'));
                            glRes.on('end', () => {
                                if (glRes.statusCode === 200 && mainWindow && !mainWindow.isDestroyed()) {
                                    // Simple extract: find ## [version] section
                                    const lines = glData.split('\n');
                                    let found = false;
                                    let body = '';
                                    for (const line of lines) {
                                        if (line.includes(`## [${currentVersion}]`)) { found = true; continue; }
                                        if (found && line.startsWith('## ')) break;
                                        if (found) body += line + '\n';
                                    }
                                    if (found && body.trim()) {
                                        console.log('[Solari] Sending GitLab changelog (extracted) to renderer...');
                                        mainWindow.webContents.send('show-changelog', {
                                            version: currentVersion,
                                            body: body.trim(),
                                            name: `v${currentVersion}`
                                        });
                                    }
                                }
                            });
                        });
                        glRequest.end();
                    } catch (e) { console.error('[Solari] GitLab fallback error:', e); }
                }
            });
        });
        request.on('error', (e) => {
            console.error('[Solari] Changelog network error:', e);
        });
        request.end();
    } catch (e) {
        console.error('[Solari] showChangelog error:', e);
    }
}

ipcMain.on('request-changelog', () => {
    shell.openExternal('https://solarirpc.com/changelog.html');
});

ipcMain.on('open-external-url', (event, url) => {
    try {
        const protocol = new URL(url).protocol;
        if (['https:', 'http:'].includes(protocol)) {
            if (process.platform === 'win32') {
                try {
                    const child = spawn('explorer.exe', [url], { detached: true, stdio: 'ignore' });
                    child.unref();
                    child.on('error', (err) => {
                        console.error('[Solari] explorer open failed, falling back to shell:', err);
                        shell.openExternal(url).catch(() => { });
                    });
                } catch (e) {
                    console.error('[Solari] explorer spawn threw, falling back to shell:', e);
                    shell.openExternal(url).catch(() => { });
                }
            } else {
                shell.openExternal(url).catch(() => { });
            }
        }
    } catch (e) {
        console.error('[Solari] Failed to open external URL:', e);
    }
});



async function updatePluginsOnStartup() {
    console.log('[Solari] Checking for plugin updates...');
    const pluginsPath = getBDPluginsPath();
    if (!fs.existsSync(pluginsPath)) return;

    const plugins = [
        { name: 'SpotifySync.plugin.js', url: 'https://gitlab.com/TheDroidBR/solari/-/raw/main/plugins/SpotifySync.plugin.js' },
        { name: 'SmartAFKDetector.plugin.js', url: 'https://gitlab.com/TheDroidBR/solari/-/raw/main/plugins/SmartAFKDetector.plugin.js' }
    ];

    let updatedCount = 0;

    for (const plugin of plugins) {
        const filePath = path.join(pluginsPath, plugin.name);
        if (fs.existsSync(filePath)) {
            downloadPluginToString(plugin.url).then(remoteContent => {
                if (!remoteContent) return;

                try {
                    const localContent = fs.readFileSync(filePath, 'utf8');
                    if (localContent.trim() !== remoteContent.trim()) {
                        fs.writeFileSync(filePath, remoteContent);
                        console.log(`[Solari] Updated plugin: ${plugin.name}`);
                        updatedCount++;
                        sendToast('Plugin Updated', `${plugin.name} was auto-updated`, 'success');
                    }
                } catch (e) {
                    console.error(`[Solari] Error updating ${plugin.name}:`, e);
                }
            });
        }
    }
}

// Plugin download with 2MB size limit to prevent memory abuse
const MAX_PLUGIN_SIZE = 2 * 1024 * 1024; // 2MB

function downloadPluginToString(url) {
    return new Promise(resolve => {
        const request = net.request({
            url: url,
            method: 'GET',
            redirect: 'follow',
            headers: {
                'User-Agent': `Mozilla/5.0 (${CONSTANTS.APP_USER_AGENT}; Windows 10)`,
                'Accept': '*/*'
            }
        });

        request.on('response', (res) => {
            if (res.statusCode !== 200) { resolve(null); return; }
            let data = '';
            let size = 0;
            res.on('data', c => {
                size += c.length;
                if (size > MAX_PLUGIN_SIZE) {
                    console.error('[Solari] Plugin download exceeds 2MB limit, aborting.');
                    request.abort();
                    resolve(null);
                    return;
                }
                data += c.toString('utf8');
            });
            res.on('end', () => resolve(data));
        });

        request.on('error', () => resolve(null));
        request.end();
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
    // v1.10 fix: Load locale BEFORE saveData to prevent stale locale in tray menu
    loadLocale(lang);
    appSettings.language = lang;
    saveData();
    updateTrayMenu(); // Update tray menu with new language

    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('language-changed', lang);
    }
    if (autoDetectWindow && !autoDetectWindow.isDestroyed()) {
        autoDetectWindow.webContents.send('language-changed', lang);
    }
    // Broadcast language change to all connected plugins
    if (wss) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(JSON.stringify({ type: 'set_language', language: lang }));
                } catch (e) { /* client disconnected */ }
            }
        });
    }
}

// IPC Listener for Language Change
ipcMain.on('save-language', (event, lang) => {
    setLanguage(lang);
});

function getLabels() {
    const isEn = appSettings && appSettings.language === 'en';
    return {
        clientIdTitle: isEn ? 'Discord Client ID' : 'Client ID do Discord',
        clientIdNotConfigured: isEn ? 'Not configured' : 'Não configurado',
        clientIdUpdated: isEn ? 'Client ID Updated' : 'Client ID Atualizado',
        clientIdMessage: isEn ? 'Your Client ID has been updated to:' : 'Seu Client ID foi atualizado para:',
        restartRequired: isEn ? 'Please toggle Solari off and on to apply.' : 'Por favor, desligue e ligue o Solari para aplicar.',
        rpcErrorTitle: isEn ? 'Discord RPC Error' : 'Erro no Discord RPC',
        rpcErrorClient: isEn ? 'Verification failed. Please check your Client ID.' : 'Falha na verificação. Verifique seu Client ID.',
        discordNotRunning: isEn ? 'Discord is not running' : 'O Discord não está aberto'
    };
}

function openClientIdDialog() {
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

        if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Tray created successfully.');

        // Hide console on startup
        setTimeout(() => {
            toggleConsoleWindow(false);
        }, 500);
    } catch (error) {
        console.error('[ERROR] Failed to create Tray:', error);
    }
}

function updateTrayMenu() {
    const labels = {
        open: t_main('tray.openSolari', 'Open Solari'),
        showConsole: t_main('tray.showConsole', '🔳 Show Console'),
        hideConsole: t_main('tray.hideConsole', '🔲 Hide Console'),
        autoDetect: t_main('app.autoDetect', 'Auto-Detect'),
        presets: t_main('presets.title', 'Presets'),
        noPresets: t_main('presets.noPresets', '(No presets)'),
        exit: t_main('tray.exit', 'Exit')
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
                autoDetectEnabled = !autoDetectEnabled;
                if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Auto-detect toggled:', autoDetectEnabled);
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

function startExtensionStatsTracking() {
    if (extensionStatsInterval) {
        clearInterval(extensionStatsInterval);
    }

    extensionStatsInterval = setInterval(() => {
        if (presenceSources.browserExtension.active && presenceSources.browserExtension.platform) {
            const plat = presenceSources.browserExtension.platform.toLowerCase();
            if (extensionStats[plat] !== undefined) {
                extensionStats[plat] += 1000;

                extensionStatsSaveCounter++;
                if (extensionStatsSaveCounter >= 10) {
                    extensionStatsSaveCounter = 0;
                    saveData();
                }
            }
        }
    }, 1000);
}

// System-wide AFK detection using Electron's powerMonitor
function startSystemAFKCheck() {
    if (systemAFKCheckInterval) {
        clearInterval(systemAFKCheckInterval);
    }

    if (CONSTANTS.DEBUG_MODE) console.log(`[Solari] Starting system AFK check (timeout: ${systemAFKSettings.timeoutMinutes} min)`);

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
                    if (CONSTANTS.DEBUG_MODE) console.log(`[Solari] AFK disabled for preset: ${currentDetectedPresetName}`);
                }
                return; // Skip normal idle check
            }

            const idleSeconds = powerMonitor.getSystemIdleTime();
            const idleMinutes = idleSeconds / 60;
            const isIdle = idleMinutes >= systemAFKSettings.timeoutMinutes;

            // Log every 6th check (every 30 seconds) for debugging
            // Log every check (every 5 seconds) for deep debugging requested by user
            debugCounter++;
            if (debugCounter >= 6) {
                debugCounter = 0;
                if (CONSTANTS.DEBUG_MODE) console.log(`[Solari] Idle check: ${idleSeconds}s (${idleMinutes.toFixed(2)} min) | State: ${isIdle ? 'IDLE' : 'ACTIVE'} | LastState: ${lastSystemIdleState ? 'IDLE' : 'ACTIVE'}`);
            }

            // Send update if:
            // 1. State changed (idle <-> active), OR
            // 2. Currently idle (so plugin can upgrade tiers based on increasing idle time)
            const stateChanged = isIdle !== lastSystemIdleState;

            // Update state tracking
            if (stateChanged) {
                lastSystemIdleState = isIdle;
                if (CONSTANTS.DEBUG_MODE) console.log(`[Solari] *** STATE CHANGED *** System idle: ${isIdle ? 'IDLE' : 'ACTIVE'} (idle for ${idleMinutes.toFixed(2)} min)`);
            }

            // v1.10 optimization: Only send to renderer on state change (not every poll)
            if (stateChanged && mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('system-afk-update', {
                    isIdle,
                    idleSeconds,
                    idleMinutes: parseFloat(idleMinutes.toFixed(2))
                });
            }

            // v1.10 optimization: Only send to plugins on state change OR while idle (for tier progression)
            if ((stateChanged || isIdle) && wss) {
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        try {
                            client.send(JSON.stringify({
                                type: 'system_idle_update',
                                idleSeconds,
                                idleMinutes: parseFloat(idleMinutes.toFixed(2)),
                                isIdle,
                                timeoutMinutes: systemAFKSettings.timeoutMinutes
                            }));
                        } catch (e) { /* client disconnected mid-send */ }
                    }
                });
            }
        } catch (e) {
            console.error('[Solari] Error checking system idle time:', e);
        }
    }, CONSTANTS.AFK_CHECK_INTERVAL_MS);
}

function stopSystemAFKCheck() {
    if (systemAFKCheckInterval) {
        clearInterval(systemAFKCheckInterval);
        systemAFKCheckInterval = null;
        if (CONSTANTS.DEBUG_MODE) console.log('[Solari] System AFK check stopped');
    }
}

function createWindow() {
    // Log process args for debugging auto-launch detection
    if (CONSTANTS.DEBUG_MODE) console.log('[Solari] process.argv:', JSON.stringify(process.argv));

    mainWindow = WindowManager.createMainWindow({
        onClose: (event) => {
            if (!isQuitting) {
                if (appSettings.closeToTray) {
                    event.preventDefault();
                    mainWindow.hide();
                    return false;
                } else {
                    isQuitting = true;
                    app.quit();
                }
            }
            return true;
        }
    });

    global.isMainWindowVisible = true;

    mainWindow.on('minimize', () => {
        global.isMainWindowVisible = false;
        handleMainWindowVisibilityChange();
    });

    mainWindow.on('restore', () => {
        global.isMainWindowVisible = true;
        handleMainWindowVisibilityChange();
    });

    mainWindow.on('hide', () => {
        global.isMainWindowVisible = false;
        handleMainWindowVisibilityChange();
    });

    mainWindow.on('show', () => {
        global.isMainWindowVisible = true;
        handleMainWindowVisibilityChange();
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

    // Lazy Load module
    if (!DiscordRPC) DiscordRPC = require('discord-rpc');

    DiscordRPC.register(useClientId);

    let connectionAttempts = 0;
    let isReconnecting = false; // Prevent multiple simultaneous reconnection attempts
    let reconnectTimeout = null;
    // initializeDiscordRPC reconnects infinitely by design (never give up)
    // maxAttempts is only used for logging, not for stopping

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

            const connectionClient = new DiscordRPC.Client({ transport: 'ipc' });

            connectionClient.on('ready', async () => {
                // GUARD: If global Client ID has changed since this connection started, ABORT!
                if (currentClientId !== useClientId) {
                    console.log('[Solari] Abandoning client (ready): ID mismatch', useClientId, '!==', currentClientId);
                    try { connectionClient.destroy(); } catch (e) { }
                    return;
                }

                console.log('[Solari] Discord RPC Connected!');
                rpcClient = connectionClient; // Successfully connected, promote to global!
                rpcConnected = true;
                isReconnecting = false; // Fix: Reset reconnection lock so health checks and Client ID switching work
                connectionAttempts = 0;
                if (mainWindow) {
                    mainWindow.webContents.send('rpc-status', getRpcStatusPayload());
                }

                // Try to get app name from rpcClient or fetch from Discord API
                let appName = rpcClient.application?.name;
                if (!appName) {
                    try {
                        // Fetch app info from Discord API with timeout
                        // Fetch app info from Discord API with native Electron net
                        const res = await new Promise((resolve, reject) => {
                            const request = net.request({
                                url: `https://discord.com/api/v10/applications/${clientId}/rpc`,
                                method: 'GET',
                                headers: {
                                    'User-Agent': CONSTANTS.APP_USER_AGENT,
                                    'Accept': 'application/json'
                                }
                            });
                            request.on('response', (resp) => {
                                let data = '';
                                resp.on('data', (chunk) => data += chunk);
                                resp.on('end', () => {
                                    try {
                                        resolve(JSON.parse(data));
                                    } catch (e) { reject(e); }
                                });
                            });
                            request.on('error', reject);
                            request.end();

                            // Timeout handling
                            setTimeout(() => {
                                if (!request.destroyed) {
                                    request.abort();
                                    reject(new Error('Timeout'));
                                }
                            }, 5000);
                        });
                        appName = res.name || 'Discord App';
                        console.log('[Solari] Fetched app name from API:', appName);
                    } catch (err) {
                        console.log('[Solari] Could not fetch app name:', err.message, '- using fallback');
                        appName = 'Discord App';
                    }
                }

                if (rpcClient === connectionClient && mainWindow) {
                    globalAppName = appName;
                    saveData();
                    mainWindow.webContents.send('app-name-loaded', appName);
                }

                // ALWAYS restore activity on connection to prevent "away" status
                if (isEnabled) {
                    console.log(`[Solari] RPC Ready - Waiting ${CONSTANTS.RPC_READY_RESTORE_DELAY_MS}ms before restoring activity...`);

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
                        setTimeout(() => {
                            console.log('[Solari] Restoring activity now...');
                            updatePresence(); // Force update on reconnection
                        }, CONSTANTS.RPC_READY_RESTORE_DELAY_MS);
                    }
                }
            });

            // Catch client-level errors to prevent unhandled exception crashes
            connectionClient.on('error', (err) => {
                if (currentClientId !== useClientId) return;
                console.log('[Solari] Discord RPC client error:', err.message);
            });

            // Handle client disconnection (covers socket close, app closed, errors)
            connectionClient.on('disconnected', () => {
                // GUARD: If this client is no longer the active one, ignore
                if (currentClientId !== useClientId) return;

                // If we are intentionally switching, ignore this event
                if (isSwitching) return;

                console.log('[Solari] Discord RPC disconnected, retrying soon...');
                rpcConnected = false;
                currentActivity = {}; // Reset current activity so next update forces a refresh
                isReconnecting = false; // Allow new reconnection attempt
                connectionAttempts = 0; // Reset counter for fresh reconnection cycle
                
                if (mainWindow) {
                    mainWindow.webContents.send('rpc-status', { connected: false, reconnecting: true });
                }

                // Cleanup failed client instance to release resource handles
                try {
                    connectionClient.removeAllListeners();
                    connectionClient.destroy().catch(() => {});
                } catch (cleanupErr) {
                    // Ignore
                }
                if (rpcClient === connectionClient) {
                    rpcClient = null;
                }

                scheduleReconnect(CONSTANTS.RPC_RETRY_DELAY_MS);
            });

            connectionClient.login({ clientId: useClientId }).catch((err) => {
                // GUARD: If global Client ID has changed, this failure is irrelevant
                if (currentClientId !== useClientId) return;

                if (connectionAttempts <= 3 || connectionAttempts % 10 === 0) {
                    console.error('[Solari] Discord RPC connection failed (attempt ' + connectionAttempts + '):', err.message);
                }
                addLog('[RPC] Connection failed: ' + err.message);
                rpcConnected = false;
                currentActivity = {}; // Reset current activity
                isReconnecting = false; // Allow new reconnection attempt

                // Cleanup failed client transport to release socket/pipe handle
                try {
                    connectionClient.removeAllListeners();
                    if (connectionClient.transport) {
                        connectionClient.transport.removeAllListeners();
                    }
                    connectionClient.destroy().catch(() => {});
                } catch (cleanupErr) {
                    // Ignore cleanup errors
                }

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
    let checkCounter = 0;
    rpcHealthCheckInterval = setInterval(() => {
        // GUARD: If Client ID changed, this health check becomes stale — stop it
        if (currentClientId !== useClientId) {
            clearInterval(rpcHealthCheckInterval);
            rpcHealthCheckInterval = null;
            return;
        }

        // Eco Mode optimization: skip checks to reduce execution frequency
        if (global.ecoMode) {
            checkCounter++;
            // Check only once every 9 ticks (approx 45s instead of 5s)
            if (checkCounter % 9 !== 0) {
                return;
            }
        }

        if (rpcConnected && rpcClient && !isReconnecting && currentClientId === useClientId) {
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
        } else if (!rpcConnected && !isReconnecting && !reconnectTimeout && !isSwitching) {
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

    isSwitching = true;
    switchingTargetClientId = newClientId;
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

    // Reset current activity tracking so deduplication doesn't skip the first update on the new connection
    currentActivity = {};

    // 2. Update current ID immediately
    currentClientId = newClientId;

    // 3. Smart reconnection with max attempts guard (BUG-08)
    let retryDelay = 1000;
    let attempt = 1;
    const MAX_SWITCH_ATTEMPTS = CONSTANTS.RPC_SWITCH_MAX_ATTEMPTS;

    if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Starting smart switch to', newClientId);

    while (attempt <= MAX_SWITCH_ATTEMPTS) {
        // ABORT CHECK 1: If user wants to switch to yet ANOTHER client ID, abort this one
        if (switchingTargetClientId !== newClientId) {
            console.log('[Solari] Switch aborted: Target Client ID changed');
            isSwitching = false;
            switchingTargetClientId = null;
            return false;
        }

        if (attempt === 1 || attempt % 5 === 0) {
            const elapsed = Math.round((attempt * retryDelay) / 1000);
            console.log(`[Solari] Switch attempt ${attempt} (${elapsed}s elapsed)...`);
        }

        let newClient = null;
        try {
            if (!DiscordRPC) DiscordRPC = require('discord-rpc');

            // Create new client and try to connect
            DiscordRPC.register(newClientId);
            newClient = new DiscordRPC.Client({ transport: 'ipc' });

            // Catch client-level errors to prevent unhandled exception crashes
            newClient.on('error', (err) => {
                if (currentClientId !== newClientId) return;
                console.log('[Solari] Discord RPC switch client error:', err.message);
            });

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

            // Success! 
            // FINAL RACE GUARD: Ensure another switch hasn't started while we were awaiting login
            if (switchingTargetClientId !== newClientId) {
                console.log('[Solari] Smart switch aborted: newer Client ID is now active');
                try { newClient.destroy(); } catch (_) { }
                isSwitching = false;
                switchingTargetClientId = null;
                return false;
            }

            // Store the client and mark as connected
            rpcClient = newClient;
            rpcConnected = true;
            isSwitching = false;
            switchingTargetClientId = null;

            if (CONSTANTS.DEBUG_MODE) console.log(`[Solari] Switch successful on attempt ${attempt}! (validated)`);

            // Setup disconnection handler
            newClient.on('disconnected', () => {
                if (currentClientId !== newClientId) return;
                if (isSwitching) return;

                console.log('[Solari] Discord RPC disconnected after switch, retrying soon...');
                rpcConnected = false;
                currentActivity = {}; // Reset so next update forces refresh

                // Notify UI
                if (mainWindow) {
                    mainWindow.webContents.send('rpc-status', { connected: false, reconnecting: true });
                }

                // Clean up this client instance to avoid handle leaks
                try {
                    newClient.removeAllListeners();
                    newClient.destroy().catch(() => {});
                } catch (cleanupErr) {
                    // Ignore
                }
                if (rpcClient === newClient) {
                    rpcClient = null;
                }

                // Reconnect after delay
                setTimeout(() => {
                    console.log('[Solari] Reconnecting RPC after Discord restart...');
                    initializeDiscordRPC(currentClientId);
                }, CONSTANTS.RPC_RETRY_DELAY_MS);
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
                mainWindow.webContents.send('rpc-status', getRpcStatusPayload());
                mainWindow.webContents.send('show-toast', {
                    messageKey: 'rpc.switched',
                    title: '✅',
                    type: 'success'
                });
            }

            return true;

        } catch (err) {
            if (newClient) {
                try {
                    newClient.removeAllListeners();
                    if (newClient.transport) {
                        newClient.transport.removeAllListeners();
                    }
                    newClient.destroy().catch(() => {});
                } catch (cleanupErr) {
                    // Ignore
                }
            }

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

    // BUG-08: Max attempts reached — stop trying
    console.error(`[Solari] Switch to ${newClientId} failed after ${MAX_SWITCH_ATTEMPTS} attempts. Giving up.`);
    isSwitching = false;
    switchingTargetClientId = null;
    rpcConnected = false;
    if (mainWindow) {
        mainWindow.webContents.send('show-toast', {
            messageKey: 'rpc.switchFailed',
            title: '❌',
            type: 'danger'
        });
        mainWindow.webContents.send('rpc-status', { connected: false, reconnecting: false });
    }
    return false;
}

let coreActivityStartTimestamp = Date.now();
let lastCoreActivitySignature = '';

function setActivity(activity, presetClientId = null) {
    // Check if we need to switch Client ID for this preset
    // Priority: Explicit Argument > Activity Object Property > Global Default
    let targetClientId = presetClientId || (activity && activity.clientId) || clientId;

    // Preserve the original timestamp if the base activity hasn't changed (ignoring HW Stats)
    const presetName = presenceSources[currentPrioritySource]?.presetName || activity.details || '';
    const coreSignature = `${currentPrioritySource}:${presetName}:${activity.details || ''}:${activity.state || ''}:${activity.largeImageKey || ''}`;
    if (coreSignature !== lastCoreActivitySignature) {
        coreActivityStartTimestamp = Date.now();
        lastCoreActivitySignature = coreSignature;
    }

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

    if (hwMonitorEnabled) {
        const hwStr = typeof formatHWStatsForRPC === 'function' ? formatHWStatsForRPC() : null;
        if (hwStr) {
            finalActivity.state = finalActivity.state ? `${finalActivity.state} | ${hwStr}` : hwStr;
        }
    }


    // Get activity type (0=Playing, 1=Streaming, 2=Listening, 3=Watching, 5=Competing)
    const activityType = finalActivity.type !== undefined ? finalActivity.type : 0;
    if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Activity type:', activityType);

    // DEDUPLICATION CHECK:
    // If the activity content is identical to the current one, SKIP the update.
    // This prevents timestamp resets and flickering when lower-priority sources trigger evaluations.
    if (currentActivity && rpcConnected && currentClientId === targetClientId) {
        const isContentSame =
            finalActivity.details === currentActivity.details &&
            finalActivity.detailsUrl === currentActivity.detailsUrl &&
            finalActivity.state === currentActivity.state &&
            finalActivity.stateUrl === currentActivity.stateUrl &&
            finalActivity.url === currentActivity.url &&
            finalActivity.largeImageKey === currentActivity.largeImageKey &&
            finalActivity.largeImageText === currentActivity.largeImageText &&
            finalActivity.largeImageLink === currentActivity.largeImageLink &&
            finalActivity.smallImageKey === currentActivity.smallImageKey &&
            finalActivity.smallImageText === currentActivity.smallImageText &&
            finalActivity.smallImageLink === currentActivity.smallImageLink &&
            finalActivity.type === currentActivity.type &&
            finalActivity.startTimestamp === currentActivity.startTimestamp &&
            finalActivity.endTimestamp === currentActivity.endTimestamp &&
            finalActivity.useProgressBar === currentActivity.useProgressBar &&
            finalActivity.timestampMode === currentActivity.timestampMode &&
            finalActivity.customTimestamp === currentActivity.customTimestamp &&
            finalActivity.useEndTimestamp === currentActivity.useEndTimestamp &&
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
        if (finalActivity.largeImageLink) {
            assets.large_url = finalActivity.largeImageLink;
        }
        if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Using large image:', finalActivity.largeImageKey);
    } else {
        assets.large_image = 'logo';
    }

    if (finalActivity.smallImageKey) {
        assets.small_image = finalActivity.smallImageKey;
        if (finalActivity.smallImageText) {
            assets.small_text = finalActivity.smallImageText;
        }
        if (finalActivity.smallImageLink) {
            assets.small_url = finalActivity.smallImageLink;
        }
        if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Using small image:', finalActivity.smallImageKey);
    }

    // Build timestamps based on mode
    let timestamps = {};
    if (finalActivity.useProgressBar && finalActivity.startTimestamp && finalActivity.endTimestamp) {
        // Set both start and end to render ticking progress bar in Discord
        timestamps.start = parseInt(finalActivity.startTimestamp, 10);
        timestamps.end = parseInt(finalActivity.endTimestamp, 10);
        if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Progress bar active - start:', timestamps.start, 'end:', timestamps.end);
    } else {
        const timestampMode = finalActivity.timestampMode || 'normal';
        const useEndTimestamp = finalActivity.useEndTimestamp || false;

        // Calculate base timestamp
        let baseTimestamp;
        if (timestampMode === 'normal') {
            // Normal: timer since status was originally set for this exact activity mapping
            baseTimestamp = coreActivityStartTimestamp;
        } else if (timestampMode === 'local') {
            // Local: sync with Windows clock (show current time as start of day)
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            baseTimestamp = startOfDay;
        } else if (timestampMode === 'custom' && finalActivity.customTimestamp) {
            // Custom: user-defined timestamp (ensure it's a number, not string)
            baseTimestamp = parseInt(finalActivity.customTimestamp, 10) || Date.now();
        } else {
            baseTimestamp = coreActivityStartTimestamp;
        }

        // Apply start or end timestamp (ends in... countdown is only supported in custom mode)
        if (useEndTimestamp && timestampMode === 'custom') {
            // End timestamp: shows "ends in X" countdown
            timestamps.end = baseTimestamp;
            if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Using end timestamp:', new Date(baseTimestamp).toISOString());
        } else {
            // Start timestamp: shows "X elapsed"
            timestamps.start = baseTimestamp;
        }
    }

    // Build party info if provided
    let party = null;
    if (finalActivity.partyCurrent && finalActivity.partyMax && finalActivity.partyMax > 0) {
        // v1.10 fix: Use stable party ID based on content hash instead of Date.now()
        // Prevents Discord from flickering the party display on every update
        const partyHash = `solari_${finalActivity.partyCurrent}_${finalActivity.partyMax}`;
        party = {
            id: partyHash,
            size: [finalActivity.partyCurrent, finalActivity.partyMax]
        };
        if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Using party:', JSON.stringify(party));
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
            url: finalActivity.url,
            details: finalActivity.details,
            details_url: finalActivity.detailsUrl,
            state: finalActivity.state,
            state_url: finalActivity.stateUrl,
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
            rpcActivity.buttons = finalActivity.buttons.map(btn => {
                let translatedLabel = btn.label;
                if (btn.label && btn.label.startsWith('general.button')) {
                    translatedLabel = t_main(btn.label, btn.label);
                }
                return {
                    label: translatedLabel,
                    url: btn.url
                };
            });
            if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Using buttons:', JSON.stringify(rpcActivity.buttons));
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
            logError('setActivity', err);
            // v1.10 fix: Don't attempt inline reconnect — it was crashing because
            // rpcClient.destroy() nullifies the transport, then login() fails.
            // Instead, mark as disconnected and let the health check handle reconnection.
            if (err.message && (err.message.includes('connection') || err.message.includes('closed'))) {
                console.log('[Solari] Connection lost during setActivity — deferring to health check reconnect');
                rpcConnected = false;
                currentActivity = {};
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('rpc-status', { connected: false, reconnecting: true });
                }
            }
        }
    }, CONSTANTS.ACTIVITY_UPDATE_DEBOUNCE_MS);
}

// ===== CENTRALIZED PRESENCE CONTROLLER =====
// Unified state for all presence sources
const presenceSources = {
    // 1. Browser Extension (Highest Priority) - Overrides everything when active
    browserExtension: {
        active: false,
        data: null,
        _rawData: null, // Raw data from extension for re-processing on mapping change
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

    // 5. Default/Fallback - Lowest priority
    defaultFallback: {
        active: true,
        data: null
    }
};

// v1.10: Leading-edge throttle to coalesce cascade updatePresence() calls
let _updatePresenceThrottleTimer = null;
let _updatePresencePending = false;

async function updatePresence() {
    if (!isEnabled) return;

    // If a throttle window is active, defer to the end of it
    if (_updatePresenceThrottleTimer) {
        _updatePresencePending = true;
        return;
    }

    _updatePresenceThrottleTimer = setTimeout(() => {
        _updatePresenceThrottleTimer = null;
        if (_updatePresencePending) {
            _updatePresencePending = false;
            updatePresence(); // Execute the deferred call
        }
    }, CONSTANTS.PRESENCE_UPDATE_THROTTLE_MS);

    if (CONSTANTS.DEBUG_MODE) {
        console.log('[Solari-Core] updatePresence called. Source states:');
        console.log('  - manualPreset.active:', presenceSources.manualPreset.active, '| data:', !!presenceSources.manualPreset.data);
        console.log('  - autoDetect.active:', presenceSources.autoDetect.active, '| source:', presenceSources.autoDetect.source);
        console.log('  - browserExtension.active:', presenceSources.browserExtension.active, '| data:', !!presenceSources.browserExtension.data, '| platform:', presenceSources.browserExtension.platform);
        console.log('  - defaultFallback.active:', presenceSources.defaultFallback.active);
    }

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

    if (CONSTANTS.DEBUG_MODE) console.log('[Solari-Core] Selected source:', sourceType || 'NONE');

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
                rpcClient.clearActivity().catch(err => logError('clearActivity', err));
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

    if (CONSTANTS.DEBUG_MODE) console.log(`[Solari-Core] TargetClientID: ${targetClientId}, CurrentClientID: ${currentClientId}, Source.clientId: ${activeSource.clientId || 'null'}, Global: ${clientId}`);

    // 3. HANDLE CLIENT ID SWITCHING
    if (targetClientId !== currentClientId) {
        if (!isSwitching || targetClientId !== switchingTargetClientId) {
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
            isSwitching = false; // Force allow new switch
            switchRpcClient(targetClientId);
        } else {
            // Already switching to the SAME target client ID, just update the pending buffer
            console.log('[Solari-Core] Switch in progress to same target, updating pending buffer');
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
    if (CONSTANTS.DEBUG_MODE) console.log('[Solari-Core] Ready to apply activity. isSwitching:', isSwitching, 'rpcConnected:', rpcConnected);
    if (isSwitching) {
        if (CONSTANTS.DEBUG_MODE) console.log('[Solari-Core] Switch in progress, buffering activity instead of applying');
        pendingActivity = finalActivity;
    } else {
        if (CONSTANTS.DEBUG_MODE) console.log('[Solari-Core] Calling setActivity now...');
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
            if (CONSTANTS.DEBUG_MODE) console.log(`[Solari-Core] Showing notification - Source changed: ${sourceChanged}, Preset changed: ${presetChanged} (${lastNotifiedPresetName} -> ${currentPresetName})`);
            mainWindow.webContents.send('preset-auto-loaded', notificationText);
            lastNotifiedPresetName = currentPresetName;
        } else if (mainWindow && !sourceChanged && !presetChanged) {
            if (CONSTANTS.DEBUG_MODE) console.log('[Solari-Core] Source and preset unchanged, skipping toast notification.');
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
    const normalize = s => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

    if (CONSTANTS.DEBUG_MODE) {
        console.log(`[Solari Resolver] Starting resolution for platform: "${platform}"`);
        console.log(`[Solari Resolver] Preset: ${preset ? preset.name : 'null'}, preset.clientId: ${preset?.clientId || 'undefined'}`);
    }

    // Priority 1: Direct clientId on preset
    if (preset && preset.clientId) {
        if (CONSTANTS.DEBUG_MODE) console.log(`[Solari Resolver] ✅ RESOLVED via preset.clientId: ${preset.clientId}`);
        return preset.clientId;
    }

    // Priority 2: Identity via preset.identityId
    if (preset && preset.identityId && identities && identities.length > 0) {
        const identity = identities.find(i => i.id === preset.identityId);
        if (identity) {
            const id = identity.id;
            if (CONSTANTS.DEBUG_MODE) console.log(`[Solari Resolver] ✅ RESOLVED via identityId link: ${id}`);
            return id;
        }
    }

    // Priority 3: Identity matched by PLATFORM name (most important for extension)
    if (platform && identities && identities.length > 0) {
        const normPlatform = normalize(platform);
        const identityByPlatform = identities.find(i =>
            i.name && normalize(i.name) === normPlatform
        );
        if (identityByPlatform) {
            if (CONSTANTS.DEBUG_MODE) console.log(`[Solari Resolver] ✅ RESOLVED via platform name match: ${identityByPlatform.id}`);
            return identityByPlatform.id;
        }
    }

    // Priority 4: Identity matched by PRESET name
    if (preset && preset.name && identities && identities.length > 0) {
        const normPresetName = normalize(preset.name);
        const identityByPreset = identities.find(i =>
            i.name && normalize(i.name) === normPresetName
        );
        if (identityByPreset) {
            if (CONSTANTS.DEBUG_MODE) console.log(`[Solari Resolver] ✅ RESOLVED via preset name match: ${identityByPreset.id}`);
            return identityByPreset.id;
        }
    }

    // Priority 5: Default Client ID (if enabled in appSettings)
    const useDefault = appSettings.useDefaultExtensionClientIds !== false;
    if (useDefault && platform) {
        const normPlatform = normalize(platform);
        const defaultClientId = DEFAULT_EXTENSION_CLIENT_IDS[normPlatform];
        if (defaultClientId) {
            if (CONSTANTS.DEBUG_MODE) console.log(`[Solari Resolver] ✅ RESOLVED via DEFAULT extension client ID for ${normPlatform}: ${defaultClientId}`);
            return defaultClientId;
        }
    }

    // No match found
    if (CONSTANTS.DEBUG_MODE) console.log(`[Solari Resolver] ❌ NO CLIENT ID FOUND - will use Global default`);
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
        const normalizePlatform = s => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
        const activePlatformNormalized = normalizePlatform(presenceSources.browserExtension.platform);
        const incomingPlatformNormalized = normalizePlatform(platform);
        if (presenceSources.browserExtension.active && activePlatformNormalized === incomingPlatformNormalized) {
            if (CONSTANTS.DEBUG_MODE) console.log(`[Solari Extension] Clearing ${platform} state (debounce started)`);

            // Debounce: Wait 1s before actually clearing to prevent flickering on tab switches
            if (presenceSources.browserExtension.clearTimeout) {
                clearTimeout(presenceSources.browserExtension.clearTimeout);
            }

            presenceSources.browserExtension.clearTimeout = setTimeout(() => {
                if (CONSTANTS.DEBUG_MODE) console.log(`[Solari Extension] Debounce finished, clearing ${platform}`);
                presenceSources.browserExtension.active = false;
                presenceSources.browserExtension.data = null;
                presenceSources.browserExtension.platform = null;
                presenceSources.browserExtension.clearTimeout = null;
                presenceSources.browserExtension.startTimestamp = null; // Reset preserved timestamp
                saveData(); // Save immediately when cleared

                // ALSO clear autoDetect if it's detecting the same platform via website
                // This prevents autoDetect from immediately taking over with stale data
                if (presenceSources.autoDetect.active &&
                    presenceSources.autoDetect.source === 'website' &&
                    presenceSources.autoDetect.presetName &&
                    presenceSources.autoDetect.presetName.toLowerCase().includes(platform.toLowerCase())) {
                    if (CONSTANTS.DEBUG_MODE) console.log(`[Solari Extension] Also clearing autoDetect website for ${platform}`);
                    presenceSources.autoDetect.active = false;
                    presenceSources.autoDetect.data = null;
                    presenceSources.autoDetect.source = null;
                    presenceSources.autoDetect.presetName = null;
                    broadcastAutoDetectState();
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
        if (CONSTANTS.DEBUG_MODE) console.log(`[Solari Extension] Cancelling pending clear for ${pendingPlatform} (new data received for ${platform})`);
        clearTimeout(presenceSources.browserExtension.clearTimeout);
        presenceSources.browserExtension.clearTimeout = null;
    }

    // 2.5. Handle platform switch (e.g., Twitch -> YouTube)
    const previousPlatform = presenceSources.browserExtension.platform;
    if (previousPlatform && previousPlatform !== platform) {
        if (CONSTANTS.DEBUG_MODE) console.log(`[Solari Extension] Platform switch detected: ${previousPlatform} -> ${platform}`);
        saveData(); // Save previous platform's time immediately before switching
    }

    // 3. PREPARE DATA
    if (CONSTANTS.DEBUG_MODE) console.log(`[Solari Extension] Received ${platform} update:`, JSON.stringify(data));

    // Find matching preset for assets/Client ID (taking settings mappings into account first)
    const normalize = s => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const normPlatform = normalize(platform);

    // Check if platform mapping exists
    const mapping = appSettings.extensionMappings?.[normPlatform];
    let presetToUse = null;

    if (mapping && mapping.presetId) {
        presetToUse = presets.find(p => p.id === mapping.presetId || p.name === mapping.presetId);
    }

    if (!presetToUse) {
        // Use a generic default fallback instead of searching presets by name
        let defaultType = 3; // Default to Watching
        if (normPlatform === 'youtubemusic') {
            defaultType = 2; // Listening
        } else if (normPlatform === 'youtube') {
            defaultType = (data.activity === 'music') ? 2 : 3; // Listening to YouTube Music, or Watching YouTube Video
        }
        presetToUse = { name: platform, type: defaultType };
    }

    // Build buttons array from preset fields (same as loadPresetActivity)
    const buttons = [];
    if (presetToUse.button1Label && presetToUse.button1Url) {
        buttons.push({ label: presetToUse.button1Label, url: presetToUse.button1Url });
    }
    if (presetToUse.button2Label && presetToUse.button2Url) {
        buttons.push({ label: presetToUse.button2Label, url: presetToUse.button2Url });
    }

    // Only log button building in debug mode
    if (CONSTANTS.DEBUG_MODE) {
        console.log('[Solari Extension] Preset button fields:', {
            button1Label: presetToUse.button1Label,
            button1Url: presetToUse.button1Url,
            button2Label: presetToUse.button2Label,
            button2Url: presetToUse.button2Url,
            builtButtons: buttons
        });
    }

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
        if (CONSTANTS.DEBUG_MODE) console.log(`[Solari Extension] New timestamp set for ${platform}`);
    } else {
        if (CONSTANTS.DEBUG_MODE) console.log(`[Solari Extension] Preserving existing timestamp for ${platform}`);
    }

    let activityType = presetToUse.type || 3; // Default to Watching
    let activityState = data.subtitle || presetToUse.state;
    let detailsUrl = undefined;
    let stateUrl = undefined;
    let streamUrl = undefined;

    // Special handling for Twitch streams to make the streamer name natively clickable
    if (platform.toLowerCase() === 'twitch' && data.activity === 'live') {
        const rawChannelName = data.extra?.channel || data.title;
        const displayName = data.title || rawChannelName;

        if (rawChannelName && rawChannelName !== 'Twitch') {
            streamUrl = `https://twitch.tv/${rawChannelName.toLowerCase().replace(/\s+/g, '')}`;

            // Swap so Streamer Name becomes the top line (details) and Category becomes bottom line (state)
            // Just like the Solari App native UI handles it
            finalDetails = displayName;
            activityState = data.subtitle || 'Twitch';

            // Apply URLs to make text clickable natively in Discord
            detailsUrl = streamUrl;
            stateUrl = streamUrl;
        }
    }

    let finalLargeImageKey = presetToUse.largeImageKey;
    const isUsingDefaultClientIds = appSettings.useDefaultExtensionClientIds !== false;
    if (isUsingDefaultClientIds && DEFAULT_EXTENSION_IMAGES[normPlatform]) {
        if (!finalLargeImageKey || finalLargeImageKey === 'logo') {
            finalLargeImageKey = DEFAULT_EXTENSION_IMAGES[normPlatform];
        }
    } else if (!finalLargeImageKey) {
        finalLargeImageKey = 'logo';
    }

    const lowerPlatform = platform.toLowerCase();
    const isPlaybackPlatform = ['netflix', 'primevideo', 'youtube', 'youtubemusic'].includes(lowerPlatform);
    
    let useProgress = presetToUse.useProgressBar || false;
    let startTimestamp = undefined;
    let endTimestamp = undefined;
    let customTimestamp = presenceSources.browserExtension.startTimestamp;
    let timestampMode = 'custom';

    if (isPlaybackPlatform && data.extra && data.extra.duration > 0 && data.extra.currentTime !== undefined) {
        const currentTime = data.extra.currentTime;
        const duration = data.extra.duration;
        
        if (data.state === 'playing') {
            useProgress = true; // Override preset setting
            startTimestamp = Math.round(Date.now() - (currentTime * 1000));
            endTimestamp = Math.round(startTimestamp + (duration * 1000));
        } else {
            // Paused: show static elapsed time since it was paused (doesn't tick in Discord)
            startTimestamp = Math.round(Date.now() - (currentTime * 1000));
            useProgress = false;
        }
    }

    const activity = {
        type: activityType,
        details: finalDetails,
        detailsUrl: detailsUrl,
        state: activityState,
        stateUrl: stateUrl,
        largeImageKey: finalLargeImageKey,
        // largeImageText intentionally omitted for extension (causes duplicate text in Discord)
        smallImageKey: data.state === 'paused' ? 'pause' : (presetToUse.smallImageKey || 'play'),
        smallImageText: data.state === 'paused' ? 'Paused' : undefined,
        buttons: buttons.length > 0 ? buttons : undefined,
        useProgressBar: useProgress,
        startTimestamp: startTimestamp,
        endTimestamp: endTimestamp,
        timestampMode: useProgress ? undefined : timestampMode,
        customTimestamp: useProgress ? undefined : customTimestamp
    };

    if (CONSTANTS.DEBUG_MODE) console.log('[Solari Extension] Constructed activity:', JSON.stringify(activity, null, 2));

    // RESOLVE CLIENT ID (USING ROBUST RESOLVER & MAPPINGS)
    let finalClientId = null;
    if (mapping && mapping.clientId) {
        // Resolve custom profiles UUID mapping to numeric IDs if needed
        const identity = identities.find(i => i.id === mapping.clientId || i.clientId === mapping.clientId);
        finalClientId = identity ? identity.clientId : mapping.clientId;
    } else {
        finalClientId = resolveClientIdForPlatform(platform, presetToUse);
    }

    // 4. UPDATE SOURCE STATE
    presenceSources.browserExtension.active = true;
    presenceSources.browserExtension.data = activity;
    presenceSources.browserExtension._rawData = data; // Cache raw data for mapping re-apply
    presenceSources.browserExtension.platform = platform;
    presenceSources.browserExtension.clientId = finalClientId || null;
    presenceSources.browserExtension.presetName = presetToUse.name;
    presenceSources.browserExtension.timestamp = Date.now();

    // 5. TRIGGER UPDATE
    if (CONSTANTS.DEBUG_MODE) console.log(`[Solari Extension] Calling updatePresence for ${platform}...`);
    updatePresence();
    if (CONSTANTS.DEBUG_MODE) console.log(`[Solari Extension] updatePresence completed for ${platform}`);

    // 6. CONFIRMATION
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'media_update_applied',
            platform,
            preset: presetToUse.name,
            noClientId: !finalClientId
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

function broadcastAutoDetectState() {
    if (mainWindow) {
        mainWindow.webContents.send('auto-detect-result', {
            presetName: presenceSources.autoDetect.presetName
        });
    }
}


ipcMain.on('update-activity', (event, activity) => {
    // 1. Update Manual Source
    presenceSources.manualPreset.data = activity;
    presenceSources.manualPreset.active = true; // Always active when manually updated
    presenceSources.manualPreset.clientId = activity.clientId;
    presenceSources.manualPreset.presetName = activity.presetName || "Manual Update";

    // Notify Renderer of manual mode state
    if (mainWindow) mainWindow.webContents.send('manual-mode-changed', true);

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

    updatePresence();
    if (mainWindow) mainWindow.webContents.send('manual-mode-changed', false);
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

    if (autoDetectWindow && !autoDetectWindow.isDestroyed()) {
        autoDetectWindow.webContents.send('theme-loaded', theme);
    }
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
    updatePresence();
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

ipcMain.on('control-extension', (event, cmdData) => {
    if (extensionWsId) {
        const extPlugin = connectedPlugins.get(extensionWsId);
        if (extPlugin && extPlugin.ws && extPlugin.ws.readyState === WebSocket.OPEN) {
            extPlugin.ws.send(JSON.stringify({
                type: 'control_extension',
                ...cmdData
            }));
        }
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
            `Version: ${CONSTANTS.APP_VERSION}`,
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
    return CONSTANTS.APP_VERSION;
});

// Resolve Imgur album/page URLs to direct image URLs
ipcMain.handle('resolve-imgur-url', async (event, url) => {
    const https = require('https');
    const http = require('http');

    if (CONSTANTS.DEBUG_MODE) console.log('[Solari] ========== IMGUR RESOLVER ==========');
    if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Input URL:', url);

    try {
        // If it's already a direct image URL (i.imgur.com with extension), just clean and return
        if (url.includes('i.imgur.com') && /\.(png|jpg|jpeg|gif|webp)/i.test(url)) {
            if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Already direct URL');
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
                            if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Redirect to:', newUrl);
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
        if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Fetched HTML length:', html.length);

        if (html.length < 100) {
            if (CONSTANTS.DEBUG_MODE) console.log('[Solari] HTML too short, likely error page');
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
                if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Found og:image:', ogUrl);
                break;
            }
        }

        if (ogUrl) {
            return cleanImgurUrl(ogUrl);
        }

        // Strategy 2: Look for i.imgur.com URLs directly in HTML
        const directMatch = html.match(/https?:\/\/i\.imgur\.com\/[a-zA-Z0-9]+\.(png|jpg|jpeg|gif|webp)/i);
        if (directMatch) {
            if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Found direct URL in HTML:', directMatch[0]);
            return cleanImgurUrl(directMatch[0]);
        }

        // Strategy 3: JSON data
        const hashMatch = html.match(/"hash"\s*:\s*"([a-zA-Z0-9]{5,10})"/);
        const extMatch = html.match(/"ext"\s*:\s*"\.?(png|jpg|jpeg|gif|webp)"/i);

        if (hashMatch && extMatch) {
            const ext = extMatch[1].replace('.', '');
            const imageUrl = `https://i.imgur.com/${hashMatch[1]}.${ext}`;
            if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Found via JSON:', imageUrl);
            return imageUrl;
        }

        if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Could not find image URL');
        if (CONSTANTS.DEBUG_MODE) console.log('[Solari] HTML preview:', html.substring(0, 500));
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
        if (CONSTANTS.DEBUG_MODE) console.log('[Solari] URL does not match valid Imgur format:', url);
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
        if (CONSTANTS.DEBUG_MODE) console.log('[Solari] Cleaned URL:', `https://i.imgur.com/${id}${ext}`, '(removed suffix:', suffix + ')');
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
    if (settings.afkTiers) {
        systemAFKSettings.afkTiers = settings.afkTiers;
    }

    saveData(); // v1.11.1: Persist settings!

    // Forward to all connected plugins
    if (wss) wss.clients.forEach(client => { if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify({ type: 'update_afk_settings', settings })); });
});
ipcMain.on('save-default', (event, activity) => { defaultActivity = activity; saveData(); if (!currentActivity.details && !currentActivity.state) setActivity({}); event.reply('default-saved'); });
ipcMain.on('save-preset', (event, preset) => { presets.push(preset); saveData(); event.reply('presets-updated', presets); });
ipcMain.on('update-preset', (event, { index, preset }) => {
    if (index >= 0 && index < presets.length) {
        const oldPresetName = presets[index].name;
        presets[index] = preset;
        saveData();
        event.reply('presets-updated', presets);
        console.log(`[Solari] Preset updated at index ${index}: ${preset.name}`);

        // Refresh active RPC presence silently if this preset is in use
        refreshActivePresetPresence(oldPresetName, preset);
    }
});
ipcMain.on('delete-preset', (event, index) => {
    presets.splice(index, 1);

    // Adjust fallbackPresetIndex dynamically (Bug 18)
    if (fallbackPresetIndex === index) {
        fallbackPresetIndex = -1; // Reset fallback
    } else if (fallbackPresetIndex > index) {
        fallbackPresetIndex--; // Shift down to align index
    }

    saveData();
    event.reply('presets-updated', presets);
});
ipcMain.on('get-data', (event) => {
    console.log(`[Solari DEBUG] Sending get-data reply. Presets: ${presets.length}, Mappings: ${autoDetectMappings.length}, Identities: ${identities.length}`);
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
        ecoMode: global.ecoMode, // Send eco mode status
        appSettings: appSettings, // CRITICAL: Send full settings for Settings Tab
        identities: identities, // FIXED: Added missing identities list
        globalClientId: clientId, // v1.12.0: Used by onboarding banner
        autoDetectPreset: presenceSources.autoDetect.presetName // v1.12.0: Current detected preset
    });
    updateTrayMenu();
    Menu.setApplicationMenu(null); // Ensure top menu bar is disabled!
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

ipcMain.on('update-messagetools-plugin-settings', (event, settings) => {
    try {
        const bdConfigPath = path.join(app.getPath('userData').replace('solari-app', 'BetterDiscord'), 'plugins', 'SolariMessageTools.config.json');

        let fileData = { settings: settings, schema: [] };
        if (fs.existsSync(bdConfigPath)) {
            try {
                let existing = JSON.parse(fs.readFileSync(bdConfigPath, 'utf8'));
                fileData = { ...existing, settings: { ...existing.settings, ...settings } };
            } catch (e) { }
        }
        fs.writeFileSync(bdConfigPath, JSON.stringify(fileData, null, 4), 'utf8');
        console.log('[Solari] Solari MessageTools BD Plugin config updated via UI Schema!');
    } catch (error) {
        console.error("[Solari] Solari MessageTools IPC Saving Error:", error);
    }
});

ipcMain.on('update-notes-plugin-settings', (event, settings) => {
    // Check if it's a reset action
    if (settings && settings.action === 'reset_position') {
        console.log('[Solari] Resetting Solari Notes settings to defaults');
        solariNotesSettings = {
            panelOpacity: 100,
            blurIntensity: 16,
            fontSize: 14,
            fontFamily: 'sans',
            accentColor: '#5865F2',
            editorPadding: 16,
            autoSaveDelay: 1000,
            language: appSettings.language || 'en'
        };
        // We don't reset windows position from here to avoid jarring UX if they just wanted to reset styles,
        // but the plugin's internal reset does it. Let's stay consistent with the plugin's "Reset All".
    } else {
        solariNotesSettings = { ...solariNotesSettings, ...settings };
    }

    saveData();
    if (wss) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                // Not the most efficient but works: broad-broadcast to all clients, plugins filter by type anyway
                client.send(JSON.stringify({ type: 'update_notes_settings', settings: solariNotesSettings }));
            }
        });
    }
});

// ===== SOUNDBOARD HOTKEY PLAYBACK HELPER =====
// Play sound via IPC to renderer (called when global hotkey is pressed)
function playSoundByIdFromHotkey(soundId) {
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('soundboard:play-from-hotkey', soundId);
    }
}

// Callback for global shortcut - this is called when global hotkey is pressed
function handleShortcutPlay(soundId) {
    if (!soundBoard || !soundServer || !wss || !soundBoard.settings.enabled) return;

    const sound = soundBoard.getSoundById(soundId);
    if (!sound) return;

    const url = `${soundServer.getBaseUrl()}/sounds/${soundId}?token=${soundboardToken}`;
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

// ===== DYNAMIC PLUGIN CONFIG IPC HANDLERS =====
const registeredDynamicIPCOntrollers = new Set();
function registerPluginSettingsIPCHandler(pluginKey) {
    const channel = `update-${pluginKey.toLowerCase()}-plugin-settings`;
    // Avoid double-registering or overriding core/special ones
    const specialChannels = [
        'update-spotify-plugin-settings',
        'update-notes-plugin-settings',
        'update-messagetools-plugin-settings'
    ];
    if (specialChannels.includes(channel)) return;
    if (registeredDynamicIPCOntrollers.has(channel)) return;

    registeredDynamicIPCOntrollers.add(channel);
    ipcMain.on(channel, (event, settings) => {
        try {
            const bdPluginsPath = getBDPluginsPath();
            if (!fs.existsSync(bdPluginsPath)) return;
            const files = fs.readdirSync(bdPluginsPath);
            const configFile = files.find(f => f.toLowerCase() === `${pluginKey.toLowerCase()}.config.json`);
            if (!configFile) return;

            const bdConfigPath = path.join(bdPluginsPath, configFile);
            let fileData = { settings: {}, schema: [] };
            if (fs.existsSync(bdConfigPath)) {
                try {
                    fileData = JSON.parse(fs.readFileSync(bdConfigPath, 'utf8'));
                } catch (e) {
                    console.error(`[Solari] Config corruption detected for ${pluginKey}, rewriting.`, e);
                }
            }

            // Merge settings
            fileData.settings = { ...fileData.settings, ...settings };

            fs.writeFileSync(bdConfigPath, JSON.stringify(fileData, null, 4), 'utf8');
            console.log(`[Solari] Dynamic plugin config updated for ${pluginKey}`);
        } catch (error) {
            console.error(`[Solari] Dynamic IPC saving error for ${pluginKey}:`, error);
        }
    });
}

function scanAndRegisterDynamicIPCHandlers() {
    try {
        const bdPluginsPath = getBDPluginsPath();
        if (fs.existsSync(bdPluginsPath)) {
            const files = fs.readdirSync(bdPluginsPath);
            files.forEach(file => {
                if (file.toLowerCase().endsWith('.config.json')) {
                    const pluginKey = file.substring(0, file.indexOf('.config.json')).toLowerCase();
                    registerPluginSettingsIPCHandler(pluginKey);
                }
            });
        }
    } catch (err) {
        console.error('[Solari] Error scanning dynamic plugin configs:', err);
    }
}

function setupPluginWatcher() {
    if (pluginWatcher) return;
    try {
        const pluginsPath = getBDPluginsPath();

        // Ensure folder exists to avoid error
        if (!fs.existsSync(pluginsPath)) return;

        let debounceTimer = null;
        pluginWatcher = fs.watch(pluginsPath, (eventType, filename) => {
            if (filename && (filename.endsWith('.js') || filename.endsWith('.json'))) {
                // Debounce to avoid multiple events for single file change
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        console.log('[Solari] Local plugin change detected:', filename);
                        scanAndRegisterDynamicIPCHandlers(); // Scan/Register new configs if any added
                        mainWindow.webContents.send('plugins:local-change');
                    }
                }, 200);
            }
        });
        console.log('[Solari] Plugin watcher started on:', pluginsPath);
    } catch (e) {
        // Folder might not exist yet if BD is not installed
        // console.error('[Solari] Failed to setup plugin watcher:', e.message);
    }
}



// P2-BUG-02: Unified — delegates to checkBDStatus() to avoid 60 lines of duplicated logic
ipcMain.handle('plugin:check-bd', async () => {
    return await checkBDStatus();
});

// Uninstall BetterDiscord (remove hook + asar, keep plugins/themes)
ipcMain.handle('plugin:uninstall-bd', async () => {
    console.log('[BD UNINSTALLER] Starting uninstall...');
    isUninstalling = true;
    try {
        const { exec, spawn } = require('child_process');

        // 1. Find Discord's index.js
        const localAppData = process.env.LOCALAPPDATA;
        const discordBase = path.join(localAppData, 'Discord');
        let injectionTarget = null;

        if (fs.existsSync(discordBase)) {
            const appDirs = fs.readdirSync(discordBase)
                .filter(d => d.startsWith('app-'))
                .sort().reverse();

            if (appDirs.length > 0) {
                const modulesDir = path.join(discordBase, appDirs[0], 'modules');
                if (fs.existsSync(modulesDir)) {
                    const coreDirs = fs.readdirSync(modulesDir).filter(d => d.startsWith('discord_desktop_core'));
                    if (coreDirs.length > 0) {
                        injectionTarget = path.join(modulesDir, coreDirs[0], 'discord_desktop_core', 'index.js');
                    }
                }
            }
        }

        // Helper to kill a process on Windows
        const killProcess = (exeName) => {
            return new Promise((resolve) => {
                exec(`taskkill /F /IM ${exeName} /T`, (err, stdout, stderr) => {
                    if (err) {
                        console.warn(`[BD UNINSTALLER] taskkill error/warning for ${exeName}:`, stderr || err.message);
                    } else {
                        console.log(`[BD UNINSTALLER] taskkill output for ${exeName}:`, stdout);
                    }
                    resolve();
                });
            });
        };

        // 2. Kill Discord
        console.log('[BD UNINSTALLER] Killing Discord...');
        if (process.platform === 'win32') {
            await Promise.all([
                killProcess('Discord.exe'),
                killProcess('DiscordCanary.exe'),
                killProcess('DiscordPTB.exe')
            ]);
        } else {
            await new Promise((resolve) => {
                exec('pkill -f Discord', () => resolve());
            });
        }

        // Wait 2.5 seconds for OS to clean up processes and handles
        await new Promise((resolve) => setTimeout(resolve, 2500));

        // Check if Discord is still running (suggests elevation / Access Denied)
        const stillRunning = await isDiscordRunning();
        if (stillRunning) {
            console.log('[BD UNINSTALLER] Discord is still running after kill attempt.');
            const err = new Error('O Discord está aberto e não pôde ser fechado automaticamente (Acesso Negado). Por favor, feche o Discord manualmente (no Gerenciador de Tarefas ou bandeja) e tente novamente.');
            err.code = 'EBUSY';
            throw err;
        }

        const bdAsarPath = path.join(app.getPath('appData'), 'BetterDiscord', 'data', 'betterdiscord.asar');
        const tmpAsarPath = bdAsarPath + '.tmp_uninstall';
        let renamed = false;
        let lastError = null;

        const prevNoAsar = process.noAsar;
        process.noAsar = true;
        try {
            // Test if we can rename betterdiscord.asar (atomic test for file locks)
            if (fs.existsSync(bdAsarPath)) {
                for (let attempt = 1; attempt <= 10; attempt++) {
                    try {
                        fs.renameSync(bdAsarPath, tmpAsarPath);
                        console.log('[BD UNINSTALLER] Renamed asar to temp file successfully on attempt:', attempt);
                        renamed = true;
                        break;
                    } catch (err) {
                        lastError = err;
                        if (err.code === 'EBUSY' || err.code === 'EPERM') {
                            console.log(`[BD UNINSTALLER] File locked, retrying rename in 500ms... (Attempt ${attempt}/10)`);
                            await new Promise(r => setTimeout(r, 500));
                        } else {
                            throw err;
                        }
                    }
                }
                if (!renamed && lastError) {
                    throw lastError;
                }
            }

            // 3. Restore original index.js (remove BD hook) - Safe because we renamed the ASAR!
            if (injectionTarget && fs.existsSync(injectionTarget)) {
                const originalContent = `module.exports = require('./core.asar');`;
                fs.writeFileSync(injectionTarget, originalContent, 'utf8');
                console.log('[BD UNINSTALLER] Hook removed from:', injectionTarget);
            }

            // 4. Delete the temporary asar file
            if (renamed && fs.existsSync(tmpAsarPath)) {
                fs.unlinkSync(tmpAsarPath);
                console.log('[BD UNINSTALLER] Deleted temp asar successfully');
            }
        } catch (err) {
            console.error('[BD UNINSTALLER] Failed during uninstall execution:', err);
            // Rollback renaming if we renamed but index.js restore or deletion failed
            if (renamed && fs.existsSync(tmpAsarPath)) {
                try {
                    fs.renameSync(tmpAsarPath, bdAsarPath);
                    console.log('[BD UNINSTALLER] Rollback: Restored asar file successfully');
                } catch (rollbackErr) {
                    console.error('[BD UNINSTALLER] Rollback failed:', rollbackErr);
                }
            }
            throw err;
        } finally {
            process.noAsar = prevNoAsar;
        }

        // 5. Restart Discord
        console.log('[BD UNINSTALLER] Restarting Discord...');
        const updateExe = path.join(discordBase, 'Update.exe');
        if (fs.existsSync(updateExe)) {
            const child = spawn(updateExe, ['--processStart', 'Discord.exe'], {
                detached: true,
                stdio: 'ignore'
            });
            child.unref();
        }

        console.log('[BD UNINSTALLER] Complete!');
        broadcastBDStatus('not_installed');
        return { success: true };
    } catch (e) {
        console.error('[BD UNINSTALLER] Error:', e);
        let errorMsg = e.message;
        if (e.code === 'EBUSY' || e.code === 'EPERM') {
            const running = await isDiscordRunning();
            if (running) {
                errorMsg = 'O Discord está aberto e bloqueando a desinstalação (Acesso Negado para fechá-lo automaticamente). Por favor, feche o Discord manualmente (no Gerenciador de Tarefas ou bandeja) e tente novamente.';
            } else {
                errorMsg = 'O arquivo betterdiscord.asar está bloqueado por outro processo. Feche os programas em segundo plano e tente novamente.';
            }
        }
        return { success: false, error: errorMsg };
    } finally {
        isUninstalling = false;
    }
});

// Helper to broadcast BD status to all renderer windows
// Payload now includes optional bdVersion (local) and latestVersion (remote)
function broadcastBDStatus(status, extraPayload = {}, force = false) {
    if (!force && lastKnownBDStatus === status && status !== 'repairing') return;
    lastKnownBDStatus = status;

    // v1.11.1: Update telemetry with BD status
    if (telemetry) {
        telemetry.setBDStatus(status);
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('bd-status-update', { status, ...extraPayload });
    }
}

ipcMain.handle('bd:get-status', async () => {
    // If we don't have a status yet, do a quick check
    if (!lastKnownBDStatus || lastKnownBDStatus === 'unknown') {
        const result = await checkBDStatus();
        lastKnownBDStatus = result.status;
        return result;
    }
    return { status: lastKnownBDStatus };
});

// Force-refresh BD status + version check (invalidates remote version cache)
ipcMain.handle('bd:check-update', async () => {
    cachedBDRemoteVersion = null; // invalidate cache for fresh check
    bdRemoteVersionFetchedAt = 0;
    const result = await checkBDStatus();
    const { status, ...extra } = result;
    broadcastBDStatus(status, extra, true);
    return result;
});

// Fetch the latest BetterDiscord release tag from GitHub API (cached 30 min)
async function fetchBDLatestVersion() {
    const now = Date.now();
    if (cachedBDRemoteVersion && (now - bdRemoteVersionFetchedAt) < BD_VERSION_CACHE_MS) {
        return cachedBDRemoteVersion;
    }
    try {
        const result = await new Promise((resolve, reject) => {
            const req = net.request({
                url: 'https://api.github.com/repos/BetterDiscord/BetterDiscord/releases/latest',
                method: 'GET',
                headers: {
                    'User-Agent': CONSTANTS.APP_USER_AGENT || 'Solari-App',
                    'Accept': 'application/vnd.github+json'
                }
            });
            req.on('response', (res) => {
                const chunks = [];
                res.on('data', c => chunks.push(c));
                res.on('end', () => {
                    try {
                        const json = JSON.parse(Buffer.concat(chunks).toString());
                        resolve(json.tag_name ? json.tag_name.replace(/^v/, '') : null);
                    } catch { resolve(null); }
                });
            });
            req.on('error', () => resolve(null));
            req.end();
        });
        if (result) {
            cachedBDRemoteVersion = result;
            bdRemoteVersionFetchedAt = now;
        }
        return result;
    } catch {
        return null;
    }
}

// Read the version from the local betterdiscord.asar package.json
function getLocalBDVersion(bdAsarPath) {
    const prevNoAsar = process.noAsar;
    try {
        process.noAsar = true;
        if (!fs.existsSync(bdAsarPath)) {
            return null;
        }

        const buf = fs.readFileSync(bdAsarPath);
        // We only scan the first 500KB since the package.json metadata is always at the very beginning of the ASAR archive
        const chunk = buf.toString('utf8', 0, Math.min(500 * 1024, buf.length));

        // Match version inside package.json
        const match = chunk.match(/"version"\s*:\s*"(\d+\.\d+\.\d+)"/i) || chunk.match(/version["']?\s*[:=]\s*["'](\d+\.\d+\.\d+)["']/i);
        if (match && match[1]) {
            return match[1];
        }
        return null;
    } catch (e) {
        return null;
    } finally {
        process.noAsar = prevNoAsar;
    }
}

// Semver comparison helper — returns true if v1 > v2
function semverGt(v1, v2) {
    if (!v1 || !v2) return false;
    const a = String(v1).replace(/^v/, '').split('.').map(Number);
    const b = String(v2).replace(/^v/, '').split('.').map(Number);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if ((a[i] || 0) > (b[i] || 0)) return true;
        if ((a[i] || 0) < (b[i] || 0)) return false;
    }
    return false;
}

// Check if Discord is currently running
async function isDiscordRunning() {
    const checkProcess = (exeName) => {
        return new Promise((resolve) => {
            exec(`tasklist /FI "IMAGENAME eq ${exeName}" /NH`, (err, stdout) => {
                if (err) return resolve(false);
                resolve(stdout.toLowerCase().includes(exeName.toLowerCase()));
            });
        });
    };

    if (process.platform === 'win32') {
        const results = await Promise.all([
            checkProcess('Discord.exe'),
            checkProcess('DiscordCanary.exe'),
            checkProcess('DiscordPTB.exe')
        ]);
        return results.some(r => r === true);
    } else {
        return new Promise((resolve) => {
            exec('pgrep Discord || pgrep DiscordCanary || pgrep DiscordPTB', (err, stdout) => {
                if (err) return resolve(false);
                resolve(stdout.trim().length > 0);
            });
        });
    }
}

// Read BD plugins configuration to check if SolariManager is supposed to be active
function isSolariManagerEnabledInBD() {
    try {
        const bdPath = path.join(app.getPath('appData'), 'BetterDiscord', 'data');
        const flavors = ['stable', 'canary', 'ptb'];
        for (const flavor of flavors) {
            const pluginsJsonPath = path.join(bdPath, flavor, 'plugins.json');
            if (fs.existsSync(pluginsJsonPath)) {
                const config = JSON.parse(fs.readFileSync(pluginsJsonPath, 'utf8'));
                if (config['SolariManager'] === true) return true;
            }
        }
        return false;
    } catch { return false; }
}

// Reusable logic for BetterDiscord Check (v1.8.2 — with pending-update detection)

async function checkBDStatus() {
    if (isUninstalling) {
        return { status: 'uninstalling' };
    }
    const smConnected = Array.from(wss.clients).some(c => c.isSolariManager && c.readyState === 1); // Move to top to avoid ReferenceError (Bug 14)
    try {
        const bdPath = path.join(app.getPath('appData'), 'BetterDiscord');
        const bdDataPath = path.join(bdPath, 'data');
        let bdAsarPath = path.join(bdDataPath, 'betterdiscord.asar');

        const prevNoAsar = process.noAsar;
        process.noAsar = true;

        // Robust check: try common variations if first one fails
        if (!fs.existsSync(bdAsarPath)) {
            const altPath = path.join(process.env.APPDATA || '', 'BetterDiscord', 'data', 'betterdiscord.asar');
            if (fs.existsSync(altPath)) bdAsarPath = altPath;
        }

        const asarExists = fs.existsSync(bdAsarPath);
        process.noAsar = prevNoAsar;

        let injectionFoundInLatest = false;
        let injectionFoundInOlder = false;
        let hasMultipleAppDirs = false;
        const localAppData = process.env.LOCALAPPDATA;

        if (localAppData) {
            const flavors = ['Discord', 'DiscordCanary', 'DiscordPTB'];
            for (const flavor of flavors) {
                const discordBase = path.join(localAppData, flavor);
                if (fs.existsSync(discordBase)) {
                    try {
                        const appDirs = fs.readdirSync(discordBase).filter(d => d.startsWith('app-')).sort().reverse();
                        if (appDirs.length > 0) hasMultipleAppDirs = hasMultipleAppDirs || appDirs.length > 1;

                        for (let i = 0; i < appDirs.length; i++) {
                            const modulesDir = path.join(discordBase, appDirs[i], 'modules');
                            if (!fs.existsSync(modulesDir)) continue;
                            const coreDirs = fs.readdirSync(modulesDir).filter(d => d.startsWith('discord_desktop_core'));
                            for (let cd of coreDirs) {
                                const indexJs = path.join(modulesDir, cd, 'discord_desktop_core', 'index.js');
                                if (fs.existsSync(indexJs)) {
                                    try {
                                        const content = fs.readFileSync(indexJs, 'utf8');
                                        if (content.toLowerCase().includes('betterdiscord')) {
                                            if (i === 0) injectionFoundInLatest = true;
                                            else injectionFoundInOlder = true;
                                        }
                                    } catch (readErr) {
                                        // If we can't read it but it exists, assume it might be injected if it's currently working
                                        if (smConnected) injectionFoundInLatest = true;
                                    }
                                }
                            }
                        }
                    } catch (e) { /* filesystem race */ }
                }
            }
        }

        const discordRunning = await isDiscordRunning();
        // smConnected is already resolved at top (Bug 14)

        // Heuristic: asar exists, BD is injected in an older app-* dir but NOT in the newest one,
        // AND there are multiple app-* dirs → Discord downloaded an update but hasn't applied it yet.
        // We must check this BEFORE the smConnected return, because if Discord is running
        // with the old version, smConnected will be true, hiding the pending update state.
        if (asarExists && !injectionFoundInLatest && injectionFoundInOlder && hasMultipleAppDirs) {
            return { status: 'pending_update', bdVersion: getLocalBDVersion(bdAsarPath) };
        }

        // If we have a live connection, BD is definitely working, regardless of file detection
        if (smConnected) {
            const localVersion = getLocalBDVersion(bdAsarPath);
            const remoteVersion = await fetchBDLatestVersion();
            return { status: 'ok', bdVersion: localVersion, latestVersion: remoteVersion };
        }

        if (asarExists && injectionFoundInLatest) {
            // Check for Incompatibility (Injected but not working while Discord is running)
            const smPluginPath = path.join(bdPath, 'plugins', 'SolariManager.plugin.js');
            const smFileExists = fs.existsSync(smPluginPath);
            const smIntendedActive = isSolariManagerEnabledInBD();

            if (discordRunning && smFileExists && smIntendedActive && !smConnected) {
                // v1.11.1: Skip incompatible detection during startup grace period
                // Prevents false positives when SolariManager WS hasn't connected yet
                if ((Date.now() - BD_STARTUP_TIME) < BD_STARTUP_GRACE_MS) {
                    return { status: 'ok', bdVersion: getLocalBDVersion(bdAsarPath) };
                }

                // Potential incompatibility found (Plugin exists and should be on, but no signal)
                bdIncompatibleCounter++;

                // Only trigger if it persists for at least 2 cycles (~6 seconds with default polling)
                if (bdIncompatibleCounter >= 2) {
                    const localVersion = getLocalBDVersion(bdAsarPath);
                    let latestVersion = null;
                    try {
                        latestVersion = await fetchBDLatestVersion();
                    } catch (e) { /* ignore network error here */ }

                    if (latestVersion && localVersion && semverGt(latestVersion, localVersion)) {
                        return { status: 'incompatible_update', bdVersion: localVersion, latestVersion };
                    }
                    return { status: 'incompatible', bdVersion: localVersion };
                }

                // Still in grace period, return 'ok' (presumptive)
                return { status: 'ok', bdVersion: getLocalBDVersion(bdAsarPath) };
            }

            // Reset counter if condition is not met
            bdIncompatibleCounter = 0;

            // Original logic for OK and Outdated
            const localVersion = getLocalBDVersion(bdAsarPath);
            let remoteVersion = null;
            try {
                remoteVersion = await fetchBDLatestVersion();
            } catch (err) {
                console.warn('[BD] Could not fetch remote version:', err.message);
            }

            if (remoteVersion && localVersion && semverGt(remoteVersion, localVersion)) {
                console.log(`[BD] Outdated: local=v${localVersion} remote=v${remoteVersion}`);
                return { status: 'outdated', bdVersion: localVersion, latestVersion: remoteVersion };
            }
            return { status: 'ok', bdVersion: localVersion, latestVersion: remoteVersion };
        }

        // The pending_update check has been moved above to take precedence over smConnected

        if (asarExists || injectionFoundInLatest || injectionFoundInOlder) return { status: 'broken' };
        return { status: 'not_installed' };
    } catch (e) {
        console.error('[BD] Error during status check:', e);
        // Fallback to what we know
        return { status: 'not_installed' };
    }
}

// Background poller for Auto-Repair (v1.8.2 — anti-loop, v1.10: constants centralized)
function startBDBackgroundPolling() {
    if (bdStatusPollInterval) clearInterval(bdStatusPollInterval);

    const interval = global.ecoMode ? CONSTANTS.BD_POLL_INTERVAL_ECO_MS : CONSTANTS.BD_POLL_INTERVAL_MS;

    bdStatusPollInterval = setInterval(async () => {
        if (isRepairing || isUninstalling) return;

        const result = await checkBDStatus();
        const { status, ...extra } = result;
        broadcastBDStatus(status, extra);

        // Update runtime status (including discordRunning) periodically
        if (mainWindow && !mainWindow.isDestroyed()) {
            const discordRunning = await isDiscordRunning();
            mainWindow.webContents.send('bd-runtime-status', {
                active: !!solariManagerWsId,
                discordRunning: discordRunning
            });
        }

        // Skip repair for non-broken statuses or when auto-repair is off
        if (!appSettings.bdAutoRepair || (status !== 'broken')) {
            bdBrokenCount = 0;
            if (status === 'pending_update') {
                console.log('[BD] Discord update pending — auto-repair paused');
            }
            return;
        }

        // Cooldown check: don't repair if we recently completed one
        const now = Date.now();
        if (now < bdRepairCooldownUntil) {
            bdBrokenCount = 0;
            return;
        }

        // Circuit breaker: prune old entries and check
        bdRepairHistory = bdRepairHistory.filter(ts => (now - ts) < CONSTANTS.BD_REPAIR_WINDOW_MS);
        if (bdRepairHistory.length >= CONSTANTS.BD_MAX_REPAIRS_WINDOW) {
            console.warn(`[BD] Circuit breaker: ${bdRepairHistory.length} repairs in the last ${CONSTANTS.BD_REPAIR_WINDOW_MS / 60000}min — halting auto-repair`);
            bdBrokenCount = 0;
            return;
        }

        // Accumulate broken-count threshold
        bdBrokenCount++;
        console.log(`[BD] Broken detected (${bdBrokenCount}/${CONSTANTS.BD_BROKEN_THRESHOLD})`);
        if (bdBrokenCount >= CONSTANTS.BD_BROKEN_THRESHOLD) {
            bdBrokenCount = 0;
            performBDRepair();
        }
    }, interval);
    console.log(`[Solari] BD Auto-Repair Poller started (${interval}ms interval)`);
}

async function performBDRepair() {
    if (isRepairing) return;
    isRepairing = true;
    broadcastBDStatus('repairing');
    console.log('[BD] Starting background repair...');

    try {
        const result = await actualInstallBDLogic();

        if (result.success) {
            console.log('[BD] Background repair successful!');
        } else {
            console.error('[BD] Background repair failed:', result.error);
        }
    } catch (e) {
        console.error('[BD] Uncaught error:', e);
    } finally {
        isRepairing = false;
        const now = Date.now();
        bdRepairCooldownUntil = now + CONSTANTS.BD_REPAIR_COOLDOWN_MS;
        bdRepairHistory.push(now);
        console.log(`[BD] Cooldown active until ${new Date(bdRepairCooldownUntil).toLocaleTimeString()} | Repairs in window: ${bdRepairHistory.length}/${CONSTANTS.BD_MAX_REPAIRS_WINDOW}`);
    }
}

// Logic extracted from plugin:install-bd
async function actualInstallBDLogic() {
    console.log('========== [BD REPAIR LOGIC] START ==========');
    try {
        const appDataPath = app.getPath('appData');
        const bdBasePath = path.join(appDataPath, 'BetterDiscord');
        const bdDataPath = path.join(bdBasePath, 'data');
        const bdAsarPath = path.join(bdDataPath, 'betterdiscord.asar');
        const bdPluginsPath = path.join(bdBasePath, 'plugins');

        for (const p of [bdBasePath, bdDataPath, bdPluginsPath]) {
            if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
        }

        const followRedirectsNative = (url) => {
            return new Promise((resolve, reject) => {
                const request = net.request({
                    url: url,
                    method: 'GET',
                    redirect: 'follow', // Use native redirect following
                    headers: { 'User-Agent': CONSTANTS.APP_USER_AGENT }
                });
                request.on('response', (res) => {
                    if (res.statusCode === 200) resolve(res);
                    else reject(new Error('HTTP Status ' + res.statusCode));
                });
                request.on('error', reject);
                request.end();
            });
        };

        const dlUrl = 'https://github.com/BetterDiscord/BetterDiscord/releases/latest/download/betterdiscord.asar';
        const response = await followRedirectsNative(dlUrl);
        // v1.10 fix: Wrap in try/finally to prevent process.noAsar leak on error
        const prevNoAsar = process.noAsar;
        process.noAsar = true;
        try {
            await new Promise((resolve, reject) => {
                const file = fs.createWriteStream(bdAsarPath);
                response.pipe(file);
                file.on('finish', () => { file.close(); resolve(); });
                file.on('error', reject);
            });
        } finally {
            process.noAsar = prevNoAsar;
        }

        const localAppData = process.env.LOCALAPPDATA;
        const discordBase = path.join(localAppData, 'Discord');
        const appDirs = fs.readdirSync(discordBase).filter(d => d.startsWith('app-')).sort().reverse();
        const latestAppDir = path.join(discordBase, appDirs[0]);
        const coreSubDir = path.join(latestAppDir, 'modules', fs.readdirSync(path.join(latestAppDir, 'modules')).find(d => d.startsWith('discord_desktop_core')), 'discord_desktop_core');
        const injectionTarget = path.join(coreSubDir, 'index.js');

        const { exec, spawn } = require('child_process');
        // Use more robust kill command
        await new Promise((resolve) => exec('taskkill /F /IM Discord.exe /T || powershell -Command "Get-Process Discord -ErrorAction SilentlyContinue | Stop-Process -Force"', () => setTimeout(resolve, 2500)));

        const asarRequirePath = bdAsarPath.replace(/\\/g, '/');
        const hookScript = `require("${asarRequirePath}");\nmodule.exports = require("./core.asar");`;
        fs.writeFileSync(injectionTarget, hookScript, 'utf8');

        const updateExe = path.join(discordBase, 'Update.exe');
        if (fs.existsSync(updateExe)) {
            try {
                const child = spawn(updateExe, ['--processStart', 'Discord.exe'], { detached: true, stdio: 'ignore' });
                child.unref();
                console.log('[BD Repair] Discord restart command spawned');
            } catch (e) {
                console.error('[BD Repair] Failed to spawn Discord restart:', e);
            }
        }
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

ipcMain.handle('plugin:install-bd', async () => {
    return await actualInstallBDLogic();
});

ipcMain.handle('plugin:dir-exists', async () => {
    try {
        const pluginsPath = getBDPluginsPath();
        return fs.existsSync(pluginsPath);
    } catch (e) {
        console.error('[Solari] Error checking plugins directory existence:', e);
        return false;
    }
});

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
    setupPluginWatcher();
    scanAndRegisterDynamicIPCHandlers();
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

    // Modern native Electron downloader with automatic GitLab fallback for GitHub links
    const downloadNative = async (downloadUrl) => {
        console.log(`[Solari] Downloading: ${downloadUrl}`);
        return new Promise((resolve) => {
            const request = net.request({
                url: downloadUrl,
                method: 'GET',
                redirect: 'follow', // Handles redirects automatically
                headers: {
                    'User-Agent': `Mozilla/5.0 (${CONSTANTS.APP_USER_AGENT}; Windows 10)`,
                    'Accept': '*/*'
                }
            });

            request.on('response', (response) => {
                if (response.statusCode !== 200) {
                    console.error(`[Solari] Download failed with HTTP Status ${response.statusCode}`);
                    return resolve({ success: false, statusCode: response.statusCode });
                }

                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    const content = buffer.toString('utf8');

                    // Validate BetterDiscord META block
                    const trimmed = content.trimStart();
                    if (!trimmed.startsWith('/**')) {
                        console.error('[Solari] Invalid content (no META block)');
                        return resolve({ success: false, error: 'Invalid file Header' });
                    }

                    try {
                        fs.writeFileSync(filePath, buffer);
                        console.log('[Solari] Plugin downloaded successfully');
                        resolve({ success: true });
                    } catch (err) {
                        resolve({ success: false, error: err.message });
                    }
                });
            });

            request.on('error', (err) => {
                console.error('[Solari] Network error:', err.message);
                resolve({ success: false, error: err.message });
            });

            request.end();
        });
    };

    // Primary download attempt
    let result = await downloadNative(url);

    // AUTOMATIC FALLBACK: If GitHub fails (suspended) or returns 404, try GitLab Mirror
    if (!result.success && (url.includes('github') || result.statusCode === 404)) {
        console.warn('[Solari] Primary download failed. Attempting GitLab Fallback...');

        // Transform the URL to a GitLab Raw URL (Assuming mirror structure matches)
        // From: https://raw.githubusercontent.com/TheDroidBR/Solari/main/plugins/SpotifySync.plugin.js
        // To: https://gitlab.com/TheDroidBR/solari/-/raw/main/plugins/SpotifySync.plugin.js
        const gitlabUrl = url.replace('raw.githubusercontent.com/TheDroidBR/Solari', 'gitlab.com/TheDroidBR/solari/-/raw');

        console.log(`[Solari] Fallback URL: ${gitlabUrl}`);
        result = await downloadNative(gitlabUrl);
    }

    return result;
});

// Get installed plugin version by reading META header
ipcMain.handle('plugin:get-version', async (event, fileName) => {
    try {
        const pluginsPath = getBDPluginsPath();
        const filePath = path.join(pluginsPath, fileName);
        if (!fs.existsSync(filePath)) return null;

        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(/@version\s+(\S+)/);
        return match ? match[1] : null;
    } catch (e) {
        console.error('[Solari] Error reading plugin version:', e);
        return null;
    }
});

// Get remote plugin version by fetching first chunk of the file
ipcMain.handle('plugin:get-remote-version', async (event, url) => {
    if (!url) return null;

    const fetchVersionNative = async (fetchUrl) => {
        return new Promise((resolve) => {
            const request = net.request({
                url: fetchUrl,
                method: 'GET',
                redirect: 'follow',
                headers: {
                    'User-Agent': `Mozilla/5.0 (${CONSTANTS.APP_USER_AGENT}; Windows 10)`,
                    'Accept': '*/*',
                    'Range': 'bytes=0-4096' // Fetch first 4KB for version metadata
                }
            });

            request.on('response', (response) => {
                if (response.statusCode !== 200 && response.statusCode !== 206) {
                    return resolve(null);
                }

                let buffer = '';
                response.on('data', (chunk) => {
                    buffer += chunk.toString('utf8');
                    // Look for @version in the metadata block
                    const match = buffer.match(/@version\s+([^\s\n\r]+)/);
                    if (match) {
                        request.abort();
                        resolve(match[1]);
                    }
                });

                response.on('end', () => {
                    const match = buffer.match(/@version\s+([^\s\n\r]+)/);
                    resolve(match ? match[1] : null);
                });
            });

            request.on('error', () => resolve(null));
            request.end();
        });
    };

    let version = await fetchVersionNative(url);

    // AUTOMATIC FALLBACK: If GitHub fails/404s, try the GitLab Mirror
    if (!version && url.includes('github')) {
        console.log('[Solari] Version check on GitHub failed. Trying GitLab mirror...');
        const gitlabUrl = url.replace('raw.githubusercontent.com/TheDroidBR/Solari', 'gitlab.com/TheDroidBR/solari/-/raw');
        version = await fetchVersionNative(gitlabUrl);
    }

    return version;
});

// Delete a plugin file from BD plugins folder
ipcMain.handle('plugin:delete', async (event, fileName) => {
    try {
        const pluginsPath = getBDPluginsPath();
        const filePath = path.join(pluginsPath, fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[Solari] Plugin deleted: ${fileName}`);
            return { success: true };
        }
        return { success: false, error: 'File not found' };
    } catch (e) {
        console.error('[Solari] Error deleting plugin:', e);
        return { success: false, error: e.message };
    }
});


// ===== HARDWARE SYSTEM MONITOR (delegated to managers/hwMonitor.js) =====
// HWMonitor is initialized in app.whenReady() after managers are set up.
// These thin wrappers keep backward-compat for any remaining call sites.
function startHWMonitor() { HWMonitor.startHWMonitor(); }
function stopHWMonitor() { HWMonitor.stopHWMonitor(); }
function formatHWStatsForRPC() { return HWMonitor.getFormattedForRPC(); }

function handleMainWindowVisibilityChange() {
    if (CONSTANTS.DEBUG_MODE) {
        console.log(`[Solari] Main window visibility changed. Visible: ${global.isMainWindowVisible}`);
    }
    // Re-evaluate Hardware Monitor polling frequency
    startHWMonitor();
}



// Lightweight CPU usage calculation using built-in OS module (zero external process cost)
function getCpuUsage() {
    const cpus = os.cpus();
    if (!cpus || cpus.length === 0) return 0;

    let totalIdle = 0;
    let totalTick = 0;

    for (let currentCpu of cpus) {
        for (let type in currentCpu.times) {
            totalTick += currentCpu.times[type];
        }
        totalIdle += currentCpu.times.idle;
    }

    let usage = 0;
    if (lastCpuInfo) {
        const idleDifference = totalIdle - lastCpuInfo.idle;
        const totalDifference = totalTick - lastCpuInfo.total;
        usage = 100 - ~~(100 * idleDifference / totalDifference);
    }

    lastCpuInfo = { idle: totalIdle, total: totalTick };
    return Math.max(0, Math.min(100, usage));
}

// Lightweight GPU check (only works for NVIDIA, but doesn't spawn expensive PowerShell)
async function getGpuUsage() {
    return new Promise((resolve) => {
        // Use nvidia-smi if available (fastest C++ utility), otherwise return null
        activeNvidiaSmiProcess = exec('nvidia-smi --query-gpu=utilization.gpu,temperature.gpu,memory.used,memory.total --format=csv,noheader,nounits',
            { timeout: 1000, windowsHide: true },
            (error, stdout) => {
                activeNvidiaSmiProcess = null;
                if (error || !stdout) {
                    resolve(null);
                    return;
                }
                try {
                    const parts = stdout.trim().split(',');
                    if (parts.length >= 4) {
                        resolve({
                            name: 'NVIDIA GPU',
                            usage: parseInt(parts[0].trim(), 10) || 0,
                            temp: parseInt(parts[1].trim(), 10) || 0,
                            vramUsedMB: parseInt(parts[2].trim(), 10) || 0,
                            vramTotalMB: parseInt(parts[3].trim(), 10) || 0
                        });
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
    });
}



// Global cached GPU data to avoid launching processes too often
let cachedGpuStats = null;
let lastGpuPoll = 0;
let lastHwRpcUpdate = 0;
let lastHwRpcString = '';

async function pollHardwareStats() {
    try {
        const results = {};

        // CPU: Virtually zero-cost
        if (hwMonitorSettings.showCPU) {
            results.cpu = {
                usage: getCpuUsage(),
                cores: os.cpus() ? os.cpus().length : 0
            };
        }

        // RAM: Virtually zero-cost
        if (hwMonitorSettings.showRAM) {
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            results.ram = {
                usedGB: Math.round((usedMem / 1073741824) * 10) / 10,  // bytes -> GB, 1 decimal
                totalGB: Math.round((totalMem / 1073741824) * 10) / 10,
                usagePercent: Math.round((usedMem / totalMem) * 1000) / 10
            };
        }

        // GPU: Poll only every 6 seconds to save CPU, while CPU/RAM update every 2-3s
        if (hwMonitorSettings.showGPU) {
            if (hwGpuAvailable === false) {
                results.gpu = null;
            } else {
                const now = Date.now();
                if (!cachedGpuStats || (now - lastGpuPoll) > 6000) {
                    const gpuResult = await getGpuUsage();
                    if (gpuResult) {
                        hwGpuAvailable = true;
                        cachedGpuStats = gpuResult;
                    } else {
                        // If it fails once, maybe no NVIDIA driver. We'll disable it to prevent spamming process spawning.
                        hwGpuAvailable = false;
                        cachedGpuStats = null;
                    }
                    lastGpuPoll = now;
                }
                results.gpu = cachedGpuStats;
            }
        }

        latestHwStats = results;

        // Send to renderer for live UI
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('hw-stats-update', results);
        }

        // Trigger Discord RPC update if enabled and throttled (max once every HW_RPC_THROTTLE_MS)
        if (rpcConnected && hwMonitorEnabled && isEnabled) {
            const now = Date.now();
            if (now - lastHwRpcUpdate > CONSTANTS.HW_RPC_THROTTLE_MS) {
                const currentHwString = formatHWStatsForRPC();
                if (currentHwString && currentHwString !== lastHwRpcString) {
                    lastHwRpcString = currentHwString;
                    lastHwRpcUpdate = now;
                    updatePresence();
                }
            }
        }

    } catch (e) {
        console.error('[HW Monitor] Poll error:', e.message);
    }
}

function startHWMonitor() {
    if (hwMonitorInterval) return; // Already running
    if (!hwMonitorEnabled) return;

    // We will poll every 2 seconds for CPU/RAM which is virtually zero-cost
    const interval = hwMonitorSettings.intervalMs || 2000;
    console.log('[HW Monitor] Starting lightweight polling every', interval, 'ms');

    // Warm up CPU counters
    getCpuUsage();

    // First poll immediately
    setTimeout(pollHardwareStats, 500);
    hwMonitorInterval = setInterval(pollHardwareStats, interval);
}

function stopHWMonitor() {
    if (hwMonitorInterval) {
        clearInterval(hwMonitorInterval);
        hwMonitorInterval = null;
        latestHwStats = null;
        if (activeNvidiaSmiProcess) {
            try { activeNvidiaSmiProcess.kill(); } catch (e) { }
            activeNvidiaSmiProcess = null;
        }
        console.log('[HW Monitor] Stopped');
    }
}

function formatHWStatsForRPC() {
    if (!latestHwStats) return null;
    const parts = [];

    const showCPU = hwMonitorSettings.showCPU !== false;
    const showRAM = hwMonitorSettings.showRAM !== false;
    const showGPU = hwMonitorSettings.showGPU !== false;

    const showGPUTemp = hwMonitorSettings.showGPUTemp !== false;

    if (latestHwStats.cpu && showCPU) {
        let str = `CPU: ${latestHwStats.cpu.usage}%`;
        parts.push(str);
    }
    if (latestHwStats.ram && showRAM) {
        parts.push(`RAM: ${latestHwStats.ram.usedGB}/${latestHwStats.ram.totalGB}GB`);
    }
    if (latestHwStats.gpu && showGPU) {
        // Only show GPU if we have any valid data to prevent "GPU: N/A" spam
        const hasTemp = showGPUTemp && latestHwStats.gpu.temp !== null;

        if (latestHwStats.gpu.usage !== null || hasTemp) {
            let str = `GPU:`;
            if (latestHwStats.gpu.usage !== null) str += ` ${latestHwStats.gpu.usage}%`;
            if (hasTemp) str += `${latestHwStats.gpu.usage !== null ? '' : ' '}(${latestHwStats.gpu.temp}°C)`;
            parts.push(str.trim());
        }
    }

    return parts.length > 0 ? parts.join(' | ') : null;
}


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
                            // v1.10 fix: Require 'CABLE' specifically (not generic 'cable')
                            // to avoid false positives from 'HDMI Audio Cable' etc.
                            d.Name.includes('CABLE Input') ||
                            d.Name.includes('CABLE Output') ||
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

ipcMain.handle('soundboard:duplicate-sound', async (event, soundId) => {
    try {
        if (!soundBoard) throw new Error('SoundBoard not initialized');
        const newSound = soundBoard.duplicateSound(soundId);
        if (newSound) saveData();
        return { success: !!newSound, sound: newSound };
    } catch (e) {
        console.error('[SoundBoard IPC] Error duplicating sound:', e);
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

        const url = `${soundServer.getBaseUrl()}/sounds/${soundId}?token=${soundboardToken}`;
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
    if (CONSTANTS.DEBUG_MODE) console.log('[SoundBoard IPC] stop-all invoked');
    try {
        if (wss) {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'soundboard:stop-all'
                    }));
                }
            });
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
    if (!WebSocket || typeof WebSocket.Server === 'undefined') {
        WebSocket = require('ws');
    }
    wss = new WebSocket.Server({ host: CONSTANTS.WS_HOST, port: CONSTANTS.WS_PORT });

    // Track the browser extension's WebSocket for disconnect safety net
    extensionWsId = null;
    extensionVersion = '0.0.0';
    let extensionDisconnectTimeout = null;

    // Periodically ping the extension every 1 second to keep its MV3 service worker alive
    if (extensionPingInterval) clearInterval(extensionPingInterval);
    extensionPingInterval = setInterval(() => {
        connectedPlugins.forEach((plugin) => {
            if (plugin.name === 'Solari Extension') {
                if (plugin.ws && plugin.ws.readyState === 1) { // 1 = OPEN
                    try {
                        plugin.ws.send(JSON.stringify({
                            type: 'control_extension',
                            action: 'ping'
                        }));
                    } catch (e) {
                        // Fail silently
                    }
                }
            }
        });
    }, 1000);

    wss.on('connection', (ws) => {
        const wsId = `ws_${Date.now()}`;
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);

                // P2-OPT-02: Guard verbose WSS log with DEBUG_MODE
                if (CONSTANTS.DEBUG_MODE) console.log('[Solari WSS] Received message type:', data.type, '| Content:', JSON.stringify(data).substring(0, 200));

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

                        // Track browser extension connection for disconnect safety net
                        if (pluginName === 'Solari Extension') {
                            extensionWsId = wsId;
                            extensionVersion = data.version || '0.0.0';
                            console.log('[Solari WSS] Browser extension connected (wsId:', wsId, ', version:', extensionVersion, ')');

                            if (!appSettings.extensionEverUsed) {
                                appSettings.extensionEverUsed = true;
                                saveData();
                            }

                            // Notify renderer
                            if (mainWindow && !mainWindow.isDestroyed()) {
                                mainWindow.webContents.send('extension-connected-event');
                            }

                            // Cancel any pending disconnect clear (extension reconnected in time)
                            if (extensionDisconnectTimeout) {
                                clearTimeout(extensionDisconnectTimeout);
                                extensionDisconnectTimeout = null;
                                console.log('[Solari WSS] Extension reconnected — cancelled pending RPC clear');
                            }
                        }

                        // Track SolariManager for BD runtime confirmation
                        if (pluginName === 'SolariManager') {
                            solariManagerWsId = wsId;
                            lastBDHeartbeat = Date.now();
                            ws.isSolariManager = true;
                            console.log('[Solari WSS] SolariManager connected — BD runtime confirmed');
                            // Emit active status to renderer
                            if (mainWindow && !mainWindow.isDestroyed()) {
                                mainWindow.webContents.send('bd-runtime-status', {
                                    active: true,
                                    bdVersion: data.bdVersion,
                                    discordRunning: true
                                });
                            }
                        }

                        broadcastPluginList();
                        break;

                    case 'heartbeat':
                        if (data.source === 'SolariManager') {
                            lastBDHeartbeat = Date.now();
                            if (CONSTANTS.DEBUG_MODE) console.log('[Solari WSS] SolariManager heartbeat received');
                        }
                        break;

                    case 'plugins_list':
                        if (data.source === 'SolariManager' || ws.isSolariManager) {
                            cachedBDPlugins = data.plugins || [];
                            if (mainWindow && !mainWindow.isDestroyed()) {
                                mainWindow.webContents.send('bd-plugins-update', cachedBDPlugins);
                            }
                            console.log(`[Solari WSS] SolariManager reported ${cachedBDPlugins.length} BD plugins`);

                            // v1.11.1: Update Telemetry with all Solari plugins and their status
                            if (telemetry) {
                                const solariKeywords = ['solari', 'smartafk', 'spotifysync', 'messagetools'];
                                const pluginStates = cachedBDPlugins
                                    .filter(p => p.name && solariKeywords.some(kw => p.name.toLowerCase().includes(kw)))
                                    .map(p => {
                                        let name = p.name.replace(/\.plugin\.js$/i, '').replace(/detector$/i, '').trim();
                                        if (name.toLowerCase() === 'solarimanager') name = 'Manager';

                                        let ver = p.version || '';
                                        if (!ver) {
                                            try {
                                                const pluginsPath = getBDPluginsPath();
                                                const filePath = path.join(pluginsPath, p.name);
                                                if (fs.existsSync(filePath)) {
                                                    const content = fs.readFileSync(filePath, 'utf8');
                                                    const match = content.match(/@version\s+(\S+)/);
                                                    if (match) ver = match[1];
                                                }
                                            } catch (e) { }
                                        }
                                        if (!ver) ver = '0.0.0';

                                        return `${name}:${p.enabled ? '1' : '0'}:${ver}`;
                                    });
                                telemetry.setActivePlugins(pluginStates);
                            }
                        }
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

                    case 'notes_config_sync':
                        // Forward notes config and schema to renderer
                        if (mainWindow) {
                            mainWindow.webContents.send('notes-data-loaded', { settings: data.config, schema: data.schema });
                            // Notify UI that plugin is connected
                            mainWindow.webContents.send('notes-status-update', { connected: true });
                        }
                        break;

                    case 'setActivity':
                        const plugin = connectedPlugins.get(wsId);
                        if (plugin && blockedPlugins.has(plugin.name)) return;

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

                    case 'extension_status':
                        if (!data.sessionStats) {
                            data.sessionStats = {};
                        }
                        data.sessionStats.platformTime = {
                            youtube: extensionStats.youtube || 0,
                            youtubemusic: extensionStats.youtubemusic || 0,
                            netflix: extensionStats.netflix || 0,
                            twitch: extensionStats.twitch || 0,
                            primevideo: extensionStats.primevideo || 0
                        };
                        data.sessionStats.currentPlatform = (presenceSources.browserExtension.active && presenceSources.browserExtension.platform)
                            ? presenceSources.browserExtension.platform
                            : null;

                        // Forward browser extension status to desktop UI
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            data.version = extensionVersion;
                            mainWindow.webContents.send('extension-status-update', data);
                        }
                        break;

                    // ===== SOLARI NOTES BACKEND =====
                    case 'notes_request':
                        try {
                            const notesPath = path.join(app.getPath('userData'), 'solari_notes.json');
                            let content = "";
                            if (fs.existsSync(notesPath)) {
                                const fileData = JSON.parse(fs.readFileSync(notesPath, 'utf8'));
                                content = fileData.content || "";
                            }
                            ws.send(JSON.stringify({ type: 'notes_sync', content: content }));
                            if (CONSTANTS.DEBUG_MODE) console.log('[Solari WSS] Sent notes data to SolariNotes plugin');
                        } catch (err) {
                            console.error('[Solari WSS] Error reading notes:', err);
                        }
                        break;

                    case 'notes_update':
                        try {
                            const notesPath = path.join(app.getPath('userData'), 'solari_notes.json');
                            fs.writeFileSync(notesPath, JSON.stringify({
                                content: data.content,
                                lastUpdated: new Date().toISOString()
                            }), 'utf8');
                            if (CONSTANTS.DEBUG_MODE) console.log('[Solari WSS] Saved notes from SolariNotes plugin');
                        } catch (err) {
                            console.error('[Solari WSS] Error saving notes:', err);
                        }
                        break;
                    case 'experiment_data':
                        console.log('\n================ EXPERIMENTAL GAME TRACKER DATA ================');
                        console.log('Timestamp:', new Date().toLocaleTimeString());
                        console.log('Local Games:', JSON.stringify(data.data.localGames, null, 2));
                        console.log('My Activities:', JSON.stringify(data.data.myActivities, null, 2));
                        console.log('================================================================\n');
                        break;
                    // ================================
                }
            } catch (error) { console.error('Message parse error:', error); }
        });
        ws.on('close', () => {
            const disconnectedPlugin = connectedPlugins.get(wsId);
            console.log('[Solari WSS] WebSocket closed for:', disconnectedPlugin?.name || wsId);
            connectedPlugins.delete(wsId);

            // SAFETY NET: If the browser extension disconnected, clear its presence after timeout
            if (wsId === extensionWsId) {
                console.log(`[Solari WSS] Browser extension disconnected — will clear RPC in ${CONSTANTS.EXTENSION_DISCONNECT_TIMEOUT_MS}ms if no reconnection...`);
                extensionWsId = null;

                // Notify renderer immediately of extension disconnect
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('extension-disconnected-event');
                }

                extensionDisconnectTimeout = setTimeout(() => {
                    extensionDisconnectTimeout = null;
                    // Only clear if extension hasn't reconnected (extensionWsId would be set again)
                    if (extensionWsId === null && presenceSources.browserExtension.active) {
                        console.log('[Solari WSS] Extension did not reconnect — clearing browser extension presence');
                        presenceSources.browserExtension.active = false;
                        presenceSources.browserExtension.data = null;
                        presenceSources.browserExtension.platform = null;
                        if (presenceSources.browserExtension.clearTimeout) {
                            clearTimeout(presenceSources.browserExtension.clearTimeout);
                            presenceSources.browserExtension.clearTimeout = null;
                        }
                        presenceSources.browserExtension.clientId = null;
                        presenceSources.browserExtension.presetName = null;
                        presenceSources.browserExtension.timestamp = 0;
                        updatePresence();

                        // Notify renderer
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.webContents.send('ws-status', { type: 'extensionDisconnected' });
                        }
                    }
                }, CONSTANTS.EXTENSION_DISCONNECT_TIMEOUT_MS);
            }

            // SAFETY NET: If SolariManager disconnected, revert to 'inactive' after short grace period
            if (wsId === solariManagerWsId) {
                console.log('[Solari WSS] SolariManager disconnected — reverting status shortly');
                solariManagerWsId = null;
                setTimeout(async () => {
                    // Only revert if still not reconnected
                    if (solariManagerWsId === null) {
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            const discordRunning = await isDiscordRunning();
                            mainWindow.webContents.send('bd-runtime-status', {
                                active: false,
                                discordRunning: discordRunning
                            });
                        }
                    }
                }, 3000); // 3 seconds grace period (same as browser extension)
            }

            broadcastPluginList();
        });
        ws.on('error', (err) => {
            console.error('[Solari WSS] WebSocket client connection error:', err.message); // Handle connection errors (Bug 15)
        });
    });
}

// ===== SOLARIMANAGER IPC HANDLERS =====

ipcMain.handle('bd:get-runtime-status', async () => {
    const isConnected = !!solariManagerWsId;
    const discordRunning = isConnected ? true : await isDiscordRunning();
    return {
        active: isConnected,
        discordRunning: discordRunning
    };
});

ipcMain.handle('bd:toggle-plugin', async (event, { pluginName, enabled }) => {
    // Find the SolariManager client and forward the toggle command
    for (const [id, plugin] of connectedPlugins.entries()) {
        if (plugin.name === 'SolariManager' && plugin.ws && plugin.ws.readyState === 1 /* OPEN */) {
            try {
                plugin.ws.send(JSON.stringify({ type: 'plugin:toggle', pluginName, enabled }));
                console.log(`[BD Toggle] Sent toggle ${pluginName} = ${enabled}`);
                return { success: true };
            } catch (e) {
                console.error('[BD Toggle] Send error:', e);
                return { success: false, error: e.message };
            }
        }
    }
    return { success: false, error: 'SolariManager not connected' };
});

ipcMain.handle('bd:get-plugins', async () => {
    setupPluginWatcher();
    scanAndRegisterDynamicIPCHandlers();
    // Request fresh list from SolariManager if connected, else return cache
    for (const [id, plugin] of connectedPlugins.entries()) {
        if (plugin.name === 'SolariManager' && plugin.ws && plugin.ws.readyState === 1) {
            try {
                plugin.ws.send(JSON.stringify({ type: 'plugin:get_list' }));
            } catch (e) { /* ignore */ }
        }
    }
    return cachedBDPlugins;
});


function openAutoDetectSettings() {
    autoDetectWindow = WindowManager.createAutoDetectWindow(); // Delegate window creation (Bug 17)
}

function startAutoDetection() {
    if (autoDetectInterval) return;

    console.log('[Solari] Starting auto-detection...');
    autoDetectInterval = setInterval(() => checkRunningProcesses(false), CONSTANTS.PROCESS_CHECK_INTERVAL_MS);
    checkRunningProcesses(true); // Run immediately with isFirstCheck=true
}

function stopAutoDetection() {
    if (autoDetectInterval) {
        clearInterval(autoDetectInterval);
        autoDetectInterval = null;
        currentDetectedProcess = null;
        currentDetectedWebsite = null;
        // v1.10 fix: Reset fail counter so it doesn't carry over on next toggle
        websiteCheckFailCount = 0;
        if (activeTasklistProcess) {
            try { activeTasklistProcess.kill(); } catch (e) { }
            activeTasklistProcess = null;
        }
        // v1.12.0: Also clear the presence source state and notify renderer
        presenceSources.autoDetect.active = false;
        presenceSources.autoDetect.data = null;
        presenceSources.autoDetect.source = null;
        presenceSources.autoDetect.presetName = null;
        broadcastAutoDetectState();

        // CRITICAL FIX: Trigger updatePresence to clear the activity from Discord instantly
        updatePresence();

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

        activeTasklistProcess = exec('tasklist /FO CSV /NH', { encoding: 'utf8', timeout: 5000, maxBuffer: CONSTANTS.EXEC_MAX_BUFFER }, (error, stdout, stderr) => {
            activeTasklistProcess = null;
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

            const lines = stdout.replace(/\r/g, '').split('\n');
            const runningProcesses = lines.map(line => {
                const parts = line.split('","');
                return parts[0] ? parts[0].replace(/"/g, '').toLowerCase().trim() : '';
            }).filter(Boolean); // Parse executable names correctly (Bug 16)

            let foundProcess = false;

            // Check each mapping
            for (const mapping of autoDetectMappings) {
                const processName = mapping.processName.toLowerCase().trim();
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
                                detailsUrl: preset.detailsUrl || undefined,
                                state: preset.state || undefined, // Don't fallback to preset name
                                stateUrl: preset.stateUrl || undefined,
                                largeImageKey: preset.largeImageKey,
                                largeImageText: preset.largeImageText,
                                largeImageLink: preset.largeImageLink || undefined,
                                smallImageKey: preset.smallImageKey,
                                smallImageText: preset.smallImageText,
                                smallImageLink: preset.smallImageLink || undefined,
                                buttons: buttons.length > 0 ? buttons : undefined,
                                partyCurrent: preset.partyCurrent > 0 ? preset.partyCurrent : undefined,
                                partyMax: preset.partyMax > 0 ? preset.partyMax : undefined,
                                timestampMode: preset.timestampMode || 'normal',
                                customTimestamp: preset.customTimestamp || null,
                                useEndTimestamp: preset.useEndTimestamp || false,
                                clientId: finalClientId // Use resolved ID
                            };

                            // Update autoDetect source
                            presenceSources.autoDetect.active = true;
                            presenceSources.autoDetect.data = activity;
                            presenceSources.autoDetect.source = 'process';
                            presenceSources.autoDetect.clientId = finalClientId;
                            presenceSources.autoDetect.presetName = preset.name;
                            broadcastAutoDetectState();

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
                        broadcastAutoDetectState();

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
            broadcastAutoDetectState();
        }
        return;
    }

    if (isBrowserCheckRunning || Date.now() < processCheckBackoffUntil) return;

    // v1.11.1: Optimized - tasklist /V is much lighter than powershell
    const tasklistCommand = `tasklist /V /FI "STATUS eq running" /FO CSV /NH | findstr /I "brave chrome firefox msedge opera"`;
    isBrowserCheckRunning = true;

    exec(tasklistCommand, { encoding: 'utf8', timeout: 5000, maxBuffer: CONSTANTS.EXEC_MAX_BUFFER }, (error, stdout, stderr) => {
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
                        detailsUrl: preset.detailsUrl || undefined,
                        state: preset.state || undefined, // Don't fallback to keyword
                        stateUrl: preset.stateUrl || undefined,
                        largeImageKey: preset.largeImageKey,
                        largeImageText: preset.largeImageText,
                        largeImageLink: preset.largeImageLink || undefined,
                        smallImageKey: preset.smallImageKey,
                        smallImageText: preset.smallImageText,
                        smallImageLink: preset.smallImageLink || undefined,
                        buttons: buttons.length > 0 ? buttons : undefined,
                        partyCurrent: preset.partyCurrent > 0 ? preset.partyCurrent : undefined,
                        partyMax: preset.partyMax > 0 ? preset.partyMax : undefined,
                        timestampMode: preset.timestampMode || 'normal',
                        customTimestamp: preset.customTimestamp || null,
                        useEndTimestamp: preset.useEndTimestamp || false,
                        clientId: preset.clientId
                    };

                    presenceSources.autoDetect.active = true;
                    presenceSources.autoDetect.data = activity;
                    presenceSources.autoDetect.source = 'website';
                    presenceSources.autoDetect.clientId = preset.clientId;
                    presenceSources.autoDetect.presetName = preset.name;
                    broadcastAutoDetectState();

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
            // Wait for consecutive failures before clearing (v1.10: uses constant)
            if (websiteCheckFailCount < CONSTANTS.WEBSITE_FAIL_THRESHOLD) {
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
                broadcastAutoDetectState();

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

function parseTimeToSeconds(str) {
    if (!str) return 0;
    str = String(str).trim();
    if (!str) return 0;

    if (/^\d+$/.test(str)) {
        return parseInt(str, 10);
    }

    const parts = str.split(':');
    if (parts.length === 2) {
        const min = parseInt(parts[0], 10) || 0;
        const sec = parseInt(parts[1], 10) || 0;
        return (min * 60) + sec;
    } else if (parts.length === 3) {
        const hr = parseInt(parts[0], 10) || 0;
        const min = parseInt(parts[1], 10) || 0;
        const sec = parseInt(parts[2], 10) || 0;
        return (hr * 3600) + (min * 60) + sec;
    }
    return 0;
}

function loadPresetActivity(preset, isManual = false) {
    // v1.10 fix: Guard against undefined/null preset
    if (!preset) {
        console.warn('[Solari] loadPresetActivity called with null/undefined preset — ignoring');
        return;
    }

    // Resolve Client ID from Identity (Bug 19)
    let finalClientId = preset.clientId;
    if (!finalClientId && preset.identityId && identities) {
        const identity = identities.find(i => i.id === preset.identityId);
        if (identity) finalClientId = identity.clientId;
    }
    if (!finalClientId && identities) {
        const idName = identities.find(i => i.name && i.name.toLowerCase() === preset.name.toLowerCase());
        if (idName) finalClientId = idName.clientId;
    }

    if (CONSTANTS.DEBUG_MODE) console.log(`[Solari] Loading preset "${preset.name}" with Client ID: ${finalClientId}`);
    // Build buttons array
    const buttons = [];
    if (preset.button1Label && preset.button1Url) {
        buttons.push({ label: preset.button1Label, url: preset.button1Url });
    }
    if (preset.button2Label && preset.button2Url) {
        buttons.push({ label: preset.button2Label, url: preset.button2Url });
    }

    let startTimestamp = undefined;
    let endTimestamp = undefined;
    if (preset.useProgressBar) {
        const currentSecs = parseTimeToSeconds(preset.progressCurrent);
        const totalSecs = parseTimeToSeconds(preset.progressTotal);
        if (totalSecs > 0) {
            const now = Date.now();
            startTimestamp = now - (currentSecs * 1000);
            endTimestamp = startTimestamp + (totalSecs * 1000);
        }
    }

    const activity = {
        type: preset.type || 0,
        details: preset.details || undefined,
        detailsUrl: preset.detailsUrl || undefined,
        state: preset.state || undefined,
        stateUrl: preset.stateUrl || undefined,
        largeImageKey: preset.largeImageKey || undefined,
        largeImageText: preset.largeImageText || undefined,
        largeImageLink: preset.largeImageLink || undefined,
        smallImageKey: preset.smallImageKey || undefined,
        smallImageText: preset.smallImageText || undefined,
        smallImageLink: preset.smallImageLink || undefined,
        buttons: buttons.length > 0 ? buttons : undefined,
        partyCurrent: preset.partyCurrent > 0 ? preset.partyCurrent : undefined,
        partyMax: preset.partyMax > 0 ? preset.partyMax : undefined,
        timestampMode: preset.timestampMode || 'normal',
        customTimestamp: preset.customTimestamp || null,
        useEndTimestamp: preset.useEndTimestamp || false,
        useProgressBar: preset.useProgressBar || false,
        progressCurrent: preset.progressCurrent || '',
        progressTotal: preset.progressTotal || '',
        startTimestamp: startTimestamp,
        endTimestamp: endTimestamp,
        instance: false,
        clientId: finalClientId // Include Client ID for auto-detect switching
    };

    // If Manual Mode (Tray), update state listeners
    if (isManual) {
        presenceSources.manualPreset.active = true;
        presenceSources.manualPreset.data = activity;
        presenceSources.manualPreset.clientId = finalClientId;
        presenceSources.manualPreset.presetName = preset.name;
        if (mainWindow) mainWindow.webContents.send('manual-mode-changed', true);
    }

    setActivity(activity, finalClientId); // Pass clientId explicitly 2nd arg
}

function refreshActivePresetPresence(presetName, updatedPreset) {
    if (!updatedPreset) return;

    let presenceChanged = false;

    // 1. Resolve final Client ID
    let finalClientId = updatedPreset.clientId;
    if (!finalClientId && updatedPreset.identityId && identities) {
        const identity = identities.find(i => i.id === updatedPreset.identityId);
        if (identity) finalClientId = identity.clientId;
    }
    if (!finalClientId && identities) {
        const idName = identities.find(i => i.name && i.name.toLowerCase() === updatedPreset.name.toLowerCase());
        if (idName) finalClientId = idName.clientId;
    }

    // Build buttons
    const buttons = [];
    if (updatedPreset.button1Label && updatedPreset.button1Url) {
        buttons.push({ label: updatedPreset.button1Label, url: updatedPreset.button1Url });
    }
    if (updatedPreset.button2Label && updatedPreset.button2Url) {
        buttons.push({ label: updatedPreset.button2Label, url: updatedPreset.button2Url });
    }

    let startTimestamp = undefined;
    let endTimestamp = undefined;
    if (updatedPreset.useProgressBar) {
        const currentSecs = parseTimeToSeconds(updatedPreset.progressCurrent);
        const totalSecs = parseTimeToSeconds(updatedPreset.progressTotal);
        if (totalSecs > 0) {
            const now = Date.now();
            startTimestamp = now - (currentSecs * 1000);
            endTimestamp = startTimestamp + (totalSecs * 1000);
        }
    }

    const activity = {
        type: updatedPreset.type || 0,
        details: updatedPreset.details || undefined,
        detailsUrl: updatedPreset.detailsUrl || undefined,
        state: updatedPreset.state || undefined,
        stateUrl: updatedPreset.stateUrl || undefined,
        largeImageKey: updatedPreset.largeImageKey || undefined,
        largeImageText: updatedPreset.largeImageText || undefined,
        largeImageLink: updatedPreset.largeImageLink || undefined,
        smallImageKey: updatedPreset.smallImageKey || undefined,
        smallImageText: updatedPreset.smallImageText || undefined,
        smallImageLink: updatedPreset.smallImageLink || undefined,
        buttons: buttons.length > 0 ? buttons : undefined,
        partyCurrent: updatedPreset.partyCurrent > 0 ? updatedPreset.partyCurrent : undefined,
        partyMax: updatedPreset.partyMax > 0 ? updatedPreset.partyMax : undefined,
        timestampMode: updatedPreset.timestampMode || 'normal',
        customTimestamp: updatedPreset.customTimestamp || null,
        useEndTimestamp: updatedPreset.useEndTimestamp || false,
        useProgressBar: updatedPreset.useProgressBar || false,
        progressCurrent: updatedPreset.progressCurrent || '',
        progressTotal: updatedPreset.progressTotal || '',
        startTimestamp: startTimestamp,
        endTimestamp: endTimestamp,
        clientId: finalClientId
    };

    // 2. Check manualPreset
    if (presenceSources.manualPreset.active && presenceSources.manualPreset.presetName === presetName) {
        presenceSources.manualPreset.data = activity;
        presenceSources.manualPreset.clientId = finalClientId;
        presenceSources.manualPreset.presetName = updatedPreset.name;
        presenceChanged = true;
    }

    // 3. Check autoDetect
    if (presenceSources.autoDetect.active && presenceSources.autoDetect.presetName === presetName) {
        presenceSources.autoDetect.data = activity;
        presenceSources.autoDetect.clientId = finalClientId;
        presenceSources.autoDetect.presetName = updatedPreset.name;
        presenceChanged = true;
    }

    if (presenceChanged) {
        console.log(`[Solari] Active preset "${presetName}" was updated. Refreshing RPC presence silently.`);
        updatePresence();
    }
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
        broadcastAutoDetectState();
    }
    // If switching to autoDetect mode, clear any existing extension state
    if (!useExtension && presenceSources.browserExtension.active) {
        presenceSources.browserExtension.active = false;
        presenceSources.browserExtension.data = null;
        presenceSources.browserExtension.platform = null;
    }
    updatePresence();
});

ipcMain.handle('get-client-id', () => clientId);

ipcMain.on('set-client-id', async (event, newClientId) => {
    const labels = getLabels();
    clientId = newClientId;
    saveData();
    console.log('[Solari] Client ID updated to:', newClientId);
    
    // Switch RPC connection immediately!
    switchRpcClient(newClientId).catch(err => {
        console.error('[Solari] Error switching RPC Client ID on set-client-id:', err.message);
    });

    const displayId = (newClientId && newClientId.length >= 5) 
        ? '*'.repeat(newClientId.length - 5) + newClientId.slice(-5) 
        : (newClientId || '');
    await showRendererDialog({
        type: 'info',
        title: labels.clientIdUpdated,
        message: `${labels.clientIdMessage}\n${displayId}`,
        detail: '' // Applied instantly, no restart required!
    });
});

// ===== END AUTO-DETECTION =====

// ===== GLOBAL SHORTCUTS HANDLER =====

// P2-BUG-01: Removed duplicate SoundBoard IPC handlers (get-sounds, get-settings, get-categories, get-history)
// These are already registered at lines ~4130-4290. The removeHandler+handle pattern here was causing unnecessary re-registration.

function getSoundServerPort() {
    if (!soundServer) return 6465; // default fallback
    return soundServer.port;
}

function getSoundServerToken() {
    return soundboardToken;
}

// IPC handler for sound server port
ipcMain.removeHandler('soundboard:get-server-port');
ipcMain.handle('soundboard:get-server-port', async () => {
    if (!soundServer) return 6465; // default fallback
    return soundServer.port;
});

// IPC handler for sound server token
ipcMain.handle('soundboard:get-server-token', async () => {
    return soundboardToken;
});

// IPC handler for direct sound data (bypasses HTTP server)
ipcMain.removeHandler('soundboard:get-sound-data');
ipcMain.handle('soundboard:get-sound-data', async (event, soundId) => {
    if (!soundBoard) {
        console.error('[SoundBoard IPC] get-sound-data: soundBoard is null');
        return null;
    }
    const sound = soundBoard.getSoundById(soundId);
    if (!sound) {
        console.error(`[SoundBoard IPC] get-sound-data: Sound not found by ID: ${soundId}`);
        console.error(`[SoundBoard IPC] Total sounds: ${soundBoard.sounds.length}, IDs: ${soundBoard.sounds.slice(0, 5).map(s => s.id).join(', ')}`);
        return null;
    }
    if (!fs.existsSync(sound.path)) {
        console.error(`[SoundBoard IPC] get-sound-data: File missing: ${sound.path}`);
        return null;
    }
    try {
        const data = fs.readFileSync(sound.path);
        if (CONSTANTS.DEBUG_MODE) console.log(`[SoundBoard IPC] get-sound-data: Serving ${sound.name} (${data.length} bytes)`);
        return data;
    } catch (e) {
        console.error(`[SoundBoard IPC] get-sound-data error:`, e);
        return null;
    }
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

                showRendererDialog({
                    type: 'warning',
                    title: warning.title,
                    message: warning.message,
                    detail: warning.detail,
                    buttons: ['OK'],
                    checkboxLabel: warning.dontRemind,
                    checkboxChecked: false
                }).then((result) => {
                    if (result && result.checkboxChecked) {
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
app.whenReady().then(async () => {
    const _startupBegin = Date.now(); // v1.10: Startup timing

    // Check if starting hidden (auto-start with --hidden flag)
    const launchedWithHidden = process.argv.includes('--hidden');

    // ── Initialize WindowManager ─────────────────────────────────────────────
    // WindowManager needs the icon path (resolved after app is ready)
    WindowManager.init(ICON_PATH);

    // Show Splash Screen IMMEDIATELY (Unless hidden)
    if (!launchedWithHidden) {
        createSplashWindow();
    } else {
        console.log('[Solari] Starting hidden (auto-launch detected), skipping initial splash render');
    }

    // DataManager needs references to the mutable global state so it can
    // read/write the same variables the rest of index.js uses.
    const _sharedStore = {
        get defaultActivity() { return defaultActivity; },
        set defaultActivity(v) { defaultActivity = v; },
        get presets() { return presets; },
        set presets(v) { presets = v; },
        get lastFormState() { return lastFormState; },
        set lastFormState(v) { lastFormState = v; },
        get blockedPlugins() { return blockedPlugins; },
        set blockedPlugins(v) { blockedPlugins = v; },
        get appSettings() { return appSettings; },
        set appSettings(v) { appSettings = v; },
        get autoDetectEnabled() { return autoDetectEnabled; },
        set autoDetectEnabled(v) { autoDetectEnabled = v; },
        get autoDetectMappings() { return autoDetectMappings; },
        set autoDetectMappings(v) { autoDetectMappings = v; },
        get websiteMappings() { return websiteMappings; },
        set websiteMappings(v) { websiteMappings = v; },
        get fallbackPresetIndex() { return fallbackPresetIndex; },
        set fallbackPresetIndex(v) { fallbackPresetIndex = v; },
        get useExtensionForWeb() { return useExtensionForWeb; },
        set useExtensionForWeb(v) { useExtensionForWeb = v; },
        get clientId() { return clientId; },
        set clientId(v) { clientId = v; },
        get identities() { return identities; },
        set identities(v) { identities = v; },
        get prioritySettings() { return prioritySettings; },
        set prioritySettings(v) { prioritySettings = v; },
        get setupCompleted() { return setupCompleted; },
        set setupCompleted(v) { setupCompleted = v; },
        get lastSeenVersion() { return lastSeenVersion; },
        set lastSeenVersion(v) { lastSeenVersion = v; },
        get hwMonitorEnabled() { return hwMonitorEnabled; },
        set hwMonitorEnabled(v) { hwMonitorEnabled = v; },
        get hwMonitorSettings() { return hwMonitorSettings; },
        set hwMonitorSettings(v) { hwMonitorSettings = v; },
        get solariNotesSettings() { return solariNotesSettings; },
        set solariNotesSettings(v) { solariNotesSettings = v; },
        get systemAFKSettings() { return systemAFKSettings; },
        set systemAFKSettings(v) { systemAFKSettings = v; },
        get trackingUserId() { return trackingUserId; },
        set trackingUserId(v) { trackingUserId = v; },
        get soundBoard() { return soundBoard; },
        // HW Monitor
        get hwMonitorInterval() { return hwMonitorInterval; },
        set hwMonitorInterval(v) { hwMonitorInterval = v; },
        get latestHwStats() { return latestHwStats; },
        set latestHwStats(v) { latestHwStats = v; },
        get hwGpuAvailable() { return hwGpuAvailable; },
        set hwGpuAvailable(v) { hwGpuAvailable = v; },
        get identities() { return identities; },
        set identities(v) { identities = v; },
        get globalAppName() { return globalAppName; },
        set globalAppName(v) { globalAppName = v; },
        get rpcConnected() { return rpcConnected; },
        get isEnabled() { return isEnabled; },
        get spotifyClientId() { return spotifyClientId; },
        set spotifyClientId(v) { spotifyClientId = v; },
        get spotifyTokens() { return spotifyTokens; },
        set spotifyTokens(v) { spotifyTokens = v; },
        get extensionStats() { return extensionStats; },
        set extensionStats(v) { extensionStats = v; },
    };

    DataManager.init(_sharedStore, { app, path, fs, CONSTANTS }, (data) => {
        // Side-effects that must run after data is loaded
        applyAppSettings();
        if (hwMonitorEnabled) setTimeout(() => startHWMonitor(), 3000);
    });

    HWMonitor.init(_sharedStore, {
        CONSTANTS,
        saveData,
        updatePresence,
        getMainWindow: () => mainWindow
    });
    // ── End Manager Init ─────────────────────────────────────────────────────

    // Phase 2: Load settings (blocking disk read, but splash is already visible now)
    const _loadStart = Date.now();
    loadData();
    console.log(`[Solari] Phase 2 (loadData): ${Date.now() - _loadStart}ms`);


    let updatedPlugins = [];
    const shouldStartHidden = appSettings.startMinimized && appSettings.startWithWindows && launchedWithHidden;

    if (!shouldStartHidden) {
        // Phase 3: Check for app updates (if enabled)
        if (appSettings.autoCheckAppUpdates) {
            const willRestart = await checkUpdateViaSplash();
            if (willRestart) return; // App will restart via electron-updater
        }

        // Phase 4: Check for plugin updates (if enabled)
        if (appSettings.autoCheckPluginUpdates) {
            updatedPlugins = await updatePluginsViaSplash() || [];
        }

        // Phase 5: Transition to loading
        sendSplashStatus('loading', 'Starting Solari...');
    } else {
        // If we found out AFTER loading settings that we actually SHOULD be hidden,
        // and a splash was somehow created, destroy it.
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.close();
        }
    }

    // Phase 6: Initialize the app
    createTray();
    createWindow();
    setupPluginWatcher();
    scanAndRegisterDynamicIPCHandlers();

    // Register Local App Shortcut for DevTools (Moved to renderer via IPC for more reliable capture)
    ipcMain.on('toggle-devtools', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.toggleDevTools();
        }
    });

    // Show main window when it finishes loading (and close splash)
    mainWindow.webContents.on('did-finish-load', () => {
        if (!shouldStartHidden) {
            mainWindow.show();
        } else {
            console.log('[Solari] Window loaded but staying hidden (auto-start)');
        }

        // v1.12.0 FIX: Send last known app name immediately on window load
        // This prevents the "Discord App" placeholder from appearing while RPC connects
        if (globalAppName && globalAppName !== 'Discord App') {
            console.log('[Solari] Sending cached app name to renderer:', globalAppName);
            mainWindow.webContents.send('app-name-loaded', globalAppName);
        }

        // Close splash if it exists
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.close();
        }

        // Show changelog if this is a new version
        setTimeout(() => showChangelog(), 1500);

        // Re-send current RPC status to catch any missed events during page load
        setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('rpc-status', getRpcStatusPayload({
                    reconnecting: !rpcConnected
                }));
            }
        }, 500);

        // Show toast for updated plugins
        if (updatedPlugins && updatedPlugins.length > 0) {
            setTimeout(() => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('plugins-updated', updatedPlugins);
                }
            }, 2500);
        }
    });

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
                        globalAppName = parsed.name;
                        saveData();
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

        soundServer = new SoundServer(soundBoard, null, soundboardToken);
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

    // Load initial locale
    loadLocale(appSettings.language);


    // Start system-wide AFK detection
    startSystemAFKCheck();

    // Start tracking stats for browser extension
    startExtensionStatsTracking();

    // Start auto-detection if enabled (with delay to ensure RPC is ready)
    if (autoDetectEnabled) {
        console.log('[Solari] Auto-detection enabled, waiting for RPC to be ready...');
        setTimeout(() => {
            console.log('[Solari] Starting auto-detection on startup');
            startAutoDetection();
        }, CONSTANTS.AUTO_DETECT_STARTUP_DELAY_MS);
    }

    // Start user tracking (analytics)
    startTracking();

    // Start background BetterDiscord Auto-Repair polling
    startBDBackgroundPolling();

    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

    // v1.10: Startup timing
    console.log(`[Solari] Startup complete in ${Date.now() - _startupBegin}ms`);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        stopTracking();
        // v1.10: Flush any pending save immediately
        saveDataSync();
        if (rpcClient) rpcClient.destroy();
        // v1.10: Graceful WebSocket shutdown with proper close code
        if (wss) {
            wss.clients.forEach(client => {
                try { client.close(1000, 'Solari shutting down'); } catch (e) { /* ignore */ }
            });
            wss.close();
        }
        if (tray) tray.destroy();
        // v1.10: Clean up all intervals
        if (bdStatusPollInterval) clearInterval(bdStatusPollInterval);
        if (hwMonitorInterval) clearInterval(hwMonitorInterval);
        if (systemAFKCheckInterval) clearInterval(systemAFKCheckInterval);
        if (autoDetectInterval) clearInterval(autoDetectInterval);
        if (extensionPingInterval) clearInterval(extensionPingInterval);
        if (extensionStatsInterval) clearInterval(extensionStatsInterval);
        app.quit();
    }
});

// Also stop tracking on before-quit (catches more exit scenarios)
app.on('will-quit', () => {
    stopTracking();
    if (extensionStatsInterval) clearInterval(extensionStatsInterval);
    saveDataSync(); // Ensure data is flushed
});

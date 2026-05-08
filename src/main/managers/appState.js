/**
 * Solari - App State
 *
 * Centralizes all mutable runtime state that was previously scattered
 * as global variables in index.js. Managers receive this object by
 * reference so mutations are shared across all modules.
 *
 * @module appState
 */

const CONSTANTS = require('../constants');

const state = {
    // --- Window References ---
    mainWindow: null,
    autoDetectWindow: null,
    splashWindow: null,
    tray: null,

    // --- RPC ---
    rpcClient: null,
    rpcConnected: false,
    isEnabled: true,
    isSwitching: false,
    currentClientId: null,
    pendingActivity: null,
    updateTimeout: null,

    // --- App Lifecycle ---
    isQuitting: false,
    consoleVisible: true,
    dataLoadFailed: false,

    // --- Data ---
    currentActivity: {},
    defaultActivity: {},
    presets: [],
    lastFormState: {},
    identities: [],
    clientId: '',
    blockedPlugins: new Set(),
    connectedPlugins: new Map(),
    pluginIdCounter: 1,

    // --- Settings ---
    appSettings: {
        startWithWindows: false,
        startMinimized: false,
        closeToTray: false,
        language: 'en',
        dontRemindAdmin: false,
        theme: 'default',
        autoCheckAppUpdates: true,
        autoCheckPluginUpdates: true,
        showEcoMode: true,
        bdAutoRepair: true,
        advancedTelemetry: true
    },

    // --- Priority / Presence ---
    prioritySettings: {
        autoDetect: CONSTANTS.PRIORITY_DEFAULTS.autoDetect,
        manualPreset: CONSTANTS.PRIORITY_DEFAULTS.manualPreset,
        defaultFallback: CONSTANTS.PRIORITY_DEFAULTS.defaultFallback
    },
    currentPrioritySource: null,
    lastNotifiedPresetName: null,

    // --- Auto-Detection ---
    autoDetectEnabled: false,
    autoDetectMappings: [],
    websiteMappings: [],
    autoDetectInterval: null,
    fallbackPresetIndex: -1,
    useExtensionForWeb: true,
    websiteCheckFailCount: 0,
    currentDetectedProcess: null,
    currentDetectedWebsite: null,
    currentDetectedPresetName: null,
    isProcessCheckRunning: false,
    isBrowserCheckRunning: false,
    processCheckErrorCount: 0,
    processCheckBackoffUntil: 0,
    activeTasklistProcess: null,
    activeNvidiaSmiProcess: null,
    setupCompleted: false,
    lastSeenVersion: '0.0.0',

    // --- BD Auto-Repair ---
    bdStatusPollInterval: null,
    bdBrokenCount: 0,
    isRepairing: false,
    lastKnownBDStatus: 'unknown',
    bdRepairCooldownUntil: 0,
    bdRepairHistory: [],
    cachedBDRemoteVersion: null,
    bdRemoteVersionFetchedAt: 0,
    bdIncompatibleCounter: 0,

    // --- SolariManager (BD Runtime) ---
    solariManagerWsId: null,
    lastBDHeartbeat: 0,
    cachedBDPlugins: [],

    // --- Spotify ---
    spotifyClientId: '',
    spotifyTokens: { accessToken: null, refreshToken: null, tokenExpiry: 0 },

    // --- Hardware Monitor ---
    hwMonitorEnabled: false,
    hwMonitorSettings: {
        showCPU: true,
        showRAM: true,
        showGPU: true,
        intervalMs: 3000,
        mode: 'overlay'
    },
    hwMonitorInterval: null,
    latestHwStats: null,
    hwGpuAvailable: null,

    // --- AFK ---
    systemAFKCheckInterval: null,
    systemAFKSettings: {
        enabled: true,
        timeoutMinutes: 5,
        afkDisabledPresets: [],
        afkTiers: []
    },
    lastSystemIdleState: false,
    cachedPluginAfkConfig: null,

    // --- Notes ---
    solariNotesSettings: {
        panelOpacity: 100,
        fontSize: 14,
        fontFamily: 'sans',
        language: 'pt-BR'
    },

    // --- WebSocket ---
    wss: null,

    // --- Telemetry ---
    telemetry: null,
    telemetryWindow: null,
    trackingUserId: null,
    trackerInterval: null,

    // --- Sound ---
    soundBoard: null,
    soundServer: null,

    // --- Debug ---
    debugLogs: [],

    // --- Plugin Watcher ---
    pluginWatcher: null
};

module.exports = state;

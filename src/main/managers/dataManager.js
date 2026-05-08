/**
 * Solari - Data Manager
 *
 * Encapsulates all persistence logic (load/save) that was previously
 * embedded in index.js. Operates on a shared `store` object passed
 * from index.js so the entire app state remains consistent.
 *
 * Usage:
 *   const DataManager = require('./managers/dataManager');
 *   DataManager.init(store, { app, path, fs, CONSTANTS });
 *   DataManager.loadData();
 *   DataManager.saveData();
 *
 * @module dataManager
 */

'use strict';

let _store = null;        // Reference to index.js shared state object
let _app = null;
let _path = null;
let _fs = null;
let _CONSTANTS = null;
let _DATA_PATH = null;
let _saveDataTimer = null;
let _dataLoadFailed = false;

// Callbacks that index.js provides so DataManager can trigger side-effects
// without having to import index.js (circular dep prevention)
let _onLoadComplete = null; // function(data) — called after successful load

/**
 * Must be called once at app startup before any other method.
 *
 * @param {object} store        Mutable state object shared with index.js.
 * @param {object} deps         External dependencies.
 * @param {object} deps.app     Electron app.
 * @param {object} deps.path    Node path module.
 * @param {object} deps.fs      Node fs module.
 * @param {object} deps.CONSTANTS  Solari constants.
 * @param {function} [onLoadComplete]  Optional callback after data is loaded.
 */
function init(store, { app, path, fs, CONSTANTS }, onLoadComplete) {
    _store = store;
    _app = app;
    _path = path;
    _fs = fs;
    _CONSTANTS = CONSTANTS;
    _DATA_PATH = path.join(app.getPath('userData'), 'customrp-data.json');
    _onLoadComplete = onLoadComplete || null;
}

/**
 * Returns the resolved data file path.
 * @returns {string}
 */
function getDataPath() {
    return _DATA_PATH;
}

// ───────────────────────────────────────────────────────────────────────────
// Load
// ───────────────────────────────────────────────────────────────────────────

/**
 * Loads persisted data from disk into the shared store.
 * Migrates orphan auto-detect mappings automatically.
 */
function loadData() {
    try {
        if (!_fs.existsSync(_DATA_PATH)) {
            _autoDetectLanguage();
            _dataLoadFailed = false;
            return;
        }

        console.log(`[DataManager] Loading data from: ${_DATA_PATH}`);
        const raw = _fs.readFileSync(_DATA_PATH);
        const data = JSON.parse(raw);
        console.log(`[DataManager] Parsed. Presets: ${data.presets?.length || 0}, Mappings: ${data.autoDetectMappings?.length || 0}`);

        // Presence & Presets
        _store.defaultActivity = data.defaultActivity || {};
        _store.presets = Array.isArray(data.presets) ? data.presets : [];
        _store.lastFormState = data.lastFormState || {};

        // Blocked plugins
        if (data.blockedPlugins) _store.blockedPlugins = new Set(data.blockedPlugins);

        // App settings (merge over defaults)
        if (data.appSettings) {
            _store.appSettings = { ..._store.appSettings, ...data.appSettings };
        } else {
            _autoDetectLanguage();
        }

        // Auto-detection
        _store.autoDetectEnabled = data.autoDetectEnabled || false;
        _store.autoDetectMappings = data.autoDetectMappings || [];
        _store.websiteMappings = data.websiteMappings || [];
        _store.fallbackPresetIndex = data.fallbackPresetIndex !== undefined ? data.fallbackPresetIndex : -1;
        _store.useExtensionForWeb = data.useExtensionForWeb !== undefined ? data.useExtensionForWeb : true;

        // Client & Identities
        if (data.clientId) _store.clientId = data.clientId;
        if (data.identities) _store.identities = data.identities;

        // Migrate orphan mappings to stub presets
        _store.autoDetectMappings.forEach(mapping => {
            const exists = _store.presets.some(p => p.name === mapping.presetName);
            if (!exists && mapping.presetName) {
                console.log(`[DataManager] Migrating orphan mapping to preset: ${mapping.presetName}`);
                _store.presets.push({
                    name: mapping.presetName, type: 0, details: '', state: '',
                    largeImageKey: '', largeImageText: '', smallImageKey: '', smallImageText: '',
                    button1Label: '', button1Url: '', button2Label: '', button2Url: '', clientId: ''
                });
            }
        });

        // Priority
        if (data.prioritySettings) _store.prioritySettings = { ..._store.prioritySettings, ...data.prioritySettings };

        // Misc
        if (data.setupCompleted !== undefined) _store.setupCompleted = data.setupCompleted;
        if (data.lastSeenVersion) _store.lastSeenVersion = data.lastSeenVersion;
        if (data.ecoMode !== undefined) global.ecoMode = data.ecoMode;

        // Hardware monitor
        if (data.hwMonitorEnabled !== undefined) _store.hwMonitorEnabled = data.hwMonitorEnabled;
        if (data.hwMonitorSettings) _store.hwMonitorSettings = { ..._store.hwMonitorSettings, ...data.hwMonitorSettings };

        // Notes
        if (data.solariNotesSettings) _store.solariNotesSettings = { ..._store.solariNotesSettings, ...data.solariNotesSettings };

        // AFK
        if (data.systemAFKSettings) _store.systemAFKSettings = { ..._store.systemAFKSettings, ...data.systemAFKSettings };

        // Soundboard (defer to after initialization)
        if (data.soundBoardData) global.pendingSoundBoardData = data.soundBoardData;

        // Tracking ID
        if (data.trackingUserId) _store.trackingUserId = data.trackingUserId;

        _dataLoadFailed = false;

        if (typeof _onLoadComplete === 'function') _onLoadComplete(data);

    } catch (e) {
        console.error('[DataManager] Failed to load data:', e);
        _dataLoadFailed = true;
    }
}

// ───────────────────────────────────────────────────────────────────────────
// Save (debounced)
// ───────────────────────────────────────────────────────────────────────────

/**
 * Schedules a debounced save (async, with backup + atomic write).
 * Multiple rapid calls within SAVE_DEBOUNCE_MS are coalesced into one write.
 */
function saveData() {
    if (_saveDataTimer) clearTimeout(_saveDataTimer);
    _saveDataTimer = setTimeout(() => {
        _saveDataImmediate();
        _saveDataTimer = null;
    }, _CONSTANTS.SAVE_DEBOUNCE_MS);
}

/**
 * Forces an immediate synchronous save. Use only during app shutdown.
 */
function saveDataSync() {
    if (_saveDataTimer) {
        clearTimeout(_saveDataTimer);
        _saveDataTimer = null;
    }
    _saveDataImmediateSync();
}

// ───────────────────────────────────────────────────────────────────────────
// Private helpers
// ───────────────────────────────────────────────────────────────────────────

function _buildPayload() {
    return {
        defaultActivity: _store.defaultActivity,
        presets: _store.presets,
        lastFormState: _store.lastFormState,
        blockedPlugins: Array.from(_store.blockedPlugins),
        appSettings: _store.appSettings,
        autoDetectEnabled: _store.autoDetectEnabled,
        autoDetectMappings: _store.autoDetectMappings,
        websiteMappings: _store.websiteMappings,
        fallbackPresetIndex: _store.fallbackPresetIndex,
        useExtensionForWeb: _store.useExtensionForWeb,
        clientId: _store.clientId,
        identities: _store.identities,
        prioritySettings: _store.prioritySettings,
        soundBoardData: _store.soundBoard ? _store.soundBoard.toJSON() : null,
        trackingUserId: _store.trackingUserId,
        ecoMode: global.ecoMode || false,
        setupCompleted: _store.setupCompleted,
        lastSeenVersion: _store.lastSeenVersion,
        hwMonitorEnabled: _store.hwMonitorEnabled,
        hwMonitorSettings: _store.hwMonitorSettings,
        solariNotesSettings: _store.solariNotesSettings,
        systemAFKSettings: _store.systemAFKSettings
    };
}

async function _saveDataImmediate() {
    if (_dataLoadFailed) {
        _writeRescueFile(_buildPayload());
        return;
    }
    try {
        const json = JSON.stringify(_buildPayload(), null, 2);
        // Backup existing file
        if (_fs.existsSync(_DATA_PATH)) {
            try { await _fs.promises.copyFile(_DATA_PATH, _DATA_PATH + '.bak'); }
            catch (e) { console.error('[DataManager] Backup failed:', e); }
        }
        // Atomic write: tmp → rename
        const tmp = _DATA_PATH + '.tmp';
        await _fs.promises.writeFile(tmp, json);
        await _fs.promises.rename(tmp, _DATA_PATH);
    } catch (e) {
        console.error('[DataManager] Save failed:', e);
    }
}

function _saveDataImmediateSync() {
    if (_dataLoadFailed) {
        _writeRescueFileSync(_buildPayload());
        return;
    }
    try {
        if (_fs.existsSync(_DATA_PATH)) {
            try { _fs.copyFileSync(_DATA_PATH, _DATA_PATH + '.bak'); }
            catch (e) { console.error('[DataManager] Backup failed:', e); }
        }
        _fs.writeFileSync(_DATA_PATH, JSON.stringify(_buildPayload(), null, 2));
    } catch (e) {
        console.error('[DataManager] Sync save failed:', e);
    }
}

async function _writeRescueFile(payload) {
    try {
        const rescuePath = _path.join(_app.getPath('userData'), 'customrp-data-rescue.json');
        await _fs.promises.writeFile(rescuePath, JSON.stringify({ ...payload, _rescueTimestamp: new Date().toISOString() }, null, 2));
        console.warn('[DataManager] Data load had previously failed. Saved to rescue file.');
    } catch (e) { console.error('[DataManager] Rescue write failed:', e); }
}

function _writeRescueFileSync(payload) {
    try {
        const rescuePath = _path.join(_app.getPath('userData'), 'customrp-data-rescue.json');
        _fs.writeFileSync(rescuePath, JSON.stringify({ ...payload, _rescueTimestamp: new Date().toISOString() }, null, 2));
        console.warn('[DataManager] Data load had previously failed. Saved to rescue file (sync).');
    } catch (e) { console.error('[DataManager] Rescue sync write failed:', e); }
}

/** Auto-detects system language and sets it in the store. */
function _autoDetectLanguage() {
    if (!_app) return;
    const locale = _app.getLocale() || '';
    _store.appSettings.language = locale.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
    console.log(`[DataManager] Auto-detected language: ${_store.appSettings.language}`);
}

module.exports = {
    init,
    getDataPath,
    loadData,
    saveData,
    saveDataSync
};

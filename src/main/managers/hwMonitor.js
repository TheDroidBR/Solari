/**
 * Solari - Hardware Monitor Manager
 *
 * Encapsulates CPU/RAM/GPU polling and the IPC handlers that were
 * previously embedded in the HARDWARE SYSTEM MONITOR section of index.js.
 *
 * @module hwMonitor
 */

'use strict';

const os = require('os');
const { exec } = require('child_process');
const { ipcMain } = require('electron');

// ── Private state ────────────────────────────────────────────────────────────
let _store = null;          // Reference to index.js shared store (proxy)
let _CONSTANTS = null;
let _saveData = null;       // saveData callback from index.js
let _updatePresence = null; // updatePresence callback from index.js
let _getMainWindow = null;  // getMainWindow callback

let _lastCpuInfo = null;
let _cachedGpuStats = null;
let _lastGpuPoll = 0;
let _lastHwRpcUpdate = 0;
let _lastHwRpcString = '';
let _activeNvidiaSmiProcess = null;
let _activeInterval = 0;

/**
 * Initialize the HW Monitor manager.
 *
 * @param {object} store          Shared mutable state from index.js.
 * @param {object} deps           Injected dependencies.
 * @param {object} deps.CONSTANTS Solari constants.
 * @param {function} deps.saveData          Persists state.
 * @param {function} deps.updatePresence    Triggers RPC presence update.
 * @param {function} deps.getMainWindow     Returns current mainWindow reference.
 */
function init(store, { CONSTANTS, saveData, updatePresence, getMainWindow }) {
    _store = store;
    _CONSTANTS = CONSTANTS;
    _saveData = saveData;
    _updatePresence = updatePresence;
    _getMainWindow = getMainWindow;
    _registerIpcHandlers();
}

// ── CPU ───────────────────────────────────────────────────────────────────────

function _getCpuUsage() {
    const cpus = os.cpus();
    if (!cpus || cpus.length === 0) return 0;

    let totalIdle = 0, totalTick = 0;
    for (const cpu of cpus) {
        for (const type in cpu.times) totalTick += cpu.times[type];
        totalIdle += cpu.times.idle;
    }

    let usage = 0;
    if (_lastCpuInfo) {
        const idleDiff = totalIdle - _lastCpuInfo.idle;
        const totalDiff = totalTick - _lastCpuInfo.total;
        usage = 100 - ~~(100 * idleDiff / totalDiff);
    }
    _lastCpuInfo = { idle: totalIdle, total: totalTick };
    return Math.max(0, Math.min(100, usage));
}

// ── GPU (NVIDIA via nvidia-smi) ───────────────────────────────────────────────

function _getGpuUsage() {
    if (_activeNvidiaSmiProcess) return Promise.resolve(_cachedGpuStats);
    return new Promise((resolve) => {
        _activeNvidiaSmiProcess = exec(
            'nvidia-smi --query-gpu=utilization.gpu,temperature.gpu,memory.used,memory.total --format=csv,noheader,nounits',
            { timeout: 1000, windowsHide: true },
            (error, stdout) => {
                _activeNvidiaSmiProcess = null;
                if (error || !stdout) { resolve(null); return; }
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
                } catch { resolve(null); }
            }
        );
    });
}

// ── Polling ───────────────────────────────────────────────────────────────────

async function _pollHardwareStats() {
    try {
        const results = {};
        const settings = _store.hwMonitorSettings;

        if (settings.showCPU) {
            results.cpu = { usage: _getCpuUsage(), cores: os.cpus()?.length || 0 };
        }

        if (settings.showRAM) {
            const total = os.totalmem();
            const used = total - os.freemem();
            results.ram = {
                usedGB: Math.round((used / 1073741824) * 10) / 10,
                totalGB: Math.round((total / 1073741824) * 10) / 10,
                usagePercent: Math.round((used / total) * 1000) / 10
            };
        }

        if (settings.showGPU) {
            if (_store.hwGpuAvailable === false) {
                results.gpu = null;
            } else {
                const now = Date.now();
                if (!_cachedGpuStats || (now - _lastGpuPoll) > _CONSTANTS.HW_GPU_POLL_INTERVAL_MS) {
                    const gpuResult = await _getGpuUsage();
                    _store.hwGpuAvailable = !!gpuResult;
                    _cachedGpuStats = gpuResult || null;
                    _lastGpuPoll = now;
                }
                results.gpu = _cachedGpuStats;
            }
        }

        _store.latestHwStats = results;

        const mw = _getMainWindow();
        if (mw && !mw.isDestroyed() && mw.isVisible()) {
            mw.webContents.send('hw-stats-update', results);
        }

        // Throttled RPC update
        if (_store.rpcConnected && _store.hwMonitorEnabled && _store.isEnabled) {
            const now = Date.now();
            if (now - _lastHwRpcUpdate > _CONSTANTS.HW_RPC_THROTTLE_MS) {
                const hwStr = _formatHWStatsForRPC();
                if (hwStr && hwStr !== _lastHwRpcString) {
                    _lastHwRpcString = hwStr;
                    _lastHwRpcUpdate = now;
                    _updatePresence();
                }
            }
        }
    } catch (e) {
        console.error('[HW Monitor] Poll error:', e.message);
    }
}

function _formatHWStatsForRPC() {
    if (!_store.latestHwStats) return null;
    const parts = [];
    const s = _store.hwMonitorSettings;
    const stats = _store.latestHwStats;

    if (stats.cpu && s.showCPU !== false) parts.push(`CPU: ${stats.cpu.usage}%`);
    if (stats.ram && s.showRAM !== false) parts.push(`RAM: ${stats.ram.usedGB}/${stats.ram.totalGB}GB`);
    if (stats.gpu && s.showGPU !== false) {
        const hasTemp = s.showGPUTemp !== false && stats.gpu.temp !== null;
        if (stats.gpu.usage !== null || hasTemp) {
            let str = 'GPU:';
            if (stats.gpu.usage !== null) str += ` ${stats.gpu.usage}%`;
            if (hasTemp) str += `${stats.gpu.usage !== null ? '' : ' '}(${stats.gpu.temp}°C)`;
            parts.push(str.trim());
        }
    }
    return parts.length > 0 ? parts.join(' | ') : null;
}

// ── Public API ────────────────────────────────────────────────────────────────

function startHWMonitor() {
    if (!_store.hwMonitorEnabled) return;

    const baseInterval = _store.hwMonitorSettings.intervalMs || 2000;
    
    // Determine target interval based on Eco Mode
    let interval = baseInterval;
    if (global.ecoMode) {
        interval = Math.max(baseInterval, _CONSTANTS.HW_MONITOR_INTERVAL_ECO_MS || 10000);
    }
    
    // Determine if mainWindow is visible
    if (global.isMainWindowVisible === false) {
        // If window is minimized/hidden, check if we need to send stats to Discord RPC
        const isRpcNeeded = _store.hwMonitorEnabled && _store.isEnabled;
        if (!isRpcNeeded) {
            // No need to poll at all if the window is hidden and it's not being sent to Discord RPC!
            if (_store.hwMonitorInterval) {
                console.log('[HW Monitor] Stopping polling: Window is hidden & RPC stats are disabled');
                stopHWMonitor();
            }
            return;
        }
        
        // If RPC is active but window is hidden, we poll slower to preserve resources
        interval = Math.max(interval, 15000);
    }

    // If interval has changed, recreate it
    if (_store.hwMonitorInterval) {
        if (_activeInterval === interval) return; // Keep running if interval didn't change
        clearInterval(_store.hwMonitorInterval);
        _store.hwMonitorInterval = null;
    }

    _activeInterval = interval;
    console.log('[HW Monitor] Starting lightweight polling every', interval, 'ms');

    _getCpuUsage(); // Warm up counters
    setTimeout(_pollHardwareStats, 500);
    _store.hwMonitorInterval = setInterval(_pollHardwareStats, interval);
}

function stopHWMonitor() {
    if (_store.hwMonitorInterval) {
        clearInterval(_store.hwMonitorInterval);
        _store.hwMonitorInterval = null;
        _store.latestHwStats = null;
        _activeInterval = 0;
        if (_activeNvidiaSmiProcess) {
            try { _activeNvidiaSmiProcess.kill(); } catch { }
            _activeNvidiaSmiProcess = null;
        }
        console.log('[HW Monitor] Stopped');
    }
}

/** Returns the latest HW stats formatted for Discord RPC. */
const getFormattedForRPC = () => _formatHWStatsForRPC();

// ── IPC Handlers ──────────────────────────────────────────────────────────────

function _registerIpcHandlers() {
    ipcMain.handle('hw-monitor:toggle', (event, enabled) => {
        _store.hwMonitorEnabled = enabled;
        _saveData();

        if (enabled) {
            startHWMonitor();
        } else {
            stopHWMonitor();
            const mw = _getMainWindow();
            if (mw && !mw.isDestroyed()) mw.webContents.send('hw-stats-update', null);
        }

        console.log('[HW Monitor] Toggled:', enabled);
        _updatePresence();
        return { success: true, enabled };
    });

    ipcMain.handle('hw-monitor:get-settings', () => ({
        enabled: _store.hwMonitorEnabled,
        settings: _store.hwMonitorSettings,
        stats: _store.latestHwStats,
        gpuAvailable: _store.hwGpuAvailable
    }));

    ipcMain.handle('hw-monitor:save-settings', (event, newSettings) => {
        _store.hwMonitorSettings = { ..._store.hwMonitorSettings, ...newSettings };
        _saveData();

        if (_store.hwMonitorEnabled) {
            stopHWMonitor();
            startHWMonitor();
        }

        if ('showGPU' in newSettings) _store.hwGpuAvailable = null;

        console.log('[HW Monitor] Settings updated:', JSON.stringify(_store.hwMonitorSettings));
        if (_store.hwMonitorEnabled) _updatePresence();
        return { success: true, settings: _store.hwMonitorSettings };
    });

    ipcMain.handle('hw-monitor:get-stats', () => _store.latestHwStats);
}

module.exports = { init, startHWMonitor, stopHWMonitor, getFormattedForRPC };

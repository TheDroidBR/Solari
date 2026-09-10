const { BrowserWindow } = require('electron');
const { exec } = require('child_process');
const CONSTANTS = require('./constants');


class TelemetryManager {
    constructor(trackerUrl, debugMode = false) {
        this.trackerUrl = trackerUrl;
        this.debugMode = debugMode;
        this.trackerInterval = null;
        this.telemetryWindow = null;
        this.trackingUserId = null;
    }

    setUserId(uid) {
        this.trackingUserId = uid;
    }

    checkSBDriverInstalled() {
        // Cache driver check for 1 hour to prevent constant powershell WMI queries
        const now = Date.now();
        if (this._cachedDriverInstalled !== undefined && (now - (this._lastDriverCheck || 0)) < 3600000) {
            return Promise.resolve(this._cachedDriverInstalled);
        }

        return new Promise((resolve) => {
            exec('powershell -Command "Get-WmiObject Win32_SoundDevice | Select-Object Name | ConvertTo-Json"', (error, stdout) => {
                if (error) {
                    this._cachedDriverInstalled = false;
                    this._lastDriverCheck = now;
                    resolve(false);
                    return;
                }
                try {
                    const devices = JSON.parse(stdout || '[]');
                    const deviceList = Array.isArray(devices) ? devices : [devices];
                    const vbCableFound = deviceList.some(d =>
                        d && d.Name && (
                            d.Name.includes('CABLE Input') ||
                            d.Name.includes('CABLE Output') ||
                            d.Name.toLowerCase().includes('vb-audio') ||
                            d.Name.toLowerCase().includes('voicemeeter')
                        )
                    );
                    this._cachedDriverInstalled = vbCableFound;
                    this._lastDriverCheck = now;
                    resolve(vbCableFound);
                } catch (e) {
                    this._cachedDriverInstalled = false;
                    this._lastDriverCheck = now;
                    resolve(false);
                }
            });
        });
    }

    setActivePlugins(plugins) {
        this.activePlugins = Array.isArray(plugins) ? plugins : [];
    }

    setBDStatus(status) {
        this.bdStatus = status;
    }

    setAdvancedEnabled(enabled) {
        this.advancedEnabled = enabled;
    }

    setExtensionCheckers(everUsedFn, isActiveFn, getVersionFn) {
        this.getEverUsed = everUsedFn;
        this.getIsActive = isActiveFn;
        this.getExtensionVersion = getVersionFn;
    }

    async sendTrackerPing() {
        if (!this.trackingUserId) return;

        let url = `${this.trackerUrl}?action=ping&uid=${encodeURIComponent(this.trackingUserId)}&version=${CONSTANTS.APP_VERSION}`;

        // Mandatory additions: BD status and advanced flag
        if (this.bdStatus) {
            url += `&bd=${encodeURIComponent(this.bdStatus)}`;
        }
        url += `&advanced=${this.advancedEnabled ? '1' : '0'}`;

        // ext_ever is mandatory (always sent)
        if (this.getEverUsed) {
            url += `&ext_ever=${this.getEverUsed() ? '1' : '0'}`;
        }

        // Advanced telemetry data (Optional)
        if (this.advancedEnabled) {
            if (this.activePlugins && this.activePlugins.length > 0) {
                url += `&plugins=${encodeURIComponent(this.activePlugins.join(','))}`;
            }

            try {
                const driverInstalled = await this.checkSBDriverInstalled();
                url += `&driver=${driverInstalled ? '1' : '0'}`;
            } catch (e) {
                if (this.debugMode) console.error('[Solari Telemetry] Driver check error:', e);
            }

            // Extension telemetry (respect privacy toggle)
            if (this.getIsActive) {
                url += `&ext_active=${this.getIsActive() ? '1' : '0'}`;
            }
            if (this.getExtensionVersion) {
                const extVer = this.getExtensionVersion();
                if (extVer) {
                    url += `&ext_version=${encodeURIComponent(extVer)}`;
                }
            }
        }

        let confirmed = false;

        try {
            // OPTION A: Native fetch (Fastest, no window overhead)
            const response = await fetch(url, {
                method: 'GET',
                signal: AbortSignal.timeout(10000),
                headers: {
                    'User-Agent': CONSTANTS.APP_USER_AGENT,
                    'Cache-Control': 'no-cache'
                }
            });

            if (response.ok) {
                const body = await response.text();
                if (body.includes('"success":true')) {
                    if (this.debugMode) console.log('[Solari Telemetry] Session confirmed via fetch.');
                    confirmed = true;
                }
            }
        } catch (e) {
            if (this.debugMode) console.log('[Solari Telemetry] Native fetch failed/blocked, attempting browser fallback...');
        }

        if (confirmed) {
            if (this.telemetryWindow && !this.telemetryWindow.isDestroyed()) {
                this.telemetryWindow.destroy();
                this.telemetryWindow = null;
            }
            return;
        }

        // OPTION B: Fallback with shared background window (Singleton)
        if (!this.telemetryWindow || this.telemetryWindow.isDestroyed()) {
            this.telemetryWindow = new BrowserWindow({
                width: 400,
                height: 300,
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });
        }

        let loadTimeout = setTimeout(() => {
            if (this.telemetryWindow && !this.telemetryWindow.isDestroyed()) {
                if (this.debugMode) console.log('[Solari Telemetry] Fallback window load timed out, destroying window.');
                this.telemetryWindow.destroy();
                this.telemetryWindow = null;
            }
        }, 15000);

        this.telemetryWindow.loadURL(url);

        const handleFinishLoad = () => {
            if (loadTimeout) { clearTimeout(loadTimeout); loadTimeout = null; }
            if (!this.telemetryWindow || this.telemetryWindow.isDestroyed()) return;

            this.telemetryWindow.webContents.executeJavaScript('document.body.innerText')
                .then((bodyText) => {
                    if (!bodyText || bodyText.trim() === '') return;

                    try {
                        const json = JSON.parse(bodyText);
                        if (json.success) {
                            if (this.debugMode) console.log('[Solari Telemetry] Sync successful via window.');
                        }
                    } catch (e) {
                        if (bodyText.includes('aes.js') || bodyText.includes('__test=')) {
                            if (this.debugMode) console.log('[Solari Telemetry] Challenged, retrying in window...');
                            this.telemetryWindow.webContents.once('did-finish-load', handleFinishLoad);
                        }
                    }
                })
                .catch(() => { });
        };

        const handleFailLoad = () => {
            if (loadTimeout) { clearTimeout(loadTimeout); loadTimeout = null; }
            if (this.telemetryWindow && !this.telemetryWindow.isDestroyed()) {
                if (this.debugMode) console.log('[Solari Telemetry] Fallback window load failed, destroying window.');
                this.telemetryWindow.destroy();
                this.telemetryWindow = null;
            }
        };

        this.telemetryWindow.webContents.removeAllListeners('did-fail-load');
        this.telemetryWindow.webContents.removeAllListeners('did-finish-load');
        this.telemetryWindow.webContents.once('did-fail-load', handleFailLoad);
        this.telemetryWindow.webContents.once('did-finish-load', handleFinishLoad);
    }

    async sendTrackerDisconnect() {
        if (!this.trackingUserId) return;
        const url = `${this.trackerUrl}?action=disconnect&uid=${encodeURIComponent(this.trackingUserId)}`;
        fetch(url, { signal: AbortSignal.timeout(5000) }).catch(() => { });
    }

    reschedulePing() {
        if (this.trackerInterval) clearTimeout(this.trackerInterval);

        // Base 90s + random jitter of ±15s to smooth server load
        const delay = 90000 + (Math.floor(Math.random() * 30000) - 15000);

        this.trackerInterval = setTimeout(async () => {
            await this.sendTrackerPing();
            this.reschedulePing();
        }, delay);
    }

    start() {
        this.sendTrackerPing();
        this.reschedulePing();
        console.log('[Solari Telemetry] Adaptive update cycle started');
    }

    stop() {
        if (this.trackerInterval) {
            clearTimeout(this.trackerInterval);
            this.trackerInterval = null;
        }
        if (this.telemetryWindow && !this.telemetryWindow.isDestroyed()) {
            this.telemetryWindow.destroy();
            this.telemetryWindow = null;
        }
        console.log('[Solari Telemetry] Stopped');
    }
}

module.exports = TelemetryManager;

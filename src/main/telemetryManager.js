const { BrowserWindow } = require('electron');

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

    setActivePlugins(plugins) {
        this.activePlugins = Array.isArray(plugins) ? plugins : [];
    }

    setBDStatus(status) {
        this.bdStatus = status;
    }

    setAdvancedEnabled(enabled) {
        this.advancedEnabled = enabled;
    }

    async sendTrackerPing() {
        if (!this.trackingUserId) return;

        let url = `${this.trackerUrl}?action=ping&uid=${encodeURIComponent(this.trackingUserId)}&version=1.11.2`;

        // Advanced telemetry data (Optional)
        if (this.advancedEnabled) {
            if (this.activePlugins && this.activePlugins.length > 0) {
                url += `&plugins=${encodeURIComponent(this.activePlugins.join(','))}`;
            }

            if (this.bdStatus) {
                url += `&bd=${encodeURIComponent(this.bdStatus)}`;
            }
        }

        let confirmed = false;

        try {
            // OPTION A: Native fetch (Fastest, no window overhead)
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'SolariApp/1.11.2',
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

        this.telemetryWindow.loadURL(url);

        const handleFinishLoad = () => {
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

        this.telemetryWindow.webContents.once('did-finish-load', handleFinishLoad);
    }

    async sendTrackerDisconnect() {
        if (!this.trackingUserId) return;
        const url = `${this.trackerUrl}?action=disconnect&uid=${encodeURIComponent(this.trackingUserId)}`;
        fetch(url).catch(() => { });
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

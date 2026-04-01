/**
 * Solari Update Manager (electron-updater)
 * 
 * Replaces the old updater.js that used hidden .bat scripts.
 * Uses electron-updater with Generic Provider for clean, native updates.
 * 
 * Features:
 * - Primary source: GitHub releases (URL configurable)
 * - Fallback source: GitLab releases (if GitHub fails)
 * - Progress events compatible with existing splash screen
 * - Silent update check for badge/notification system
 * 
 * NO .bat files. NO taskkill. NO wscript.exe. NO %TEMP% scripts.
 */

const { autoUpdater } = require('electron-updater');
const { app } = require('electron');
const CONSTANTS = require('./constants');

// State
let splashSender = null; // Function to send status to splash window
let progressSender = null; // Function to send download progress
let updateReady = false;
let lastError = null;
let isFallbackAttempt = false;
let updateCheckResolve = null;

// Configure electron-updater defaults
autoUpdater.autoDownload = false; // We control when to download
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowDowngrade = false;

// Disable default logging, use our own
autoUpdater.logger = null;

/**
 * Set the functions used to communicate with the splash screen.
 * These match the existing sendSplashStatus() and sendSplashProgress() signatures.
 */
function setSplashSenders(statusFn, progressFn) {
    splashSender = statusFn;
    progressSender = progressFn;
}

function sendStatus(state, message) {
    console.log(`[Solari Updater] ${state}: ${message}`);
    if (splashSender) splashSender(state, message);
}

function sendProgress(percent, downloaded, total) {
    if (progressSender) progressSender(percent, downloaded, total);
}

// ===== ELECTRON-UPDATER EVENT HANDLERS =====

autoUpdater.on('checking-for-update', () => {
    sendStatus('checking', 'Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
    console.log(`[Solari Updater] Update available: v${info.version}`);
    sendStatus('downloading', `Downloading v${info.version}...`);
    // Auto-download when update is found during splash flow
    autoUpdater.downloadUpdate();
});

autoUpdater.on('update-not-available', (info) => {
    console.log(`[Solari Updater] No update available. Current: v${info.version}`);
    if (updateCheckResolve) {
        updateCheckResolve(false);
        updateCheckResolve = null;
    }
});

autoUpdater.on('download-progress', (progress) => {
    sendProgress(
        progress.percent,
        progress.transferred,
        progress.total
    );
});

autoUpdater.on('update-downloaded', (info) => {
    console.log(`[Solari Updater] Update downloaded: v${info.version}`);
    updateReady = true;
    sendStatus('installing', 'Installing update...');
    if (updateCheckResolve) {
        updateCheckResolve(true);
        updateCheckResolve = null;
    }
});

autoUpdater.on('error', (error) => {
    lastError = error;
    console.error('[Solari Updater] Update Error:', error);

    // If primary (GitHub) failed, try fallback (GitLab)
    if (!isFallbackAttempt && CONSTANTS.UPDATE_URL_FALLBACK) {
        console.log('[Solari Updater] Primary source failed, trying fallback (GitLab)...');
        isFallbackAttempt = true;
        autoUpdater.setFeedURL({
            provider: 'generic',
            url: CONSTANTS.UPDATE_URL_FALLBACK,
            useMultipleRangeRequest: false
        });
        autoUpdater.checkForUpdates().catch((fallbackErr) => {
            console.error('[Solari Updater] Fallback also failed:', fallbackErr);
            sendStatus('error', `Falha: ${fallbackErr.message || 'Erro desconhecido'}`);
            if (updateCheckResolve) {
                // Wait 5 seconds so user can read the red error message
                setTimeout(() => {
                    if (updateCheckResolve) {
                        updateCheckResolve(false);
                        updateCheckResolve = null;
                    }
                }, 5000);
            }
        });
        return;
    }

    // Both sources failed or the error happened DURING download
    sendStatus('error', `Erro: ${error.message || 'Falha no download'}`);
    if (updateCheckResolve) {
        // Wait 5 seconds so user can read the red error message
        setTimeout(() => {
            if (updateCheckResolve) {
                updateCheckResolve(false);
                updateCheckResolve = null;
            }
        }, 5000);
    }
});

// ===== PUBLIC API =====

/**
 * Check for updates during splash screen.
 * Returns a Promise that resolves to:
 * - true: update was downloaded and will install on restart
 * - false: no update available or check failed
 */
function checkUpdateViaSplash() {
    if (process.env.NODE_ENV === 'development') {
        return Promise.resolve(false);
    }

    // Reset state for each check
    isFallbackAttempt = false;
    lastError = null;
    updateReady = false;

    // Set primary URL
    autoUpdater.setFeedURL({
        provider: 'generic',
        url: CONSTANTS.UPDATE_URL_PRIMARY,
        useMultipleRangeRequest: false
    });

    return new Promise((resolve) => {
        updateCheckResolve = resolve;

        autoUpdater.checkForUpdates().catch((err) => {
            console.error('[Solari Updater] checkForUpdates exception:', err.message);
            // The 'error' event handler will handle fallback
        });

        // Safety timeout: if nothing happens in 30 seconds, resolve false
        setTimeout(() => {
            if (updateCheckResolve) {
                console.warn('[Solari Updater] Update check timed out after 30s');
                sendStatus('error', 'Update check timed out. Starting anyway...');
                updateCheckResolve(false);
                updateCheckResolve = null;
            }
        }, 30000);
    });
}

/**
 * Silent update check — returns {hasUpdate, latestVersion, currentVersion}
 * Used by the badge system and manual "Check for updates" button.
 * Does NOT download; just checks if an update exists.
 */
async function checkUpdateSilent() {
    const pkg = require('../../package.json');
    const currentVersion = pkg.version;

    try {
        // Reset to primary URL
        autoUpdater.setFeedURL({
            provider: 'generic',
            url: CONSTANTS.UPDATE_URL_PRIMARY,
            useMultipleRangeRequest: false
        });

        const result = await autoUpdater.checkForUpdates();
        if (result && result.updateInfo) {
            const latestVersion = result.updateInfo.version;
            const hasUpdate = latestVersion !== currentVersion;
            return { hasUpdate, latestVersion, currentVersion };
        }
        return { hasUpdate: false, latestVersion: currentVersion, currentVersion };
    } catch (err) {
        console.warn('[Solari Updater] Silent check failed on primary, trying fallback...');
        try {
            autoUpdater.setFeedURL({
                provider: 'generic',
                url: CONSTANTS.UPDATE_URL_FALLBACK,
                useMultipleRangeRequest: false
            });
            const result = await autoUpdater.checkForUpdates();
            if (result && result.updateInfo) {
                const latestVersion = result.updateInfo.version;
                const hasUpdate = latestVersion !== currentVersion;
                return { hasUpdate, latestVersion, currentVersion };
            }
        } catch (fallbackErr) {
            console.error('[Solari Updater] Silent check fallback also failed:', fallbackErr.message);
        }
        return { hasUpdate: false, latestVersion: currentVersion, currentVersion };
    }
}

/**
 * Install the downloaded update and restart the app.
 * This is clean — uses the native NSIS installer, no .bat scripts.
 */
function installUpdateAndRestart() {
    if (updateReady) {
        console.log('[Solari Updater] Installing update and restarting...');
        autoUpdater.quitAndInstall(false, true); // isSilent=false, isForceRunAfter=true
    } else {
        console.warn('[Solari Updater] installUpdateAndRestart called but no update is ready');
    }
}

/**
 * Change the primary update URL at runtime.
 * Call this when the GitHub account situation is resolved.
 */
function setPrimaryUpdateUrl(url) {
    console.log('[Solari Updater] Primary URL changed to:', url);
    CONSTANTS.UPDATE_URL_PRIMARY = url;
}

module.exports = {
    setSplashSenders,
    checkUpdateViaSplash,
    checkUpdateSilent,
    installUpdateAndRestart,
    setPrimaryUpdateUrl
};

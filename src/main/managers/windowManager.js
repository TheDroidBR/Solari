/**
 * Solari - Window Manager
 *
 * Centralizes all BrowserWindow creation logic that was previously
 * embedded inside index.js. Manages main window, splash, and
 * the auto-detect settings window.
 *
 * @module windowManager
 */

const { BrowserWindow, shell } = require('electron');
const path = require('path');
const CONSTANTS = require('../constants');

/** @type {BrowserWindow|null} */
let mainWindow = null;
/** @type {BrowserWindow|null} */
let splashWindow = null;
/** @type {BrowserWindow|null} */
let autoDetectWindow = null;

/** Resolved path to the app icon (dev vs packaged). Set via init(). */
let ICON_PATH = '';

/**
 * Must be called once at startup before creating any windows.
 * @param {string} iconPath Absolute path to the app icon.
 */
function init(iconPath) {
    ICON_PATH = iconPath;
}

// ───────────────────────────────────────────────────────────────────────────
// Main Window
// ───────────────────────────────────────────────────────────────────────────

/**
 * Creates the main application window. Starts hidden; caller is responsible
 * for showing it at the right moment (after splash / data load).
 *
 * @param {object} callbacks
 * @param {function} callbacks.onClose  Called when the window is about to close.
 * @returns {BrowserWindow}
 */
function createMainWindow({ onClose } = {}) {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 950,
        minWidth: 1100,
        title: 'Solari',
        icon: ICON_PATH,
        backgroundColor: '#0f0c29',
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            backgroundThrottling: true,
            spellcheck: false
        }
    });

    // Navigation security guard — block unsafe protocols
    mainWindow.webContents.on('will-navigate', (event, url) => {
        try {
            const protocol = new URL(url).protocol;
            if (!CONSTANTS.SAFE_PROTOCOLS.includes(protocol)) {
                console.warn('[Solari Security] Blocked navigation to unsafe protocol:', protocol);
                event.preventDefault();
            }
        } catch {
            event.preventDefault();
        }
    });

    // Intercept new-window events — open externally only for safe protocols
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        try {
            const protocol = new URL(url).protocol;
            if (CONSTANTS.SAFE_PROTOCOLS.includes(protocol)) {
                shell.openExternal(url);
            } else {
                console.warn('[Solari Security] Blocked external link with unsafe protocol:', protocol);
            }
        } catch { /* invalid URL */ }
        return { action: 'deny' };
    });

    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));

    mainWindow.on('close', (event) => {
        if (typeof onClose === 'function') onClose(event);
    });

    mainWindow.on('closed', () => { mainWindow = null; });

    return mainWindow;
}

// ───────────────────────────────────────────────────────────────────────────
// Splash Window
// ───────────────────────────────────────────────────────────────────────────

/**
 * Creates the splash/loading screen window.
 * @returns {BrowserWindow}
 */
function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 300,
        height: 400,
        frame: false,
        transparent: false,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: false,
        center: true,
        icon: ICON_PATH,
        backgroundColor: '#0f0c29',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    splashWindow.loadFile(path.join(__dirname, '../../renderer/splash.html'));
    splashWindow.on('closed', () => { splashWindow = null; });
    return splashWindow;
}

/**
 * Sends a status update to the splash window.
 * @param {string} state  State identifier (e.g. 'checking', 'downloading').
 * @param {string} message Human-readable message.
 */
function sendSplashStatus(state, message) {
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send('update-status', { state, message });
    }
}

/**
 * Sends download progress to the splash window.
 * @param {number} percent
 * @param {number} downloaded Bytes downloaded.
 * @param {number} total      Total bytes.
 */
function sendSplashProgress(percent, downloaded, total) {
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send('download-progress', { percent, downloaded, total });
    }
}

/** Closes the splash window if it is still open. */
function closeSplashWindow() {
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
    }
}

// ───────────────────────────────────────────────────────────────────────────
// Auto-Detect Window
// ───────────────────────────────────────────────────────────────────────────

/**
 * Creates (or focuses) the auto-detect settings window.
 * @returns {BrowserWindow}
 */
function createAutoDetectWindow() {
    if (autoDetectWindow && !autoDetectWindow.isDestroyed()) {
        autoDetectWindow.focus();
        return autoDetectWindow;
    }

    autoDetectWindow = new BrowserWindow({
        width: 850,
        height: 700,
        minWidth: 700,
        icon: ICON_PATH,
        title: 'Auto-Detect Settings',
        backgroundColor: '#0f0c29',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    autoDetectWindow.loadFile(path.join(__dirname, '../../renderer/autodetect.html'));
    autoDetectWindow.on('closed', () => { autoDetectWindow = null; });
    return autoDetectWindow;
}

// ───────────────────────────────────────────────────────────────────────────
// Accessors
// ───────────────────────────────────────────────────────────────────────────

const getMainWindow = () => mainWindow;
const getSplashWindow = () => splashWindow;
const getAutoDetectWindow = () => autoDetectWindow;

module.exports = {
    init,
    createMainWindow,
    createSplashWindow,
    sendSplashStatus,
    sendSplashProgress,
    closeSplashWindow,
    createAutoDetectWindow,
    getMainWindow,
    getSplashWindow,
    getAutoDetectWindow
};

'use strict';

/**
 * Solari - UI: Context Bar & Onboarding Banner (v1.12.0)
 *
 * Context bar: dynamic strip above action buttons that explains
 *   whether Auto-Detect is active, manual mode, etc.
 *   Uses data-i18n so applyTranslations() keeps it in the right language.
 *
 * Onboarding banner: amber alert shown at top of rpc-tab ONLY when
 *   the GLOBAL client ID is not configured.
 *   Starts hidden — only shown after data-loaded confirms no global clientId.
 *
 * @module ui-context
 */

const { ipcRenderer } = require('electron');
const { t, applyTranslations } = require('../i18n');

// ── Internal state ────────────────────────────────────────────────────────────

let _autoDetectOn  = false;
let _detectedPreset = null;   // name of currently detected preset, or null
let _manualOverride = false;  // true if user clicked "Update Status" manually

// Banner state — start assuming clientId exists to prevent flash
let _hasGlobalClientId = true;
let _dataLoaded        = false;
let _bannerDismissed   = false;

const DEFAULT_CLIENT_ID = '1097694696295350342';

function _isDefaultOrEmpty(id) {
    return !id || id === DEFAULT_CLIENT_ID;
}

// ── Context Bar ───────────────────────────────────────────────────────────────

function _barEl()  { return document.getElementById('rpcModeContextBar'); }
function _iconEl() { return _barEl() && _barEl().querySelector('.ctx-icon'); }
function _textEl() { return _barEl() && _barEl().querySelector('.ctx-text'); }

/**
 * Update the context bar UI.
 * Text spans are given data-i18n attributes so applyTranslations() can
 * keep them in the current language after a language switch.
 */
function _updateBar() {
    const bar  = _barEl();
    const icon = _iconEl();
    const text = _textEl();
    if (!bar || !icon || !text) return;

    let iconChar, i18nKey, fallback;

    if (_autoDetectOn && !_manualOverride) {
        if (_detectedPreset) {
            iconChar = '🔍';
            i18nKey  = 'contextBar.autoDetectActive';
            fallback = 'Auto-Detect active';
            // Append detected preset name inline (non-translatable part)
            bar.className = 'rpc-mode-context-bar ctx-autodetect-active';
            icon.textContent = iconChar;
            text.removeAttribute('data-i18n');
            text.innerHTML = `${t(i18nKey) || fallback} — ${t('contextBar.displaying') || 'displaying'}: <b>${_detectedPreset}</b>. ${t('contextBar.editEntersManual') || "Click 'Update Status' to enter manual mode."}`;
            return;
        } else {
            iconChar = '🔍';
            i18nKey  = 'contextBar.autoDetectIdle';
            fallback = 'Auto-Detect active — no app detected. Fill the form to set manually.';
            bar.className = 'rpc-mode-context-bar ctx-autodetect-idle';
        }
    } else {
        iconChar = '✏️';
        i18nKey  = 'contextBar.manualMode';
        fallback = 'Manual Mode — fill the form and click Update Status.';
        bar.className = 'rpc-mode-context-bar ctx-manual';

        // v1.12.0: If Auto-Detect is ON but we are in manual override, 
        // add a link to resume auto-detect.
        if (_autoDetectOn && _manualOverride) {
            text.innerHTML = `${t(i18nKey) || fallback} <a href="#" id="resumeAutoDetectLink" style="color: #ff9966; margin-left: 5px;">${t('contextBar.resumeAutoDetect') || '(Resume Auto-Detect)'}</a>`;
            const link = document.getElementById('resumeAutoDetectLink');
            if (link) {
                link.onclick = (e) => {
                    e.preventDefault();
                    ipcRenderer.send('exit-manual-mode');
                    setAutoDetect(true); // Resets local state
                };
            }
            icon.textContent = iconChar;
            return;
        }
    }

    icon.textContent = iconChar;
    text.setAttribute('data-i18n', i18nKey);
    text.innerHTML = t(i18nKey) || fallback;
}

// ── Onboarding Banner ─────────────────────────────────────────────────────────

function _bannerEl() { return document.getElementById('onboardingBanner'); }

function _updateBanner() {
    const banner = _bannerEl();
    if (!banner) return;
    const shouldShow = _dataLoaded && !_hasGlobalClientId && !_bannerDismissed;
    banner.style.display = shouldShow ? 'flex' : 'none';
    if (shouldShow) applyTranslations(); // ensure banner text is in current language
}

// ── Public API ────────────────────────────────────────────────────────────────

function setAutoDetect(on) {
    _autoDetectOn = !!on;
    _manualOverride = false; // Reset override when toggle changes
    _updateBar();
}

function setDetectedPreset(presetName) {
    _detectedPreset = presetName || null;
    // If a real preset is detected, we clear the manual override
    if (_detectedPreset) {
        _manualOverride = false;
    }
    _updateBar();
}

/**
 * Sync manual override state from backend.
 * Called when 'manual-mode-changed' IPC arrives.
 */
function setManualOverride(active) {
    _manualOverride = !!active;
    _updateBar();
}

/** 
 * Force the context bar into manual mode display.
 * Called when user clicks "Update Status" or "Reset".
 */
function forceManualMode() {
    _manualOverride = true;
    _updateBar();
}

/** Called from data-loaded with the actual globalClientId from main process */
function setGlobalClientId(id) {
    _hasGlobalClientId = !_isDefaultOrEmpty(id);
    _dataLoaded = true;
    _updateBanner();
}

// Legacy stubs (kept for compatibility with renderer.js hooks)
function setRpcConnected(_connected) { /* no-op */ }
function setClientIdPresent(_present) { /* no-op */ }

function init() {
    // Wire banner dismiss button
    const dismissBtn = document.getElementById('onboardingDismissBtn');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            _bannerDismissed = true;
            _updateBanner();
        });
    }

    // Wire "Configure Now" button → open the Client ID modal in Settings
    const configureBtn = document.getElementById('onboardingConfigureBtn');
    if (configureBtn) {
        configureBtn.addEventListener('click', () => {
            const settingsClientIdBtn = document.getElementById('settings-clientIdBtn');
            if (settingsClientIdBtn) settingsClientIdBtn.click();
        });
    }

    // Sync auto-detect toggle state (listener moved to renderer.js for better synchronization)
    const autoDetectToggle = document.getElementById('autoDetectToggle');
    if (autoDetectToggle) {
        setAutoDetect(autoDetectToggle.checked);
    }

    // Re-apply translations when language changes (keeps context bar translated)
    document.addEventListener('languageChanged', () => _updateBar());

    // Listen for auto-detect preset change events
    ipcRenderer.on('auto-detect-result', (_, data) => {
        setDetectedPreset(data && data.presetName ? data.presetName : null);
    });

    // After a Client ID is saved, re-request data to potentially hide the banner
    ipcRenderer.on('client-id-updated', () => ipcRenderer.send('get-data'));

    // Sync manual mode changes from main process
    ipcRenderer.on('manual-mode-changed', (_, isActive) => {
        setManualOverride(isActive);
    });

    _updateBar();
    // Banner stays hidden until setGlobalClientId() is called via data-loaded
}

module.exports = { init, setAutoDetect, setDetectedPreset, setRpcConnected, setClientIdPresent, setGlobalClientId, forceManualMode, setManualOverride };

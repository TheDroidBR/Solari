/*
 * Solari RPC - Premium Discord Rich Presence Manager
 * Copyright (C) 2026 TheDroid
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 */

const { ipcRenderer, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { initI18n, t, applyTranslations, loadTranslations, getCurrentLang } = require('./i18n');

// --- Version Injection ---
(function injectVersion() {
    try {
        const pkg = require('../../package.json');
        const headerVer = document.getElementById('appVersionHeader');
        const aboutVer = document.getElementById('aboutVersion');
        if (headerVer) headerVer.textContent = `v${pkg.version}`;
        if (aboutVer) aboutVer.textContent = `v${pkg.version}`;
    } catch (e) {
        console.error('[Solari] Failed to inject version:', e);
    }
})();

let isWindowVisible = true;

// --- UI Elements ---
const activityTypeSelect = document.getElementById('activityType');
const detailsInput = document.getElementById('details');
const detailsUrlInput = document.getElementById('detailsUrl');
const stateInput = document.getElementById('state');
const stateUrlInput = document.getElementById('stateUrl');
const largeImageInput = document.getElementById('largeImage');
const largeImageTextInput = document.getElementById('largeImageText');
const largeImageLinkInput = document.getElementById('largeImageLink');
const smallImageInput = document.getElementById('smallImage');
const smallImageTextInput = document.getElementById('smallImageText');
const smallImageLinkInput = document.getElementById('smallImageLink');
const button1LabelInput = document.getElementById('button1Label');
const button1UrlInput = document.getElementById('button1Url');
const button2LabelInput = document.getElementById('button2Label');
const button2UrlInput = document.getElementById('button2Url');
const partyCurrentInput = document.getElementById('partyCurrent');
const partyMaxInput = document.getElementById('partyMax');
const timestampRadios = document.querySelectorAll('input[name="timestampMode"]');
const customTimestampInput = document.getElementById('customTimestamp');
const customTimestampGroup = document.getElementById('customTimestampGroup');
const timestampModeGroup = document.getElementById('timestampModeGroup');
const useEndTimestamp = document.getElementById('useEndTimestamp');
const useEndTimestampContainer = document.getElementById('useEndTimestampContainer');
const useProgressBarInput = document.getElementById('useProgressBar');
const useProgressBarContainer = document.getElementById('useProgressBarContainer');
const progressBarGroup = document.getElementById('progressBarGroup');
const progressCurrentInput = document.getElementById('progressCurrent');
const progressTotalInput = document.getElementById('progressTotal');
const updateBtn = document.getElementById('updateBtn');
const resetBtn = document.getElementById('resetBtn');
const statusToggle = document.getElementById('statusToggle');
const statusIndicator = document.querySelector('.status-indicator');
const statusText = document.querySelector('.status-text');
const afkIndicator = document.getElementById('afkIndicator');

const defDetailsInput = document.getElementById('defDetails');
const defStateInput = document.getElementById('defState');

window.currentLoadedPresetName = null;
const saveDefaultBtn = document.getElementById('saveDefaultBtn');
const presetNameInput = document.getElementById('presetName');
const savePresetBtn = document.getElementById('savePresetBtn');
// const presetList = document.getElementById('presetList'); // Removed static lookup

const testConnectionBtn = document.getElementById('testConnectionBtn');
const testResult = document.getElementById('testResult');

// Plugin Manager UI (Removed to Modal)

// Tab System
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const tabIndicator = document.querySelector('.tab-indicator');

/**
 * Atualiza a posição e largura do indicador de aba
 * @param {HTMLElement} activeBtn - O botão da aba ativa
 */
function updateTabIndicator(activeBtn) {
    if (!tabIndicator || !activeBtn) return;
    tabIndicator.style.width = `${activeBtn.offsetWidth}px`;
    tabIndicator.style.left = `${activeBtn.offsetLeft}px`;
}

function switchTab(tabId) {
    // Remove active from all tabs
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Add active to clicked tab
    const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);
    const targetContent = document.getElementById(tabId);

    if (targetBtn && targetContent) {
        targetBtn.classList.add('active');
        targetContent.classList.add('active');
        updateTabIndicator(targetBtn);
    }
}

// Add click listeners to tab buttons
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        switchTab(tabId);
    });
});

// Initialize indicator on load and window resize
window.addEventListener('load', () => {
    const activeBtn = document.querySelector('.tab-btn.active');
    if (activeBtn) updateTabIndicator(activeBtn);
});

window.addEventListener('resize', () => {
    const activeBtn = document.querySelector('.tab-btn.active');
    if (activeBtn) updateTabIndicator(activeBtn);
});

// CustomRP2 Plugin Elements
const discordUserSpan = document.getElementById('discordUser');
const toastMessageInput = document.getElementById('toastMessage');
const sendToastBtn = document.getElementById('sendToastBtn');

// SmartAFK Elements
const afkToggle = document.getElementById('afkToggle');
const afkTiersContainer = document.getElementById('afkTiersContainer');
const addAfkTierBtn = document.getElementById('addAfkTierBtn');
const saveAfkBtn = document.getElementById('saveAfkBtn');
const afkSaveStatus = document.getElementById('afkSaveStatus');
const afkLogs = document.getElementById('afkLogs');
const afkDisabledPresetsContainer = document.getElementById('afkDisabledPresetsContainer');
const addPresetToAfkDisable = document.getElementById('addPresetToAfkDisable');
const addPresetToDisableBtn = document.getElementById('addPresetToDisableBtn');

// AFK Tiers State
let afkTiers = [{ minutes: 5, status: t('smartAfk.defaultStatus') || 'Away' }];
let afkDisabledPresets = []; // Preset names that disable AFK when active
let lastAfkSaveTime = 0; // Timestamp of last save - ignore config updates for 2 seconds after save

// Plugin connection state tracking (for language change refresh)
let smartAfkConnected = false;
let isRpcActuallyConnected = false; // Tracks REAL RPC connection state from main process

// Spotify Sync Elements
const spotifySyncToggle = document.getElementById('spotifySyncToggle');
const spotifyRpcToggle = document.getElementById('spotifyRpcToggle');
const spotifyStatusDot = document.getElementById('spotifyStatusDot');
const spotifyPluginStatus = document.getElementById('spotifyPluginStatus');
const spotifyNowPlaying = document.getElementById('spotifyNowPlaying');
const spotifyTrackTitle = document.getElementById('spotifyTrackTitle');
const spotifyTrackArtist = document.getElementById('spotifyTrackArtist');
const spotifyPrevBtn = document.getElementById('spotifyPrevBtn');
const spotifyPlayPauseBtn = document.getElementById('spotifyPlayPauseBtn');
const spotifyNextBtn = document.getElementById('spotifyNextBtn');
const savePriorityBtn = document.getElementById('savePriorityBtn');
const saveSpotifyButtonsBtn = document.getElementById('saveSpotifyButtonsBtn');
const priorityAutoDetect = document.getElementById('priorityAutoDetect');
const prioritySpotify = document.getElementById('prioritySpotify');
const priorityDefault = document.getElementById('priorityDefault');

// Spotify State
let spotifyConnected = false;

// SoundBoard State - VB-Cable Driver Detection
let vbCableDriverInstalled = false;
const soundboardDriverNotInstalled = document.getElementById('soundboard-driver-not-installed');
const soundboardReady = document.getElementById('soundboard-ready');

// Auto-Detection Elements
const autoDetectToggle = document.getElementById('autoDetectToggle');
const autoDetectSettingsBtn = document.getElementById('autoDetectSettingsBtn');
const ecoModeToggle = document.getElementById('ecoModeToggle'); // Eco Mode Toggle

// --- State ---
let connectedPlugins = [];
let blockedPlugins = [];
let selectedPlugin = null;
let showTrash = false;

// Custom CSS Elements
let identities = [];
let localPresets = [];
const customCssBtn = document.getElementById('customCssBtn');

// --- Settings Tab Elements ---
const settingsStartWithWindows = document.getElementById('settings-startWithWindows');
const settingsStartMinimized = document.getElementById('settings-startMinimized');
const settingsMinimizeToTray = document.getElementById('settings-minimizeToTray');
const settingsShowEcoMode = document.getElementById('settings-showEcoMode');
const settingsLanguage = document.getElementById('settings-language');
const settingsClientIdBtn = document.getElementById('settings-clientIdBtn');
const settingsAutoCheckApp = document.getElementById('settings-autoCheckApp');
const settingsAutoCheckPlugins = document.getElementById('settings-autoCheckPlugins');
const settingsAdvancedTelemetry = document.getElementById('settings-advancedTelemetry');
const settingsCheckUpdatesBtn = document.getElementById('settings-checkUpdatesBtn');
const settingsChangelogBtn = document.getElementById('settings-changelogBtn');
const settingsSetupWizardBtn = document.getElementById('settings-setupWizardBtn');
const settingsAboutBtn = document.getElementById('settings-aboutBtn');

// State Locks
let isSyncingLanguage = false;
let languageSyncTimeout = null;

const customCssModal = document.getElementById('customCssModal');
const customCssInput = document.getElementById('customCssInput');
const saveCustomCssBtn = document.getElementById('saveCustomCssBtn');
const closeCustomCssBtn = document.getElementById('closeCustomCssBtn');
const cssPresetSelect = document.getElementById('cssPresetSelect');
const saveAsPresetBtn = document.getElementById('saveAsPresetBtn');
const deletePresetBtn = document.getElementById('deletePresetBtn');
const resetCssBtn = document.getElementById('resetCssBtn');
const userPresetsGroup = document.getElementById('userPresetsGroup');

// Preset Name Modal Elements
const presetNameModal = document.getElementById('presetNameModal');
const cssPresetNameInput = document.getElementById('presetNameInput');
const cancelPresetNameBtn = document.getElementById('cancelPresetNameBtn');
const confirmPresetNameBtn = document.getElementById('confirmPresetNameBtn');

// Initialize Custom CSS Style Tag
const customStyle = document.createElement('style');
customStyle.id = 'user-custom-css';
document.head.appendChild(customStyle);

// Built-in CSS Themes (use !important to override Solari's default theme)
const BUILTIN_CSS_PRESETS = {
    'neon-indigo': {
        name: '💙 Neon Indigo',
        css: `:root {
  --primary: #6366f1 !important;
  --primary-dark: #4f46e5 !important;
  --primary-light: #818cf8 !important;
  --primary-glow: rgba(99, 102, 241, 0.4) !important;
  --accent: #6366f1 !important;
}
.glass-card { border-color: rgba(99, 102, 241, 0.25) !important; }
.btn-primary { background: linear-gradient(135deg, #6366f1, #4f46e5) !important; }
.btn-primary-glow { box-shadow: 0 0 20px rgba(99, 102, 241, 0.5) !important; }
.modal-content, .toast { font-family: 'Segoe UI', sans-serif !important; }`
    },
    'crimson': {
        name: '🔥 Crimson',
        css: `:root {
  --primary: #ef4444 !important;
  --primary-dark: #dc2626 !important;
  --primary-light: #f87171 !important;
  --primary-glow: rgba(239, 68, 68, 0.4) !important;
  --accent: #ef4444 !important;
}
.glass-card { border-color: rgba(239, 68, 68, 0.25) !important; }
.btn-primary { background: linear-gradient(135deg, #ef4444, #dc2626) !important; }
.btn-primary-glow { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5) !important; }`
    },
    'ocean': {
        name: '🌊 Ocean Blue',
        css: `:root {
  --primary: #0ea5e9 !important;
  --primary-dark: #0284c7 !important;
  --primary-light: #38bdf8 !important;
  --primary-glow: rgba(14, 165, 233, 0.4) !important;
  --accent: #0ea5e9 !important;
  --bg-dark: #0c1929 !important;
  --bg-mid: #132d4a !important;
}
body { background: linear-gradient(135deg, #0c1929 0%, #1e3a5f 100%) !important; }
.glass-card { border-color: rgba(14, 165, 233, 0.25) !important; }
.btn-primary { background: linear-gradient(135deg, #0ea5e9, #0284c7) !important; }
.btn-primary-glow { box-shadow: 0 0 20px rgba(14, 165, 233, 0.5) !important; }`
    },
    'matrix': {
        name: '💚 Matrix',
        css: `:root {
  --primary: #22c55e !important;
  --primary-dark: #16a34a !important;
  --primary-light: #4ade80 !important;
  --primary-glow: rgba(34, 197, 94, 0.4) !important;
  --accent: #22c55e !important;
  --bg-dark: #020a02 !important;
  --bg-mid: #0a1f0a !important;
}
body { background: linear-gradient(135deg, #020a02 0%, #0d1f0d 100%) !important; }
.glass-card { border-color: rgba(34, 197, 94, 0.2) !important; background: rgba(0, 20, 0, 0.6) !important; }
.btn-primary { background: linear-gradient(135deg, #22c55e, #16a34a) !important; }
.btn-primary-glow { box-shadow: 0 0 20px rgba(34, 197, 94, 0.5) !important; }`
    },
    'minimal': {
        name: '⬛ Minimal Dark',
        css: `:root {
  --primary: #71717a !important;
  --primary-dark: #52525b !important;
  --primary-light: #a1a1aa !important;
  --primary-glow: rgba(113, 113, 122, 0.3) !important;
  --accent: #71717a !important;
  --bg-dark: #0a0a0a !important;
  --bg-mid: #141414 !important;
  --glass-blur: 0px !important;
}
body { background: #0a0a0a !important; }
.glass-card { background: rgba(30, 30, 30, 0.9) !important; border-color: rgba(60, 60, 60, 0.5) !important; backdrop-filter: none !important; }
.btn-primary { background: #3f3f46 !important; }
.btn-primary-glow { box-shadow: none !important; }`
    },
    'sunset': {
        name: '🌅 Sunset',
        css: `:root {
  --primary: #f97316 !important;
  --primary-dark: #ea580c !important;
  --primary-light: #fb923c !important;
  --primary-glow: rgba(249, 115, 22, 0.4) !important;
  --accent: #f97316 !important;
  --bg-dark: #1a0a0a !important;
  --bg-mid: #2d1810 !important;
}
body { background: linear-gradient(135deg, #1a0a0a 0%, #2d1810 100%) !important; }
.glass-card { border-color: rgba(249, 115, 22, 0.25) !important; }
.btn-primary { background: linear-gradient(135deg, #f97316, #ea580c) !important; }
.btn-primary-glow { box-shadow: 0 0 20px rgba(249, 115, 22, 0.5) !important; }`
    }
};

// Load user presets from localStorage
function loadUserCssPresets() {
    try {
        return JSON.parse(localStorage.getItem('solari_css_presets') || '{}');
    } catch (e) {
        return {};
    }
}

// Save user presets to localStorage
function saveUserCssPresets(presets) {
    localStorage.setItem('solari_css_presets', JSON.stringify(presets));
}

// Render user presets in dropdown
function renderUserPresets() {
    if (!userPresetsGroup) return;
    userPresetsGroup.innerHTML = '';
    const userPresets = loadUserCssPresets();
    Object.keys(userPresets).forEach(key => {
        const opt = document.createElement('option');
        opt.value = `user:${key}`;
        opt.textContent = `📁 ${userPresets[key].name}`;
        userPresetsGroup.appendChild(opt);
    });
}

// Update delete button visibility
function updateDeleteButton() {
    if (!deletePresetBtn || !cssPresetSelect) return;
    const value = cssPresetSelect.value;
    deletePresetBtn.style.display = value.startsWith('user:') ? 'block' : 'none';
}

// Apply CSS from preset or custom
function applyCss(css) {
    if (customStyle) {
        customStyle.textContent = css;
    }
}

// Open modal
if (customCssBtn) {
    customCssBtn?.addEventListener('click', () => {
        customCssModal.classList.add('active');
        const currentCss = localStorage.getItem('solari_custom_css') || '';
        const activePreset = localStorage.getItem('solari_active_preset') || 'none';
        customCssInput.value = currentCss;
        if (cssPresetSelect) cssPresetSelect.value = activePreset;
        renderUserPresets();
        updateDeleteButton();
    });
}

// Close modal
if (closeCustomCssBtn) {
    closeCustomCssBtn?.addEventListener('click', () => {
        customCssModal.classList.remove('active');
    });
}

// Preset selection change
if (cssPresetSelect) {
    cssPresetSelect?.addEventListener('change', () => {
        const value = cssPresetSelect.value;
        updateDeleteButton();

        if (value === 'none') {
            customCssInput.value = '';
        } else if (BUILTIN_CSS_PRESETS[value]) {
            customCssInput.value = BUILTIN_CSS_PRESETS[value].css;
        } else if (value.startsWith('user:')) {
            const key = value.replace('user:', '');
            const userPresets = loadUserCssPresets();
            if (userPresets[key]) {
                customCssInput.value = userPresets[key].css;
            }
        }
    });
}

// Save & Apply
if (saveCustomCssBtn) {
    saveCustomCssBtn?.addEventListener('click', () => {
        const css = customCssInput.value;
        const preset = cssPresetSelect ? cssPresetSelect.value : 'none';
        localStorage.setItem('solari_custom_css', css);
        localStorage.setItem('solari_active_preset', preset);
        applyCss(css);
        customCssModal.classList.remove('active');
        showToast('🎨', t('toasts.customCssSaved'), 'success');
    });
}

// Save as new preset - Open name modal
if (saveAsPresetBtn && presetNameModal) {
    saveAsPresetBtn?.addEventListener('click', () => {
        // Open the preset name modal
        presetNameModal.classList.add('active');
        if (cssPresetNameInput) {
            cssPresetNameInput.value = '';
            cssPresetNameInput.focus();
        }
    });
}

// Cancel preset name modal
if (cancelPresetNameBtn && presetNameModal) {
    cancelPresetNameBtn?.addEventListener('click', () => {
        presetNameModal.classList.remove('active');
    });
}

// Confirm save preset
if (confirmPresetNameBtn && presetNameModal) {
    confirmPresetNameBtn?.addEventListener('click', () => {
        const name = cssPresetNameInput ? cssPresetNameInput.value : '';
        if (!name || !name.trim()) {
            showToast('⚠️', t('customCss.nameRequired') || 'Please enter a name', 'warning');
            return;
        }

        const key = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
        const userPresets = loadUserCssPresets();
        userPresets[key] = {
            name: name.trim(),
            css: customCssInput.value
        };
        saveUserCssPresets(userPresets);
        renderUserPresets();
        if (cssPresetSelect) cssPresetSelect.value = `user:${key}`;
        updateDeleteButton();
        presetNameModal.classList.remove('active');
        showToast('💾', t('customCss.presetSaved') || 'Preset saved!', 'success');
    });

    // Allow Enter key to confirm
    if (cssPresetNameInput) {
        cssPresetNameInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmPresetNameBtn.click();
            }
        });
    }
}

// Delete preset (no confirm dialog - user already clicked delete button intentionally)
if (deletePresetBtn) {
    deletePresetBtn?.addEventListener('click', () => {
        const value = cssPresetSelect.value;
        if (!value.startsWith('user:')) return;

        const key = value.replace('user:', '');
        const userPresets = loadUserCssPresets();
        if (userPresets[key]) {
            delete userPresets[key];
            saveUserCssPresets(userPresets);
            renderUserPresets();
            cssPresetSelect.value = 'none';
            customCssInput.value = '';
            updateDeleteButton();
            showToast('🗑️', t('customCss.presetDeleted') || 'Preset deleted', 'info');
        }
    });
}

// Reset CSS
if (resetCssBtn) {
    resetCssBtn?.addEventListener('click', () => {
        customCssInput.value = '';
        if (cssPresetSelect) cssPresetSelect.value = 'none';
        updateDeleteButton();
    });
}

// Load saved CSS on startup
(function initCustomCss() {
    const savedCss = localStorage.getItem('solari_custom_css') || '';
    applyCss(savedCss);
})();

// Eco Mode Toggle
if (ecoModeToggle) {
    ecoModeToggle?.addEventListener('change', (e) => {
        const isEco = e.target.checked;
        document.body.classList.toggle('eco-mode', isEco);
        ipcRenderer.send('save-eco-mode', isEco);
    });
}

// v1.10: Removed duplicate CSS load (initCustomCss IIFE above already handles this)

// Periodic check for VB-Cable driver (detects installation changes)
setInterval(async () => {
    try {
        const result = await ipcRenderer.invoke('soundboard:check-driver-installed');
        const wasInstalled = vbCableDriverInstalled;
        vbCableDriverInstalled = result.installed;

        // Only update UI if installation status changed
        if (wasInstalled !== vbCableDriverInstalled) {
            console.log('[Solari Renderer] VB-Cable driver status changed:', vbCableDriverInstalled);
            updateSoundBoardUI();
        }
    } catch (e) {
        // Silently ignore errors during periodic check
    }
}, 30000); // v1.11.1 Opt: 5s -> 30s to save CPU

// Global appSettings object to store state locally
let appSettings = {};

// === Settings Tab Event Listeners ===
function updateStartMinimizedUI() {
    if (!settingsStartWithWindows || !settingsStartMinimized) return;
    const isWindowsOn = settingsStartWithWindows.checked;
    const row = settingsStartMinimized.closest('.settings-row');

    if (isWindowsOn) {
        settingsStartMinimized.disabled = false;
        if (row) row.style.opacity = '1';
        if (row) row.style.pointerEvents = 'auto';
    } else {
        settingsStartMinimized.checked = false;
        settingsStartMinimized.disabled = true;
        if (row) row.style.opacity = '0.5';
        if (row) row.style.pointerEvents = 'none';

        if (appSettings.startMinimized) {
            appSettings.startMinimized = false;
            ipcRenderer.send('save-app-settings', { startMinimized: false });
        }
    }
}

function updateEcoModeVisibility() {
    if (ecoModeToggle) {
        const container = ecoModeToggle.closest('.toggle-container');
        if (container) {
            container.style.display = appSettings.showEcoMode !== false ? 'flex' : 'none';
        }
    }
}

if (settingsStartWithWindows) {
    settingsStartWithWindows.addEventListener('change', (e) => {
        ipcRenderer.send('save-app-settings', { startWithWindows: e.target.checked });
        appSettings.startWithWindows = e.target.checked;
        updateStartMinimizedUI();
    });
}
if (settingsStartMinimized) {
    settingsStartMinimized.addEventListener('change', (e) => {
        ipcRenderer.send('save-app-settings', { startMinimized: e.target.checked });
        appSettings.startMinimized = e.target.checked;
    });
}
if (settingsMinimizeToTray) {
    settingsMinimizeToTray.addEventListener('change', (e) => {
        ipcRenderer.send('save-app-settings', { closeToTray: e.target.checked });
        appSettings.closeToTray = e.target.checked;
    });
}
if (settingsShowEcoMode) {
    settingsShowEcoMode.addEventListener('change', (e) => {
        ipcRenderer.send('save-app-settings', { showEcoMode: e.target.checked });
        appSettings.showEcoMode = e.target.checked;
        updateEcoModeVisibility();
    });
}

if (settingsLanguage) {
    settingsLanguage.addEventListener('change', (e) => {
        ipcRenderer.send('save-language', e.target.value);
    });
}
function showPromptModal(title, message, defaultValue = '') {
    return new Promise((resolve) => {
        // Remove existing modal if any
        let existing = document.getElementById('promptModal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'promptModal';
        overlay.className = 'modal active';
        overlay.style.zIndex = '9999';

        overlay.innerHTML = `
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <h2 style="margin-bottom: 10px; font-size: 1.25rem; background: var(--text-gradient, linear-gradient(135deg, #fff, #a1a1aa)); -webkit-background-clip: text; color: transparent;">${title}</h2>
                <p style="margin-bottom: 20px; color: #a1a1aa; font-size: 0.95rem;">${message}</p>
                <div style="position: relative; margin-bottom: 25px;">
                    <input type="password" id="promptInput" value="${defaultValue}" class="preset-input" style="width: 100%; box-sizing: border-box; text-align: center; font-family: monospace; letter-spacing: 1px; padding-right: 40px;" placeholder="Ex: 123456789012345678">
                    <button id="promptToggleVisibility" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #a1a1aa; cursor: pointer; padding: 5px; font-size: 1.1rem; display: flex; align-items: center; justify-content: center;" title="Show/Hide">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather-eye">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button class="btn btn-secondary" id="promptCancelBtn" style="flex: 1;">${t('modal.cancel') || 'Cancelar'}</button>
                    <button class="btn btn-primary" id="promptConfirmBtn" style="flex: 1;">${t('modal.confirm') || 'Confirmar'}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        const input = document.getElementById('promptInput');
        const toggleBtn = document.getElementById('promptToggleVisibility');
        input.focus();

        const close = (value) => {
            overlay.remove();
            resolve(value);
        };

        toggleBtn.addEventListener('click', () => {
            if (input.type === 'password') {
                input.type = 'text';
                toggleBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather-eye-off">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            } else {
                input.type = 'password';
                toggleBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather-eye">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        });

        // Close when clicking outside the modal content
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                close(null);
            }
        });

        document.getElementById('promptCancelBtn').addEventListener('click', () => close(null));
        document.getElementById('promptConfirmBtn').addEventListener('click', () => close(input.value));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') close(input.value);
            if (e.key === 'Escape') close(null);
        });
    });
}

function showCustomModal(options = {}) {
    return new Promise((resolve) => {
        const {
            type = 'info',
            title = 'Solari',
            message = '',
            detail = '',
            buttons = ['OK'],
            defaultId = 0,
            cancelId = 0,
            checkboxLabel = '',
            checkboxChecked = false
        } = options;

        // Remove existing modal if any
        let existing = document.getElementById('customDialogModal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'customDialogModal';
        overlay.className = 'modal active';
        overlay.style.zIndex = '19999'; // Higher than normal prompt

        // Dynamic Glow Border class based on type
        const glowClass = `custom-dialog-${type}`;

        // Get styled SVG icon for dialog type
        const iconHtml = getDialogIcon(type);

        // Build HTML for buttons
        const renderedButtons = buttons.map((btnText, idx) => {
            const isDefault = idx === (defaultId !== undefined ? defaultId : 0);
            let btnClass = 'btn btn-secondary';
            if (isDefault) {
                btnClass = type === 'warning' ? 'btn btn-danger' : 'btn btn-primary';
            }
            return `<button class="${btnClass}" data-index="${idx}" style="flex: 1; padding: 10px 20px; font-size: 0.9rem; font-weight: 600; min-width: 100px;">${btnText}</button>`;
        }).join('');

        // Build HTML for checkbox (optional)
        let checkboxHtml = '';
        if (checkboxLabel) {
            const isChecked = checkboxChecked ? 'checked' : '';
            checkboxHtml = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px; color: var(--text-muted); font-size: 0.85rem; cursor: pointer; user-select: none;" id="dialogCheckboxWrapper">
                    <input type="checkbox" id="dialogCheckbox" ${isChecked} style="cursor: pointer; width: 15px; height: 15px; accent-color: var(--primary, #ff6b35);">
                    <label for="dialogCheckbox" style="cursor: pointer; font-family: 'Space Grotesk', sans-serif;">${checkboxLabel}</label>
                </div>
            `;
        }

        overlay.innerHTML = `
            <div class="modal-content ${glowClass}" style="max-width: 440px; text-align: center; padding: 30px; display: flex; flex-direction: column; align-items: center;">
                ${iconHtml}
                <h2 style="margin-bottom: 10px; font-size: 1.3rem; background: var(--text-gradient, var(--text)); -webkit-background-clip: text; color: transparent; font-family: 'Space Grotesk', sans-serif; font-weight: 700;">${title}</h2>
                <p style="margin-bottom: 12px; color: var(--text); font-size: 1rem; font-weight: 500; line-height: 1.4; font-family: 'Space Grotesk', sans-serif;">${message}</p>
                ${detail ? `<p style="margin-bottom: 22px; color: var(--text-muted); font-size: 0.85rem; line-height: 1.5; font-family: 'Space Grotesk', sans-serif; white-space: pre-wrap; width: 100%; text-align: center;">${detail}</p>` : '<div style="margin-bottom: 10px;"></div>'}
                ${checkboxHtml}
                <div class="dialog-buttons-container" style="display: flex; gap: 15px; justify-content: center; width: 100%; margin-top: 5px;">
                    ${renderedButtons}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = (responseIndex) => {
            const checkboxEl = document.getElementById('dialogCheckbox');
            const checked = checkboxEl ? checkboxEl.checked : false;
            overlay.remove();
            resolve({ response: responseIndex, checkboxChecked: checked });
        };

        // Wire up buttons click events
        overlay.querySelectorAll('button[data-index]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                close(idx);
            });
        });

        // Setup checkbox wrapper click toggle
        const checkboxWrapper = document.getElementById('dialogCheckboxWrapper');
        if (checkboxWrapper) {
            checkboxWrapper.addEventListener('click', (e) => {
                if (e.target.id !== 'dialogCheckbox' && e.target.tagName !== 'LABEL') {
                    const checkbox = document.getElementById('dialogCheckbox');
                    if (checkbox) checkbox.checked = !checkbox.checked;
                }
            });
        }

        // Keyboard navigation and focus trapping
        const focusables = Array.from(overlay.querySelectorAll('button, input[type="checkbox"]'));
        if (focusables.length > 0) {
            const defaultButton = overlay.querySelector(`button[data-index="${defaultId !== undefined ? defaultId : 0}"]`) || focusables[0];
            defaultButton.focus();

            overlay.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    const first = focusables[0];
                    const last = focusables[focusables.length - 1];
                    if (e.shiftKey) {
                        if (document.activeElement === first) {
                            last.focus();
                            e.preventDefault();
                        }
                    } else {
                        if (document.activeElement === last) {
                            first.focus();
                            e.preventDefault();
                        }
                    }
                } else if (e.key === 'Escape') {
                    const cancelIndex = cancelId !== undefined ? cancelId : 0;
                    close(cancelIndex);
                    e.preventDefault();
                } else if (e.key === 'Enter') {
                    if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
                        return; // Let native button click fire
                    }
                    const defBtn = overlay.querySelector(`button[data-index="${defaultId !== undefined ? defaultId : 0}"]`);
                    if (defBtn) {
                        defBtn.click();
                        e.preventDefault();
                    }
                }
            });
        }
    });
}

function getDialogIcon(type) {
    switch (type) {
        case 'warning':
            return `
                <div class="dialog-icon-wrapper warning">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </div>
            `;
        case 'error':
            return `
                <div class="dialog-icon-wrapper error">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                </div>
            `;
        case 'question':
            return `
                <div class="dialog-icon-wrapper question">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </div>
            `;
        case 'info':
        default:
            return `
                <div class="dialog-icon-wrapper info">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </div>
            `;
    }
}

// IPC Listener for showing the custom dialog from main process
ipcRenderer.on('show-custom-dialog', async (event, options) => {
    const result = await showCustomModal(options);
    ipcRenderer.send('dialog-response', result);
});

if (settingsClientIdBtn) {
    settingsClientIdBtn.addEventListener('click', async () => {
        const currentId = await ipcRenderer.invoke('get-client-id');
        const result = await showPromptModal(t('prompt.clientIdTitle') || 'Client ID Global', t('prompt.clientIdDesc') || 'Insira o Client ID:', currentId || '');
        if (result !== null) {
            ipcRenderer.send('set-client-id', result.trim());
            showToast('🔑', t('toasts.clientIdSaved') || 'Client ID salvo!', 'success');
        }
    });
}
if (settingsAutoCheckApp) {
    settingsAutoCheckApp.addEventListener('change', (e) => {
        ipcRenderer.send('save-app-settings', { autoCheckAppUpdates: e.target.checked });
        appSettings.autoCheckAppUpdates = e.target.checked;
    });
}
if (settingsAutoCheckPlugins) {
    settingsAutoCheckPlugins.addEventListener('change', (e) => {
        ipcRenderer.send('save-app-settings', { autoCheckPluginUpdates: e.target.checked });
        appSettings.autoCheckPluginUpdates = e.target.checked;
    });
}
if (settingsAdvancedTelemetry) {
    settingsAdvancedTelemetry.addEventListener('change', (e) => {
        ipcRenderer.send('save-app-settings', { advancedTelemetry: e.target.checked });
        appSettings.advancedTelemetry = e.target.checked;
    });
}
if (settingsCheckUpdatesBtn) {
    settingsCheckUpdatesBtn.addEventListener('click', () => {
        ipcRenderer.send('trigger-update-check', {
            title: t('menu.updates') || 'Atualizações',
            updateAvailable: t('menu.updateAvailable') || 'Update Available!',
            updateMessage: t('menu.updateMessage') || 'A new version of Solari is available.',
            downloadNow: t('menu.downloadNow') || 'Download Now',
            later: t('menu.later') || 'Later',
            noUpdates: t('menu.noUpdates') || 'You are using the latest version!',
            checkingUpdates: t('menu.checkingUpdates') || 'Checking for updates...'
        });
    });
}

// Support Links Handlers
document.getElementById('faqLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    ipcRenderer.send('open-external-url', 'https://solarirpc.com/faq.html');
});

document.getElementById('discordServerLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    ipcRenderer.send('open-external-url', 'https://discord.gg/hR8nQZhDgf');
});

// --- Feedback & Suggestions Modal System ---
const feedbackModal = document.getElementById('feedbackModal');
const feedbackLink = document.getElementById('feedbackLink');
const feedbackCloseBtn = document.getElementById('feedbackCloseBtn');

const feedbackChooseView = document.getElementById('feedbackChooseView');
const feedbackFormView = document.getElementById('feedbackFormView');
const suggestionFormView = document.getElementById('suggestionFormView');

const btnChooseFeedback = document.getElementById('btnChooseFeedback');
const btnChooseSuggestion = document.getElementById('btnChooseSuggestion');

const feedbackBackBtn1 = document.getElementById('feedbackBackBtn1');
const feedbackBackBtn2 = document.getElementById('feedbackBackBtn2');

const feedbackSubmitBtn = document.getElementById('feedbackSubmitBtn');
const suggestionSubmitBtn = document.getElementById('suggestionSubmitBtn');

const feedbackStars = document.getElementById('feedbackStars');
const feedbackRatingVal = document.getElementById('feedbackRatingVal');

function resetFeedbackModal() {
    document.getElementById('feedbackSubject').value = '';
    document.getElementById('feedbackMessage').value = '';
    document.getElementById('feedbackSender').value = '';
    document.getElementById('suggestionSubject').value = '';
    document.getElementById('suggestionMessage').value = '';
    document.getElementById('suggestionSender').value = '';
    
    setRatingStars(5);
    
    feedbackChooseView.classList.remove('hidden');
    feedbackFormView.classList.add('hidden');
    suggestionFormView.classList.add('hidden');
}

function setRatingStars(rating) {
    if (feedbackRatingVal) feedbackRatingVal.value = rating;
    if (feedbackStars) {
        const stars = feedbackStars.querySelectorAll('span');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.style.color = '#ffbc00';
                star.textContent = '★';
            } else {
                star.style.color = '#4b5563';
                star.textContent = '☆';
            }
        });
    }
}

feedbackStars?.addEventListener('click', (e) => {
    const star = e.target.closest('span');
    if (star) {
        const rating = parseInt(star.dataset.star, 10);
        setRatingStars(rating);
    }
});

feedbackLink?.addEventListener('click', (e) => {
    e.preventDefault();
    resetFeedbackModal();
    feedbackModal?.classList.add('active');
});

feedbackCloseBtn?.addEventListener('click', () => {
    feedbackModal?.classList.remove('active');
});
feedbackModal?.addEventListener('click', (e) => {
    if (e.target === feedbackModal) {
        feedbackModal.classList.remove('active');
    }
});

btnChooseFeedback?.addEventListener('click', () => {
    feedbackChooseView.classList.add('hidden');
    feedbackFormView.classList.remove('hidden');
});
btnChooseSuggestion?.addEventListener('click', () => {
    feedbackChooseView.classList.add('hidden');
    suggestionFormView.classList.remove('hidden');
});

feedbackBackBtn1?.addEventListener('click', () => {
    feedbackFormView.classList.add('hidden');
    feedbackChooseView.classList.remove('hidden');
});
feedbackBackBtn2?.addEventListener('click', () => {
    suggestionFormView.classList.add('hidden');
    feedbackChooseView.classList.remove('hidden');
});

function checkLocalFeedbackCooldown() {
    try {
        const raw = localStorage.getItem('solari_feedback_timestamps');
        let timestamps = raw ? JSON.parse(raw) : [];
        const now = Date.now();
        
        timestamps = timestamps.filter(t => now - t < 3600000);
        localStorage.setItem('solari_feedback_timestamps', JSON.stringify(timestamps));
        
        if (timestamps.length >= 3) {
            const earliest = Math.min(...timestamps);
            const remainingMs = 3600000 - (now - earliest);
            const remainingMin = Math.ceil(remainingMs / 60000);
            return { blocked: true, remainingMinutes: remainingMin };
        }
    } catch (e) {
        console.error('Error checking local cooldown:', e);
    }
    return { blocked: false };
}

function recordFeedbackSubmission() {
    try {
        const raw = localStorage.getItem('solari_feedback_timestamps');
        const timestamps = raw ? JSON.parse(raw) : [];
        timestamps.push(Date.now());
        localStorage.setItem('solari_feedback_timestamps', JSON.stringify(timestamps));
    } catch (e) {
        console.error('Error recording feedback submission:', e);
    }
}

async function submitFeedbackForm(type) {
    const cooldown = checkLocalFeedbackCooldown();
    if (cooldown.blocked) {
        showToast('⏳', t('feedbackModal.cooldownMessage', { minutes: cooldown.remainingMinutes }), 'error');
        return;
    }
    
    let subject = '';
    let message = '';
    let sender = '';
    let rating = null;
    
    if (type === 'feedback') {
        subject = document.getElementById('feedbackSubject').value.trim();
        message = document.getElementById('feedbackMessage').value.trim();
        sender = document.getElementById('feedbackSender').value.trim();
        rating = document.getElementById('feedbackRatingVal').value;
    } else {
        subject = document.getElementById('suggestionSubject').value.trim();
        message = document.getElementById('suggestionMessage').value.trim();
        sender = document.getElementById('suggestionSender').value.trim();
    }
    
    if (!subject || !message) {
        showToast('⚠️', t('feedbackModal.requiredFields'), 'error');
        return;
    }
    
    if (feedbackSubmitBtn) feedbackSubmitBtn.disabled = true;
    if (suggestionSubmitBtn) suggestionSubmitBtn.disabled = true;
    
    if (type === 'feedback' && feedbackSubmitBtn) feedbackSubmitBtn.textContent = t('feedbackModal.sending');
    else if (suggestionSubmitBtn) suggestionSubmitBtn.textContent = t('feedbackModal.sending');
    
    try {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('subject', subject);
        formData.append('message', message);
        formData.append('sender', sender);
        if (rating) formData.append('rating', rating);
        
        const response = await fetch('https://solarirpc.com/counter.php?action=submit_feedback', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            recordFeedbackSubmission();
            showToast('✅', t('feedbackModal.successMessage'), 'success');
            feedbackModal?.classList.remove('active');
        } else {
            if (data.error === 'cooldown') {
                showToast('⏳', t('feedbackModal.serverCooldown'), 'error');
            } else {
                showToast('❌', t('feedbackModal.submitError', { error: data.error || 'Erro desconhecido' }), 'error');
            }
        }
    } catch (err) {
        showToast('❌', t('feedbackModal.networkError'), 'error');
        console.error('[Feedback] Submission error:', err);
    } finally {
        if (feedbackSubmitBtn) {
            feedbackSubmitBtn.disabled = false;
            feedbackSubmitBtn.textContent = t('feedbackModal.submitFeedback');
        }
        if (suggestionSubmitBtn) {
            suggestionSubmitBtn.disabled = false;
            suggestionSubmitBtn.textContent = t('feedbackModal.submitSuggestion');
        }
    }
}

feedbackSubmitBtn?.addEventListener('click', () => submitFeedbackForm('feedback'));
suggestionSubmitBtn?.addEventListener('click', () => submitFeedbackForm('suggestion'));

document.getElementById('discordDevPortalLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    ipcRenderer.send('open-external-url', 'https://discord.com/developers/applications');
});

document.getElementById('privacyPolicyLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    ipcRenderer.send('open-external-url', 'https://solarirpc.com/privacy.html');
});
if (settingsChangelogBtn) {
    settingsChangelogBtn.addEventListener('click', () => {
        ipcRenderer.send('request-changelog'); // Must be mapped in backend
    });
}
// Setup Wizard button trigger (using event delegation for maximum reliability)
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#settings-setupWizardBtn');
    if (btn) {
        console.log('[Solari] Setup wizard button clicked (via event delegation)');
        try {
            if (typeof showSetupWizard === 'function') {
                showSetupWizard();
            } else {
                console.warn('[Solari] showSetupWizard is not a function, falling back to direct display');
                const wizard = document.getElementById('setupWizard');
                if (wizard) wizard.style.display = 'flex';
            }
        } catch (err) {
            console.error('[Solari] Setup wizard trigger error:', err);
            if (typeof showToast === 'function') {
                showToast('❌', 'Erro ao abrir assistente: ' + err.message, 'error');
            } else {
                alert('Erro ao abrir assistente: ' + err.message);
            }
        }
    }
});
if (settingsAboutBtn) {
    settingsAboutBtn.addEventListener('click', () => {
        const aboutModal = document.getElementById('aboutModal');
        if (aboutModal) aboutModal.classList.add('active');
    });
}

const settingsUninstallBtn = document.getElementById('settings-uninstallBtn');
if (settingsUninstallBtn) {
    settingsUninstallBtn.addEventListener('click', () => {
        // Delegate confirmation dialog to main process (has access to Electron dialog)
        ipcRenderer.send('uninstall-app');
    });
}

// --- Load Initial Data ---
function syncSettingsUI(loadedSettings) {
    if (!loadedSettings) return;

    // Nuclear State Protection: If we are currently syncing a new language, 
    // keep the NEW language even if the incoming sync has OLD data.
    const currentLang = isSyncingLanguage && appSettings.language ? appSettings.language : loadedSettings.language;

    // Setup global state first so UI helper functions can read it correctly
    appSettings = { ...loadedSettings };
    if (isSyncingLanguage) {
        appSettings.language = currentLang;
    }

    // Checkboxes
    if (settingsStartWithWindows) settingsStartWithWindows.checked = appSettings.startWithWindows || false;
    if (settingsStartMinimized) settingsStartMinimized.checked = appSettings.startMinimized || false;
    if (settingsMinimizeToTray) settingsMinimizeToTray.checked = appSettings.closeToTray || false;
    if (settingsShowEcoMode) settingsShowEcoMode.checked = appSettings.showEcoMode !== false;
    if (settingsAutoCheckApp) settingsAutoCheckApp.checked = appSettings.autoCheckAppUpdates || false;
    if (settingsAutoCheckPlugins) settingsAutoCheckPlugins.checked = appSettings.autoCheckPluginUpdates || false;
    if (settingsAdvancedTelemetry) settingsAdvancedTelemetry.checked = appSettings.advancedTelemetry !== false;
    renderIdentities();

    // Apply UI Dependencies
    updateStartMinimizedUI();
    updateEcoModeVisibility();

    // Dropdown (PROTECTED BY LOCK)
    if (settingsLanguage && !isSyncingLanguage) {
        settingsLanguage.value = appSettings.language || 'en';
    }

    if (window.ExtensionTabManager && typeof window.ExtensionTabManager.renderMappings === 'function') {
        window.ExtensionTabManager.renderMappings();
    }
}

ipcRenderer.on('app-data-synced', (event, appSettings) => {
    syncSettingsUI(appSettings);
});

ipcRenderer.send('get-data');

ipcRenderer.on('data-loaded', async (event, data) => {
    // 1. Update Global State First
    if (data.identities) identities = data.identities;

    // 2. Render presets IMMEDIATELY so UI is populated
    try {
        renderPresets(data.presets);
    } catch (presetError) {
        console.error('[Solari] Failed to render presets early:', presetError);
    }

    // 3. Restore UI Toggles (Auto-Detect, Eco Mode, etc.)
    if (data.autoDetectEnabled !== undefined && autoDetectToggle) {
        autoDetectToggle.checked = data.autoDetectEnabled;
    }

    if (data.ecoMode !== undefined && ecoModeToggle) {
        ecoModeToggle.checked = data.ecoMode;
        if (data.ecoMode) document.body.classList.add('eco-mode');
        else document.body.classList.remove('eco-mode');
    }

    // Initialize i18n with saved language
    const lang = data.language || (data.appSettings && data.appSettings.language) || 'en';
    try {
        syncSettingsUI(data.appSettings); // Feed the settings UI on first boot
    } catch (err) {
        console.error('[Solari DEBUG] syncSettingsUI crashed:', err);
    }

    await handleGlobalLanguageChange(lang);
    syncSettingsUI(data.appSettings); // Sync other settings after language is ready

    // CRITICAL: Await identities before hydrating forms so the dropdown options exist!
    if (identities.length === 0) {
        try {
            await loadIdentities();
        } catch (e) {
            console.error('[Solari] Pre-load identities failed', e);
        }
    }

    // Load cached AFK config from plugin (fix for tiers reset bug)
    if (data.afkConfig) {
        if (data.afkConfig.afkTiers && data.afkConfig.afkTiers.length > 0) {
            afkTiers = data.afkConfig.afkTiers;
        }
        if (data.afkConfig.afkDisabledPresets) {
            afkDisabledPresets = data.afkConfig.afkDisabledPresets;
        }
        if (data.afkConfig.enabled !== undefined) {
            afkToggle.checked = data.afkConfig.enabled;
        }
    }

    // Load Spotify settings
    if (data.spotifySettings && data.spotifySettings.detectionMethod) {
        const methodSelect = document.getElementById('spotifyDetectionMethod');
        if (methodSelect) {
            methodSelect.value = data.spotifySettings.detectionMethod;
        }
    }

    // Populate preset dropdown for Auto-Detect mapping form
    if (addPresetToAfkDisable) {
        addPresetToAfkDisable.innerHTML = '<option value="">Selecione um preset...</option>';
        // Correct logic: Populate from the received presets list
        if (data.presets && Array.isArray(data.presets)) {
            data.presets.forEach(preset => {
                const option = document.createElement('option');
                option.value = preset.name;
                option.textContent = `🎮 ${preset.name}`;
                addPresetToAfkDisable.appendChild(option);
            });
        }
    }

    if (data.defaultActivity) {
        if (defDetailsInput) defDetailsInput.value = data.defaultActivity.details || '';
        if (defStateInput) defStateInput.value = data.defaultActivity.state || '';
    }
    // Restore last form state (checkpoint)
    if (data.lastFormState) {
        if (data.lastFormState.activityType) {
            let actType = data.lastFormState.activityType;
            if (actType === "1" || actType === 1) actType = "3";
            activityTypeSelect.value = actType;
        }
        if (data.lastFormState.details) detailsInput.value = data.lastFormState.details;
        if (data.lastFormState.detailsUrl && detailsUrlInput) detailsUrlInput.value = data.lastFormState.detailsUrl;
        if (data.lastFormState.state) stateInput.value = data.lastFormState.state;
        if (data.lastFormState.stateUrl && stateUrlInput) stateUrlInput.value = data.lastFormState.stateUrl;
        if (data.lastFormState.largeImageKey) largeImageInput.value = data.lastFormState.largeImageKey;
        if (data.lastFormState.largeImageText) largeImageTextInput.value = data.lastFormState.largeImageText;
        if (data.lastFormState.largeImageLink && largeImageLinkInput) largeImageLinkInput.value = data.lastFormState.largeImageLink;
        if (data.lastFormState.smallImageKey) smallImageInput.value = data.lastFormState.smallImageKey;
        if (data.lastFormState.smallImageText) smallImageTextInput.value = data.lastFormState.smallImageText;
        if (data.lastFormState.smallImageLink && smallImageLinkInput) smallImageLinkInput.value = data.lastFormState.smallImageLink;
        if (data.lastFormState.button1Label) button1LabelInput.value = data.lastFormState.button1Label;
        if (data.lastFormState.button1Url) button1UrlInput.value = data.lastFormState.button1Url;
        if (data.lastFormState.button2Label) button2LabelInput.value = data.lastFormState.button2Label;
        if (data.lastFormState.button2Url) button2UrlInput.value = data.lastFormState.button2Url;

        if (data.lastFormState.partyCurrent && partyCurrentInput) partyCurrentInput.value = data.lastFormState.partyCurrent;
        if (data.lastFormState.partyMax && partyMaxInput) partyMaxInput.value = data.lastFormState.partyMax;

        if (data.lastFormState.timestampMode && timestampRadios) {
            timestampRadios.forEach(radio => radio.checked = (radio.value === data.lastFormState.timestampMode));
            if (customTimestampGroup) customTimestampGroup.style.display = data.lastFormState.timestampMode === 'custom' ? 'block' : 'none';
        }

        if (data.lastFormState.customTimestamp && customTimestampInput) {
            const date = new Date(data.lastFormState.customTimestamp);
            const pad = (n) => n.toString().padStart(2, '0');
            customTimestampInput.value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        }

        if (data.lastFormState.useEndTimestamp !== undefined && useEndTimestamp) {
            useEndTimestamp.checked = data.lastFormState.useEndTimestamp;
        }

        if (data.lastFormState.activePresetName) {
            window.currentLoadedPresetName = data.lastFormState.activePresetName;
        }

        if (data.lastFormState.useProgressBar !== undefined && useProgressBarInput) {
            useProgressBarInput.checked = data.lastFormState.useProgressBar;
            if (progressBarGroup) {
                progressBarGroup.style.display = data.lastFormState.useProgressBar ? 'flex' : 'none';
            }
        }

        if (data.lastFormState.progressCurrent !== undefined && progressCurrentInput) {
            progressCurrentInput.value = data.lastFormState.progressCurrent;
        }

        if (data.lastFormState.progressTotal !== undefined && progressTotalInput) {
            progressTotalInput.value = data.lastFormState.progressTotal;
        }

        if (data.lastFormState.clientId !== undefined) {
            const presetClientIdSelect = document.getElementById('presetClientId');
            if (presetClientIdSelect) {
                presetClientIdSelect.value = data.lastFormState.clientId;
            }
        }

        if (data.lastFormState.statusEnabled !== undefined) {
            statusToggle.checked = data.lastFormState.statusEnabled;
            updateStatusDisplay(data.lastFormState.statusEnabled);
        }

        // NOTE: Form fields are restored for visual state only.
        // RPC is NOT auto-activated on startup - only auto-detect or manual "Update Status" button controls it.

        // Resolve Imgur URLs for preview if needed
        (async () => {
            let img = data.lastFormState.largeImageKey;
            let smImg = data.lastFormState.smallImageKey;
            let needsUpdate = false;

            if (img && img.includes('imgur.com') && !img.startsWith('https://i.imgur.com/')) {
                try {
                    const resolved = await ipcRenderer.invoke('resolve-imgur-url', img);
                    if (resolved) {
                        largeImageInput.value = resolved;
                        needsUpdate = true;
                    }
                } catch (e) { }
            }
            if (smImg && smImg.includes('imgur.com') && !smImg.startsWith('https://i.imgur.com/')) {
                try {
                    const resolved = await ipcRenderer.invoke('resolve-imgur-url', smImg);
                    if (resolved) {
                        smallImageInput.value = resolved;
                        needsUpdate = true;
                    }
                } catch (e) { }
            }
            if (needsUpdate) {
                // Resolution applied inside the variables, now trigger preview
                updatePreview();
            } else {
                // If it wasn't an imgur link that needed resolution, the form values
                // were populated instantly on line 757, but preview wasn't triggered yet.
                // We must trigger it now so standard image keys/URLs show up on boot!
                updatePreview();
            }
        })();
    } else {
        // If there was no restored state, trigger a preview with default empty fields
        updatePreview();
    }

    // Run validation on all fields to show visual status of loaded data
    require('./modules/ui-validator').validateAll();

    // Load auto-detect toggle state
    if (data.autoDetectEnabled !== undefined) {
        autoDetectToggle.checked = data.autoDetectEnabled;
    }

    // Load Eco Mode state
    if (data.ecoMode !== undefined && ecoModeToggle) {
        ecoModeToggle.checked = data.ecoMode;
        if (data.ecoMode) document.body.classList.add('eco-mode');
        else document.body.classList.remove('eco-mode');
    }

    // Presets were already rendered early at the start of this handler.

    // Update preview app name
    // Since identities and presets are fully loaded by now from renderPresets(),
    // we can safely pull the true Discord App Name to show in the preview header.
    if (typeof updatePreviewAppNameFromDropdown === 'function') {
        updatePreviewAppNameFromDropdown();
    }
    // Initialize Manual Mode Button state
    if (exitManualModeBtn) {
        if (data.manualMode) {
            exitManualModeBtn.style.display = 'inline-block';
        } else {
            exitManualModeBtn.style.display = 'none';
        }
    }

    // --- QUICK SETUP WIZARD CHECK ---
    // Check if setup is completed. If not, show wizard.
    if (!data.setupCompleted) {
        setTimeout(() => showSetupWizard(), 500); // Small delay for smooth fade-in
    }

    // --- Set initial RPC status in header ---
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    if (statusIndicator && statusText) {
        // Remove data-i18n to prevent applyTranslations from overwriting
        statusText.removeAttribute('data-i18n');

        if (data.rpcConnected) {
            statusIndicator.style.background = '#22c55e'; // Green
            statusIndicator.style.boxShadow = '0 0 8px #22c55e';
            statusText.textContent = t('app.connected') || 'Conectado';
            statusText.style.color = '#22c55e';
        } else {
            statusIndicator.style.background = '#f59e0b'; // Orange (reconnecting)
            statusIndicator.style.boxShadow = '0 0 8px #f59e0b';
            statusText.textContent = t('app.connecting') !== 'app.connecting' ? t('app.connecting') : 'Conectando...';
            statusText.style.color = '#f59e0b';
        }
    }

    // Initialize Extension Ad Banner
    if (typeof initExtensionAd === 'function') {
        initExtensionAd();
    }
});

ipcRenderer.on('run-setup-wizard', () => {
    showSetupWizard();
});

ipcRenderer.on('presets-updated', (event, presets) => {
    try {
        renderPresets(presets);
    } catch (presetError) {
        console.error('[Solari] Failed to render updated presets:', presetError);
    }
});

// --- RPC Status Updates (Connection Indicator in Header + Server Status Section) ---
ipcRenderer.on('rpc-status', (event, data) => {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    const rpcStatusEl = document.getElementById('rpcStatus');
    const rpcStatusDot = document.getElementById('rpcStatusDot');

    // Remove data-i18n to prevent applyTranslations from overwriting
    if (statusText) statusText.removeAttribute('data-i18n');

    if (data.connected) {
        isRpcActuallyConnected = true;

        if (data.user) {
            localStorage.setItem('solari_detected_display_name', data.user.globalName);
            localStorage.setItem('solari_detected_username', data.user.username);
            localStorage.setItem('solari_detected_avatar', data.user.avatar);
            updatePreview();
        }

        // Header indicator
        if (statusIndicator && statusText && statusToggle && statusToggle.checked) {
            statusIndicator.style.background = '#22c55e';
            statusIndicator.style.boxShadow = '0 0 8px #22c55e';
            statusText.textContent = t('app.connected') || 'Conectado';
            statusText.style.color = '#22c55e';
        }

        // Server Status section (Settings tab)
        if (rpcStatusEl) {
            rpcStatusEl.textContent = t('server.connected') || 'Conectado';
            rpcStatusEl.style.color = '#4ade80';
        }
        if (rpcStatusDot) rpcStatusDot.style.background = '#4ade80';
    } else if (data.reconnecting) {
        isRpcActuallyConnected = false;

        // Header indicator
        if (statusIndicator && statusText && statusToggle && statusToggle.checked) {
            statusIndicator.style.background = '#f59e0b';
            statusIndicator.style.boxShadow = '0 0 8px #f59e0b';
            statusText.textContent = t('app.reconnecting') !== 'app.reconnecting' ? t('app.reconnecting') : 'Reconectando...';
            statusText.style.color = '#f59e0b';
        }

        // Server Status section
        if (rpcStatusEl) {
            rpcStatusEl.textContent = t('app.reconnecting') !== 'app.reconnecting' ? t('app.reconnecting') : 'Reconectando...';
            rpcStatusEl.style.color = '#f59e0b';
        }
        if (rpcStatusDot) rpcStatusDot.style.background = '#f59e0b';
    } else {
        isRpcActuallyConnected = false;

        // Header indicator
        if (statusIndicator && statusText && statusToggle && statusToggle.checked) {
            statusIndicator.style.background = '#ef4444';
            statusIndicator.style.boxShadow = '0 0 8px #ef4444';
            statusText.textContent = t('app.disconnected') || 'Desconectado';
            statusText.style.color = '#ef4444';
        }

        // Server Status section
        if (rpcStatusEl) {
            rpcStatusEl.textContent = t('server.disconnected') || 'Desconectado';
            rpcStatusEl.style.color = '#ef4444';
        }
        if (rpcStatusDot) rpcStatusDot.style.background = '#ef4444';
    }
});

// --- Plugin List Updates ---
ipcRenderer.on('plugin-list-updated', async (event, plugins) => {
    connectedPlugins = plugins;
    renderPluginList();
});

ipcRenderer.on('blocked-list-updated', (event, blocked) => {
    blockedPlugins = blocked;
    renderTrashList();
});

ipcRenderer.on('user-info-updated', (event, user) => {
    discordUserSpan.textContent = `${user.username} (${t('app.connected')})`;
    discordUserSpan.style.color = '#4ade80';
});

ipcRenderer.on('afk-logs-updated', (event, logs) => {
    afkLogs.innerHTML = '';
    logs.forEach(log => {
        const li = document.createElement('li');
        li.innerHTML = `<span style="color: #888;">[${log.time}]</span> ${maskPaths(log.message)}`;
        afkLogs.appendChild(li);
    });
});

// Receive config from plugin and update UI
ipcRenderer.on('afk-config-updated', (event, config) => {
    // Skip update if we just saved (within 2 seconds)
    // This prevents the plugin's response from overwriting local values
    if (Date.now() - lastAfkSaveTime < 2000) {
        return;
    }

    if (config.enabled !== undefined) afkToggle.checked = config.enabled;
    if (config.afkTiers && config.afkTiers.length > 0) {
        afkTiers = config.afkTiers;
        renderAfkTiers();
    } else if (config.timeoutMinutes !== undefined) {
        // Legacy support - convert single timeout to tier
        afkTiers = [{ minutes: config.timeoutMinutes, status: config.afkStatusText || t('smartAfk.defaultStatus') || 'Away' }];
        renderAfkTiers();
    }
});

// Render AFK Tiers UI
function renderAfkTiers() {
    if (!afkTiersContainer) return;

    afkTiersContainer.innerHTML = afkTiers.map((tier, index) => `
        <div class="afk-tier-row tier-row" data-index="${index}">
            <span class="tier-label">${t('smartAfk.level')} ${index + 1}</span>
            <input type="number" class="tier-minutes" value="${tier.minutes}" min="1" max="120" style="width: 65px; text-align: center;">
            <span style="color: rgba(255,255,255,0.4); font-size: 0.85em;">${t('smartAfk.minutes')}</span>
            <input type="text" class="tier-status" value="${tier.status}" style="flex: 1;" placeholder="${t('smartAfk.statusPlaceholder')}">
            <button class="remove-tier-btn btn-delete-tier" ${afkTiers.length <= 1 ? 'disabled' : ''}>✕</button>
        </div>
    `).join('');

    // Attach remove tier listeners
    afkTiersContainer.querySelectorAll('.remove-tier-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (afkTiers.length <= 1) return;
            // Save current values from ALL rows before removing
            const rows = afkTiersContainer.querySelectorAll('.tier-row');
            rows.forEach((row, i) => {
                if (afkTiers[i]) {
                    afkTiers[i].minutes = parseInt(row.querySelector('.tier-minutes').value) || 5;
                    afkTiers[i].status = row.querySelector('.tier-status').value || t('smartAfk.defaultStatus') || 'Away';
                }
            });
            const index = parseInt(e.target.closest('.tier-row').dataset.index);
            afkTiers.splice(index, 1);
            renderAfkTiers();
        });
    });
}

// Render AFK Disabled Presets UI
function renderAfkDisabledPresets() {
    if (!afkDisabledPresetsContainer) return;

    if (afkDisabledPresets.length === 0) {
        afkDisabledPresetsContainer.innerHTML = `<p style="color: rgba(255,255,255,0.4); font-size: 0.85em;">${t('smartAfk.noPresetSelected')}</p>`;
        return;
    }

    afkDisabledPresetsContainer.innerHTML = afkDisabledPresets.map((presetName, index) => `
        <div class="preset-disable-row" data-index="${index}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; margin-bottom: 6px; background: linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.1) 100%); border: 1px solid rgba(245,158,11,0.3); border-radius: 10px; transition: all 0.2s;">
            <span style="color: #f59e0b; flex: 1;">🎮 ${presetName}</span>
            <button class="remove-preset-disable-btn" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border: none; color: white; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; font-size: 0.85em; flex: none; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
        </div>
    `).join('');

    // Attach remove listeners
    afkDisabledPresetsContainer.querySelectorAll('.remove-preset-disable-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('.preset-disable-row').dataset.index);
            afkDisabledPresets.splice(index, 1);
        });
    });
}

// Custom Modal Helper
function showConfirmModal(title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const titleEl = document.getElementById('modalTitle');
        const msgEl = document.getElementById('modalMessage');
        const confirmBtn = document.getElementById('modalConfirmBtn');
        const cancelBtn = document.getElementById('modalCancelBtn');

        titleEl.textContent = title;
        msgEl.textContent = message;

        // Update button text with translations
        const currentLang = getCurrentLang();
        const confirmText = t('dialogs.confirm');
        const cancelText = t('dialogs.cancel');

        confirmBtn.textContent = (confirmText && confirmText.toLowerCase() !== 'confirm') ? confirmText : (currentLang === 'pt-BR' ? 'Confirmar' : 'Confirm');
        cancelBtn.textContent = (cancelText && cancelText.toLowerCase() !== 'cancel') ? cancelText : (currentLang === 'pt-BR' ? 'Cancelar' : 'Cancel');

        const cleanup = () => {
            modal.classList.remove('active');
            confirmBtn.replaceWith(confirmBtn.cloneNode(true));
            cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        };

        document.getElementById('modalConfirmBtn').onclick = () => {
            cleanup();
            resolve(true);
        };

        document.getElementById('modalCancelBtn').onclick = () => {
            cleanup();
            resolve(false);
        };

        modal.classList.add('active');
    });
}

// --- Render Functions ---
function renderPresets(presets) {
    const presetList = document.getElementById('presetList');
    if (!presetList) return;

    presetList.innerHTML = '';

    // Defensive check
    if (!presets || !Array.isArray(presets)) {
        return;
    }

    localPresets = presets;

    presets.forEach((preset, index) => {
        const div = document.createElement('div');
        div.className = 'preset-item';

        let appBadge = '';
        if (preset.clientId) {
            const profile = identities.find(i => i.id === preset.clientId);
            const appName = profile ? profile.name : 'Custom App';
            appBadge = `<span class="preset-app-badge" title="Discord App: ${appName}">📱 ${appName}</span>`;
        }

        div.innerHTML = `
      <span class="preset-name">${preset.name}</span>
      ${appBadge}
      <div class="preset-actions">
          <span class="preset-replace" data-index="${index}" data-name="${preset.name}" title="Substituir com dados atuais">🔄</span>
          <span class="preset-delete" data-index="${index}" data-name="${preset.name}" title="Excluir">✖</span>
      </div>
    `;
        div.addEventListener('click', async (e) => {
            if (e.target.classList.contains('preset-delete')) {
                const presetName = e.target.dataset.name;
                const confirmMsg = (t('presets.deleteConfirmMessage') || 'Are you sure you want to delete "{name}"?').replace('{name}', presetName);
                const confirmed = await showConfirmModal(t('presets.deleteConfirmTitle') || 'Delete Preset?', confirmMsg);
                if (confirmed) {
                    ipcRenderer.send('delete-preset', parseInt(e.target.dataset.index));
                    showToast('🗑️', t('presets.deleted') || 'Preset deleted!', 'info');
                }
                return;
            }

            if (e.target.classList.contains('preset-replace')) {
                const presetName = e.target.dataset.name;
                const replaceTitle = t('presets.replaceConfirmTitle') || 'Replace Preset?';
                const replaceMsg = (t('presets.replaceConfirmMessage') || 'Overwrite "{name}" with current form data?').replace('{name}', presetName);

                const confirmed = await showConfirmModal(replaceTitle, replaceMsg);
                if (confirmed) {
                    // Gather form data (Reuse save logic)
                    const newName = presetNameInput.value || presetName; // Use input name if present, else keep original
                    const presetClientIdSelect = document.getElementById('presetClientId');
                    const newPreset = {
                        name: newName,
                        type: parseInt(activityTypeSelect.value),
                        details: detailsInput.value,
                        detailsUrl: detailsUrlInput?.value || '',
                        state: stateInput.value,
                        stateUrl: stateUrlInput?.value || '',
                        largeImageKey: largeImageInput.value,
                        largeImageText: largeImageTextInput.value,
                        largeImageLink: largeImageLinkInput?.value || '',
                        smallImageKey: smallImageInput.value,
                        smallImageText: smallImageTextInput.value,
                        smallImageLink: smallImageLinkInput?.value || '',
                        button1Label: button1LabelInput.value,
                        button1Url: button1UrlInput.value,
                        button2Label: button2LabelInput.value,
                        button2Url: button2UrlInput.value,
                        partyCurrent: parseInt(partyCurrentInput?.value) || 0,
                        partyMax: parseInt(partyMaxInput?.value) || 0,
                        timestampMode: Array.from(timestampRadios || []).find(r => r.checked)?.value || 'normal',
                        customTimestamp: customTimestampInput?.value && (Array.from(timestampRadios || []).find(r => r.checked)?.value === 'custom') ? new Date(customTimestampInput.value).getTime() : null,
                        useEndTimestamp: useEndTimestamp?.checked || false,
                        useProgressBar: useProgressBarInput?.checked || false,
                        progressCurrent: progressCurrentInput?.value || '',
                        progressTotal: progressTotalInput?.value || '',
                        clientId: presetClientIdSelect ? presetClientIdSelect.value : ''
                    };

                    ipcRenderer.send('update-preset', { index: parseInt(e.target.dataset.index), preset: newPreset });
                    showToast('🔄', t('toasts.presetUpdated'), 'success');
                }
                return;
            }

            loadPreset(preset);
        });

        presetList.appendChild(div);
    });

    if (window.ExtensionTabManager && typeof window.ExtensionTabManager.renderMappings === 'function') {
        window.ExtensionTabManager.renderMappings();
    }
}

// Update SoundBoard UI based on VB-Cable driver status
function updateSoundBoardUI() {
    if (soundboardDriverNotInstalled && soundboardReady) {
        if (vbCableDriverInstalled) {
            // Driver installed - show SoundBoard UI
            soundboardDriverNotInstalled.style.display = 'none';
            soundboardReady.style.display = 'block';

            // Initialize SoundBoard if function exists (guard against double init)
            if (typeof window.initSoundBoard === 'function' && !window.sbInitialized) {
                window.initSoundBoard();
                window.sbInitialized = true;
            }
        } else {
            // Driver not installed - show installation instructions
            soundboardDriverNotInstalled.style.display = 'flex';
            soundboardReady.style.display = 'none';
        }
    }
}

function renderPluginList() {
    // Deprecated: Rendered via PluginsTabManager now
    return;
}

function renderTrashList() {
    // Deprecated: Trash list moved/removed
    return;
}

function selectPlugin(plugin) {
    // Deprecated: UI moved to Plugin Config Modal
}

function openPluginConfig(pluginName) {
    const modal = document.getElementById('pluginConfigModal');
    if (!modal) return;

    // Hide all panels
    document.querySelectorAll('.plugin-config-panel').forEach(p => p.style.display = 'none');

    // Determine Panel ID
    let panelId = `config${pluginName.replace(/\s/g, '')}`;
    if (pluginName.toLowerCase() === 'smartafk') panelId = 'configSmartAFKDetector';
    if (pluginName.toLowerCase() === 'spotifysync') panelId = 'configSpotifySync';
    if (pluginName.toLowerCase() === 'solarinotes') panelId = 'configSolariNotes';
    if (pluginName.toLowerCase() === 'solarimessagetools') {
        panelId = 'configSolariMessageTools';
        if (typeof loadSolariMessageToolsConfig === 'function') loadSolariMessageToolsConfig();
    }

    // Auto-detect dynamic config file from disk for other/generic plugins
    const isSpecialCase = ['smartafk', 'spotifysync', 'solarinotes', 'solarimessagetools'].includes(pluginName.toLowerCase());
    if (!isSpecialCase) {
        loadGenericPluginConfig(pluginName);
    }

    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.display = 'block';
        modal.classList.add('active'); // Show modal
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closePluginConfigBtn');
    const modal = document.getElementById('pluginConfigModal');
    if (closeBtn && modal) {
        closeBtn?.addEventListener('click', () => modal.classList.remove('active'));
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    }
});

function loadPreset(preset) {
    window.currentLoadedPresetName = preset.name;
    let actType = preset.type || "0";
    if (actType === "1" || actType === 1) actType = "3";
    activityTypeSelect.value = actType;
    detailsInput.value = preset.details || '';
    if (detailsUrlInput) detailsUrlInput.value = preset.detailsUrl || '';
    stateInput.value = preset.state || '';
    if (stateUrlInput) stateUrlInput.value = preset.stateUrl || '';
    largeImageInput.value = preset.largeImageKey || '';
    largeImageTextInput.value = preset.largeImageText || '';
    if (largeImageLinkInput) largeImageLinkInput.value = preset.largeImageLink || '';
    smallImageInput.value = preset.smallImageKey || '';
    smallImageTextInput.value = preset.smallImageText || '';
    if (smallImageLinkInput) smallImageLinkInput.value = preset.smallImageLink || '';
    button1LabelInput.value = preset.button1Label || '';
    button1UrlInput.value = preset.button1Url || '';
    button2LabelInput.value = preset.button2Label || '';
    button2LabelInput.value = preset.button2Label || '';
    button2UrlInput.value = preset.button2Url || '';

    // Restore party fields
    if (partyCurrentInput) partyCurrentInput.value = preset.partyCurrent || '';
    if (partyMaxInput) partyMaxInput.value = preset.partyMax || '';

    // Restore timestamp settings
    if (timestampRadios) {
        const mode = preset.timestampMode || 'normal';
        timestampRadios.forEach(radio => radio.checked = (radio.value === mode));
        if (customTimestampGroup) customTimestampGroup.style.display = mode === 'custom' ? 'block' : 'none';
    }

    if (customTimestampInput && preset.customTimestamp) {
        // Convert timestamp number back to datetime-local format (YYYY-MM-DDTHH:mm)
        const date = new Date(preset.customTimestamp);
        const pad = (n) => n.toString().padStart(2, '0');
        customTimestampInput.value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    } else if (customTimestampInput) {
        customTimestampInput.value = '';
    }

    if (useEndTimestamp) useEndTimestamp.checked = preset.useEndTimestamp || false;

    // Restore progress bar settings
    if (useProgressBarInput) useProgressBarInput.checked = preset.useProgressBar || false;
    if (progressCurrentInput) progressCurrentInput.value = preset.progressCurrent || '';
    if (progressTotalInput) progressTotalInput.value = preset.progressTotal || '';

    // Restore Client ID selection for this preset
    const presetClientIdSelect = document.getElementById('presetClientId');
    if (presetClientIdSelect) {
        presetClientIdSelect.value = preset.clientId || '';
    }

    // Resolve Imgur URLs for preview if needed
    (async () => {
        let img = preset.largeImageKey;
        let smImg = preset.smallImageKey;
        let needsUpdate = false;

        if (img && img.includes('imgur.com') && !img.startsWith('https://i.imgur.com/')) {
            try {
                const resolved = await ipcRenderer.invoke('resolve-imgur-url', img);
                if (resolved) {
                    largeImageInput.value = resolved;
                    needsUpdate = true;
                }
            } catch (e) { }
        }
        if (smImg && smImg.includes('imgur.com') && !smImg.startsWith('https://i.imgur.com/')) {
            try {
                const resolved = await ipcRenderer.invoke('resolve-imgur-url', smImg);
                if (resolved) {
                    smallImageInput.value = resolved;
                    needsUpdate = true;
                }
            } catch (e) { }
        }
        if (needsUpdate) updatePreview();
    })();

    require('./modules/ui-validator').validateAll();
    saveFormState(); // Auto-save after loading preset

    // Update preview app name based on selected Client ID
    if (typeof updatePreviewAppNameFromDropdown === 'function') {
        updatePreviewAppNameFromDropdown();
    } else {
        updatePreview(); // Fallback to just updating preview
    }
}

// --- Checkpoint: Auto-save form state ---
function saveFormState() {
    const presetClientIdSelect = document.getElementById('presetClientId');
    const formState = {
        activityType: activityTypeSelect.value,
        details: detailsInput.value,
        detailsUrl: detailsUrlInput?.value || '',
        state: stateInput.value,
        stateUrl: stateUrlInput?.value || '',
        largeImageKey: largeImageInput.value,
        largeImageText: largeImageTextInput.value,
        largeImageLink: largeImageLinkInput?.value || '',
        smallImageKey: smallImageInput.value,
        smallImageText: smallImageTextInput.value,
        smallImageLink: smallImageLinkInput?.value || '',
        button1Label: button1LabelInput.value,
        button1Url: button1UrlInput.value,
        button2Label: button2LabelInput.value,
        button2Url: button2UrlInput.value,
        partyCurrent: parseInt(partyCurrentInput?.value) || 0,
        partyMax: parseInt(partyMaxInput?.value) || 0,
        timestampMode: Array.from(timestampRadios || []).find(r => r.checked)?.value || 'normal',
        customTimestamp: customTimestampInput?.value ? new Date(customTimestampInput.value).getTime() : null,
        useEndTimestamp: useEndTimestamp?.checked || false,
        useProgressBar: useProgressBarInput?.checked || false,
        progressCurrent: progressCurrentInput?.value || '',
        progressTotal: progressTotalInput?.value || '',
        statusEnabled: statusToggle.checked,
        clientId: presetClientIdSelect ? presetClientIdSelect.value : '',
        activePresetName: window.currentLoadedPresetName || ''
    };
    ipcRenderer.send('save-form-state', formState);
}

// Debounce to avoid saving too frequently
let saveTimeout = null;
function debouncedSaveFormState() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveFormState, 500);
}

// Document visibility listener to throttle rendering in background
document.addEventListener('visibilitychange', () => {
    isWindowVisible = !document.hidden;
    if (isWindowVisible) {
        // Force an immediate preview update when restoring visibility
        updatePreview();
    }
});

let previewDebounceTimeout = null;

function handlePreviewInput() {
    if (!isWindowVisible) return; // Skip completely if invisible
    
    // Eco Mode optimization: debounce preview rendering during typing
    if (document.body.classList.contains('eco-mode')) {
        if (previewDebounceTimeout) clearTimeout(previewDebounceTimeout);
        previewDebounceTimeout = setTimeout(updatePreview, 2500); // 2.5s debounce
    } else {
        updatePreview();
    }
}

// Add listeners to auto-save on change
[
    activityTypeSelect, detailsInput, detailsUrlInput, stateInput, stateUrlInput,
    largeImageInput, largeImageTextInput, largeImageLinkInput,
    smallImageInput, smallImageTextInput, smallImageLinkInput,
    button1LabelInput, button1UrlInput, button2LabelInput, button2UrlInput,
    useProgressBarInput, progressCurrentInput, progressTotalInput,
    useEndTimestamp, customTimestampInput
].forEach(el => {
    if (!el) return;
    el.addEventListener('input', debouncedSaveFormState);
    el.addEventListener('change', debouncedSaveFormState);
    // Also update preview on input (with throttling in Eco Mode)
    el.addEventListener('input', handlePreviewInput);
    el.addEventListener('change', updatePreview);
});

// Save client ID on dropdown change
const presetClientIdSelect = document.getElementById('presetClientId');
if (presetClientIdSelect) {
    presetClientIdSelect.addEventListener('change', debouncedSaveFormState);
}
statusToggle?.addEventListener('change', saveFormState);
ecoModeToggle?.addEventListener('change', (e) => {
    if (e.target.checked) {
        document.body.classList.add('eco-mode');
        // Store current theme and set to default
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'default';
        if (currentTheme !== 'default') {
            localStorage.setItem('solari_theme_before_eco', currentTheme);
        }
        setTheme('default');
    } else {
        document.body.classList.remove('eco-mode');
        // Restore previous theme
        const savedTheme = localStorage.getItem('solari_theme_before_eco');
        if (savedTheme) {
            setTheme(savedTheme);
            localStorage.removeItem('solari_theme_before_eco');
        }
    }
    // Save state immediately
    ipcRenderer.send('save-eco-mode', e.target.checked);
});

// ===== DISCORD PREVIEW =====
const previewActivityType = document.getElementById('previewActivityType');
const previewLargeImage = document.getElementById('previewLargeImage');
const previewSmallImage = document.getElementById('previewSmallImage');
const previewDetails = document.getElementById('previewDetails');
const previewState = document.getElementById('previewState');
const previewTime = document.getElementById('previewTime');
const previewButtons = document.getElementById('previewButtons');
const previewBtn1 = document.getElementById('previewBtn1');
const previewBtn2 = document.getElementById('previewBtn2');
const previewAppName = document.getElementById('previewAppName');

// Store app name when received from main process
let discordAppName = 'Loading...';
let globalDefaultAppName = 'Discord App'; // Store the original global app name separately
let appNameReceived = false;

ipcRenderer.on('app-name-loaded', (event, appName) => {
    globalDefaultAppName = appName; // Store as global default
    appNameReceived = true;

    if (typeof updatePreviewAppNameFromDropdown === 'function') {
        updatePreviewAppNameFromDropdown();
    } else {
        discordAppName = appName;
        if (previewAppName) {
            previewAppName.textContent = appName;
        }
        updatePreview();
    }
});

const activityTypeLabels = {
    '0': 'JOGANDO',
    '2': 'OUVINDO',
    '3': 'ASSISTINDO',
    '5': 'COMPETINDO'
};

function updatePreview() {
    if (!isWindowVisible) return; // Suspende atualizações visuais se a janela estiver oculta
    const activityType = activityTypeSelect.value;
    const details = detailsInput.value;
    const state = stateInput.value;

    // Sync time segment buttons active class
    const activeRadio = Array.from(timestampRadios || []).find(r => r.checked);
    const timestampMode = activeRadio ? activeRadio.value : 'normal';

    if (activeRadio) {
        document.querySelectorAll('.time-segment-btn').forEach(btn => {
            if (btn.getAttribute('data-value') === activeRadio.value) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Toggle timestamp options and progress bar visibility
    const isProgressActive = useProgressBarInput && useProgressBarInput.checked && (activityType === '2' || activityType === '3');

    if (timestampModeGroup) {
        timestampModeGroup.style.display = isProgressActive ? 'none' : 'block';
    }

    if (isProgressActive) {
        if (customTimestampGroup) customTimestampGroup.style.display = 'none';
        if (useEndTimestampContainer) {
            useEndTimestampContainer.style.display = 'none';
            if (useEndTimestamp) useEndTimestamp.checked = false;
        }
    } else {
        if (customTimestampGroup) {
            customTimestampGroup.style.display = timestampMode === 'custom' ? 'block' : 'none';
        }
        if (useEndTimestampContainer) {
            if (timestampMode === 'custom') {
                useEndTimestampContainer.style.display = 'flex';
            } else {
                useEndTimestampContainer.style.display = 'none';
                if (useEndTimestamp) useEndTimestamp.checked = false;
            }
        }
    }

    // Toggle progress bar container based on activity type (Watching or Listening only)
    if (useProgressBarContainer) {
        const isProgressAllowed = (activityType === '2' || activityType === '3');
        if (isProgressAllowed) {
            useProgressBarContainer.style.display = 'block';
            if (progressBarGroup) {
                progressBarGroup.style.display = (useProgressBarInput && useProgressBarInput.checked) ? 'flex' : 'none';
            }
        } else {
            useProgressBarContainer.style.display = 'none';
            if (progressBarGroup) {
                progressBarGroup.style.display = 'none';
            }
            if (useProgressBarInput) {
                useProgressBarInput.checked = false;
            }
        }
    }

    // Load and apply customized user profile options
    const displayNameEl = document.getElementById('previewUserDisplayName');
    const usernameEl = document.getElementById('previewUserTag');
    const avatarImgEl = document.getElementById('previewUserAvatarImg');
    const bannerEl = document.getElementById('previewProfileBanner');

    const savedDisplayName = localStorage.getItem('solari_preview_display_name') ||
        localStorage.getItem('solari_detected_display_name') ||
        'Gabriel';
    const savedUsername = localStorage.getItem('solari_preview_username') ||
        localStorage.getItem('solari_detected_username') ||
        'solari_user';
    const savedAvatar = localStorage.getItem('solari_preview_avatar') ||
        localStorage.getItem('solari_detected_avatar') ||
        'SolariPhotoTransparente.png';
    const savedBannerColor = localStorage.getItem('solari_preview_banner_color') || '';

    if (displayNameEl) displayNameEl.textContent = savedDisplayName;
    if (usernameEl) usernameEl.textContent = savedUsername;
    if (avatarImgEl) avatarImgEl.src = savedAvatar;
    if (bannerEl) {
        if (savedBannerColor) {
            bannerEl.style.backgroundColor = savedBannerColor;
        } else {
            bannerEl.style.backgroundColor = 'var(--primary)';
        }
    }

    const isPlaying = activityType === '0';

    if (previewActivityType) {
        const currentLang = getCurrentLang();
        let headerText = '';
        if (isPlaying) {
            const playingGame = t('preview.playingGame');
            headerText = playingGame !== 'preview.playingGame' ? playingGame : (currentLang === 'pt-BR' ? 'JOGANDO' : 'PLAYING A GAME');
        } else if (activityType === '1' || activityType === '3') {
            headerText = t('preview.watching');
        } else if (activityType === '2') {
            const listening = t('preview.listening');
            const appName = discordAppName || 'Spotify';
            headerText = `${listening} ${appName}`;
        } else if (activityType === '5') {
            headerText = t('preview.competing');
        } else {
            headerText = t('preview.playing');
        }
        previewActivityType.textContent = headerText.toUpperCase();
    }

    // Update highlighted slot (app name position)
    // Playing: show app name highlighted
    // Listening/Watching/Competing: show details highlighted
    if (previewAppName) {
        if (isPlaying && discordAppName) {
            previewAppName.textContent = discordAppName;
            previewAppName.style.display = 'block';
        } else if (!isPlaying && details) {
            // For non-Playing modes, show details in the highlighted slot
            previewAppName.textContent = details;
            previewAppName.style.display = 'block';
        } else {
            previewAppName.style.display = 'none';
        }
    }

    // Update details line (secondary position)
    // Playing: show details normally
    // Listening/Watching/Competing: show state here (since details is in highlighted slot)
    if (previewDetails) {
        if (isPlaying && details) {
            previewDetails.textContent = details;
            previewDetails.style.display = 'block';
        } else if (!isPlaying && state) {
            // For non-Playing modes, show state in this slot
            previewDetails.textContent = state;
            previewDetails.style.display = 'block';
        } else {
            previewDetails.style.display = 'none';
        }
    }

    // Update state slot
    // Playing: show state normally
    // Listening/Competing: show largeImageText if state is empty (Discord behavior)
    // Watching: don't show largeImageText
    const largeImageText = largeImageTextInput.value;

    if (previewState) {
        let stateText = '';
        if (isPlaying && state) {
            stateText = state;
        } else if ((activityType === '2' || activityType === '5') && largeImageText) {
            stateText = largeImageText;
        }



        if (stateText) {
            previewState.innerHTML = stateText;
            previewState.style.display = 'block';
            previewState.style.opacity = '1';
        } else {
            previewState.style.display = 'none';
        }
    }

    // Update progress bar
    const previewProgress = document.getElementById('previewProgress');
    const previewProgressCurrent = document.getElementById('previewProgressCurrent');
    const previewProgressTotal = document.getElementById('previewProgressTotal');
    const previewProgressBarFill = document.getElementById('previewProgressBarFill');

    if (previewProgress) {
        const useProgress = useProgressBarInput ? useProgressBarInput.checked : false;
        if (useProgress) {
            const currentStr = progressCurrentInput?.value || '00:00';
            const totalStr = progressTotalInput?.value || '00:00';

            if (previewProgressCurrent) previewProgressCurrent.textContent = currentStr;
            if (previewProgressTotal) previewProgressTotal.textContent = totalStr;

            const currentSecs = parseTimeToSeconds(currentStr);
            const totalSecs = parseTimeToSeconds(totalStr);

            let percent = 0;
            if (totalSecs > 0) {
                percent = Math.min(100, Math.max(0, (currentSecs / totalSecs) * 100));
            }
            if (previewProgressBarFill) {
                previewProgressBarFill.style.width = `${percent}%`;
            }

            previewProgress.style.display = 'flex';
            if (previewTime) previewTime.style.display = 'none';
        } else {
            previewProgress.style.display = 'none';
            if (previewTime) {
                previewTime.style.display = 'block';

                if (timestampMode === 'normal') {
                    previewTime.innerHTML = `00:00 <span data-i18n="preview.elapsed">${t('preview.elapsed') || 'decorrido'}</span>`;
                } else if (timestampMode === 'local') {
                    const now = new Date();
                    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                    const diffMs = Date.now() - startOfDay;
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffMins = Math.floor((diffMs % 3600000) / 60000);
                    const pad = (n) => n.toString().padStart(2, '0');
                    previewTime.innerHTML = `${pad(diffHours)}:${pad(diffMins)}:00 <span data-i18n="preview.elapsed">${t('preview.elapsed') || 'decorrido'}</span>`;
                } else if (timestampMode === 'custom') {
                    const customVal = customTimestampInput?.value ? new Date(customTimestampInput.value).getTime() : null;
                    const isEnd = useEndTimestamp?.checked || false;

                    if (customVal) {
                        if (isEnd) {
                            const diffMs = customVal - Date.now();
                            if (diffMs > 0) {
                                const diffMins = Math.floor(diffMs / 60000);
                                const diffSecs = Math.floor((diffMs % 60000) / 1000);
                                const pad = (n) => n.toString().padStart(2, '0');
                                previewTime.innerHTML = `${pad(diffMins)}:${pad(diffSecs)} <span data-i18n="preview.remaining">${t('preview.remaining') || 'restante'}</span>`;
                            } else {
                                previewTime.innerHTML = `00:00 <span data-i18n="preview.remaining">${t('preview.remaining') || 'restante'}</span>`;
                            }
                        } else {
                            const diffMs = Date.now() - customVal;
                            if (diffMs > 0) {
                                const diffMins = Math.floor(diffMs / 60000);
                                const diffSecs = Math.floor((diffMs % 60000) / 1000);
                                const pad = (n) => n.toString().padStart(2, '0');
                                previewTime.innerHTML = `${pad(diffMins)}:${pad(diffSecs)} <span data-i18n="preview.elapsed">${t('preview.elapsed') || 'decorrido'}</span>`;
                            } else {
                                previewTime.innerHTML = `00:00 <span data-i18n="preview.elapsed">${t('preview.elapsed') || 'decorrido'}</span>`;
                            }
                        }
                    } else {
                        if (isEnd) {
                            previewTime.innerHTML = `05:00 <span data-i18n="preview.remaining">${t('preview.remaining') || 'restante'}</span>`;
                        } else {
                            previewTime.innerHTML = `00:00 <span data-i18n="preview.elapsed">${t('preview.elapsed') || 'decorrido'}</span>`;
                        }
                    }
                }
            }
        }
    }

    // Update large image
    if (previewLargeImage) {
        const largeUrl = largeImageInput.value;
        if (largeUrl && (largeUrl.startsWith('http://') || largeUrl.startsWith('https://'))) {
            previewLargeImage.innerHTML = `<img src="${largeUrl}" onerror="this.parentElement.innerHTML='<span>🎮</span>'" />`;
        } else {
            previewLargeImage.innerHTML = '<span>🎮</span>';
        }
        // Re-add small image element
        const smallImageDiv = document.createElement('div');
        smallImageDiv.className = 'discord-preview-small-image preview-map-hoverable';
        smallImageDiv.id = 'previewSmallImage';

        const smallUrl = smallImageInput.value;
        if (smallUrl && (smallUrl.startsWith('http://') || smallUrl.startsWith('https://'))) {
            smallImageDiv.innerHTML = `<img src="${smallUrl}" onerror="this.parentElement.innerHTML='<span>⭐</span>'" />`;
            smallImageDiv.style.display = 'flex';
        } else if (smallUrl) {
            smallImageDiv.innerHTML = '<span>⭐</span>';
            smallImageDiv.style.display = 'flex';
        } else {
            smallImageDiv.style.display = 'none';
        }
        previewLargeImage.appendChild(smallImageDiv);
    }

    // Update buttons
    if (previewButtons && previewBtn1 && previewBtn2) {
        const hasBtn1 = button1LabelInput.value && button1UrlInput.value;
        const hasBtn2 = button2LabelInput.value && button2UrlInput.value;

        if (hasBtn1 || hasBtn2) {
            previewButtons.style.display = 'flex';

            if (hasBtn1) {
                previewBtn1.textContent = button1LabelInput.value;
                previewBtn1.style.display = 'block';
            } else {
                previewBtn1.style.display = 'none';
            }

            if (hasBtn2) {
                previewBtn2.textContent = button2LabelInput.value;
                previewBtn2.style.display = 'block';
            } else {
                previewBtn2.style.display = 'none';
            }
        } else {
            previewButtons.style.display = 'none';
        }
    }

    // Check if we should show/hide browser extension ad banner
    if (typeof checkShowExtensionAd === 'function') {
        checkShowExtensionAd();
    }
}

// --- Browser Extension Advertisement Banner ---
const STREAMING_CLIENT_IDS = [
    '1461859944390332496', // YouTube
    '1520432295255871498', // YouTube Music
    '1461860225765347472', // Twitch
    '1461881250498482409', // Netflix
    '1511842632240730112'  // Prime Video
];

function checkShowExtensionAd() {
    const banner = document.getElementById('extensionAdBanner');
    const select = document.getElementById('presetClientId');
    if (!banner || !select) return;

    const selectedValue = select.value;
    let activeClientId = '';

    if (selectedValue) {
        const selectedIdentity = identities.find(i => i.id === selectedValue);
        if (selectedIdentity) {
            activeClientId = selectedIdentity.clientId;
        } else {
            // It might be a factory client ID direct value
            activeClientId = selectedValue;
        }
    }

    const isStreamingPreset = STREAMING_CLIENT_IDS.includes(activeClientId);
    const isDismissed = localStorage.getItem('solari_extension_ad_dismissed') === 'true';
    const hasConnectedOnce = localStorage.getItem('solari_extension_connected_once') === 'true';

    if (isStreamingPreset && !isDismissed && !hasConnectedOnce) {
        banner.style.display = 'flex';
    } else {
        banner.style.display = 'none';
    }
}

function initExtensionAd() {
    const banner = document.getElementById('extensionAdBanner');
    const linkBtn = document.getElementById('extensionAdLinkBtn');
    const tutorialBtn = document.getElementById('extensionAdTutorialBtn');
    const dismissBtn = document.getElementById('extensionAdDismissBtn');

    if (!banner) return;

    if (linkBtn) {
        linkBtn.replaceWith(linkBtn.cloneNode(true));
        const newLinkBtn = document.getElementById('extensionAdLinkBtn');
        newLinkBtn.addEventListener('click', () => {
            ipcRenderer.send('open-external-url', 'https://chromewebstore.google.com/detail/ekhlmpampeikcibfdmokiibgdcfendgp');
        });
    }

    if (tutorialBtn) {
        tutorialBtn.replaceWith(tutorialBtn.cloneNode(true));
        const newTutorialBtn = document.getElementById('extensionAdTutorialBtn');
        newTutorialBtn.addEventListener('click', () => {
            ipcRenderer.send('open-external-url', 'https://solarirpc.com/guides#plugins-ext-pt');
        });
    }

    if (dismissBtn) {
        dismissBtn.replaceWith(dismissBtn.cloneNode(true));
        const newDismissBtn = document.getElementById('extensionAdDismissBtn');
        newDismissBtn.addEventListener('click', () => {
            localStorage.setItem('solari_extension_ad_dismissed', 'true');
            banner.style.display = 'none';
        });
    }

    checkShowExtensionAd();
}

function initProfileCustomizer() {
    const avatarContainer = document.querySelector('.discord-avatar-container');
    const bannerEl = document.getElementById('previewProfileBanner');
    const modal = document.getElementById('discordProfileModal');

    if (!avatarContainer || !bannerEl || !modal) return;

    // Inputs in modal
    const inputDisplayName = document.getElementById('profileCustomDisplayName');
    const inputUsername = document.getElementById('profileCustomUsername');
    const inputAvatar = document.getElementById('profileCustomAvatar');
    const inputBannerColor = document.getElementById('profileCustomBannerColor');
    const inputBannerHex = document.getElementById('profileCustomBannerHex');

    // Buttons in modal
    const saveBtn = document.getElementById('profileCustomSaveBtn');
    const cancelBtn = document.getElementById('profileCustomCancelBtn');
    const resetBtn = document.getElementById('profileCustomResetBtn');

    // Sync Color picker and Hex text input
    if (inputBannerColor && inputBannerHex) {
        inputBannerColor.addEventListener('input', () => {
            inputBannerHex.value = inputBannerColor.value.toUpperCase();
        });
        inputBannerHex.addEventListener('input', () => {
            let hex = inputBannerHex.value.trim();
            if (hex && !hex.startsWith('#')) {
                hex = '#' + hex;
            }
            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                inputBannerColor.value = hex;
            }
        });
    }

    // Show modal when clicking avatar, banner, or display name
    const openModal = () => {
        if (inputDisplayName) {
            inputDisplayName.value = localStorage.getItem('solari_preview_display_name') || '';
            inputDisplayName.placeholder = localStorage.getItem('solari_detected_display_name') || 'Gabriel';
        }
        if (inputUsername) {
            inputUsername.value = localStorage.getItem('solari_preview_username') || '';
            inputUsername.placeholder = localStorage.getItem('solari_detected_username') || 'solari_user';
        }
        if (inputAvatar) {
            inputAvatar.value = localStorage.getItem('solari_preview_avatar') || '';
            inputAvatar.placeholder = localStorage.getItem('solari_detected_avatar') || 'SolariPhotoTransparente.png';
        }

        const currentBanner = localStorage.getItem('solari_preview_banner_color') || '#F97316';
        if (inputBannerColor) inputBannerColor.value = currentBanner;
        if (inputBannerHex) inputBannerHex.value = currentBanner.toUpperCase();

        modal.classList.add('active');
    };

    const avatarEl = document.getElementById('previewUserAvatar');
    const handleTrigger = (e) => {
        e.preventDefault();
        openModal();
    };

    const handleKeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModal();
        }
    };

    if (avatarEl) {
        avatarEl.addEventListener('click', handleTrigger);
        avatarEl.addEventListener('keydown', handleKeydown);
    } else {
        avatarContainer.addEventListener('click', handleTrigger);
    }

    if (bannerEl) {
        bannerEl.addEventListener('click', handleTrigger);
        bannerEl.addEventListener('keydown', handleKeydown);
    }

    const displayNameEl = document.getElementById('previewUserDisplayName');
    if (displayNameEl) {
        displayNameEl.addEventListener('click', handleTrigger);
        displayNameEl.addEventListener('keydown', handleKeydown);
    }

    // Close modal
    const closeModal = () => {
        modal.classList.remove('active');
    };

    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Save settings
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (inputDisplayName) {
                const val = inputDisplayName.value.trim();
                if (val) localStorage.setItem('solari_preview_display_name', val);
                else localStorage.removeItem('solari_preview_display_name');
            }
            if (inputUsername) {
                const val = inputUsername.value.trim();
                if (val) localStorage.setItem('solari_preview_username', val);
                else localStorage.removeItem('solari_preview_username');
            }
            if (inputAvatar) {
                const val = inputAvatar.value.trim();
                if (val) localStorage.setItem('solari_preview_avatar', val);
                else localStorage.removeItem('solari_preview_avatar');
            }

            if (inputBannerColor) {
                let bannerColor = inputBannerColor.value;
                localStorage.setItem('solari_preview_banner_color', bannerColor);
            }

            closeModal();
            updatePreview();
        });
    }

    // Reset to defaults
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('solari_preview_display_name');
            localStorage.removeItem('solari_preview_username');
            localStorage.removeItem('solari_preview_avatar');
            localStorage.removeItem('solari_preview_banner_color');

            closeModal();
            updatePreview();
        });
    }
}


// Initialize preview on page load
setTimeout(updatePreview, 100);

// --- Event Handlers ---


// Timestamp mode change listener - show/hide custom datetime field
timestampRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        customTimestampGroup.style.display = radio.value === 'custom' && radio.checked ? 'block' : 'none';
        debouncedSaveFormState();
        updatePreview();
    });
});

// Handle time segment buttons clicking
const timeSegmentBtns = document.querySelectorAll('.time-segment-btn');
timeSegmentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-value');
        const radio = document.querySelector(`input[name="timestampMode"][value="${val}"]`);
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
        }

        timeSegmentBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Toggle progress bar inputs
useProgressBarInput?.addEventListener('change', () => {
    if (progressBarGroup) {
        progressBarGroup.style.display = useProgressBarInput.checked ? 'flex' : 'none';
    }
    updatePreview();
});

// Helper to parse time in MM:SS, H:MM:SS or raw seconds
function parseTimeToSeconds(str) {
    if (!str) return 0;
    str = str.trim();
    if (!str) return 0;

    // Check if it's just raw seconds
    if (/^\d+$/.test(str)) {
        return parseInt(str, 10);
    }

    // Check MM:SS or H:MM:SS
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

// Update Status
updateBtn?.addEventListener('click', async () => {
    // Validate first
    uiValidator.validateAll();
    const hasErrors = document.querySelectorAll('.fv-error').length > 0;
    if (hasErrors) {
        showToast('⚠️', t('presence.validationError') || 'Please correct form errors.', 'warning');
        return;
    }

    // Disable button to prevent double-clicks
    updateBtn.disabled = true;
    updateBtn.textContent = t('presence.updating') || 'Updating...';

    try {
        let imageUrl = largeImageInput.value || undefined;
        let smallImageUrl = smallImageInput.value || undefined;

        // If large image is an Imgur album/page URL, ask main process to resolve it
        if (imageUrl && imageUrl.includes('imgur.com') && !imageUrl.startsWith('https://i.imgur.com/')) {
            updateBtn.textContent = t('presence.fetchingImage');
            try {
                imageUrl = await ipcRenderer.invoke('resolve-imgur-url', imageUrl);
                if (imageUrl) {
                    largeImageInput.value = imageUrl;
                }
            } catch (err) {
                console.error('[Solari] Failed to resolve large image URL:', err);
            }
            updateBtn.textContent = t('presence.updating') || 'Updating...';
        }

        // If small image is an Imgur album/page URL, ask main process to resolve it
        if (smallImageUrl && smallImageUrl.includes('imgur.com') && !smallImageUrl.startsWith('https://i.imgur.com/')) {
            updateBtn.textContent = t('presence.fetchingSmallImage');
            try {
                smallImageUrl = await ipcRenderer.invoke('resolve-imgur-url', smallImageUrl);
                if (smallImageUrl) {
                    smallImageInput.value = smallImageUrl;
                }
            } catch (err) {
                console.error('[Solari] Failed to resolve small image URL:', err);
            }
            updateBtn.textContent = t('presence.updating') || 'Updating...';
        }

        // Build buttons array
        const buttons = [];
        if (button1LabelInput.value && button1UrlInput.value) {
            buttons.push({ label: button1LabelInput.value, url: button1UrlInput.value });
        }
        if (button2LabelInput.value && button2UrlInput.value) {
            buttons.push({ label: button2LabelInput.value, url: button2UrlInput.value });
        }

        // Get party size values
        const partyCurrent = parseInt(partyCurrentInput.value) || 0;
        const partyMax = parseInt(partyMaxInput.value) || 0;

        // Get timestamp mode
        let timestampMode = 'normal';
        timestampRadios.forEach(radio => {
            if (radio.checked) timestampMode = radio.value;
        });

        // Get custom timestamp if selected
        let customTimestamp = null;
        if (timestampMode === 'custom' && customTimestampInput.value) {
            customTimestamp = new Date(customTimestampInput.value).getTime();
        }

        // Calculate progress bar timestamps if active
        let startTimestamp = undefined;
        let endTimestamp = undefined;
        const useProgressBar = useProgressBarInput ? useProgressBarInput.checked : false;
        if (useProgressBar) {
            const currentSecs = parseTimeToSeconds(progressCurrentInput?.value);
            const totalSecs = parseTimeToSeconds(progressTotalInput?.value);
            if (totalSecs > 0) {
                const now = Date.now();
                startTimestamp = now - (currentSecs * 1000);
                endTimestamp = startTimestamp + (totalSecs * 1000);
            }
        }

        const activity = {
            type: parseInt(activityTypeSelect.value),
            details: detailsInput.value || undefined,
            detailsUrl: detailsUrlInput?.value || undefined,
            state: stateInput.value || undefined,
            stateUrl: stateUrlInput?.value || undefined,
            useProgressBar: useProgressBar,
            progressCurrent: progressCurrentInput?.value || undefined,
            progressTotal: progressTotalInput?.value || undefined,
            startTimestamp: startTimestamp,
            endTimestamp: endTimestamp,
            largeImageKey: imageUrl,
            largeImageText: largeImageTextInput.value || undefined,
            largeImageLink: largeImageLinkInput?.value || undefined,
            smallImageKey: smallImageUrl,
            smallImageText: smallImageTextInput.value || undefined,
            smallImageLink: smallImageLinkInput?.value || undefined,
            buttons: buttons.length > 0 ? buttons : undefined,
            partyCurrent: partyCurrent > 0 ? partyCurrent : undefined,
            partyMax: partyMax > 0 ? partyMax : undefined,
            timestampMode: timestampMode,
            customTimestamp: customTimestamp,
            useEndTimestamp: useEndTimestamp ? useEndTimestamp.checked : false,
            clientId: document.getElementById('presetClientId')?.value || undefined,
            instance: false,
            presetName: window.currentLoadedPresetName || undefined
        };
        ipcRenderer.send('update-activity', activity);
        uiContext.forceManualMode();
    } catch (err) {
        console.error('[Solari] Error updating presence:', err);
        updateBtn.disabled = false;
        updateBtn.textContent = t('presence.updateStatus') || 'Update Status';
        showToast('❌', 'Error updating status', 'danger');
    }
});

// Listener for update-activity completion
ipcRenderer.on('activity-updated', (event, success) => {
    if (updateBtn) {
        updateBtn.disabled = false;
        if (success) {
            if (!isRpcActuallyConnected) {
                showToast('⚠️', t('presence.queuedNoConnection') || 'Status queued, but Discord is disconnected!', 'warning');
            } else {
                showToast('✅', t('presence.updated') || 'Status updated!', 'success');
            }
            updateBtn.textContent = t('presence.updated') || 'Updated!';
        } else {
            showToast('⚠️', t('presence.rpcDisabled') || 'Rich Presence is disabled in settings!', 'warning');
            updateBtn.textContent = t('presence.updateStatus') || 'Update Status';
        }
        setTimeout(() => {
            updateBtn.textContent = t('presence.updateStatus') || 'Update Status';
        }, 2000);
    }
});

// Auto-convert Imgur links on blur
async function handleImgurConversion(inputElement) {
    const url = inputElement.value;
    if (url && url.includes('imgur.com') && !url.startsWith('https://i.imgur.com/')) {
        try {
            const resolved = await ipcRenderer.invoke('resolve-imgur-url', url);
            if (resolved) {
                inputElement.value = resolved;
                showToast('🪄', t('toasts.imgurConverted'), 'success');

                // Dispatch input/change events to trigger core listeners
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                inputElement.dispatchEvent(new Event('change', { bubbles: true }));

                // Force immediate preview update and debounced state save
                if (typeof updatePreview === 'function') updatePreview();
                if (typeof debouncedSaveFormState === 'function') debouncedSaveFormState();
            }
        } catch (err) {
            console.error('[Solari] Auto-convert failed:', err);
        }
    }
}

if (largeImageInput) {
    largeImageInput?.addEventListener('blur', () => handleImgurConversion(largeImageInput));
}
if (smallImageInput) {
    smallImageInput?.addEventListener('blur', () => handleImgurConversion(smallImageInput));
}

// Reset to Default
resetBtn?.addEventListener('click', () => {
    window.currentLoadedPresetName = null;
    activityTypeSelect.value = "0";
    detailsInput.value = '';
    if (detailsUrlInput) detailsUrlInput.value = '';
    stateInput.value = '';
    if (stateUrlInput) stateUrlInput.value = '';
    largeImageInput.value = '';
    largeImageTextInput.value = '';
    if (largeImageLinkInput) largeImageLinkInput.value = '';
    smallImageInput.value = '';
    smallImageTextInput.value = '';
    if (smallImageLinkInput) smallImageLinkInput.value = '';
    button1LabelInput.value = '';
    button1UrlInput.value = '';
    button2LabelInput.value = '';
    button2UrlInput.value = '';

    // Clear progress bar inputs as well
    if (useProgressBarInput) useProgressBarInput.checked = false;
    if (progressCurrentInput) progressCurrentInput.value = '';
    if (progressTotalInput) progressTotalInput.value = '';

    ipcRenderer.send('reset-activity');
    showToast('🔄', t('presence.reset') || 'Reset!', 'info');
    resetBtn.textContent = t('presence.reset');
    setTimeout(() => resetBtn.textContent = t('presence.resetToDefault'), 2000);

    // Update preview and save form state
    updatePreview();
    saveFormState();
});

// Save Default (if fallback section exists)
if (saveDefaultBtn) {
    saveDefaultBtn?.addEventListener('click', () => {
        let timestampMode = 'normal';
        timestampRadios?.forEach(r => { if (r.checked) timestampMode = r.value; });
        const defaultActivity = {
            details: defDetailsInput?.value || '',
            state: defStateInput?.value || '',
            partyCurrent: parseInt(partyCurrentInput?.value) || 0,
            partyMax: parseInt(partyMaxInput?.value) || 0,
            timestampMode: timestampMode,
            customTimestamp: (timestampMode === 'custom' && customTimestampInput?.value) ? new Date(customTimestampInput.value).getTime() : null,
            useEndTimestamp: useEndTimestamp?.checked || false
        };
        ipcRenderer.send('save-default', defaultActivity);
        showToast('💾', t('fallback.saved') || 'Default saved!', 'success');
        saveDefaultBtn.textContent = t('fallback.saved');
        setTimeout(() => saveDefaultBtn.textContent = t('fallback.save'), 2000);
    });
}

// Save Preset
savePresetBtn?.addEventListener('click', () => {
    const name = presetNameInput.value;
    if (!name) return;
    const presetClientIdSelect = document.getElementById('presetClientId');
    const preset = {
        name,
        type: parseInt(activityTypeSelect.value),
        details: detailsInput.value,
        detailsUrl: detailsUrlInput?.value || '',
        state: stateInput.value,
        stateUrl: stateUrlInput?.value || '',
        largeImageKey: largeImageInput.value,
        largeImageText: largeImageTextInput.value,
        largeImageLink: largeImageLinkInput?.value || '',
        smallImageKey: smallImageInput.value,
        smallImageText: smallImageTextInput.value,
        smallImageLink: smallImageLinkInput?.value || '',
        button1Label: button1LabelInput.value,
        button1Url: button1UrlInput.value,
        button2Label: button2LabelInput.value,
        button2Url: button2UrlInput.value,
        partyCurrent: parseInt(partyCurrentInput?.value) || 0,
        partyMax: parseInt(partyMaxInput?.value) || 0,
        timestampMode: Array.from(timestampRadios || []).find(r => r.checked)?.value || 'normal',
        customTimestamp: customTimestampInput?.value && (Array.from(timestampRadios || []).find(r => r.checked)?.value === 'custom') ? new Date(customTimestampInput.value).getTime() : null,
        useEndTimestamp: useEndTimestamp?.checked || false,
        useProgressBar: useProgressBarInput?.checked || false,
        progressCurrent: progressCurrentInput?.value || '',
        progressTotal: progressTotalInput?.value || '',
        clientId: presetClientIdSelect ? presetClientIdSelect.value : '' // Per-preset Client ID
    };
    ipcRenderer.send('save-preset', preset);
    presetNameInput.value = '';
});

// Export Presets
const exportPresetsBtn = document.getElementById('exportPresetsBtn');
const importPresetsBtn = document.getElementById('importPresetsBtn');

if (exportPresetsBtn) {
    exportPresetsBtn?.addEventListener('click', async () => {
        const result = await ipcRenderer.invoke('export-presets');
        if (result.success) {
            showToast('📤', t('presets.exported') || 'Presets exported successfully!', 'success');
            exportPresetsBtn.textContent = t('presets.exportSuccess') || '✅ Exportado!';
            setTimeout(() => exportPresetsBtn.textContent = '📤 ' + (t('presets.export') || 'Exportar'), 2000);
        }
    });
}

if (importPresetsBtn) {
    importPresetsBtn?.addEventListener('click', async () => {
        const result = await ipcRenderer.invoke('import-presets');
        if (result.success) {
            showToast('📥', t('presets.imported') || 'Presets imported successfully!', 'success');
            importPresetsBtn.textContent = t('presets.importSuccess') || '✅ Importado!';
            setTimeout(() => importPresetsBtn.textContent = '📥 ' + (t('presets.import') || 'Importar'), 2000);
        } else if (result.error) {
            showToast('❌', result.error, 'error');
            importPresetsBtn.textContent = t('presets.importError') || '❌ Erro';
            setTimeout(() => importPresetsBtn.textContent = '📥 ' + (t('presets.import') || 'Importar'), 2000);
        }
    });
}

// Send Toast
sendToastBtn?.addEventListener('click', () => {
    const message = toastMessageInput.value;
    if (!message) return;
    ipcRenderer.send('send-toast', message);
    sendToastBtn.textContent = t('solariPlugin.sent');
    setTimeout(() => sendToastBtn.textContent = t('solariPlugin.send'), 2000);
    toastMessageInput.value = '';
});

// Test Connection
testConnectionBtn?.addEventListener('click', () => {
    testResult.textContent = t('connection.testing');
    testResult.style.color = '#fff';
    try {
        const ws = new WebSocket('ws://127.0.0.1:6464');
        ws.onopen = () => {
            testResult.textContent = t('connection.success');
            testResult.style.color = '#4ade80';
            ws.close();
        };
        ws.onerror = () => {
            testResult.textContent = t('connection.failed');
            testResult.style.color = '#ef4444';
        };
    } catch (e) {
        testResult.textContent = 'Erro: ' + e.message;
        testResult.style.color = '#ef4444';
    }
});

// Export Debug Logs
const exportLogsBtn = document.getElementById('exportLogsBtn');
if (exportLogsBtn) {
    exportLogsBtn?.addEventListener('click', async () => {
        exportLogsBtn.textContent = '⏳ Exportando...';
        const result = await ipcRenderer.invoke('export-logs');
        if (result.success) {
            exportLogsBtn.textContent = '✅ Exportado!';
        } else {
            exportLogsBtn.textContent = '📋 Exportar Logs';
        }
        setTimeout(() => exportLogsBtn.textContent = '📋 Exportar Logs', 2000);
    });
}

// Toggle RPC
statusToggle?.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    ipcRenderer.send('toggle-activity', isEnabled);
    updateStatusDisplay(isEnabled);
});

function updateStatusDisplay(isEnabled) {
    if (isEnabled) {
        // When enabled: show actual RPC state instead of always "Connected"
        if (isRpcActuallyConnected) {
            statusIndicator.style.background = '#22c55e';
            statusIndicator.style.animation = 'pulse 2s infinite';
            statusText.textContent = t('app.connected');
            statusText.style.color = '#22c55e';
        } else {
            // Enabled but not yet connected — show "Connecting..." (orange)
            statusIndicator.style.background = '#f59e0b';
            statusIndicator.style.animation = 'pulse 2s infinite';
            statusText.textContent = t('app.connecting') !== 'app.connecting' ? t('app.connecting') : 'Conectando...';
            statusText.style.color = '#f59e0b';
        }
        document.querySelector('.rpc-config').style.opacity = '1';
        document.querySelector('.rpc-config').style.pointerEvents = 'all';
    } else {
        statusIndicator.style.background = '#ef4444';
        statusIndicator.style.animation = 'none';
        statusText.textContent = t('app.disconnected');
        statusText.style.color = '#ef4444';
        document.querySelector('.rpc-config').style.opacity = '0.5';
        document.querySelector('.rpc-config').style.pointerEvents = 'none';
    }
}

// SmartAFK Handlers
// Helper to collect current tier values from UI inputs
function collectCurrentTierValues() {
    if (!afkTiersContainer) return;
    const rows = afkTiersContainer.querySelectorAll('.tier-row');
    rows.forEach((row, index) => {
        if (afkTiers[index]) {
            afkTiers[index].minutes = parseInt(row.querySelector('.tier-minutes').value) || 5;
            afkTiers[index].status = row.querySelector('.tier-status').value || "Ausente";
        }
    });
}

// Add Tier Button
if (addAfkTierBtn) {
    addAfkTierBtn?.addEventListener('click', () => {
        // Save current values before adding new tier
        collectCurrentTierValues();

        const lastTier = afkTiers[afkTiers.length - 1];
        afkTiers.push({
            minutes: (lastTier?.minutes || 5) + 5,
            status: `AFK ${t('smartAfk.level')} ${afkTiers.length + 1}`
        });
        renderAfkTiers();
    });
}

// Save Button
saveAfkBtn?.addEventListener('click', () => {
    // Collect all tier values from UI
    const rows = afkTiersContainer.querySelectorAll('.tier-row');

    const newTiers = [];
    rows.forEach((row, index) => {
        const minutes = parseInt(row.querySelector('.tier-minutes').value) || 5;
        const status = row.querySelector('.tier-status').value || t('smartAfk.defaultStatus') || 'Away';
        newTiers.push({ minutes, status });
    });

    // Sort by minutes ascending
    newTiers.sort((a, b) => a.minutes - b.minutes);
    afkTiers = newTiers;

    const settings = {
        enabled: afkToggle.checked,
        timeoutMinutes: newTiers[0]?.minutes || 5,
        afkStatusText: newTiers[0]?.status || t('smartAfk.defaultStatus') || 'Away',
        afkTiers: newTiers,
        afkDisabledPresets: afkDisabledPresets // Presets that disable AFK
    };
    ipcRenderer.send('update-afk-settings', settings);
    lastAfkSaveTime = Date.now(); // Ignore config updates for 2 seconds

    if (afkSaveStatus) {
        afkSaveStatus.style.display = 'block';
        setTimeout(() => afkSaveStatus.style.display = 'none', 2000);
    }
});

// Add Preset to Disable AFK Button
if (addPresetToDisableBtn) {
    addPresetToDisableBtn?.addEventListener('click', () => {
        const selectedPreset = addPresetToAfkDisable.value;
        if (!selectedPreset) return;

        // Don't add duplicates
        if (afkDisabledPresets.includes(selectedPreset)) {
            return;
        }

        afkDisabledPresets.push(selectedPreset);
        renderAfkDisabledPresets();
        addPresetToAfkDisable.value = ''; // Reset dropdown
    });
}

// Exit Manual Mode Button Logic
const exitManualModeBtn = document.getElementById('exitManualModeBtn');
if (exitManualModeBtn) {
    exitManualModeBtn?.addEventListener('click', () => {
        ipcRenderer.send('exit-manual-mode');
        // Optimistically hide
        exitManualModeBtn.style.display = 'none';
        showToast('↩️', t('toasts.returningToAutoDetect'), 'info');
    });

    // Listen for manual mode status from main process
    ipcRenderer.on('manual-mode-changed', (event, isActive) => {
        exitManualModeBtn.style.display = isActive ? 'inline-block' : 'none';
    });
}

// Render initial tiers on load
renderAfkTiers();

// Auto-Detection Handlers
autoDetectToggle?.addEventListener('change', (e) => {
    ipcRenderer.send('toggle-autodetect', e.target.checked);
    uiContext.setAutoDetect(e.target.checked);
});

autoDetectSettingsBtn?.addEventListener('click', () => {
    ipcRenderer.send('open-autodetect-settings');
});

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
    // Init i18n first with correct language to avoid text flash
    try {
        const lang = await ipcRenderer.invoke('get-current-language');
        await initI18n(lang || 'en');
        updateUILanguage(); // v1.11.2: Force manual link injections on startup
    } catch (e) {
        await initI18n('en');
        updateUILanguage();
    }

    updateStatusDisplay(true);
    initProfileCustomizer();
    renderAfkTiers(); // Render initial tiers (default or loaded)
    renderAfkDisabledPresets(); // Render selected presets that disable AFK

    // Initialize SoundBoard - check for VB-Cable driver
    try {
        const result = await ipcRenderer.invoke('soundboard:check-driver-installed');
        vbCableDriverInstalled = result.installed;
        updateSoundBoardUI();
    } catch (e) {
        console.error('[Solari] Error checking VB-Cable driver:', e);
    }
});

// System AFK Indicator
ipcRenderer.on('system-afk-update', (event, data) => {
    if (afkIndicator) {
        if (data.isIdle) {
            afkIndicator.style.display = 'flex';
        } else {
            afkIndicator.style.display = 'none';
        }
    }
});

// Listen for global language changes
document.addEventListener('languageChanged', (e) => {
    updateUILanguage();
    populatePresetClientIdDropdown();
    updatePreview(); // Re-render preview to apply new text and restore dynamic app name
});

// --- Language Support ---
// Update all UI text elements when language changes
function updateUILanguage() {
    // Plugin Manager h2 (preserve emoji)
    const pluginH2 = document.querySelector('.plugin-manager h2');
    if (pluginH2) pluginH2.textContent = '🔌 ' + t('plugins.title');

    // Presets h2 (preserve info icon)
    const presetsH2 = document.querySelector('.presets h2');
    if (presetsH2) {
        presetsH2.innerHTML = `<span>${t('presets.title')}</span><span class="field-info" data-i18n-title="presets.infoTooltip" title="${t('presets.infoTooltip')}">ⓘ</span>`;
    }

    // App Profiles h2
    const identitiesH2 = document.querySelector('.identity-manager h2');
    if (identitiesH2) {
        identitiesH2.innerHTML = `🆔 <span>${t('identities.title')}</span><span class="field-info" data-i18n-title="identities.infoTooltip" title="${t('identities.infoTooltip')}">ⓘ</span>`;
    }

    // Header toggle labels
    const toggleLabels = document.querySelectorAll('.toggle-label');
    if (toggleLabels[0]) toggleLabels[0].textContent = t('app.enabled');

    // Form labels  
    const labels = {
        'label[for="activityType"]': t('presence.activityType'),
        'label[for="details"]': t('presence.details'),
        'label[for="state"]': t('presence.state'),
        'label[for="largeImageText"]': t('presence.largeImageText'),
        'label[for="largeImageLink"]': t('presence.largeImageLink'),
        'label[for="smallImageText"]': t('presence.smallImageText'),
        'label[for="smallImageLink"]': t('presence.smallImageLink'),
        'label[for="button1Label"]': t('presence.button1Label'),
        'label[for="button1Url"]': t('presence.button1Url'),
        'label[for="button2Label"]': t('presence.button2Label'),
        'label[for="button2Url"]': t('presence.button2Url'),
        'label[for="defDetails"]': t('fallback.details'),
        'label[for="defState"]': t('fallback.state'),
    };

    for (const [selector, text] of Object.entries(labels)) {
        const el = document.querySelector(selector);
        if (el && text) el.textContent = text;
    }

    // Large Image and Small Image labels (these are just <label> without for)
    const rpcConfig = document.querySelector('.rpc-config');
    if (rpcConfig) {
        const allLabels = rpcConfig.querySelectorAll('label');
        allLabels.forEach(lbl => {
            const text = lbl.textContent.trim();
            if (text.includes('Imagem Grande') || text.includes('Large Image')) {
                if (!lbl.getAttribute('for')) lbl.textContent = t('presence.largeImage');
            }
            if (text.includes('Imagem Pequena') || text.includes('Small Image')) {
                if (!lbl.getAttribute('for')) lbl.textContent = t('presence.smallImage');
            }
            if (text.includes('Botões') || text.includes('Buttons')) {
                lbl.innerHTML = '🔗 ' + t('presence.buttons');
            }
        });
    }

    // Placeholders
    const placeholders = {
        '#details': t('presence.detailsPlaceholder'),
        '#state': t('presence.statePlaceholder'),
        '#largeImage': t('presence.largeImagePlaceholder'),
        '#largeImageText': t('presence.largeImageTextPlaceholder'),
        '#largeImageLink': t('presence.largeImageLinkPlaceholder'),
        '#smallImage': t('presence.smallImagePlaceholder'),
        '#smallImageText': t('presence.smallImageTextPlaceholder'),
        '#smallImageLink': t('presence.smallImageLinkPlaceholder'),
        '#presetName': t('presets.namePlaceholder'),
        '#defDetails': t('fallback.detailsPlaceholder'),
        '#defState': t('fallback.statePlaceholder'),
        '#toastMessage': t('solariPlugin.messagePlaceholder'),
        '#spotifyButton1Label': t('spotify.button1Placeholder'),
        '#spotifyButton2Label': t('spotify.button2Placeholder'),
        '#spotifyButton1Url': t('spotify.urlPlaceholder'),
        '#spotifyButton2Url': t('spotify.urlPlaceholder'),
    };

    for (const [selector, placeholder] of Object.entries(placeholders)) {
        const el = document.querySelector(selector);
        if (el && placeholder) el.placeholder = placeholder;
    }

    // Buttons
    const buttons = {
        '#updateBtn': t('presence.updateStatus'),
        '#resetBtn': t('presence.resetToDefault'),
        '#saveDefaultBtn': t('fallback.save'),
        '#savePresetBtn': t('presets.save'),
        '#testConnectionBtn': t('connection.testConnection'),
        '#sendToastBtn': t('solariPlugin.send'),
        '#addAfkTierBtn': t('smartAfk.addLevel'),
        '#saveAfkBtn': t('smartAfk.saveConfig'),
        '#addPresetToDisableBtn': t('smartAfk.add'),
    };

    for (const [selector, text] of Object.entries(buttons)) {
        const el = document.querySelector(selector);
        if (el && text) el.textContent = text;
    }

    // Activity type options
    const activityOptions = document.querySelectorAll('#activityType option');
    activityOptions.forEach(opt => {
        const key = opt.getAttribute('data-i18n');
        if (key) opt.textContent = t(key);
    });

    // Status text in header - Use REAL RPC connection state, not just toggle state
    if (statusToggle.checked && isRpcActuallyConnected) {
        statusText.textContent = t('app.connected');
        statusText.style.color = '#10b981'; // Green
    } else if (statusToggle.checked && !isRpcActuallyConnected) {
        statusText.textContent = t('app.connecting') !== 'app.connecting' ? t('app.connecting') : 'Conectando...';
        statusText.style.color = '#f59e0b'; // Orange
    } else {
        statusText.textContent = t('app.disconnected');
        statusText.style.color = '#ef4444'; // Red
    }

    // Server Status section
    const serverTitle = document.querySelector('.server-status-card h3');
    if (serverTitle) serverTitle.textContent = t('server.title');

    const wsStatusLabel = document.querySelector('#wsStatus')?.previousElementSibling;
    if (wsStatusLabel) wsStatusLabel.textContent = t('server.ws');

    const wsStatus = document.getElementById('wsStatus');
    if (wsStatus) wsStatus.textContent = t('server.running');

    const rpcStatus = document.getElementById('rpcStatus');
    if (rpcStatus) rpcStatus.textContent = isRpcActuallyConnected ? t('app.connected') : t('app.disconnected');

    // Trash section
    const trashTitle = document.querySelector('#trashContainer h3');
    if (trashTitle) trashTitle.textContent = t('plugins.trash');

    // Fallback hint
    const fallbackHint = document.querySelector('.default-config .hint');
    if (fallbackHint) fallbackHint.textContent = t('fallback.hint');

    // Image hints with dynamic link injection
    const largeImageHintEl = document.querySelector('[data-i18n="presence.largeImageHint"]');
    if (largeImageHintEl) {
        const hintText = t('presence.largeImageHint');
        largeImageHintEl.innerHTML = hintText.replace('Imgur', '<a href="https://imgur.com/upload" target="_blank" style="color: #ff9966; text-decoration: underline; cursor: pointer;">Imgur</a>');
    }

    const smallImageHintEl = document.querySelector('[data-i18n="presence.smallImageHint"]');
    if (smallImageHintEl) {
        smallImageHintEl.textContent = t('presence.smallImageHint');
    }

    const largeImageWarningEl = document.querySelector('[data-i18n="presence.largeImageWarning"]');
    if (largeImageWarningEl) {
        largeImageWarningEl.textContent = t('presence.largeImageWarning');
    }

    // SmartAFK config panel
    const afkConfigTitle = document.querySelector('#configSmartAFKDetector h2');
    if (afkConfigTitle) afkConfigTitle.textContent = '⚙️ ' + t('smartAfk.title');

    const afkToggleLabel = document.querySelector('#configSmartAFKDetector .toggle-label');
    if (afkToggleLabel) afkToggleLabel.textContent = t('smartAfk.enableDetector');

    const afkLabels = document.querySelectorAll('#configSmartAFKDetector .form-group > label');
    afkLabels.forEach(lbl => {
        if (lbl.textContent.includes('NÍVEIS') || lbl.textContent.includes('LEVELS')) {
            lbl.textContent = '📊 ' + t('smartAfk.afkLevels');
        }
        if (lbl.textContent.includes('PRESETS QUE') || lbl.textContent.includes('PRESETS THAT')) {
            lbl.textContent = '🎮 ' + t('smartAfk.disablePresets');
        }
    });

    // SmartAFK hints
    const afkHints = document.querySelectorAll('#configSmartAFKDetector .hint');
    afkHints.forEach(hint => {
        if (hint.textContent.includes('múltiplos') || hint.textContent.includes('multiple')) {
            hint.textContent = t('smartAfk.afkLevelsHint');
        }
        if (hint.textContent.includes('presets estiver') || hint.textContent.includes('presets is active')) {
            hint.textContent = t('smartAfk.disablePresetsHint');
        }
    });

    // SmartAFK save status
    const afkSaveStatus = document.getElementById('afkSaveStatus');
    if (afkSaveStatus) afkSaveStatus.textContent = t('smartAfk.saved');

    // SmartAFK logs title
    const afkLogsTitle = document.querySelector('#configSmartAFKDetector .afk-logs-container h3');
    if (afkLogsTitle) afkLogsTitle.textContent = '📜 ' + t('smartAfk.activityLogs');

    // SmartAFK preset dropdown option
    const presetDropdown = document.getElementById('addPresetToAfkDisable');
    if (presetDropdown && presetDropdown.options[0]) {
        presetDropdown.options[0].textContent = t('smartAfk.selectPreset');
    }

    // Solari Plugin panel
    const solariTitle = document.querySelector('#configSolari h2');
    if (solariTitle) solariTitle.textContent = '⚙️ ' + t('solariPlugin.title');

    const solariUserLabel = document.querySelector('#configSolari .info-card strong');
    if (solariUserLabel) solariUserLabel.textContent = t('solariPlugin.discordUser');

    const toastLabel = document.querySelector('label[for="toastMessage"]');
    if (toastLabel) toastLabel.textContent = t('solariPlugin.sendNotification');

    // Dynamic Log Translation (Hybrid Approach) - Translate existing logs
    const logMap = {
        'Conectado ao Solari': 'smartAfk.connectedToSolari',
        'Connected to Solari': 'smartAfk.connectedToSolari',
        'Desconectado do Solari': 'smartAfk.disconnectedFromSolari',
        'Disconnected from Solari': 'smartAfk.disconnectedFromSolari',
        'Voltou do AFK': 'smartAfk.returnedFromAFK',
        'Returned from AFK': 'smartAfk.returnedFromAFK',
        'Atividade do sistema detectada (via Solari)': 'smartAfk.systemActivityDetected',
        'System activity detected (via Solari)': 'smartAfk.systemActivityDetected',
        'Bem-vindo de volta!': 'smartAfk.welcomeBack',
        'Welcome back!': 'smartAfk.welcomeBack',
        'SmartAFK: Bem-vindo de volta!': 'smartAfk.welcomeBack', // With prefix just in case
        'SmartAFK: Welcome back!': 'smartAfk.welcomeBack',
        '(limpo)': 'smartAfk.cleared',
        '(cleared)': 'smartAfk.cleared',
        'Sucesso! Servidor rodando.': 'connection.success',
        'Success! Server running.': 'connection.success',
        'Falha ao conectar.': 'connection.failed',
        'Failed to connect.': 'connection.failed',
        'Testando...': 'connection.testing',
        'Testing...': 'connection.testing',
        'Configurações atualizadas pelo App': 'smartAfk.configUpdatedByApp',
        'Config updated by App': 'smartAfk.configUpdatedByApp'
    };

    const afkLogsList = document.getElementById('afkLogs');
    if (afkLogsList) {
        const listItems = afkLogsList.querySelectorAll('li');
        listItems.forEach(li => {
            // Log structure: <span style="...">[time]</span> Message Text
            // We need to target the text node after the span
            const timeSpan = li.querySelector('span');
            let textNode = null;

            if (timeSpan) {
                // Look for text node after span
                for (const node of li.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
                        textNode = node;
                        break;
                    }
                }
            } else {
                // Maybe just text?
                if (li.firstChild && li.firstChild.nodeType === Node.TEXT_NODE) {
                    textNode = li.firstChild;
                }
            }

            if (textNode) {
                let currentText = textNode.textContent.trim();

                // Direct match
                if (logMap[currentText]) {
                    textNode.textContent = ' ' + t(logMap[currentText]);
                }
                // Partial match for dynamic messages
                else {
                    const prefixes = [
                        { key: 'smartAfk.statusChangedTo', en: 'Status changed to:', pt: 'Status alterado para:' },
                        { key: 'smartAfk.customStatusChangedTo', en: 'Custom status changed to:', pt: 'Custom status alterado para:' },
                        { key: 'smartAfk.levelUp', en: 'Moved to Level', pt: 'Subiu para Nível' } // Simplified matching
                    ];

                    for (const p of prefixes) {
                        if (currentText.startsWith(p.en) || currentText.startsWith(p.pt)) {
                            const matchedPrefix = currentText.startsWith(p.en) ? p.en : p.pt;
                            const value = currentText.substring(matchedPrefix.length);
                            textNode.textContent = ' ' + t(p.key) + value;
                            break;
                        }
                    }
                }
            }
        });
    }

    // Re-render dynamic elements that use t()
    renderAfkTiers();
    renderAfkDisabledPresets();

    // Refresh plugin connection status with correct translations
    updateSpotifyConnectionStatus(spotifyConnected);
    updateSmartAFKConnectionStatus(smartAfkConnected);

    // Update Plugins Tab (BD Status and Cards)
    if (typeof PluginsTabManager !== 'undefined') {
        PluginsTabManager.checkBD();
        PluginsTabManager.loadPlugins(false, true);
    }
}

// Centralized Language Manager for Renderer
async function handleGlobalLanguageChange(lang) {
    if (!lang) return;

    // Activate Lock
    isSyncingLanguage = true;
    if (languageSyncTimeout) clearTimeout(languageSyncTimeout);

    // 1. Sync local settings object immediately
    if (typeof appSettings !== 'undefined') {
        appSettings.language = lang;
    }

    // 2. Sync Settings Dropdown (Visual Sync)
    if (typeof settingsLanguage !== 'undefined' && settingsLanguage) {
        settingsLanguage.value = lang;
    }

    // 3. Update i18n Engine (Load JSON + Apply data-i18n attributes)
    if (typeof initI18n === 'function') {
        await initI18n(lang);
    }

    // 4. Update Manual UI Labels (Dynamic Text)
    if (typeof updateUILanguage === 'function') {
        updateUILanguage();
    }

    // Release Lock after 1 second (Buffer for any incoming IPC syncs)
    languageSyncTimeout = setTimeout(() => {
        isSyncingLanguage = false;
    }, 1000);
}

// Listen for language change from main process
ipcRenderer.on('language-changed', async (event, lang) => {
    await handleGlobalLanguageChange(lang);
});

// ===== THEME SYSTEM =====
const themeBtns = document.querySelectorAll('.theme-btn');

function setTheme(theme) {
    // If Eco Mode is active and the requested theme is not default, block and notify
    if (document.body.classList.contains('eco-mode') && theme !== 'default') {
        const warningText = t('toasts.ecoThemeLock') !== 'toasts.ecoThemeLock' 
            ? t('toasts.ecoThemeLock') 
            : 'Desative o Modo Eco para alterar o tema!';
        showToast('⚠️', warningText, 'warning');
        return;
    }

    // Remove theme attribute for default theme
    if (theme === 'default') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }

    // Update button states
    themeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });

    // Save theme preference
    ipcRenderer.send('save-theme', theme);
}

// Theme button click handlers
themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setTheme(btn.dataset.theme);
    });
});

// Load saved theme
ipcRenderer.on('theme-loaded', (event, theme) => {
    if (document.body.classList.contains('eco-mode')) {
        if (theme && theme !== 'default') {
            localStorage.setItem('solari_theme_before_eco', theme);
        }
        setTheme('default');
    } else {
        if (theme) setTheme(theme);
    }
});

// Request saved theme on load
ipcRenderer.send('get-theme');

// ===== THEME MENU POPUP =====
const themeMenuBtn = document.getElementById('themeMenuBtn');
const themeMenuPopup = document.getElementById('themeMenuPopup');
const themeMenuCustomCssBtn = document.getElementById('themeMenuCustomCssBtn');

console.log('[ThemeMenu] Elements initialized:', {
    themeMenuBtn: !!themeMenuBtn,
    themeMenuPopup: !!themeMenuPopup,
    themeMenuCustomCssBtn: !!themeMenuCustomCssBtn
});

if (themeMenuBtn && themeMenuPopup) {
    themeMenuBtn.addEventListener('click', (e) => {
        console.log('[ThemeMenu] Button clicked!');
        e.stopPropagation();
        const isOpen = themeMenuPopup.style.display === 'flex';
        console.log('[ThemeMenu] Toggle display. Current isOpen:', isOpen);
        themeMenuPopup.style.display = isOpen ? 'none' : 'flex';
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!themeMenuPopup.contains(e.target) && !themeMenuBtn.contains(e.target)) {
            themeMenuPopup.style.display = 'none';
        }
    });
}

if (themeMenuCustomCssBtn) {
    themeMenuCustomCssBtn.addEventListener('click', () => {
        if (themeMenuPopup) {
            themeMenuPopup.style.display = 'none';
        }
        document.getElementById('customCssBtn')?.click();
    });
}

// ===== THEME GALLERY MODAL =====
const themeMenuMoreThemesBtn = document.getElementById('themeMenuMoreThemesBtn');
const themeGalleryModal = document.getElementById('themeGalleryModal');
const closeThemeGalleryBtn = document.getElementById('closeThemeGalleryBtn');

if (themeMenuMoreThemesBtn && themeGalleryModal) {
    themeMenuMoreThemesBtn.addEventListener('click', () => {
        if (themeMenuPopup) {
            themeMenuPopup.style.display = 'none';
        }
        themeGalleryModal.classList.add('active');
    });
}

if (closeThemeGalleryBtn && themeGalleryModal) {
    closeThemeGalleryBtn.addEventListener('click', () => {
        themeGalleryModal.classList.remove('active');
    });

    themeGalleryModal.addEventListener('click', (e) => {
        if (e.target === themeGalleryModal) {
            themeGalleryModal.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && themeGalleryModal.classList.contains('active')) {
            themeGalleryModal.classList.remove('active');
        }
    });
}

// ===== TOAST NOTIFICATIONS =====
const toastContainer = document.getElementById('toastContainer');

function showToast(title, message, type = 'info', duration = 3700) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.pointerEvents = 'none';

    let iconHtml = '';
    let titleText = title;

    // Detect if title is a single emoji or short status icon string
    const isEmoji = title && [...title].length <= 2;

    if (isEmoji) {
        iconHtml = `<span class="toast-icon-emoji" style="font-size: 1.4rem; filter: drop-shadow(0 0 6px currentColor);">${title}</span>`;
        const typeTitles = {
            success: t('toasts.success') || 'Sucesso',
            error: t('toasts.error') || 'Erro',
            danger: t('toasts.error') || 'Erro',
            warning: t('modal.confirmTitle') || 'Aviso',
            info: 'Solari'
        };
        titleText = typeTitles[type] || 'Solari';
    } else {
        iconHtml = getToastSvgIcon(type);
    }

    toast.innerHTML = `
        <div style="display: flex; gap: 14px; align-items: flex-start; width: 100%;">
            <div class="toast-icon-container" style="flex-shrink: 0; display: flex; align-items: center; justify-content: center; height: 100%;">
                ${iconHtml}
            </div>
            <div class="toast-body" style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                <div class="toast-title" style="margin: 0 0 2px 0; font-weight: 700; font-family: 'Space Grotesk', sans-serif; font-size: 0.95rem; color: #fff;">${titleText}</div>
                <div class="toast-message" style="margin: 0; font-size: 0.82rem; color: rgba(255, 255, 255, 0.65); line-height: 1.4; font-family: 'Space Grotesk', sans-serif; word-break: break-word;">${message}</div>
            </div>
        </div>
        <div class="toast-progress-bar" style="position: absolute; bottom: 0; left: 0; height: 3px; width: 100%; transform-origin: left; transform: scaleX(1); transition: transform ${duration}ms linear;"></div>
    `;

    toastContainer.appendChild(toast);

    // Animate progress bar scale down
    requestAnimationFrame(() => {
        const bar = toast.querySelector('.toast-progress-bar');
        if (bar) {
            bar.style.transform = 'scaleX(0)';
        }
    });

    // Remove toast with slide out transition
    setTimeout(() => {
        toast.classList.add('removing');
        toast.style.setProperty('opacity', '0', 'important');
        toast.style.setProperty('transform', 'translateX(50px) scale(0.98)', 'important');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// Hover detection for intangible toasts (reduces opacity on hover)
document.addEventListener('mousemove', (e) => {
    const toasts = document.querySelectorAll('.toast:not(.removing)');
    if (toasts.length === 0) return;

    toasts.forEach(toast => {
        const rect = toast.getBoundingClientRect();
        const isHovered = e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom;
        if (isHovered) {
            toast.style.setProperty('opacity', '0.15', 'important');
        } else {
            toast.style.removeProperty('opacity');
        }
    });
});

function getToastSvgIcon(type) {
    switch (type) {
        case 'success':
            return `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.4));">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            `;
        case 'error':
        case 'danger':
            return `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.4));">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
            `;
        case 'warning':
            return `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.4));">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            `;
        case 'info':
        default:
            return `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.4));">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
            `;
    }
}

// Listen for toast from main process
ipcRenderer.on('show-toast', (event, data) => {
    // Support both direct message and translation key
    const message = data.messageKey ? t(data.messageKey) : data.message;
    const title = data.titleKey ? t(data.titleKey) : (data.title || 'Solari');
    showToast(title, message, data.type || 'info');
});

// Hide browser extension ad banner when the extension connects
ipcRenderer.on('extension-connected-event', () => {
    localStorage.setItem('solari_extension_connected_once', 'true');
    checkShowExtensionAd();
});

// Show toast when preset is auto-loaded (game detected)
ipcRenderer.on('preset-auto-loaded', (event, presetName) => {
    showToast('🎮 ' + t('autoDetect.title'), `Preset: ${presetName}`, 'success');
    statusText.textContent = `Auto: ${presetName}`;

    setTimeout(() => {
        if (statusToggle.checked) {
            // Use actual RPC state instead of always "Connected"
            updateStatusDisplay(true);
        }
    }, 3000);
});

// ===== SPOTIFY SYNC =====

// Request initial Spotify data
ipcRenderer.send('get-spotify-data');

// Handle Spotify data loaded
ipcRenderer.on('spotify-data-loaded', (event, data) => {
    if (data.settings) {
        if (spotifySyncToggle) spotifySyncToggle.checked = data.settings.enabled !== false;
        if (spotifyRpcToggle) spotifyRpcToggle.checked = data.settings.showInRichPresence !== false;

        if (data.settings && data.schema) {
            renderPluginSettings(data.schema, data.settings);
        }
    }
    if (data.prioritySettings) {
        if (priorityAutoDetect) priorityAutoDetect.value = data.prioritySettings.autoDetect || 1;
        if (priorityManual) priorityManual.value = data.prioritySettings.manualPreset || 2;
        if (prioritySpotify) prioritySpotify.value = data.prioritySettings.spotify || 3;
        if (priorityDefault) priorityDefault.value = data.prioritySettings.defaultFallback || 4;
    }
    if (data.track) {
        updateSpotifyNowPlaying(data.track);
    }
});

// Handle Spotify track updates
ipcRenderer.on('spotify-track-updated', (event, track) => {
    updateSpotifyNowPlaying(track);
});

// Handle Spotify config updates (plugin connected)
ipcRenderer.on('spotify-config-updated', (event, config) => {
    spotifyConnected = true;
    updateSpotifyConnectionStatus(true);
});

// ===== SOLARI NOTES =====

// Handle Notes data loaded
ipcRenderer.on('notes-data-loaded', (event, data) => {
    if (data.settings && data.schema) {
        renderPluginSettings(data.schema, data.settings, 'notes', 'solari-notes-settings-container');
    }
});

// Handle Notes status updates
ipcRenderer.on('notes-status-update', (event, status) => {
});

// Update plugin list to check for SpotifySync
ipcRenderer.on('plugin-list-updated', (event, plugins) => {
    // Original plugin list handler continues...
    const hasSpotify = plugins.some(p => p.name === 'SpotifySync');
    const hasSmartAFK = plugins.some(p => p.name === 'SmartAFKDetector');

    if (hasSpotify !== spotifyConnected) {
        spotifyConnected = hasSpotify;
        updateSpotifyConnectionStatus(hasSpotify);
    }
    if (hasSmartAFK !== smartAfkConnected) {
        smartAfkConnected = hasSmartAFK;
        updateSmartAFKConnectionStatus(hasSmartAFK);
    }
});

// Update Spotify connection status UI
function updateSpotifyConnectionStatus(connected) {
    // Show/hide entire Spotify Sync section based on connection
    const spotifySyncSection = document.getElementById('spotifySyncSection');
    if (spotifySyncSection) {
        spotifySyncSection.style.display = connected ? 'block' : 'none';
    }

    if (spotifyStatusDot) {
        spotifyStatusDot.style.background = connected ? '#1DB954' : '#ef4444';
    }
    if (spotifyPluginStatus) {
        spotifyPluginStatus.textContent = connected ? t('plugins.connected') : t('plugins.disconnected');
        spotifyPluginStatus.style.color = connected ? '#1DB954' : '#ef4444';
    }
}

// Update SmartAFK connection status UI
function updateSmartAFKConnectionStatus(connected) {
    const smartAfkStatusDot = document.getElementById('smartAfkStatusDot');
    const smartAfkPluginStatus = document.getElementById('smartAfkPluginStatus');

    if (smartAfkStatusDot) {
        smartAfkStatusDot.style.background = connected ? '#1DB954' : '#ef4444';
    }
    if (smartAfkPluginStatus) {
        smartAfkPluginStatus.textContent = connected ? t('plugins.connected') : t('plugins.disconnected');
        smartAfkPluginStatus.style.color = connected ? '#1DB954' : '#ef4444';
    }
}

// Update Now Playing display
function updateSpotifyNowPlaying(track) {
    if (!spotifyNowPlaying) return;

    if (track && track.title) {
        spotifyNowPlaying.style.display = 'block';
        if (spotifyTrackTitle) spotifyTrackTitle.textContent = track.title;
        if (spotifyTrackArtist) spotifyTrackArtist.textContent = track.artist || '';
        if (spotifyPlayPauseBtn) spotifyPlayPauseBtn.textContent = '⏸';
    } else {
        spotifyNowPlaying.style.display = 'none';
        if (spotifyPlayPauseBtn) spotifyPlayPauseBtn.textContent = '▶';
    }
}

// Spotify toggle handlers
if (spotifySyncToggle) {
    spotifySyncToggle?.addEventListener('change', () => {
        ipcRenderer.send('update-spotify-settings', { enabled: spotifySyncToggle.checked });
    });
}

if (spotifyRpcToggle) {
    spotifyRpcToggle?.addEventListener('change', () => {
        ipcRenderer.send('update-spotify-settings', { showInRichPresence: spotifyRpcToggle.checked });
    });
}

// Spotify control buttons
if (spotifyPrevBtn) {
    spotifyPrevBtn?.addEventListener('click', () => {
        ipcRenderer.send('spotify-control', 'previous');
    });
}

if (spotifyPlayPauseBtn) {
    spotifyPlayPauseBtn?.addEventListener('click', () => {
        ipcRenderer.send('spotify-control', 'pause');
    });
}

if (spotifyNextBtn) {
    spotifyNextBtn?.addEventListener('click', () => {
        ipcRenderer.send('spotify-control', 'next');
    });
}

// Priority settings
if (savePriorityBtn) {
    savePriorityBtn?.addEventListener('click', () => {
        const priorities = {
            autoDetect: parseInt(priorityAutoDetect?.value) || 1,
            spotify: parseInt(prioritySpotify?.value) || 2,
            defaultFallback: parseInt(priorityDefault?.value) || 3
        };
        ipcRenderer.send('update-priority-settings', priorities);
        showToast('✅', t('presets.saved') || 'Saved!', 'success');
    });
}

// Spotify Buttons save
if (saveSpotifyButtonsBtn) {
    saveSpotifyButtonsBtn?.addEventListener('click', () => {
        const spotifyBtn1Label = document.getElementById('spotifyButton1Label');
        const spotifyBtn1Url = document.getElementById('spotifyButton1Url');
        const spotifyBtn2Label = document.getElementById('spotifyButton2Label');
        const spotifyBtn2Url = document.getElementById('spotifyButton2Url');

        ipcRenderer.send('update-spotify-settings', {
            button1Label: spotifyBtn1Label?.value || '',
            button1Url: spotifyBtn1Url?.value || '',
            button2Label: spotifyBtn2Label?.value || '',
            button2Url: spotifyBtn2Url?.value || ''
        });

        showToast('✅', t('presets.saved') || 'Saved!', 'success');
    });
}

// SpotifySync Plugin Config Panel Handlers

// Dynamic Settings Renderer
function renderPluginSettings(schema, currentConfig, pluginName = 'spotify', containerId = 'spotify-settings-container') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = ''; // Clear existing

    // Inject Styles once (Generic for all plugins using this system)
    if (!document.getElementById('plugin-dynamic-styles')) {
        const style = document.createElement('style');
        style.id = 'plugin-dynamic-styles';
        style.textContent = `
            .sp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); }
            .sp-title { font-size: 1.4em; font-weight: 600; color: #fff; }
            .sp-version { font-size: 0.8em; opacity: 0.6; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; }
            .sp-status-card { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
            .sp-status-dot { width: 10px; height: 10px; border-radius: 50%; }
            .sp-section-card { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-top: 20px; }
            .sp-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
            .sp-section-title { font-size: 1.1em; font-weight: 600; color: #fff; display: flex; align-items: center; gap: 8px; }
            .sp-section-badge { font-size: 0.75em; padding: 2px 8px; border-radius: 12px; text-transform: uppercase; font-weight: bold; }
            .sp-section-desc { font-size: 0.9em; color: rgba(255,255,255,0.6); margin-bottom: 16px; }
            .sp-step-card { background: rgba(255,255,255,0.03); border-left: 3px solid var(--primary); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
            .sp-step-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
            .sp-step-num { font-weight: bold; color: var(--primary); font-size: 1.1em; }
            .sp-step-title { font-weight: 600; color: #eee; }
            .sp-step-text { font-size: 0.9em; color: rgba(255,255,255,0.7); margin-bottom: 10px; line-height: 1.4; }
            .sp-copy-box { display: flex; gap: 8px; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); }
            .sp-copy-input { background: transparent; border: none; color: #fff; flex: 1; font-family: monospace; font-size: 0.9em; }
            .sp-copy-input:focus { outline: none; }
            .sp-btn { border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: background 0.2s; }
            .sp-btn-primary { background: var(--primary); color: #fff; padding: 12px; width: 100%; font-size: 1em; }
            .sp-btn-primary:hover { opacity: 0.9; }
            .sp-btn-copy { background: rgba(255,255,255,0.1); color: #fff; padding: 4px 10px; font-size: 0.85em; }
            .sp-slider-label { display: flex; flex-direction: column; gap: 8px; padding: 12px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; margin-bottom: 8px; }
            .sp-slider-header { display: flex; justify-content: space-between; align-items: center; }
            .sp-slider-val { font-family: monospace; color: var(--primary); font-weight: bold; }
            .sp-slider { -webkit-appearance: none; width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 5px; outline: none; cursor: pointer; }
            .sp-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: var(--primary); border-radius: 50%; cursor: pointer; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
        `;
        document.head.appendChild(style);
    }

    schema.forEach(item => {
        const el = createSettingElement(item, currentConfig, pluginName);
        if (el) container.appendChild(el);
    });
}

function parseMarkdownLinks(text) {
    if (!text) return text;
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #1DB954; text-decoration: none; border-bottom: 1px solid #1DB954;">$1</a>');
}

function createSettingElement(item, config, pluginName = 'spotify') {
    const ipcChannel = `update-${pluginName.toLowerCase()}-plugin-settings`;
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '12px';

    switch (item.type) {
        // --- NEW RICH UI TYPES ---
        case 'custom_header':
            const header = document.createElement('div');
            header.className = 'sp-header';
            header.innerHTML = `
                <div class="sp-title">${item.icon || ''} ${item.title}</div>
                ${item.version ? `<div class="sp-version">${item.version}</div>` : ''}
            `;
            return header;

        case 'status_card':
            const sc = document.createElement('div');
            sc.className = 'sp-status-card';
            const isActive = item.status === 'connected';
            sc.innerHTML = `
                <div class="sp-status-dot" style="background: ${isActive ? '#1DB954' : '#ef4444'}"></div>
                <div style="flex: 1; font-weight: 500; color: ${isActive ? '#1DB954' : '#ef4444'}">
                    ${item.label}: ${isActive ? 'Conectado' : 'Desconectado'}
                </div>
            `;
            return sc;

        case 'section_card':
            const sec = document.createElement('div');
            sec.className = 'sp-section-card';

            const isConnected = item.status === 'connected';
            const bgBadge = isConnected ? 'rgba(29, 185, 84, 0.2)' : 'rgba(239, 68, 68, 0.2)';
            const colorBadge = isConnected ? '#1DB954' : '#ef4444';

            sec.innerHTML = `
                <div class="sp-section-header">
                    <div class="sp-section-title">💎 ${item.title}</div>
                    <div class="sp-section-badge" style="background: ${bgBadge}; color: ${colorBadge}">
                        ${item.statusLabel || item.status}
                    </div>
                </div>
                <div class="sp-section-desc">${parseMarkdownLinks(item.description)}</div>
            `;

            if (item.children) {
                item.children.forEach(child => {
                    const childEl = createSettingElement(child, config);
                    if (childEl) sec.appendChild(childEl);
                });
            }
            return sec;

        case 'step_card':
            const step = document.createElement('div');
            step.className = 'sp-step-card';

            // Build inner content safely
            const headerHtml = `
                <div class="sp-step-header">
                    <span class="sp-step-num">${item.step}.</span>
                    <span class="sp-step-title">${item.title}</span>
                </div>
                <div class="sp-step-text">${parseMarkdownLinks(item.text)}</div>
            `;
            step.innerHTML = headerHtml;

            // Optional: Copy Box OR Input Config
            if (item.copyValue || item.inputConfig) {
                const box = document.createElement('div');
                box.className = 'sp-copy-box';

                const inp = document.createElement('input');
                inp.className = 'sp-copy-input';

                if (item.copyValue) {
                    inp.value = item.copyValue;
                    inp.readOnly = true;
                } else if (item.inputConfig) {
                    inp.value = item.inputConfig.value;
                    inp.placeholder = item.inputConfig.placeholder || '';
                    if (item.inputConfig.secret) inp.type = 'password';

                    // Auto-save
                    inp?.addEventListener('blur', () => {
                        if (inp.value !== item.inputConfig.value) {
                            ipcRenderer.send(ipcChannel, { [item.inputConfig.key]: inp.value.trim() });
                            showToast('💾', 'Configuração Salva', 'success');
                        }
                    });
                }

                box.appendChild(inp);

                // Actions for Input
                if (item.inputConfig && item.inputConfig.secret) {
                    const toggleBtn = document.createElement('button');
                    toggleBtn.className = 'sp-btn sp-btn-copy';
                    toggleBtn.innerHTML = '👁️';
                    toggleBtn.title = 'Toggle Visibility';
                    toggleBtn.style.background = 'transparent';
                    toggleBtn.style.fontSize = '1.1em';
                    toggleBtn.onclick = () => {
                        inp.type = inp.type === 'password' ? 'text' : 'password';
                    };
                    box.appendChild(toggleBtn);
                }

                const copyBtn = document.createElement('button');
                copyBtn.className = 'sp-btn sp-btn-copy';
                copyBtn.textContent = 'Copiar';
                copyBtn.onclick = () => {
                    navigator.clipboard.writeText(inp.value);
                    copyBtn.textContent = 'Copiado!';
                    setTimeout(() => copyBtn.textContent = 'Copiar', 2000);
                };
                box.appendChild(copyBtn);

                step.appendChild(box);
            }

            // Optional: Action Button
            if (item.action) {
                const actBtn = document.createElement('button');
                actBtn.className = 'sp-btn sp-btn-primary';
                actBtn.textContent = item.action.label;
                actBtn.style.marginTop = '8px';
                actBtn.onclick = () => {
                    if (item.action.action === 'start_auth') ipcRenderer.send('spotify-login');
                };
                step.appendChild(actBtn);
            }

            // Optional: Input + Action
            if (item.input) {
                const wrap = document.createElement('div');
                wrap.style.marginTop = '8px';

                const inp = document.createElement('input');
                inp.className = 'input-styled'; // Use main app style
                inp.style.width = '100%';
                inp.style.marginBottom = '8px';
                inp.style.background = 'rgba(0,0,0,0.4)';
                inp.style.color = '#fff'; // Fix visibility issue
                inp.style.padding = '8px';
                inp.style.border = '1px solid rgba(255,255,255,0.1)';
                inp.style.borderRadius = '4px';
                inp.placeholder = item.input.placeholder;

                const btn = document.createElement('button');
                btn.className = 'sp-btn sp-btn-primary';
                btn.textContent = item.input.btnLabel;
                btn.onclick = () => {
                    if (inp.value) {
                        if (item.input.action === 'finish_auth') ipcRenderer.send('spotify-finish-auth', inp.value.trim());
                    }
                };

                wrap.appendChild(inp);
                wrap.appendChild(btn);
                step.appendChild(wrap);
            }

            return step;

        case 'header':
            // ... Legacy header support ...
            const h3 = document.createElement('h3');
            h3.textContent = item.label;
            h3.style.marginTop = '20px';
            h3.style.marginBottom = '10px';
            h3.className = 'sp-section-title'; // reuse new style
            return h3;

        case 'group':
            // ... Legacy group support ...
            const group = document.createElement('div');
            if (item.label) {
                const title = document.createElement('div');
                title.textContent = item.label;
                title.style.fontSize = '0.9em';
                title.style.color = 'rgba(255,255,255,0.5)';
                title.style.marginBottom = '8px';
                group.appendChild(title);
            }
            if (item.children) {
                item.children.forEach(child => {
                    const childEl = createSettingElement(child, config);
                    if (childEl) group.appendChild(childEl);
                });
            }
            return group;

        case 'toggle':
            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.justifyContent = 'space-between';
            label.style.alignItems = 'center';
            label.style.padding = '12px';
            label.style.background = 'rgba(255, 255, 255, 0.05)';
            label.style.borderRadius = '10px';
            label.style.cursor = 'pointer';
            label.style.marginBottom = '8px'; // Spacing

            const span = document.createElement('span');
            span.textContent = item.label;
            span.style.fontSize = '0.9em';
            span.style.color = '#ddd';
            span.style.fontWeight = '500';

            const switchLabel = document.createElement('label');
            switchLabel.className = 'switch';
            switchLabel.style.transform = 'scale(0.8)';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = config[item.key] !== false; // Default true if undefined
            input?.addEventListener('change', () => {
                ipcRenderer.send(ipcChannel, { [item.key]: input.checked });
            });

            const slider = document.createElement('span');
            slider.className = 'slider round';

            switchLabel.appendChild(input);
            switchLabel.appendChild(slider);
            label.appendChild(span);
            label.appendChild(switchLabel);
            return label;

        // ... Keep select support ...
        case 'select':
            const selectContainer = document.createElement('div');
            selectContainer.style.display = 'flex';
            selectContainer.style.flexDirection = 'column';
            selectContainer.style.gap = '10px';

            if (item.options) {
                item.options.forEach(opt => {
                    const optLabel = document.createElement('label');
                    optLabel.style.display = 'flex';
                    optLabel.style.alignItems = 'center';
                    optLabel.style.gap = '12px';
                    optLabel.style.padding = '14px 16px';
                    optLabel.style.background = 'rgba(29, 185, 84, 0.08)';
                    optLabel.style.border = '1px solid rgba(29, 185, 84, 0.2)';
                    optLabel.style.borderRadius = '12px';
                    optLabel.style.cursor = 'pointer';

                    const optInput = document.createElement('input');
                    optInput.type = 'radio';
                    optInput.name = item.key;
                    optInput.value = opt.value;
                    optInput.checked = config[item.key] === opt.value;
                    optInput.style.width = '18px';
                    optInput.style.height = '18px';
                    optInput.style.accentColor = '#1DB954';

                    optInput?.addEventListener('change', () => {
                        ipcRenderer.send(ipcChannel, { [item.key]: opt.value });
                    });

                    const txtDiv = document.createElement('div');
                    const mainTxt = document.createElement('div');
                    mainTxt.textContent = opt.label;
                    mainTxt.style.fontWeight = '500';
                    mainTxt.style.color = '#fff';

                    txtDiv.appendChild(mainTxt);

                    if (opt.hint) {
                        const hint = document.createElement('div');
                        hint.textContent = opt.hint;
                        hint.style.fontSize = '0.8em';
                        hint.style.color = 'rgba(255,255,255,0.4)';
                        hint.style.marginTop = '2px';
                        txtDiv.appendChild(hint);
                    }

                    optLabel.appendChild(optInput);
                    optLabel.appendChild(txtDiv);
                    selectContainer.appendChild(optLabel);
                });
            }
            return selectContainer;

        case 'slider':
            const sliderLabel = document.createElement('div');
            sliderLabel.className = 'sp-slider-label';

            const sliderHeader = document.createElement('div');
            sliderHeader.className = 'sp-slider-header';
            sliderHeader.innerHTML = `
                <span style="font-size: 0.9em; font-weight: 500; color: #ddd;">${item.label}</span>
                <span class="sp-slider-val" id="val-${item.key}">${config[item.key] || item.defaultValue || 0}${item.suffix || ''}</span>
            `;

            const sliderInput = document.createElement('input');
            sliderInput.type = 'range';
            sliderInput.className = 'sp-slider';
            sliderInput.min = item.min || 0;
            sliderInput.max = item.max || 100;
            sliderInput.step = item.step || 1;
            sliderInput.value = config[item.key] || item.defaultValue || 0;

            let saveDebounceTimer = null;
            sliderInput?.addEventListener('input', () => {
                const valEl = document.getElementById(`val-${item.key}`);
                if (valEl) valEl.textContent = `${sliderInput.value}${item.suffix || ''}`;

                // Debounce real-time dragging updates
                if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
                saveDebounceTimer = setTimeout(() => {
                    ipcRenderer.send(ipcChannel, { [item.key]: parseInt(sliderInput.value) });
                }, 250);
            });

            sliderInput?.addEventListener('change', () => {
                if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
                ipcRenderer.send(ipcChannel, { [item.key]: parseInt(sliderInput.value) });
            });

            sliderLabel.appendChild(sliderHeader);
            sliderLabel.appendChild(sliderInput);
            return sliderLabel;

        case 'button':
            const btn = document.createElement('button');
            btn.className = 'sp-btn sp-btn-primary';
            btn.style.marginTop = '10px';
            btn.textContent = item.label;
            btn.onclick = () => {
                if (item.action) {
                    ipcRenderer.send(item.action, item.value);
                } else if (item.key) {
                    // Fallback: Send to plugin's update channel with the key as action
                    ipcRenderer.send(ipcChannel, { action: item.key, value: item.value });
                }
            };
            return btn;
    }
    return null;
}
const spotifyDetectionMethod = document.getElementById('spotifyDetectionMethod');
if (spotifyDetectionMethod) {
    spotifyDetectionMethod?.addEventListener('change', (e) => {
        ipcRenderer.send('update-spotify-settings', { detectionMethod: e.target.value });
        showToast('ℹ️', t('toasts.detectionMethodUpdated'), 'info');
    });
}

// === IPC Event Handlers ===

// =========================================
// PLUGINS TAB MANAGER
// =========================================

var PluginsTabManager = {
    initialized: false,
    metaData: null,

    // Dados estáticos de features por plugin
    pluginInfo: {
        smartafk: {
            displayName: 'SmartAFK Detector',
            icon: '😴',
            requires: 'BetterDiscord',
            features: [
                'Auto-detecção de inatividade',
                'Timeout customizável',
                'Sync com o app Solari via WebSocket'
            ]
        },
        spotifysync: {
            displayName: 'SpotifySync',
            icon: '🎵',
            requires: 'BetterDiscord + Spotify',
            features: [
                'Controles Play/Pause/Next/Previous',
                'Volume, Seek, Shuffle e Repeat',
                'Biblioteca e Fila de músicas'
            ]
        },
        solarinotes: {
            displayName: 'Solari Notes',
            icon: '📝',
            requires: 'BetterDiscord',
            features: [
                'Bloco de notas de alta performance',
                'Armazenamento local seguro',
                'Aparência customizável',
                'Sincronização em tempo real'
            ]
        },
        solarimessagetools: {
            displayName: 'Solari MessageTools',
            icon: '💬',
            requires: 'BetterDiscord',
            features: [
                'Edição e deleção acelerada',
                'Tradução de mensagens nativa',
                'Retenção de Ghost Messages',
                'Furtividade Anti-Typing'
            ]
        },
        solariplayer: {
            displayName: 'Solari Player',
            icon: '🔌',
            requires: 'BetterDiscord',
            features: [
                'Theater Mode & Picture-in-Picture',
                'Double Tap to Seek & Speed Controls',
                'Screenshot Bypass (CORS)',
                'Premium Glassmorphism UI'
            ]
        },
        solarimotion: {
            displayName: 'Solari Motion',
            icon: '✨',
            requires: 'BetterDiscord',
            features: [
                '28 Animation Types & 22 UI Categories',
                'Stagger Cascades & Global Intensity Slider',
                'Visual Cubic-Bézier Editor & Live DOM Preview',
                'FPS Guard & Standalone Mode'
            ]
        }
    },

    async updateConnectionStatus() {
        try {
            const rtStatus = await ipcRenderer.invoke('bd:get-runtime-status');
            if (rtStatus) {
                if (rtStatus.active) {
                    this._handleBDRuntimeStatus(rtStatus);
                } else {
                    this._updateSolariManagerCardStatus(false);
                }
            }
        } catch (e) {
            console.error('[Plugins] Error checking manager status:', e);
        }
    },

    async init() {
        this.updateConnectionStatus();

        if (this.initialized) return;

        const refreshBtn = document.getElementById('plugins-refresh-btn');
        if (refreshBtn) refreshBtn?.addEventListener('click', () => this.loadPlugins(true));

        const retryBtn = document.getElementById('plugins-retry-btn');
        if (retryBtn) retryBtn?.addEventListener('click', () => this.loadPlugins(true));

        const updateAllBtn = document.getElementById('plugins-update-all-btn');
        if (updateAllBtn) updateAllBtn?.addEventListener('click', () => this.handleUpdateAll());

        // 1-Click BetterDiscord Install/Repair
        const bd1ClickHandler = async (btn) => {
            const labelEl = btn.querySelector('.bd-split-label');
            const originalLabel = labelEl ? labelEl.textContent : '';
            btn.disabled = true;
            if (labelEl) {
                labelEl.setAttribute('data-i18n', 'pluginStore.bdBtnInstalling');
                labelEl.textContent = t('pluginStore.bdBtnInstalling') || 'Instalando...';
            }
            btn.style.opacity = '0.7';
            try {
                const result = await ipcRenderer.invoke('plugin:install-bd');
                if (result && result.success) {
                    showToast('✅', 'BetterDiscord instalado com sucesso! Discord reiniciando...', 'success');
                    if (labelEl) {
                        labelEl.setAttribute('data-i18n', 'pluginStore.bdBtnReinstall');
                        labelEl.textContent = t('pluginStore.bdBtnReinstall') || 'Reinstalar BD';
                    }
                    // Cooldown: block auto-repair for 30s during Discord restart
                    this._bdActionCooldown = Date.now() + 30000;
                } else {
                    showToast('❌', `Erro: ${result?.error || 'Falha desconhecida'}`, 'error');
                    if (labelEl) labelEl.textContent = originalLabel;
                }
            } catch (e) {
                showToast('❌', `Erro: ${e.message}`, 'error');
                if (labelEl) labelEl.textContent = originalLabel;
            }
            btn.disabled = false;
            btn.style.opacity = '1';
        };

        // Banner buttons (inside warning banners)
        const installBannerBtn = document.getElementById('bd-1click-install-btn');
        if (installBannerBtn) installBannerBtn.addEventListener('click', () => {
            // Banner buttons don't have .bd-split-label, use direct install
            installBannerBtn.disabled = true;
            installBannerBtn.textContent = 'Instalando...';
            ipcRenderer.invoke('plugin:install-bd').then(result => {
                if (result?.success) {
                    showToast('✅', 'BetterDiscord instalado!', 'success');
                    this._bdActionCooldown = Date.now() + 30000;
                } else {
                    showToast('❌', `Erro: ${result?.error}`, 'error');
                }
                installBannerBtn.textContent = 'Instalar Automático';
                installBannerBtn.disabled = false;
            });
        });
        const repairBannerBtn = document.getElementById('bd-1click-repair-btn');
        if (repairBannerBtn) repairBannerBtn.addEventListener('click', () => {
            repairBannerBtn.disabled = true;
            repairBannerBtn.textContent = 'Reparando...';
            ipcRenderer.invoke('plugin:install-bd').then(result => {
                if (result?.success) {
                    showToast('✅', 'BetterDiscord reparado!', 'success');
                    this._bdActionCooldown = Date.now() + 30000;
                } else {
                    showToast('❌', `Erro: ${result?.error}`, 'error');
                }
                repairBannerBtn.textContent = 'Reparar Automático';
                repairBannerBtn.disabled = false;
            });
        });

        // Header split button - main action
        const headerInstallBtn = document.getElementById('bd-1click-header-btn');
        if (headerInstallBtn) headerInstallBtn.addEventListener('click', () => bd1ClickHandler(headerInstallBtn));

        // Header split button - dropdown toggle
        const splitArrow = document.getElementById('bd-split-arrow');
        const splitDropdown = document.getElementById('bd-split-dropdown');
        if (splitArrow && splitDropdown) {
            splitArrow.addEventListener('click', (e) => {
                e.stopPropagation();
                splitDropdown.style.display = splitDropdown.style.display !== 'none' ? 'none' : 'block';
            });
            document.addEventListener('click', (e) => {
                if (!splitArrow.contains(e.target) && !splitDropdown.contains(e.target)) {
                    splitDropdown.style.display = 'none';
                }
            });
        }

        const updateBannerBtn = document.getElementById('bd-1click-update-btn');
        if (updateBannerBtn) updateBannerBtn.addEventListener('click', () => {
            updateBannerBtn.disabled = true;
            const spanEl = updateBannerBtn.querySelector('[data-i18n]');
            if (spanEl) spanEl.textContent = t('pluginStore.bdBtnUpdating') || 'Atualizando...';
            ipcRenderer.invoke('plugin:install-bd').then(result => {
                if (result?.success) {
                    showToast('✅', t('pluginStore.bdBtnUpdate') || 'BetterDiscord atualizado!', 'success');
                    this._bdActionCooldown = Date.now() + 30000;
                    setTimeout(() => ipcRenderer.invoke('bd:check-update').then(d => this._handleBDStatusUpdate(d)), 2000);
                } else {
                    showToast('❌', `Erro: ${result?.error}`, 'error');
                }
                if (spanEl) spanEl.textContent = t('pluginStore.bd1ClickUpdate') || 'Atualizar Automático';
                updateBannerBtn.disabled = false;
            });
        });

        const restoreBannerBtn = document.getElementById('bd-1click-restore-btn');
        if (restoreBannerBtn) restoreBannerBtn.addEventListener('click', () => {
            restoreBannerBtn.disabled = true;
            const spanEl = restoreBannerBtn.querySelector('[data-i18n]');
            if (spanEl) spanEl.textContent = t('pluginStore.bdBtnUpdating') || 'Restaurando...';
            ipcRenderer.invoke('plugin:install-bd').then(result => {
                if (result?.success) {
                    showToast('✅', 'BetterDiscord restaurado!', 'success');
                    this._bdActionCooldown = Date.now() + 30000;
                    setTimeout(() => ipcRenderer.invoke('bd:check-update').then(d => this._handleBDStatusUpdate(d)), 2000);
                } else {
                    showToast('❌', `Erro: ${result?.error}`, 'error');
                }
                if (spanEl) spanEl.textContent = t('pluginStore.bdBtnRestore') || 'Atualizar e Restaurar BD';
                restoreBannerBtn.disabled = false;
            });
        });

        // Dropdown: Uninstall BD
        const uninstallBtn = document.getElementById('bd-action-uninstall');
        if (uninstallBtn) {
            uninstallBtn.addEventListener('click', async () => {
                if (splitDropdown) splitDropdown.style.display = 'none';
                const headerBtn = document.getElementById('bd-1click-header-btn');
                const labelEl = headerBtn ? headerBtn.querySelector('.bd-split-label') : null;
                const origLabel = labelEl ? labelEl.textContent : '';
                if (headerBtn) {
                    headerBtn.disabled = true;
                    if (labelEl) {
                        labelEl.setAttribute('data-i18n', 'pluginStore.bdBtnUninstalling');
                        labelEl.textContent = t('pluginStore.bdBtnUninstalling') || 'Desinstalando...';
                    }
                    headerBtn.style.opacity = '0.7';
                    try {
                        const result = await ipcRenderer.invoke('plugin:uninstall-bd');
                        if (result && result.success) {
                            showToast('✅', 'BetterDiscord desinstalado! Plugins e temas preservados.', 'success');
                            if (labelEl) {
                                labelEl.setAttribute('data-i18n', 'pluginStore.bdBtnInstall');
                                labelEl.textContent = t('pluginStore.bdBtnInstall') || 'Instalar BD';
                            }
                            // Cooldown: block auto-repair for 30s
                            this._bdActionCooldown = Date.now() + 30000;
                        } else {
                            showToast('❌', `Erro: ${result?.error || 'Falha'}`, 'error');
                            if (labelEl) labelEl.textContent = origLabel;
                        }
                    } catch (e) {
                        showToast('❌', `Erro: ${e.message}`, 'error');
                        if (labelEl) labelEl.textContent = origLabel;
                    }
                    headerBtn.disabled = false;
                    headerBtn.style.opacity = '1';
                }
            });
        }

        // Dropdown: Auto-Repair toggle
        const autoRepairToggle = document.getElementById('bd-action-repair');
        if (autoRepairToggle) {
            this._updateAutoRepairUI(autoRepairToggle, appSettings.bdAutoRepair);
            autoRepairToggle.addEventListener('click', () => {
                const newState = !appSettings.bdAutoRepair;
                appSettings.bdAutoRepair = newState;
                ipcRenderer.send('save-app-settings', { bdAutoRepair: newState });
                this._updateAutoRepairUI(autoRepairToggle, newState);

                if (newState) {
                    showToast('🔧', 'Auto-Repair ativado! BD será reparado automaticamente.', 'success');
                } else {
                    showToast('ℹ️', 'Auto-Repair desativado.', 'info');
                }
            });
        }

        // v1.11.1: Status fetch handled by tabs-fix.js to avoid racing bdIncompatibleCounter
        // Only fetch cached plugins here.

        // Request cached plugin list immediately
        ipcRenderer.invoke('bd:get-plugins').then(plugins => {
            if (plugins && plugins.length > 0) this._renderBDPlugins(plugins);
        });

        // BD Manager buttons
        const installBtn = document.getElementById('bd-manager-install-btn');
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                const mode = installBtn.getAttribute('data-mode');
                const isUninstall = mode === 'uninstall';
                const isUpdate = mode === 'update';

                try {
                    installBtn.disabled = true;
                    if (isUninstall) {
                        installBtn.innerHTML = '<span>⏳</span> <span data-i18n="pluginStore.bdManagerUninstalling">Desinstalando...</span>';
                        const result = await ipcRenderer.invoke('plugin:delete', 'SolariManager.plugin.js');
                        if (result.success) {
                            installBtn.innerHTML = '<span>✅</span> <span data-i18n="pluginStore.bdManagerUninstalled">Desinstalado!</span>';
                            showToast('🗑️', 'SolariManager removido com sucesso.', 'success');
                            setTimeout(() => {
                                this._updateSolariManagerButton(false);
                            }, 2000);
                        } else {
                            throw new Error(result.error);
                        }
                    } else if (isUpdate) {
                        installBtn.innerHTML = '<span>⏳</span> <span data-i18n="pluginStore.bdManagerUpdating">Atualizando...</span>';
                        const smMeta = this.metaData && this.metaData['solarimanager'];
                        if (!smMeta || !smMeta.downloadUrl) throw new Error("SolariManager metadata not found");
                        const result = await ipcRenderer.invoke('plugin:download', { url: smMeta.downloadUrl, fileName: smMeta.fileName });
                        if (result.success) {
                            installBtn.innerHTML = '<span>✅</span> <span data-i18n="pluginStore.bdManagerUpdated">Atualizado!</span>';
                            showToast('🚀', 'SolariManager atualizado com sucesso.', 'success');
                            setTimeout(() => {
                                this._updateSolariManagerButton(true, false);
                            }, 2000);
                        } else {
                            throw new Error(result.error);
                        }
                    } else {
                        installBtn.innerHTML = '<span>⏳</span> <span data-i18n="pluginStore.installing">Baixando...</span>';
                        const smMeta = this.metaData && this.metaData['solarimanager'];
                        if (!smMeta || !smMeta.downloadUrl) throw new Error("SolariManager metadata not found");
                        const result = await ipcRenderer.invoke('plugin:download', { url: smMeta.downloadUrl, fileName: smMeta.fileName });
                        if (result.success) {
                            installBtn.innerHTML = '<span>✅</span> <span data-i18n="pluginStore.installed">Instalado!</span>';
                            showToast('✅', 'Ative o SolariManager no BetterDiscord!', 'success');
                            setTimeout(() => {
                                this._updateSolariManagerButton(true, false);
                            }, 2000);
                        } else {
                            throw new Error(result.error);
                        }
                    }
                } catch (e) {
                    installBtn.disabled = false;
                    this._updateSolariManagerButton(mode === 'uninstall', mode === 'update');
                    console.error('[BD Manager] Action error:', e);
                    showToast('❌', 'Erro: ' + e.message, 'error');
                }
            });
        }

        const managerRefreshBtn = document.getElementById('bd-manager-refresh-btn');
        if (managerRefreshBtn) {
            managerRefreshBtn.addEventListener('click', async () => {
                try {
                    const plugins = await ipcRenderer.invoke('bd:get-plugins');
                    if (plugins) this._renderBDPlugins(plugins);
                } catch (e) { /* ignore */ }
            });
        }

        this.initialized = true;
        // Status is now pushed from main process
        await this.loadPlugins();
        this.startAutoRefresh();
    },

    startAutoRefresh() {
        // v1.11.1 Opt: Store reference so interval can be cleared
        if (this._autoRefreshTimer) return;
        this._autoRefreshTimer = setInterval(() => this.loadPlugins(false, true), 300000);

        // Listen for local file changes (Installer/Deleter)
        ipcRenderer.on('plugins:local-change', () => {
            this.loadPlugins(false, true);
        });
    },

    _updateAutoRepairUI(btn, enabled) {
        if (!btn) return;
        const icon = enabled ? '✅' : '🔧';
        const label = enabled ? 'Auto-Repair: ON' : 'Auto-Repair: OFF';
        btn.innerHTML = `<span>${icon}</span> ${label}`;
        btn.style.opacity = enabled ? '1' : '0.7';
    },

    // v1.8.x Compatibility Layer
    async checkBD() {
        try {
            const data = await ipcRenderer.invoke('bd:get-status');
            this._handleBDStatusUpdate(data);
        } catch (e) { /* silent */ }
    },

    startBDPolling() {
        // Main process handles polling in v1.8.2+, this is a stub for safety
        console.log('[Plugins] startBDPolling (Stub) called.');
    },

    stopBDPolling() {
        // Stub for safety
    },

    async _handleBDStatusUpdate(result) {
        this.lastBDStatus = result.status; // Save for other UI parts
        const indicator = document.getElementById('bd-status-indicator');
        const text = indicator ? indicator.querySelector('.bd-status-text') : null;
        const headerBtn = document.getElementById('bd-1click-header-btn');
        const labelEl = headerBtn ? headerBtn.querySelector('.bd-split-label') : null;

        try {
            const notInstalledBanner = document.getElementById('bd-warning-not-installed');
            const brokenBanner = document.getElementById('bd-warning-broken');
            const outdatedBanner = document.getElementById('bd-warning-outdated');
            const incompatibleBanner = document.getElementById('bd-warning-incompatible');
            const repairingBanner = document.getElementById('bd-warning-repairing');
            const pendingBanner = document.getElementById('bd-warning-pending');

            if (notInstalledBanner) notInstalledBanner.style.display = 'none';
            if (brokenBanner) brokenBanner.style.display = 'none';
            if (outdatedBanner) outdatedBanner.style.display = 'none';
            if (incompatibleBanner) incompatibleBanner.style.display = 'none';
            if (repairingBanner) repairingBanner.style.display = 'none';
            if (pendingBanner) pendingBanner.style.display = 'none';

            if (indicator) {
                indicator.className = 'bd-status-badge';
            }

            if (result.status === 'not_installed') {
                if (notInstalledBanner) notInstalledBanner.style.display = 'flex';
                if (indicator) {
                    indicator.classList.add('bd-status-missing');
                    indicator.title = 'BetterDiscord not installed';
                    if (text) {
                        text.setAttribute('data-i18n', 'pluginStore.bdStatusMissing');
                        text.textContent = t('pluginStore.bdStatusMissing') || 'Not Installed';
                    }
                }
                if (labelEl) {
                    labelEl.setAttribute('data-i18n', 'pluginStore.bdBtnInstall');
                    labelEl.textContent = t('pluginStore.bdBtnInstall') || 'Instalar BD';
                }
            } else if (result.status === 'broken') {
                if (brokenBanner) brokenBanner.style.display = 'flex';
                if (indicator) {
                    indicator.classList.add('bd-status-broken');
                    indicator.title = 'BetterDiscord broken';
                    if (text) {
                        text.setAttribute('data-i18n', 'pluginStore.bdStatusBroken');
                        text.textContent = t('pluginStore.bdStatusBroken') || 'Broken';
                    }
                }
                if (labelEl) {
                    labelEl.setAttribute('data-i18n', 'pluginStore.bdBtnRepair');
                    labelEl.textContent = t('pluginStore.bdBtnRepair') || 'Reparar BD';
                }
            } else if (result.status === 'pending_update') {
                // Discord downloaded an update but user hasn't installed it yet
                // Auto-repair is paused to prevent infinite loop
                if (pendingBanner) pendingBanner.style.display = 'flex';

                if (indicator) {
                    indicator.classList.add('bd-status-broken');
                    indicator.title = 'Discord update pending — Auto-Repair paused';
                    if (text) {
                        text.setAttribute('data-i18n', 'pluginStore.bdStatusPending');
                        text.textContent = t('pluginStore.bdStatusPending') || 'Update Pendente';
                    }
                }
                if (labelEl) {
                    labelEl.setAttribute('data-i18n', 'pluginStore.bdBtnWaitUpdate');
                    labelEl.textContent = t('pluginStore.bdBtnWaitUpdate') || 'Aguardando Update';
                }
                if (headerBtn) headerBtn.disabled = true;
            } else if (result.status === 'repairing') {
                if (indicator) {
                    indicator.classList.add('bd-status-broken');
                    indicator.title = 'BetterDiscord reparando...';
                    if (text) {
                        text.setAttribute('data-i18n', 'pluginStore.bdStatusRepairing');
                        text.textContent = t('pluginStore.bdStatusRepairing') || 'Reparando...';
                    }
                }
                if (labelEl) {
                    labelEl.setAttribute('data-i18n', 'pluginStore.bdBtnRepairing');
                    labelEl.textContent = t('pluginStore.bdBtnRepairing') || 'Reparando...';
                }
                showToast('🔧', 'Auto-Repair: BD está sendo reparado agora...', 'info');
            } else if (result.status === 'outdated') {
                // BD installed & injected, but an update is available
                const outdatedBanner = document.getElementById('bd-warning-outdated');
                if (outdatedBanner) outdatedBanner.style.display = 'flex';

                // Fill in version info if available
                if (result.bdVersion || result.latestVersion) {
                    const versionInfo = document.getElementById('bd-version-info');
                    const localVerEl = document.getElementById('bd-local-version');
                    const latestVerEl = document.getElementById('bd-latest-version');
                    if (localVerEl && result.bdVersion) localVerEl.textContent = `v${result.bdVersion}`;
                    if (latestVerEl && result.latestVersion) latestVerEl.textContent = `v${result.latestVersion}`;
                    if (versionInfo && (result.bdVersion || result.latestVersion)) versionInfo.style.display = 'inline';
                }

                if (indicator) {
                    indicator.classList.add('bd-status-outdated');
                    indicator.title = `BetterDiscord outdated (v${result.bdVersion || '?'} → v${result.latestVersion || '?'})`;
                    if (text) {
                        text.setAttribute('data-i18n', 'pluginStore.bdStatusOutdated');
                        text.textContent = t('pluginStore.bdStatusOutdated') || 'Desatualizado';
                    }
                }
                if (labelEl) {
                    labelEl.setAttribute('data-i18n', 'pluginStore.bdBtnUpdate');
                    labelEl.textContent = t('pluginStore.bdBtnUpdate') || 'Atualizar BD';
                }
                if (headerBtn) headerBtn.disabled = false;
            } else if (result.status === 'incompatible' || result.status === 'incompatible_update') {
                const incompatibleBanner = document.getElementById('bd-warning-incompatible');
                if (incompatibleBanner) {
                    incompatibleBanner.style.display = 'flex';
                    const restoreBtn = incompatibleBanner.querySelector('#bd-1click-restore-btn');
                    const restoreLabel = restoreBtn?.querySelector('[data-i18n]');

                    if (result.status === 'incompatible_update') {
                        if (restoreBtn) restoreBtn.disabled = false;
                        if (restoreLabel) {
                            restoreLabel.setAttribute('data-i18n', 'pluginStore.bdBtnRestore');
                            restoreLabel.textContent = t('pluginStore.bdBtnRestore') || 'Atualizar e Restaurar BD';
                        }
                    } else {
                        if (restoreBtn) restoreBtn.disabled = true;
                        if (restoreLabel) {
                            restoreLabel.setAttribute('data-i18n', 'pluginStore.bdBtnWaiting');
                            restoreLabel.textContent = t('pluginStore.bdBtnWaiting') || 'Aguardando Atualização...';
                        }
                    }
                }

                if (indicator) {
                    indicator.classList.add('bd-status-incompatible');
                    indicator.title = 'BetterDiscord incompatible with this Discord version';
                    if (text) {
                        text.setAttribute('data-i18n', 'pluginStore.bdStatusIncompatible');
                        text.textContent = t('pluginStore.bdStatusIncompatible') || 'Incompatível';
                    }
                }
                if (labelEl) {
                    labelEl.setAttribute('data-i18n', 'pluginStore.bdBtnWaiting');
                    labelEl.textContent = t('pluginStore.bdBtnWaiting') || 'Aguardando Update';
                }
                if (headerBtn) headerBtn.disabled = true;
            } else if (result.status === 'active') {
                // SolariManager confirmed BD is running in runtime
                if (indicator) {
                    indicator.classList.add('bd-status-active');
                    indicator.title = 'BetterDiscord active — confirmed by SolariManager';
                    if (text) {
                        text.setAttribute('data-i18n', 'pluginStore.bdStatusActive');
                        text.textContent = t('pluginStore.bdStatusActive') || 'Ativo';
                    }
                }
                if (labelEl) {
                    labelEl.setAttribute('data-i18n', 'pluginStore.bdBtnReinstall');
                    labelEl.textContent = t('pluginStore.bdBtnReinstall') || 'Reinstalar BD';
                }
                if (headerBtn) headerBtn.disabled = false;
            } else {
                if (indicator) {
                    indicator.classList.add('bd-status-ok');
                    indicator.title = 'BetterDiscord installed';
                    if (text) {
                        text.setAttribute('data-i18n', 'pluginStore.bdStatusInstalled');
                        text.textContent = t('pluginStore.bdStatusInstalled') || 'Installed';
                    }
                }
                if (labelEl) {
                    labelEl.setAttribute('data-i18n', 'pluginStore.bdBtnReinstall');
                    labelEl.textContent = t('pluginStore.bdBtnReinstall') || 'Reinstalar BD';
                }
                if (headerBtn) headerBtn.disabled = false;
            }

            // Sync SolariManager card with the new BD status
            this._updateSolariManagerCardStatus(result.sm_connected, result.discord_running);

        } catch (e) {
            console.error('[Plugins] Error handling BD status update:', e);
        }
    },

    async _updateSolariManagerCardStatus(isActive, discordRunning = true) {
        const dot = document.getElementById('bd-runtime-dot');
        const text = document.getElementById('bd-runtime-text');
        const stepsContainer = document.getElementById('bd-manager-activation-steps');

        if (isActive) {
            if (dot) dot.classList.add('active');
            if (text) {
                text.classList.add('active');
                text.setAttribute('data-i18n', 'pluginStore.bdManagerConnected');
                text.innerHTML = t('pluginStore.bdManagerConnected') || 'Conectado';
                text.style.color = ''; // reset
            }
            if (stepsContainer) stepsContainer.style.display = 'none';

            // Version check for update button
            let isOutdated = false;
            try {
                const installedVersion = await ipcRenderer.invoke('plugin:get-version', 'SolariManager.plugin.js');
                const remoteVersion = this.metaData?.['solarimanager']?.version;
                if (installedVersion && remoteVersion) {
                    const v1 = installedVersion.split('.').map(Number);
                    const v2 = remoteVersion.split('.').map(Number);
                    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
                        if ((v2[i] || 0) > (v1[i] || 0)) { isOutdated = true; break; }
                        if ((v2[i] || 0) < (v1[i] || 0)) break;
                    }
                }
            } catch (e) { /* ignore */ }

            this._updateSolariManagerButton(true, isOutdated);
            this._setBDPluginTogglesEnabled(true);
        } else {
            if (dot) dot.classList.remove('active');
            try {
                const installedVersion = await ipcRenderer.invoke('plugin:get-version', 'SolariManager.plugin.js');
                if (installedVersion) {
                    if (text) {
                        text.classList.remove('active');
                        if (!discordRunning) {
                            text.setAttribute('data-i18n', 'pluginStore.bdManagerDiscordClosed');
                            text.innerHTML = t('pluginStore.bdManagerDiscordClosed') || 'Discord fechado';
                            text.style.color = ''; // reset
                        } else {
                            if (this.lastBDStatus === 'incompatible' || this.lastBDStatus === 'incompatible_update') {
                                text.setAttribute('data-i18n', 'pluginStore.bdStatusIncompatible');
                                text.innerHTML = t('pluginStore.bdStatusIncompatible') || 'Incompatível';
                                text.style.color = '#ef4444'; // error red
                            } else if (this.lastBDStatus === 'not_installed') {
                                text.setAttribute('data-i18n', 'pluginStore.bdStatusMissing');
                                text.innerHTML = t('pluginStore.bdStatusMissing') || 'Não Instalado';
                                text.style.color = '#ef4444'; // error red
                            } else if (this.lastBDStatus === 'broken') {
                                text.setAttribute('data-i18n', 'pluginStore.bdStatusBroken');
                                text.innerHTML = t('pluginStore.bdStatusBroken') || 'Quebrado';
                                text.style.color = '#ef4444'; // error red
                            } else {
                                text.setAttribute('data-i18n', 'pluginStore.bdManagerInstalledInactive');
                                text.innerHTML = t('pluginStore.bdManagerInstalledInactive') || 'Instalado (Desativado no BD)';
                                text.style.color = '#f59e0b'; // warning orange
                            }
                        }
                    }
                    if (stepsContainer) stepsContainer.style.display = discordRunning ? 'block' : 'none';

                    // Version check for update button
                    let isOutdated = false;
                    const remoteVersion = this.metaData?.['solarimanager']?.version;
                    if (installedVersion && remoteVersion) {
                        const v1 = installedVersion.split('.').map(Number);
                        const v2 = remoteVersion.split('.').map(Number);
                        for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
                            if ((v2[i] || 0) > (v1[i] || 0)) { isOutdated = true; break; }
                            if ((v2[i] || 0) < (v1[i] || 0)) break;
                        }
                    }
                    this._updateSolariManagerButton(true, isOutdated);
                } else {
                    if (text) {
                        text.classList.remove('active');
                        text.setAttribute('data-i18n', 'pluginStore.bdManagerNotConnected');
                        text.innerHTML = t('pluginStore.bdManagerNotConnected') || 'Não conectado';
                        text.style.color = ''; // reset
                    }
                    if (stepsContainer) stepsContainer.style.display = 'none';
                    this._updateSolariManagerButton(false);
                }
            } catch (e) {
                if (text) {
                    text.classList.remove('active');
                    text.setAttribute('data-i18n', 'pluginStore.bdManagerNotConnected');
                    text.innerHTML = t('pluginStore.bdManagerNotConnected') || 'Não conectado';
                    text.style.color = ''; // reset
                }
                if (stepsContainer) stepsContainer.style.display = 'none';
                this._updateSolariManagerButton(false);
            }
            this._setBDPluginTogglesEnabled(false);
        }
    },

    _setBDPluginTogglesEnabled(enabled) {
        const gridEl = document.getElementById('plugins-grid');
        if (!gridEl) return;
        gridEl.querySelectorAll('.bd-plugin-toggle').forEach(label => {
            const toggle = label.querySelector('input');
            if (toggle) {
                toggle.disabled = !enabled;
                label.style.opacity = enabled ? '1' : '0.35';
                label.style.pointerEvents = enabled ? 'auto' : 'none';
                label.title = enabled ? '' : (t('pluginStore.bdManagerNotConnected') || 'SolariManager desconectado');
            }
        });
    },

    _updateSolariManagerButton(isInstalled, isOutdated = false) {
        const btn = document.getElementById('bd-manager-install-btn');
        if (!btn) return;

        btn.disabled = false;
        if (isOutdated) {
            btn.setAttribute('data-mode', 'update');
            btn.classList.remove('danger');
            btn.classList.add('success');
            btn.innerHTML = '<span>🚀</span> <span data-i18n="pluginStore.bdManagerUpdate">Atualizar SolariManager</span>';
        } else if (isInstalled) {
            btn.setAttribute('data-mode', 'uninstall');
            btn.classList.add('danger');
            btn.classList.remove('success');
            btn.innerHTML = '<span>🗑️</span> <span data-i18n="pluginStore.bdManagerUninstall">Desinstalar SolariManager</span>';
        } else {
            btn.setAttribute('data-mode', 'install');
            btn.classList.remove('danger', 'success');
            btn.innerHTML = '<span>⚡</span> <span data-i18n="pluginStore.bdManagerInstall">Instalar SolariManager</span>';
        }
        // Re-apply translations to the button text
        if (typeof applyTranslations === 'function') applyTranslations();
    },

    _handleBDRuntimeStatus(data) {
        this._updateSolariManagerCardStatus(data.active, data.discordRunning);

        const indicator = document.getElementById('bd-status-indicator');
        const statusText = indicator ? indicator.querySelector('.bd-status-text') : null;
        const headerBtn = document.getElementById('bd-1click-header-btn');
        const labelEl = headerBtn ? headerBtn.querySelector('.bd-split-label') : null;

        if (data.active) {
            // Clear all warning banners if SolariManager is connected (BD is definitely working)
            ['not-installed', 'broken', 'outdated', 'incompatible', 'repairing'].forEach(id => {
                const el = document.getElementById(`bd-warning-${id}`);
                if (el) el.style.display = 'none';
            });

            // Upgrade badge to 'active'
            if (indicator) {
                indicator.className = 'bd-status-badge bd-status-active';
                indicator.title = `BetterDiscord active — confirmed by SolariManager${data.bdVersion ? ` v${data.bdVersion}` : ''}`;
            }
            if (statusText) {
                statusText.setAttribute('data-i18n', 'pluginStore.bdStatusActive');
                statusText.innerHTML = t('pluginStore.bdStatusActive') || 'Ativo';
            }
            if (labelEl) {
                labelEl.setAttribute('data-i18n', 'pluginStore.bdBtnReinstall');
                labelEl.innerHTML = t('pluginStore.bdBtnReinstall') || 'Reinstalar BD';
            }
        } else {
            // Fallback: trigger a fresh BD status check to restore correct state
            ipcRenderer.invoke('bd:get-status').then(d => this._handleBDStatusUpdate(d)).catch(() => { });
        }
    },

    _renderBDPlugins(plugins) {
        // Called when SolariManager reports live enabled/disabled state.
        // Enriches the existing grid cards with real toggle state.
        const gridEl = document.getElementById('plugins-grid');
        if (!gridEl || !plugins || plugins.length === 0) return;

        // Build a map of pluginName -> enabled for quick lookup
        const enabledMap = {};
        plugins.forEach(p => { enabledMap[p.name] = p.enabled; });
        this._pluginStateCache = enabledMap; // v1.11.1 Opt: Cache for pre-rendering

        // Update existing toggles in the plugin cards
        gridEl.querySelectorAll('.bd-plugin-toggle input').forEach(toggle => {
            const name = toggle.dataset.plugin;
            if (name === undefined) return;

            if (enabledMap[name] !== undefined) {
                const isEnabled = enabledMap[name];
                toggle.checked = isEnabled;
                toggle.disabled = false; // SolariManager connected — enable toggles
                toggle.closest('.bd-plugin-toggle').style.opacity = '1';
                toggle.closest('.bd-plugin-toggle').style.pointerEvents = 'auto';
                toggle.closest('.bd-plugin-toggle').title = `${isEnabled ? 'Desativar' : 'Ativar'} ${name}`;
            }
        });
    },

    _lastFetch: 0, // v1.11.1 Opt: Cache timestamp
    _CACHE_TTL: 10 * 60 * 1000, // 10 minutes

    async loadPlugins(forceRefresh = false, isBackground = false) {
        const loadingEl = document.getElementById('plugins-loading');
        const gridEl = document.getElementById('plugins-grid');
        const errorEl = document.getElementById('plugins-error');

        if (!loadingEl || !gridEl) return;

        if (!isBackground) {
            loadingEl.style.display = 'flex';
            gridEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'none';
        }

        // Check/update manager connection status instantly at the very start of loadPlugins
        this.updateConnectionStatus();

        // v1.11.1 Opt: Use cached metadata if fresh and not a forced refresh
        if (!forceRefresh && this.metaData && (Date.now() - this._lastFetch) < this._CACHE_TTL) {
            if (!isBackground) {
                loadingEl.style.display = 'none';
                gridEl.style.display = 'grid';
            }
            await this.renderPlugins(this.metaData);
            this.isLoading = false;
            return;
        }

        try {
            let data = null;
            const timestamp = forceRefresh ? `?t=${Date.now()}` : '';
            const primaryUrl = `https://raw.githubusercontent.com/TheDroidBR/Solari/main/plugins/plugins-meta.json${timestamp}`;
            const gitlabUrl = `https://gitlab.com/TheDroidBR/solari/-/raw/main/plugins/plugins-meta.json${timestamp}`;
            const fallbackUrl = `https://solarirpc.com/plugins-meta.json${timestamp}`;

            // 1. Primary Attempt (GitHub)
            try {
                console.log('[Plugins] Fetching metadata from GitHub mirror...');
                const response = await fetch(primaryUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                data = await response.json();
                console.log('[Plugins] Metadata loaded successfully from GitHub.');
            } catch (primaryErr) {
                console.warn(`[Plugins] GitHub mirror failed. Trying GitLab fallback...`);

                // 2. GitLab Fallback (Level 2)
                try {
                    const glResponse = await fetch(gitlabUrl);
                    if (!glResponse.ok) throw new Error(`HTTP ${glResponse.status}`);
                    data = await glResponse.json();
                    console.log('[Plugins] Metadata loaded successfully from GitLab.');
                } catch (glErr) {
                    console.warn(`[Plugins] GitLab fallback failed. Trying official website...`);

                    // 3. Official Website (Level 3)
                    try {
                        const fbResponse = await fetch(fallbackUrl);
                        if (!fbResponse.ok) throw new Error(`HTTP ${fbResponse.status}`);
                        data = await fbResponse.json();
                    } catch (fbErr) {
                        // 4. Last Resort: Network Sync (Native Electron Mode)
                        console.warn('[Plugins] Website fetch failed. Triggering native network sync...');
                        try {
                            const syncData = await ipcRenderer.invoke('net:fetch-resource', fallbackUrl);
                            if (syncData) data = JSON.parse(syncData);
                        } catch (syncErr) {
                            console.error('[Plugins] All remote sources failed.');
                            data = this.metaData || {};
                        }
                    }
                }
            }

            this.metaData = data;
            this._lastFetch = Date.now(); // v1.11.1 Opt: Mark cache timestamp

            // Truly Dynamic: Verify actual remote versions from the download links themselves
            try {
                const versionChecks = Object.entries(data).map(async ([key, plugin]) => {
                    if (plugin.downloadUrl) {
                        const checkUrl = `${plugin.downloadUrl}?t=${Date.now()}`;
                        const actualVersion = await ipcRenderer.invoke('plugin:get-remote-version', checkUrl);
                        if (actualVersion) {
                            const isNewer = (v1, v2) => {
                                const a = v1.split('.').map(Number);
                                const b = v2.split('.').map(Number);
                                for (let i = 0; i < Math.max(a.length, b.length); i++) {
                                    if ((a[i] || 0) > (b[i] || 0)) return true;
                                    if ((a[i] || 0) < (b[i] || 0)) return false;
                                }
                                return false;
                            };
                            if (isNewer(actualVersion, plugin.version)) {
                                plugin.version = actualVersion;
                            }
                        }
                    }
                });
                await Promise.all(versionChecks);
            } catch (vErr) { /* ok */ }

            await this.renderPlugins(data);

            // Show Update All button
            const updateAllBtn = document.getElementById('plugins-update-all-btn');
            if (updateAllBtn && Object.keys(data).length > 0) {
                updateAllBtn.style.display = 'flex';
            }

            // Initial check for SolariManager connection status
            try {
                const rtStatus = await ipcRenderer.invoke('bd:get-runtime-status');
                if (rtStatus && rtStatus.active) {
                    this._handleBDRuntimeStatus(rtStatus);
                    // Request fresh plugin list and use cache immediately if available
                    ipcRenderer.invoke('bd:get-plugins').then(cached => {
                        if (cached && cached.length > 0) {
                            this._renderBDPlugins(cached);
                        }
                    }).catch(() => { });
                } else {
                    this._updateSolariManagerCardStatus(false);
                }
            } catch (e) {
                this._updateSolariManagerCardStatus(false);
            }
        } catch (err) {
            if (errorEl && !isBackground) errorEl.style.display = 'flex';
        } finally {
            if (!isBackground) {
                loadingEl.style.display = 'none';
                if (!errorEl || errorEl.style.display !== 'flex') {
                    gridEl.style.display = 'grid';
                }
            }
        }
    },

    async renderPlugins(data) {
        const gridEl = document.getElementById('plugins-grid');
        gridEl.innerHTML = '';

        const bdDirExists = await ipcRenderer.invoke('plugin:dir-exists');

        const downloadSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
        const checkSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;

        // Semver comparison helper
        const isNewer = (remote, installed) => {
            const r = remote.split('.').map(Number);
            const i = installed.split('.').map(Number);
            for (let idx = 0; idx < Math.max(r.length, i.length); idx++) {
                const rv = r[idx] || 0;
                const iv = i[idx] || 0;
                if (rv > iv) return true;
                if (rv < iv) return false;
            }
            return false;
        };

        for (const [key, plugin] of Object.entries(data)) {
            // SolariManager is the core plugin, rendered specifically in the bd-manager-section at the top
            if (key.toLowerCase() === 'solarimanager') continue;

            // Plugin names must not be translated
            const displayName = this.getPluginDisplayName(key, plugin);

            const tDescKey = `plugins.${key}.description`;
            const tDesc = t(tDescKey);
            const isMissingDesc = !tDesc || tDesc === tDescKey;
            const description = isMissingDesc ? plugin.description : tDesc;

            const tFeatKey = `plugins.${key}.features`;
            let features = t(tFeatKey);
            if (!features || features === tFeatKey || !Array.isArray(features)) {
                features = Array.isArray(plugin.features) ? plugin.features : (this.pluginInfo[key]?.features || []);
            }

            const info = this.pluginInfo[key] || { icon: '🔌', requires: 'BetterDiscord', displayName: displayName };
            const card = document.createElement('div');
            card.className = 'plugin-store-card';

            let isInstalled = false;
            let installedVersion = null;
            try {
                installedVersion = await ipcRenderer.invoke('plugin:get-version', plugin.fileName);
                isInstalled = !!installedVersion;
            } catch (e) { /* ok */ }

            // Version display logic
            let versionDisplay = `v${plugin.version}`;
            let versionClass = 'plugin-version-badge';

            if (isInstalled && isNewer(plugin.version, installedVersion)) {
                versionDisplay = `v${installedVersion} ➜ v${plugin.version}`;
                versionClass += ' update-available';
            } else if (isInstalled) {
                versionDisplay = `v${installedVersion}`;
                versionClass += ' installed';
            }

            const featuresHtml = features.map(f => `<li>${f}</li>`).join('');
            const installLabel = t('pluginStore.install') || 'Instalar';
            const installedLabel = t('pluginStore.installed') || 'Instalado';
            const updateLabel = t('pluginStore.update') || 'Update'; // Fallback if key missing

            let buttonLabel = downloadSvg + ' ' + installLabel;
            let buttonClass = 'btn-plugin-install';
            let isDisabled = '';
            let btnTitle = '';

            if (isInstalled) {
                if (isNewer(plugin.version, installedVersion)) {
                    buttonLabel = downloadSvg + ' ' + updateLabel;
                    buttonClass += ' update';
                } else {
                    buttonLabel = checkSvg + ' ' + installedLabel;
                    buttonClass += ' installed';
                }
            } else if (!bdDirExists) {
                isDisabled = 'disabled';
                btnTitle = t('pluginStore.bdDirNotFoundTooltip') || 'Pasta de plugins do BetterDiscord não encontrada. Instale o BetterDiscord primeiro.';
            }

            const deleteSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

            let panelId = `config${key.replace(/\s/g, '')}`;
            if (key.toLowerCase() === 'smartafk') panelId = 'configSmartAFKDetector';
            if (key.toLowerCase() === 'spotifysync') panelId = 'configSpotifySync';
            if (key.toLowerCase() === 'solarinotes') panelId = 'configSolariNotes';
            if (key.toLowerCase() === 'solarimessagetools') panelId = 'configSolariMessageTools';

            let hasConfig = !!document.getElementById(panelId);
            if (!hasConfig) {
                try {
                    const configPath = getPluginConfigPath(key, data);
                    if (fs.existsSync(configPath)) {
                        const raw = fs.readFileSync(configPath, 'utf8');
                        const parsed = JSON.parse(raw);
                        hasConfig = parsed && Array.isArray(parsed.schema) && parsed.schema.length > 0;
                    }
                } catch (e) {
                    hasConfig = false;
                }
            }

            // v1.11.1 Opt: Pre-apply cached toggle state if available
            const cleanFileName = plugin.fileName.replace('.plugin.js', '');
            const stateCache = this._pluginStateCache || {};
            const isCached = stateCache.hasOwnProperty(cleanFileName);
            const isEnabled = isCached ? stateCache[cleanFileName] : false;

            const toggleDisabled = isCached ? '' : 'disabled';
            const toggleOpacity = isCached ? '1' : '0.35';
            const togglePointer = isCached ? 'auto' : 'none';
            const toggleChecked = isEnabled ? 'checked' : '';
            const toggleTitle = isCached ? `${isEnabled ? 'Desativar' : 'Ativar'} ${cleanFileName}` : 'SolariManager desconectado';

            card.innerHTML = `
                <div class="plugin-card-header">
                    <div class="plugin-icon-box">${info.icon}</div>
                    <span class="${versionClass}">${versionDisplay}</span>
                </div>
                <h3 class="plugin-card-title">${displayName}</h3>
                <div class="plugin-card-author">por <span>@${plugin.author || 'TheDroid'}</span></div>
                <p class="plugin-card-desc">${description}</p>
                <div class="plugin-requirements-badge">🔧 Requires: ${info.requires}</div>
                <ul class="plugin-features-list">${featuresHtml}</ul>
                <div class="plugin-card-actions">
                    <button class="${buttonClass}" ${isDisabled} title="${btnTitle}"
                            data-url="${plugin.downloadUrl}" data-filename="${plugin.fileName}">
                        ${buttonLabel}
                    </button>
                    ${isInstalled ? `
                    <label class="bd-plugin-toggle" title="${toggleTitle}" style="opacity:${toggleOpacity};pointer-events:${togglePointer}; display:flex; align-items:center; margin-left:auto;">
                        <input type="checkbox" ${toggleDisabled} ${toggleChecked} data-plugin="${cleanFileName}" />
                        <span class="bd-plugin-toggle-track"></span>
                    </label>
                    ${hasConfig ? `<button class="btn-plugin-config" title="Configurar" data-plugin-key="${key}">⚙️</button>` : ''}
                    <button class="btn-plugin-delete" title="Desinstalar" data-filename="${plugin.fileName}">${deleteSvg}</button>` : ''}
                    <button class="btn-plugin-changelog" title="Changelog" data-plugin-key="${key}">📋</button>
                </div>
            `;

            const toggleInput = card.querySelector('.bd-plugin-toggle input');
            if (toggleInput) {
                toggleInput.addEventListener('change', async (e) => {
                    if (e.target.disabled) return;
                    const pluginName = e.target.dataset.plugin;
                    const enabled = e.target.checked;
                    try {
                        const result = await ipcRenderer.invoke('bd:toggle-plugin', { pluginName, enabled });
                        if (!result || !result.success) {
                            e.target.checked = !enabled;
                            showToast('⚠️', `Falha ao ${enabled ? 'ativar' : 'desativar'} ${pluginName}. SolariManager conectado?`, 'warning');
                        }
                    } catch (err) {
                        e.target.checked = !enabled;
                    }
                });
            }

            card.querySelector('.btn-plugin-install').addEventListener('click', function () {
                PluginsTabManager.handleInstall(plugin.downloadUrl, plugin.fileName, this);
            });
            card.querySelector('.btn-plugin-changelog').addEventListener('click', () => {
                PluginsTabManager.showChangelog(key);
            });



            const configBtn = card.querySelector('.btn-plugin-config');
            if (configBtn) {
                configBtn?.addEventListener('click', () => {
                    openPluginConfig(key);
                });
            }

            const deleteBtn = card.querySelector('.btn-plugin-delete');
            if (deleteBtn) {
                deleteBtn?.addEventListener('click', function () {
                    PluginsTabManager.handleDelete(plugin.fileName, displayName, this);
                });
            }

            gridEl.appendChild(card);
        }
    },

    async handleDelete(fileName, displayName, btnElement) {
        // Confirm deletion
        const confirmMsg = `Deseja desinstalar ${displayName}?\nO arquivo será removido da pasta de plugins do BetterDiscord.`;
        if (!confirm(confirmMsg)) return;

        btnElement.disabled = true;
        btnElement.innerHTML = '<span class="plugins-spinner" style="width:14px;height:14px;border-width:2px;margin:0;"></span>';

        try {
            const result = await ipcRenderer.invoke('plugin:delete', fileName);
            if (result.success) {
                showToast('🗑️', `${displayName} desinstalado!`, 'success');
                // Refresh cards
                await this.loadPlugins(true);
            } else {
                throw new Error(result.error);
            }
        } catch (e) {
            showToast('❌', `Erro ao desinstalar: ${e.message}`, 'error');
            btnElement.disabled = false;
            btnElement.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
        }
    },

    async handleInstall(url, fileName, btnElement) {
        if (btnElement.classList.contains('installed')) return;

        const installingLabel = t('pluginStore.installing') !== 'pluginStore.installing' ? t('pluginStore.installing') : 'Baixando...';
        const installedLabel = t('pluginStore.installed') !== 'pluginStore.installed' ? t('pluginStore.installed') : 'Instalado';
        const checkSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;

        const originalHtml = btnElement.innerHTML;
        btnElement.innerHTML = `<span class="plugins-spinner" style="width:16px;height:16px;border-width:2px;margin:0;"></span> ${installingLabel}`;
        btnElement.disabled = true;

        try {
            // Append cache-buster to bypass raw github CDN caching when installing/updating
            const downloadUrl = `${url}?t=${Date.now()}`;
            const result = await ipcRenderer.invoke('plugin:download', { url: downloadUrl, fileName });
            if (result.success) {
                btnElement.className = 'btn-plugin-install installed';
                btnElement.innerHTML = `${checkSvg} ${installedLabel}`;
                
                const bdStatusResult = await ipcRenderer.invoke('plugin:check-bd');
                if (bdStatusResult && bdStatusResult.status === 'not_installed') {
                    const warnMsg = t('pluginStore.bdNotInstalledInstallNotice') || 'Plugin instalado! Porém, o BetterDiscord está desinstalado. Você precisa instalar o BetterDiscord para que o plugin funcione, e ativá-lo no painel de configurações do BetterDiscord.';
                    showToast('⚠️', warnMsg, 'warning', 10000);
                } else {
                    const msg = t('pluginStore.activateNotice') !== 'pluginStore.activateNotice' ? t('pluginStore.activateNotice') : 'Ative o plugin nas configurações do BetterDiscord!';
                    showToast('✅', msg, 'success');
                }
                
                // Refresh cards to instantly show the blue toggle
                await this.loadPlugins(true);

                // Auto-enable if SolariManager is connected (with 1s delay for BD to detect file)
                try {
                    const rtStatus = await ipcRenderer.invoke('bd:get-runtime-status');
                    if (rtStatus && rtStatus.active) {
                        setTimeout(async () => {
                            const pluginName = fileName.replace('.plugin.js', '');
                            await ipcRenderer.invoke('bd:toggle-plugin', { pluginName, enabled: true });
                        }, 500);
                    }
                } catch (rtErr) { /* ignore */ }
            } else {
                throw new Error(result.error);
            }
        } catch (e) {
            btnElement.innerHTML = originalHtml;
            btnElement.disabled = false;
            showToast('❌', 'Erro ao instalar: ' + e.message, 'error');
        }
    },

    // Robust markdown renderer (no external dependency)
    simpleMarkdown(md) {
        if (!md) return '<p>Nenhum changelog disponível.</p>';
        const lines = md.split('\n');
        let html = '';
        let inList = false;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                if (inList) { html += '</ul>'; inList = false; }
                continue;
            }

            // Headings
            if (trimmed.startsWith('### ')) {
                if (inList) { html += '</ul>'; inList = false; }
                html += `<h4 class="changelog-version">${trimmed.slice(4)}</h4>`;
                continue;
            }
            if (trimmed.startsWith('## ')) {
                if (inList) { html += '</ul>'; inList = false; }
                html += `<h3>${trimmed.slice(3)}</h3>`;
                continue;
            }

            // List items
            if (trimmed.startsWith('- ')) {
                if (!inList) { html += '</ul>'; inList = true; }
                let itemContent = trimmed.slice(2);
                // Inline formatting
                itemContent = itemContent
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    .replace(/`(.+?)`/g, '<code>$1</code>');
                html += `<li>${itemContent}</li>`;
                continue;
            }

            // Regular paragraph
            if (inList) { html += '</ul>'; inList = false; }
            let content = trimmed
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/`(.+?)`/g, '<code>$1</code>');
            html += `<p>${content}</p>`;
        }

        if (inList) html += '</ul>';
        return html;
    },

    getPluginDisplayName(key, plugin) {
        if (plugin?.title) {
            return plugin.title;
        }
        if (this.pluginInfo[key]?.displayName) {
            return this.pluginInfo[key].displayName;
        }

        // 100% Dynamic Fallback (for any future plugin missing a title/displayName metadata)
        let name = key;

        // Split camelCase (e.g., "SpotifySync" -> "Spotify Sync")
        name = name.replace(/([a-z])([A-Z])/g, '$1 $2');
        // Split snake_case and spinal-case
        name = name.replace(/[_-]/g, ' ');

        // Split brand prefix "solari" dynamically (e.g. "solariplayer" -> "Solari player")
        if (name.toLowerCase().startsWith('solari') && name.length > 6) {
            const remainder = name.slice(6);
            if (!remainder.startsWith(' ')) {
                name = 'Solari ' + remainder;
            }
        }

        // Capitalize each word properly
        return name.split(' ').map(word => {
            if (!word) return '';
            if (word.toLowerCase() === 'solari') return 'Solari';
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
    },

    showChangelog(key) {
        if (!this.metaData || !this.metaData[key]) return;
        const plugin = this.metaData[key];
        const displayName = this.getPluginDisplayName(key, plugin);
        const modal = document.getElementById('plugin-changelog-modal');
        const title = document.getElementById('plugin-changelog-title');
        const content = document.getElementById('plugin-changelog-content');

        if (modal && title && content) {
            title.textContent = `${displayName} — Changelog`;
            content.innerHTML = this.simpleMarkdown(plugin.changelog);
            modal.classList.add('active');
        }
    },

    async handleUpdateAll() {
        if (!this.metaData) return;
        const btn = document.getElementById('plugins-update-all-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="plugins-spinner" style="width:14px;height:14px;border-width:2px;margin:0;"></span> Verificando...';
        }

        // Semver comparison: returns true if remote > installed
        const isNewer = (remote, installed) => {
            const r = remote.split('.').map(Number);
            const i = installed.split('.').map(Number);
            for (let idx = 0; idx < Math.max(r.length, i.length); idx++) {
                const rv = r[idx] || 0;
                const iv = i[idx] || 0;
                if (rv > iv) return true;
                if (rv < iv) return false;
            }
            return false; // Same version
        };

        let successCount = 0;
        let errorCount = 0;

        for (const [key, plugin] of Object.entries(this.metaData)) {
            try {
                // Check installed version — skip if not installed
                const installedVersion = await ipcRenderer.invoke('plugin:get-version', plugin.fileName);

                if (!installedVersion) {
                    continue;
                }

                if (!isNewer(plugin.version, installedVersion)) {
                    continue;
                }

                if (btn) {
                    btn.innerHTML = `<span class="plugins-spinner" style="width:14px;height:14px;border-width:2px;margin:0;"></span> Atualizando ${key}...`;
                }

                const result = await ipcRenderer.invoke('plugin:download', {
                    url: plugin.downloadUrl,
                    fileName: plugin.fileName
                });
                if (result.success) successCount++;
                else {
                    errorCount++;
                }
            } catch (e) {
                errorCount++;
            }
        }

        if (btn) {
            btn.disabled = false;
            const downloadSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
            const label = t('pluginStore.updateAll') !== 'pluginStore.updateAll' ? t('pluginStore.updateAll') : 'Atualizar Todos';
            btn.innerHTML = `${downloadSvg} <span>${label}</span>`;
        }

        if (successCount > 0) {
            showToast('✅', `${successCount} plugin(s) atualizado(s)!`, 'success');
        }
        if (errorCount > 0) {
            showToast('❌', `${errorCount} plugin(s) falharam`, 'error');
        }
        if (successCount === 0 && errorCount === 0) {
            showToast('✅', 'Todos os plugins já estão atualizados!', 'success');
        }

        // Refresh cards to show updated state
        if (successCount > 0) {
            await this.loadPlugins(true);
        }
    }
};

// Changelog Modal dinâmico
if (!document.getElementById('plugin-changelog-modal')) {
    const modalHtml = `
    <div class="modal-overlay" id="plugin-changelog-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="plugin-changelog-title">Changelog</h3>
                <button class="modal-close" onclick="document.getElementById('plugin-changelog-modal').classList.remove('active')">&times;</button>
            </div>
            <div class="modal-body markdown-content" id="plugin-changelog-content" style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Hook de troca de aba
const pluginsTabBtn = document.querySelector('.tab-btn[data-tab="plugins-tab"]');
if (pluginsTabBtn) {
    pluginsTabBtn?.addEventListener('click', () => {
        PluginsTabManager.init();
        PluginsTabManager.updateConnectionStatus();
    });
}

// Auto-Save Handler Helper
const attachAutoSave = (id, settingKey) => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('change', () => {
            ipcRenderer.send('update-spotify-plugin-settings', { [settingKey]: el.checked });
        });
    }
};

// Attach listeners
attachAutoSave('spotifyPluginRpcToggle', 'showInRichPresence');

// === IPC Event Handlers ===

// Sync Auto-Detect toggle when changed from tray menu
ipcRenderer.on('autodetect-toggled', (event, enabled) => {
    if (autoDetectToggle) {
        autoDetectToggle.checked = enabled;
    }
    require('./modules/ui-context').setAutoDetect(enabled);
});

// === NEON MODE TOGGLE ===
const neonToggle = document.getElementById('neonToggle');
const neonModeKey = 'solari_neon_mode';

// Initialize neon mode from localStorage (default ON)
const neonModeEnabled = localStorage.getItem(neonModeKey) !== 'false';
if (neonModeEnabled) {
    document.body.classList.add('neon-mode');
    if (neonToggle) neonToggle.checked = true;
} else {
    document.body.classList.remove('neon-mode');
    if (neonToggle) neonToggle.checked = false;
}

if (neonToggle) {
    neonToggle.addEventListener('change', () => {
        const isEnabled = neonToggle.checked;
        if (isEnabled) {
            document.body.classList.add('neon-mode');
        } else {
            document.body.classList.remove('neon-mode');
        }
        localStorage.setItem(neonModeKey, isEnabled);
    });
}

// ===== IDENTITIES (App Profiles) MANAGER =====

let editingIdentityId = null;

async function loadIdentities() {
    try {
        identities = await ipcRenderer.invoke('get-identities');
        renderIdentities();
        populatePresetClientIdDropdown();
        if (window.ExtensionTabManager && typeof window.ExtensionTabManager.renderMappings === 'function') {
            window.ExtensionTabManager.renderMappings();
        }
    } catch (e) {
        console.error('[Solari] Failed to load identities:', e);
    }
}

function maskClientId(id) {
    if (!id) return '';
    if (id.length <= 4) return '••••••';
    return '••••••' + id.slice(-4);
}

function renderIdentities() {
    const container = document.getElementById('identityList');
    if (!container) return;

    let html = '';

    const defaultProfiles = [
        { name: `YouTube (${t('identities.factoryClientIds') || 'Extensão'})`, clientId: '1461859944390332496' },
        { name: `YouTube Music (${t('identities.factoryClientIds') || 'Extensão'})`, clientId: '1520432295255871498' },
        { name: `Twitch (${t('identities.factoryClientIds') || 'Extensão'})`, clientId: '1461860225765347472' },
        { name: `Netflix (${t('identities.factoryClientIds') || 'Extensão'})`, clientId: '1461881250498482409' },
        { name: `Prime Video (${t('identities.factoryClientIds') || 'Extensão'})`, clientId: '1511842632240730112' }
    ];

    html += defaultProfiles.map(profile => `
        <div class="identity-item default-identity" style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: rgba(16,185,129,0.08); border: 1px dashed rgba(16,185,129,0.2); border-radius: 8px; margin-bottom: 6px;">
            <span style="flex: 1; font-weight: 500; color: #10b981;">🔌 ${profile.name}</span>
            <span style="color: rgba(255,255,255,0.4); font-size: 0.8em; font-family: monospace;">${maskClientId(profile.clientId)}</span>
            <div style="font-size: 0.75em; color: #10b981; padding: 2px 6px; background: rgba(16,185,129,0.1); border-radius: 4px; font-weight: bold;">Ativo</div>
        </div>
    `).join('');

    if (identities.length > 0) {
        html += identities.map(identity => `
            <div class="identity-item" data-id="${identity.id}" style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 6px;">
                <span style="flex: 1; font-weight: 500;">${identity.name}</span>
                <span style="color: rgba(255,255,255,0.4); font-size: 0.8em; font-family: monospace;">${maskClientId(identity.clientId)}</span>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-icon edit-identity-btn" data-id="${identity.id}" title="${t('identities.edit') || 'Edit'}" style="color: #60a5fa;">✏️</button>
                    <button class="btn-icon delete-identity-btn" data-id="${identity.id}" title="${t('identities.remove') || 'Remove'}" style="color: #ef4444;">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    container.innerHTML = html;

    // Add delete handlers
    container.querySelectorAll('.delete-identity-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const name = identities.find(i => i.id === id)?.name || 'Profile';

            const confirmTitle = t('identities.confirmDeleteTitle') || 'Excluir Perfil?';
            const confirmMsg = (t('identities.confirmDeleteMessage') || 'Tem certeza que deseja excluir "{name}"?').replace('{name}', name);

            if (await showConfirmModal(confirmTitle, confirmMsg)) {
                await ipcRenderer.invoke('delete-identity', id);
                await loadIdentities();
                showToast('🗑️', t('identities.deleted') || 'Perfil removido', 'info');
            }
        });
    });
    // Add edit handlers
    container.querySelectorAll('.edit-identity-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const identity = identities.find(i => i.id === id);
            if (identity) {
                document.getElementById('newIdentityName').value = identity.name;
                document.getElementById('newIdentityId').value = identity.clientId;
                editingIdentityId = id;
                document.getElementById('addIdentityBtn').textContent = '💾 Save';
                document.getElementById('cancelIdentityEditBtn').style.display = 'block';
                document.getElementById('newIdentityName').focus();
            }
        });
    });
}

function populatePresetClientIdDropdown() {
    const select = document.getElementById('presetClientId');
    if (!select) return;

    const currentValue = select.value;

    // Keep the default option with proper translation
    const globalDefaultText = t('identities.globalDefault');
    const fallbackText = '🌐 Global Default';
    // If t() returns the key itself (no translation found), use fallback
    const defaultOptionText = (globalDefaultText && !globalDefaultText.includes('identities.'))
        ? globalDefaultText
        : fallbackText;

    // Clear dropdown and start with Global Default and Search options
    select.innerHTML = `
        <option value="">${defaultOptionText}</option>
        <option value="search_client_id">🔍 ${t('identities.searchOption') || 'Pesquisar Client ID...'}</option>
    `;

    // 1. Add Extension Client IDs group
    const defaultProfiles = [
        { name: 'YouTube', clientId: '1461859944390332496' },
        { name: 'Twitch', clientId: '1461860225765347472' },
        { name: 'Netflix', clientId: '1461881250498482409' },
        { name: 'Prime Video', clientId: '1511842632240730112' }
    ];

    const factoryGroup = document.createElement('optgroup');
    factoryGroup.label = `🔌 ${t('identities.factoryClientIds') || 'Extensão'}`;

    defaultProfiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile.clientId;
        option.textContent = `🔌 ${profile.name}`;
        factoryGroup.appendChild(option);
    });
    select.appendChild(factoryGroup);

    // 2. Add Custom Profiles group (only if identities exist)
    if (identities.length > 0) {
        const customGroup = document.createElement('optgroup');
        customGroup.label = `📱 ${t('identities.customProfiles') || 'Personalizados'}`;

        identities.forEach(identity => {
            const option = document.createElement('option');
            option.value = identity.id;
            option.textContent = `📱 ${identity.name}`;
            customGroup.appendChild(option);
        });
        select.appendChild(customGroup);
    }

    // 3. Add Public Client IDs group (dynamically fetched if loaded, otherwise fallback)
    // Filter out YouTube, Twitch, Netflix, and Prime Video since they belong to Extension group
    const extensionIds = ['1461859944390332496', '1520432295255871498', '1461860225765347472', '1461881250498482409', '1511842632240730112'];
    const cached = typeof uiPublicPresets !== 'undefined' ? uiPublicPresets.getCachedPresets() : null;
    const publicProfiles = (cached && Array.isArray(cached))
        ? cached.map(p => ({ name: p.name, clientId: p.clientId })).filter(p => !extensionIds.includes(p.clientId))
        : [
            { name: 'Minecraft', clientId: '1511612772889264168' },
            { name: 'Visual Studio Code', clientId: '1461859764106428518' },
            { name: 'Spotify', clientId: '1511611871533465790' },
            { name: 'Valorant', clientId: '1511612121727635496' },
            { name: 'Albion Online', clientId: '1494704354614181948' },
            { name: 'Call of Duty: Warzone', clientId: '1478926742830841998' },
            { name: 'League of Legends', clientId: '1512115961367367681' },
            { name: 'Counter-Strike 2', clientId: '1512116350758162523' },
            { name: 'Roblox', clientId: '1512116652903239830' },
            { name: 'GTA RP', clientId: '1512117014104375346' },
            { name: 'Figma', clientId: '1512117570080210964' }
        ];

    const publicGroup = document.createElement('optgroup');
    publicGroup.label = `🌍 ${t('identities.publicClientIds') || 'Público'}`;

    publicProfiles.forEach(profile => {
        if (profile.clientId && profile.name) {
            const option = document.createElement('option');
            option.value = profile.clientId;
            option.textContent = `🌍 ${profile.name}`;
            publicGroup.appendChild(option);
        }
    });
    select.appendChild(publicGroup);

    // Restore selected value
    if (currentValue) {
        select.value = currentValue;
        select.dataset.lastValue = currentValue;
    } else {
        select.dataset.lastValue = '';
    }

    // Add change listener to update preview when Client ID changes
    select.onchange = () => {
        if (select.value === 'search_client_id') {
            // Restore previous value so select doesn't stay on "search_client_id"
            select.value = select.dataset.lastValue || '';
            showClientIdSearchModal();
        } else {
            select.dataset.lastValue = select.value;
            updatePreviewAppNameFromDropdown();
        }
    };
}

function buildClientIdOptions(platform, currentValue) {
    const recommendedClientIds = {
        youtube: '1461859944390332496',
        youtubemusic: '1520432295255871498',
        netflix: '1461881250498482409',
        twitch: '1461860225765347472',
        primevideo: '1511842632240730112'
    };

    let html = '';

    // First group: Extensão
    const defaultProfiles = [
        { name: 'YouTube', clientId: '1461859944390332496' },
        { name: 'YouTube Music', clientId: '1520432295255871498' },
        { name: 'Twitch', clientId: '1461860225765347472' },
        { name: 'Netflix', clientId: '1461881250498482409' },
        { name: 'Prime Video', clientId: '1511842632240730112' }
    ];

    html += `<optgroup label="🔌 ${t('identities.factoryClientIds') || 'Extensão'}">`;
    defaultProfiles.forEach(profile => {
        const selectedAttr = profile.clientId === currentValue ? 'selected' : '';
        html += `<option value="${profile.clientId}" ${selectedAttr}>🔌 ${profile.name}</option>`;
    });
    html += `</optgroup>`;

    // Second group: Personalizados
    if (identities && identities.length > 0) {
        html += `<optgroup label="📱 ${t('identities.customProfiles') || 'Personalizados'}">`;
        identities.forEach(identity => {
            const selectedAttr = identity.id === currentValue ? 'selected' : '';
            html += `<option value="${identity.id}" ${selectedAttr}>📱 ${identity.name}</option>`;
        });
        html += `</optgroup>`;
    }

    // Third group: Público
    const extensionIds = ['1461859944390332496', '1461860225765347472', '1461881250498482409', '1511842632240730112'];
    const cached = typeof uiPublicPresets !== 'undefined' ? uiPublicPresets.getCachedPresets() : null;
    const publicProfiles = (cached && Array.isArray(cached))
        ? cached.map(p => ({ name: p.name, clientId: p.clientId })).filter(p => !extensionIds.includes(p.clientId))
        : [
            { name: 'Minecraft', clientId: '1511612772889264168' },
            { name: 'Visual Studio Code', clientId: '1461859764106428518' },
            { name: 'Spotify', clientId: '1511611871533465790' },
            { name: 'Valorant', clientId: '1511612121727635496' },
            { name: 'Albion Online', clientId: '1494704354614181948' },
            { name: 'Call of Duty: Warzone', clientId: '1478926742830841998' },
            { name: 'League of Legends', clientId: '1512115961367367681' },
            { name: 'Counter-Strike 2', clientId: '1512116350758162523' },
            { name: 'Roblox', clientId: '1512116652903239830' },
            { name: 'GTA RP', clientId: '1512117014104375346' },
            { name: 'Figma', clientId: '1512117570080210964' }
        ];

    html += `<optgroup label="🌍 ${t('identities.publicClientIds') || 'Público'}">`;
    publicProfiles.forEach(profile => {
        if (profile.clientId && profile.name) {
            const selectedAttr = profile.clientId === currentValue ? 'selected' : '';
            html += `<option value="${profile.clientId}" ${selectedAttr}>🌍 ${profile.name}</option>`;
        }
    });
    html += `</optgroup>`;

    return html;
}

function showClientIdSearchModal() {
    let existing = document.getElementById('clientIdSearchModal');
    if (existing) existing.remove();

    const select = document.getElementById('presetClientId');
    const lastValue = select ? select.dataset.lastValue || '' : '';

    // Build the items list
    const extensionProfiles = [
        { name: 'YouTube', clientId: '1461859944390332496', type: 'extension', icon: '🔌' },
        { name: 'YouTube Music', clientId: '1520432295255871498', type: 'extension', icon: '🔌' },
        { name: 'Twitch', clientId: '1461860225765347472', type: 'extension', icon: '🔌' },
        { name: 'Netflix', clientId: '1461881250498482409', type: 'extension', icon: '🔌' },
        { name: 'Prime Video', clientId: '1511842632240730112', type: 'extension', icon: '🔌' }
    ];

    const customProfiles = identities.map(i => ({
        name: i.name,
        clientId: i.id, // option value is id (UUID)
        actualClientId: i.clientId, // real numeric ID
        type: 'custom',
        icon: '📱'
    }));

    const extensionIds = ['1461859944390332496', '1520432295255871498', '1461860225765347472', '1461881250498482409', '1511842632240730112'];
    const cached = typeof uiPublicPresets !== 'undefined' ? uiPublicPresets.getCachedPresets() : null;
    const rawPublic = (cached && Array.isArray(cached))
        ? cached.map(p => ({ name: p.name, clientId: p.clientId }))
        : [
            { name: 'Minecraft', clientId: '1511612772889264168' },
            { name: 'Visual Studio Code', clientId: '1461859764106428518' },
            { name: 'Spotify', clientId: '1511611871533465790' },
            { name: 'Valorant', clientId: '1511612121727635496' },
            { name: 'Albion Online', clientId: '1494704354614181948' },
            { name: 'Call of Duty: Warzone', clientId: '1478926742830841998' },
            { name: 'League of Legends', clientId: '1512115961367367681' },
            { name: 'Counter-Strike 2', clientId: '1512116350758162523' },
            { name: 'Roblox', clientId: '1512116652903239830' },
            { name: 'GTA RP', clientId: '1512117014104375346' },
            { name: 'Figma', clientId: '1512117570080210964' }
        ];
    const publicProfiles = rawPublic
        .filter(p => !extensionIds.includes(p.clientId))
        .map(p => ({
            name: p.name,
            clientId: p.clientId, // option value is the numeric ID
            type: 'public',
            icon: '🌍'
        }));

    let allItems = [];
    allItems = allItems.concat(extensionProfiles);
    allItems = allItems.concat(customProfiles);
    allItems = allItems.concat(publicProfiles);

    const overlay = document.createElement('div');
    overlay.id = 'clientIdSearchModal';
    overlay.className = 'modal active';
    overlay.style.zIndex = '9999';

    const modalTitle = t('identities.searchModalTitle') || 'Pesquisar Client ID';

    overlay.innerHTML = `
        <div class="modal-content" style="max-width: 450px; text-align: center;">
            <style>
                .search-modal-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 14px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .search-modal-item:hover {
                    background: rgba(255,255,255,0.08) !important;
                    border-color: rgba(255,255,255,0.12) !important;
                    transform: translateY(-1px);
                }
                .search-modal-item.selected {
                    background: rgba(96,165,250,0.1) !important;
                    border-color: rgba(96,165,250,0.3) !important;
                }
                .search-badge {
                    font-size: 0.72em;
                    font-weight: bold;
                    padding: 2px 6px;
                    border-radius: 4px;
                    text-transform: uppercase;
                }
                .search-badge.extension {
                    background: rgba(16,185,129,0.15);
                    color: #10b981;
                }
                .search-badge.custom {
                    background: rgba(96,165,250,0.15);
                    color: #60a5fa;
                }
                .search-badge.public {
                    background: rgba(245,158,11,0.15);
                    color: #f59e0b;
                }
            </style>
            <h2 style="margin-bottom: 12px; font-size: 1.25rem; background: var(--text-gradient, linear-gradient(135deg, #fff, #a1a1aa)); -webkit-background-clip: text; color: transparent;">${modalTitle}</h2>
            <div style="margin-bottom: 15px;">
                <input type="text" id="clientIdSearchInput" class="preset-input" style="width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 8px;" placeholder="${t('search.placeholder') || 'Digite o nome do app ou ID...'}">
            </div>
            <div id="clientIdSearchList" style="max-height: 280px; overflow-y: auto; text-align: left; display: flex; flex-direction: column; gap: 8px; padding-right: 5px; margin-bottom: 20px;">
                <!-- items rendered dynamically -->
            </div>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button class="btn btn-secondary" id="clientIdSearchCancelBtn" style="flex: 1;">${t('modal.cancel') || 'Cancelar'}</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const searchInput = document.getElementById('clientIdSearchInput');
    const searchList = document.getElementById('clientIdSearchList');
    const cancelBtn = document.getElementById('clientIdSearchCancelBtn');

    // Function to render items
    const renderList = (filterText = '') => {
        const query = filterText.toLowerCase().trim();
        const filtered = allItems.filter(item => 
            item.name.toLowerCase().includes(query) || 
            item.clientId.toLowerCase().includes(query) ||
            (item.actualClientId && item.actualClientId.toLowerCase().includes(query))
        );

        if (filtered.length === 0) {
            searchList.innerHTML = `<p style="text-align: center; color: rgba(255,255,255,0.4); margin: 20px 0;">${t('search.noResults') || 'Nenhum aplicativo encontrado'}</p>`;
            return;
        }

        searchList.innerHTML = filtered.map(item => {
            const isSelected = item.clientId === lastValue;
            const badgeClass = item.type;
            const badgeLabel = item.type === 'extension' ? (t('identities.factoryClientIds') || 'Extensão') :
                               item.type === 'custom' ? (t('identities.customProfiles') || 'Personalizado') :
                               (t('identities.publicClientIds') || 'Público');
            
            return `
                <div class="search-modal-item ${isSelected ? 'selected' : ''}" data-value="${item.clientId}">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.1em;">${item.icon}</span>
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-weight: 500; font-size: 0.95rem;">${item.name}</span>
                            <span style="font-size: 0.78em; color: rgba(255,255,255,0.3); font-family: monospace;">${maskClientId(item.actualClientId || item.clientId)}</span>
                        </div>
                    </div>
                    <span class="search-badge ${badgeClass}">${badgeLabel}</span>
                </div>
            `;
        }).join('');

        // Attach click events
        searchList.querySelectorAll('.search-modal-item').forEach(el => {
            el.addEventListener('click', () => {
                const val = el.dataset.value;
                if (select) {
                    select.value = val;
                    select.dataset.lastValue = val;
                    updatePreviewAppNameFromDropdown();
                }
                overlay.remove();
            });
        });
    };

    // Initial render
    renderList();

    // Input listener with simple debounce/immediate change handler
    searchInput.addEventListener('input', (e) => {
        renderList(e.target.value);
    });

    // Close handlers
    const close = () => overlay.remove();
    cancelBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    // Focus input on load
    setTimeout(() => searchInput.focus(), 100);
}

// Update preview app name based on selected Client ID in dropdown
function updatePreviewAppNameFromDropdown() {
    const select = document.getElementById('presetClientId');
    if (!select) return;

    const selectedValue = select.value;

    if (selectedValue) {
        // Find the identity by ID (custom profile)
        const selectedIdentity = identities.find(i => i.id === selectedValue);
        if (selectedIdentity) {
            discordAppName = selectedIdentity.name;
        } else {
            // Check if it's one of the extension or public Client IDs
            const defaults = {
                // Extension (Factory)
                '1461859944390332496': 'YouTube',
                '1520432295255871498': 'YouTube Music',
                '1461860225765347472': 'Twitch',
                '1461881250498482409': 'Netflix',
                '1511842632240730112': 'Prime Video'
            };

            // Dynamically populate defaults mapping from public presets if available
            const cached = typeof uiPublicPresets !== 'undefined' ? uiPublicPresets.getCachedPresets() : null;
            if (cached && Array.isArray(cached)) {
                cached.forEach(p => {
                    if (p.clientId && p.name) {
                        defaults[p.clientId] = p.name;
                    }
                });
            } else {
                // Fallback public mappings
                const fallbackPublic = [
                    { name: 'Minecraft', clientId: '1511612772889264168' },
                    { name: 'Visual Studio Code', clientId: '1461859764106428518' },
                    { name: 'Spotify', clientId: '1511611871533465790' },
                    { name: 'Valorant', clientId: '1511612121727635496' },
                    { name: 'Albion Online', clientId: '1494704354614181948' },
                    { name: 'Call of Duty: Warzone', clientId: '1478926742830841998' },
                    { name: 'League of Legends', clientId: '1512115961367367681' },
                    { name: 'Counter-Strike 2', clientId: '1512116350758162523' },
                    { name: 'Roblox', clientId: '1512116652903239830' },
                    { name: 'GTA RP', clientId: '1512117014104375346' },
                    { name: 'Figma', clientId: '1512117570080210964' }
                ];
                fallbackPublic.forEach(p => {
                    defaults[p.clientId] = p.name;
                });
            }

            if (defaults[selectedValue]) {
                discordAppName = defaults[selectedValue];
            } else {
                discordAppName = 'Discord App';
            }
        }
    } else {
        // Global default - restore the original app name from main process
        discordAppName = globalDefaultAppName;
    }

    // Update preview
    updatePreview();
}

// Add Identity Button Handler
const addIdentityBtn = document.getElementById('addIdentityBtn');
if (addIdentityBtn) {
    addIdentityBtn?.addEventListener('click', async () => {
        const nameInput = document.getElementById('newIdentityName');
        const idInput = document.getElementById('newIdentityId');

        const name = nameInput?.value.trim();
        const id = idInput?.value.trim();

        if (!name || !id) {
            showToast('⚠️', t('identities.fillNameAndId') || 'Fill in name and Client ID', 'warning');
            return;
        }

        // Validate Client ID format (relaxed range to accommodate newer/older IDs)
        if (!/^\d{15,30}$/.test(id)) {
            showToast('⚠️', t('identities.invalidClientId') || 'Invalid Client ID (must be numeric, 15-30 digits)', 'warning');
            return;
        }

        // Create proper identity object
        // id: Internal unique ID
        // clientId: Discord Application ID
        const newIdentity = {
            id: editingIdentityId || 'identity_' + Date.now() + Math.random().toString(36).substr(2, 5),
            clientId: id,
            name: name
        };

        await ipcRenderer.invoke('add-identity', newIdentity);
        await loadIdentities();

        resetIdentityForm();
        if (editingIdentityId) {
            showToast('✅', (t('identities.updated') || 'Profile updated!'), 'success');
        } else {
            showToast('✅', (t('identities.added') || 'Profile "{name}" added!').replace('{name}', name), 'success');
        }
    });

    const cancelIdentityEditBtn = document.getElementById('cancelIdentityEditBtn');
    if (cancelIdentityEditBtn) {
        cancelIdentityEditBtn?.addEventListener('click', () => {
            resetIdentityForm();
        });
    }
}

// Load identities on startup
loadIdentities();

// --- About Modal Logic ---
const aboutBtn = document.getElementById('aboutBtn');
const closeAboutBtn = document.getElementById('closeAboutBtn');
const aboutModal = document.getElementById('aboutModal');

if (aboutBtn && aboutModal) {
    aboutBtn?.addEventListener('click', () => {
        aboutModal.classList.add('active');
    });
}

if (closeAboutBtn && aboutModal) {
    closeAboutBtn?.addEventListener('click', () => {
        aboutModal.classList.remove('active');
    });
}

if (aboutModal) {
    aboutModal?.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
            aboutModal.classList.remove('active');
        }
    });

    // Listen for menu command
    ipcRenderer.on('open-about-modal', () => {
        aboutModal.classList.add('active');
    });

    // Populate Version
    ipcRenderer.invoke('get-app-version').then(version => {
        const aboutVersion = document.getElementById('aboutVersion');
        if (aboutVersion) {
            aboutVersion.textContent = `v${version}`;
        }
    }).catch(err => console.error('[Solari] Failed to get version:', err));
}

// CustomRP2 Toggle Visibility Logic
const toggleIdentityIdBtn = document.getElementById('toggleIdentityIdBtn');
const newIdentityIdInput = document.getElementById('newIdentityId');

if (toggleIdentityIdBtn && newIdentityIdInput) {
    toggleIdentityIdBtn?.addEventListener('click', () => {
        const type = newIdentityIdInput.getAttribute('type') === 'password' ? 'text' : 'password';
        newIdentityIdInput.setAttribute('type', type);
        toggleIdentityIdBtn.textContent = type === 'password' ? '👁️' : '🔒';
    });
}
// Helper to reset identity form
function resetIdentityForm() {
    document.getElementById('newIdentityName').value = '';
    document.getElementById('newIdentityId').value = '';
    editingIdentityId = null;
    document.getElementById('addIdentityBtn').textContent = '+ Add';
    const cancelBtn = document.getElementById('cancelIdentityEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';
}

// ==========================================
// QUICK SETUP WIZARD IMPLEMENTATION
// ==========================================

let wizardOverlay = document.getElementById('setupWizard');
let wizardSlides = document.querySelectorAll('.wizard-slide');
let wizardNextBtn = document.getElementById('wizardNextBtn');
let wizardBackBtn = document.getElementById('wizardBackBtn');
let stepDots = document.querySelectorAll('.step-dot');
let currentWizardSlide = 1;
const totalWizardSlides = 8;

function updateMockupThemeStyle() {
    try {
        const mockup = document.getElementById('wizardDiscordMockup');
        if (!mockup) return;
        
        // Clear any theme class
        mockup.className = 'discord-mockup-card';
        
        // Get current active theme
        const activeTheme = document.documentElement.getAttribute('data-theme') || 'default';
        mockup.classList.add(`theme-${activeTheme}`);
        
        // Neon mode check
        const isNeonActive = document.body.classList.contains('neon-mode');
        if (isNeonActive) {
            mockup.classList.add('neon-active');
        }
    } catch (e) {
        console.error('[Solari] Error in updateMockupThemeStyle:', e);
    }
}

function populateWizardSummary() {
    try {
        const summaryList = document.getElementById('wizardSummaryList');
        if (!summaryList) return;
        
        summaryList.innerHTML = '';
        
        // 1. Language
        const activeLangCard = document.querySelector('.lang-card.active');
        const langName = activeLangCard ? activeLangCard.querySelector('span:not(.flag)').textContent : 'English';
        const langFlag = activeLangCard ? activeLangCard.querySelector('.flag').textContent : '🇺🇸';
        
        // 2. Theme
        const activeThemeCard = document.querySelector('.theme-card-premium.active');
        const themeName = activeThemeCard ? activeThemeCard.querySelector('.theme-preview-label').textContent : 'Original';
        const isNeon = document.getElementById('wizardNeonToggleBtn')?.classList.contains('active') ? ' (+ Neon)' : '';
        
        // 3. Settings Toggles
        const toggles = [];
        if (document.getElementById('wizardToggleStartWindows')?.checked) toggles.push(t('wizard.startWithWindows') || 'Start with Windows');
        if (document.getElementById('wizardToggleStartMinimized')?.checked) toggles.push(t('wizard.startMinimized') || 'Start Minimized');
        if (document.getElementById('wizardToggleMinimizeToTray')?.checked) toggles.push(t('wizard.minimizeToTray') || 'Minimize on Close');
        if (document.getElementById('wizardToggleAutoUpdates')?.checked) toggles.push(t('wizard.autoUpdates') || 'Auto-Check Updates');
        
        // 4. Features Toggles
        const features = [];
        if (document.getElementById('wizardToggleManager')?.checked) features.push(t('wizard.pluginSolariManagerTitle') || 'Solari Manager');
        if (document.getElementById('wizardToggleMotion')?.checked) features.push(t('wizard.pluginSolariMotionTitle') || 'Solari Motion');
        if (document.getElementById('wizardToggleSpotify')?.checked) features.push(t('wizard.pluginSpotifySyncTitle') || 'Spotify Sync');
        if (document.getElementById('wizardToggleMessageTools')?.checked) features.push(t('wizard.pluginSolariMessageToolsTitle') || 'Solari MessageTools');
        if (document.getElementById('wizardTogglePlayer')?.checked) features.push(t('wizard.pluginSolariPlayerTitle') || 'Solari Player');
        
        // Build HTML
        let html = `
            <li><span class="summary-check">✓</span> <span><strong>${t('wizard.summaryLang') || 'Language'}:</strong> ${langFlag} ${langName}</span></li>
            <li><span class="summary-check">✓</span> <span><strong>${t('wizard.summaryTheme') || 'Theme'}:</strong> 🎨 ${themeName}${isNeon}</span></li>
        `;
        
        if (toggles.length > 0) {
            html += `<li><span class="summary-check">✓</span> <span><strong>${t('wizard.summarySettings') || 'Settings'}:</strong> ${toggles.join(', ')}</span></li>`;
        } else {
            html += `<li><span class="summary-check">✓</span> <span><strong>${t('wizard.summarySettings') || 'Settings'}:</strong> Nenhuma</span></li>`;
        }
        
        if (features.length > 0) {
            html += `<li><span class="summary-check">✓</span> <span><strong>${t('wizard.summaryFeatures') || 'Features'}:</strong> ${features.join(', ')}</span></li>`;
        } else {
            html += `<li><span class="summary-check">✓</span> <span><strong>${t('wizard.summaryFeatures') || 'Features'}:</strong> Nenhuma</span></li>`;
        }
        
        summaryList.innerHTML = html;
    } catch (e) {
        console.error('[Solari] Error in populateWizardSummary:', e);
    }
}

function showSetupWizard() {
    try {
        // Re-query in case DOM elements were loaded dynamically or not ready initially
        if (!wizardOverlay) wizardOverlay = document.getElementById('setupWizard');
        if (!wizardSlides || wizardSlides.length === 0) wizardSlides = document.querySelectorAll('.wizard-slide');
        if (!wizardNextBtn) wizardNextBtn = document.getElementById('wizardNextBtn');
        if (!wizardBackBtn) wizardBackBtn = document.getElementById('wizardBackBtn');
        if (!stepDots || stepDots.length === 0) stepDots = document.querySelectorAll('.step-dot');

        if (!wizardOverlay) {
            console.error('[Solari] wizardOverlay element is null!');
            showToast('❌', 'Contêiner do assistente não encontrado!', 'error');
            return;
        }

        wizardOverlay.style.display = 'flex';
        wizardOverlay.style.opacity = '1';

        // Sync wizard checkboxes with current actual app settings
        if (typeof appSettings !== 'undefined') {
            const tw = document.getElementById('wizardToggleStartWindows');
            if (tw) tw.checked = appSettings.startWithWindows || false;

            const tm = document.getElementById('wizardToggleStartMinimized');
            if (tm) tm.checked = appSettings.startMinimized || false;

            const tc = document.getElementById('wizardToggleMinimizeToTray');
            if (tc) tc.checked = appSettings.closeToTray || false;

            const ta = document.getElementById('wizardToggleAutoUpdates');
            if (ta) ta.checked = appSettings.autoCheckAppUpdates || false;
        }

        // Sync plugins
        const ts = document.getElementById('wizardToggleSmartAfk');
        if (ts && typeof smartAfkConnected !== 'undefined') ts.checked = smartAfkConnected;
        const tsp = document.getElementById('wizardToggleSpotify');
        if (tsp && typeof spotifyConnected !== 'undefined') tsp.checked = spotifyConnected;

        // Sync Client ID Setup Page initial highlight
        const currentId = document.getElementById('wizardClientId');
        const publicIdCards = document.querySelectorAll('.public-id-card');
        const customContainer = document.getElementById('wizardCustomIdContainer');
        
        if (currentId && customContainer) {
            const savedId = typeof appSettings !== 'undefined' ? (appSettings.clientId || '') : '';
            currentId.value = savedId;
            
            let foundPublic = false;
            if (publicIdCards) {
                publicIdCards.forEach(card => {
                    card.classList.remove('active');
                    if (card.dataset.publicId === savedId && savedId !== '') {
                        card.classList.add('active');
                        foundPublic = true;
                    }
                });
            }
            
            if (foundPublic) {
                customContainer.classList.remove('active');
                currentId.disabled = true;
                currentId.style.opacity = '0.5';
            } else {
                if (publicIdCards) {
                    const customCard = Array.from(publicIdCards).find(c => c.dataset.publicId === 'custom');
                    if (customCard) customCard.classList.add('active');
                }
                customContainer.classList.add('active');
                currentId.disabled = false;
                currentId.style.opacity = '1';
            }
        }

        // Neon Toggle status check
        const wizardNeonToggleBtn = document.getElementById('wizardNeonToggleBtn');
        if (wizardNeonToggleBtn) {
            const isNeonActive = document.body.classList.contains('neon-mode');
            wizardNeonToggleBtn.classList.toggle('active', isNeonActive);
        }

        // Sync Premium Theme active status check
        const activeTheme = document.documentElement.getAttribute('data-theme') || 'default';
        const themeCards = document.querySelectorAll('.theme-card-premium:not(.neon-toggle-premium)');
        if (themeCards) {
            themeCards.forEach(card => {
                card.classList.toggle('active', card.dataset.themePreview === activeTheme);
            });
        }

        currentWizardSlide = 1;
        updateWizardUI();
        updateMockupThemeStyle();

        // Premium: Auto-detect language (Support 20 languages)
        const userLang = navigator.language.split('-')[0].toLowerCase();
        const map = {
            'pt': 'pt-BR', 'es': 'es', 'fr': 'fr', 'de': 'de', 'it': 'it',
            'ja': 'ja', 'ko': 'ko', 'ru': 'ru', 'zh': 'zh-CN', 'tr': 'tr',
            'pl': 'pl', 'nl': 'nl', 'sv': 'sv-SE', 'vi': 'vi', 'th': 'th',
            'id': 'id', 'he': 'he', 'hi': 'hi', 'bn': 'bn'
        };

        if (map[userLang]) {
            setWizardLanguage(map[userLang]);
        } else {
            setWizardLanguage('en');
        }
    } catch (e) {
        console.error('[Solari] Error in showSetupWizard:', e);
        showToast('❌', 'Erro no assistente: ' + e.message, 'error');
    }
}

// ==========================================
// DEVTOOLS SHORTCUT LISTENER
// ==========================================
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        ipcRenderer.send('toggle-devtools');
    }
});

function updateWizardUI() {
    try {
        if (!wizardOverlay) {
            wizardOverlay = document.getElementById('setupWizard');
            if (!wizardOverlay) return;
        }

        // Remove previous background gradient classes
        for (let i = 1; i <= totalWizardSlides; i++) {
            wizardOverlay.classList.remove(`gradient-slide-${i}`);
        }
        // Add current slide gradient
        wizardOverlay.classList.add(`gradient-slide-${currentWizardSlide}`);

        // Update Slides
        if (!wizardSlides || wizardSlides.length === 0) {
            wizardSlides = document.querySelectorAll('.wizard-slide');
        }
        if (wizardSlides) {
            wizardSlides.forEach(slide => {
                const slideNum = parseInt(slide.dataset.slide);
                slide.classList.remove('active', 'exit-left');

                if (slideNum === currentWizardSlide) {
                    slide.classList.add('active');
                    applyTranslations();
                } else if (slideNum < currentWizardSlide) {
                    slide.classList.add('exit-left');
                }
            });
        }

        // Update Stepper Progress track & badges
        const progressPercent = ((currentWizardSlide - 1) / (totalWizardSlides - 1)) * 100;
        const progressTrack = document.getElementById('stepperProgress');
        if (progressTrack) {
            progressTrack.style.width = `${progressPercent}%`;
        }
        
        const stepBadges = document.querySelectorAll('.step-badge');
        if (stepBadges) {
            stepBadges.forEach(badge => {
                const stepNum = parseInt(badge.dataset.step);
                badge.classList.remove('active', 'completed');
                if (stepNum === currentWizardSlide) {
                    badge.classList.add('active');
                } else if (stepNum < currentWizardSlide) {
                    badge.classList.add('completed');
                }
            });
        }

        // Update Controls
        if (!wizardBackBtn) wizardBackBtn = document.getElementById('wizardBackBtn');
        if (wizardBackBtn) {
            if (currentWizardSlide === 1) {
                wizardBackBtn.style.display = 'none';
            } else {
                wizardBackBtn.style.display = 'inline-block';
            }
        }

        if (!wizardNextBtn) wizardNextBtn = document.getElementById('wizardNextBtn');
        if (wizardNextBtn) {
            if (currentWizardSlide === totalWizardSlides) {
                const startText = t('wizard.start') || 'Start Solari!';
                wizardNextBtn.textContent = startText;

                // Trigger dynamic summary populate
                populateWizardSummary();

                // Trigger initial confetti on last slide
                if (uiWizard && typeof uiWizard.confetti === 'function') {
                    uiWizard.confetti();
                }
            } else {
                const nextText = t('wizard.next') || 'Next';
                wizardNextBtn.textContent = nextText;
            }
        }

        // Toggle Preview Mode for Theme Slide (Slide 2)
        if (currentWizardSlide === 2) {
            wizardOverlay.classList.add('preview-mode');
            updateMockupThemeStyle();
        } else {
            wizardOverlay.classList.remove('preview-mode');

            // Check BetterDiscord status if slide 6
            if (currentWizardSlide === 6) {
                checkWizardBdStatus();
            }

            // RESET DRAG POSITIONING if user moved it
            const wizardContainer = document.querySelector('.wizard-containerglass');
            if (wizardContainer) {
                wizardContainer.style.position = '';
                wizardContainer.style.left = '';
                wizardContainer.style.top = '';
                wizardContainer.style.margin = '';
                wizardContainer.style.transform = '';
                wizardContainer.style.cursor = ''; // Reset cursor
            }
        }
    } catch (e) {
        console.error('[Solari] Error in updateWizardUI:', e);
    }
}

function nextWizardSlide() {
    if (currentWizardSlide < totalWizardSlides) {
        currentWizardSlide++;
        updateWizardUI();
    } else {
        finishWizard();
    }
}

function prevWizardSlide() {
    if (currentWizardSlide > 1) {
        currentWizardSlide--;
        updateWizardUI();
    }
}

function finishWizard() {
    // Save Client ID
    const currentIdInput = document.getElementById('wizardClientId');
    if (currentIdInput) {
        ipcRenderer.send('set-setting', 'clientId', currentIdInput.value.trim());
    }

    // Save all explicitly toggled settings from Slide 4 and Slide 6 to ensure defaults hold
    const toggleStartWindows = document.getElementById('wizardToggleStartWindows');
    if (toggleStartWindows) ipcRenderer.send('set-setting', 'startWithWindows', toggleStartWindows.checked);

    const toggleStartMinimized = document.getElementById('wizardToggleStartMinimized');
    if (toggleStartMinimized) ipcRenderer.send('set-setting', 'startMinimized', toggleStartMinimized.checked);

    const toggleMinimizeToTray = document.getElementById('wizardToggleMinimizeToTray');
    if (toggleMinimizeToTray) ipcRenderer.send('set-setting', 'minimizeToTray', toggleMinimizeToTray.checked);

    const toggleAutoUpdates = document.getElementById('wizardToggleAutoUpdates');
    if (toggleAutoUpdates) ipcRenderer.send('set-setting', 'autoCheckAppUpdates', toggleAutoUpdates.checked);

    const toggleManager = document.getElementById('wizardToggleManager');
    if (toggleManager) ipcRenderer.invoke('bd:toggle-plugin', { pluginName: 'SolariManager', enabled: toggleManager.checked }).catch(() => {});

    const toggleMotion = document.getElementById('wizardToggleMotion');
    if (toggleMotion) ipcRenderer.invoke('bd:toggle-plugin', { pluginName: 'SolariMotion', enabled: toggleMotion.checked }).catch(() => {});

    const toggleSpotify = document.getElementById('wizardToggleSpotify');
    if (toggleSpotify) ipcRenderer.invoke('bd:toggle-plugin', { pluginName: 'SpotifySync', enabled: toggleSpotify.checked }).catch(() => {});

    const toggleMessageTools = document.getElementById('wizardToggleMessageTools');
    if (toggleMessageTools) ipcRenderer.invoke('bd:toggle-plugin', { pluginName: 'SolariMessageTools', enabled: toggleMessageTools.checked }).catch(() => {});

    const togglePlayer = document.getElementById('wizardTogglePlayer');
    if (togglePlayer) ipcRenderer.invoke('bd:toggle-plugin', { pluginName: 'SolariPlayer', enabled: togglePlayer.checked }).catch(() => {});

    // Save completion state
    ipcRenderer.send('complete-setup');

    // Force UI refresh locally to reflect wizard choices in Settings Tab
    setTimeout(() => {
        ipcRenderer.send('get-data');
    }, 100);

    // Trigger launching animation on the rocket
    const rocket = document.getElementById('wizardRocket');
    if (rocket) {
        rocket.classList.add('launching');
        
        // Continuously fire confetti bursts during launch
        let burstsCount = 0;
        const burstInterval = setInterval(() => {
            if (typeof uiWizard !== 'undefined') uiWizard.confetti();
            burstsCount++;
            if (burstsCount >= 3) clearInterval(burstInterval);
        }, 200);
    }

    // Fade out with delay to let rocket launch
    setTimeout(() => {
        wizardOverlay.style.transition = 'opacity 0.5s';
        wizardOverlay.style.opacity = '0';
        setTimeout(() => {
            wizardOverlay.style.display = 'none';
            wizardOverlay.style.opacity = '1'; // Reset for next time
            if (rocket) rocket.classList.remove('launching'); // Reset rocket class
        }, 500);
    }, 800);
}

// Wizard Event Listeners
if (wizardNextBtn) wizardNextBtn?.addEventListener('click', nextWizardSlide);
if (wizardBackBtn) wizardBackBtn?.addEventListener('click', prevWizardSlide);

// Step 1: Language
document.querySelectorAll('.lang-card').forEach(card => {
    card?.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);
    });

    card?.addEventListener('click', () => {
        setWizardLanguage(card.dataset.lang);
    });
});

function setWizardLanguage(code) {
    document.querySelectorAll('.lang-card').forEach(c => {
        c.classList.toggle('active', c.dataset.lang === code);
    });

    initI18n(code).then(() => {
        updateUILanguage();
        updateWizardUI();
        handleGlobalLanguageChange(code);
        ipcRenderer.send('save-language', code);
    });
}

// Step 2: Themes Click handler (Premium Grid)
document.querySelectorAll('.theme-card-premium:not(.neon-toggle-premium)').forEach(card => {
    card?.addEventListener('click', () => {
        document.querySelectorAll('.theme-card-premium:not(.neon-toggle-premium)').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        const theme = card.dataset.themePreview;
        setTheme(theme);
        updateMockupThemeStyle();
    });
});

// Neon toggle button in wizard
const wizardNeonToggleBtn = document.getElementById('wizardNeonToggleBtn');
if (wizardNeonToggleBtn) {
    wizardNeonToggleBtn.addEventListener('click', () => {
        wizardNeonToggleBtn.classList.toggle('active');
        const neonToggle = document.getElementById('neonToggle');
        if (neonToggle) {
            neonToggle.checked = wizardNeonToggleBtn.classList.contains('active');
            neonToggle.dispatchEvent(new Event('change'));
        }
        updateMockupThemeStyle();
    });
}

// Step 5: Public Client ID selectors
document.querySelectorAll('.public-id-card').forEach(card => {
    card?.addEventListener('click', () => {
        document.querySelectorAll('.public-id-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        const selectedId = card.dataset.publicId;
        const customContainer = document.getElementById('wizardCustomIdContainer');
        const input = document.getElementById('wizardClientId');
        
        if (selectedId === 'custom') {
            customContainer.classList.add('active');
            input.disabled = false;
            input.style.opacity = '1';
            input.value = '';
            input.focus();
        } else {
            customContainer.classList.remove('active');
            input.value = selectedId;
            input.disabled = true;
            input.style.opacity = '0.5';
        }
    });
});

// Step 5: Client ID Helper Link
const wizardPortalLink = document.getElementById('wizardPortalLink');
if (wizardPortalLink) {
    wizardPortalLink?.addEventListener('click', (e) => {
        e.preventDefault();
        ipcRenderer.send('open-external-url', 'https://discord.com/developers/applications');
    });
}

// Step 6: Plugins Auto-Download Logic
const WIZARD_PLUGINS = {
    'manager': {
        fileName: 'SolariManager.plugin.js',
        url: 'https://raw.githubusercontent.com/TheDroidBR/Solari/main/plugins/SolariManager.plugin.js',
        toggleId: 'wizardToggleManager'
    },
    'motion': {
        fileName: 'SolariMotion.plugin.js',
        url: 'https://raw.githubusercontent.com/TheDroidBR/Solari/main/plugins/SolariMotion.plugin.js',
        toggleId: 'wizardToggleMotion'
    },
    'spotify': {
        fileName: 'SpotifySync.plugin.js',
        url: 'https://raw.githubusercontent.com/TheDroidBR/Solari/main/plugins/SpotifySync.plugin.js',
        toggleId: 'wizardToggleSpotify'
    },
    'messageTools': {
        fileName: 'SolariMessageTools.plugin.js',
        url: 'https://raw.githubusercontent.com/TheDroidBR/Solari/main/plugins/SolariMessageTools.plugin.js',
        toggleId: 'wizardToggleMessageTools'
    },
    'player': {
        fileName: 'SolariPlayer.plugin.js',
        url: 'https://raw.githubusercontent.com/TheDroidBR/Solari/main/plugins/SolariPlayer.plugin.js',
        toggleId: 'wizardTogglePlayer'
    }
};

async function checkWizardBdStatus() {
    const badge = document.getElementById('wizardBdStatusBadge');
    const actionBtn = document.getElementById('wizardBdActionBtn');
    const uninstallBtn = document.getElementById('wizardBdUninstallBtn');
    if (!badge || !actionBtn) return;

    try {
        badge.className = 'wizard-bd-status-badge status-loading';
        badge.textContent = t('wizard.bdStatusDetecting') || 'Detectando...';
        
        const result = await ipcRenderer.invoke('plugin:check-bd');
        const status = result?.status || 'not_installed';
        const version = result?.bdVersion || '';

        // Remove status classes
        badge.classList.remove('status-loading', 'status-ok', 'status-missing', 'status-broken');

        const btnLabel = actionBtn.querySelector('.btn-label');

        if (status === 'ok') {
            badge.classList.add('status-ok');
            badge.textContent = `${t('wizard.bdStatusInstalled') || 'Instalado e Ativo'} ${version ? `(v${version})` : ''}`;
            
            if (btnLabel) {
                btnLabel.setAttribute('data-i18n', 'wizard.bdBtnReinstall');
                btnLabel.textContent = t('wizard.bdBtnReinstall') || 'Reinstalar / Reparar';
            }
            if (uninstallBtn) uninstallBtn.classList.remove('hidden');
        } else if (status === 'broken' || status === 'incompatible' || status === 'incompatible_update') {
            badge.classList.add('status-broken');
            badge.textContent = t('wizard.bdStatusBroken') || 'Danificado / Incompatível';
            
            if (btnLabel) {
                btnLabel.setAttribute('data-i18n', 'wizard.bdBtnRepair');
                btnLabel.textContent = t('wizard.bdBtnRepair') || 'Reparar BetterDiscord';
            }
            if (uninstallBtn) uninstallBtn.classList.add('hidden');
        } else if (status === 'uninstalling') {
            badge.classList.add('status-loading');
            badge.textContent = t('wizard.bdStatusUninstalling') || 'Desinstalando...';
            if (uninstallBtn) uninstallBtn.classList.add('hidden');
        } else if (status === 'pending_update' || status === 'outdated') {
            badge.classList.add('status-broken');
            badge.textContent = t('wizard.bdStatusOutdated') || 'Atualização Pendente';
            
            if (btnLabel) {
                btnLabel.setAttribute('data-i18n', 'wizard.bdBtnUpdate');
                btnLabel.textContent = t('wizard.bdBtnUpdate') || 'Atualizar BetterDiscord';
            }
            if (uninstallBtn) uninstallBtn.classList.remove('hidden');
        } else {
            // not_installed or fallback
            badge.classList.add('status-missing');
            badge.textContent = t('wizard.bdStatusNotInstalled') || 'Não Instalado ❌';
            
            if (btnLabel) {
                btnLabel.setAttribute('data-i18n', 'wizard.bdBtnInstall');
                btnLabel.textContent = t('wizard.bdBtnInstall') || 'Instalar BetterDiscord';
            }
            if (uninstallBtn) uninstallBtn.classList.add('hidden');
        }

        // Toggle state of plugins toggles based on BD status
        const isBDInstalled = (status === 'ok' || status === 'pending_update' || status === 'outdated');
        
        for (const [key, config] of Object.entries(WIZARD_PLUGINS)) {
            const toggle = document.getElementById(config.toggleId);
            if (toggle) {
                toggle.disabled = !isBDInstalled;
                const item = toggle.closest('.plugin-toggle-item');
                if (item) {
                    if (!isBDInstalled) {
                        item.style.opacity = '0.4';
                        item.style.pointerEvents = 'none';
                        toggle.checked = false;
                    } else {
                        item.style.opacity = '1';
                        item.style.pointerEvents = 'auto';
                        
                        // Sync with actual installed state
                        const isInstalled = await ipcRenderer.invoke('plugin:check-installed', config.fileName);
                        toggle.checked = isInstalled;
                    }
                }
            }
        }
    } catch (err) {
        console.error('[Wizard] Error checking BD status:', err);
        badge.className = 'wizard-bd-status-badge status-broken';
        badge.textContent = 'Erro de Verificação';
    }
}

async function handleWizardPluginToggle(key, isChecked) {
    const config = WIZARD_PLUGINS[key];
    if (!config) return;
    const toggle = document.getElementById(config.toggleId);
    if (!toggle) return;

    if (isChecked) {
        const isInstalled = await ipcRenderer.invoke('plugin:check-installed', config.fileName);

        if (!isInstalled) {
            toggle.disabled = true;

            const result = await ipcRenderer.invoke('plugin:download', {
                url: config.url,
                fileName: config.fileName
            });

            if (result && result.success) {
                showToast('🚀', t('wizard.pluginEnabled'), 'success');
            } else {
                showToast('❌', t('wizard.pluginError'), 'error');
                toggle.checked = false;
            }
            toggle.disabled = false;
        }
    } else {
        const isInstalled = await ipcRenderer.invoke('plugin:check-installed', config.fileName);
        if (isInstalled) {
            toggle.disabled = true;
            const result = await ipcRenderer.invoke('plugin:delete', config.fileName);
            if (result && result.success) {
                showToast('🗑️', t('wizard.pluginDisabled'), 'success');
            } else {
                showToast('❌', t('wizard.pluginError'), 'error');
                toggle.checked = true;
            }
            toggle.disabled = false;
        }
    }
}

// Multi-toggle handling for Slide 4 (Behavior)
document.getElementById('wizardToggleStartWindows')?.addEventListener('change', (e) => {
    ipcRenderer.send('set-setting', 'startWithWindows', e.target.checked);
});
document.getElementById('wizardToggleStartMinimized')?.addEventListener('change', (e) => {
    ipcRenderer.send('set-setting', 'startMinimized', e.target.checked);
});
document.getElementById('wizardToggleMinimizeToTray')?.addEventListener('change', (e) => {
    ipcRenderer.send('set-setting', 'minimizeToTray', e.target.checked);
});
document.getElementById('wizardToggleAutoUpdates')?.addEventListener('change', (e) => {
    ipcRenderer.send('set-setting', 'autoCheckAppUpdates', e.target.checked);
});

document.getElementById('wizardToggleManager')?.addEventListener('change', (e) => handleWizardPluginToggle('manager', e.target.checked));
document.getElementById('wizardToggleMotion')?.addEventListener('change', (e) => handleWizardPluginToggle('motion', e.target.checked));
document.getElementById('wizardToggleSpotify')?.addEventListener('change', (e) => handleWizardPluginToggle('spotify', e.target.checked));
document.getElementById('wizardToggleMessageTools')?.addEventListener('change', (e) => handleWizardPluginToggle('messageTools', e.target.checked));
document.getElementById('wizardTogglePlayer')?.addEventListener('change', (e) => handleWizardPluginToggle('player', e.target.checked));

document.getElementById('wizardExtensionDownloadBtn')?.addEventListener('click', () => {
    ipcRenderer.send('open-external-url', 'https://solarirpc.com/extension');
});

// BetterDiscord install/uninstall listeners inside the Wizard
const wizardBdActionBtn = document.getElementById('wizardBdActionBtn');
const wizardBdUninstallBtn = document.getElementById('wizardBdUninstallBtn');

if (wizardBdActionBtn) {
    wizardBdActionBtn.addEventListener('click', async () => {
        const btnLabel = wizardBdActionBtn.querySelector('.btn-label');
        const spinner = wizardBdActionBtn.querySelector('.btn-spinner');
        
        wizardBdActionBtn.disabled = true;
        if (spinner) spinner.classList.remove('hidden');
        if (btnLabel) btnLabel.textContent = t('wizard.bdBtnInstalling') || 'Processando...';

        try {
            const statusResult = await ipcRenderer.invoke('plugin:check-bd');
            const status = statusResult?.status || 'not_installed';
            
            let result;
            if (status === 'ok' || status === 'broken' || status === 'incompatible' || status === 'incompatible_update' || status === 'pending_update' || status === 'outdated') {
                result = await ipcRenderer.invoke('plugin:install-bd');
            } else {
                result = await ipcRenderer.invoke('plugin:install-bd');
            }

            if (result && result.success) {
                showToast('✅', t('pluginStore.bdSuccess') || 'BetterDiscord instalado com sucesso!', 'success');
            } else {
                showToast('❌', `Erro: ${result?.error || 'Falha'}`, 'error');
            }
        } catch (e) {
            showToast('❌', `Erro: ${e.message}`, 'error');
        }

        if (spinner) spinner.classList.add('hidden');
        wizardBdActionBtn.disabled = false;
        
        // Re-check status
        checkWizardBdStatus();
    });
}

if (wizardBdUninstallBtn) {
    wizardBdUninstallBtn.addEventListener('click', async () => {
        wizardBdUninstallBtn.disabled = true;

        try {
            const result = await ipcRenderer.invoke('plugin:uninstall-bd');
            if (result && result.success) {
                showToast('✅', 'BetterDiscord desinstalado com sucesso!', 'success');
            } else {
                showToast('❌', `Erro: ${result?.error || 'Falha'}`, 'error');
            }
        } catch (e) {
            showToast('❌', `Erro: ${e.message}`, 'error');
        }

        wizardBdUninstallBtn.disabled = false;
        // Re-check status
        checkWizardBdStatus();
    });
}

// --- CONFETTI + WIZARD DRAG (extracted to module) ---
const uiWizard = require('./modules/ui-wizard');
uiWizard.init();


// (wizard drag listeners registered in uiWizard.init() below)



// ===== CHANGELOG MODAL (extracted to module) =====
const uiChangelog = require('./modules/ui-changelog');
uiChangelog.init();


ipcRenderer.on('show-changelog', (event, data) => {
    const { version, body, name } = data;

    // Don't create duplicate modals
    if (document.getElementById('changelogModal')) return;

    // Convert markdown body to basic HTML
    const htmlBody = convertMarkdownToHtml(body);

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'changelogModal';
    overlay.className = 'changelog-overlay';
    overlay.innerHTML = `
        <div class="changelog-container">
            <div class="changelog-header">
                <div class="changelog-title-row">
                    <span class="changelog-icon">🎉</span>
                    <h2>${name || 'Solari v' + version}</h2>
                </div>
                <p class="changelog-subtitle">${t('changelog') || 'Changelog'}</p>
            </div>
            <div class="changelog-body">${htmlBody}</div>
            <div class="changelog-footer">
                <button class="btn-primary changelog-close-btn" id="closeChangelogBtn">
                    ${t('wizard.start') || 'OK'}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => overlay.classList.add('active'));

    // Close handlers
    const closeBtn = document.getElementById('closeChangelogBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        });
    }

    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        }
    });
});

/**
 * Basic Markdown to HTML converter (no external deps).
 * Handles: headers, bold, italic, lists, links, inline code, code blocks, line breaks.
 */
function convertMarkdownToHtml(md) {
    if (!md) return '';

    let html = md
        // Escape HTML
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Code blocks (```...```)
        .replace(/```([^`]*?)```/gs, '<pre><code>$1</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Headers
        .replace(/^### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^## (.+)$/gm, '<h3>$1</h3>')
        .replace(/^# (.+)$/gm, '<h2>$1</h2>')
        // Bold + Italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        // Unordered lists
        .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
        // Line breaks (double newline = paragraph, single = br)
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // Wrap loose <li> in <ul>
    html = html.replace(/(<li>.*?<\/li>)/gs, (match) => {
        // Only wrap if not already in a ul
        return '<ul>' + match + '</ul>';
    });

    // Clean up consecutive </ul><ul>
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    return '<p>' + html + '</p>';
}

/**
 * Mascara caminhos de arquivos para privacidade (ex: C:\Users\Gabriel\... -> ~\)
 * @param {string} text 
 */
function maskPaths(text) {
    if (typeof text !== 'string') return text;
    return text.replace(/([a-zA-Z]:\\Users\\[^\\]+\\)|(\/home\/[^\/]+\/)/g, '~\\');
}

// ===== TOAST NOTIFICATION SYSTEM (extracted to module) =====
const uiToast = require('./modules/ui-toast');
// Backward-compatible global for existing call sites
window.showSolariToast = uiToast.show;
function showSolariToast(msg, type, duration) { return uiToast.show(msg, type, duration); }

/**
 * Show a toast notification at the bottom-right of the screen.
 * @param {string} message - Text to display
 * @param {'success'|'info'|'warning'|'error'} type - Toast type for styling
 * @param {number} duration - How long to show in ms (default 4000)
 */
function showSolariToast(message, type = 'info', duration = 4000) {
    // Mascarar caminhos para privacidade
    const safeMessage = maskPaths(message);

    // Create container if it doesn't exist
    let container = document.getElementById('solariToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'solariToastContainer';
        container.className = 'solari-toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: '✅', info: 'ℹ️', warning: '⚠️', error: '❌' };

    const toast = document.createElement('div');
    toast.className = `solari-toast solari-toast-${type}`;
    toast.innerHTML = `<span class="solari-toast-icon">${icons[type] || icons.info}</span><span class="solari-toast-msg">${message}</span>`;
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => toast.classList.add('show'));

    // Auto dismiss
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// ===== PLUGINSTABMANAGER BOOTSTRAP LISTENERS (v1.11.1 Opt) =====
// Registered at module-level (once) to prevent listener duplication from init() calls
ipcRenderer.on('bd-status-update', (event, data) => {
    PluginsTabManager._handleBDStatusUpdate(data);
});
ipcRenderer.on('bd-runtime-status', (event, data) => {
    PluginsTabManager._handleBDRuntimeStatus(data);
});
ipcRenderer.on('bd-plugins-update', (event, plugins) => {
    PluginsTabManager._renderBDPlugins(plugins);
});

// Listen for plugin update notifications from main process
ipcRenderer.on('plugins-updated', (event, plugins) => {
    if (!plugins || plugins.length === 0) return;

    plugins.forEach((plugin, i) => {
        const cleanName = plugin.name.replace('.plugin.js', '');
        setTimeout(() => {
            showSolariToast(
                `🔌 ${cleanName} ${t('settings.updated') || 'updated'}: ${plugin.from} → ${plugin.to}`,
                'success',
                5000
            );
        }, i * 800); // Stagger toasts
    });
});

// ===== IN-APP UPDATE BUTTON (extracted to module) =====
const uiUpdater = require('./modules/ui-updater');

// ===== HARDWARE SYSTEM MONITOR (extracted to module) =====
const uiHardware = require('./modules/ui-hardware');

/**
 * Helper para abrir modais com animação premium
 * @param {string} modalId 
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
}

/**
 * Helper para fechar modais com animação premium
 * @param {string} modalId 
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('active');
}

/**
 * Implementa o efeito magnético em botões principais e secundários
 */
function initMagneticButtons() {
    const magneticBtns = document.querySelectorAll('.btn-primary, .update-available-btn, .btn-secondary, .btn-primary-large');

    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            // Desativa se o modo eco estiver ativo para economizar recursos
            if (document.body.classList.contains('eco-mode')) return;

            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // Suavidade calculada para não ser agressivo
            btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) scale(1.02)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0px, 0px) scale(1)';
        });
    });
}

// ===== RICH PRESENCE UX MODULES (v1.12.0) =====
const uiValidator = require('./modules/ui-validator');
const uiPreviewMap = require('./modules/ui-preview-map');
const uiContext = require('./modules/ui-context');

// ===== LATE INIT (after all modules are defined) =====
(function lateInit() {
    uiWizard.init();
    uiUpdater.init();
    uiHardware.init();
    uiValidator.init();
    uiPreviewMap.init();
    uiContext.init();
    initMagneticButtons();

    // Wire context bar to existing state variables
    const _autoDetTgl = document.getElementById('autoDetectToggle');
    if (_autoDetTgl) {
        uiContext.setAutoDetect(_autoDetTgl.checked);
    }

    // ── Floating tooltip system for .field-info (ⓘ) ──
    // Appended to <body> so it's never clipped by section overflow:hidden
    const _tip = document.createElement('div');
    _tip.id = 'solari-tooltip';
    document.body.appendChild(_tip);

    let _tipTimer = null;

    function _showTip(el) {
        const text = el.getAttribute('title') || el.getAttribute('data-tip') || '';
        if (!text) return;

        // Temporarily clear title so native tooltip doesn't double-show
        el._savedTitle = text;
        el.removeAttribute('title');

        _tip.textContent = text;
        _tip.classList.add('visible');

        const r = el.getBoundingClientRect();
        const tipW = 260;
        const tipH = _tip.offsetHeight || 80;
        const margin = 8;

        // Prefer showing above; fall back to below if not enough space
        let top = r.top - tipH - margin;
        if (top < 8) top = r.bottom + margin;

        // Center horizontally; clamp to viewport
        let left = r.left + r.width / 2 - tipW / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));

        _tip.style.top = `${top}px`;
        _tip.style.left = `${left}px`;
        _tip.style.width = `${tipW}px`;
    }

    function _hideTip(el) {
        _tip.classList.remove('visible');
        // Restore title so re-hover works next time
        if (el && el._savedTitle) {
            el.setAttribute('title', el._savedTitle);
            delete el._savedTitle;
        }
    }

    // Use event delegation for tooltips to support dynamically added elements (like Presets/Plugins headers)
    document.addEventListener('mouseover', (e) => {
        const el = e.target.closest('.field-info');
        if (el) {
            clearTimeout(_tipTimer);
            _tipTimer = setTimeout(() => _showTip(el), 80);
        }
    });

    document.addEventListener('mouseout', (e) => {
        const el = e.target.closest('.field-info');
        if (el) {
            clearTimeout(_tipTimer);
            _hideTip(el);
        }
    });

    // ── Global Settings Search ──
    const settingsSearch = document.getElementById('settings-search');
    if (settingsSearch) {
        settingsSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.settings-card');

            cards.forEach(card => {
                const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
                const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
                const labels = Array.from(card.querySelectorAll('span')).map(s => s.textContent.toLowerCase()).join(' ');

                if (title.includes(query) || desc.includes(query) || labels.includes(query)) {
                    card.style.display = '';
                    card.classList.add('search-match');
                } else {
                    card.style.display = 'none';
                    card.classList.remove('search-match');
                }
            });
        });
    }
})();


// Hook: rpc-status IPC → context bar (no-op for banner since banner only cares about globalClientId)
ipcRenderer.on('rpc-status', (_, data) => {
    uiContext.setRpcConnected(!!(data && data.connected));
});

// Hook: data-loaded → give ui-context the actual global Client ID to decide banner visibility
// This runs AFTER all startup data is ready, preventing any flash effect.
ipcRenderer.on('data-loaded', (_, data) => {
    uiContext.setGlobalClientId(data && data.globalClientId);

    // Sync current detected preset name to context bar
    uiContext.setDetectedPreset(data ? data.autoDetectPreset : null);

    // Also sync auto-detect toggle state to context bar
    const autoDetTgl = document.getElementById('autoDetectToggle');
    if (autoDetTgl) uiContext.setAutoDetect(autoDetTgl.checked);
});






// --- GENERIC PLUGIN CONFIG MANAGEMENT ---
function getPluginConfigPath(pluginKey, pluginsList = null) {
    const appData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
    let fileName = null;

    // Try to get fileName from list
    if (pluginsList && pluginsList[pluginKey]) {
        fileName = pluginsList[pluginKey].fileName;
    }
    if (!fileName && typeof PluginsTabManager !== 'undefined' && PluginsTabManager.metaData && PluginsTabManager.metaData[pluginKey]) {
        fileName = PluginsTabManager.metaData[pluginKey].fileName;
    }

    if (!fileName) {
        if (pluginKey.toLowerCase() === 'solarimessagetools') fileName = 'SolariMessageTools.plugin.js';
        else if (pluginKey.toLowerCase() === 'solarimotion') fileName = 'SolariMotion.plugin.js';
        else if (pluginKey.toLowerCase() === 'solarinotes') fileName = 'SolariNotes.plugin.js';
        else if (pluginKey.toLowerCase() === 'smartafk') fileName = 'SmartAFKDetector.plugin.js';
        else if (pluginKey.toLowerCase() === 'spotifysync') fileName = 'SpotifySync.plugin.js';
        else {
            const name = pluginKey.charAt(0).toUpperCase() + pluginKey.slice(1);
            fileName = `${name}.plugin.js`;
        }
    }

    const configName = fileName.replace('.plugin.js', '.config.json');
    return path.join(appData, 'BetterDiscord', 'plugins', configName);
}

function loadGenericPluginConfig(pluginKey) {
    try {
        const configPath = getPluginConfigPath(pluginKey);
        const panelId = `config${pluginKey.replace(/\s/g, '')}`;
        let panel = document.getElementById(panelId);

        if (fs.existsSync(configPath)) {
            const raw = fs.readFileSync(configPath, 'utf8');
            let data = null;
            try {
                data = JSON.parse(raw);
            } catch (jsonErr) {
                console.error(`[GenericConfig] Config corruption detected for ${pluginKey}:`, jsonErr);
                showToast('⚠️', 'Arquivo de configuração corrompido! Exibindo alerta...', 'danger');
                if (!panel) {
                    panel = document.createElement('div');
                    panel.id = panelId;
                    panel.className = 'plugin-config-panel';
                    const area = document.getElementById('pluginConfigArea');
                    if (area) area.appendChild(panel);
                }
                panel.innerHTML = `
                    <div style="color: #ef4444; padding: 20px; text-align: center;">
                        <div style="font-size: 3em; margin-bottom: 15px;">⚠️</div>
                        <h3>Erro: Arquivo Corrompido</h3>
                        <p style="margin-top: 10px; color: rgba(255,255,255,0.7); line-height: 1.5;">
                            O arquivo de configuração do plugin <b>${pluginKey}</b> foi corrompido.<br><br>
                            O Solari APP detectou a corrupção do arquivo JSON. Por favor, <b>reinicie o Discord</b> ou tente reabilitar o plugin para restaurar os padrões de fábrica.
                        </p>
                    </div>
                `;
                return;
            }

            if (data && data.settings && data.schema) {
                if (!panel) {
                    panel = document.createElement('div');
                    panel.id = panelId;
                    panel.className = 'plugin-config-panel';
                    panel.style.display = 'none';

                    let icon = '⚙️';
                    let displayName = pluginKey;

                    // Retrieve metadata
                    try {
                        const meta = PluginsTabManager.metaData;
                        if (meta && meta[pluginKey]) {
                            displayName = meta[pluginKey].title || displayName;
                        }
                        const info = PluginsTabManager.pluginInfo[pluginKey];
                        if (info) {
                            displayName = info.displayName || displayName;
                            icon = info.icon || icon;
                        }
                    } catch (e) { }

                    const header = document.createElement('div');
                    header.style.cssText = 'display: flex; align-items: center; gap: 12px; margin-bottom: 20px;';
                    header.innerHTML = `
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(255, 126, 95, 0.4);">
                            <span style="font-size: 1.5em;">${icon}</span>
                        </div>
                        <div>
                            <h2 style="margin: 0; padding: 0; font-size: 1.3em; background: linear-gradient(90deg, #ff7e5f, #feb47b); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">
                                ${displayName}
                            </h2>
                            <p style="margin: 2px 0 0 0; font-size: 0.8em; color: rgba(255,255,255,0.5);">Configurações Dinâmicas</p>
                        </div>
                    `;
                    panel.appendChild(header);

                    const container = document.createElement('div');
                    container.id = `${pluginKey.toLowerCase()}-settings-container`;
                    panel.appendChild(container);

                    const area = document.getElementById('pluginConfigArea');
                    if (area) area.appendChild(panel);
                }

                const containerId = `${pluginKey.toLowerCase()}-settings-container`;
                renderPluginSettings(data.schema, data.settings, pluginKey.toLowerCase(), containerId);
            }
        } else {
            if (!panel) {
                panel = document.createElement('div');
                panel.id = panelId;
                panel.className = 'plugin-config-panel';
                panel.style.display = 'none';
                const area = document.getElementById('pluginConfigArea');
                if (area) area.appendChild(panel);
            }
            panel.innerHTML = `
                <div style="color: #ef4444; padding: 20px; text-align: center;">
                    <div style="font-size: 3em; margin-bottom: 15px;">⚠️</div>
                    <h3>Arquivo de Configurações Não Encontrado</h3>
                    <p style="margin-top: 10px; color: rgba(255,255,255,0.7); line-height: 1.5;">
                        O arquivo de configurações do plugin <b>${pluginKey}</b> não foi gerado pelo BetterDiscord.<br><br>
                        <b>Abra e habilite o plugin "${pluginKey}" dentro do Discord pelo menos 1 vez</b> para gerar o arquivo de link do Solari.
                    </p>
                </div>
            `;
        }
    } catch (error) {
        console.error(`[GenericConfig] Error loading dynamic config schema for ${pluginKey}:`, error);
    }
}

// --- SOLARI MESSAGETOOLS IPC & CONFIG MANAGEMENT ---
function getMessageToolsConfigPath() {
    const appData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
    return path.join(appData, 'BetterDiscord', 'plugins', 'SolariMessageTools.config.json');
}

window.loadSolariMessageToolsConfig = function () {
    try {
        const configPath = getMessageToolsConfigPath();
        if (fs.existsSync(configPath)) {
            const raw = fs.readFileSync(configPath, 'utf8');
            const data = JSON.parse(raw);
            if (data.settings && data.schema) {
                renderPluginSettings(data.schema, data.settings, 'messagetools', 'solari-messagetools-settings-container');
            }
        } else {
            // Em vez de lutar, apenas pedimos pro usuário abri o BD para spawnar o arquivo!
            const container = document.getElementById('solari-messagetools-settings-container');
            if (container) {
                container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Schema não encontrado.<br><br><b>Reinicie ou habilite o Plugin "SolariMessageTools" dentro do BetterDiscord pelo menos 1 vez</b> para gerar o arquivo de link do Solari.</div>';
            }
        }
    } catch (error) {
        console.error("[MessageTools] Error loading dynamic config schema:", error);
    }
};

// ============================================================================
// ==================== RPC SUB-TABS & PUBLIC PRESETS LOGIC ====================
// ============================================================================
const uiPublicPresets = require('./modules/ui-public-presets');
uiPublicPresets.init({
    ipcRenderer,
    t,
    showToast,
    loadIdentities,
    updatePreview,
    updatePreviewAppNameFromDropdown,
    getIdentities: () => identities,
    setIdentities: (val) => { identities = val; },
    getDiscordAppName: () => discordAppName,
    setDiscordAppName: (val) => { discordAppName = val; }
});

// Listen to community presets updates to keep Client ID dropdown dynamic in real-time
document.addEventListener('public-presets-updated', () => {
    console.log('[Solari] Dynamic community presets loaded, updating Client ID dropdown...');
    populatePresetClientIdDropdown();
});

// Silently trigger background fetch for community presets catalog on startup
setTimeout(() => {
    uiPublicPresets.fetchPresetsCatalog(true);
}, 1000);

// ============================================================================
// ==================== BROWSER EXTENSION TAB MANAGER =========================
// ============================================================================
let extensionConnected = false;
let extensionVersion = null;
let lastSessionStats = null;
let statsTickerInterval = null;
let extListenersRegistered = false;

const ExtensionTabManager = {
    init() {
        this.registerListeners();
        this.queryStatus();
    },

    renderMappings() {
        const container = document.getElementById('ext-mappings-container');
        if (!container) return;

        const platforms = ['youtube', 'youtubemusic', 'netflix', 'twitch', 'primevideo'];
        const platformMetadata = {
            youtube: { label: 'YouTube', icon: '🎥' },
            youtubemusic: { label: 'YouTube Music', icon: '🎵' },
            netflix: { label: 'Netflix', icon: '🎬' },
            twitch: { label: 'Twitch', icon: '🎮' },
            primevideo: { label: 'Prime Video', icon: '🍿' }
        };
        const recommendedClientIds = {
            youtube: '1461859944390332496',
            youtubemusic: '1520432295255871498',
            netflix: '1461881250498482409',
            twitch: '1461860225765347472',
            primevideo: '1511842632240730112'
        };

        const mappings = appSettings.extensionMappings || {};

        let html = '';

        platforms.forEach(platform => {
            const meta = platformMetadata[platform];
            const platformMapping = mappings[platform] || {};
            const currentPresetId = platformMapping.presetId || '';
            const currentClientId = platformMapping.clientId || recommendedClientIds[platform];

            const isRecommended = currentClientId === recommendedClientIds[platform];

            // Build Preset options
            let presetOptions = `<option value="">${t('extensionTab.nonePreset') || '-- Nenhum (Padrão) --'}</option>`;
            localPresets.forEach(preset => {
                const selectedAttr = preset.name === currentPresetId ? 'selected' : '';
                presetOptions += `<option value="${preset.name}" ${selectedAttr}>🎮 ${preset.name}</option>`;
            });

            // Build Client ID options
            const clientIdOptions = buildClientIdOptions(platform, currentClientId);

            // Badge html
            let badgeHtml = '';
            if (isRecommended) {
                badgeHtml = `
                    <span style="font-size: 0.75rem; color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                        <span>✔️</span> ${t('extensionTab.recommended') || 'Recomendado'}
                    </span>
                `;
            } else {
                badgeHtml = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 0.75rem; color: #fbbf24; font-weight: 600;" title="Não recomendado">⚠️</span>
                        <button class="btn-restore-recommended" data-platform="${platform}" style="padding: 2px 6px; font-size: 0.7rem; border-radius: 4px; background: rgba(96,165,250,0.15); color: #60a5fa; border: 1px solid rgba(96,165,250,0.3); cursor: pointer; transition: all 0.2s;">
                            ${t('extensionTab.useRecommended') || 'Usar Recomendado'}
                        </button>
                    </div>
                `;
            }

            html += `
                <div class="ext-mapping-row" style="display: flex; flex-direction: column; gap: 8px; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 10px;">
                    <!-- Header -->
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600; font-size: 0.95rem;">${meta.icon} ${meta.label}</span>
                        <div class="mapping-badge-container-${platform}">
                            ${badgeHtml}
                        </div>
                    </div>
                    <!-- Fields -->
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <!-- Preset Dropdown -->
                        <div style="flex: 1; min-width: 140px; display: flex; flex-direction: column; gap: 4px;">
                            <label style="font-size: 0.75rem; color: var(--text-dim);">${t('presets.title') || 'Preset'}</label>
                            <select class="form-select ext-preset-select" data-platform="${platform}" style="width: 100%; padding: 6px 10px; border-radius: 8px; background: var(--bg-hover); color: var(--text); border: 1px solid var(--border-default);">
                                ${presetOptions}
                            </select>
                        </div>
                        <!-- Client ID Dropdown -->
                        <div style="flex: 1; min-width: 180px; display: flex; flex-direction: column; gap: 4px;">
                            <label style="font-size: 0.75rem; color: var(--text-dim);">Client ID</label>
                            <select class="form-select ext-client-id-select" data-platform="${platform}" style="width: 100%; padding: 6px 10px; border-radius: 8px; background: var(--bg-hover); color: var(--text); border: 1px solid var(--border-default);">
                                ${clientIdOptions}
                            </select>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Set lastValue dataset and bind event listeners
        platforms.forEach(platform => {
            const presetSelect = container.querySelector(`.ext-preset-select[data-platform="${platform}"]`);
            const clientIdSelect = container.querySelector(`.ext-client-id-select[data-platform="${platform}"]`);
            const restoreBtn = container.querySelector(`.btn-restore-recommended[data-platform="${platform}"]`);

            if (presetSelect) {
                presetSelect.dataset.lastValue = presetSelect.value;
                presetSelect.addEventListener('change', () => {
                    this.handlePresetChange(platform, presetSelect);
                });
            }

            if (clientIdSelect) {
                clientIdSelect.dataset.lastValue = clientIdSelect.value;
                clientIdSelect.addEventListener('change', () => {
                    this.handleClientIdChange(platform, clientIdSelect);
                });
            }

            if (restoreBtn) {
                restoreBtn.addEventListener('click', () => {
                    const recommendedClientId = recommendedClientIds[platform];
                    if (clientIdSelect) {
                        clientIdSelect.value = recommendedClientId;
                        this.handleClientIdChange(platform, clientIdSelect);
                    }
                });
            }
        });
    },

    handlePresetChange(platform, select) {
        const selectedPresetName = select.value;

        // If no preset chosen, it's always valid
        if (!selectedPresetName) {
            this.saveMapping(platform, selectedPresetName, null);
            select.dataset.lastValue = selectedPresetName;
            return;
        }

        // Find the preset object to validate
        const preset = localPresets.find(p => p.name === selectedPresetName);
        if (!preset) {
            // Preset not found (defensive check)
            this.saveMapping(platform, selectedPresetName, null);
            select.dataset.lastValue = selectedPresetName;
            return;
        }

        // Validate activity type constraint
        const activityType = parseInt(preset.type);
        let isValid = false;
        let expectedVerb = '';

        if (platform === 'youtube') {
            isValid = (activityType === 2 || activityType === 3);
            expectedVerb = `${t('presence.listening') || 'Listening'} / ${t('presence.watching') || 'Watching'}`;
        } else if (platform === 'youtubemusic') {
            isValid = (activityType === 2);
            expectedVerb = t('presence.listening') || 'Listening';
        } else {
            isValid = (activityType === 3);
            expectedVerb = t('presence.watching') || 'Watching';
        }

        if (!isValid) {
            const platformLabel = {
                youtube: 'YouTube',
                youtubemusic: 'YouTube Music',
                netflix: 'Netflix',
                twitch: 'Twitch',
                primevideo: 'Prime Video'
            }[platform];

            const errorMsg = (t('extensionTab.invalidActivityDesc') || "For the platform {platform}, the preset must be configured as '{expected}'.")
                .replace('{platform}', platformLabel)
                .replace('{expected}', expectedVerb);

            showToast('⚠️', errorMsg, 'warning');
            
            // Revert selection
            select.value = select.dataset.lastValue || '';
            return;
        }

        // If valid, save
        this.saveMapping(platform, selectedPresetName, null);
        select.dataset.lastValue = selectedPresetName;
    },

    handleClientIdChange(platform, select) {
        const selectedClientId = select.value;
        this.saveMapping(platform, null, selectedClientId);
        select.dataset.lastValue = selectedClientId;
    },

    saveMapping(platform, presetId, clientId) {
        if (!appSettings.extensionMappings) {
            appSettings.extensionMappings = {
                youtube: { presetId: '', clientId: '1461859944390332496' },
                youtubemusic: { presetId: '', clientId: '1520432295255871498' },
                netflix: { presetId: '', clientId: '1461881250498482409' },
                twitch: { presetId: '', clientId: '1461860225765347472' },
                primevideo: { presetId: '', clientId: '1511842632240730112' }
            };
        }

        if (!appSettings.extensionMappings[platform]) {
            appSettings.extensionMappings[platform] = {
                presetId: '',
                clientId: {
                    youtube: '1461859944390332496',
                    youtubemusic: '1520432295255871498',
                    netflix: '1461881250498482409',
                    twitch: '1461860225765347472',
                    primevideo: '1511842632240730112'
                }[platform]
            };
        }

        if (presetId !== null) {
            appSettings.extensionMappings[platform].presetId = presetId;
        }

        if (clientId !== null) {
            appSettings.extensionMappings[platform].clientId = clientId;
        }

        // Send save IPC event
        ipcRenderer.send('save-app-settings', { extensionMappings: appSettings.extensionMappings });

        // Re-render to update badges/UI state
        this.renderMappings();
    },

    registerListeners() {
        if (extListenersRegistered) return;

        const extTabMode = document.getElementById('ext-tab-mode');
        const extToggleIncognito = document.getElementById('ext-toggle-incognito');
        const platforms = ['youtube', 'youtubemusic', 'netflix', 'twitch', 'primevideo'];

        if (extTabMode) {
            extTabMode.addEventListener('change', () => {
                ipcRenderer.send('control-extension', { action: 'set_tab_mode', mode: extTabMode.value });
            });
        }

        if (extToggleIncognito) {
            extToggleIncognito.addEventListener('change', () => {
                ipcRenderer.send('control-extension', { action: 'set_incognito_mode', enabled: extToggleIncognito.checked });
            });
        }

        platforms.forEach(plat => {
            const toggle = document.getElementById(`ext-track-${plat}`);
            if (toggle) {
                toggle.addEventListener('change', () => {
                    ipcRenderer.send('control-extension', {
                        action: 'toggle_platform',
                        platform: plat,
                        enabled: toggle.checked
                    });
                });
            }
        });

        // Download and tutorial buttons event listeners
        const extDownloadBtn = document.getElementById('ext-download-btn');
        const extGuideBtn = document.getElementById('ext-guide-btn');
        if (extDownloadBtn) {
            extDownloadBtn.addEventListener('click', () => {
                ipcRenderer.send('open-external-url', 'https://chromewebstore.google.com/detail/ekhlmpampeikcibfdmokiibgdcfendgp');
            });
        }
        if (extGuideBtn) {
            extGuideBtn.addEventListener('click', () => {
                ipcRenderer.send('open-external-url', 'https://solarirpc.com/guides#plugins-ext-pt');
            });
        }

        extListenersRegistered = true;
    },

    queryStatus() {
        ipcRenderer.send('control-extension', { action: 'get_status' });
    },

    update(data) {
        extensionConnected = true;
        if (data && data.version) {
            extensionVersion = data.version;
        }

        // Update connection status visual
        const statusCard = document.getElementById('ext-status-card');
        const statusDesc = document.getElementById('ext-status-desc');
        const connBadge = document.getElementById('ext-connection-badge');
        const mainGrid = document.getElementById('ext-main-grid');
        const disconnectedState = document.getElementById('ext-disconnected-state');

        if (statusCard) statusCard.classList.add('connected');

        if (connBadge) {
            connBadge.className = 'bd-status-badge bd-status-installed';
            const dot = connBadge.querySelector('.bd-status-dot');
            const txt = connBadge.querySelector('.bd-status-text');
            if (dot) dot.style.background = '#4ade80';
            if (txt) {
                txt.setAttribute('data-i18n', 'app.connected');
                txt.textContent = t('app.connected');
            }
        }

        if (statusDesc) {
            // Remove data-i18n to prevent applyTranslations from overwriting the dynamically formatted string
            statusDesc.removeAttribute('data-i18n');
            statusDesc.textContent = t('extensionTab.statusConnected').replace('{version}', extensionVersion || '2.2.0');
        }

        if (mainGrid) mainGrid.style.display = 'grid';
        if (disconnectedState) disconnectedState.style.display = 'none';

        // Update form elements
        const extTabMode = document.getElementById('ext-tab-mode');
        const extToggleIncognito = document.getElementById('ext-toggle-incognito');

        if (extTabMode && document.activeElement !== extTabMode) {
            extTabMode.value = data.tabMode || 'auto';
        }

        if (extToggleIncognito && document.activeElement !== extToggleIncognito) {
            extToggleIncognito.checked = !!data.incognitoMode;
        }

        // Platforms checkbox state
        if (data.platforms) {
            Object.keys(data.platforms).forEach(plat => {
                const toggle = document.getElementById(`ext-track-${plat}`);
                if (toggle && document.activeElement !== toggle) {
                    toggle.checked = !!data.platforms[plat].enabled;
                }
            });
        }

        // Available tabs rendering
        const listContainer = document.getElementById('ext-tabs-list-container');
        if (listContainer) {
            listContainer.innerHTML = '';
            const available = data.availableTabs || [];

            if (available.length === 0) {
                listContainer.innerHTML = `
                    <div class="ext-empty-tabs">
                        <span class="ext-empty-tabs-icon">🌐</span>
                        <span data-i18n="extensionTab.noActiveTabs">${t('extensionTab.noActiveTabs')}</span>
                    </div>
                `;
            } else {
                available.forEach(tab => {
                    const item = document.createElement('div');
                    item.className = 'ext-tab-item';
                    const isPrimary = data.primaryTabId == tab.tabId;
                    if (isPrimary) item.classList.add('active');

                    // Determine icon
                    const icons = { youtube: '🎥', youtubemusic: '🎵', netflix: '🎬', twitch: '🎮', primevideo: '🍿' };
                    const icon = icons[tab.platform] || '🌐';

                    item.innerHTML = `
                        <div class="ext-tab-icon">${icon}</div>
                        <div class="ext-tab-details">
                            <div class="ext-tab-title" title="${tab.title}">${tab.title}</div>
                            <div class="ext-tab-subtitle">${tab.platform.toUpperCase()}</div>
                        </div>
                        <span class="ext-tab-badge ${isPrimary ? 'active' : 'inactive'}">
                            ${isPrimary ? t('extensionTab.activeLabel') : t('extensionTab.inactiveLabel')}
                        </span>
                    `;

                    // Handle manual switch click
                    item.addEventListener('click', () => {
                        if (data.tabMode === 'manual' && !isPrimary) {
                            ipcRenderer.send('control-extension', {
                                action: 'set_primary_tab',
                                tabId: tab.tabId
                            });
                        }
                    });

                    listContainer.appendChild(item);
                });
            }
        }

        // Session Stats processing
        lastSessionStats = data.sessionStats;
        this.renderStats();
        this.startTicking();
        this.renderMappings();
    },

    renderStats() {
        const statsContainer = document.getElementById('ext-stats-container');
        if (!statsContainer || !lastSessionStats) return;

        statsContainer.innerHTML = '';
        const platformTime = lastSessionStats.platformTime || {};
        const platforms = [
            { id: 'youtube', label: 'YouTube', icon: '🎥' },
            { id: 'youtubemusic', label: 'YouTube Music', icon: '🎵' },
            { id: 'netflix', label: 'Netflix', icon: '🎬' },
            { id: 'twitch', label: 'Twitch', icon: '🎮' },
            { id: 'primevideo', label: 'Prime Video', icon: '🍿' }
        ];

        // Calc total time
        let totalTime = 0;
        platforms.forEach(p => {
            totalTime += platformTime[p.id] || 0;
        });

        platforms.forEach(p => {
            const time = platformTime[p.id] || 0;
            const pct = totalTime > 0 ? (time / totalTime) * 100 : 0;
            const item = document.createElement('div');
            item.className = 'ext-stat-item';
            item.innerHTML = `
                <div class="ext-stat-header">
                    <div class="ext-stat-label"><span>${p.icon}</span> ${p.label}</div>
                    <div class="ext-stat-time">${formatDuration(time)}</div>
                </div>
                <div class="ext-stat-track">
                    <div class="ext-stat-fill" style="width: ${pct}%"></div>
                </div>
            `;
            statsContainer.appendChild(item);
        });
    },

    startTicking() {
        if (statsTickerInterval) return;

        statsTickerInterval = setInterval(() => {
            if (lastSessionStats && lastSessionStats.currentPlatform) {
                const cur = lastSessionStats.currentPlatform;
                if (!lastSessionStats.platformTime) lastSessionStats.platformTime = {};
                lastSessionStats.platformTime[cur] = (lastSessionStats.platformTime[cur] || 0) + 1000;
                this.renderStats();
            }
        }, 1000);
    },

    stopTicking() {
        if (statsTickerInterval) {
            clearInterval(statsTickerInterval);
            statsTickerInterval = null;
        }
    },

    disconnect() {
        extensionConnected = false;
        extensionVersion = null;
        this.stopTicking();
        lastSessionStats = null;

        const statusCard = document.getElementById('ext-status-card');
        const statusDesc = document.getElementById('ext-status-desc');
        const connBadge = document.getElementById('ext-connection-badge');
        const mainGrid = document.getElementById('ext-main-grid');
        const disconnectedState = document.getElementById('ext-disconnected-state');

        if (statusCard) statusCard.classList.remove('connected');

        if (connBadge) {
            connBadge.className = 'bd-status-badge bd-status-missing';
            const dot = connBadge.querySelector('.bd-status-dot');
            const txt = connBadge.querySelector('.bd-status-text');
            if (dot) dot.style.background = '#ef4444';
            if (txt) {
                txt.setAttribute('data-i18n', 'app.disconnected');
                txt.textContent = t('app.disconnected');
            }
        }

        if (statusDesc) {
            statusDesc.setAttribute('data-i18n', 'extensionTab.statusDisconnected');
            statusDesc.textContent = t('extensionTab.statusDisconnected');
        }

        if (mainGrid) mainGrid.style.display = 'none';
        if (disconnectedState) disconnectedState.style.display = 'flex';
    }
};

window.ExtensionTabManager = ExtensionTabManager;

function formatDuration(ms) {
    if (!ms || ms < 0) return '0s';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(' ');
}

// IPC Listeners
ipcRenderer.on('extension-status-update', (event, data) => {
    ExtensionTabManager.update(data);
});

ipcRenderer.on('extension-connected-event', () => {
    ExtensionTabManager.queryStatus();
});

ipcRenderer.on('extension-disconnected-event', () => {
    ExtensionTabManager.disconnect();
});

document.addEventListener('languageChanged', () => {
    if (extensionConnected) {
        ExtensionTabManager.queryStatus();
    } else {
        ExtensionTabManager.disconnect();
    }
});

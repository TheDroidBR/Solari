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

// --- UI Elements ---
const activityTypeSelect = document.getElementById('activityType');
const detailsInput = document.getElementById('details');
const detailsUrlInput = document.getElementById('detailsUrl');
const stateInput = document.getElementById('state');
const stateUrlInput = document.getElementById('stateUrl');
const largeImageInput = document.getElementById('largeImage');
const largeImageTextInput = document.getElementById('largeImageText');
const smallImageInput = document.getElementById('smallImage');
const smallImageTextInput = document.getElementById('smallImageText');
const button1LabelInput = document.getElementById('button1Label');
const button1UrlInput = document.getElementById('button1Url');
const button2LabelInput = document.getElementById('button2Label');
const button2UrlInput = document.getElementById('button2Url');
const partyCurrentInput = document.getElementById('partyCurrent');
const partyMaxInput = document.getElementById('partyMax');
const timestampRadios = document.querySelectorAll('input[name="timestampMode"]');
const customTimestampInput = document.getElementById('customTimestamp');
const customTimestampGroup = document.getElementById('customTimestampGroup');
const useEndTimestamp = document.getElementById('useEndTimestamp');
const updateBtn = document.getElementById('updateBtn');
const resetBtn = document.getElementById('resetBtn');
const statusToggle = document.getElementById('statusToggle');
const statusIndicator = document.querySelector('.status-indicator');
const statusText = document.querySelector('.status-text');
const afkIndicator = document.getElementById('afkIndicator');

const defDetailsInput = document.getElementById('defDetails');
const defStateInput = document.getElementById('defState');
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
    }
}

// Add click listeners to tab buttons
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        switchTab(tabId);
    });
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
    'neon-purple': {
        name: '💜 Neon Purple',
        css: `:root {
  --primary: #a855f7 !important;
  --primary-dark: #9333ea !important;
  --primary-light: #c084fc !important;
  --primary-glow: rgba(168, 85, 247, 0.4) !important;
  --accent: #a855f7 !important;
}
.glass-card { border-color: rgba(168, 85, 247, 0.25) !important; }
.btn-primary { background: linear-gradient(135deg, #a855f7, #7c3aed) !important; }
.btn-primary-glow { box-shadow: 0 0 20px rgba(168, 85, 247, 0.5) !important; }`
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
}, 5000);

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
                    <button class="btn-primary" id="promptConfirmBtn" style="flex: 1;">${t('modal.confirm') || 'Confirmar'}</button>
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
if (settingsCheckUpdatesBtn) {
    settingsCheckUpdatesBtn.addEventListener('click', () => {
        ipcRenderer.send('trigger-update-check');
    });
}
if (settingsChangelogBtn) {
    settingsChangelogBtn.addEventListener('click', () => {
        ipcRenderer.send('request-changelog'); // Must be mapped in backend
    });
}
if (settingsSetupWizardBtn) {
    settingsSetupWizardBtn.addEventListener('click', () => {
        if (typeof showSetupWizard === 'function') {
            showSetupWizard();
        } else {
            const wizard = document.getElementById('setupWizard');
            if (wizard) wizard.style.display = 'flex';
        }
    });
}
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

    // Apply UI Dependencies
    updateStartMinimizedUI();
    updateEcoModeVisibility();

    // Dropdown (PROTECTED BY LOCK)
    if (settingsLanguage && !isSyncingLanguage) {
        settingsLanguage.value = appSettings.language || 'en';
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
        if (data.lastFormState.activityType) activityTypeSelect.value = data.lastFormState.activityType;
        if (data.lastFormState.details) detailsInput.value = data.lastFormState.details;
        if (data.lastFormState.state) stateInput.value = data.lastFormState.state;
        if (data.lastFormState.largeImageKey) largeImageInput.value = data.lastFormState.largeImageKey;
        if (data.lastFormState.largeImageText) largeImageTextInput.value = data.lastFormState.largeImageText;
        if (data.lastFormState.smallImageKey) smallImageInput.value = data.lastFormState.smallImageKey;
        if (data.lastFormState.smallImageText) smallImageTextInput.value = data.lastFormState.smallImageText;
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
        li.innerHTML = `<span style="color: #888;">[${log.time}]</span> ${log.message}`;
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
                const confirmMsg = t('presets.deleteConfirmMessage') || `Are you sure you want to delete "${presetName}"?`;
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
                        smallImageKey: smallImageInput.value,
                        smallImageText: smallImageTextInput.value,
                        button1Label: button1LabelInput.value,
                        button1Url: button1UrlInput.value,
                        button2Label: button2LabelInput.value,
                        button2Url: button2UrlInput.value,
                        partyCurrent: parseInt(partyCurrentInput?.value) || 0,
                        partyMax: parseInt(partyMaxInput?.value) || 0,
                        timestampMode: Array.from(timestampRadios || []).find(r => r.checked)?.value || 'normal',
                        customTimestamp: customTimestampInput?.value && (Array.from(timestampRadios || []).find(r => r.checked)?.value === 'custom') ? new Date(customTimestampInput.value).getTime() : null,
                        useEndTimestamp: useEndTimestamp?.checked || false,
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
    activityTypeSelect.value = preset.type || "0";
    detailsInput.value = preset.details || '';
    if (detailsUrlInput) detailsUrlInput.value = preset.detailsUrl || '';
    stateInput.value = preset.state || '';
    if (stateUrlInput) stateUrlInput.value = preset.stateUrl || '';
    largeImageInput.value = preset.largeImageKey || '';
    largeImageTextInput.value = preset.largeImageText || '';
    smallImageInput.value = preset.smallImageKey || '';
    smallImageTextInput.value = preset.smallImageText || '';
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
        smallImageKey: smallImageInput.value,
        smallImageText: smallImageTextInput.value,
        button1Label: button1LabelInput.value,
        button1Url: button1UrlInput.value,
        button2Label: button2LabelInput.value,
        button2Url: button2UrlInput.value,
        partyCurrent: parseInt(partyCurrentInput?.value) || 0,
        partyMax: parseInt(partyMaxInput?.value) || 0,
        timestampMode: Array.from(timestampRadios || []).find(r => r.checked)?.value || 'normal',
        customTimestamp: customTimestampInput?.value ? new Date(customTimestampInput.value).getTime() : null,
        useEndTimestamp: useEndTimestamp?.checked || false,
        statusEnabled: statusToggle.checked,
        clientId: presetClientIdSelect ? presetClientIdSelect.value : ''
    };
    ipcRenderer.send('save-form-state', formState);
}

// Debounce to avoid saving too frequently
let saveTimeout = null;
function debouncedSaveFormState() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveFormState, 500);
}

// Add listeners to auto-save on change
[activityTypeSelect, detailsInput, stateInput, largeImageInput, largeImageTextInput, smallImageInput, smallImageTextInput, button1LabelInput, button1UrlInput, button2LabelInput, button2UrlInput].forEach(el => {
    el.addEventListener('input', debouncedSaveFormState);
    el.addEventListener('change', debouncedSaveFormState);
    // Also update preview on input
    el.addEventListener('input', updatePreview);
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
    } else {
        document.body.classList.remove('eco-mode');
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
    const activityType = activityTypeSelect.value;
    const details = detailsInput.value;
    const state = stateInput.value;

    // Different layouts for different activity types
    // Playing (0): Header is "JOGANDO", then app name, then details, then state
    // Watching (3): Header is "Assistindo [AppName]", then details, then state
    // Listening (2): Header is "Ouvindo [AppName]", then details, then state
    // Competing (5): Header is "Competindo [AppName]", then details, then state

    const isPlaying = activityType === '0';

    if (previewActivityType) {
        if (isPlaying) {
            // Playing: just show type
            previewActivityType.textContent = t('preview.playing');
        } else {
            // Other types: show "Type AppName" in header
            const typeLabels = {
                '2': t('preview.listening'),
                '3': t('preview.watching'),
                '5': t('preview.competing')
            };
            const label = typeLabels[activityType] || t('preview.playing');
            previewActivityType.textContent = discordAppName ? `${label} ${discordAppName}` : label.toUpperCase();
        }
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
        if (isPlaying && state) {
            // Playing mode: show state in this slot
            previewState.textContent = state;
            previewState.style.display = 'block';
            previewState.style.opacity = '1';
        } else if ((activityType === '2' || activityType === '5') && largeImageText) {
            // Listening/Competing: show largeImageText (Discord behavior)
            previewState.textContent = largeImageText;
            previewState.style.display = 'block';
            previewState.style.opacity = '0.7';
        } else {
            previewState.style.display = 'none';
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
        smallImageDiv.className = 'discord-preview-small-image';
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
}

// Initialize preview on page load
setTimeout(updatePreview, 100);

// --- Event Handlers ---


// Timestamp mode change listener - show/hide custom datetime field
timestampRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        customTimestampGroup.style.display = radio.value === 'custom' && radio.checked ? 'block' : 'none';
    });
});

// Update Status
updateBtn?.addEventListener('click', async () => {
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

    const activity = {
        type: parseInt(activityTypeSelect.value),
        details: detailsInput.value || undefined,
        detailsUrl: detailsUrlInput?.value || undefined,
        state: stateInput.value || undefined,
        stateUrl: stateUrlInput?.value || undefined,
        largeImageKey: imageUrl,
        largeImageText: largeImageTextInput.value || undefined,
        smallImageKey: smallImageUrl,
        smallImageText: smallImageTextInput.value || undefined,
        buttons: buttons.length > 0 ? buttons : undefined,
        partyCurrent: partyCurrent > 0 ? partyCurrent : undefined,
        partyMax: partyMax > 0 ? partyMax : undefined,
        timestampMode: timestampMode,
        customTimestamp: customTimestamp,
        useEndTimestamp: useEndTimestamp ? useEndTimestamp.checked : false,
        clientId: document.getElementById('presetClientId')?.value || undefined,
        instance: false
    };
    ipcRenderer.send('update-activity', activity);
    showToast('✅', t('presence.updated') || 'Status updated!', 'success');
    updateBtn.textContent = t('presence.updated');
    setTimeout(() => updateBtn.textContent = t('presence.updateStatus'), 2000);
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
    activityTypeSelect.value = "0";
    detailsInput.value = '';
    if (detailsUrlInput) detailsUrlInput.value = '';
    stateInput.value = '';
    if (stateUrlInput) stateUrlInput.value = '';
    largeImageInput.value = '';
    largeImageTextInput.value = '';
    smallImageInput.value = '';
    smallImageTextInput.value = '';
    button1LabelInput.value = '';
    button1UrlInput.value = '';
    button2LabelInput.value = '';
    button2UrlInput.value = '';
    ipcRenderer.send('reset-activity');
    showToast('🔄', t('presence.reset') || 'Reset!', 'info');
    resetBtn.textContent = t('presence.reset');
    setTimeout(() => resetBtn.textContent = t('presence.resetToDefault'), 2000);
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
        smallImageKey: smallImageInput.value,
        smallImageText: smallImageTextInput.value,
        button1Label: button1LabelInput.value,
        button1Url: button1UrlInput.value,
        button2Label: button2LabelInput.value,
        button2Url: button2UrlInput.value,
        partyCurrent: parseInt(partyCurrentInput?.value) || 0,
        partyMax: parseInt(partyMaxInput?.value) || 0,
        timestampMode: Array.from(timestampRadios || []).find(r => r.checked)?.value || 'normal',
        customTimestamp: customTimestampInput?.value && (Array.from(timestampRadios || []).find(r => r.checked)?.value === 'custom') ? new Date(customTimestampInput.value).getTime() : null,
        useEndTimestamp: useEndTimestamp?.checked || false,
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
    } catch (e) {
        await initI18n('en');
    }

    updateStatusDisplay(true);
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
    updatePreview(); // Re-render preview to apply new text and restore dynamic app name
});

// --- Language Support ---
// Update all UI text elements when language changes
function updateUILanguage() {
    // Section Titles
    const sectionTitles = {
        '.rpc-config h2': t('presence.title'),
        '.default-config h2': t('fallback.title'),
        '.presets h2': t('presets.title'),
        '.server-info h2': t('server.title'),
    };

    for (const [selector, text] of Object.entries(sectionTitles)) {
        const el = document.querySelector(selector);
        if (el && text) el.textContent = text;
    }

    // Plugin Manager h2 (preserve emoji)
    const pluginH2 = document.querySelector('.plugin-manager h2');
    if (pluginH2) pluginH2.textContent = '🔌 ' + t('plugins.title');

    // Header toggle labels
    const toggleLabels = document.querySelectorAll('.toggle-label');
    if (toggleLabels[0]) toggleLabels[0].textContent = t('app.enabled');

    // Form labels  
    const labels = {
        'label[for="activityType"]': t('presence.activityType'),
        'label[for="details"]': t('presence.details'),
        'label[for="state"]': t('presence.state'),
        'label[for="largeImageText"]': t('presence.largeImageText'),
        'label[for="smallImageText"]': t('presence.smallImageText'),
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
        '#smallImage': t('presence.smallImagePlaceholder'),
        '#smallImageText': t('presence.smallImageTextPlaceholder'),
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
    if (activityOptions.length >= 4) {
        activityOptions[0].textContent = t('presence.playing');
        activityOptions[1].textContent = t('presence.listening');
        activityOptions[2].textContent = t('presence.watching');
        activityOptions[3].textContent = t('presence.competing');
    }

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

    // Image hints
    const hints = document.querySelectorAll('.rpc-config .hint');
    hints.forEach((hint, idx) => {
        const text = hint.textContent;
        if (text.includes('Imgur') || text.includes('upload')) {
            hint.innerHTML = t('presence.largeImageHint').replace('Imgur', '<a href="https://imgur.com/upload" target="_blank" style="color: #ff9966;">Imgur</a>');
        }
        if (text.includes('canto inferior') || text.includes('bottom right')) {
            hint.textContent = t('presence.smallImageHint');
        }
        if (text.includes('reinicie') || text.includes('restart')) {
            hint.textContent = t('presence.largeImageWarning');
        }
    });

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
    if (theme) setTheme(theme);
});

// Request saved theme on load
ipcRenderer.send('get-theme');

// ===== TOAST NOTIFICATIONS =====
const toastContainer = document.getElementById('toastContainer');

function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
    `;
    toastContainer.appendChild(toast);

    // Remove after animation completes
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Listen for toast from main process
ipcRenderer.on('show-toast', (event, data) => {
    // Support both direct message and translation key
    const message = data.messageKey ? t(data.messageKey) : data.message;
    showToast(data.title, message, data.type || 'info');
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

            sliderInput?.addEventListener('input', () => {
                const valEl = document.getElementById(`val-${item.key}`);
                if (valEl) valEl.textContent = `${sliderInput.value}${item.suffix || ''}`;
            });

            sliderInput?.addEventListener('change', () => {
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
        }
    },

    async init() {
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

        // Listen for background status updates
        ipcRenderer.on('bd-status-update', (event, data) => {
            this._handleBDStatusUpdate(data);
        });

        // Request initial status
        ipcRenderer.invoke('bd:get-status').then(data => {
            this._handleBDStatusUpdate(data);
        });

        this.initialized = true;
        // Status is now pushed from main process
        await this.loadPlugins();
        this.startAutoRefresh();
    },

    startAutoRefresh() {
        // Poll remote every 5 minutes
        setInterval(() => this.loadPlugins(false, true), 300000);

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
        const indicator = document.getElementById('bd-status-indicator');
        const text = indicator ? indicator.querySelector('.bd-status-text') : null;
        const headerBtn = document.getElementById('bd-1click-header-btn');
        const labelEl = headerBtn ? headerBtn.querySelector('.bd-split-label') : null;

        try {
            const notInstalledBanner = document.getElementById('bd-warning-not-installed');
            const brokenBanner = document.getElementById('bd-warning-broken');

            if (notInstalledBanner) notInstalledBanner.style.display = 'none';
            if (brokenBanner) brokenBanner.style.display = 'none';

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
        } catch (e) {
            console.error('[Plugins] Error handling BD status update:', e);
        }
    },

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

        try {
            let data = null;
            const primaryUrl = `https://raw.githubusercontent.com/TheDroidBR/Solari/main/plugins/plugins-meta.json?v=${Date.now()}`;
            const gitlabUrl = `https://gitlab.com/TheDroidBR/solari/-/raw/main/plugins/plugins-meta.json?v=${Date.now()}`;
            const fallbackUrl = `https://solarirpc.com/plugins-meta.json?v=${Date.now()}`;

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

            // Truly Dynamic: Verify actual remote versions from the download links themselves
            try {
                const versionChecks = Object.entries(data).map(async ([key, plugin]) => {
                    if (plugin.downloadUrl) {
                        const actualVersion = await ipcRenderer.invoke('plugin:get-remote-version', plugin.downloadUrl);
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
            // Get translations with robust fallback (handles undefined, empty, or key string)
            const tTitleKey = `plugins.${key}.title`;
            const tTitle = t(tTitleKey);
            const isMissingTitle = !tTitle || tTitle === tTitleKey;
            const displayName = isMissingTitle ? (plugin.title || this.pluginInfo[key]?.displayName || key) : tTitle;

            const tDescKey = `plugins.${key}.description`;
            const tDesc = t(tDescKey);
            const isMissingDesc = !tDesc || tDesc === tDescKey;
            const description = isMissingDesc ? plugin.description : tDesc;

            const tFeatKey = `plugins.${key}.features`;
            let features = t(tFeatKey);
            if (!features || features === tFeatKey || !Array.isArray(features)) {
                features = Array.isArray(plugin.features) ? plugin.features : (this.pluginInfo[key]?.features || []);
            }

            const info = this.pluginInfo[key] || { icon: '🔌', requires: 'BetterDiscord' };
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

            if (isInstalled) {
                if (isNewer(plugin.version, installedVersion)) {
                    buttonLabel = downloadSvg + ' ' + updateLabel;
                    buttonClass += ' update';
                } else {
                    buttonLabel = checkSvg + ' ' + installedLabel;
                    buttonClass += ' installed';
                }
            }

            const deleteSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

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
                    <button class="${buttonClass}"
                            data-url="${plugin.downloadUrl}" data-filename="${plugin.fileName}">
                        ${buttonLabel}
                    </button>
                    ${isInstalled ? `
                    <button class="btn-plugin-config" title="Configurar" data-plugin-key="${key}">⚙️</button>
                    <button class="btn-plugin-delete" title="Desinstalar" data-filename="${plugin.fileName}">${deleteSvg}</button>` : ''}
                    <button class="btn-plugin-changelog" title="Changelog" data-plugin-key="${key}">📋</button>
                </div>
            `;

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
                    PluginsTabManager.handleDelete(plugin.fileName, info.displayName, this);
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
            const result = await ipcRenderer.invoke('plugin:download', { url, fileName });
            if (result.success) {
                btnElement.className = 'btn-plugin-install installed';
                btnElement.innerHTML = `${checkSvg} ${installedLabel}`;
                const msg = t('pluginStore.activateNotice') !== 'pluginStore.activateNotice' ? t('pluginStore.activateNotice') : 'Ative o plugin nas configurações do BetterDiscord!';
                showToast('✅', msg, 'success');
                // Refresh cards to instantly show the blue toggle
                this.loadPlugins(true);
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

    showChangelog(key) {
        if (!this.metaData || !this.metaData[key]) return;
        const plugin = this.metaData[key];
        const info = this.pluginInfo[key] || { displayName: key };
        const modal = document.getElementById('plugin-changelog-modal');
        const title = document.getElementById('plugin-changelog-title');
        const content = document.getElementById('plugin-changelog-content');

        if (modal && title && content) {
            title.textContent = `${info.displayName} — Changelog`;
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
});

// === NEON MODE TOGGLE ===
const neonToggle = document.getElementById('neonToggle');
const neonModeKey = 'solari_neon_mode';

// Initialize neon mode from localStorage (default ON)
const neonModeEnabled = localStorage.getItem(neonModeKey) !== 'false';
if (neonModeEnabled) {
    document.body.classList.add('neon-mode');
    if (neonToggle) neonToggle.classList.add('active');
} else {
    document.body.classList.remove('neon-mode');
    if (neonToggle) neonToggle.classList.remove('active');
}

if (neonToggle) {
    neonToggle?.addEventListener('click', () => {
        const isEnabled = document.body.classList.toggle('neon-mode');
        neonToggle.classList.toggle('active', isEnabled);
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

    if (identities.length === 0) {
        container.innerHTML = '<p style="color: rgba(255,255,255,0.4); font-size: 0.85em;">Nenhum perfil cadastrado. Adicione abaixo.</p>';
        return;
    }

    container.innerHTML = identities.map(identity => `
        <div class="identity-item" data-id="${identity.id}" style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 6px;">
            <span style="flex: 1; font-weight: 500;">${identity.name}</span>
            <span style="color: rgba(255,255,255,0.4); font-size: 0.8em; font-family: monospace;">${maskClientId(identity.clientId)}</span>
            <div style="display: flex; gap: 5px;">
                <button class="btn-icon edit-identity-btn" data-id="${identity.id}" title="${t('identities.edit') || 'Edit'}" style="color: #60a5fa;">✏️</button>
                <button class="btn-icon delete-identity-btn" data-id="${identity.id}" title="${t('identities.remove') || 'Remove'}" style="color: #ef4444;">🗑️</button>
            </div>
        </div>
    `).join('');

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

    // Keep the default option with proper translation
    const globalDefaultText = t('identities.globalDefault');
    const fallbackText = '🌐 Global Default';
    // If t() returns the key itself (no translation found), use fallback
    const defaultOptionText = (globalDefaultText && !globalDefaultText.includes('identities.'))
        ? globalDefaultText
        : fallbackText;
    select.innerHTML = `<option value="">${defaultOptionText}</option>`;

    identities.forEach(identity => {
        const option = document.createElement('option');
        option.value = identity.id;
        option.textContent = `📱 ${identity.name}`;
        select.appendChild(option);
    });

    // Add change listener to update preview when Client ID changes
    select?.addEventListener('change', () => {
        updatePreviewAppNameFromDropdown();
    });
}

// Update preview app name based on selected Client ID in dropdown
function updatePreviewAppNameFromDropdown() {
    const select = document.getElementById('presetClientId');
    if (!select) return;

    const selectedValue = select.value;

    if (selectedValue) {
        // Find the identity by ID
        const selectedIdentity = identities.find(i => i.id === selectedValue);
        if (selectedIdentity) {
            discordAppName = selectedIdentity.name;
        } else {
            discordAppName = 'Discord App';
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

const wizardOverlay = document.getElementById('setupWizard');
const wizardSlides = document.querySelectorAll('.wizard-slide');
const wizardNextBtn = document.getElementById('wizardNextBtn');
const wizardBackBtn = document.getElementById('wizardBackBtn');
const stepDots = document.querySelectorAll('.step-dot');
let currentWizardSlide = 1;
const totalWizardSlides = 7;

function showSetupWizard() {
    if (!wizardOverlay) {
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

    currentWizardSlide = 1;
    updateWizardUI();

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
    // Update Slides
    wizardSlides.forEach(slide => {
        const slideNum = parseInt(slide.dataset.slide);
        slide.classList.remove('active', 'exit-left');

        if (slideNum === currentWizardSlide) {
            slide.classList.add('active');
            applyTranslations();

            // Explicitly find i18n elements in this slide to double-check
            slide.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                const translation = t(key);
                if (translation && translation !== key) el.textContent = translation;
            });
        } else if (slideNum < currentWizardSlide) {
            slide.classList.add('exit-left');
        }
    });

    // Update Controls
    if (currentWizardSlide === 1) {
        wizardBackBtn.style.visibility = 'hidden';
    } else {
        wizardBackBtn.style.visibility = 'visible';
    }

    if (currentWizardSlide === totalWizardSlides) {
        const startText = t('wizard.start') || 'Start Solari!';
        wizardNextBtn.textContent = startText;

        // Trigger confetti on last slide
        triggerConfetti();
    } else {
        const nextText = t('wizard.next') || 'Next';
        wizardNextBtn.textContent = nextText;
    }

    // Update Dots
    stepDots.forEach((dot, index) => {
        if (index + 1 === currentWizardSlide) dot.classList.add('active');
        else dot.classList.remove('active');
    });

    // Toggle Preview Mode for Theme Slide (Slide 2)
    if (currentWizardSlide === 2) {
        wizardOverlay.classList.add('preview-mode');
    } else {
        wizardOverlay.classList.remove('preview-mode');

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
    // Save all explicitly toggled settings from Slide 4 and Slide 6 to ensure defaults hold
    const toggleStartWindows = document.getElementById('wizardToggleStartWindows');
    if (toggleStartWindows) ipcRenderer.send('set-setting', 'startWithWindows', toggleStartWindows.checked);

    const toggleStartMinimized = document.getElementById('wizardToggleStartMinimized');
    if (toggleStartMinimized) ipcRenderer.send('set-setting', 'startMinimized', toggleStartMinimized.checked);

    const toggleMinimizeToTray = document.getElementById('wizardToggleMinimizeToTray');
    if (toggleMinimizeToTray) ipcRenderer.send('set-setting', 'minimizeToTray', toggleMinimizeToTray.checked);

    const toggleAutoUpdates = document.getElementById('wizardToggleAutoUpdates');
    if (toggleAutoUpdates) ipcRenderer.send('set-setting', 'autoCheckAppUpdates', toggleAutoUpdates.checked);

    const toggleSmartAfk = document.getElementById('wizardToggleSmartAfk');
    if (toggleSmartAfk) ipcRenderer.send('plugin:toggle', 'smartAfk', toggleSmartAfk.checked);

    const toggleSpotify = document.getElementById('wizardToggleSpotify');
    if (toggleSpotify) ipcRenderer.send('plugin:toggle', 'spotify', toggleSpotify.checked);

    // Save completion state
    ipcRenderer.send('complete-setup');
    
    // Force UI refresh locally to reflect wizard choices in Settings Tab
    setTimeout(() => {
        ipcRenderer.send('get-data');
    }, 100);

    // Fade out
    wizardOverlay.style.transition = 'opacity 0.5s';
    wizardOverlay.style.opacity = '0';
    setTimeout(() => {
        wizardOverlay.style.display = 'none';
        wizardOverlay.style.opacity = '1'; // Reset for next time
    }, 500);
}

// Wizard Event Listeners
if (wizardNextBtn) wizardNextBtn?.addEventListener('click', nextWizardSlide);
if (wizardBackBtn) wizardBackBtn?.addEventListener('click', prevWizardSlide);

// Step 1: Language
document.querySelectorAll('.lang-card').forEach(card => {
    // Mouse tracking for ripple effect
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
    // Update UI selection
    document.querySelectorAll('.lang-card').forEach(c => {
        c.classList.toggle('active', c.dataset.lang === code);
    });

    // Apply strict language settings to app
    initI18n(code).then(() => {
        updateUILanguage();
        updateWizardUI();
        
        // Trigger centralized update
        handleGlobalLanguageChange(code);

        ipcRenderer.send('save-language', code); // Save immediately
    });
}

// Step 2: Theme
document.querySelectorAll('.theme-card').forEach(card => {
    card?.addEventListener('click', () => {
        const theme = card.dataset.themePreview;

        if (theme === 'neon') {
            // Toggle Neon
            card.classList.toggle('active');

            // Toggle actual Neon mode settings
            document.getElementById('neonToggle')?.click();

            // Ensure visual consistency if click didn't sync
            const isNeonActive = document.body.classList.contains('neon-mode');
            if (card.classList.contains('active') !== isNeonActive) {
                if (card.classList.contains('active') && !isNeonActive) document.getElementById('neonToggle')?.click();
                if (!card.classList.contains('active') && isNeonActive) document.getElementById('neonToggle')?.click();
            }

        } else {
            // Base Themes (Default, Dark, Light)
            document.querySelectorAll('.theme-card:not([data-theme-preview="neon"])').forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            // Apply Base Theme
            const wasNeon = document.body.classList.contains('neon-mode');

            if (theme === 'dark') {
                document.querySelector('[data-theme="dark"]')?.click();
            } else if (theme === 'light') {
                const lightBtn = document.querySelector('[data-theme="light"]');
                if (lightBtn) lightBtn.click();
                else document.querySelector('[data-theme="default"]')?.click(); // Fallback
            } else {
                document.querySelector('[data-theme="default"]')?.click();
            }

            // Restore Neon if it was wiped by base theme change
            if (wasNeon && !document.body.classList.contains('neon-mode')) {
                document.body.classList.add('neon-mode');
            }
        }
    });
});

// Step 4: Client ID Skipped?
const wizardSkipClientId = document.getElementById('wizardSkipClientId');
if (wizardSkipClientId) {
    wizardSkipClientId?.addEventListener('change', (e) => {
        const input = document.getElementById('wizardClientId');
        if (e.target.checked) {
            input.value = '';
            input.disabled = true;
            input.style.opacity = '0.5';
        } else {
            input.disabled = false;
            input.style.opacity = '1';
            input.focus();
        }
    });
}

// Step 4: Client ID Helper Link
const wizardPortalLink = document.getElementById('wizardPortalLink');
if (wizardPortalLink) {
    wizardPortalLink?.addEventListener('click', (e) => {
        e.preventDefault();
        shell.openExternal('https://discord.com/developers/applications');
    });
}

// Step 5: Plugins
// Step 5: Plugins Auto-Download Logic
const wizardToggleSmartAfk = document.getElementById('wizardToggleSmartAfk');
const wizardToggleSpotify = document.getElementById('wizardToggleSpotify');

const WIZARD_PLUGINS = {
    'smartAfk': {
        fileName: 'SmartAFKDetector.plugin.js',
        url: 'https://solarirpc.com/downloads/SmartAFKDetector.plugin.js',
        toggle: wizardToggleSmartAfk
    },
    'spotify': {
        fileName: 'SpotifySync.plugin.js',
        url: 'https://solarirpc.com/downloads/SpotifySync.plugin.js',
        toggle: wizardToggleSpotify
    }
};

async function handleWizardPluginToggle(key, isChecked) {
    const config = WIZARD_PLUGINS[key];
    if (!config || !config.toggle) return;

    if (isChecked) {
        // User turned ON -> Check install
        const isInstalled = await ipcRenderer.invoke('plugin:check-installed', config.fileName);

        if (!isInstalled) {
            config.toggle.disabled = true;

            const result = await ipcRenderer.invoke('plugin:download', {
                url: config.url,
                fileName: config.fileName
            });

            if (result && result.success) {
                showToast('🚀', `wizard.pluginEnabled`, 'success');
            } else {
                showToast('❌', `wizard.pluginError`, 'error');
                config.toggle.checked = false;
            }
            config.toggle.disabled = false;
        }
    }
}

// Multi-toggle handling for Slide 4 (Behavior) and Slide 6 (Auto-Detect)
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



if (wizardToggleSmartAfk) {
    wizardToggleSmartAfk?.addEventListener('change', (e) => handleWizardPluginToggle('smartAfk', e.target.checked));
}
if (wizardToggleSpotify) {
    wizardToggleSpotify?.addEventListener('change', (e) => handleWizardPluginToggle('spotify', e.target.checked));
}

// --- CONFETTI (Canvas) ---
function triggerConfetti() {
    // Simple particle system
    const canvas = document.createElement('canvas');
    const container = document.getElementById('setupWizard');
    if (!container) return;

    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '10001';

    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = [];
    const colors = ['#ff6b35', '#ff2d92', '#00d4ff', '#39ff14', '#ffd700'];

    for (let i = 0; i < 100; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2 + 50,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 1) * 15 - 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 8 + 4,
            life: 100
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;

        particles.forEach(p => {
            if (p.life > 0) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.5; // Gravity
                p.life--;

                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                active = true;
            }
        });

        if (active) requestAnimationFrame(animate);
        else canvas.remove();
    }
    animate();
}

// --- WIZARD DRAG LOGIC ---
const wizardContainer = document.querySelector('.wizard-containerglass');
let isDraggingWizard = false;
let wizardDragStartX, wizardDragStartY, wizardInitialLeft, wizardInitialTop;

if (wizardContainer) {
    wizardContainer?.addEventListener('mousedown', (e) => {
        // Only allow dragging in preview mode
        if (!wizardOverlay.classList.contains('preview-mode')) return;

        // Don't drag if clicking buttons or inputs
        if (e.target.tagName === 'BUTTON' || e.target.closest('.theme-card') || e.target.closest('.lang-card')) return;

        isDraggingWizard = true;
        wizardDragStartX = e.clientX;
        wizardDragStartY = e.clientY;

        // Get current transform/position
        const rect = wizardContainer.getBoundingClientRect();
        wizardInitialLeft = rect.left;
        wizardInitialTop = rect.top;

        // Disable transitions during drag
        wizardContainer.style.transition = 'none';
        wizardContainer.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDraggingWizard) return;

        const dx = e.clientX - wizardDragStartX;
        const dy = e.clientY - wizardDragStartY;

        // Apply new position using absolute positioning
        wizardContainer.style.position = 'fixed';
        wizardContainer.style.left = `${wizardInitialLeft + dx}px`;
        wizardContainer.style.top = `${wizardInitialTop + dy}px`;
        wizardContainer.style.margin = '0';
        wizardContainer.style.transform = 'none';
    });

    document.addEventListener('mouseup', () => {
        if (isDraggingWizard) {
            isDraggingWizard = false;
            wizardContainer.style.cursor = 'grab';
        }
    });
}

// ===== CHANGELOG MODAL =====
// Shows release notes on first launch of a new version

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

// ===== TOAST NOTIFICATION SYSTEM =====
/**
 * Show a toast notification at the bottom-right of the screen.
 * @param {string} message - Text to display
 * @param {'success'|'info'|'warning'|'error'} type - Toast type for styling
 * @param {number} duration - How long to show in ms (default 4000)
 */
function showSolariToast(message, type = 'info', duration = 4000) {
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

// ===== IN-APP UPDATE BUTTON (v1.8.0) =====
(function initInAppUpdateCheck() {
    const updateBtn = document.getElementById('updateAvailableBtn');
    const updateLabel = document.getElementById('updateVersionLabel');
    if (!updateBtn) return;

    async function checkForUpdateSilently() {
        try {
            const result = await ipcRenderer.invoke('check-update-silent');
            if (result && result.hasUpdate) {
                updateLabel.textContent = `v${result.latestVersion}`;
                updateBtn.title = `${t('settings.updateAvailableTitle') || 'Update available!'} v${result.latestVersion}`;
                updateBtn.style.display = 'inline-flex';
            } else {
                updateBtn.style.display = 'none';
            }
        } catch (e) {
            console.error('[Solari] Silent update check failed:', e);
        }
    }

    // Check on load (with a small delay to not block startup)
    setTimeout(checkForUpdateSilently, 5000);

    // Re-check every 10 minutes
    setInterval(checkForUpdateSilently, 600000);

    // Button click → restart with splash to update
    updateBtn.addEventListener('click', () => {
        updateBtn.textContent = '⏳';
        updateBtn.disabled = true;
        ipcRenderer.send('trigger-update-via-splash');
    });
})();

// ===== HARDWARE SYSTEM MONITOR (Renderer) =====
(function initHWMonitor() {
    const CIRCUMFERENCE = 2 * Math.PI * 52; // r=52 from SVG

    const toggle = document.getElementById('hw-monitor-toggle');
    const gaugesContainer = document.getElementById('hw-gauges-container');
    const rpcPreview = document.getElementById('hw-rpc-preview');
    const rpcPreviewText = document.getElementById('hw-rpc-preview-text');
    const card = document.querySelector('.hw-monitor-card');

    // Gauge elements
    const cpuRing = document.getElementById('hw-cpu-ring');
    const cpuValue = document.getElementById('hw-cpu-value');
    const ramRing = document.getElementById('hw-ram-ring');
    const ramValue = document.getElementById('hw-ram-value');
    const gpuRing = document.getElementById('hw-gpu-ring');
    const gpuValue = document.getElementById('hw-gpu-value');
    const gpuGauge = document.getElementById('hw-gauge-gpu');

    // Individual toggles
    const toggleCPU = document.getElementById('hw-toggle-cpu');
    const toggleRAM = document.getElementById('hw-toggle-ram');
    const toggleGPU = document.getElementById('hw-toggle-gpu');

    // Advanced toggles
    const toggleGPUTemp = document.getElementById('hw-toggle-gputemp');

    if (!toggle || !gaugesContainer) return;

    function setRingProgress(ring, percent) {
        const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
        ring.style.strokeDashoffset = Math.max(0, offset);
    }

    function updateGauges(stats) {
        if (!stats) return;

        // CPU
        if (stats.cpu && toggleCPU.checked) {
            setRingProgress(cpuRing, stats.cpu.usage);
            cpuValue.textContent = `${stats.cpu.usage}%`;
            document.getElementById('hw-gauge-cpu').classList.remove('disabled');
        }

        // RAM
        if (stats.ram && toggleRAM.checked) {
            setRingProgress(ramRing, stats.ram.usagePercent);
            ramValue.textContent = `${stats.ram.usedGB}/${stats.ram.totalGB}`;
            document.getElementById('hw-gauge-ram').classList.remove('disabled');
        }

        // GPU
        if (stats.gpu && toggleGPU.checked) {
            gpuGauge.classList.remove('hw-gauge-gpu-unavailable');
            const showTemp = toggleGPUTemp.checked && stats.gpu.temp !== null;
            
            const gpuPercent = stats.gpu.usage !== null ? stats.gpu.usage : (showTemp ? Math.min(stats.gpu.temp, 100) : 0);
            setRingProgress(gpuRing, gpuPercent);
            
            if (stats.gpu.usage !== null && showTemp) {
                gpuValue.innerHTML = `${stats.gpu.usage}%<br><span style="font-size: 0.55em; opacity: 0.7; font-weight: 500">${stats.gpu.temp}°C</span>`;
            } else if (showTemp) {
                gpuValue.textContent = `${stats.gpu.temp}°C`;
            } else if (stats.gpu.usage !== null) {
                gpuValue.textContent = `${stats.gpu.usage}%`;
            } else {
                gpuValue.textContent = '--';
            }
        } else if (!stats.gpu && toggleGPU.checked) {
            gpuGauge.classList.add('hw-gauge-gpu-unavailable');
            gpuValue.textContent = 'N/A';
            setRingProgress(gpuRing, 0);
        }

        // Build RPC preview string
        const parts = [];
        if (stats.cpu && toggleCPU.checked) {
            parts.push(`${t('hwMonitor.cpu')}: ${stats.cpu.usage}%`);
        }
        if (stats.ram && toggleRAM.checked) parts.push(`${t('hwMonitor.ram')}: ${stats.ram.usedGB}/${stats.ram.totalGB}GB`);
        if (stats.gpu && toggleGPU.checked) {
            const showTemp = toggleGPUTemp.checked && stats.gpu.temp !== null;
            
            if (stats.gpu.usage !== null || showTemp) {
                let gpuStr = `${t('hwMonitor.gpu')}:`;
                if (stats.gpu.usage !== null) gpuStr += ` ${stats.gpu.usage}%`;
                if (showTemp) gpuStr += `${stats.gpu.usage !== null ? '' : ' '}(${stats.gpu.temp}°C)`;
                parts.push(gpuStr.trim());
            }
        }
        rpcPreviewText.textContent = parts.length > 0 ? parts.join(' | ') : '—';
    }

    // Master toggle
    toggle.addEventListener('change', async () => {
        const enabled = toggle.checked;
        await ipcRenderer.invoke('hw-monitor:toggle', enabled);

        gaugesContainer.style.display = enabled ? 'flex' : 'none';
        rpcPreview.style.display = enabled ? 'flex' : 'none';
        card.classList.toggle('active', enabled);

        if (!enabled) {
            // Reset gauges
            setRingProgress(cpuRing, 0);
            setRingProgress(ramRing, 0);
            setRingProgress(gpuRing, 0);
            cpuValue.textContent = '0%';
            ramValue.textContent = '0/0';
            gpuValue.textContent = '--';
            rpcPreviewText.textContent = '—';
        }
    });

    // Individual toggles
    function onStatToggle() {
        const showCPU = toggleCPU.checked;
        const showRAM = toggleRAM.checked;
        const showGPU = toggleGPU.checked;
        const showGPUTemp = toggleGPUTemp.checked;

        document.getElementById('hw-gauge-cpu').classList.toggle('disabled', !showCPU);
        document.getElementById('hw-gauge-ram').classList.toggle('disabled', !showRAM);
        document.getElementById('hw-gauge-gpu').classList.toggle('disabled', !showGPU);

        const gpuTempBtn = document.getElementById('hw-mini-toggle-gputemp');
        if (gpuTempBtn) {
            gpuTempBtn.classList.toggle('active-gpu', showGPUTemp);
        }

        ipcRenderer.invoke('hw-monitor:save-settings', { showCPU, showRAM, showGPU, showGPUTemp });
        
        // Force an immediate UI re-render with current stats
        ipcRenderer.invoke('hw-monitor:get-stats').then(stats => updateGauges(stats));
    }

    toggleCPU.addEventListener('change', onStatToggle);
    toggleRAM.addEventListener('change', onStatToggle);
    toggleGPU.addEventListener('change', onStatToggle);
    toggleGPUTemp.addEventListener('change', onStatToggle);

    // Receive live stats from main process
    ipcRenderer.on('hw-stats-update', (event, stats) => {
        if (stats) {
            updateGauges(stats);
        }
    });

    // Initialize on load
    (async () => {
        try {
            const result = await ipcRenderer.invoke('hw-monitor:get-settings');
            if (result) {
                toggle.checked = result.enabled;
                if (result.settings) {
                    toggleCPU.checked = result.settings.showCPU !== false;
                    toggleRAM.checked = result.settings.showRAM !== false;
                    toggleGPU.checked = result.settings.showGPU !== false;

                    toggleGPUTemp.checked = result.settings.showGPUTemp !== false;
                }

                if (result.enabled) {
                    gaugesContainer.style.display = 'flex';
                    rpcPreview.style.display = 'flex';
                    card.classList.add('active');

                    // Apply initial disabled states
                    onStatToggle();

                    // Show cached stats immediately if available
                    if (result.stats) {
                        updateGauges(result.stats);
                    }
                }

                // Handle GPU unavailable
                if (result.gpuAvailable === false) {
                    gpuGauge.classList.add('hw-gauge-gpu-unavailable');
                    gpuValue.textContent = 'N/A';
                }
            }
        } catch (e) {
            console.error('[HW Monitor] Init error:', e);
        }
    })();
})();

// --- SOLARI MESSAGETOOLS IPC & CONFIG MANAGEMENT ---
function getMessageToolsConfigPath() {
    const appData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
    return path.join(appData, 'BetterDiscord', 'plugins', 'SolariMessageTools.config.json');
}

window.loadSolariMessageToolsConfig = function() {
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
            if(container) {
                container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Schema não encontrado.<br><br><b>Reinicie ou habilite o Plugin "SolariMessageTools" dentro do BetterDiscord pelo menos 1 vez</b> para gerar o arquivo de link do Solari.</div>';
            }
        }
    } catch (error) {
        console.error("[MessageTools] Error loading dynamic config schema:", error);
    }
};

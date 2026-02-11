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
const { initI18n, t, applyTranslations, loadTranslations, getCurrentLang } = require('./i18n');

// --- UI Elements ---
const activityTypeSelect = document.getElementById('activityType');
const detailsInput = document.getElementById('details');
const stateInput = document.getElementById('state');
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
const presetList = document.getElementById('presetList');

const testConnectionBtn = document.getElementById('testConnectionBtn');
const testResult = document.getElementById('testResult');

// Plugin Manager
const pluginListEl = document.getElementById('pluginList');
const pluginConfigArea = document.getElementById('pluginConfigArea');
const toggleTrashBtn = document.getElementById('toggleTrashBtn');
const trashContainer = document.getElementById('trashContainer');
const trashListEl = document.getElementById('trashList');

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
const customCssBtn = document.getElementById('customCssBtn');
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
    customCssBtn.addEventListener('click', () => {
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
    closeCustomCssBtn.addEventListener('click', () => {
        customCssModal.classList.remove('active');
    });
}

// Preset selection change
if (cssPresetSelect) {
    cssPresetSelect.addEventListener('change', () => {
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
    saveCustomCssBtn.addEventListener('click', () => {
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
    saveAsPresetBtn.addEventListener('click', () => {
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
    cancelPresetNameBtn.addEventListener('click', () => {
        presetNameModal.classList.remove('active');
    });
}

// Confirm save preset
if (confirmPresetNameBtn && presetNameModal) {
    confirmPresetNameBtn.addEventListener('click', () => {
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
        cssPresetNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmPresetNameBtn.click();
            }
        });
    }
}

// Delete preset (no confirm dialog - user already clicked delete button intentionally)
if (deletePresetBtn) {
    deletePresetBtn.addEventListener('click', () => {
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
    resetCssBtn.addEventListener('click', () => {
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
    ecoModeToggle.addEventListener('change', (e) => {
        const isEco = e.target.checked;
        document.body.classList.toggle('eco-mode', isEco);
        ipcRenderer.send('save-eco-mode', isEco);
    });
}

// Load Custom CSS on startup
const savedCss = localStorage.getItem('solari_custom_css');
if (savedCss) {
    customStyle.textContent = savedCss;
}

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

// --- Load Initial Data ---
ipcRenderer.send('get-data');

ipcRenderer.on('data-loaded', async (event, data) => {
    // Initialize i18n with saved language
    const lang = data.language || 'en';
    await initI18n(lang);
    console.log('[Solari] Initialized language:', lang);

    // Apply translations to UI (function is defined at end of file)
    setTimeout(() => updateUILanguage(), 100);

    // Load cached AFK config from plugin (fix for tiers reset bug)
    if (data.afkConfig) {
        console.log('[Solari] Loaded cached AFK config from plugin:', data.afkConfig);
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

    // Populate preset dropdown from auto-detect mappings
    if (data.autoDetectMappings && addPresetToAfkDisable) {
        addPresetToAfkDisable.innerHTML = '<option value="">Selecione um preset...</option>';
        data.autoDetectMappings.forEach(mapping => {
            const option = document.createElement('option');
            option.value = mapping.presetName;
            option.textContent = `${mapping.presetName} (${mapping.processName})`;
            addPresetToAfkDisable.appendChild(option);
        });
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
        if (data.lastFormState.largeImage) largeImageInput.value = data.lastFormState.largeImage;
        if (data.lastFormState.largeImageText) largeImageTextInput.value = data.lastFormState.largeImageText;
        if (data.lastFormState.smallImage) smallImageInput.value = data.lastFormState.smallImage;
        if (data.lastFormState.smallImageText) smallImageTextInput.value = data.lastFormState.smallImageText;
        if (data.lastFormState.button1Label) button1LabelInput.value = data.lastFormState.button1Label;
        if (data.lastFormState.button1Url) button1UrlInput.value = data.lastFormState.button1Url;
        if (data.lastFormState.button2Label) button2LabelInput.value = data.lastFormState.button2Label;
        if (data.lastFormState.button2Url) button2UrlInput.value = data.lastFormState.button2Url;
        if (data.lastFormState.statusEnabled !== undefined) {
            statusToggle.checked = data.lastFormState.statusEnabled;
            updateStatusDisplay(data.lastFormState.statusEnabled);
        }

        // NOTE: Form fields are restored for visual state only.
        // RPC is NOT auto-activated on startup - only auto-detect or manual "Update Status" button controls it.
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

    renderPresets(data.presets);

    // Update preview app name after a short delay to ensure dropdown is populated
    setTimeout(() => {
        if (typeof updatePreviewAppNameFromDropdown === 'function') {
            updatePreviewAppNameFromDropdown();
        }
    }, 500);
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
        console.log('[Solari] Setup not completed. Launching Wizard...');
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
            statusText.textContent = 'Reconectando...';
            statusText.style.color = '#f59e0b';
        }
    }
});

ipcRenderer.on('run-setup-wizard', () => {
    showSetupWizard();
});

ipcRenderer.on('presets-updated', (event, presets) => {
    renderPresets(presets);
});

// --- RPC Status Updates (Connection Indicator in Header) ---
ipcRenderer.on('rpc-status', (event, data) => {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');

    if (!statusIndicator || !statusText) return;

    // Remove data-i18n to prevent applyTranslations from overwriting
    statusText.removeAttribute('data-i18n');

    if (data.connected) {
        isRpcActuallyConnected = true;
        statusIndicator.style.background = '#22c55e'; // Green
        statusIndicator.style.boxShadow = '0 0 8px #22c55e';
        statusText.textContent = t('app.connected') || 'Conectado';
        statusText.style.color = '#22c55e';
    } else if (data.reconnecting) {
        isRpcActuallyConnected = false;
        statusIndicator.style.background = '#f59e0b'; // Orange
        statusIndicator.style.boxShadow = '0 0 8px #f59e0b';
        statusText.textContent = 'Reconectando...';
        statusText.style.color = '#f59e0b';
    } else {
        isRpcActuallyConnected = false;
        statusIndicator.style.background = '#ef4444'; // Red
        statusIndicator.style.boxShadow = '0 0 8px #ef4444';
        statusText.textContent = t('app.disconnected') || 'Desconectado';
        statusText.style.color = '#ef4444';
    }
});

// --- Plugin List Updates ---
ipcRenderer.on('plugin-list-updated', async (event, plugins) => {
    console.log('[Solari Renderer] plugin-list-updated received:', plugins.map(p => p.name));
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
    console.log('[Solari] Received afk-config-updated:', config?.afkTiers?.length || 0, 'tiers');

    // Skip update if we just saved (within 2 seconds)
    // This prevents the plugin's response from overwriting local values
    if (Date.now() - lastAfkSaveTime < 2000) {
        console.log('[Solari] Skipping afk-config-updated (saved recently)');
        return;
    }

    if (config.enabled !== undefined) afkToggle.checked = config.enabled;
    if (config.afkTiers && config.afkTiers.length > 0) {
        console.log('[Solari] Updating tiers from plugin:', config.afkTiers);
        afkTiers = config.afkTiers;
        renderAfkTiers();
    } else if (config.timeoutMinutes !== undefined) {
        // Legacy support - convert single timeout to tier
        console.log('[Solari] Legacy mode - converting timeout to tier');
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
    presetList.innerHTML = '';
    presets.forEach((preset, index) => {
        const div = document.createElement('div');
        div.className = 'preset-item';

        // Find app profile name if preset has clientId
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
                        state: stateInput.value,
                        largeImageKey: largeImageInput.value,
                        largeImageText: largeImageTextInput.value,
                        smallImageKey: smallImageInput.value,
                        smallImageText: smallImageTextInput.value,
                        button1Label: button1LabelInput.value,
                        button1Url: button1UrlInput.value,
                        button2Label: button2LabelInput.value,
                        button2Url: button2UrlInput.value,
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
            console.log('[Solari Renderer] VB-Cable driver found - showing SoundBoard UI');

            // Initialize SoundBoard if function exists (guard against double init)
            if (typeof window.initSoundBoard === 'function' && !window.sbInitialized) {
                window.initSoundBoard();
                window.sbInitialized = true;
            }
        } else {
            // Driver not installed - show installation instructions
            soundboardDriverNotInstalled.style.display = 'flex';
            soundboardReady.style.display = 'none';
            console.log('[Solari Renderer] VB-Cable driver not found - showing installation instructions');
        }
    } else {
        console.warn('[Solari Renderer] SoundBoard UI elements not found!');
    }
}

function renderPluginList() {
    pluginListEl.innerHTML = '';

    if (connectedPlugins.length === 0) {
        pluginListEl.innerHTML = `<li class="plugin-item placeholder">${t('plugins.noPlugin')}</li>`;
        pluginConfigArea.style.display = 'none';
        return;
    }

    connectedPlugins.forEach(plugin => {
        const li = document.createElement('li');
        li.className = 'plugin-item';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = plugin.name;
        li.appendChild(nameSpan);

        const controlsDiv = document.createElement('div');
        controlsDiv.style.display = 'flex';
        controlsDiv.style.gap = '5px';

        // Config Button
        const configBtn = document.createElement('button');
        configBtn.textContent = '⚙️';
        configBtn.title = t('plugins.configure');
        configBtn.className = 'btn-config-mini';
        configBtn.onclick = (e) => {
            e.stopPropagation();
            selectPlugin(plugin);
        };

        // Trash Button
        const trashBtn = document.createElement('button');
        trashBtn.textContent = '🗑️';
        trashBtn.title = t('plugins.moveToTrash');
        trashBtn.className = 'btn-config-mini btn-trash';
        trashBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(t('dialogs.blockPlugin').replace('{name}', plugin.name))) {
                ipcRenderer.send('block-plugin', plugin.name);
            }
        };

        controlsDiv.appendChild(configBtn);
        controlsDiv.appendChild(trashBtn);
        li.appendChild(controlsDiv);

        li.dataset.pluginId = plugin.id;
        li.addEventListener('click', () => selectPlugin(plugin));

        pluginListEl.appendChild(li);
    });
}

function renderTrashList() {
    trashListEl.innerHTML = '';
    if (blockedPlugins.length === 0) {
        trashListEl.innerHTML = `<li class="plugin-item placeholder">${t('plugins.emptyTrash')}</li>`;
        return;
    }

    blockedPlugins.forEach(pluginName => {
        const li = document.createElement('li');
        li.className = 'plugin-item trash-item';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = pluginName;
        li.appendChild(nameSpan);

        const restoreBtn = document.createElement('button');
        restoreBtn.textContent = '♻️ ' + t('plugins.restore');
        restoreBtn.className = 'btn-config-mini';
        restoreBtn.onclick = () => {
            ipcRenderer.send('unblock-plugin', pluginName);
        };

        li.appendChild(restoreBtn);
        trashListEl.appendChild(li);
    });
}

function selectPlugin(plugin) {
    // TOGGLE BEHAVIOR: If clicking on the same plugin, deselect it
    if (selectedPlugin && selectedPlugin.id === plugin.id) {
        selectedPlugin = null;
        document.querySelectorAll('.plugin-item').forEach(el => el.classList.remove('active'));
        pluginConfigArea.style.display = 'none';
        return;
    }

    selectedPlugin = plugin;

    // Highlight selection
    document.querySelectorAll('.plugin-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.plugin-item[data-plugin-id="${plugin.id}"]`)?.classList.add('active');

    // Show config area container
    pluginConfigArea.style.display = 'block';

    // Hide all panels first
    document.querySelectorAll('.plugin-config-panel').forEach(p => p.style.display = 'none');

    // Determine Panel ID
    let panelId = `config${plugin.name.replace(/\s/g, '')}`;

    // Alias handling
    if (plugin.name === 'SmartAFK') panelId = 'configSmartAFKDetector';

    const panel = document.getElementById(panelId);

    if (panel) {
        panel.style.display = 'block';
    } else {
        console.warn(`No config panel found for ${plugin.name} (ID: ${panelId})`);
    }
}

function loadPreset(preset) {
    activityTypeSelect.value = preset.type || "0";
    detailsInput.value = preset.details || '';
    stateInput.value = preset.state || '';
    largeImageInput.value = preset.largeImageKey || '';
    largeImageTextInput.value = preset.largeImageText || '';
    smallImageInput.value = preset.smallImageKey || '';
    smallImageTextInput.value = preset.smallImageText || '';
    button1LabelInput.value = preset.button1Label || '';
    button1UrlInput.value = preset.button1Url || '';
    button2LabelInput.value = preset.button2Label || '';
    button2UrlInput.value = preset.button2Url || '';

    // Restore Client ID selection for this preset
    const presetClientIdSelect = document.getElementById('presetClientId');
    if (presetClientIdSelect) {
        presetClientIdSelect.value = preset.clientId || '';
    }

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
    const formState = {
        activityType: activityTypeSelect.value,
        details: detailsInput.value,
        state: stateInput.value,
        largeImage: largeImageInput.value,
        largeImageText: largeImageTextInput.value,
        smallImage: smallImageInput.value,
        smallImageText: smallImageTextInput.value,
        button1Label: button1LabelInput.value,
        button1Url: button1UrlInput.value,
        button2Label: button2LabelInput.value,
        button2Url: button2UrlInput.value,
        statusEnabled: statusToggle.checked
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
statusToggle.addEventListener('change', saveFormState);
ecoModeToggle.addEventListener('change', (e) => {
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
let discordAppName = t('preview.loading') || 'Loading...';
let globalDefaultAppName = 'Discord App'; // Store the original global app name separately
let appNameReceived = false;

ipcRenderer.on('app-name-loaded', (event, appName) => {
    console.log('[Solari] Discord app name loaded:', appName);
    discordAppName = appName;
    globalDefaultAppName = appName; // Store as global default
    appNameReceived = true;
    if (previewAppName) {
        previewAppName.textContent = appName;
    }
    // Update the full preview to ensure everything is in sync
    updatePreview();
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

toggleTrashBtn.addEventListener('click', () => {
    showTrash = !showTrash;
    trashContainer.style.display = showTrash ? 'block' : 'none';
    toggleTrashBtn.style.background = showTrash ? 'rgba(255,255,255,0.2)' : 'transparent';
});

// Timestamp mode change listener - show/hide custom datetime field
timestampRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        customTimestampGroup.style.display = radio.value === 'custom' && radio.checked ? 'block' : 'none';
    });
});

// Update Status
updateBtn.addEventListener('click', async () => {
    let imageUrl = largeImageInput.value || undefined;
    let smallImageUrl = smallImageInput.value || undefined;

    // If large image is an Imgur album/page URL, ask main process to resolve it
    if (imageUrl && imageUrl.includes('imgur.com') && !imageUrl.startsWith('https://i.imgur.com/')) {
        updateBtn.textContent = t('presence.fetchingImage');
        try {
            imageUrl = await ipcRenderer.invoke('resolve-imgur-url', imageUrl);
            if (imageUrl) {
                largeImageInput.value = imageUrl;
                console.log('[Solari] Resolved large image URL to:', imageUrl);
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
                console.log('[Solari] Resolved small image URL to:', smallImageUrl);
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
        state: stateInput.value || undefined,
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
    largeImageInput.addEventListener('blur', () => handleImgurConversion(largeImageInput));
}
if (smallImageInput) {
    smallImageInput.addEventListener('blur', () => handleImgurConversion(smallImageInput));
}

// Reset to Default
resetBtn.addEventListener('click', () => {
    activityTypeSelect.value = "0";
    detailsInput.value = '';
    stateInput.value = '';
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
    saveDefaultBtn.addEventListener('click', () => {
        const defaultActivity = {
            details: defDetailsInput?.value || '',
            state: defStateInput?.value || ''
        };
        ipcRenderer.send('save-default', defaultActivity);
        showToast('💾', t('fallback.saved') || 'Default saved!', 'success');
        saveDefaultBtn.textContent = t('fallback.saved');
        setTimeout(() => saveDefaultBtn.textContent = t('fallback.save'), 2000);
    });
}

// Save Preset
savePresetBtn.addEventListener('click', () => {
    const name = presetNameInput.value;
    if (!name) return;
    const presetClientIdSelect = document.getElementById('presetClientId');
    const preset = {
        name,
        type: parseInt(activityTypeSelect.value),
        details: detailsInput.value,
        state: stateInput.value,
        largeImageKey: largeImageInput.value,
        largeImageText: largeImageTextInput.value,
        smallImageKey: smallImageInput.value,
        smallImageText: smallImageTextInput.value,
        button1Label: button1LabelInput.value,
        button1Url: button1UrlInput.value,
        button2Label: button2LabelInput.value,
        button2Url: button2UrlInput.value,
        clientId: presetClientIdSelect ? presetClientIdSelect.value : '' // Per-preset Client ID
    };
    ipcRenderer.send('save-preset', preset);
    presetNameInput.value = '';
});

// Export Presets
const exportPresetsBtn = document.getElementById('exportPresetsBtn');
const importPresetsBtn = document.getElementById('importPresetsBtn');

if (exportPresetsBtn) {
    exportPresetsBtn.addEventListener('click', async () => {
        const result = await ipcRenderer.invoke('export-presets');
        if (result.success) {
            showToast('📤', t('presets.exported') || 'Presets exported successfully!', 'success');
            exportPresetsBtn.textContent = t('presets.exportSuccess') || '✅ Exportado!';
            setTimeout(() => exportPresetsBtn.textContent = '📤 ' + (t('presets.export') || 'Exportar'), 2000);
        }
    });
}

if (importPresetsBtn) {
    importPresetsBtn.addEventListener('click', async () => {
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
sendToastBtn.addEventListener('click', () => {
    const message = toastMessageInput.value;
    if (!message) return;
    ipcRenderer.send('send-toast', message);
    sendToastBtn.textContent = t('solariPlugin.sent');
    setTimeout(() => sendToastBtn.textContent = t('solariPlugin.send'), 2000);
    toastMessageInput.value = '';
});

// Test Connection
testConnectionBtn.addEventListener('click', () => {
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
    exportLogsBtn.addEventListener('click', async () => {
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
statusToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    ipcRenderer.send('toggle-activity', isEnabled);
    updateStatusDisplay(isEnabled);
});

function updateStatusDisplay(isEnabled) {
    if (isEnabled) {
        statusIndicator.style.background = '#4ade80';
        statusIndicator.style.animation = 'pulse 2s infinite';
        statusText.textContent = t('app.connected');
        document.querySelector('.rpc-config').style.opacity = '1';
        document.querySelector('.rpc-config').style.pointerEvents = 'all';
    } else {
        statusIndicator.style.background = '#ef4444';
        statusIndicator.style.animation = 'none';
        statusText.textContent = t('app.disconnected');
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
    addAfkTierBtn.addEventListener('click', () => {
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
saveAfkBtn.addEventListener('click', () => {
    // Collect all tier values from UI
    const rows = afkTiersContainer.querySelectorAll('.tier-row');
    console.log('[Solari] Save clicked - Found rows:', rows.length);

    const newTiers = [];
    rows.forEach((row, index) => {
        const minutes = parseInt(row.querySelector('.tier-minutes').value) || 5;
        const status = row.querySelector('.tier-status').value || t('smartAfk.defaultStatus') || 'Away';
        console.log(`[Solari] Row ${index}: ${minutes} min, "${status}"`);
        newTiers.push({ minutes, status });
    });

    console.log('[Solari] Collected tiers:', newTiers.length, newTiers);

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
    console.log('[Solari] Sending settings:', settings);
    ipcRenderer.send('update-afk-settings', settings);
    lastAfkSaveTime = Date.now(); // Ignore config updates for 2 seconds

    if (afkSaveStatus) {
        afkSaveStatus.style.display = 'block';
        setTimeout(() => afkSaveStatus.style.display = 'none', 2000);
    }

    // DON'T re-render - the UI already shows the correct values
    // renderAfkTiers(); 
});

// Add Preset to Disable AFK Button
if (addPresetToDisableBtn) {
    addPresetToDisableBtn.addEventListener('click', () => {
        const selectedPreset = addPresetToAfkDisable.value;
        if (!selectedPreset) return;

        // Don't add duplicates
        if (afkDisabledPresets.includes(selectedPreset)) {
            console.log('[Solari] Preset already in list:', selectedPreset);
            return;
        }

        afkDisabledPresets.push(selectedPreset);
        renderAfkDisabledPresets();
        addPresetToAfkDisable.value = ''; // Reset dropdown
        console.log('[Solari] Added preset to AFK disable list:', selectedPreset);
    });
}

// Exit Manual Mode Button Logic
const exitManualModeBtn = document.getElementById('exitManualModeBtn');
if (exitManualModeBtn) {
    exitManualModeBtn.addEventListener('click', () => {
        ipcRenderer.send('exit-manual-mode');
        // Optimistically hide
        exitManualModeBtn.style.display = 'none';
        showToast('↩️', t('toasts.returningToAutoDetect'), 'info');
    });

    // Listen for manual mode status from main process
    ipcRenderer.on('manual-mode-changed', (event, isActive) => {
        console.log('[Solari] Manual mode changed:', isActive);
        exitManualModeBtn.style.display = isActive ? 'inline-block' : 'none';
    });
}

// Render initial tiers on load
renderAfkTiers();

// Auto-Detection Handlers
autoDetectToggle.addEventListener('change', (e) => {
    ipcRenderer.send('toggle-autodetect', e.target.checked);
});

autoDetectSettingsBtn.addEventListener('click', () => {
    ipcRenderer.send('open-autodetect-settings');
});

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
    // Init i18n first with correct language to avoid text flash
    try {
        const lang = await ipcRenderer.invoke('get-current-language');
        await initI18n(lang || 'en');
    } catch (e) {
        console.error('Failed to init i18n:', e);
        await initI18n('en');
    }

    updateStatusDisplay(true);
    renderAfkTiers(); // Render initial tiers (default or loaded)
    renderAfkDisabledPresets(); // Render selected presets that disable AFK

    // Initialize SoundBoard - check for VB-Cable driver
    try {
        const result = await ipcRenderer.invoke('soundboard:check-driver-installed');
        vbCableDriverInstalled = result.installed;
        console.log('[Solari] VB-Cable driver check:', vbCableDriverInstalled ? 'INSTALLED' : 'NOT INSTALLED');
        updateSoundBoardUI();
    } catch (e) {
        console.error('[Solari] Error checking VB-Cable driver:', e);
    }

    console.log('[Solari] Initialized');
});

// System AFK Indicator
ipcRenderer.on('system-afk-update', (event, data) => {
    if (afkIndicator) {
        if (data.isIdle) {
            afkIndicator.style.display = 'flex';
            console.log(`[Solari] AFK Indicator shown (idle for ${data.idleMinutes.toFixed(1)} min)`);
        } else {
            afkIndicator.style.display = 'none';
            console.log('[Solari] AFK Indicator hidden (user active)');
        }
    }
});

// Listen for global language changes
document.addEventListener('languageChanged', (e) => {
    console.log('[Diff] Language changed to:', e.detail.lang);
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
        statusText.textContent = 'Reconectando...';
        statusText.style.color = '#f59e0b'; // Orange
    } else {
        statusText.textContent = t('app.disconnected');
        statusText.style.color = '#ef4444'; // Red
    }

    // Server Status section
    const serverTitle = document.querySelector('.server-info h2');
    if (serverTitle) serverTitle.textContent = t('server.title');

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

    const afkLevelsLabel = document.querySelector('#configSmartAFKDetector label[style*="NÍVEIS"], #configSmartAFKDetector label[style*="font-size: 0.95em"]');
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

    console.log('[Solari] UI language updated to:', getCurrentLang());
}

// Listen for language change from main process
ipcRenderer.on('language-changed', async (event, lang) => {
    console.log('[Solari] Language changed to:', lang);
    await loadTranslations(lang);
    updateUILanguage();
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
    console.log('[Solari] Theme changed to:', theme);
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
    console.log(`[Solari] Preset auto-loaded: ${presetName}`);
    showToast('🎮 ' + t('autoDetect.title'), `Preset: ${presetName}`, 'success');
    statusText.textContent = `Auto: ${presetName}`;
    setTimeout(() => {
        if (statusToggle.checked) {
            statusText.textContent = t('app.connected');
        }
    }, 3000);
});

// ===== SPOTIFY SYNC =====

// Request initial Spotify data
ipcRenderer.send('get-spotify-data');

// Handle Spotify data loaded
ipcRenderer.on('spotify-data-loaded', (event, data) => {
    console.log('[Solari] Spotify data loaded:', data);
    if (data.settings) {
        if (spotifySyncToggle) spotifySyncToggle.checked = data.settings.enabled !== false;
        if (spotifyRpcToggle) spotifyRpcToggle.checked = data.settings.showInRichPresence !== false;

        // Load Spotify button values
        const spotifyBtn1Label = document.getElementById('spotifyButton1Label');
        const spotifyBtn1Url = document.getElementById('spotifyButton1Url');
        const spotifyBtn2Label = document.getElementById('spotifyButton2Label');
        const spotifyBtn2Url = document.getElementById('spotifyButton2Url');
        if (spotifyBtn1Label) spotifyBtn1Label.value = data.settings.button1Label || '';
        if (spotifyBtn1Url) spotifyBtn1Url.value = data.settings.button1Url || '';
        if (spotifyBtn2Label) spotifyBtn2Label.value = data.settings.button2Label || '';
        if (spotifyBtn2Url) spotifyBtn2Url.value = data.settings.button2Url || '';
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
    console.log('[Solari] Spotify plugin connected:', config);
    spotifyConnected = true;
    updateSpotifyConnectionStatus(true);
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
    spotifySyncToggle.addEventListener('change', () => {
        ipcRenderer.send('update-spotify-settings', { enabled: spotifySyncToggle.checked });
    });
}

if (spotifyRpcToggle) {
    spotifyRpcToggle.addEventListener('change', () => {
        ipcRenderer.send('update-spotify-settings', { showInRichPresence: spotifyRpcToggle.checked });
    });
}

// Spotify control buttons
if (spotifyPrevBtn) {
    spotifyPrevBtn.addEventListener('click', () => {
        ipcRenderer.send('spotify-control', 'previous');
    });
}

if (spotifyPlayPauseBtn) {
    spotifyPlayPauseBtn.addEventListener('click', () => {
        ipcRenderer.send('spotify-control', 'pause');
    });
}

if (spotifyNextBtn) {
    spotifyNextBtn.addEventListener('click', () => {
        ipcRenderer.send('spotify-control', 'next');
    });
}

// Priority settings
if (savePriorityBtn) {
    savePriorityBtn.addEventListener('click', () => {
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
    saveSpotifyButtonsBtn.addEventListener('click', () => {
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
const spotifyPluginRpcToggle = document.getElementById('spotifyPluginRpcToggle');
const saveSpotifyPluginBtn = document.getElementById('saveSpotifyPluginBtn');
const spotifyPluginNowPlaying = document.getElementById('spotifyPluginNowPlaying');
const spotifyPluginTrackTitle = document.getElementById('spotifyPluginTrackTitle');
const spotifyPluginTrackArtist = document.getElementById('spotifyPluginTrackArtist');

if (spotifyPluginRpcToggle) {
    spotifyPluginRpcToggle.addEventListener('change', () => {
        ipcRenderer.send('update-spotify-settings', { showInRichPresence: spotifyPluginRpcToggle.checked });
    });
}

if (saveSpotifyPluginBtn) {
    saveSpotifyPluginBtn.addEventListener('click', () => {
        ipcRenderer.send('update-spotify-settings', {
            showInRichPresence: spotifyPluginRpcToggle?.checked ?? true
        });
        showToast('✅', t('presets.saved') || 'Saved!', 'success');
    });
}

// Update both now-playing displays when track updates
function updateAllSpotifyDisplays(track) {
    // Main section
    updateSpotifyNowPlaying(track);

    // Plugin config panel
    if (spotifyPluginNowPlaying) {
        if (track && track.title) {
            spotifyPluginNowPlaying.style.display = 'block';
            if (spotifyPluginTrackTitle) spotifyPluginTrackTitle.textContent = track.title;
            if (spotifyPluginTrackArtist) spotifyPluginTrackArtist.textContent = track.artist || '';
        } else {
            spotifyPluginNowPlaying.style.display = 'none';
        }
    }
}

// Override the spotify-track-updated handler to update both displays
ipcRenderer.removeAllListeners('spotify-track-updated');
ipcRenderer.on('spotify-track-updated', (event, track) => {
    updateAllSpotifyDisplays(track);
});

// Controls Visibility Radio Buttons Handler
document.querySelectorAll('input[name="controlsVisibility"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const mode = e.target.value; // 'whenOpen' or 'whenPlaying'
        console.log('[Solari] Controls visibility changed to:', mode);
        ipcRenderer.send('update-spotify-settings', { controlsVisibility: mode });
    });
});


// Spotify Detection Method Handler
const spotifyDetectionMethod = document.getElementById('spotifyDetectionMethod');
if (spotifyDetectionMethod) {
    spotifyDetectionMethod.addEventListener('change', (e) => {
        ipcRenderer.send('update-spotify-settings', { detectionMethod: e.target.value });
        showToast('ℹ️', t('toasts.detectionMethodUpdated'), 'info');
    });
}

// === Spotify API Integration ===
const spotifyClientIdInput = document.getElementById('spotifyClientIdInput');
const saveSpotifyClientIdBtn = document.getElementById('saveSpotifyClientIdBtn');
const spotifyApiControls = document.getElementById('spotifyApiControls');
const spotifyLoginStatus = document.getElementById('spotifyLoginStatus');
const spotifyLoginBtn = document.getElementById('spotifyLoginBtn');
const spotifyLogoutBtn = document.getElementById('spotifyLogoutBtn');

if (saveSpotifyClientIdBtn) {
    saveSpotifyClientIdBtn.addEventListener('click', () => {
        const id = spotifyClientIdInput.value.trim();
        if (id) {
            ipcRenderer.send('set-spotify-client-id', id);
            showToast('✅', t('toasts.clientIdSaved'), 'success');
        } else {
            showToast('❌', t('toasts.clientIdInvalid'), 'error');
        }
    });
}

if (spotifyLoginBtn) {
    spotifyLoginBtn.addEventListener('click', () => {
        ipcRenderer.send('spotify-login');
    });
}

if (spotifyLogoutBtn) {
    spotifyLogoutBtn.addEventListener('click', () => {
        ipcRenderer.send('spotify-logout');
    });
}

function updateSpotifyApiUI(status) {
    if (!spotifyApiControls) return;

    // Show/Hide controls based on ID presence
    if (status.clientId) {
        spotifyApiControls.style.display = 'block';
        if (spotifyClientIdInput.value !== status.clientId) {
            spotifyClientIdInput.value = status.clientId;
        }
    } else {
        spotifyApiControls.style.display = 'none';
        spotifyClientIdInput.value = '';
    }

    // Update login status
    if (status.loggedIn) {
        spotifyLoginStatus.textContent = '🟢 Conectado';
        spotifyLoginBtn.style.display = 'none';
        spotifyLogoutBtn.style.display = 'block';
    } else {
        spotifyLoginStatus.textContent = '🔴 Desconectado';
        spotifyLoginBtn.style.display = 'block';
        spotifyLogoutBtn.style.display = 'none';
    }
}

ipcRenderer.on('spotify-status-update', (event, status) => {
    updateSpotifyApiUI(status);
});

// Initial check
ipcRenderer.invoke('get-spotify-status').then(status => {
    updateSpotifyApiUI(status);
});

// === SpotifySync Plugin Settings ===
const controlsVisibilityRadios = document.querySelectorAll('input[name="controlsVisibility"]');

if (saveSpotifyPluginBtn) {
    saveSpotifyPluginBtn.addEventListener('click', () => {
        const selectedVisibility = document.querySelector('input[name="controlsVisibility"]:checked')?.value || 'whenPlaying';

        ipcRenderer.send('update-spotify-plugin-settings', {
            controlsVisibility: selectedVisibility
        });

        showToast('✅', t('spotify.saved') || 'SpotifySync settings saved!', 'success');
    });
}

// Also send on radio change for instant sync
controlsVisibilityRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        ipcRenderer.send('update-spotify-plugin-settings', {
            controlsVisibility: e.target.value
        });
    });
});

// === IPC Event Handlers ===

// Sync Auto-Detect toggle when changed from tray menu
ipcRenderer.on('autodetect-toggled', (event, enabled) => {
    console.log('[Renderer] Auto-Detect toggled from tray:', enabled);
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
    neonToggle.addEventListener('click', () => {
        const isEnabled = document.body.classList.toggle('neon-mode');
        neonToggle.classList.toggle('active', isEnabled);
        localStorage.setItem(neonModeKey, isEnabled);
        console.log('[Solari] Neon Mode:', isEnabled ? 'ON' : 'OFF');
    });
}

// ===== IDENTITIES (App Profiles) MANAGER =====
let identities = [];
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
    select.addEventListener('change', () => {
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
    addIdentityBtn.addEventListener('click', async () => {
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
        cancelIdentityEditBtn.addEventListener('click', () => {
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
    aboutBtn.addEventListener('click', () => {
        aboutModal.classList.add('active');
    });
}

if (closeAboutBtn && aboutModal) {
    closeAboutBtn.addEventListener('click', () => {
        aboutModal.classList.remove('active');
    });
}

if (aboutModal) {
    aboutModal.addEventListener('click', (e) => {
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
    toggleIdentityIdBtn.addEventListener('click', () => {
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
const totalWizardSlides = 6;
let wizardAudioCtx = null;

function showSetupWizard() {
    if (!wizardOverlay) {
        console.error('Wizard Overlay not found!');
        return;
    }
    wizardOverlay.style.display = 'flex';
    wizardOverlay.style.opacity = '1';
    currentWizardSlide = 1;
    updateWizardUI();

    // Premium: Play welcome sound
    // Premium: Play welcome sound
    // playWizardSound('welcome');

    // Premium: Auto-detect language
    const userLang = navigator.language;
    if (userLang.startsWith('pt')) setWizardLanguage('pt-BR');
    else if (userLang.startsWith('es')) setWizardLanguage('es');
    else setWizardLanguage('en');
}

function updateWizardUI() {
    // Update Slides
    wizardSlides.forEach(slide => {
        const slideNum = parseInt(slide.dataset.slide);
        slide.classList.remove('active', 'exit-left');

        if (slideNum === currentWizardSlide) {
            slide.classList.add('active');
            // Force translation update for this slide
            console.log('[Solari] Re-applying translations for slide', slideNum);

            // DEBUG: Check if keys exist
            const wizardTrans = require('./i18n').getTranslations().wizard;
            console.log('[Solari Debug] Loaded keys for wizard:', wizardTrans ? Object.keys(wizardTrans) : 'UNDEFINED');
            console.log('[Solari Debug] t(wizard.clientIdTitle) =', require('./i18n').t('wizard.clientIdTitle'));

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
        // Translation for "Start" vs "Next" handled by data-i18n in updateUILanguage
        // BUT we need to manually toggle keys for the button since it changes meaning
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
        // This fixes the issue where wizard stays stuck in corner after theme slide
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
    // Save completion state
    ipcRenderer.send('complete-setup');

    // Fade out
    wizardOverlay.style.transition = 'opacity 0.5s';
    wizardOverlay.style.opacity = '0';
    setTimeout(() => {
        wizardOverlay.style.display = 'none';
        wizardOverlay.style.opacity = '1'; // Reset for next time
    }, 500);
    // playWizardSound('click');
}

// Wizard Event Listeners
if (wizardNextBtn) wizardNextBtn.addEventListener('click', nextWizardSlide);
if (wizardBackBtn) wizardBackBtn.addEventListener('click', prevWizardSlide);

// Step 1: Language
document.querySelectorAll('.lang-card').forEach(card => {
    card.addEventListener('click', () => {
        setWizardLanguage(card.dataset.lang);
        // playWizardSound('click');
        // Auto advance after selection for speed
        // Auto advance removed by user request
        // setTimeout(() => nextWizardSlide(), 300);
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
        // Also update wizard text dynamically if needed (simple hardcoded switch for buttons)
        updateWizardUI();
        ipcRenderer.send('save-language', code); // Save immediately
    });
}

// Step 2: Theme
document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
        const theme = card.dataset.themePreview;

        // LOGIC: Neon is COMPLEMENTARY (Toggle), others are MUTUALLY EXCLUSIVE (Radio)

        if (theme === 'neon') {
            // Toggle Neon
            card.classList.toggle('active');

            // Toggle actual Neon mode settings
            document.getElementById('neonToggle')?.click();

            // Ensure visual consistency if click didn't sync
            const isNeonActive = document.body.classList.contains('neon-mode');
            if (card.classList.contains('active') !== isNeonActive) {
                // Force sync if needed, but existing click handler usually handles it
                // If visual toggle failed:
                if (card.classList.contains('active') && !isNeonActive) document.getElementById('neonToggle')?.click();
                if (!card.classList.contains('active') && isNeonActive) document.getElementById('neonToggle')?.click();
            }

        } else {
            // Base Themes (Default, Dark, Light)
            // Remove active from OTHER base themes only (preserve Neon)
            document.querySelectorAll('.theme-card:not([data-theme-preview="neon"])').forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            // Apply Base Theme
            // First, ensure we aren't clearing neon mode implicitly if the themes do that
            // (Assuming main theme buttons might clear classes, so we might need to re-apply neon if it was active)
            const wasNeon = document.body.classList.contains('neon-mode');

            if (theme === 'dark') {
                document.querySelector('[data-theme="dark"]')?.click();
            } else if (theme === 'light') {
                // If we have a light theme button, click it. 
                // Fallback: Default usually IS light in many apps, or specifically 'light'
                const lightBtn = document.querySelector('[data-theme="light"]');
                if (lightBtn) lightBtn.click();
                else document.querySelector('[data-theme="default"]')?.click(); // Fallback
            } else {
                // Default
                document.querySelector('[data-theme="default"]')?.click();
            }

            // Restore Neon if it was wiped by base theme change
            if (wasNeon && !document.body.classList.contains('neon-mode')) {
                document.body.classList.add('neon-mode');
            }
        }

        // Play sound (optional, disabled per user request previously)
        // playWizardSound('hover');
    });
});

// Step 4: Client ID Skipped?
const wizardSkipClientId = document.getElementById('wizardSkipClientId');
if (wizardSkipClientId) {
    wizardSkipClientId.addEventListener('change', (e) => {
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
    wizardPortalLink.addEventListener('click', (e) => {
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
            console.log(`[Wizard] ${key} not installed. Downloading...`);
            // Optional: Visual feedback (could disable toggle temporarily)
            config.toggle.disabled = true;

            // Show toast or subtle indication via existing toast system?
            // For now, rely on console/quick download

            const result = await ipcRenderer.invoke('plugin:download', {
                url: config.url,
                fileName: config.fileName
            });

            config.toggle.disabled = false;

            if (result.success) {
                console.log(`[Wizard] ${key} downloaded successfully.`);
                // Maybe play success sound
            } else {
                console.error(`[Wizard] Failed to download ${key}:`, result.error);
                config.toggle.checked = false; // Revert
                alert('Erro ao baixar plugin: ' + result.error); // Simple feedback
            }
        } else {
            console.log(`[Wizard] ${key} already installed.`);
        }
    }
}

if (wizardToggleSmartAfk) {
    wizardToggleSmartAfk.addEventListener('change', (e) => handleWizardPluginToggle('smartAfk', e.target.checked));
}
if (wizardToggleSpotify) {
    wizardToggleSpotify.addEventListener('change', (e) => handleWizardPluginToggle('spotify', e.target.checked));
}

// --- AUDIO ENGINE (Web Audio API) ---
function playWizardSound(type) {
    try {
        if (!wizardAudioCtx) wizardAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (wizardAudioCtx.state === 'suspended') wizardAudioCtx.resume();

        const osc = wizardAudioCtx.createOscillator();
        const gain = wizardAudioCtx.createGain();
        osc.connect(gain);
        gain.connect(wizardAudioCtx.destination);

        const now = wizardAudioCtx.currentTime;

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'hover') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'welcome') {
            // Nice startup chime
            const now = wizardAudioCtx.currentTime;
            const osc1 = wizardAudioCtx.createOscillator();
            const g1 = wizardAudioCtx.createGain();
            osc1.connect(g1);
            g1.connect(wizardAudioCtx.destination);
            osc1.frequency.setValueAtTime(440, now);
            osc1.frequency.exponentialRampToValueAtTime(880, now + 0.5);
            g1.gain.setValueAtTime(0, now);
            g1.gain.linearRampToValueAtTime(0.2, now + 0.1);
            g1.gain.exponentialRampToValueAtTime(0.01, now + 2);
            osc1.start(now);
            osc1.stop(now + 2);
        } else if (type === 'success') {
            // Victory chord
            [440, 554, 659].forEach((freq, i) => {
                const o = wizardAudioCtx.createOscillator();
                const g = wizardAudioCtx.createGain();
                o.connect(g);
                g.connect(wizardAudioCtx.destination);
                o.type = 'sine';
                o.frequency.value = freq;
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(0.1, now + 0.1 + (i * 0.05));
                g.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
                o.start(now);
                o.stop(now + 1.5);
            });
        }
    } catch (e) { /* ignore audio errors */ }
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
    wizardContainer.addEventListener('mousedown', (e) => {
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

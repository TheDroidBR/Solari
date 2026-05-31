/**
 * Solari - UI: Public Presets (Renderer Side)
 *
 * Exposes a visual, cloud-backed catalog of community Discord Rich Presence presets
 * within its own sub-tab, completely modular and independent from renderer.js.
 *
 * Usage:
 *   const uiPublicPresets = require('./modules/ui-public-presets');
 *   uiPublicPresets.init({ ... });
 *
 * @module ui-public-presets
 */

'use strict';

const { t } = require('../i18n');

// Primary raw URL for community presets catalog and mirror link
const PRIMARY_URL = 'https://raw.githubusercontent.com/TheDroidBR/Solari/main/public-presets.json';
const MIRROR_URL = 'https://gitlab.com/TheDroidBR/Solari/-/raw/main/public-presets.json';

// Module state
let cachedPresets = null;
let searchQuery = '';
let isFetching = false;
let dependencies = {};

/**
 * Initializes the Public Presets sub-tab UI, navigation, and events.
 * 
 * @param {Object} options - Global dependencies injected from renderer.js
 */
function init(options = {}) {
    dependencies = {
        ipcRenderer: options.ipcRenderer || require('electron').ipcRenderer,
        showToast: options.showToast || (() => {}),
        loadIdentities: options.loadIdentities || (async () => {}),
        updatePreview: options.updatePreview || (() => {}),
        updatePreviewAppNameFromDropdown: options.updatePreviewAppNameFromDropdown || (() => {}),
        getIdentities: options.getIdentities || (() => []),
        getDiscordAppName: options.getDiscordAppName || (() => ''),
        setDiscordAppName: options.setDiscordAppName || (() => {})
    };

    setupSubTabNavigation();
    setupCatalogSearch();
    setupRetryButton();
}

/**
 * Handles sub-tab navigation switches.
 */
function setupSubTabNavigation() {
    const tabButtons = document.querySelectorAll('.rpc-sub-tab-btn');
    const customContent = document.getElementById('rpc-custom-presence-content');
    const publicContent = document.getElementById('rpc-public-presets-content');

    if (!tabButtons.length || !customContent || !publicContent) return;

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-rpc-sub-tab');

            // Toggle active visual states
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (targetTab === 'rpc-custom-presence') {
                customContent.style.display = 'block';
                publicContent.style.display = 'none';
            } else if (targetTab === 'rpc-public-presets') {
                customContent.style.display = 'none';
                publicContent.style.display = 'block';
                
                // Trigger hybrid load strategy
                loadCatalogCatalogHybrid();
            }
        });
    });
}

/**
 * Implements the hybrid loading strategy:
 * If there is a cached version, load it instantly. Simultaneously, start a background
 * fetch to retrieve the most updated presets from the raw URLs.
 */
function loadCatalogCatalogHybrid() {
    if (cachedPresets) {
        // Step 1: Render cache immediately for zero lag
        renderPresetsGrid(cachedPresets);
        
        // Step 2: Background fetch to fetch updates silently
        fetchPresetsCatalog(true);
    } else {
        // First open: Full fetch with loader
        fetchPresetsCatalog(false);
    }
}

/**
 * Fetches the community presets catalog from raw GitHub or raw GitLab raw endpoints.
 * 
 * @param {boolean} isSilent - If true, does not display loading spinner.
 */
async function fetchPresetsCatalog(isSilent = false) {
    if (isFetching) return;
    isFetching = true;

    const loadingEl = document.getElementById('public-presets-loading');
    const errorEl = document.getElementById('public-presets-error');
    const gridEl = document.getElementById('public-presets-grid');

    if (!isSilent) {
        if (loadingEl) loadingEl.style.display = 'block';
        if (errorEl) errorEl.style.display = 'none';
        if (gridEl) gridEl.style.display = 'none';
    }

    try {
        let response = null;
        let data = null;

        // Try GitHub Raw URL first
        try {
            response = await fetch(`${PRIMARY_URL}?v=${Date.now()}`);
            if (response.ok) {
                data = await response.json();
            }
        } catch (e) {
            console.warn('[Public Presets] GitHub primary fetch failed, trying mirror...', e);
        }

        // If GitHub failed or returned non-ok, try GitLab mirror
        if (!data) {
            response = await fetch(`${MIRROR_URL}?v=${Date.now()}`);
            if (response.ok) {
                data = await response.json();
            }
        }

        if (!data || !Array.isArray(data)) {
            throw new Error('Invalid community presets payload fetched.');
        }

        // Successfully loaded! Check if there is actual changes to prevent unnecessary DOM updates
        const stringified = JSON.stringify(data);
        const hasChanges = !cachedPresets || JSON.stringify(cachedPresets) !== stringified;

        cachedPresets = data;

        if (hasChanges) {
            renderPresetsGrid(cachedPresets);
        }

        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
        if (gridEl) gridEl.style.display = 'grid';

    } catch (err) {
        console.error('[Public Presets] Failed to retrieve cloud catalogue:', err);
        
        // Show error only if we have nothing loaded in screen. If we have cached version, keep displaying it.
        if (!cachedPresets) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (gridEl) gridEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'block';
        }
    } finally {
        isFetching = false;
    }
}

/**
 * Formats the text badge representing the Discord activity verb.
 */
function getActivityVerb(type) {
    const activityType = String(type);
    switch (activityType) {
        case '2':
            return t('preview.listening') || 'Ouvindo';
        case '3':
            return t('preview.watching') || 'Assistindo';
        case '5':
            return t('preview.competing') || 'Competindo em';
        default:
            return t('preview.playing') || 'Jogando';
    }
}

/**
 * Renders the catalog cards onto the public presets grid.
 */
function renderPresetsGrid(presets) {
    const gridEl = document.getElementById('public-presets-grid');
    if (!gridEl) return;

    gridEl.innerHTML = '';

    // Filter based on search input query
    const query = searchQuery.trim().toLowerCase();
    const filtered = presets.filter(p => {
        if (!query) return true;
        const nameMatch = p.name && p.name.toLowerCase().includes(query);
        const detailsMatch = p.details && p.details.toLowerCase().includes(query);
        const stateMatch = p.state && p.state.toLowerCase().includes(query);
        return nameMatch || detailsMatch || stateMatch;
    });

    if (filtered.length === 0) {
        gridEl.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                <span>🔍</span> No matching presets found.
            </div>
        `;
        return;
    }

    filtered.forEach((preset, index) => {
        const card = document.createElement('div');
        card.className = 'public-preset-card';

        // Choose banner image or fallback to a elegant gradient if not provided
        const bannerImg = preset.largeImage || 'https://raw.githubusercontent.com/TheDroidBR/Solari/main/SolariPhotoTransparente.png';
        const activityVerb = getActivityVerb(preset.activityType || '0');

        card.innerHTML = `
            <div class="preset-card-banner">
                <img src="${bannerImg}" alt="${preset.name}" onerror="this.src='https://raw.githubusercontent.com/TheDroidBR/Solari/main/SolariPhotoTransparente.png'">
                <span class="preset-activity-badge">${activityVerb}</span>
            </div>
            <div class="preset-card-body">
                <h3 class="preset-card-title">${preset.name}</h3>
                <p class="preset-card-details" title="${preset.details || ''}">
                    <strong>Linha 1:</strong> ${preset.details || '—'}
                </p>
                <p class="preset-card-state" title="${preset.state || ''}">
                    <strong>Linha 2:</strong> ${preset.state || '—'}
                </p>
            </div>
            <div class="preset-card-actions">
                <button class="preset-btn-apply" data-index="${index}">${t('publicPresets.applyBtn') || '⚡ Ativar Status'}</button>
                <button class="preset-btn-customize" data-index="${index}">${t('publicPresets.customizeBtn') || '✏️ Customizar'}</button>
            </div>
        `;

        // Wire Action Events
        card.querySelector('.preset-btn-apply').addEventListener('click', () => {
            handleApplyPreset(preset);
        });

        card.querySelector('.preset-btn-customize').addEventListener('click', () => {
            handleCustomizePreset(preset);
        });

        gridEl.appendChild(card);
    });
}

/**
 * Handles adding/verifying a community preset identity (App Profile).
 * 
 * @param {string} name - Preset Name
 * @param {string} clientId - Client ID of the preset
 * @returns {string} The local identity database ID
 */
async function ensurePresetIdentity(name, clientId) {
    const localIdentities = dependencies.getIdentities();
    
    // Find matching profile by clientId
    let matching = localIdentities.find(i => i.clientId === clientId);
    if (!matching) {
        // Generate a new clean identity profile on the fly
        const newId = 'identity_' + Date.now() + Math.random().toString(36).substr(2, 5);
        const newIdentity = {
            id: newId,
            name: name,
            clientId: clientId
        };

        console.log(`[Public Presets] Adding new Profile: "${name}" (${clientId})`);
        await dependencies.ipcRenderer.invoke('add-identity', newIdentity);
        await dependencies.loadIdentities();
        
        return newId;
    }

    return matching.id;
}

/**
 * Action: Instantly Activates a Cloud Preset status.
 */
async function handleApplyPreset(preset) {
    try {
        if (!preset.clientId) {
            console.error('[Public Presets] Preset missing clientId key.');
            return;
        }

        // 1. Ensure profile exists
        const identityId = await ensurePresetIdentity(preset.name, preset.clientId);

        // 2. Select profile globally
        const presetDropdown = document.getElementById('presetClientId');
        if (presetDropdown) {
            presetDropdown.value = identityId;
        }
        
        dependencies.setDiscordAppName(preset.name);

        // 3. Sync forms manually just in case
        fillFormFields(preset, identityId);

        // 4. Send RPC Update to main process
        const payload = {
            activityType: parseInt(preset.activityType || '0', 10),
            details: preset.details || '',
            detailsUrl: preset.detailsUrl || '',
            state: preset.state || '',
            stateUrl: preset.stateUrl || '',
            largeImageKey: preset.largeImage || '',
            largeImageText: preset.largeImageText || '',
            smallImageKey: preset.smallImage || '',
            smallImageText: preset.smallImageText || '',
            partyCurrent: preset.partyCurrent ? parseInt(preset.partyCurrent, 10) : null,
            partyMax: preset.partyMax ? parseInt(preset.partyMax, 10) : null,
            button1Label: preset.button1Label || '',
            button1Url: preset.button1Url || '',
            button2Label: preset.button2Label || '',
            button2Url: preset.button2Url || '',
            clientId: preset.clientId,
            timestampMode: 'normal' // default
        };

        await dependencies.ipcRenderer.invoke('update-activity', payload);

        // 5. Update UI
        dependencies.updatePreviewAppNameFromDropdown();
        dependencies.updatePreview();

        // 6. Show Premium Toast
        const successText = (t('publicPresets.appliedToast') || "Preset '{name}' ativado com sucesso!").replace('{name}', preset.name);
        dependencies.showToast('⚡', successText, 'success');

        // Turn status toggle ON if disabled
        const toggle = document.getElementById('statusToggle');
        if (toggle && !toggle.checked) {
            toggle.checked = true;
            await dependencies.ipcRenderer.invoke('status:toggle', true);
        }

    } catch (e) {
        console.error('[Public Presets] Activation failed:', e);
    }
}

/**
 * Action: Prefills Custom rich presence form and focuses it.
 */
async function handleCustomizePreset(preset) {
    try {
        if (!preset.clientId) return;

        // 1. Ensure profile is in dropdown
        const identityId = await ensurePresetIdentity(preset.name, preset.clientId);

        // 2. Select in custom dropdown
        const presetDropdown = document.getElementById('presetClientId');
        if (presetDropdown) {
            presetDropdown.value = identityId;
        }

        dependencies.setDiscordAppName(preset.name);

        // 3. Fill form fields
        fillFormFields(preset, identityId);

        // 4. Sync Interactive Preview
        dependencies.updatePreviewAppNameFromDropdown();
        dependencies.updatePreview();

        // 5. Auto Switch Sub-Tab to Custom tab
        const customTabBtn = document.querySelector('[data-rpc-sub-tab="rpc-custom-presence"]');
        if (customTabBtn) {
            customTabBtn.click();
        }

        // 6. Focus Details line to help start typing immediately
        const detailsInput = document.getElementById('details');
        if (detailsInput) {
            detailsInput.focus();
        }

    } catch (e) {
        console.error('[Public Presets] Customization prefill failed:', e);
    }
}

/**
 * Helper to pre-populate custom editor input fields.
 */
function fillFormFields(preset, identityId) {
    const selectActivity = document.getElementById('activityType');
    const inputDetails = document.getElementById('details');
    const inputDetailsUrl = document.getElementById('detailsUrl');
    const inputState = document.getElementById('state');
    const inputStateUrl = document.getElementById('stateUrl');
    const inputLargeImage = document.getElementById('largeImage');
    const inputLargeImageText = document.getElementById('largeImageText');
    const inputSmallImage = document.getElementById('smallImage');
    const inputSmallImageText = document.getElementById('smallImageText');
    const inputPartyCurrent = document.getElementById('partyCurrent');
    const inputPartyMax = document.getElementById('partyMax');
    const inputBtn1Label = document.getElementById('button1Label');
    const inputBtn1Url = document.getElementById('button1Url');
    const inputBtn2Label = document.getElementById('button2Label');
    const inputBtn2Url = document.getElementById('button2Url');

    if (selectActivity) selectActivity.value = preset.activityType || '0';
    if (inputDetails) inputDetails.value = preset.details || '';
    if (inputDetailsUrl) inputDetailsUrl.value = preset.detailsUrl || '';
    if (inputState) inputState.value = preset.state || '';
    if (inputStateUrl) inputStateUrl.value = preset.stateUrl || '';
    if (inputLargeImage) inputLargeImage.value = preset.largeImage || '';
    if (inputLargeImageText) inputLargeImageText.value = preset.largeImageText || '';
    if (inputSmallImage) inputSmallImage.value = preset.smallImage || '';
    if (inputSmallImageText) inputSmallImageText.value = preset.smallImageText || '';
    
    if (inputPartyCurrent) inputPartyCurrent.value = preset.partyCurrent !== undefined ? preset.partyCurrent : '';
    if (inputPartyMax) inputPartyMax.value = preset.partyMax !== undefined ? preset.partyMax : '';
    
    if (inputBtn1Label) inputBtn1Label.value = preset.button1Label || '';
    if (inputBtn1Url) inputBtn1Url.value = preset.button1Url || '';
    if (inputBtn2Label) inputBtn2Label.value = preset.button2Label || '';
    if (inputBtn2Url) inputBtn2Url.value = preset.button2Url || '';
}

/**
 * Setups live search filtering listener.
 */
function setupCatalogSearch() {
    const searchInput = document.getElementById('public-presets-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (cachedPresets) {
            renderPresetsGrid(cachedPresets);
        }
    });
}

/**
 * Setups connection error retry listener.
 */
function setupRetryButton() {
    const btn = document.getElementById('retryPublicPresetsBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        fetchPresetsCatalog(false);
    });
}

module.exports = { init };

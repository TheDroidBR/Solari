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

const { t, getCurrentLang } = require('../i18n');

const PRIMARY_URL = 'https://raw.githubusercontent.com/TheDroidBR/Solari/main/public-presets.json';
const MIRROR_URL = 'https://gitlab.com/TheDroidBR/solari/-/raw/main/public-presets.json';

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
    setupMainTabActiveListener();
    setupLanguageChangeListener();
}

/**
 * Setups listener for language changes to re-render the presets catalog if active.
 */
function setupLanguageChangeListener() {
    document.addEventListener('languageChanged', () => {
        const publicContent = document.getElementById('rpc-public-presets-content');
        if (publicContent && publicContent.style.display === 'block' && cachedPresets) {
            renderPresetsGrid(cachedPresets);
        }
    });
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
            response = await fetch(`${PRIMARY_URL}?v=${Date.now()}`, { cache: 'no-store' });
            if (response.ok) {
                data = await response.json();
            }
        } catch (e) {
            console.warn('[Public Presets] GitHub primary fetch failed, trying mirror...', e);
        }

        // If GitHub failed or returned non-ok, try GitLab mirror
        if (!data) {
            response = await fetch(`${MIRROR_URL}?v=${Date.now()}`, { cache: 'no-store' });
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
        case '1':
        case '3':
            return t('preview.watching') || 'Assistindo';
        case '2':
            return t('preview.listening') || 'Ouvindo';
        case '5':
            return t('preview.competing') || 'Competindo em';
        default:
            return t('preview.playing') || 'Jogando';
    }
}

/**
 * Resolves the localized strings for a public preset based on the currently active application language.
 *
 * @param {Object} preset - The raw preset object from public-presets.json
 * @returns {Object} A new preset object with resolved localized string properties
 */
function resolvePresetStrings(preset) {
    const rawLang = getCurrentLang() || 'en';
    const lang = rawLang.toLowerCase().startsWith('pt') ? 'pt' : 'en';
    const localized = preset[lang] || preset['en'] || preset['pt'] || {};

    return {
        ...preset,
        details: localized.details !== undefined ? localized.details : (preset.details || ''),
        state: localized.state !== undefined ? localized.state : (preset.state || ''),
        largeImageText: localized.largeImageText !== undefined ? localized.largeImageText : (preset.largeImageText || ''),
        smallImageText: localized.smallImageText !== undefined ? localized.smallImageText : (preset.smallImageText || ''),
        button1Label: localized.button1Label !== undefined ? localized.button1Label : (preset.button1Label || ''),
        button2Label: localized.button2Label !== undefined ? localized.button2Label : (preset.button2Label || '')
    };
}

/**
 * Renders the catalog cards onto the public presets grid.
 */
function renderPresetsGrid(presets) {
    const gridEl = document.getElementById('public-presets-grid');
    if (!gridEl) return;

    gridEl.innerHTML = '';

    // Resolve translations for all presets dynamically
    const resolvedPresets = presets.map(resolvePresetStrings);

    // Filter based on search input query and selected category filter
    const query = searchQuery.trim().toLowerCase();
    const filterEl = document.getElementById('public-presets-filter');
    const filterValue = filterEl ? filterEl.value : 'all';

    const filtered = resolvedPresets.filter(p => {
        // Search query matching
        const matchesQuery = !query || (
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.details && p.details.toLowerCase().includes(query)) ||
            (p.state && p.state.toLowerCase().includes(query))
        );

        if (!matchesQuery) return false;

        // Activity type filtering (Twitch is activityType '1', streaming, which goes to watching category)
        const actType = String(p.activityType || '0');
        if (filterValue === 'all') return true;
        if (filterValue === 'playing') {
            return actType === '0' || (actType !== '1' && actType !== '2' && actType !== '3' && actType !== '5');
        }
        if (filterValue === 'watching') {
            return actType === '3' || actType === '1';
        }
        if (filterValue === 'listening') {
            return actType === '2';
        }
        if (filterValue === 'competing') {
            return actType === '5';
        }
        return true;
    });

    if (filtered.length === 0) {
        gridEl.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                <span>🔍</span> ${t('publicPresets.noPresetsFound') || 'No matching presets found.'}
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

        const labelLine1 = (getCurrentLang() || 'en').toLowerCase().startsWith('pt') ? 'Linha 1' : 'Line 1';
        const labelLine2 = (getCurrentLang() || 'en').toLowerCase().startsWith('pt') ? 'Linha 2' : 'Line 2';

        card.innerHTML = `
            <div class="preset-card-banner">
                <img src="${bannerImg}" alt="${preset.name}" onerror="this.src='https://raw.githubusercontent.com/TheDroidBR/Solari/main/SolariPhotoTransparente.png'">
                <span class="preset-activity-badge">${activityVerb}</span>
            </div>
            <div class="preset-card-body">
                <h3 class="preset-card-title">${preset.name}</h3>
                <p class="preset-card-details" title="${preset.details || ''}">
                    <strong>${labelLine1}:</strong> ${preset.details || '—'}
                </p>
                <p class="preset-card-state" title="${preset.state || ''}">
                    <strong>${labelLine2}:</strong> ${preset.state || '—'}
                </p>
            </div>
            <div class="preset-card-actions">
                <button class="preset-btn-apply" data-index="${index}">${t('publicPresets.applyBtn') || '⚡ Ativar Status'}</button>
                <button class="preset-btn-customize" data-index="${index}">${t('publicPresets.customizeBtn') || '✏️ Customizar'}</button>
                <button class="preset-btn-save" data-index="${index}">${t('publicPresets.saveLocalBtn') || '💾 Salvar'}</button>
            </div>
        `;

        // Wire Action Events
        card.querySelector('.preset-btn-apply').addEventListener('click', () => {
            handleApplyPreset(preset);
        });

        card.querySelector('.preset-btn-customize').addEventListener('click', () => {
            handleCustomizePreset(preset);
        });

        card.querySelector('.preset-btn-save').addEventListener('click', () => {
            handleSaveLocalPreset(preset);
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
        let actType = parseInt(preset.activityType || '0', 10);
        if (actType === 1) actType = 3;
        const payload = {
            activityType: actType,
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

        dependencies.ipcRenderer.send('update-activity', payload);

        // Reset extension ad banner dismissal for streaming presets
        const STREAMING_CLIENT_IDS = ['1461859944390332496', '1461860225765347472', '1461881250498482409'];
        if (STREAMING_CLIENT_IDS.includes(preset.clientId)) {
            localStorage.removeItem('solari_extension_ad_dismissed');
        }

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
            dependencies.ipcRenderer.send('toggle-activity', true);
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

        // Reset extension ad banner dismissal for streaming presets
        const STREAMING_CLIENT_IDS = ['1461859944390332496', '1461860225765347472', '1461881250498482409'];
        if (STREAMING_CLIENT_IDS.includes(preset.clientId)) {
            localStorage.removeItem('solari_extension_ad_dismissed');
        }

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
 * Dynamic Conflict Modal to prompt user when saving a preset with an existing Discord Client ID.
 * Evokes premium dark-mode styling with vibrant orange accent warning and smooth micro-interactions.
 * 
 * @param {Object} preset - The cloud preset being saved
 * @returns {Promise<number>} Resolves with 1 (overwrite), 2 (copy anyway), or 0 (cancel)
 */
function showConflictModal(preset) {
    return new Promise((resolve) => {
        const modalDiv = document.createElement('div');
        modalDiv.className = 'modal-overlay active';
        modalDiv.id = 'presetConflictModal';
        modalDiv.style.position = 'fixed';
        modalDiv.style.top = '0';
        modalDiv.style.left = '0';
        modalDiv.style.width = '100%';
        modalDiv.style.height = '100%';
        modalDiv.style.background = 'rgba(0, 0, 0, 0.7)';
        modalDiv.style.backdropFilter = 'blur(5px)';
        modalDiv.style.display = 'flex';
        modalDiv.style.justifyContent = 'center';
        modalDiv.style.alignItems = 'center';
        modalDiv.style.zIndex = '1100';
        modalDiv.style.opacity = '0';
        modalDiv.style.transition = 'opacity 0.2s';
        modalDiv.style.pointerEvents = 'all';

        modalDiv.innerHTML = `
            <div class="modal-content" style="max-width: 420px; text-align: center; border-color: rgba(249, 115, 22, 0.3) !important; box-shadow: 0 10px 40px rgba(249, 115, 22, 0.15); transform: translateY(20px); transition: transform 0.2s;">
                <div style="font-size: 2.8rem; margin-bottom: 12px; filter: drop-shadow(0 0 10px rgba(249, 115, 22, 0.3)); line-height: 1;">⚠️</div>
                <h3 style="color: #fff; font-size: 1.3rem; margin-top: 0; margin-bottom: 10px; font-weight: 700;">${t('publicPresets.conflictTitle') || 'Preset Duplicado'}</h3>
                <p style="color: rgba(255, 255, 255, 0.75); line-height: 1.5; margin-bottom: 20px; font-size: 0.88rem;">
                    ${(t('publicPresets.conflictDesc') || 'Já existe um preset local salvo com este mesmo Client ID ({clientId}). O que você gostaria de fazer?').replace('{clientId}', preset.clientId)}
                </p>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button id="conflictOverwriteBtn" class="btn" style="background: linear-gradient(135deg, #fb923c 0%, #f97316 100%) !important; color: #fff !important; font-weight: 600; padding: 10px; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2); font-size: 0.85rem;">
                        ${t('publicPresets.conflictOverwrite') || '🔄 Sobrescrever o existente'}
                    </button>
                    <button id="conflictCopyBtn" class="btn" style="background: rgba(255, 255, 255, 0.08) !important; color: #fff !important; font-weight: 600; padding: 10px; border: 1px solid rgba(255, 255, 255, 0.15) !important; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 0.85rem;">
                        ${t('publicPresets.conflictCopy') || '➕ Criar uma nova cópia mesmo assim'}
                    </button>
                    <button id="conflictCancelBtn" class="btn btn-secondary" style="margin-top: 5px; padding: 8px; border-radius: 8px; font-weight: 600; transition: all 0.2s; font-size: 0.85rem;">
                        ${t('publicPresets.conflictCancel') || 'Cancelar'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modalDiv);

        // Force a reflow to trigger opacity transition
        setTimeout(() => {
            modalDiv.style.opacity = '1';
            modalDiv.querySelector('.modal-content').style.transform = 'translateY(0)';
        }, 10);

        const cleanup = () => {
            modalDiv.style.opacity = '0';
            modalDiv.querySelector('.modal-content').style.transform = 'translateY(20px)';
            setTimeout(() => {
                modalDiv.remove();
            }, 200);
        };

        const overwriteBtn = modalDiv.querySelector('#conflictOverwriteBtn');
        const copyBtn = modalDiv.querySelector('#conflictCopyBtn');
        const cancelBtn = modalDiv.querySelector('#conflictCancelBtn');

        // Dynamic Micro-interactions
        overwriteBtn.addEventListener('mouseover', () => {
            overwriteBtn.style.transform = 'translateY(-1px)';
            overwriteBtn.style.boxShadow = '0 6px 16px rgba(249, 115, 22, 0.35)';
        });
        overwriteBtn.addEventListener('mouseout', () => {
            overwriteBtn.style.transform = 'translateY(0)';
            overwriteBtn.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.2)';
        });

        copyBtn.addEventListener('mouseover', () => {
            copyBtn.style.transform = 'translateY(-1px)';
            copyBtn.style.background = 'rgba(255, 255, 255, 0.12)';
        });
        copyBtn.addEventListener('mouseout', () => {
            copyBtn.style.transform = 'translateY(0)';
            copyBtn.style.background = 'rgba(255, 255, 255, 0.08)';
        });

        cancelBtn.addEventListener('mouseover', () => {
            cancelBtn.style.transform = 'translateY(-1px)';
        });
        cancelBtn.addEventListener('mouseout', () => {
            cancelBtn.style.transform = 'translateY(0)';
        });

        overwriteBtn.onclick = () => {
            cleanup();
            resolve(1);
        };

        copyBtn.onclick = () => {
            cleanup();
            resolve(2);
        };

        cancelBtn.onclick = () => {
            cleanup();
            resolve(0);
        };
    });
}

/**
 * Action: Saves a community cloud preset to the user's local database.
 * Automatically registers the preset's identity profile in App Profiles
 * with the exact same name as the preset.
 * 
 * Safe duplication check: Prompts user with premium modal if Client ID conflict is detected.
 */
async function handleSaveLocalPreset(preset) {
    try {
        if (!preset.clientId) return;

        // 1. Fetch current local presets and identities to run safety conflict check
        const localPresets = await dependencies.ipcRenderer.invoke('get-presets');
        const localIdentities = dependencies.getIdentities();

        // Resolve identity with same Discord Client ID
        const existingPresetIndex = localPresets.findIndex(p => {
            const identity = localIdentities.find(i => i.id === p.clientId);
            return identity && identity.clientId === preset.clientId;
        });

        let choice = -1; // -1 means no conflict, proceed default
        let identityId = '';

        if (existingPresetIndex !== -1) {
            // Conflict detected! Show dynamic warning dialog
            choice = await showConflictModal(preset);
            if (choice === 0) {
                // User cancelled, abort save
                return;
            }
        }

        if (choice === 1) {
            // Case 1: Overwrite existing preset
            const existingPreset = localPresets[existingPresetIndex];
            identityId = existingPreset.clientId; // Keep the same identity link
        } else {
            // Case 2 (choice === 2 or -1): Create/Ensure identity profile
            identityId = await ensurePresetIdentity(preset.name, preset.clientId);
        }

        // 2. Build local preset object
        const localPreset = {
            name: preset.name,
            type: parseInt(preset.activityType || '0', 10),
            details: preset.details || '',
            detailsUrl: preset.detailsUrl || '',
            state: preset.state || '',
            stateUrl: preset.stateUrl || '',
            largeImageKey: preset.largeImage || '',
            largeImageText: preset.largeImageText || '',
            smallImageKey: preset.smallImage || '',
            smallImageText: preset.smallImageText || '',
            button1Label: preset.button1Label || '',
            button1Url: preset.button1Url || '',
            button2Label: preset.button2Label || '',
            button2Url: preset.button2Url || '',
            partyCurrent: preset.partyCurrent ? parseInt(preset.partyCurrent, 10) : 0,
            partyMax: preset.partyMax ? parseInt(preset.partyMax, 10) : 0,
            timestampMode: 'normal',
            customTimestamp: null,
            useEndTimestamp: false,
            clientId: identityId // link to local identity ID
        };

        if (choice === 1) {
            // Send update-preset message to main process
            await dependencies.ipcRenderer.send('update-preset', { index: existingPresetIndex, preset: localPreset });
        } else {
            // Send save-preset IPC message to main process
            await dependencies.ipcRenderer.send('save-preset', localPreset);
        }

        // 3. Show success toast
        const toastText = (t('publicPresets.savedLocalToast') || "Preset '{name}' salvo localmente!").replace('{name}', preset.name);
        dependencies.showToast('💾', toastText, 'success');

    } catch (e) {
        console.error('[Public Presets] Save local preset failed:', e);
        dependencies.showToast('❌', 'Erro ao salvar o preset localmente.', 'error');
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

    if (selectActivity) {
        let actType = preset.activityType || '0';
        if (actType === '1' || actType === 1) actType = '3';
        selectActivity.value = actType;
    }
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

function setupCatalogSearch() {
    const searchInput = document.getElementById('public-presets-search');
    const filterSelect = document.getElementById('public-presets-filter');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            if (cachedPresets) {
                renderPresetsGrid(cachedPresets);
            }
        });
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            if (cachedPresets) {
                renderPresetsGrid(cachedPresets);
            }
        });
    }
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

/**
 * Setups listener for main tab switches to reload the catalog if active.
 */
function setupMainTabActiveListener() {
    document.addEventListener('rpc-tab-active', () => {
        const publicContent = document.getElementById('rpc-public-presets-content');
        if (publicContent && publicContent.style.display === 'block') {
            loadCatalogCatalogHybrid();
        }
    });
}

module.exports = { init };

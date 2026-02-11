/*
 * Solari RPC - SoundBoard UI Module
 * Copyright (C) 2026 TheDroid
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 */

// SoundBoard UI Module - VB-Cable Integration with Mic Passthrough
(() => {
    const { ipcRenderer: sbIpcRenderer } = require('electron');

    // ===== DRAG AND DROP (handled by inline script in index.html) =====
    // The inline script dispatches 'soundboard-files-added' when files are added via DnD.
    // We listen for it here to refresh the sounds list and re-render.
    window.addEventListener('soundboard-files-added', async () => {
        try {
            const result = await sbIpcRenderer.invoke('soundboard:get-sounds');
            // get-sounds returns an array directly, not { sounds: [...] }
            if (result && Array.isArray(result)) {
                sounds = result;
            }
            if (typeof renderSounds === 'function') {
                renderSounds();
            }
            console.log('[SoundBoard] Refreshed after DnD, sounds count:', sounds.length);
        } catch (e) {
            console.error('[SoundBoard] Error refreshing after DnD:', e);
        }
    });

    // State
    let sounds = [];
    let categories = ['default', 'custom'];
    let driverInstalled = false;
    let audioDevices = [];
    let inputDevices = []; // Microphone devices
    let selectedOutputDevice = null;
    let audioContext = null;
    let settings = {
        enabled: true,
        globalVolume: 0.8,
        previewVolume: 0.5,
        viewMode: 'grid',
        showFavoritesFirst: true,
        outputDeviceId: null,
        inputDeviceId: null, // Microphone device
        micPassthrough: true, // Enable mic passthrough by default
        micVolume: 1.0,
        loudnessEqualization: false // NEW: Volume Normalization
    };

    // Audio Mixer State
    let micStream = null;
    let micSource = null;
    let micGainNode = null;
    let masterGainNode = null;
    let mixerDestination = null;
    let micPassthroughActive = false;

    // UI State
    let searchQuery = '';
    let selectedCategory = 'all';
    let currentlyPlaying = null;
    let currentAudioSource = null;
    let currentGainNode = null;
    let compressorNode = null; // Loudness Equalization (DynamicsCompressor)

    // DOM Elements
    let elements = {};

    // Helper for Toast Notifications
    const safeShowToast = (icon, message, type) => {
        if (typeof window.showToast === 'function') {
            window.showToast(icon, message, type);
        } else {
            console.log(`[SoundBoard] ${icon} ${message}`);
        }
    };

    // Initialize DOM Elements
    function initElements() {
        elements = {
            soundboardGrid: document.getElementById('soundboard-grid'),
            dropZone: document.getElementById('drop-zone'),
            globalVolumeSlider: document.getElementById('global-volume'),
            globalVolumeValue: document.getElementById('global-volume-value'),
            addSoundBtn: document.getElementById('soundboard-add-btn'),
            settingsBtn: document.getElementById('soundboard-settings-btn'),
            searchInput: document.getElementById('soundboard-search'),
            categorySelect: document.getElementById('soundboard-category-filter'),
            viewModeBtn: document.getElementById('soundboard-view-mode'),
            stopAllBtn: document.getElementById('soundboard-stop-all'),
            exportBtn: document.getElementById('soundboard-export-btn'),
            importBtn: document.getElementById('soundboard-import-btn'),
            outputDeviceSelect: document.getElementById('soundboard-output-device'),
            inputDeviceSelect: document.getElementById('soundboard-input-device'),
            micPassthroughToggle: document.getElementById('soundboard-mic-passthrough'),
            micVolumeSlider: document.getElementById('soundboard-mic-volume'),
            // Containers
            driverNotInstalledContainer: document.getElementById('soundboard-driver-not-installed'),
            soundboardReadyContainer: document.getElementById('soundboard-ready'),
            quickControls: document.querySelector('.soundboard-quick-controls')
        };
    }

    // Check if VB-Cable driver is installed
    async function checkDriverInstalled() {
        try {
            const result = await sbIpcRenderer.invoke('soundboard:check-driver-installed');
            driverInstalled = result.installed;
            console.log('[SoundBoard] Driver check:', driverInstalled ? 'INSTALLED' : 'NOT INSTALLED');
            return result;
        } catch (e) {
            console.error('[SoundBoard] Error checking driver:', e);
            return { installed: false };
        }
    }

    // Enumerate audio output and input devices
    async function enumerateAudioDevices() {
        try {
            // Request mic permission to get device labels (and immediately release)
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
            } catch (e) {
                console.warn('[SoundBoard] Mic permission not granted, device labels may be unavailable');
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            audioDevices = devices.filter(d => d.kind === 'audiooutput');
            inputDevices = devices.filter(d => d.kind === 'audioinput');
            console.log('[SoundBoard] Output devices:', audioDevices.map(d => d.label));
            console.log('[SoundBoard] Input devices:', inputDevices.map(d => d.label));
            return { outputs: audioDevices, inputs: inputDevices };
        } catch (e) {
            console.error('[SoundBoard] Error enumerating devices:', e);
            return { outputs: [], inputs: [] };
        }
    }

    // Audio output element for routing to specific device
    let audioOutputElement = null;
    let mediaStreamDestination = null;
    let usingCableOutput = false;

    // Initialize audio mixer with mic passthrough
    async function initAudioMixer() {
        try {
            // Close existing context if device changed
            const deviceId = settings.outputDeviceId || '';
            const newUsingCable = deviceId && deviceId !== '';

            if (audioContext && usingCableOutput !== newUsingCable) {
                // Device type changed, need to recreate connections
                if (masterGainNode) {
                    masterGainNode.disconnect();
                    masterGainNode = null;
                }
                if (audioOutputElement) {
                    audioOutputElement.pause();
                    audioOutputElement.srcObject = null;
                    audioOutputElement = null;
                }
                mediaStreamDestination = null;
            }

            usingCableOutput = newUsingCable;

            if (!audioContext || audioContext.state === 'closed') {
                audioContext = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
            }

            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // Setup based on output type
            if (deviceId && deviceId !== '') {
                // Specific device selected (e.g. CABLE) - Dual Routing Strategy

                // 1. Create MediaStreamDestination (for CABLE routing)
                if (!mediaStreamDestination) {
                    mediaStreamDestination = audioContext.createMediaStreamDestination();
                }

                // 2. Create Master Gain (for SOUNDS only)
                if (!masterGainNode) {
                    masterGainNode = audioContext.createGain();
                    masterGainNode.gain.value = 1.0;

                    // 2.5 Create Compressor for Loudness Equalization
                    compressorNode = audioContext.createDynamicsCompressor();
                    compressorNode.threshold.setValueAtTime(-24, audioContext.currentTime);
                    compressorNode.knee.setValueAtTime(30, audioContext.currentTime);
                    compressorNode.ratio.setValueAtTime(12, audioContext.currentTime);
                    compressorNode.attack.setValueAtTime(0.003, audioContext.currentTime);
                    compressorNode.release.setValueAtTime(0.25, audioContext.currentTime);

                    if (settings.loudnessEqualization) {
                        // Route through compressor
                        masterGainNode.connect(compressorNode);
                        compressorNode.connect(mediaStreamDestination);
                        compressorNode.connect(audioContext.destination);
                    } else {
                        // Bypass compressor
                        masterGainNode.connect(mediaStreamDestination);
                        masterGainNode.connect(audioContext.destination);
                    }
                }

                if (!audioOutputElement) {
                    audioOutputElement = new Audio();
                    audioOutputElement.srcObject = mediaStreamDestination.stream;
                }

                // Set output device for the hidden element (sends stream to CABLE)
                if (audioOutputElement.setSinkId) {
                    try {
                        await audioOutputElement.setSinkId(deviceId);
                        const device = audioDevices.find(d => d.deviceId === deviceId);
                        console.log('[SoundBoard] Audio routed to:', device?.label || deviceId, '+ Monitor');
                    } catch (e) {
                        console.error('[SoundBoard] setSinkId failed:', e);
                    }
                }

                // Start playing (this pipes the MediaStreamDestination to the CABLE device)
                audioOutputElement.play().catch(e => console.warn('[SoundBoard] Audio play error:', e));
            } else {
                // Default output - connect directly to speakers
                if (!masterGainNode) {
                    masterGainNode = audioContext.createGain();
                    masterGainNode.gain.value = 1.0;
                    masterGainNode.connect(audioContext.destination);
                }
                console.log('[SoundBoard] Audio routed to: Default (Windows)');
            }

            return true;
        } catch (e) {
            console.error('[SoundBoard] Error initializing audio mixer:', e);
            return false;
        }
    }

    // Check if output device is a VB-Cable device
    function isOutputCableDevice() {
        const deviceId = settings.outputDeviceId || '';
        if (!deviceId) return false;

        // Find the device label
        const device = audioDevices.find(d => d.deviceId === deviceId);
        if (!device) return false;

        const label = device.label.toLowerCase();
        return label.includes('cable');
    }

    // Start microphone passthrough
    async function startMicPassthrough() {
        if (micPassthroughActive) return true;

        // Only enable mic passthrough if output is set to CABLE Input
        if (!isOutputCableDevice()) {
            console.log('[SoundBoard] Mic passthrough skipped - output is not CABLE device. Select CABLE Input as output first.');
            safeShowToast('⚠️', 'Selecione CABLE Input como saída primeiro!', 'warning');
            return false;
        }

        try {
            await initAudioMixer();

            // Get mic stream
            // Hybrid approach: Native browser noiseSuppression + AudioWorklet HPF/Gate
            const useAdvancedNoiseSuppression = settings.noiseSuppression !== false; // Default ON

            // Enable native noise suppression AND use our AudioWorklet filter for maximum effect
            const constraints = {
                audio: {
                    deviceId: settings.inputDeviceId ? { exact: settings.inputDeviceId } : undefined,
                    noiseSuppression: useAdvancedNoiseSuppression, // Enable native noise suppression
                    echoCancellation: useAdvancedNoiseSuppression, // Echo cancellation
                    autoGainControl: false // Disable AGC to prevent boosting fan noise
                }
            };

            micStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Create mic source and gain
            micSource = audioContext.createMediaStreamSource(micStream);
            micGainNode = audioContext.createGain();
            micGainNode.gain.value = settings.micVolume || 1.0;

            // Try to load RNNoise for advanced noise suppression
            let rnnoiseNode = null;
            if (useAdvancedNoiseSuppression) {
                try {
                    console.log('[SoundBoard] Loading RNNoise...');
                    rnnoiseNode = await loadRNNoise(audioContext);
                    console.log('[SoundBoard] RNNoise loaded successfully');
                } catch (e) {
                    console.warn('[SoundBoard] RNNoise load failed, using raw audio:', e);
                }
            }

            // Routing: Mic -> (RNNoise) -> Gain -> MediaStreamDestination (Cable)
            if (rnnoiseNode) {
                micSource.connect(rnnoiseNode);
                rnnoiseNode.connect(micGainNode);
                micSource.rnnoiseNode = rnnoiseNode; // Store ref for cleanup

                // Setup noise level slider handler
                const noiseLevelSlider = document.getElementById('soundboard-noise-level');
                const noiseLevelValue = document.getElementById('noise-level-value');
                if (noiseLevelSlider) {
                    // Send initial threshold
                    const initialLevel = parseInt(noiseLevelSlider.value) / 100;
                    rnnoiseNode.port.postMessage({ type: 'set-threshold', threshold: initialLevel });

                    noiseLevelSlider.addEventListener('input', () => {
                        const level = parseInt(noiseLevelSlider.value);
                        if (noiseLevelValue) noiseLevelValue.textContent = level + '%';
                        // Send to processor: 0% = less aggressive (0.3), 100% = aggressive (0.95)
                        const threshold = 0.3 + (level / 100) * 0.65;
                        rnnoiseNode.port.postMessage({ type: 'set-threshold', threshold: threshold });
                    });

                    // Update slider fill
                    if (typeof updateSliderFill === 'function') updateSliderFill(noiseLevelSlider);
                }
            } else {
                micSource.connect(micGainNode);
            }

            if (mediaStreamDestination) {
                micGainNode.connect(mediaStreamDestination);
            } else {
                // Fallback if no specific output selected (should not happen due to check above)
                // If using default output, mic passthrough usually isn't needed/wanted (self-echo)
                console.warn('[SoundBoard] Mic passthrough active but no MediaStreamDestination found');
            }

            micPassthroughActive = true;
            console.log('[SoundBoard] Mic passthrough started - routing to CABLE only');
            return true;
        } catch (e) {
            console.error('[SoundBoard] Error starting mic passthrough:', e);
            return false;
        }
    }

    // Stop microphone passthrough
    function stopMicPassthrough() {
        if (!micPassthroughActive) return;

        try {
            if (micSource) {
                micSource.disconnect();
                micSource = null;
            }
            if (micGainNode) {
                micGainNode.disconnect();
                micGainNode = null;
            }
            if (micStream) {
                micStream.getTracks().forEach(track => track.stop());
                micStream = null;
            }
            micPassthroughActive = false;
            console.log('[SoundBoard] Mic passthrough stopped');
        } catch (e) {
            console.error('[SoundBoard] Error stopping mic passthrough:', e);
        }
    }

    // Toggle mic passthrough
    async function toggleMicPassthrough(enable) {
        if (enable) {
            const success = await startMicPassthrough();
            if (success) {
                safeShowToast('🎤', 'Mic passthrough enabled', 'success');
            } else {
                // Passthrough failed - uncheck the toggle
                if (elements.micPassthroughToggle) {
                    elements.micPassthroughToggle.checked = false;
                }
                settings.micPassthrough = false;
            }
        } else {
            stopMicPassthrough();
            safeShowToast('🔇', 'Mic passthrough disabled', 'info');
        }
    }


    // Render the device selector dropdowns
    function renderDeviceSelector() {
        // Output device selector
        if (elements.outputDeviceSelect) {
            elements.outputDeviceSelect.innerHTML = '';

            // Add default option
            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = '🔊 Default Output';
            elements.outputDeviceSelect.appendChild(defaultOpt);

            // Find first CABLE device for auto-selection
            let firstCableDeviceId = null;

            // Add each device
            audioDevices.forEach(device => {
                const opt = document.createElement('option');
                opt.value = device.deviceId;
                const label = device.label || `Device ${device.deviceId.substring(0, 8)}`;

                // Highlight VB-Cable devices
                if (label.toLowerCase().includes('cable input')) {
                    opt.textContent = `🎚️ ${label} (Recomendado)`;
                    opt.style.fontWeight = 'bold';
                    if (!firstCableDeviceId) {
                        firstCableDeviceId = device.deviceId;
                    }
                } else if (label.toLowerCase().includes('cable')) {
                    opt.textContent = `🎚️ ${label}`;
                } else {
                    opt.textContent = `🔈 ${label}`;
                }

                elements.outputDeviceSelect.appendChild(opt);
            });

            // Set value: saved setting > auto-select CABLE Input > default
            if (settings.outputDeviceId) {
                elements.outputDeviceSelect.value = settings.outputDeviceId;
            } else if (firstCableDeviceId) {
                // Auto-select CABLE Input for best Discord experience
                elements.outputDeviceSelect.value = firstCableDeviceId;
                settings.outputDeviceId = firstCableDeviceId;
                console.log('[SoundBoard] Auto-selected CABLE Input for output');
            }
        }

        // Input device (microphone) selector
        if (elements.inputDeviceSelect) {
            elements.inputDeviceSelect.innerHTML = '';

            // Add default option
            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = '🎤 Default Microphone';
            elements.inputDeviceSelect.appendChild(defaultOpt);

            // Add each device
            inputDevices.forEach(device => {
                const opt = document.createElement('option');
                opt.value = device.deviceId;
                const label = device.label || `Mic ${device.deviceId.substring(0, 8)}`;

                // Don't show VB-Cable as input (would cause feedback)
                if (!label.toLowerCase().includes('cable')) {
                    opt.textContent = `🎙️ ${label}`;
                    elements.inputDeviceSelect.appendChild(opt);
                }
            });

            // Set saved value
            if (settings.inputDeviceId) {
                elements.inputDeviceSelect.value = settings.inputDeviceId;
            }
        }
    }

    // Show/hide UI based on driver status
    function updateUIState() {
        if (!driverInstalled) {
            // Show driver installation instructions
            if (elements.driverNotInstalledContainer) {
                elements.driverNotInstalledContainer.style.display = 'flex';
            }
            if (elements.soundboardReadyContainer) {
                elements.soundboardReadyContainer.style.display = 'none';
            }
            if (elements.quickControls) {
                elements.quickControls.style.display = 'none';
            }
            if (elements.dropZone) {
                elements.dropZone.style.display = 'none';
            }
            if (elements.soundboardGrid) {
                elements.soundboardGrid.style.display = 'none';
            }
        } else {
            // Show SoundBoard UI
            if (elements.driverNotInstalledContainer) {
                elements.driverNotInstalledContainer.style.display = 'none';
            }
            if (elements.soundboardReadyContainer) {
                elements.soundboardReadyContainer.style.display = 'block';
            }
            if (elements.quickControls) {
                elements.quickControls.style.display = 'flex';
            }
            if (elements.dropZone) {
                elements.dropZone.style.display = 'flex';
            }
            if (elements.soundboardGrid) {
                elements.soundboardGrid.style.display = 'grid';
            }
        }
    }

    // Load data from main process
    async function loadData() {
        try {
            const [soundsResult, settingsResult, categoriesResult] = await Promise.all([
                sbIpcRenderer.invoke('soundboard:get-sounds'),
                sbIpcRenderer.invoke('soundboard:get-settings'),
                sbIpcRenderer.invoke('soundboard:get-categories')
            ]);

            if (soundsResult && Array.isArray(soundsResult)) sounds = soundsResult;
            if (settingsResult) settings = { ...settings, ...settingsResult };
            if (categoriesResult) categories = categoriesResult;

            applySettings();
            renderSounds();
            renderCategories();
        } catch (e) {
            console.error('[SoundBoard] Failed to load data:', e);
        }
    }

    // Apply settings to UI
    function applySettings() {
        if (elements.globalVolumeSlider) {
            elements.globalVolumeSlider.value = settings.globalVolume * 100;
            if (elements.globalVolumeValue) {
                elements.globalVolumeValue.textContent = `${Math.round(settings.globalVolume * 100)}%`;
            }
            updateSliderFill(elements.globalVolumeSlider);
        }

        // Apply view mode
        if (elements.soundboardGrid) {
            elements.soundboardGrid.classList.remove('view-grid', 'view-list');
            elements.soundboardGrid.classList.add(`view-${settings.viewMode || 'grid'}`);
        }

        if (elements.viewModeBtn) {
            const icon = settings.viewMode === 'grid' ? '📊' : '📋';
            elements.viewModeBtn.innerHTML = `<span>${icon}</span>`;
        }
    }

    // Render category filter
    function renderCategories() {
        if (!elements.categorySelect) return;

        const currentValue = elements.categorySelect.value;
        elements.categorySelect.innerHTML = `
            <option value="all">📁 All</option>
            <option value="favorites">⭐ Favorites</option>
        `;

        categories.forEach(cat => {
            if (cat !== 'default' && cat !== 'custom') {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = `📂 ${cat}`;
                elements.categorySelect.appendChild(opt);
            }
        });

        elements.categorySelect.value = currentValue || 'all';
    }

    // Render sounds grid
    function renderSounds() {
        if (!elements.soundboardGrid) return;

        let filtered = [...sounds];

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s => s.name.toLowerCase().includes(query));
        }

        // Apply category filter
        if (selectedCategory === 'favorites') {
            filtered = filtered.filter(s => s.favorite);
        } else if (selectedCategory && selectedCategory !== 'all') {
            filtered = filtered.filter(s => s.customCategory === selectedCategory);
        }

        // Sort favorites first if enabled
        if (settings.showFavoritesFirst) {
            filtered.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
        }

        // Empty state
        if (filtered.length === 0) {
            elements.soundboardGrid.innerHTML = `
                <div class="soundboard-empty">
                    <div class="empty-icon">🎵</div>
                    <p>${searchQuery ? 'No sounds found for "' + searchQuery + '"' : 'No sounds yet. Add some!'}</p>
                </div>
            `;
            return;
        }

        elements.soundboardGrid.innerHTML = filtered.map(sound => {
            const isPlaying = currentlyPlaying === sound.id;
            const colorStyle = sound.color ? `border-left: 4px solid ${sound.color};` : '';

            return `
                <div class="sound-card glass-card hover-lift ${isPlaying ? 'playing' : ''} ${sound.favorite ? 'favorite' : ''}" 
                     data-sound-id="${sound.id}" 
                     style="${colorStyle}">
                    <div class="sound-card-header">
                        <span class="sound-icon">${sound.loop ? '🔁' : '🎵'}</span>
                        <button class="fav-btn btn-glass" onclick="window.sbToggleFavorite('${sound.id}')" title="Toggle Favorite">
                            ${sound.favorite ? '⭐' : '☆'}
                        </button>
                    </div>
                    <div class="sound-name" title="${sound.name}" ondblclick="window.sbRenameSound('${sound.id}')">${sound.name}</div>
                    <div class="sound-shortcut" onclick="window.sbBindHotkey('${sound.id}')" title="Click to bind Global Hotkey" style="cursor: pointer;">${sound.shortcut || '⌨️ Bind Key'}</div>
                    <div class="sound-meta">${formatFileSize(sound.size)}</div>
                    <div class="sound-actions">
                        <button class="sound-btn btn-primary-glow ${isPlaying ? 'playing' : ''}" onclick="window.sbPlaySound('${sound.id}')" title="${isPlaying ? 'Stop' : 'Play'}">
                            ${isPlaying ? '⏹️' : '▶️'}
                        </button>
                        <button class="sound-btn btn-glass" onclick="window.sbEditSound('${sound.id}')" title="Edit">
                            ⚙️
                        </button>
                        <button class="sound-btn btn-glass btn-delete" onclick="window.sbDeleteSound('${sound.id}')" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function updateSliderFill(slider) {
        if (!slider) return;
        const fillPercent = slider.value;
        slider.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${fillPercent}%, rgba(255,255,255,0.1) ${fillPercent}%, rgba(255,255,255,0.1) 100%)`;
    }

    // ===== AUDIO PLAYBACK =====

    // Play sound through selected output device (mixed with mic if passthrough is on)
    async function playSoundToDevice(soundUrl, volume = 1.0, loop = false) {
        try {
            // Initialize the mixer (sets up audioContext and output device)
            await initAudioMixer();

            // Stop any currently playing sound
            stopCurrentSound();

            // Fetch and decode audio
            const response = await fetch(soundUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Create source and gain nodes
            const source = audioContext.createBufferSource();
            const gainNode = audioContext.createGain();

            source.buffer = audioBuffer;
            source.loop = loop;
            gainNode.gain.value = volume * settings.globalVolume;

            // Connect nodes - route through masterGainNode for proper mixing
            source.connect(gainNode);
            gainNode.connect(masterGainNode);

            // Start playback
            source.start(0);

            // Track current source
            currentAudioSource = source;
            currentGainNode = gainNode;

            // Handle end of playback
            source.onended = () => {
                if (currentAudioSource === source) {
                    currentlyPlaying = null;
                    currentAudioSource = null;
                    currentGainNode = null;
                    renderSounds();
                }
            };

            return true;
        } catch (e) {
            console.error('[SoundBoard] Error playing sound:', e);
            return false;
        }
    }

    // Stop currently playing sound
    function stopCurrentSound() {
        if (currentAudioSource) {
            try {
                currentAudioSource.stop();
                currentAudioSource.disconnect(); // Prevent memory leak
            } catch (e) {
                // Already stopped/disconnected
            }
            currentAudioSource = null;
        }
        if (currentGainNode) {
            try {
                currentGainNode.disconnect(); // Cleanup gain node
            } catch (e) {
                // Already disconnected
            }
            currentGainNode = null;
        }
    }

    // ===== EXPOSED GLOBAL FUNCTIONS =====

    // Listen for hotkey play commands from main process
    // Main process sends 'soundboard:play-direct' with {soundId, url, volume, loop}
    sbIpcRenderer.on('soundboard:play-direct', (event, data) => {
        const { soundId } = data;

        // Ensure audio context is running
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }

        // Play the sound
        if (typeof window.sbPlaySound === 'function') {
            window.sbPlaySound(soundId);
        }
    });

    // Legacy fallback listener
    sbIpcRenderer.on('soundboard:play-from-hotkey', (event, soundId) => {
        // Ensure audio context is running
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
            });
        }

        // Try to play the sound
        if (typeof window.sbPlaySound === 'function') {
            window.sbPlaySound(soundId);
        } else {
            console.error('[SoundBoard UI] sbPlaySound not available!');
        }
    });

    // Play sound
    window.sbPlaySound = async function (soundId) {
        if (!settings.enabled) {
            safeShowToast('⚠️', 'SoundBoard is disabled', 'warning');
            return;
        }

        try {
            const wasPlaying = currentlyPlaying === soundId;

            if (wasPlaying) {
                // Stop the sound
                stopCurrentSound();
                currentlyPlaying = null;
                renderSounds();
                safeShowToast('⏹️', 'Sound stopped', 'info');
                return;
            }

            // Get sound info
            const sound = sounds.find(s => s.id === soundId);
            if (!sound) return;

            // Get sound URL from server
            const serverUrl = `http://127.0.0.1:6465/sounds/${soundId}`;

            // Play sound
            currentlyPlaying = soundId;
            renderSounds();

            const success = await playSoundToDevice(serverUrl, sound.volume || 1.0, sound.loop || false);

            if (!success) {
                currentlyPlaying = null;
                renderSounds();
                safeShowToast('❌', 'Error playing sound', 'error');
            }
        } catch (e) {
            console.error('[SoundBoard] Play error:', e);
            safeShowToast('❌', 'Error playing sound', 'error');
        }
    };

    // Stop all sounds
    window.sbStopAll = function () {
        stopCurrentSound();
        currentlyPlaying = null;
        renderSounds();
        safeShowToast('⏹️', 'All sounds stopped', 'info');
    };

    // Toggle favorite
    window.sbToggleFavorite = async function (soundId) {
        try {
            const result = await sbIpcRenderer.invoke('soundboard:toggle-favorite', soundId);
            if (result.success) {
                const idx = sounds.findIndex(s => s.id === soundId);
                if (idx >= 0) {
                    sounds[idx].favorite = !sounds[idx].favorite;
                }
                renderSounds();
            }
        } catch (e) {
            console.error('[SoundBoard] Error toggling favorite:', e);
        }
    };

    // Rename sound
    window.sbRenameSound = async function (soundId) {
        const sound = sounds.find(s => s.id === soundId);
        if (!sound) return;

        const newName = prompt('Enter new name:', sound.name);
        if (newName && newName.trim() && newName !== sound.name) {
            try {
                await sbIpcRenderer.invoke('soundboard:update-sound', soundId, { name: newName.trim() });
                sound.name = newName.trim();
                renderSounds();
                safeShowToast('✏️', 'Sound renamed', 'success');
            } catch (e) {
                console.error('[SoundBoard] Error renaming sound:', e);
            }
        }
    };

    // Edit sound
    window.sbEditSound = async function (soundId) {
        const sound = sounds.find(s => s.id === soundId);
        if (!sound) return;

        // Simple edit modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <h3>⚙️ Edit Sound</h3>
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" id="edit-sound-name" class="input-field" value="${sound.name}">
                </div>
                <div class="form-group">
                    <label>Volume</label>
                    <input type="range" id="edit-sound-volume" min="0" max="100" value="${(sound.volume || 1) * 100}" class="volume-slider-modern">
                </div>
                <div class="form-group">
                    <label>Color</label>
                    <input type="color" id="edit-sound-color" value="${sound.color || '#ff9966'}" class="color-input">
                </div>
                <div class="form-group checkbox-group">
                    <label>
                        <input type="checkbox" id="edit-sound-loop" ${sound.loop ? 'checked' : ''}>
                        Loop
                    </label>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="edit-cancel">Cancel</button>
                    <button class="btn-primary" id="edit-save">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#edit-cancel').onclick = () => modal.remove();
        modal.querySelector('#edit-save').onclick = async () => {
            const updates = {
                name: modal.querySelector('#edit-sound-name').value,
                volume: modal.querySelector('#edit-sound-volume').value / 100,
                color: modal.querySelector('#edit-sound-color').value,
                loop: modal.querySelector('#edit-sound-loop').checked
            };
            try {
                await sbIpcRenderer.invoke('soundboard:update-sound', soundId, updates);
                Object.assign(sound, updates);
                renderSounds();
                safeShowToast('✅', 'Sound updated', 'success');
            } catch (e) {
                console.error('[SoundBoard] Error updating sound:', e);
            }
            modal.remove();
        };
    };

    // Delete sound
    window.sbDeleteSound = async function (soundId) {
        if (!confirm('Delete this sound?')) return;

        try {
            await sbIpcRenderer.invoke('soundboard:delete-sound', soundId);
            sounds = sounds.filter(s => s.id !== soundId);
            renderSounds();
            safeShowToast('🗑️', 'Sound deleted', 'success');
        } catch (e) {
            console.error('[SoundBoard] Error deleting sound:', e);
        }
    };

    // Add sound
    window.sbAddSound = async function () {
        try {
            const result = await sbIpcRenderer.invoke('soundboard:pick-file');
            if (!result.canceled && result.filePaths.length > 0) {
                for (const filePath of result.filePaths) {
                    const name = filePath.split(/[/\\]/).pop().replace(/\.[^/.]+$/, '');
                    const addResult = await sbIpcRenderer.invoke('soundboard:add-sound', filePath, name, 'custom');
                    if (addResult.success) {
                        sounds.push(addResult.sound);
                    }
                }
                renderSounds();
                safeShowToast('✅', 'Sound(s) added', 'success');
            }
        } catch (e) {
            console.error('[SoundBoard] Error adding sound:', e);
        }
    };

    // Export library
    window.sbExportLibrary = async function () {
        try {
            const result = await sbIpcRenderer.invoke('soundboard:export');
            if (result.success) {
                safeShowToast('📤', 'Library exported', 'success');
            }
        } catch (e) {
            console.error('[SoundBoard] Error exporting:', e);
        }
    };

    // Import library
    window.sbImportLibrary = async function () {
        try {
            const result = await sbIpcRenderer.invoke('soundboard:import');
            if (result.success) {
                await loadData();
                safeShowToast('📥', 'Library imported', 'success');
            }
        } catch (e) {
            console.error('[SoundBoard] Error importing:', e);
        }
    };

    // Toggle view mode
    window.sbToggleViewMode = function () {
        settings.viewMode = settings.viewMode === 'grid' ? 'list' : 'grid';
        sbIpcRenderer.invoke('soundboard:update-settings', settings);

        // Update icon
        const iconEl = document.getElementById('view-mode-icon');
        if (iconEl) {
            iconEl.textContent = settings.viewMode === 'grid' ? '▦' : '☰';
        }

        applySettings();
        renderSounds();
    };

    // Open VB-Cable download page
    window.sbDownloadDriver = function () {
        require('electron').shell.openExternal('https://vb-audio.com/Cable/');
    };

    // Refresh driver detection
    window.sbRefreshDriver = async function () {
        const result = await checkDriverInstalled();
        if (result.installed) {
            await enumerateAudioDevices();
            renderDeviceSelector();
            updateUIState();
            await loadData();
            safeShowToast('✅', 'VB-Cable detected!', 'success');
        } else {
            safeShowToast('⚠️', 'VB-Cable not found', 'warning');
        }
    };

    // Setup event listeners
    function setupEventListeners() {
        // Search
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value;
                renderSounds();
            });
        }

        // Category filter
        if (elements.categorySelect) {
            elements.categorySelect.addEventListener('change', (e) => {
                selectedCategory = e.target.value;
                renderSounds();
            });
        }

        // Volume slider
        if (elements.globalVolumeSlider) {
            elements.globalVolumeSlider.addEventListener('input', async (e) => {
                settings.globalVolume = e.target.value / 100;
                if (elements.globalVolumeValue) {
                    elements.globalVolumeValue.textContent = `${Math.round(settings.globalVolume * 100)}%`;
                }
                updateSliderFill(e.target);

                // Update gain if currently playing
                if (currentGainNode) {
                    currentGainNode.gain.value = settings.globalVolume;
                }

                await sbIpcRenderer.invoke('soundboard:update-settings', settings);
            });
        }

        // Noise Suppression Toggle
        const noiseSuppressionToggle = document.getElementById('soundboard-noise-suppression');
        if (noiseSuppressionToggle) {
            // Set initial state
            noiseSuppressionToggle.checked = settings.noiseSuppression !== false;

            noiseSuppressionToggle.addEventListener('change', async (e) => {
                settings.noiseSuppression = e.target.checked;
                await sbIpcRenderer.invoke('soundboard:update-settings', settings);

                // If mic passthrough is active, restart it to apply new constraints
                if (micPassthroughActive) {
                    await stopMicPassthrough();
                    await startMicPassthrough();
                }

                const status = settings.noiseSuppression ? 'ON' : 'OFF';
                safeShowToast(settings.noiseSuppression ? '🔇' : '🔊', `Noise Suppression: ${status}`, 'info');
            });
        }

        // Loudness Equalization Toggle (NEW)
        const loudnessEqToggle = document.getElementById('soundboard-loudness-eq');
        if (loudnessEqToggle) {
            loudnessEqToggle.checked = settings.loudnessEqualization || false;

            loudnessEqToggle.addEventListener('change', async (e) => {
                settings.loudnessEqualization = e.target.checked;
                await sbIpcRenderer.invoke('soundboard:update-settings', settings);

                // Need to re-route audio nodes to apply/bypass compressor
                if (masterGainNode && compressorNode && mediaStreamDestination && audioContext) {
                    masterGainNode.disconnect();

                    if (settings.loudnessEqualization) {
                        masterGainNode.connect(compressorNode);
                        compressorNode.disconnect();
                        compressorNode.connect(mediaStreamDestination);
                        compressorNode.connect(audioContext.destination);
                    } else {
                        compressorNode.disconnect();
                        masterGainNode.connect(mediaStreamDestination);
                        masterGainNode.connect(audioContext.destination);
                    }
                }

                const statusLE = settings.loudnessEqualization ? 'ON' : 'OFF';
                safeShowToast(settings.loudnessEqualization ? '📈' : '📊', `Loudness Eq: ${statusLE}`, 'info');
            });
        }

        // View mode toggle
        if (elements.viewModeBtn) {
            elements.viewModeBtn.addEventListener('click', window.sbToggleViewMode);
        }

        // Stop all button
        if (elements.stopAllBtn) {
            elements.stopAllBtn.addEventListener('click', window.sbStopAll);
        }

        // Add sound button
        if (elements.addSoundBtn) {
            elements.addSoundBtn.addEventListener('click', window.sbAddSound);
        }

        // Export button
        if (elements.exportBtn) {
            elements.exportBtn.addEventListener('click', window.sbExportLibrary);
        }

        // Import button
        if (elements.importBtn) {
            elements.importBtn.addEventListener('click', window.sbImportLibrary);
        }

        // Drag and drop is now handled by the self-executing setupGlobalDragDrop() at script load time.
        // No need to call setupDropTarget here.

        // Output device selector
        if (elements.outputDeviceSelect) {
            elements.outputDeviceSelect.addEventListener('change', async (e) => {
                settings.outputDeviceId = e.target.value;
                await sbIpcRenderer.invoke('soundboard:update-settings', settings);

                // Check if new device is CABLE
                const isCable = isOutputCableDevice();

                if (micPassthroughActive) {
                    // Stop current passthrough
                    stopMicPassthrough();

                    if (isCable) {
                        // New device is also CABLE, restart passthrough
                        await startMicPassthrough();
                    } else {
                        // Switched away from CABLE, disable mic passthrough
                        if (elements.micPassthroughToggle) {
                            elements.micPassthroughToggle.checked = false;
                        }
                        settings.micPassthrough = false;
                        safeShowToast('🔇', 'Mic passthrough desativado (não é CABLE)', 'info');
                    }
                }

                // Reinitialize audio mixer with new device
                await initAudioMixer();

                safeShowToast('🔊', 'Output device changed', 'info');
            });
        }

        // Input device (microphone) selector
        if (elements.inputDeviceSelect) {
            elements.inputDeviceSelect.addEventListener('change', async (e) => {
                settings.inputDeviceId = e.target.value;
                await sbIpcRenderer.invoke('soundboard:update-settings', settings);

                // Restart mic passthrough with new device
                if (micPassthroughActive) {
                    stopMicPassthrough();
                    await startMicPassthrough();
                }

                safeShowToast('🎤', 'Microphone changed', 'info');
            });
        }

        // Mic passthrough toggle
        if (elements.micPassthroughToggle) {
            elements.micPassthroughToggle.addEventListener('change', async (e) => {
                settings.micPassthrough = e.target.checked;
                await sbIpcRenderer.invoke('soundboard:update-settings', settings);
                await toggleMicPassthrough(e.target.checked);
            });
        }

        // Mic volume slider
        if (elements.micVolumeSlider) {
            elements.micVolumeSlider.addEventListener('input', async (e) => {
                settings.micVolume = e.target.value / 100;
                updateSliderFill(e.target);

                // Update mic gain if active
                if (micGainNode) {
                    micGainNode.gain.value = settings.micVolume;
                }

                await sbIpcRenderer.invoke('soundboard:update-settings', settings);
            });
        }

    }

    // Initialize SoundBoard
    window.initSoundBoard = async function () {
        console.log('[SoundBoard] Initializing...');

        initElements();

        // Check for VB-Cable driver
        const driverResult = await checkDriverInstalled();

        if (driverResult.installed) {
            // Driver installed - enumerate devices and show UI
            await enumerateAudioDevices();
            renderDeviceSelector();
            await loadData();
            setupEventListeners();

            // Apply mic passthrough toggle state from settings
            if (elements.micPassthroughToggle) {
                elements.micPassthroughToggle.checked = settings.micPassthrough !== false;
            }

            // Apply mic volume slider state
            if (elements.micVolumeSlider) {
                elements.micVolumeSlider.value = (settings.micVolume || 1.0) * 100;
                updateSliderFill(elements.micVolumeSlider);
            }

            // Auto-start mic passthrough if enabled AND CABLE is selected as output
            if (settings.micPassthrough !== false && isOutputCableDevice()) {
                console.log('[SoundBoard] Auto-starting mic passthrough (CABLE output detected)...');
                setTimeout(async () => {
                    await startMicPassthrough();
                }, 500);
            }
        }

        updateUIState();
        console.log('[SoundBoard] Initialization complete. Driver installed:', driverResult.installed);
    };

    // Load RNNoise AudioWorklet with Jitsi WASM
    async function loadRNNoise(context) {
        try {
            await context.audioWorklet.addModule('assets/rnnoise/processor.js');
            const node = new AudioWorkletNode(context, 'rnnoise-processor', {
                processorOptions: { latencyHint: 'interactive' }
            });

            // Load WASM binary
            const response = await fetch('assets/rnnoise/rnnoise.wasm');
            const wasmBytes = await response.arrayBuffer();

            return new Promise((resolve, reject) => {
                node.port.onmessage = (event) => {
                    if (event.data.type === 'loaded') {
                        resolve(node);
                    } else if (event.data.type === 'error') {
                        reject(event.data.error);
                    }
                };

                // Send WASM to processor
                node.port.postMessage({
                    type: 'load-wasm',
                    wasmBytes: wasmBytes
                });

                // Timeout fallback
                setTimeout(() => reject('RNNoise load timeout'), 5000);
            });
        } catch (e) {
            throw e;
        }
    }

    // Hotkey Binding Logic
    window.sbBindHotkey = async (soundId) => {
        const sound = sounds.find(s => s.id === soundId);
        if (!sound) return;

        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 10000;
            display: flex; justify-content: center; align-items: center;
        `;

        modal.innerHTML = `
            <div class="modal-content" style="background: #1a1a3e; padding: 30px; border-radius: 12px; text-align: center; border: 1px solid #5865f2; min-width: 300px;">
                <h3 style="color: #fff; margin-bottom: 20px;">Bind Hotkey for "${sound.name}"</h3>
                <div id="hotkey-display" style="font-size: 24px; color: #5865f2; margin: 20px 0; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 6px;">Press any key combo...</div>
                <div style="font-size: 12px; color: #aaa; margin-bottom: 20px;">Supported: Ctrl, Shift, Alt + Key</div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="btn-cancel" style="padding: 10px 20px; border-radius: 6px; border: none; background: #4a4a6a; color: white; cursor: pointer;">Cancel</button>
                    <button id="btn-clear" style="padding: 10px 20px; border-radius: 6px; border: none; background: #ef4444; color: white; cursor: pointer;">Unbind</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const display = modal.querySelector('#hotkey-display');
        let currentAccelerator = '';

        const keyHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Ignore standalone modifiers
            if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

            const modifiers = [];
            if (e.ctrlKey) modifiers.push('CommandOrControl');
            if (e.shiftKey) modifiers.push('Shift');
            if (e.altKey) modifiers.push('Alt');
            if (e.metaKey) modifiers.push('Super');

            // Convert key to Electron format
            let key = e.key.toUpperCase();
            if (key === ' ') key = 'Space';
            if (key.length === 1) key = key.toUpperCase();
            // Arrow keys
            if (key === 'ARROWUP') key = 'Up';
            if (key === 'ARROWDOWN') key = 'Down';
            if (key === 'ARROWLEFT') key = 'Left';
            if (key === 'ARROWRIGHT') key = 'Right';

            // Function keys are already F1, F2...

            if (modifiers.length > 0) {
                currentAccelerator = `${modifiers.join('+')}+${key}`;
            } else {
                currentAccelerator = key;
            }

            display.textContent = currentAccelerator;
            display.style.border = '2px solid #4ade80';

            // Auto-save after short delay
            setTimeout(async () => {
                cleanup();
                const result = await sbIpcRenderer.invoke('soundboard:register-hotkey', soundId, currentAccelerator);
                if (result.success) {
                    safeShowToast('⌨️', `Hotkey bound: ${currentAccelerator}`, 'success');
                    sound.shortcut = currentAccelerator;
                    renderSounds();
                } else {
                    safeShowToast('⚠️', 'Failed to bind hotkey', 'error');
                }
            }, 500);
        };

        const cleanup = () => {
            document.removeEventListener('keydown', keyHandler);
            if (document.body.contains(modal)) document.body.removeChild(modal);
        };

        document.addEventListener('keydown', keyHandler);

        modal.querySelector('#btn-cancel').onclick = cleanup;

        modal.querySelector('#btn-clear').onclick = async () => {
            cleanup();
            const result = await sbIpcRenderer.invoke('soundboard:unregister-hotkey', soundId);
            if (result.success) {
                safeShowToast('🗑️', 'Hotkey removed', 'info');
                sound.shortcut = null;
                renderSounds();
            }
        };
    };

    // Audio Editor with WaveSurfer.js
    window.sbEditSound = async (soundId) => {
        const WaveSurfer = require('wavesurfer.js').default;

        const sound = sounds.find(s => s.id === soundId);
        if (!sound) return;

        const serverUrl = `http://127.0.0.1:6465/sounds/${soundId}`;

        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 10000;
            display: flex; justify-content: center; align-items: center;
        `;

        modal.innerHTML = `
            <div class="audio-editor-modal" style="background: #1a1a3e; padding: 30px; border-radius: 16px; border: 1px solid #5865f2; width: 80%; max-width: 700px;">
                <h3 style="color: #fff; margin-bottom: 15px;">🎵 Editor: ${sound.name}</h3>
                <div id="waveform" style="background: rgba(0,0,0,0.4); border-radius: 8px; min-height: 128px;"></div>
                <div id="editor-time" style="text-align: center; margin-top: 10px; color: #aaa;">00:00 / 00:00</div>
                
                <div style="display: flex; justify-content: center; gap: 10px; margin: 15px 0;">
                    <button id="btn-play-pause" class="btn-modern" style="padding: 10px 20px;">▶️ Play</button>
                    <button id="btn-stop" class="btn-modern btn-secondary" style="padding: 10px 20px;">⏹️ Stop</button>
                </div>

                <div style="margin-top: 20px;">
                    <label style="color: #fff;">🔊 Volume: <span id="editor-volume-value">100%</span></label>
                    <input type="range" id="editor-volume" min="0" max="100" value="${(sound.volume || 1) * 100}" style="width: 100%;">
                </div>
                
                <div style="margin-top: 15px;">
                    <label style="color: #fff;">🔁 Loop</label>
                    <input type="checkbox" id="editor-loop" ${sound.loop ? 'checked' : ''}>
                </div>

                <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
                    <button id="btn-cancel-editor" class="btn-modern btn-secondary" style="padding: 10px 20px;">Cancel</button>
                    <button id="btn-save-editor" class="btn-modern btn-primary" style="padding: 10px 20px; background: #5865f2;">💾 Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Initialize WaveSurfer
        const wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#5865f2',
            progressColor: '#8b5cf6',
            cursorColor: '#fff',
            barWidth: 2,
            barRadius: 3,
            responsive: true,
            height: 128,
            normalize: true
        });

        wavesurfer.load(serverUrl);

        wavesurfer.on('ready', () => {
            const duration = wavesurfer.getDuration();
            modal.querySelector('#editor-time').textContent = `00:00 / ${formatTime(duration)}`;
        });

        wavesurfer.on('audioprocess', () => {
            const current = wavesurfer.getCurrentTime();
            const duration = wavesurfer.getDuration();
            modal.querySelector('#editor-time').textContent = `${formatTime(current)} / ${formatTime(duration)}`;
        });

        function formatTime(seconds) {
            const min = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60);
            return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        }

        // Controls
        modal.querySelector('#btn-play-pause').onclick = () => {
            wavesurfer.playPause();
            modal.querySelector('#btn-play-pause').textContent = wavesurfer.isPlaying() ? '⏸️ Pause' : '▶️ Play';
        };

        modal.querySelector('#btn-stop').onclick = () => {
            wavesurfer.stop();
            modal.querySelector('#btn-play-pause').textContent = '▶️ Play';
        };

        modal.querySelector('#editor-volume').oninput = (e) => {
            const val = e.target.value / 100;
            modal.querySelector('#editor-volume-value').textContent = `${e.target.value}%`;
            wavesurfer.setVolume(val);
        };

        // Cleanup
        const cleanup = () => {
            wavesurfer.destroy();
            if (document.body.contains(modal)) document.body.removeChild(modal);
        };

        modal.querySelector('#btn-cancel-editor').onclick = cleanup;

        modal.querySelector('#btn-save-editor').onclick = async () => {
            const newVolume = modal.querySelector('#editor-volume').value / 100;
            const newLoop = modal.querySelector('#editor-loop').checked;

            await sbIpcRenderer.invoke('soundboard:update-sound', soundId, {
                volume: newVolume,
                loop: newLoop
            });

            sound.volume = newVolume;
            sound.loop = newLoop;
            renderSounds();

            safeShowToast('💾', 'Sound settings saved!', 'success');
            cleanup();
        };
    };

    // Export for use in renderer.js
    window.soundBoardDriverInstalled = () => driverInstalled;
})();

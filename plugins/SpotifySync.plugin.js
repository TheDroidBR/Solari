/**
 * @name SpotifySync
 * @author TheDroid
 * @authorLink https://solarirpc.com
 * @description Adds Spotify playback controls above your Discord profile. Control music (play/pause, skip, previous) directly from Discord. Integrates with Solari for synchronized settings. Supports visibility modes: always show when Spotify is open, or only when playing music.
 * @version 1.0.0
 * @source https://github.com/TheDroidBR/Solari
 * @website https://solarirpc.com
 * @updateUrl https://raw.githubusercontent.com/TheDroidBR/Solari/main/plugins/SpotifySync.plugin.js
 */

module.exports = class SpotifySync {
    static translations = {
        en: {
            title: 'SpotifySync Settings',
            solari: 'Solari',
            connected: 'Connected',
            disconnected: 'Disconnected',
            enabled: 'Enabled',
            disabled: 'Disabled',
            nowPlaying: 'Now Playing',
            notPlaying: 'Not Playing',
            syncWithSolari: 'Sync with Solari',
            showControls: 'Show Playback Controls',
            language: 'Language',
            connectedToSolari: 'Connected to Solari',
            disconnectedFromSolari: 'Disconnected from Solari',
            spotifySynced: 'SpotifySync: Connected to Solari!',
            previous: 'Previous',
            playPause: 'Play/Pause',
            next: 'Next',
            controlsVisibility: 'Controls Visibility',
            whenOpen: 'Always show when Spotify is open',
            whenOpenHint: 'Controls visible even when paused',
            whenOpenWarning: '⚠️ 1-hour limit without playing music (Discord limitation)',
            whenPlaying: 'Only show when playing music',
            whenPlayingHint: 'Hides when music is paused',
            tokenExpired: 'Session expired! Play a song manually to restore controls.'
        },
        'pt-BR': {
            title: 'SpotifySync Configurações',
            solari: 'Solari',
            connected: 'Conectado',
            disconnected: 'Desconectado',
            enabled: 'Ativado',
            disabled: 'Desativado',
            nowPlaying: 'Tocando Agora',
            notPlaying: 'Não Tocando',
            syncWithSolari: 'Sincronizar com Solari',
            showControls: 'Mostrar Controles',
            language: 'Idioma',
            connectedToSolari: 'Conectado ao Solari',
            disconnectedFromSolari: 'Desconectado do Solari',
            spotifySynced: 'SpotifySync: Conectado ao Solari!',
            previous: 'Anterior',
            playPause: 'Play/Pause',
            next: 'Próxima',
            controlsVisibility: 'Visibilidade dos Controles',
            whenOpen: 'Sempre mostrar quando Spotify aberto',
            whenOpenHint: 'Controles visíveis mesmo quando pausado',
            whenOpenWarning: '⚠️ Limite de 1 hora sem tocar música (limitação do Discord)',
            whenPlaying: 'Mostrar apenas quando tocando música',
            whenPlayingHint: 'Oculta quando a música está pausada',
            tokenExpired: 'Sessão expirada! Toque uma música manualmente para restaurar os controles.'
        }
    };

    constructor(meta) {
        this.meta = meta;
        this.ws = null;
        this.spotifyStateInterval = null;
        this.controlsElement = null;
        this.controlsObserver = null;
        this.controlsReinjectInterval = null;
        this.currentTrack = null;
        this.isConnectedToSolari = false;
        this.lastSpotifyOpenTime = 0; // Cache when Spotify was last detected as open
        this.SPOTIFY_OPEN_CACHE_MS = 3600000; // Keep controls visible for 1 hour (token expiration time)

        this.config = {
            enabled: true,
            showControls: true,
            controlsVisibility: 'whenPlaying', // 'whenOpen' or 'whenPlaying'
            language: 'pt-BR',
            serverUrl: "ws://localhost:6464"
        };
    }

    t(key) {
        const lang = this.config.language || 'en';
        return SpotifySync.translations[lang]?.[key] || SpotifySync.translations['en'][key] || key;
    }

    loadConfig() {
        try {
            const savedConfig = BdApi.Data.load("SpotifySync", "config");
            if (savedConfig) {
                this.config = { ...this.config, ...savedConfig };
            }
        } catch (e) {
            console.error("[SpotifySync] Error loading config:", e);
        }
    }

    saveConfig() {
        try {
            BdApi.Data.save("SpotifySync", "config", this.config);
        } catch (e) {
            console.error("[SpotifySync] Error saving config:", e);
        }
    }

    start() {
        console.log("[SpotifySync] Starting...");
        this.loadConfig();
        this.connectToServer();
        this.startSpotifyDetection();
        if (this.config.showControls) {
            this.injectControls();
        }
    }

    stop() {
        console.log("[SpotifySync] Stopping...");
        this.stopSpotifyDetection();
        if (this.ws) this.ws.close();
        this.removeControls();
    }

    safeShowToast(message, options = {}) {
        try {
            if (typeof BdApi.showToast === "function") {
                BdApi.showToast(message, options);
            } else if (BdApi.UI && typeof BdApi.UI.showToast === "function") {
                BdApi.UI.showToast(message, options);
            }
        } catch (e) {
            console.error("[SpotifySync] Toast error:", e);
        }
    }

    // === WebSocket Connection ===
    connectToServer() {
        try {
            this.ws = new WebSocket(this.config.serverUrl);
            this.ws.onopen = () => {
                this.isConnectedToSolari = true;
                this.safeShowToast(this.t('spotifySynced'), { type: "success" });
                console.log("[SpotifySync]", this.t('connectedToSolari'));
                this.send({ type: 'handshake', source: 'SpotifySync' });
                this.sendConfig();
            };
            this.ws.onmessage = (e) => this.handleMessage(JSON.parse(e.data));
            this.ws.onclose = () => {
                this.isConnectedToSolari = false;
                console.log("[SpotifySync]", this.t('disconnectedFromSolari'));
                setTimeout(() => this.connectToServer(), 5000);
            };
            this.ws.onerror = (err) => console.error("[SpotifySync] WebSocket Error:", err);
        } catch (e) {
            console.error("[SpotifySync] Connection error:", e);
        }
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    sendConfig() {
        this.send({
            type: 'spotify_config',
            config: {
                enabled: this.config.enabled,
                showControls: this.config.showControls
            }
        });
    }

    handleMessage(data) {
        console.log("[SpotifySync] Received message:", data.type);

        // Legacy handler
        if (data.type === 'update_spotify_settings' || data.type === 'spotify_sync_settings_update') {
            this.config = { ...this.config, ...data.settings };
            this.saveConfig();

            // Update controls visibility
            if (this.config.showControls && !this.controlsElement) {
                this.injectControls();
            } else if (!this.config.showControls && this.controlsElement) {
                this.removeControls();
            }

            // Re-render controls with new visibility setting
            const state = this.getSpotifyState();
            if (this.config.controlsVisibility === 'whenOpen') {
                // Only show in whenOpen mode if Spotify is connected
                if (state.isSpotifyOpen) {
                    if (state.isPlaying && state.track) {
                        this.updateControlsDisplay(state.track, true);
                    } else {
                        this.updateControlsDisplay({ title: this.t('notPlaying'), artist: '' }, false);
                    }
                } else {
                    this.updateControlsDisplay(null, false);
                }
            } else {
                // whenPlaying mode
                if (state.isPlaying && state.track) {
                    this.updateControlsDisplay(state.track, true);
                } else {
                    this.updateControlsDisplay(null, false);
                }
            }

            this.sendConfig();
        } else if (data.type === 'set_language') {
            if (data.language && SpotifySync.translations[data.language]) {
                this.config.language = data.language;
                this.saveConfig();
            }
        } else if (data.type === 'spotify_control') {
            // Solari requesting playback control
            console.log("[SpotifySync] Control action received:", data.action);
            const result = this.executeSpotifyControl(data.action);
            console.log("[SpotifySync] Control executed:", result);
        }
    }

    // === Spotify Detection ===
    getSpotifyModule() {
        if (!this._spotifyModule) {
            // Find Discord's Spotify state module
            this._spotifyModule = BdApi.Webpack.getModule(
                m => m?.getActiveSocketAndDevice || m?.getActivity,
                { first: true }
            );
        }
        return this._spotifyModule;
    }

    getSpotifyPlayerModule() {
        if (!this._spotifyPlayer) {
            // Find Spotify player controls
            this._spotifyPlayer = BdApi.Webpack.getModule(
                m => m?.play && m?.pause && m?.next && m?.previous,
                { first: true }
            );
        }
        return this._spotifyPlayer;
    }

    getSpotifyState() {
        try {
            // Method 0: Direct SpotifyStore access (works without status setting)
            const SpotifyStore = BdApi.Webpack.getModule(m => m.getTrack && m.getPlaybackState);

            if (SpotifyStore) {
                const track = SpotifyStore.getTrack?.();
                const playbackState = SpotifyStore.getPlaybackState?.();

                // If we have a track, Spotify is open
                if (track) {
                    const isPlaying = playbackState?.isPlaying === true;
                    const albumArt = track.album?.image?.url ||
                        (track.album?.images?.[0]?.url) ||
                        null;

                    // Update cache - Spotify is confirmed open
                    this.lastSpotifyOpenTime = Date.now();
                    return {
                        isPlaying: isPlaying,
                        isSpotifyOpen: true,
                        track: {
                            title: track.name || 'Unknown',
                            artist: track.artists?.map(a => a.name).join(', ') || 'Unknown',
                            album: track.album?.name || '',
                            albumArtUrl: albumArt,
                            trackId: track.id || null,
                            startTime: playbackState?.position ? Date.now() - playbackState.position : Date.now(),
                            endTime: track.duration ? Date.now() + (track.duration - (playbackState?.position || 0)) : null
                        }
                    };
                }

                // Check if Spotify is connected (has active socket) even if no track playing
                // This detects Spotify being open but paused
                const SpotifySocket = BdApi.Webpack.getModule(m => m.getActiveSocketAndDevice);
                if (SpotifySocket) {
                    try {
                        const socketData = SpotifySocket.getActiveSocketAndDevice();
                        console.log("[SpotifySync] Socket data:", socketData);

                        // If we have a socket, Spotify is connected
                        if (socketData && socketData.socket) {
                            console.log("[SpotifySync] Active Spotify socket found!");
                            this.lastSpotifyOpenTime = Date.now(); // Update cache
                            return {
                                isPlaying: false,
                                isSpotifyOpen: true,
                                track: {
                                    title: this.t('notPlaying'),
                                    artist: '',
                                    album: '',
                                    albumArtUrl: null,
                                    trackId: null
                                }
                            };
                        }
                    } catch (e) {
                        console.log("[SpotifySync] Error checking socket:", e);
                    }
                } else {
                    console.log("[SpotifySync] SpotifySocket module not found");
                }
            }


            // Method 1: Try to get from Spotify activity (requires status setting enabled)
            const SpotifyActivityStore = BdApi.Webpack.getModule(m => m.getActivity && m.getName?.() === "SpotifyStore");

            if (SpotifyActivityStore) {
                const activity = SpotifyActivityStore.getActivity();
                if (activity && activity.type === 2) { // Listening activity
                    this.lastSpotifyOpenTime = Date.now(); // Update cache
                    return {
                        isPlaying: true,
                        isSpotifyOpen: true,
                        track: {
                            title: activity.details || 'Unknown',
                            artist: activity.state || 'Unknown',
                            album: activity.assets?.large_text || '',
                            albumArtUrl: activity.assets?.large_image ?
                                `https://i.scdn.co/image/${activity.assets.large_image.replace('spotify:', '')}` : null,
                            trackId: activity.sync_id || null,
                            startTime: activity.timestamps?.start,
                            endTime: activity.timestamps?.end
                        }
                    };
                }
            }

            // Method 2: Check listening activities from PresenceStore
            const UserStore = BdApi.Webpack.getModule(m => m.getCurrentUser);
            const PresenceStore = BdApi.Webpack.getModule(m => m.getActivities);

            if (UserStore && PresenceStore) {
                const user = UserStore.getCurrentUser();
                if (user) {
                    const activities = PresenceStore.getActivities(user.id);
                    const spotifyActivity = activities?.find(a => a.type === 2 && a.name === 'Spotify');

                    if (spotifyActivity) {
                        this.lastSpotifyOpenTime = Date.now(); // Update cache
                        return {
                            isPlaying: true,
                            isSpotifyOpen: true,
                            track: {
                                title: spotifyActivity.details || 'Unknown',
                                artist: spotifyActivity.state || 'Unknown',
                                album: spotifyActivity.assets?.large_text || '',
                                albumArtUrl: spotifyActivity.assets?.large_image ?
                                    `https://i.scdn.co/image/${spotifyActivity.assets.large_image.replace('spotify:', '')}` : null,
                                trackId: spotifyActivity.sync_id || null,
                                startTime: spotifyActivity.timestamps?.start,
                                endTime: spotifyActivity.timestamps?.end
                            }
                        };
                    }
                }
            }

            // Cache fallback: If we recently detected Spotify was open, keep showing controls
            // This only applies when "whenOpen" mode is enabled
            if (this.config.controlsVisibility === 'whenOpen' &&
                Date.now() - this.lastSpotifyOpenTime < this.SPOTIFY_OPEN_CACHE_MS) {
                return {
                    isPlaying: false,
                    isSpotifyOpen: true,
                    track: {
                        title: this.t('notPlaying'),
                        artist: '',
                        album: '',
                        albumArtUrl: null,
                        trackId: null
                    }
                };
            }

            return { isPlaying: false, isSpotifyOpen: false, track: null };
        } catch (e) {
            console.error("[SpotifySync] Error getting Spotify state:", e);
            return { isPlaying: false, isSpotifyOpen: false, track: null };
        }
    }

    startSpotifyDetection() {
        console.log("[SpotifySync] Starting Spotify detection for controls...");
        console.log("[SpotifySync] Visibility mode:", this.config.controlsVisibility);

        // Check every 2 seconds for control updates only
        this.spotifyStateInterval = setInterval(() => {
            const state = this.getSpotifyState();

            // For "whenOpen" mode: ALWAYS show controls (user explicitly wants them visible)
            // For "whenPlaying" mode: only show when actively playing
            if (this.config.controlsVisibility === 'whenOpen') {
                // Only show if Spotify is actually connected
                if (state.isSpotifyOpen) {
                    if (state.isPlaying && state.track) {
                        // Show current track info
                        this.updateControlsDisplay(state.track, true);
                    } else {
                        // Show "Not Playing" state with Play button
                        this.updateControlsDisplay({
                            title: this.t('notPlaying'),
                            artist: ''
                        }, false);
                    }
                } else {
                    // Spotify not connected - hide controls
                    this.updateControlsDisplay(null, false);
                }
            } else {
                // whenPlaying mode - only show when actively playing
                if (state.isPlaying && state.track) {
                    this.updateControlsDisplay(state.track, true);
                } else {
                    // Hide controls
                    this.updateControlsDisplay(null, false);
                }
            }
        }, 2000);
    }

    stopSpotifyDetection() {
        if (this.spotifyStateInterval) {
            clearInterval(this.spotifyStateInterval);
            this.spotifyStateInterval = null;
        }
    }

    // === Spotify Controls ===
    executeSpotifyControl(action) {
        console.log("[SpotifySync] Executing control:", action);

        try {
            // Get Spotify connection from Discord
            const SpotifyStore = BdApi.Webpack.getModule(m => m?.getActiveSocketAndDevice);

            if (!SpotifyStore) {
                console.warn("[SpotifySync] SpotifyStore not found");
                return false;
            }

            const socketDevice = SpotifyStore.getActiveSocketAndDevice();

            if (!socketDevice?.socket?.accessToken) {
                console.warn("[SpotifySync] No Spotify access token available");
                this.safeShowToast(this.t('tokenExpired'), { type: "error" });
                return false;
            }

            const accessToken = socketDevice.socket.accessToken;
            const deviceId = socketDevice.device?.id;

            console.log("[SpotifySync] Using token, device:", deviceId);

            // Use Spotify Web API directly
            const baseUrl = 'https://api.spotify.com/v1/me/player';
            const headers = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            };

            let endpoint = '';
            let method = 'PUT';

            switch (action) {
                case 'play':
                    endpoint = '/play';
                    break;
                case 'pause':
                case 'playpause':
                    const state = this.getSpotifyState();
                    endpoint = state.isPlaying ? '/pause' : '/play';
                    console.log("[SpotifySync] isPlaying:", state.isPlaying, "-> endpoint:", endpoint);
                    break;
                case 'next':
                    endpoint = '/next';
                    method = 'POST';
                    break;
                case 'previous':
                    endpoint = '/previous';
                    method = 'POST';
                    break;
            }

            const url = baseUrl + endpoint + (deviceId ? `?device_id=${deviceId}` : '');
            console.log("[SpotifySync] API call:", method, url);

            fetch(url, { method, headers })
                .then(response => {
                    if (response.ok || response.status === 204) {
                        console.log("[SpotifySync] API success!");
                        this.safeShowToast("Spotify: " + action, { type: "success" });
                    } else {
                        console.error("[SpotifySync] API error:", response.status);
                        response.text().then(t => console.error("[SpotifySync]", t));
                    }
                })
                .catch(err => console.error("[SpotifySync] Fetch error:", err));

            return true;
        } catch (e) {
            console.error("[SpotifySync] Control error:", e);
            return false;
        }
    }

    // === UI Controls Injection ===
    injectControls() {
        // Wait for Discord to fully load
        const inject = () => {
            // Debug: Log all elements with panels class to find the right one
            const allPanels = document.querySelectorAll('[class*="panels"]');
            console.log("[SpotifySync] Found panels elements:", allPanels.length);
            allPanels.forEach((el, i) => {
                console.log(`[SpotifySync] Panel ${i}:`, el.className);
            });

            // Try multiple selectors (Discord changes these often)
            const selectors = [
                // Look for the section containing the user profile area
                'section[class*="panels_"]',
                'div[class*="panels_"]',
                // Container within panels
                '[class*="panels_"] > [class*="container_"]',
                '[class*="panels_"] [class*="wrapper_"]',
                // The user area wrapper
                '[class*="accountProfilePopoutWrapper"]',
                '[class*="avatar_"][class*="wrapper_"]',
                // Voice connection container
                '[class*="connection_"]',
                // The bottom section
                '[class*="sidebar_"] section:last-child',
                // Generic bottom panel
                'nav[class*="guilds_"] ~ * section',
            ];

            let targetElement = null;
            for (const selector of selectors) {
                try {
                    targetElement = document.querySelector(selector);
                    if (targetElement) {
                        console.log("[SpotifySync] Found target with selector:", selector);
                        console.log("[SpotifySync] Target className:", targetElement.className);
                        break;
                    }
                } catch (e) {
                    console.log("[SpotifySync] Invalid selector:", selector);
                }
            }

            // Fallback: Find by looking for specific Discord structure
            if (!targetElement) {
                // Look for the user panel by finding the mute/deafen buttons area
                const muteButton = document.querySelector('button[aria-label*="Mute"], button[aria-label*="Silenciar"], button[aria-label*="mute"]');
                if (muteButton) {
                    // Go up the tree to find the panel container
                    targetElement = muteButton.closest('section') || muteButton.closest('[class*="panels"]');
                    if (targetElement) {
                        console.log("[SpotifySync] Found via mute button:", targetElement.className);
                    }
                }
            }

            // Another fallback: Look for voice connection area
            if (!targetElement) {
                const voiceArea = document.querySelector('[class*="rtcConnectionStatus"]');
                if (voiceArea) {
                    targetElement = voiceArea.closest('section') || voiceArea.closest('[class*="panels"]');
                    if (targetElement) {
                        console.log("[SpotifySync] Found via voice area:", targetElement.className);
                    }
                }
            }

            if (!targetElement) {
                console.log("[SpotifySync] Target element not found, retrying...");
                setTimeout(inject, 2000);
                return;
            }

            // Check if already injected
            if (document.getElementById('spotifysync-controls')) {
                console.log("[SpotifySync] Controls already exist");
                return;
            }

            // Create controls container
            this.controlsElement = document.createElement('div');
            this.controlsElement.id = 'spotifysync-controls';
            this.controlsElement.innerHTML = `
                <style>
                    #spotifysync-controls {
                        background: linear-gradient(135deg, #1DB954 0%, #191414 100%);
                        border-radius: 8px;
                        padding: 8px 12px;
                        margin: 8px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s ease;
                        min-height: 44px;
                    }
                    #spotifysync-controls.hidden { display: none; }
                    #spotifysync-controls .track-info {
                        flex: 1;
                        min-width: 0;
                        overflow: hidden;
                    }
                    #spotifysync-controls .track-title {
                        font-size: 12px;
                        font-weight: 600;
                        color: #fff;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    #spotifysync-controls .track-artist {
                        font-size: 10px;
                        color: rgba(255,255,255,0.7);
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    #spotifysync-controls .controls {
                        display: flex;
                        gap: 4px;
                    }
                    #spotifysync-controls .control-btn {
                        background: rgba(255,255,255,0.1);
                        border: none;
                        color: #fff;
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                        font-size: 14px;
                    }
                    #spotifysync-controls .control-btn:hover {
                        background: rgba(255,255,255,0.25);
                        transform: scale(1.1);
                    }
                    #spotifysync-controls .control-btn.play-pause {
                        width: 32px;
                        height: 32px;
                        background: #1DB954;
                    }
                    #spotifysync-controls .control-btn.play-pause:hover {
                        background: #1ed760;
                    }
                    #spotifysync-controls .spotify-icon {
                        width: 20px;
                        height: 20px;
                    }
                </style>
                <svg class="spotify-icon" viewBox="0 0 24 24" fill="#1DB954">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                <div class="track-info">
                    <div class="track-title" id="spotifysync-title">${this.t('notPlaying')}</div>
                    <div class="track-artist" id="spotifysync-artist"></div>
                </div>
                <div class="controls">
                    <button class="control-btn" id="spotifysync-prev" title="${this.t('previous')}">⏮</button>
                    <button class="control-btn play-pause" id="spotifysync-playpause" title="${this.t('playPause')}">⏸</button>
                    <button class="control-btn" id="spotifysync-next" title="${this.t('next')}">⏭</button>
                </div>
            `;

            // Try to insert at the beginning of the target element
            try {
                targetElement.insertBefore(this.controlsElement, targetElement.firstChild);
                console.log("[SpotifySync] Controls injected at beginning of target");
            } catch (e) {
                // Fallback: insert before target element
                try {
                    targetElement.parentElement.insertBefore(this.controlsElement, targetElement);
                    console.log("[SpotifySync] Controls injected before target");
                } catch (e2) {
                    console.error("[SpotifySync] Failed to inject controls:", e2);
                    return;
                }
            }

            // Add event listeners
            document.getElementById('spotifysync-prev')?.addEventListener('click', () => {
                this.executeSpotifyControl('previous');
                this.send({ type: 'spotify_control_clicked', action: 'previous' });
            });
            document.getElementById('spotifysync-playpause')?.addEventListener('click', () => {
                this.executeSpotifyControl('pause');
                this.send({ type: 'spotify_control_clicked', action: 'playpause' });
            });
            document.getElementById('spotifysync-next')?.addEventListener('click', () => {
                this.executeSpotifyControl('next');
                this.send({ type: 'spotify_control_clicked', action: 'next' });
            });

            console.log("[SpotifySync] Controls injected successfully!");

            // Update with current state using visibility logic
            const state = this.getSpotifyState();
            if (this.config.controlsVisibility === 'whenOpen') {
                // Only show in whenOpen mode if Spotify is connected
                if (state.isSpotifyOpen) {
                    if (state.isPlaying && state.track) {
                        this.updateControlsDisplay(state.track, true);
                    } else {
                        this.updateControlsDisplay({ title: this.t('notPlaying'), artist: '' }, false);
                    }
                } else {
                    this.updateControlsDisplay(null, false);
                }
            } else {
                // whenPlaying mode
                if (state.isPlaying && state.track) {
                    this.updateControlsDisplay(state.track, true);
                } else {
                    this.updateControlsDisplay(null, false);
                }
            }
        };

        // Initial inject with delay
        setTimeout(inject, 3000);

        // Set up re-injection interval to handle Discord re-renders
        if (this.controlsReinjectInterval) {
            clearInterval(this.controlsReinjectInterval);
        }
        this.controlsReinjectInterval = setInterval(() => {
            // Check if controls still exist
            if (!document.getElementById('spotifysync-controls')) {
                console.log("[SpotifySync] Controls removed by Discord, re-injecting...");
                this.controlsElement = null;
                inject();
            }
        }, 2000);
    }

    updateControlsDisplay(track, isPlaying = false) {
        const titleEl = document.getElementById('spotifysync-title');
        const artistEl = document.getElementById('spotifysync-artist');
        const controlsEl = document.getElementById('spotifysync-controls');
        const playPauseBtn = document.getElementById('spotifysync-playpause');

        if (!titleEl || !artistEl || !controlsEl) return;

        if (track && track.title) {
            // Show controls with track info
            titleEl.textContent = track.title;
            artistEl.textContent = track.artist || '';
            controlsEl.classList.remove('hidden');
            controlsEl.style.display = 'flex';
            if (playPauseBtn) playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
        } else {
            // Hide controls
            controlsEl.classList.add('hidden');
            controlsEl.style.display = 'none';
            titleEl.textContent = '';
            artistEl.textContent = '';
        }
    }

    removeControls() {
        // Clear the re-injection interval
        if (this.controlsReinjectInterval) {
            clearInterval(this.controlsReinjectInterval);
            this.controlsReinjectInterval = null;
        }

        if (this.controlsElement) {
            this.controlsElement.remove();
            this.controlsElement = null;
        }
        const existing = document.getElementById('spotifysync-controls');
        if (existing) existing.remove();
    }

    // === Settings Panel ===
    getSettingsPanel() {
        const panel = document.createElement("div");
        panel.style.cssText = "padding: 20px; font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px;";

        const renderPanel = () => {
            panel.innerHTML = `
                <style>
                    .spotifysync-card {
                        background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%);
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 10px;
                        padding: 14px 18px;
                        margin-bottom: 12px;
                    }
                    .spotifysync-toggle {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 12px 0;
                    }
                    .spotifysync-switch {
                        width: 44px;
                        height: 24px;
                        background: rgba(255,255,255,0.15);
                        border-radius: 12px;
                        position: relative;
                        cursor: pointer;
                        transition: all 0.3s;
                    }
                    .spotifysync-switch.active { background: #1DB954; }
                    .spotifysync-switch::after {
                        content: '';
                        position: absolute;
                        width: 20px;
                        height: 20px;
                        background: #fff;
                        border-radius: 50%;
                        top: 2px;
                        left: 2px;
                        transition: all 0.3s;
                    }
                    .spotifysync-switch.active::after { left: 22px; }
                    .lang-select { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; padding: 6px 10px; }
                </style>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #fff; margin: 0; display: flex; align-items: center; gap: 10px;">
                        <span style="color: #1DB954;">🎵</span> ${this.t('title')}
                    </h2>
                    <select id="lang-select" class="lang-select">
                        <option value="en" ${this.config.language === 'en' ? 'selected' : ''}>English</option>
                        <option value="pt-BR" ${this.config.language === 'pt-BR' ? 'selected' : ''}>Português</option>
                    </select>
                </div>

                <div class="spotifysync-card" style="border-color: ${this.isConnectedToSolari ? 'rgba(29,185,84,0.4)' : 'rgba(239,68,68,0.4)'};">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${this.isConnectedToSolari ? '#1DB954' : '#ef4444'};"></div>
                        <span style="color: rgba(255,255,255,0.6); font-size: 0.85em;">${this.t('solari')}:</span>
                        <span style="color: ${this.isConnectedToSolari ? '#1DB954' : '#ef4444'}; font-weight: 600;">
                            ${this.isConnectedToSolari ? this.t('connected') : this.t('disconnected')}
                        </span>
                    </div>
                </div>

                <div class="spotifysync-card">
                    <div class="spotifysync-toggle">
                        <span style="color: #fff;">${this.t('showControls')}</span>
                        <div class="spotifysync-switch ${this.config.showControls ? 'active' : ''}" id="toggle-controls"></div>
                    </div>
                </div>

                ${this.config.showControls ? `
                <div class="spotifysync-card">
                    <div style="margin-bottom: 8px; color: rgba(255,255,255,0.8); font-size: 0.9em;">${this.t('controlsVisibility')}</div>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <label style="display: flex; align-items: flex-start; gap: 8px; cursor: pointer; color: #fff;">
                            <input type="radio" name="visibility" value="whenOpen" ${this.config.controlsVisibility === 'whenOpen' ? 'checked' : ''} style="accent-color: #1DB954; margin-top: 3px;" />
                            <div>
                                <div>${this.t('whenOpen')}</div>
                                <div style="font-size: 0.8em; color: rgba(255,255,255,0.5);">${this.t('whenOpenHint')}</div>
                                <div style="font-size: 0.75em; color: #f59e0b; margin-top: 2px;">${this.t('whenOpenWarning')}</div>
                            </div>
                        </label>
                        <label style="display: flex; align-items: flex-start; gap: 8px; cursor: pointer; color: #fff;">
                            <input type="radio" name="visibility" value="whenPlaying" ${this.config.controlsVisibility === 'whenPlaying' ? 'checked' : ''} style="accent-color: #1DB954; margin-top: 3px;" />
                            <div>
                                <div>${this.t('whenPlaying')}</div>
                                <div style="font-size: 0.8em; color: rgba(255,255,255,0.5);">${this.t('whenPlayingHint')}</div>
                            </div>
                        </label>
                    </div>
                </div>
                ` : ''}

                ${this.currentTrack ? `
                    <div class="spotifysync-card" style="border-color: rgba(29,185,84,0.4);">
                        <div style="color: rgba(255,255,255,0.5); font-size: 0.75em; margin-bottom: 8px;">${this.t('nowPlaying')}</div>
                        <div style="color: #fff; font-weight: 600;">${this.currentTrack.title}</div>
                        <div style="color: rgba(255,255,255,0.7); font-size: 0.9em;">${this.currentTrack.artist}</div>
                    </div>
                ` : ''}
            `;

            // Event listeners

            panel.querySelector('#toggle-controls').addEventListener('click', () => {
                this.config.showControls = !this.config.showControls;
                this.saveConfig();
                if (this.config.showControls) {
                    this.injectControls();
                } else {
                    this.removeControls();
                }
                renderPanel();
            });

            panel.querySelector('#lang-select').addEventListener('change', (e) => {
                this.config.language = e.target.value;
                this.saveConfig();
                renderPanel();
            });

            // Visibility radio buttons
            panel.querySelectorAll('input[name="visibility"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    this.config.controlsVisibility = e.target.value;
                    this.saveConfig();
                    // Update controls display based on new setting
                    const state = this.getSpotifyState();
                    this.updateControlsDisplay(state.isPlaying ? state.track : null);
                });
            });
        };

        renderPanel();
        return panel;
    }
};

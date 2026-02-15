/**
 * @name SpotifySync
 * @author TheDroid
 * @authorLink https://solarirpc.com
 * @description Premium Spotify controller for Discord. Album art, progress bar with seek, like/unlike, volume, shuffle, repeat — all from Discord. Integrates with Solari RPC.
 * @version 2.0.0
 * @source https://github.com/TheDroidBR/Solari
 * @website https://solarirpc.com
 * @updateUrl https://raw.githubusercontent.com/TheDroidBR/Solari/main/plugins/SpotifySync.plugin.js
 */

module.exports = class SpotifySync {

    // ═══════════════════ TRANSLATIONS ═══════════════════
    static translations = {
        en: {
            title: 'SpotifySync Settings', solari: 'Solari', connected: 'Connected', disconnected: 'Disconnected',
            nowPlaying: 'Now Playing', notPlaying: 'Not Playing', showControls: 'Show Player Widget',
            language: 'Language', connectedToSolari: 'Connected to Solari', disconnectedFromSolari: 'Disconnected from Solari',
            spotifySynced: 'SpotifySync: Connected to Solari!', previous: 'Previous', playPause: 'Play/Pause', next: 'Next',
            controlsVisibility: 'Widget Visibility', whenOpen: 'Always Show',
            whenOpenHint: 'Widget stays visible even when Spotify is closed', whenPlaying: 'Only show when playing music',
            whenPlayingHint: 'Hides when music is paused', tokenExpired: 'Session expired! Play a song to restore.',
            shuffle: 'Shuffle', repeat: 'Repeat', repeatOff: 'Repeat Off', repeatAll: 'Repeat All', repeatOne: 'Repeat One',
            like: 'Save to Liked Songs', unlike: 'Remove from Liked Songs', liked: 'Saved!', unliked: 'Removed',
            volume: 'Volume', showAlbumArt: 'Album Art', showProgressBar: 'Progress Bar',
            showLikeButton: 'Like Button', showVolumeSlider: 'Volume Slider', showShuffleRepeat: 'Shuffle & Repeat',
            openInSpotify: 'Open in Spotify', by: 'by', on: 'on',
            share: 'Share in Chat', shareCopied: 'Link copied!', copyTrackUrl: 'Copy Song Link',
            copyArtistUrl: 'Copy Artist Link', copyAlbumUrl: 'Copy Album Link', copied: 'Copied!',
            // Premium Auth
            premiumTitle: 'Premium Connection',
            premiumHelp: 'Connect your Spotify account to enable Like, Seek, Volume, and Playlist management. This requires a one-time setup.',
            step1: '1. Create App', step1Help: 'Go to developer.spotify.com, create an app, and copy the Client ID.',
            step2: '2. Config App', step2Help: 'In your Spotify App settings, add this exact Redirect URI:',
            step3: '3. Authorize', step3Help: 'Click the button below to open the Spotify login page.',
            step4: '4. Finish', step4Help: 'After logging in, you will see a "Connection Refused" error page. Copy the URL from your browser address bar and paste it below.',
            clientId: 'Client ID',
            authorize: 'Authorize in Browser',
            pasteUrl: 'Paste Redirect URL',
            connect: 'Connect Account', connectedAs: 'Connected', status: 'Status', howTo: 'Guide',
            redirectUri: 'Redirect URI',
            recommended: 'Recommended', contextq: 'From Context'
        },
        'pt-BR': {
            title: 'SpotifySync Configurações', solari: 'Solari', connected: 'Conectado', disconnected: 'Desconectado',
            nowPlaying: 'Tocando Agora', notPlaying: 'Não Tocando', showControls: 'Mostrar Player',
            language: 'Idioma', connectedToSolari: 'Conectado ao Solari', disconnectedFromSolari: 'Desconectado do Solari',
            spotifySynced: 'SpotifySync: Conectado ao Solari!', previous: 'Anterior', playPause: 'Play/Pause', next: 'Próxima',
            controlsVisibility: 'Visibilidade do Widget', whenOpen: 'Sempre mostrar',
            whenOpenHint: 'Widget visível mesmo com Spotify fechado', whenPlaying: 'Mostrar apenas quando tocando',
            whenPlayingHint: 'Oculta quando pausado', tokenExpired: 'Sessão expirada! Toque uma música para restaurar.',
            shuffle: 'Aleatório', repeat: 'Repetir', repeatOff: 'Repetir Desligado', repeatAll: 'Repetir Todas', repeatOne: 'Repetir Uma',
            like: 'Salvar nas Curtidas', unlike: 'Remover das Curtidas', liked: 'Salvo!', unliked: 'Removido',
            volume: 'Volume', showAlbumArt: 'Capa do Álbum', showProgressBar: 'Barra de Progresso',
            showLikeButton: 'Botão de Curtir', showVolumeSlider: 'Controle de Volume', showShuffleRepeat: 'Aleatório e Repetir',
            openInSpotify: 'Abrir no Spotify', by: 'por', on: 'em',
            share: 'Compartilhar no Chat', shareCopied: 'Link copiado!', copyTrackUrl: 'Copiar Link da Música',
            copyArtistUrl: 'Copiar Link do Artista', copyAlbumUrl: 'Copiar Link do Álbum', copied: 'Copiado!',
            // Premium Auth
            premiumTitle: 'Conexão Premium',
            premiumHelp: 'Conecte sua conta Spotify para habilitar Curtir, Volume, Seek e Playlists. Configuração única necessária.',
            step1: '1. Criar App', step1Help: 'Vá em developer.spotify.com, crie um app e copie o Client ID.',
            step2: '2. Configurar App', step2Help: 'Nas configurações do seu App no Spotify, adicione exatamente esta Redirect URI:',
            step3: '3. Autorizar', step3Help: 'Clique no botão abaixo para abrir o login do Spotify.',
            step4: '4. Finalizar', step4Help: 'Após logar, você verá uma página de "Conexão Recusada". Copie a URL inteira do navegador e cole abaixo.',
            clientId: 'Client ID',
            authorize: 'Autorizar no Navegador',
            pasteUrl: 'Cole a URL de Redirecionamento',
            connect: 'Conectar Conta', connectedAs: 'Conectado', status: 'Status', howTo: 'Guia',
            redirectUri: 'Redirect URI',
            recommended: 'Recomendado', contextq: 'Do Contexto'
        },
        es: {
            title: 'SpotifySync Configuración', solari: 'Solari', connected: 'Conectado', disconnected: 'Desconectado',
            nowPlaying: 'Reproduciendo', notPlaying: 'Sin Reproducir', showControls: 'Mostrar Reproductor',
            language: 'Idioma', connectedToSolari: 'Conectado a Solari', disconnectedFromSolari: 'Desconectado de Solari',
            spotifySynced: 'SpotifySync: ¡Conectado a Solari!', previous: 'Anterior', playPause: 'Play/Pausa', next: 'Siguiente',
            controlsVisibility: 'Visibilidad del Widget', whenOpen: 'Siempre mostrar',
            whenOpenHint: 'Widget visible incluso con Spotify cerrado', whenPlaying: 'Solo mostrar cuando hay música',
            whenPlayingHint: 'Se oculta cuando está en pausa', tokenExpired: '¡Sesión expirada! Reproduce una canción para restaurar.',
            shuffle: 'Aleatorio', repeat: 'Repetir', repeatOff: 'Repetir Desactivado', repeatAll: 'Repetir Todo', repeatOne: 'Repetir Una',
            like: 'Guardar en Favoritos', unlike: 'Quitar de Favoritos', liked: '¡Guardado!', unliked: 'Eliminado',
            volume: 'Volumen', showAlbumArt: 'Carátula', showProgressBar: 'Barra de Progreso',
            showLikeButton: 'Botón Me Gusta', showVolumeSlider: 'Control de Volumen', showShuffleRepeat: 'Aleatorio y Repetir',
            openInSpotify: 'Abrir en Spotify', by: 'por', on: 'en',
            share: 'Compartir en Chat', shareCopied: '¡Enlace copiado!', copyTrackUrl: 'Copiar Enlace de Canción',
            copyArtistUrl: 'Copiar Enlace del Artista', copyAlbumUrl: 'Copiar Enlace del Álbum', copied: '¡Copiado!',
            // Premium Auth
            premiumTitle: 'Conexión Premium',
            premiumHelp: 'Conecta tu cuenta Spotify para habilitar Me Gusta, Volumen, Seek y Listas. Requiere configuración única.',
            step1: '1. Crear App', step1Help: 'Ve a developer.spotify.com, crea una app y copia el Client ID.',
            step2: '2. Configurar App', step2Help: 'En la configuración de tu App en Spotify, añade esta Redirect URI exacta:',
            step3: '3. Autorizar', step3Help: 'Haz clic abajo para abrir el login de Spotify.',
            step4: '4. Finalizar', step4Help: 'Tras loguearte, verás una página de error. Copia la URL completa del navegador y pégala abajo.',
            clientId: 'Client ID',
            authorize: 'Autorizar en Navegador',
            pasteUrl: 'Pegar URL de Redirección',
            connect: 'Conectar Cuenta', connectedAs: 'Conectado', status: 'Estado', howTo: 'Guía',
            redirectUri: 'Redirect URI',
            recommended: 'Recomendado', contextq: 'Del Contexto'
        }
    };

    // ═══════════════════ CONSTRUCTOR ═══════════════════
    constructor(meta) {
        this.meta = meta;
        this.ws = null;
        this.shouldReconnect = false;
        this.isConnectedToSolari = false;
        this.spotifyStateInterval = null;
        this.progressInterval = null;
        this.widgetElement = null;
        this.reinjectInterval = null;
        this.lastSpotifyOpenTime = 0;
        this.SPOTIFY_OPEN_CACHE_MS = 3600000;
        // Playback state cache
        this._trackId = null;
        this._positionMs = 0;
        this._durationMs = 0;
        this._positionTimestamp = 0;
        this._isPlaying = false;
        this._isLiked = false;
        this._likeCheckPending = false;
        this._shuffleState = false;
        this._repeatState = 'off'; // off, context, track
        this._volumePercent = 100;
        this._lastFullStateTime = 0;
        this._albumArtUrl = null;
        this._expanded = false;
        this._artistIds = []; // [{name, id}] for context menu
        this._albumId = null;

        this.config = {
            enabled: true,
            showControls: true,
            showAlbumArt: true,
            showProgressBar: true,
            showLikeButton: true, // Only visible if Premium is active
            showVolumeSlider: true,
            showShuffleRepeat: true,
            controlsVisibility: 'whenPlaying',
            language: 'pt-BR',
            serverUrl: 'ws://localhost:6464',
            // Premium Auth
            spotifyClientId: '',
            spotifyAccessToken: '',
            spotifyRefreshToken: '',
            spotifyTokenExpiry: 0,
            spotifyVerifier: '',
            _userDisplayName: ''
        };
        this.lastControlTime = 0;
        this.REDIRECT_URI = 'http://127.0.0.1:8888/callback'; // Fixed URI for Solari
    }

    // ═══════════════════ SETTINGS SCHEMA ═══════════════════
    getSettingsSchema() {
        const premiumStatus = this.hasPremium() ? 'connected' : 'disconnected';
        return [
            { type: 'custom_header', title: this.t('title'), version: 'v2.0.0' },
            { type: 'status_card', id: 'solariStatus', label: this.t('solari'), status: this.isConnectedToSolari ? 'connected' : 'disconnected' },

            {
                type: 'group', label: 'Display Options', children: [
                    { type: 'toggle', key: 'showControls', label: this.t('showControls') },
                    { type: 'toggle', key: 'showAlbumArt', label: this.t('showAlbumArt') },
                    { type: 'toggle', key: 'showProgressBar', label: this.t('showProgressBar') },
                    { type: 'toggle', key: 'showLikeButton', label: this.t('showLikeButton') },
                    { type: 'toggle', key: 'showShuffleRepeat', label: this.t('showShuffleRepeat') },
                    { type: 'toggle', key: 'showVolumeSlider', label: this.t('showVolumeSlider') },
                    {
                        type: 'select', key: 'controlsVisibility', label: this.t('controlsVisibility'), options: [
                            { value: 'whenOpen', label: this.t('whenOpen'), hint: this.t('whenOpenHint') },
                            { value: 'whenPlaying', label: this.t('whenPlaying'), hint: this.t('whenPlayingHint') }
                        ]
                    }
                ]
            },

            {
                type: 'section_card',
                title: this.t('premiumTitle'),
                status: premiumStatus,
                statusLabel: premiumStatus === 'connected' ? this.t('connected') : this.t('disconnected'),
                description: this.t('premiumHelp'),
                children: [
                    {
                        type: 'step_card',
                        step: 1,
                        title: this.t('step1'),
                        text: this.t('step1Help'),
                        inputConfig: {
                            key: 'spotifyClientId',
                            value: this.config.spotifyClientId || '',
                            editable: true,
                            secret: true,
                            placeholder: 'Paste your Client ID here',
                            label: this.t('clientId')
                        }
                    },
                    {
                        type: 'step_card',
                        step: 2,
                        title: this.t('step2'),
                        text: this.t('step2Help'),
                        copyValue: this.config.spotifyRedirectUri || 'http://127.0.0.1:8888/callback',
                        copyLabel: this.t('redirectUri')
                    },
                    {
                        type: 'step_card',
                        step: 3,
                        title: this.t('step3'),
                        text: this.t('step3Help'),
                        action: { label: this.t('authorize'), id: 'authBtn', action: 'start_auth', style: 'spotify' }
                    },
                    {
                        type: 'step_card',
                        step: 4,
                        title: this.t('step4'),
                        text: this.t('step4Help'),
                        input: {
                            placeholder: this.t('pasteUrl'),
                            id: 'finishAuthBtn',
                            action: 'finish_auth',
                            btnLabel: this.t('connect')
                        }
                    }
                ]
            }
        ];
    }

    // ═══════════════════ HELPERS ═══════════════════
    saveConfig() {
        try {
            BdApi.Data.save('SpotifySync', 'config', this.config);
            // Sync with Solari if connected
            if (this.isConnectedToSolari) {
                this.send({ type: 'spotify_config', config: this.config, schema: this.getSettingsSchema() });
            }
        } catch (e) { console.error('[SpotifySync] Save config error:', e); }
    }
    t(key) { const l = this.config.language || 'en'; return SpotifySync.translations[l]?.[key] || SpotifySync.translations['en'][key] || key; }

    // ═══════════════════ PREMIUM AUTH ═══════════════════
    async generatePKCE() {
        const verifier = this.base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const hash = await crypto.subtle.digest('SHA-256', data);
        const challenge = this.base64UrlEncode(new Uint8Array(hash));
        return { verifier, challenge };
    }

    base64UrlEncode(a) {
        let str = "";
        const bytes = a instanceof Uint8Array ? a : new Uint8Array(a);
        for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
        return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    async startPremiumAuth() {
        if (!this.config.spotifyClientId) {
            this.safeShowToast('Please enter a Client ID first!', { type: 'error' });
            return;
        }

        // Enforce Redirect URI - REMOVED override to allow custom URI
        if (!this.config.spotifyRedirectUri) this.config.spotifyRedirectUri = this.REDIRECT_URI;
        this.saveConfig();

        if (!this.config.spotifyRedirectUri) {
            this.safeShowToast('Please enter a Redirect URI first!', { type: 'error' });
            return;
        }

        const { verifier, challenge } = await this.generatePKCE();
        this.config.spotifyVerifier = verifier;
        this.saveConfig();

        const scope = 'user-read-playback-state user-modify-playback-state user-read-currently-playing app-remote-control streaming user-library-read user-library-modify playlist-read-private playlist-read-collaborative';
        const url = `https://accounts.spotify.com/api/token?client_id=${this.config.spotifyClientId}&response_type=code&redirect_uri=${encodeURIComponent(this.config.spotifyRedirectUri)}&code_challenge_method=S256&code_challenge=${challenge}&scope=${encodeURIComponent(scope)}`;
        // Note: Authorize endpoint uses GET, not POST for the initial code request.
        // Correction: The URL construction above is for the Browser Redirect, so it should be the authorize endpoint.
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${this.config.spotifyClientId}&response_type=code&redirect_uri=${encodeURIComponent(this.config.spotifyRedirectUri)}&code_challenge_method=S256&code_challenge=${challenge}&scope=${encodeURIComponent(scope)}`;

        window.open(authUrl, '_blank');
    }

    async fetchUserProfile() {
        const data = await this.spotifyApi('/me', 'GET', null, false);
        if (data && data.display_name) {
            this.config._userDisplayName = data.display_name;
            this.saveConfig();
        }
    }

    async finishPremiumAuth(urlOrCode) {
        let code = urlOrCode;
        if (urlOrCode.includes('?')) {
            const match = urlOrCode.match(/code=([^&]*)/);
            if (match) code = match[1];
        }
        if (!code) return this.safeShowToast('Invalid code/URL', { type: 'error' });

        try {
            const body = new URLSearchParams({
                client_id: this.config.spotifyClientId,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: this.config.spotifyRedirectUri,
                code_verifier: this.config.spotifyVerifier
            });

            const res = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error_description || data.error);

            this.config.spotifyAccessToken = data.access_token;
            if (data.refresh_token) this.config.spotifyRefreshToken = data.refresh_token;
            this.config.spotifyTokenExpiry = Date.now() + (data.expires_in * 1000);
            this.config.spotifyVerifier = ''; // clear
            this.saveConfig();

            this.safeShowToast('Premium Connected! 🎵', { type: 'success' });
            await this.fetchUserProfile();
            this.fetchFullPlayerState(); // Refresh UI with real data
        } catch (e) {
            console.error('[SpotifySync] Auth Error:', e);
            this.safeShowToast('Auth Failed: ' + e.message, { type: 'error' });
        }
    }

    async refreshPremiumToken() {
        if (!this.config.spotifyRefreshToken) return false;
        try {
            const body = new URLSearchParams({
                client_id: this.config.spotifyClientId,
                grant_type: 'refresh_token',
                refresh_token: this.config.spotifyRefreshToken
            });

            const res = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body
            });
            const data = await res.json();

            if (data.error) {
                if (data.error === 'invalid_grant' || data.error_description === 'Revoked') {
                    console.error('[SpotifySync] Token revoked/invalid. Clearing Premium config.');
                    this.config.spotifyAccessToken = '';
                    this.config.spotifyRefreshToken = '';
                    this.config.spotifyTokenExpiry = 0;
                    this.saveConfig();
                    this.safeShowToast('Premium Token Expired. Please reconnect.', { type: 'error' });
                }
                throw new Error(data.error);
            }

            this.config.spotifyAccessToken = data.access_token;
            if (data.refresh_token) this.config.spotifyRefreshToken = data.refresh_token; // Sometimes updated
            this.config.spotifyTokenExpiry = Date.now() + (data.expires_in * 1000);
            if (!this.config._userDisplayName) this.fetchUserProfile();
            this.saveConfig();
            return true;
        } catch (e) {
            console.error('[SpotifySync] Refresh Error:', e);
            return false;
        }
    }

    hasPremium() {
        return !!this.config.spotifyRefreshToken;
    }


    formatTime(ms) {
        if (!ms || ms < 0) return '0:00';
        const s = Math.floor(ms / 1000);
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }

    copyToClipboard(text) {
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
        }
        this.safeShowToast(this.t('copied'), { type: 'success' });
    }

    sendToChat(text) {
        // Insert Spotify link into Discord's chat input
        try {
            const ComponentDispatch = BdApi.Webpack.getModule(m => m.dispatchToLastSubscribed && m.emitter, { first: true });
            if (ComponentDispatch) {
                ComponentDispatch.dispatchToLastSubscribed('INSERT_TEXT', { plainText: text });
            } else {
                // Fallback: copy to clipboard
                this.copyToClipboard(text);
                this.safeShowToast(this.t('shareCopied'), { type: 'info' });
            }
        } catch {
            this.copyToClipboard(text);
            this.safeShowToast(this.t('shareCopied'), { type: 'info' });
        }
    }

    safeShowToast(message, options = {}) {
        try {
            if (typeof BdApi.showToast === 'function') BdApi.showToast(message, options);
            else if (BdApi.UI?.showToast) BdApi.UI.showToast(message, options);
        } catch (e) { console.error('[SpotifySync] Toast error:', e); }
    }

    loadConfig() {
        try {
            const saved = BdApi.Data.load('SpotifySync', 'config');
            if (saved) this.config = { ...this.config, ...saved };
        } catch (e) { console.error('[SpotifySync] Load config error:', e); }
    }



    // ═══════════════════ LIFECYCLE ═══════════════════
    start() {
        console.log('[SpotifySync] v2.0.0 Starting...');
        this.loadConfig();
        this.connectToServer();
        this.startDetection();
        if (this.config.showControls) this.injectWidget();
    }

    stop() {
        console.log('[SpotifySync] Stopping...');
        this.shouldReconnect = false;
        this.stopDetection();
        if (this.ws) this.ws.close();
        this.removeWidget();
    }

    // ═══════════════════ WEBSOCKET ═══════════════════
    connectToServer() {
        try {
            this.shouldReconnect = true;
            this.ws = new WebSocket(this.config.serverUrl);
            this.ws.onopen = () => {
                this.isConnectedToSolari = true;
                console.log('[SpotifySync] Connected to Solari server');
                this.safeShowToast(this.t('spotifySynced'), { type: 'success' });
                // Send actual config on connect to sync UI
                this.send({ type: 'spotify_config', config: this.config, schema: this.getSettingsSchema() });
                this.send({ type: 'handshake', source: 'SpotifySync' });
                // Send config immediately and again after a short delay to ensure Renderer is ready
                const sendConfig = () => this.send({ type: 'spotify-config-updated', config: this.config, schema: this.getSettingsSchema() });
                sendConfig();
                setTimeout(sendConfig, 1000);
            };
            this.ws.onmessage = (e) => this.handleMessage(JSON.parse(e.data));
            this.ws.onclose = () => {
                this.isConnectedToSolari = false;
                if (this.shouldReconnect) setTimeout(() => this.connectToServer(), 5000);
            };
            this.ws.onerror = () => { };
        } catch (e) { console.error('[SpotifySync] WS error:', e); }
    }

    send(data) { if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(data)); }

    handleMessage(data) {
        if (data.type === 'update_spotify_settings' || data.type === 'spotify_sync_settings_update') {
            this.config = { ...this.config, ...data.settings };
            this.saveConfig();
            if (this.config.showControls && !this.widgetElement) this.injectWidget();
            else if (!this.config.showControls && this.widgetElement) this.removeWidget();
            else if (this.widgetElement) {
                // Force instant update of visibility (e.g. album art, buttons)
                const state = this.getSpotifyState();
                this.updateWidget(state.track, state.isPlaying);
            }
            // Fully report config back to renderer so it can update its UI (including account name/status)
            this.send({ type: 'spotify_config', config: this.config, schema: this.getSettingsSchema() });
        } else if (data.type === 'set_language') {
            if (data.language && SpotifySync.translations[data.language]) {
                this.config.language = data.language;
                this.saveConfig();
            }
        } else if (data.type === 'spotify_control') {
            this.executeControl(data.action);
        } else if (data.type === 'start_spotify_auth') {
            this.startPremiumAuth();
        } else if (data.type === 'finish_spotify_auth') {
            this.finishPremiumAuth(data.code);
        }
    }

    // ═══════════════════ SPOTIFY STATE DETECTION ═══════════════════
    async getAccessToken(ignorePremium = false) {
        // 1. Premium Token (unless ignored)
        if (!ignorePremium && this.config.spotifyAccessToken && this.config.spotifyRefreshToken) {
            if (Date.now() > this.config.spotifyTokenExpiry - 60000) { // Refresh if < 1m left
                await this.refreshPremiumToken();
            }
            if (this.config.spotifyAccessToken) return this.config.spotifyAccessToken;
        }

        // 2. Discord Token Fallback
        try {
            const store = BdApi.Webpack.getModule(m => m?.getActiveSocketAndDevice);
            if (store) {
                const sd = store.getActiveSocketAndDevice();
                if (sd?.socket?.accountId) {
                    this.accountId = sd.socket.accountId;
                    return sd.socket.accessToken;
                }
            }
            const accountStore = BdApi.Webpack.getModule(m => m?.getAccounts);
            if (accountStore) {
                const accounts = accountStore.getAccounts();
                for (const id in accounts) {
                    if (accounts[id].type === 'spotify') {
                        this.accountId = id;
                        return accounts[id].accessToken;
                    }
                }
            }
            return null;
        } catch { return null; }
    }

    getDeviceId() {
        try {
            const store = BdApi.Webpack.getModule(m => m?.getActiveSocketAndDevice);
            if (!store) return null;
            const sd = store.getActiveSocketAndDevice();
            return sd?.device?.id || null;
        } catch { return null; }
    }

    getSpotifyState() {
        try {
            // Method 0: Direct SpotifyStore
            const SpotifyStore = BdApi.Webpack.getModule(m => m.getTrack && m.getPlaybackState);
            if (SpotifyStore) {
                const track = SpotifyStore.getTrack?.();
                const pb = SpotifyStore.getPlaybackState?.();
                if (track) {
                    this.lastSpotifyOpenTime = Date.now();
                    const art = track.album?.image?.url || track.album?.images?.[0]?.url || null;
                    // Cache artist/album IDs for context menu
                    this._artistIds = (track.artists || []).map(a => ({ name: a.name, id: a.id }));
                    this._albumId = track.album?.id || null;
                    return {
                        isPlaying: pb?.isPlaying === true, isSpotifyOpen: true,
                        track: {
                            title: track.name || 'Unknown', artist: track.artists?.map(a => a.name).join(', ') || 'Unknown',
                            album: track.album?.name || '', albumArtUrl: art, trackId: track.id || null,
                            duration: track.duration || 0, position: pb?.position || 0,
                            _config: this.config
                        }
                    };
                }
                // Check socket for open-but-paused
                const socket = BdApi.Webpack.getModule(m => m.getActiveSocketAndDevice);
                if (socket?.getActiveSocketAndDevice()?.socket) {
                    this.lastSpotifyOpenTime = Date.now();
                    return {
                        isPlaying: false, isSpotifyOpen: true, track: {
                            title: this.t('notPlaying'), artist: '', album: '', albumArtUrl: null, trackId: null, duration: 0, position: 0,
                            _config: this.config
                        }
                    };
                }
            }

            // Method 1: SpotifyActivityStore
            const ActivityStore = BdApi.Webpack.getModule(m => m.getActivity && m.getName?.() === 'SpotifyStore');
            if (ActivityStore) {
                const act = ActivityStore.getActivity();
                if (act?.type === 2) {
                    this.lastSpotifyOpenTime = Date.now();
                    const art = act.assets?.large_image ? `https://i.scdn.co/image/${act.assets.large_image.replace('spotify:', '')}` : null;
                    return {
                        isPlaying: true, isSpotifyOpen: true,
                        track: {
                            title: act.details || 'Unknown', artist: act.state || 'Unknown', album: act.assets?.large_text || '',
                            albumArtUrl: art, trackId: act.sync_id || null,
                            duration: act.timestamps?.end && act.timestamps?.start ? act.timestamps.end - act.timestamps.start : 0,
                            position: act.timestamps?.start ? Date.now() - act.timestamps.start : 0
                        }
                    };
                }
            }

            // Method 2: PresenceStore
            const UserStore = BdApi.Webpack.getModule(m => m.getCurrentUser);
            const PresenceStore = BdApi.Webpack.getModule(m => m.getActivities);
            if (UserStore && PresenceStore) {
                const user = UserStore.getCurrentUser();
                if (user) {
                    const sa = PresenceStore.getActivities(user.id)?.find(a => a.type === 2 && a.name === 'Spotify');
                    if (sa) {
                        this.lastSpotifyOpenTime = Date.now();
                        const art = sa.assets?.large_image ? `https://i.scdn.co/image/${sa.assets.large_image.replace('spotify:', '')}` : null;
                        return {
                            isPlaying: true, isSpotifyOpen: true,
                            track: {
                                title: sa.details || 'Unknown', artist: sa.state || 'Unknown', album: sa.assets?.large_text || '',
                                albumArtUrl: art, trackId: sa.sync_id || null,
                                duration: sa.timestamps?.end && sa.timestamps?.start ? sa.timestamps.end - sa.timestamps.start : 0,
                                position: sa.timestamps?.start ? Date.now() - sa.timestamps.start : 0,
                                _config: this.config // Tunnel config through track update
                            }
                        };
                    }
                }
            }

            // Always Show (Force active state if configured)
            if (this.config.controlsVisibility === 'whenOpen') {
                return {
                    isPlaying: false, isSpotifyOpen: true, track: {
                        title: this.t('notPlaying'), artist: '', album: '', albumArtUrl: null, trackId: null, duration: 0, position: 0,
                        _config: this.config
                    }
                };
            }
            return { isPlaying: false, isSpotifyOpen: false, track: null };
        } catch (e) {
            console.error('[SpotifySync] getSpotifyState error:', e);
            return { isPlaying: false, isSpotifyOpen: false, track: null };
        }
    }

    // ═══════════════════ SPOTIFY WEB API ═══════════════════
    // ═══════════════════ SPOTIFY WEB API ═══════════════════
    async spotifyApi(endpoint, method = 'GET', body = null, isPlayer = true) {
        // Attempt 1: Try with current logic (Premium first)
        let token = await this.getAccessToken(false);
        if (!token) {
            this.safeShowToast(this.t('tokenExpired'), { type: 'error' });
            return null;
        }

        const makeRequest = async (t) => {
            const deviceId = this.getDeviceId();
            const sep = endpoint.includes('?') ? '&' : '?';
            // If isPlayer, use /me/player prefix. Else use /v1 base.
            const base = isPlayer ? 'https://api.spotify.com/v1/me/player' : 'https://api.spotify.com/v1';

            // Refinement: Only add device_id if it's NOT a simple control command (play/pause/next/prev)
            // Debugging: Added logs to see why isControl might be failing
            const cleanEndpoint = endpoint ? endpoint.split('?')[0].toLowerCase() : '';
            const isControl = cleanEndpoint.endsWith('/play') || cleanEndpoint.endsWith('/pause') || cleanEndpoint.endsWith('/next') || cleanEndpoint.endsWith('/previous');

            console.log(`[SpotifySync] API Request: ${method} ${endpoint} (isControl: ${isControl}, deviceId: ${deviceId})`);

            const query = (isPlayer && deviceId && !isControl && !endpoint.includes('tracks')) ? `${sep}device_id=${deviceId}` : '';

            const url = `${base}${endpoint}${query}`;
            const opts = { method, headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' } };
            if (body) opts.body = JSON.stringify(body);
            return fetch(url, opts);
        };

        try {
            let res = await makeRequest(token);

            // If 401 (Unauthorized) and we were using Premium, try filtering it out
            if (res.status === 401 && this.config.spotifyAccessToken && token === this.config.spotifyAccessToken) {
                console.warn('[SpotifySync] Premium token failed (401). Retrying with Refresh or Fallback...');
                // Force refresh
                const refreshed = await this.refreshPremiumToken();
                if (refreshed) {
                    token = this.config.spotifyAccessToken;
                    res = await makeRequest(token);
                } else {
                    // If refresh failed, try Discord token
                    console.warn('[SpotifySync] Refresh failed. Fallback to Discord token.');
                    token = await this.getAccessToken(true); // ignorePremium=true
                    if (token) res = await makeRequest(token);
                }
            } else if (res.status === 403 && this.config.spotifyAccessToken && token === this.config.spotifyAccessToken) {
                // 403 Forbidden might mean scope missing or non-premium account. Fallback.
                console.warn('[SpotifySync] Premium token 403. Fallback to Discord token.');
                token = await this.getAccessToken(true);
                if (token) res = await makeRequest(token);
            }

            if (res.status === 204) return true;
            if (res.ok) { try { return await res.json(); } catch { return true; } }

            const txt = await res.text().catch(() => '');
            console.error('[SpotifySync] API error:', res.status, txt);
            // If it was a control request (PUT/POST) and failed, try toast if not typical error
            if (method !== 'GET' && res.status !== 404) { // 404 often means no device active
                if (res.status === 403) this.safeShowToast('Premium required for this action', { type: 'error' });
            }
            return null;
        } catch (e) { console.error('[SpotifySync] API fetch error:', e); return null; }
    }

    executeControl(action) {
        if (Date.now() - this.lastControlTime < 800) return; // Debounce 800ms
        this.lastControlTime = Date.now();

        // 1. Get real-time state from Discord Store to avoid command inversion (Pause vs Play)
        let isRealPlaying = this._isPlaying;
        try {
            const SpotifyStore = BdApi.Webpack.getModule(m => m.getPlaybackState, { first: true });
            if (SpotifyStore) {
                const pb = SpotifyStore.getPlaybackState();
                if (pb) isRealPlaying = pb.isPlaying === true;
            }
        } catch (e) { console.warn('[SpotifySync] Could not check real-time state:', e); }

        // 2. Strategy: Try Discord Local Control first (Most robust, bypasses Web API restrictions)
        try {
            let SpotifyActionCreators = BdApi.Webpack.getModule(m => m.pause && m.play && (m.skipNext || m.skipPrevious), { first: true });
            if (!SpotifyActionCreators) {
                // Try finding by just pause/play if more restrictive search fails
                SpotifyActionCreators = BdApi.Webpack.getModule(m => m.pause && m.play, { first: true });
            }

            if (SpotifyActionCreators) {
                console.log(`[SpotifySync] Control module found. Action: ${action}, RealState: ${isRealPlaying ? 'Playing' : 'Paused'}`);
                switch (action) {
                    case 'play':
                        this._isPlaying = true;
                        SpotifyActionCreators.play();
                        return;
                    case 'pause':
                        this._isPlaying = false;
                        SpotifyActionCreators.pause();
                        return;
                    case 'playpause':
                        if (isRealPlaying) {
                            this._isPlaying = false;
                            SpotifyActionCreators.pause();
                        } else {
                            this._isPlaying = true;
                            SpotifyActionCreators.play();
                        }
                        return;
                    case 'next':
                        SpotifyActionCreators.skipNext?.();
                        return;
                    case 'previous':
                        SpotifyActionCreators.skipPrevious?.();
                        return;
                }
            }
        } catch (e) { console.error('[SpotifySync] Local control error:', e); }

        // 3. Fallback: Web API (For remote control or if local fails)
        console.log(`[SpotifySync] Falling back to Web API for ${action} (State: ${isRealPlaying ? 'Playing' : 'Paused'})`);
        switch (action) {
            case 'play':
                this._isPlaying = true;
                return this.spotifyApi('/play', 'PUT');
            case 'pause':
                this._isPlaying = false;
                return this.spotifyApi('/pause', 'PUT');
            case 'playpause':
                if (isRealPlaying) {
                    this._isPlaying = false;
                    return this.spotifyApi('/pause', 'PUT');
                } else {
                    this._isPlaying = true;
                    return this.spotifyApi('/play', 'PUT');
                }
            case 'next': return this.spotifyApi('/next', 'POST');
            case 'previous': return this.spotifyApi('/previous', 'POST');
        }
    }

    seek(ms) { return this.spotifyApi(`/seek?position_ms=${Math.floor(ms)}`, 'PUT'); }
    setVolume(pct) { this._volumePercent = pct; return this.spotifyApi(`/volume?volume_percent=${Math.floor(pct)}`, 'PUT'); }
    setShuffle(state) { this._shuffleState = state; return this.spotifyApi(`/shuffle?state=${state}`, 'PUT'); }
    setRepeat(state) { this._repeatState = state; return this.spotifyApi(`/repeat?state=${state}`, 'PUT'); }

    async likeTrack(id) {
        if (!id) return;
        try {
            if (this.hasPremium()) {
                const token = await this.getAccessToken();
                if (!token) return;
                const res = await fetch(`https://api.spotify.com/v1/me/tracks?ids=${id}`, {
                    method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                if (res.ok || res.status === 200) {
                    this._isLiked = true;
                    this.safeShowToast('♥ ' + this.t('liked'), { type: 'success' });
                } else {
                    const txt = await res.text();
                    console.error('[SpotifySync] Premium Like failed:', res.status, txt);
                    this.safeShowToast('❌ Like Failed: ' + res.status, { type: 'error' });
                }
                return;
            }

            // Fallback (Discord Internal) - Likely won't work for Library, but might work if connections change
            let SpotifyActionCreators = BdApi.Webpack.getModule(m => m.saveTrack, { first: true });
            if (!SpotifyActionCreators) SpotifyActionCreators = BdApi.Webpack.getModule(m => m.addTrack, { first: true });

            if (SpotifyActionCreators && this.accountId) {
                const func = SpotifyActionCreators.saveTrack || SpotifyActionCreators.addTrack;
                if (typeof func === 'function') {
                    func(this.accountId, id);
                    this._isLiked = true;
                    this.safeShowToast('♥ ' + this.t('liked'), { type: 'success' });
                    return;
                }
            }
            this.safeShowToast('❌ Login needed for Like', { type: 'error' });
        } catch (e) { console.error('[SpotifySync] Like error:', e); }
    }

    async unlikeTrack(id) {
        if (!id) return;
        try {
            if (this.hasPremium()) {
                const token = await this.getAccessToken();
                if (!token) return;
                const res = await fetch(`https://api.spotify.com/v1/me/tracks?ids=${id}`, {
                    method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok || res.status === 200) {
                    this._isLiked = false;
                    this.safeShowToast(this.t('unliked'), { type: 'info' });
                }
                return;
            }

            let SpotifyActionCreators = BdApi.Webpack.getModule(m => m.saveTrack && m.unsaveTrack, { first: true });
            if (!SpotifyActionCreators) SpotifyActionCreators = BdApi.Webpack.getModule(m => m.saveTrack, { first: true });

            if (SpotifyActionCreators && this.accountId) {
                if (typeof SpotifyActionCreators.unsaveTrack === 'function') {
                    SpotifyActionCreators.unsaveTrack(this.accountId, id);
                    this._isLiked = false;
                    this.safeShowToast(this.t('unliked'), { type: 'info' });
                    return;
                }
            }
            this.safeShowToast('❌ Login needed for Like', { type: 'error' });
        } catch (e) { console.error('[SpotifySync] Unlike error:', e); }
    }

    async checkIfLiked(id) {
        if (!id || this._likeCheckPending) return;
        this._likeCheckPending = true;
        const token = await this.getAccessToken();
        if (!token) { this._likeCheckPending = false; return; }
        try {
            const res = await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) { const arr = await res.json(); this._isLiked = arr?.[0] === true; }
        } catch (e) { console.error('[SpotifySync] Like check error:', e); }
        this._likeCheckPending = false;
        this.updateLikeButton();
    }

    async fetchUserPlaylists() {
        // use isPlayer=false to query /me/playlists directly
        const data = await this.spotifyApi('/me/playlists?limit=50', 'GET', null, false);
        return data?.items || [];
    }

    async fetchPlayerQueue() {
        try {
            const queueData = await this.spotifyApi('/queue', 'GET', null, true);

            if (!queueData) return { queue: [], source: 'error' };

            let current = queueData.currently_playing ? [queueData.currently_playing] : [];
            let queue = queueData.queue || [];
            let source = 'queue'; // default source

            // Filter recent tracks + current
            const recentIds = new Set([]);
            if (current.length) recentIds.add(current[0].id);

            // Deduplication helper: ID + Name/Duration check (for linked tracks)
            const isDuplicate = (t) => {
                if (recentIds.has(t.id)) return true;
                if (current.length && t.name === current[0].name && Math.abs(t.duration_ms - current[0].duration_ms) < 2000) return true;
                return false;
            };

            queue = queue.filter(t => !isDuplicate(t));

            // If queue is short, try Context or Recommendations - DISABLED ALL MANUAL ADDITIONS (Trust Spotify Queue API 100%)
            /*
            if (queue.length < 3 && current.length > 0 && current[0].id) {
    
                // Enhanced Deduplication Helper (Shared for both strategies)
                // Checks against the *latest* queue state (passed as arg or captured if careful)
                const isInQueue = (t, currentQueue) => {
                    const qIds = new Set(currentQueue.map(q => q.id));
                    if (qIds.has(t.id)) return true;
                    // Fuzzy match: same name and Duration within 2s
                    return currentQueue.some(q => q.name === t.name && Math.abs(q.duration_ms - t.duration_ms) < 2000);
                };
    
                // Strategy A: Context (ONLY if shuffle is OFF)
                const ctx = queueData.currently_playing?.context;
                if (!this._shuffleState && ctx && (ctx.type === 'playlist' || ctx.type === 'album')) {
                    try {
                        const ctxTracks = await this.fetchContextTracks(ctx.uri.replace('spotify:', '').replace(/:/g, '/'));
                        const idx = ctxTracks.findIndex(t => t.id === current[0].id);
                        if (idx !== -1 && idx < ctxTracks.length - 1) {
                            // Get next 20 tracks
                            let nextCtx = ctxTracks.slice(idx + 1, idx + 21);
    
                            // Filter using shared deduplication against current queue
                            const uniqueCtx = nextCtx.filter(t => !isInQueue(t, queue));
    
                            if (uniqueCtx.length > 0) {
                                queue = [...queue, ...uniqueCtx];
                                source = 'context';
                            }
                        }
                    } catch (e) { console.error('[SpotifySync] Context fallback error:', e); }
                }
    
                // Strategy B: Recommendations - DISABLED per user request (to prevent duplicates/infinite queue)
                
                if (queue.length < 3) {
                    try {
                        const seedTracks = current[0].id;
                        const seedArtists = current[0].artists?.[0]?.id;
                        const recData = await this.spotifyApi(`/recommendations?limit=20&seed_tracks=${seedTracks}${seedArtists ? `&seed_artists=${seedArtists}` : ''}`, 'GET', null, false);
                        if (recData && recData.tracks) {
                            source = 'recommendations';
    
                            // Filter recommendations using shared deduplication logic against UPDATED queue
                            const uniqueRecs = recData.tracks.filter(t => !isInQueue(t, queue));
    
                            if (uniqueRecs.length > 0) {
                                queue = [...queue, ...uniqueRecs];
                            }
                        }
                    } catch (e) { console.error('[SpotifySync] Recommendations fetch error:', e); }
                }
                
            }
            */

            if (current.length) current[0]._isCurrent = true;

            // Strategy: History / Context Restoration (Visual Previous Tracks)
            // Fetches up to 10 previous tracks to show "where we are" in the playlist.
            let history = [];
            // Update global context state for UI buttons
            // Fallback to existing context if API returns null (common when paused)
            const newCtx = queueData.currently_playing?.context;
            if (newCtx) this._context = newCtx;
            const ctx = this._context;

            if (!this._shuffleState && ctx && (ctx.type === 'playlist' || ctx.type === 'album')) {
                try {
                    // Robust ID extraction using Regex to handle 'spotify:user:x:playlist:y' etc.
                    const type = ctx.type; // 'playlist' or 'album'
                    const idMatch = ctx.uri.match(/[:/]([a-zA-Z0-9]{22})/);
                    const id = idMatch ? idMatch[1] : null;

                    if (id) {
                        // Use correct endpoint for tracks (plural)
                        const endpoint = type === 'playlist' ? `/playlists/${id}/tracks` : `/albums/${id}/tracks`;
                        const ctxTracks = await this.fetchContextTracks(endpoint);
                        const currentId = current[0]?.id;
                        const idx = ctxTracks.findIndex(t => t.id === currentId);

                        if (idx > 0) {
                            const start = Math.max(0, idx - 10);
                            history = ctxTracks.slice(start, idx).map(t => ({ ...t, _isHistory: true }));
                        }
                    }
                } catch (e) { console.error('[SpotifySync] History fetch error:', e); }
            }

            // Aggressive Self-Deduplication of the Queue
            // This ensures NO duplicates exist in the final list, resolving the persistent issue
            // where Spotify's API returns repeated tracks (e.g. from Context or Autoplay).
            const uniqueQueue = [];
            const seenIds = new Set();

            // 1. Add History IDs to seenIds to prevent them from appearing in "Future" queue
            history.forEach(h => seenIds.add(h.id));

            // 2. Add Current Track ID
            if (current.length > 0) {
                seenIds.add(current[0].id);
            }

            for (const t of queue) {
                // 1. Strict ID Check
                if (seenIds.has(t.id)) continue;

                // 2. Fuzzy Check (Name + Duration) against tracks already added to uniqueQueue
                // This catches linked tracks with different IDs
                const isFuzzyDup = uniqueQueue.some(q =>
                    q.name === t.name && Math.abs(q.duration_ms - t.duration_ms) < 2000
                );
                if (isFuzzyDup) continue;

                // If valid unique track, add it
                seenIds.add(t.id);
                uniqueQueue.push(t);
            }
            queue = uniqueQueue;

            return { queue: [...history, ...current, ...queue], source, context: ctx };
        } catch (err) {
            console.error('[SpotifySync] fetchPlayerQueue error:', err);
            return { queue: [], source: 'error' };
        }
    }

    async fetchContextTracks(url) {
        if (!url) return [];
        // Extract relative path
        const cleanUrl = url.replace('https://api.spotify.com/v1', '');
        // use isPlayer=false to query /playlists/... directly
        const data = await this.spotifyApi(`${cleanUrl}?limit=50`, 'GET', null, false);
        // Playlist object has .tracks.items, Album has .tracks.items, Playlist tracks endpoint has .items
        const items = data?.tracks?.items || data?.items || [];
        // Map to track object (Playlist items are wrappers, Album items are tracks)
        return items.map(i => i.track || i).filter(t => t);
    }

    async playContext(contextUri) {
        return this.spotifyApi('/play', 'PUT', { context_uri: contextUri });
    }

    async playTrackInContext(contextUri, trackUri) {
        // Normalize URI to ensure it's "spotify:playlist:ID" or "spotify:album:ID"
        // This fixes issues with "spotify:user:x:playlist:y" URIs which might be rejected by /play endpoint
        let cleanCtx = contextUri;
        try {
            const match = contextUri.match(/[:/](playlist|album)[:/]([a-zA-Z0-9]+)/);
            if (match) cleanCtx = `spotify:${match[1]}:${match[2]}`;
        } catch (e) { /* ignore */ }
        return this.spotifyApi('/play', 'PUT', { context_uri: cleanCtx, offset: { uri: trackUri } });
    }

    async fetchFullPlayerState() {
        if (Date.now() - this._lastFullStateTime < 2000) return; // Debounce 2s
        this._lastFullStateTime = Date.now();
        const data = await this.spotifyApi('', 'GET'); // /me/player
        if (data && typeof data === 'object') {
            this._shuffleState = data.shuffle_state ?? false;
            this._repeatState = data.repeat_state ?? 'off';
            if (data.actions?.disallows) {
                this._disallows = data.actions.disallows;
                this.updateShuffleButton();
                this.updateRepeatButton();
            }
            this._volumePercent = data.device?.volume_percent ?? 100;

            // Cache context for Queue view logic
            if (data.context) {
                this._context = data.context; // Store full object for type check
                this._lastContextUri = data.context.uri;
            } else {
                this._context = null;
            }
            this.updateQueueButton();
        }
    }

    // ═══════════════════ DETECTION LOOP ═══════════════════
    startDetection() {
        this.spotifyStateInterval = setInterval(() => {
            const state = this.getSpotifyState();
            const shouldShow = this.config.controlsVisibility === 'whenOpen'
                ? state.isSpotifyOpen
                : (state.isPlaying && state.track);

            if (shouldShow && state.track) {
                // Track changed?
                if (state.track.trackId && state.track.trackId !== this._trackId) {
                    this._trackId = state.track.trackId;
                    this.checkIfLiked(this._trackId);
                }
                this._isPlaying = state.isPlaying;
                this._positionMs = state.track.position || 0;
                this._durationMs = state.track.duration || 0;
                this._positionTimestamp = Date.now();
                this._albumArtUrl = state.track.albumArtUrl;
                this.updateWidget(state.track, state.isPlaying);
                // Fetch full state for shuffle/repeat/volume when expanded
                if (this._expanded) this.fetchFullPlayerState();
            } else {
                this.hideWidget();
            }

            // Send state to Solari
            if (state.isPlaying && state.track) {
                this.send({ type: 'spotify_state', state: { isPlaying: true, track: state.track } });
            }
        }, 1500);

        // Progress bar smooth updater
        this.progressInterval = setInterval(() => {
            if (!this._isPlaying || !this._durationMs) return;
            const elapsed = Date.now() - this._positionTimestamp;
            const currentPos = Math.min(this._positionMs + elapsed, this._durationMs);
            const pct = (currentPos / this._durationMs) * 100;
            const fill = document.getElementById('ss2-progress-fill');
            const timeEl = document.getElementById('ss2-time-current');
            if (fill) fill.style.width = `${pct}%`;
            if (timeEl) timeEl.textContent = this.formatTime(currentPos);
        }, 500);
    }


    stopDetection() {
        if (this.spotifyStateInterval) { clearInterval(this.spotifyStateInterval); this.spotifyStateInterval = null; }
        if (this.progressInterval) { clearInterval(this.progressInterval); this.progressInterval = null; }
    }

    // ═══════════════════ UI: CSS ═══════════════════
    getWidgetCSS() {
        return `
        #ss2-widget {
            background: linear-gradient(135deg, rgba(30, 215, 96, 0.15) 0%, var(--background-secondary-alt, rgba(0,0,0,0.6)) 100%);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(30, 215, 96, 0.2);
            border-radius: 10px;
            padding: 10px;
            margin: 6px 8px;
            font-family: var(--font-primary, 'Segoe UI'), 'Helvetica Neue', sans-serif;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
            position: relative;
            color: var(--text-normal, #fff);
        }
        #ss2-widget.ss2-hidden { display: none !important; }
        #ss2-widget.ss2-expanded { padding: 12px; }
        #ss2-widget.ss2-mode-list { height: 450px !important; transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        #ss2-widget.ss2-expanded .ss2-controls { display: none !important; }

        /* Top row: art + info + controls */
        .ss2-top { display: flex; align-items: center; gap: 10px; }
        .ss2-art {
            width: 40px; height: 40px; border-radius: 6px;
            background: rgba(255,255,255,0.05); flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: all 0.3s ease; cursor: pointer;
            object-fit: cover;
        }
        #ss2-widget.ss2-expanded .ss2-art { width: 56px; height: 56px; border-radius: 8px; box-shadow: 0 4px 16px rgba(30,215,96,0.2); }
        .ss2-info { flex: 1; min-width: 0; overflow: hidden; }
        .ss2-title {
            font-size: 13px; font-weight: 600; color: var(--header-primary, #fff);
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            line-height: 1.3; cursor: context-menu;
        }
        .ss2-artist {
            font-size: 11px; color: var(--text-muted, rgba(255,255,255,0.6));
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            line-height: 1.3; cursor: context-menu;
        }
        .ss2-artist:hover { color: var(--text-normal, rgba(255,255,255,0.8)); text-decoration: underline; }
        .ss2-album {
            font-size: 10px; color: var(--text-muted, rgba(255,255,255,0.4));
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            line-height: 1.3; display: none; cursor: context-menu;
        }
        .ss2-album:hover { color: var(--text-normal, rgba(255,255,255,0.6)); text-decoration: underline; }

        /* Context menu */
        .ss2-ctx-menu {
            position: fixed; z-index: 10000;
            background: var(--background-floating, #18191c);
            border: 1px solid var(--background-modifier-accent, rgba(255,255,255,0.1));
            border-radius: 6px; padding: 4px; min-width: 180px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.4);
            animation: ss2-ctx-in 0.15s ease;
        }
        @keyframes ss2-ctx-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .ss2-ctx-item {
            display: flex; align-items: center; gap: 8px;
            padding: 8px 10px; border-radius: 4px; cursor: pointer;
            color: var(--interactive-normal, #b5bac1); font-size: 13px;
            transition: all 0.1s ease;
        }
        .ss2-ctx-item:hover { background: var(--background-modifier-hover, rgba(255,255,255,0.06)); color: var(--interactive-active, #fff); }
        .ss2-ctx-item svg { width: 16px; height: 16px; fill: currentColor; flex-shrink: 0; }
        .ss2-ctx-sep { height: 1px; background: var(--background-modifier-accent, rgba(255,255,255,0.06)); margin: 4px 8px; }
        #ss2-widget.ss2-expanded .ss2-album { display: block; }

        /* Progress bar */
        .ss2-progress-wrap {
            margin-top: 8px; cursor: pointer; position: relative;
            padding: 4px 0;
        }
        .ss2-progress-bar {
            height: 3px; background: rgba(255,255,255,0.1);
            border-radius: 2px; position: relative; overflow: visible;
            transition: height 0.2s ease;
        }
        .ss2-progress-wrap:hover .ss2-progress-bar { height: 5px; }
        .ss2-progress-fill {
            height: 100%; background: #1DB954; border-radius: 2px;
            position: relative; max-width: 100%;
            transition: width 0.6s linear;
        }
        .ss2-progress-fill::after {
            content: ''; position: absolute; right: -5px; top: 50%;
            transform: translateY(-50%); width: 10px; height: 10px;
            background: #fff; border-radius: 50%; opacity: 0;
            transition: opacity 0.2s ease;
            box-shadow: 0 0 4px rgba(0,0,0,0.3);
        }
        .ss2-progress-wrap:hover .ss2-progress-fill::after { opacity: 1; }
        .ss2-times {
            display: flex; justify-content: space-between;
            font-size: 10px; color: var(--text-muted, rgba(255,255,255,0.4));
            margin-top: 2px; display: none;
        }
        #ss2-widget.ss2-expanded .ss2-times { display: flex; }

        /* Controls */
        .ss2-controls { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
        .ss2-btn {
            background: none; border: none; color: rgba(255,255,255,0.7);
            width: 28px; height: 28px; border-radius: 50%;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            transition: all 0.15s ease; padding: 0;
        }
        .ss2-btn:hover { color: #fff; background: rgba(255,255,255,0.1); transform: scale(1.1); }
        .ss2-btn svg { width: 16px; height: 16px; fill: currentColor; }
        .ss2-btn.ss2-play { width: 32px; height: 32px; color: #fff; background: #1DB954; }
        .ss2-btn.ss2-play:hover { background: #1ed760; transform: scale(1.12); }
        .ss2-btn.ss2-play svg { width: 18px; height: 18px; }

        /* Extended controls row */
        .ss2-ext-controls {
            display: none; align-items: center; justify-content: center;
            gap: 6px; margin-top: 8px;
        }
        #ss2-widget.ss2-expanded .ss2-ext-controls { display: flex; }
        .ss2-btn.ss2-active { color: #1DB954 !important; }
        .ss2-btn.ss2-like-active { color: #e91e63 !important; }
        .ss2-btn.ss2-like-active:hover { color: #ff4081 !important; }

        /* Volume */
        .ss2-volume-wrap {
            display: none; align-items: center; gap: 6px;
            margin-top: 6px; padding: 0 4px;
        }
        #ss2-widget.ss2-expanded .ss2-volume-wrap { display: flex; }
        .ss2-volume-wrap svg { width: 14px; height: 14px; fill: rgba(255,255,255,0.5); flex-shrink: 0; }
        .ss2-volume-slider {
            flex: 1; height: 3px; -webkit-appearance: none; appearance: none;
            background: rgba(255,255,255,0.1); border-radius: 2px; outline: none;
            cursor: pointer;
        }
        .ss2-volume-slider::-webkit-slider-thumb {
            -webkit-appearance: none; width: 12px; height: 12px;
            background: #fff; border-radius: 50%; cursor: pointer;
            box-shadow: 0 0 4px rgba(0,0,0,0.3);
        }
        .ss2-volume-pct { font-size: 10px; color: var(--text-muted, rgba(255,255,255,0.4)); width: 28px; text-align: right; }

        /* Expand toggle */
        .ss2-expand-btn {
            position: absolute; top: 4px; right: 4px;
            background: none; border: none; color: rgba(255,255,255,0.3);
            cursor: pointer; width: 18px; height: 18px; padding: 0;
            transition: color 0.2s ease;
        }
        .ss2-expand-btn:hover { color: rgba(255,255,255,0.7); }
        .ss2-expand-btn svg { width: 14px; height: 14px; fill: currentColor; }
        `;

        /* List Overlay (Library/Queue) */
        css += `
        .ss2-list-overlay {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9); backdrop-filter: blur(8px);
            z-index: 100; display: flex; flex-direction: column;
            border-radius: 10px; padding: 10px;
            animation: ss2-fade-in 0.2s ease;
        }
        .ss2-list-header {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 6px; flex-shrink: 0;
        }
        .ss2-list-title { font-weight: 600; font-size: 13px; color: #fff; }
        .ss2-list-close {
            background: none; border: none; color: rgba(255,255,255,0.6);
            cursor: pointer; padding: 2px;
        }
        .ss2-list-close:hover { color: #fff; }
        .ss2-list-content {
            flex: 1; overflow-y: auto; overflow-x: hidden;
            display: flex; flex-direction: column; gap: 4px;
        }
        .ss2-list-content::-webkit-scrollbar { width: 4px; }
        .ss2-list-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
        .ss2-list-item {
            display: flex; align-items: center; gap: 8px;
            padding: 6px; border-radius: 4px; cursor: pointer;
            transition: background 0.1s;
        }
        .ss2-list-item:hover { background: rgba(255,255,255,0.1); }
        .ss2-list-img {
            width: 32px !important; height: 32px !important; border-radius: 4px; object-fit: cover;
            background: rgba(255,255,255,0.1); flex-shrink: 0;
        }
        .ss2-list-info { flex: 1; min-width: 0; }
        .ss2-list-name { font-size: 12px; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ss2-list-sub { font-size: 10px; color: rgba(255,255,255,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        @keyframes ss2-fade-in { from { opacity: 0; } to { opacity: 1; } }
        `;
        return css;
    }

    // ═══════════════════ UI: INJECT ═══════════════════
    injectWidget() {
        const inject = () => {
            if (document.getElementById('ss2-widget')) return;

            // Find Discord's user panel area
            const selectors = [
                'section[class*="panels_"]', 'div[class*="panels_"]',
                '[class*="panels_"] > [class*="container_"]'
            ];
            let target = null;
            for (const s of selectors) {
                try { target = document.querySelector(s); if (target) break; } catch { }
            }
            if (!target) {
                const mute = document.querySelector('button[aria-label*="Mute"], button[aria-label*="Silenciar"], button[aria-label*="mute"]');
                if (mute) target = mute.closest('section') || mute.closest('[class*="panels"]');
            }
            if (!target) { setTimeout(inject, 2000); return; }

            const el = document.createElement('div');
            el.id = 'ss2-widget';
            el.className = 'ss2-hidden';
            el.innerHTML = `
                <style>${this.getWidgetCSS()}</style>
                <button class="ss2-expand-btn" id="ss2-toggle-expand" title="${this.t('openInSpotify')}">
                    <svg viewBox="0 0 24 24"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>
                </button>
                <div class="ss2-top">
                    <img class="ss2-art" id="ss2-art" src="" alt="" style="display:none" />
                    <div class="ss2-info">
                        <div class="ss2-title" id="ss2-title"></div>
                        <div class="ss2-artist" id="ss2-artist"></div>
                        <div class="ss2-album" id="ss2-album"></div>
                    </div>
                    <div class="ss2-controls" id="ss2-mini-controls">
                        <button class="ss2-btn" id="ss2-prev" title="${this.t('previous')}">
                            <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                        </button>
                        <button class="ss2-btn ss2-play" id="ss2-playpause" title="${this.t('playPause')}">
                            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                        <button class="ss2-btn" id="ss2-next" title="${this.t('next')}">
                            <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                        </button>
                    </div>
                </div>
                <div class="ss2-progress-wrap" id="ss2-progress-wrap">
                    <div class="ss2-progress-bar">
                        <div class="ss2-progress-fill" id="ss2-progress-fill" style="width:0%"></div>
                    </div>
                    <div class="ss2-times">
                        <span id="ss2-time-current">0:00</span>
                        <span id="ss2-time-total">0:00</span>
                    </div>
                </div>
                <div class="ss2-ext-controls" id="ss2-ext-controls">
                    <button class="ss2-btn" id="ss2-shuffle" title="${this.t('shuffle')}">
                        <svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
                    </button>
                    <button class="ss2-btn" id="ss2-prev2" title="${this.t('previous')}">
                        <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                    </button>
                    <button class="ss2-btn ss2-play" id="ss2-playpause2" title="${this.t('playPause')}">
                        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                    <button class="ss2-btn" id="ss2-next2" title="${this.t('next')}">
                        <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                    </button>
                    <button class="ss2-btn" id="ss2-repeat" title="${this.t('repeat')}">
                        <svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
                    </button>
                    <button class="ss2-btn" id="ss2-like" title="${this.t('like')}">
                        <svg viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg>
                    </button>
                    <button class="ss2-btn" id="ss2-share" title="${this.t('share')}">
                        <svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
                    </button>
                    <button class="ss2-btn ss2-premium-only" id="ss2-lib-btn" title="Library" style="display:none">
                        <svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"/></svg>
                    </button>
                    <button class="ss2-btn ss2-premium-only" id="ss2-queue-btn" title="Queue" style="display:none">
                        <svg viewBox="0 0 24 24"><path d="M4 10h12v2H4zm0-4h12v2H4zm0 8h8v2H4zM20 10V4.16c0-.53-.21-1.04-.59-1.41-.37-.38-.88-.59-1.41-.59h-1v2h1v6h2zm-2 10v-5l5 2.5z"/></svg>
                    </button>
                </div>
                <div class="ss2-volume-wrap" id="ss2-volume-wrap">
                    <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                    <input type="range" class="ss2-volume-slider" id="ss2-volume" min="0" max="100" value="100" />
                    <span class="ss2-volume-pct" id="ss2-volume-pct">100%</span>
                </div>
                <!-- Container for overlay lists (Library/Queue) -->
                <div id="sth-list-view"></div>
            `;

            try { target.insertBefore(el, target.firstChild); }
            catch { try { target.parentElement.insertBefore(el, target); } catch { return; } }

            this.widgetElement = el;
            setTimeout(() => this.bindWidgetEvents(), 50);
        };

        setTimeout(inject, 2000);
        this.reinjectInterval = setInterval(() => {
            if (!document.getElementById('ss2-widget')) { this.widgetElement = null; inject(); }
        }, 3000);
    }

    // ═══════════════════ UI: EVENTS ═══════════════════
    bindWidgetEvents() {
        const widget = document.getElementById('ss2-widget');
        if (!widget) return;

        // Helper to bind with stopPropagation
        const bind = (id, handler) => {
            const el = document.getElementById(id);
            if (el) {
                // Clone node to remove old listeners
                const newEl = el.cloneNode(true);
                el.parentNode.replaceChild(newEl, el);
                newEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handler(e);
                });
                return newEl;
            }
        };

        // Play/Pause
        const ppHandler = () => { this.executeControl('playpause'); this.send({ type: 'spotify_control_clicked', action: 'playpause' }); };
        bind('ss2-playpause', ppHandler);
        bind('ss2-playpause2', ppHandler);

        // Prev/Next
        const prevHandler = () => { this.executeControl('previous'); this.send({ type: 'spotify_control_clicked', action: 'previous' }); };
        const nextHandler = () => { this.executeControl('next'); this.send({ type: 'spotify_control_clicked', action: 'next' }); };
        bind('ss2-prev', prevHandler);
        bind('ss2-prev2', prevHandler);
        bind('ss2-next', nextHandler);
        bind('ss2-next2', nextHandler);

        // Seek
        const progWrap = document.getElementById('ss2-progress-wrap');
        if (progWrap) {
            const newProg = progWrap.cloneNode(true);
            progWrap.parentNode.replaceChild(newProg, progWrap);
            newProg.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (!this._durationMs) return;
                const rect = newProg.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const seekMs = pct * this._durationMs;
                this._positionMs = seekMs;
                this._positionTimestamp = Date.now();
                const fill = document.getElementById('ss2-progress-fill');
                if (fill) { fill.style.transition = 'none'; fill.style.width = `${pct * 100}%`; requestAnimationFrame(() => fill.style.transition = 'width 0.6s linear'); }
                this.seek(seekMs);
            });
        }

        // Like
        bind('ss2-like', () => {
            if (this._isLiked) this.unlikeTrack(this._trackId);
            else this.likeTrack(this._trackId);
            setTimeout(() => this.updateLikeButton(), 300);
        });

        // Shuffle
        bind('ss2-shuffle', () => {
            this._shuffleState = !this._shuffleState;
            this.setShuffle(this._shuffleState);
            this.updateShuffleButton();
        });

        // Repeat
        bind('ss2-repeat', () => {
            const states = ['off', 'context', 'track'];
            const idx = (states.indexOf(this._repeatState) + 1) % 3;
            this._repeatState = states[idx];
            this.setRepeat(this._repeatState);
            this.updateRepeatButton();
        });

        // Volume
        const vol = document.getElementById('ss2-volume');
        if (vol) {
            const newVol = vol.cloneNode(true);
            vol.parentNode.replaceChild(newVol, vol);
            newVol.addEventListener('click', e => e.stopPropagation());
            newVol.addEventListener('input', (e) => {
                this._volumePercent = parseInt(e.target.value);
                const pctEl = document.getElementById('ss2-volume-pct');
                if (pctEl) pctEl.textContent = `${this._volumePercent}%`;
            });
            newVol.addEventListener('change', (e) => {
                this.setVolume(parseInt(e.target.value));
            });
        }

        // Expand/Collapse
        bind('ss2-toggle-expand', () => {
            this._expanded = !this._expanded;
            const w = document.getElementById('ss2-widget');
            if (w) w.classList.toggle('ss2-expanded', this._expanded);
            const btn = document.getElementById('ss2-toggle-expand');
            if (btn) btn.innerHTML = this._expanded
                ? '<svg viewBox="0 0 24 24"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>'
                : '<svg viewBox="0 0 24 24"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>';
            if (this._expanded) this.fetchFullPlayerState();
        });

        // Library Button (Fixed)
        bind('ss2-lib-btn', async () => {
            const container = document.getElementById('sth-list-view');
            // Toggle off
            if (container && container.innerHTML !== '') {
                container.innerHTML = '';
                document.getElementById('ss2-widget')?.classList.remove('ss2-mode-list');
                return;
            }
            this._playlists = await this.fetchUserPlaylists();
            this.renderListView('library');
        });

        // Queue Button (Fixed)
        bind('ss2-queue-btn', () => {
            // Strict Guard: Only allow if context is playlist
            const type = this._context?.type;
            if (type !== 'playlist') return;

            const container = document.getElementById('sth-list-view');
            // Toggle off
            if (container && container.innerHTML !== '') {
                container.innerHTML = '';
                document.getElementById('ss2-widget')?.classList.remove('ss2-mode-list');
                return;
            }
            this.renderListView('queue');
        });

        // Share
        bind('ss2-share', () => {
            if (this._trackId) {
                this.sendToChat(`https://open.spotify.com/track/${this._trackId}`);
                this.safeShowToast('🔗 ' + this.t('shareCopied'), { type: 'success' });
            }
        });

        // Simple clicks for Art/Artist/Album
        const bindSimple = (id, handler) => {
            const el = document.getElementById(id);
            if (el) {
                const newEl = el.cloneNode(true);
                el.parentNode.replaceChild(newEl, el);
                newEl.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); handler(); });
                newEl.addEventListener('contextmenu', (e) => this.handleContextMenu(e, id));
            }
        };

        bindSimple('ss2-art', () => { if (this._trackId) window.open(`https://open.spotify.com/track/${this._trackId}`, '_blank'); });
        bindSimple('ss2-artist', () => { if (this._artistIds?.[0]?.id) window.open(`https://open.spotify.com/artist/${this._artistIds[0].id}`, '_blank'); });
        bindSimple('ss2-album', () => { if (this._albumId) window.open(`https://open.spotify.com/album/${this._albumId}`, '_blank'); });

        this.bindContextMenuHandlers();
    }

    handleContextMenu(e, type) {
        // Implementation moved to separate method to allow re-binding
    }

    bindContextMenuHandlers() {
        // Context menu logic logic (extracted from previous implementation)
        const showCtxMenu = (e, items) => {
            e.preventDefault(); e.stopPropagation();
            document.querySelectorAll('.ss2-ctx-menu').forEach(m => m.remove());
            const menu = document.createElement('div');
            menu.className = 'ss2-ctx-menu';
            menu.innerHTML = items.map(item => {
                if (item.sep) return '<div class="ss2-ctx-sep"></div>';
                return `<div class="ss2-ctx-item" data-action="${item.action}">${item.icon || ''} ${item.label}</div>`;
            }).join('');
            menu.style.left = `${Math.min(e.clientX, window.innerWidth - 200)}px`;
            menu.style.top = `${Math.min(e.clientY, window.innerHeight - (items.length * 36))}px`;
            document.body.appendChild(menu);
            menu.querySelectorAll('.ss2-ctx-item').forEach(el => {
                el.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const action = el.dataset.action;
                    if (action === 'copyTrack') this.copyToClipboard(`https://open.spotify.com/track/${this._trackId}`);
                    else if (action === 'copyArtist' && this._artistIds?.[0]?.id) this.copyToClipboard(`https://open.spotify.com/artist/${this._artistIds[0].id}`);
                    else if (action === 'copyAlbum' && this._albumId) this.copyToClipboard(`https://open.spotify.com/album/${this._albumId}`);
                    else if (action === 'openTrack') window.open(`https://open.spotify.com/track/${this._trackId}`, '_blank');
                    else if (action === 'openArtist' && this._artistIds?.[0]?.id) window.open(`https://open.spotify.com/artist/${this._artistIds[0].id}`, '_blank');
                    else if (action === 'openAlbum' && this._albumId) window.open(`https://open.spotify.com/album/${this._albumId}`, '_blank');
                    else if (action === 'share') { this.sendToChat(`https://open.spotify.com/track/${this._trackId}`); this.safeShowToast('🔗 ' + this.t('shareCopied'), { type: 'success' }); }
                    menu.remove();
                });
            });
            const closeMenu = (ev) => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('click', closeMenu); } };
            setTimeout(() => document.addEventListener('click', closeMenu), 10);
        };

        const $ = id => document.getElementById(id);
        const linkIcon = '<svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>';
        const openIcon = '<svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>';
        const shareIcon = '<svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>';

        $('ss2-title')?.addEventListener('contextmenu', (e) => {
            if (!this._trackId) return;
            showCtxMenu(e, [{ action: 'copyTrack', label: this.t('copyTrackUrl'), icon: linkIcon }, { action: 'openTrack', label: this.t('openInSpotify'), icon: openIcon }, { sep: true }, { action: 'share', label: this.t('share'), icon: shareIcon }]);
        });
        $('ss2-artist')?.addEventListener('contextmenu', (e) => {
            if (!this._artistIds?.length) return;
            showCtxMenu(e, [{ action: 'copyArtist', label: this.t('copyArtistUrl'), icon: linkIcon }, { action: 'openArtist', label: this.t('openInSpotify'), icon: openIcon }]);
        });
        $('ss2-art')?.addEventListener('contextmenu', (e) => {
            if (!this._trackId) return;
            showCtxMenu(e, [{ action: 'copyAlbum', label: this.t('copyAlbumUrl'), icon: linkIcon }, { action: 'copyTrack', label: this.t('copyTrackUrl'), icon: linkIcon }, { action: 'openAlbum', label: this.t('openInSpotify'), icon: openIcon }, { sep: true }, { action: 'share', label: this.t('share'), icon: shareIcon }]);
        });
        $('ss2-album')?.addEventListener('contextmenu', (e) => {
            if (!this._albumId) return;
            showCtxMenu(e, [{ action: 'copyAlbum', label: this.t('copyAlbumUrl'), icon: linkIcon }, { action: 'openAlbum', label: this.t('openInSpotify'), icon: openIcon }]);
        });
    }


    // ═══════════════════ UI: UPDATE ═══════════════════
    updateWidget(track, isPlaying) {
        const widget = document.getElementById('ss2-widget');
        if (!widget || !track) return;
        widget.classList.remove('ss2-hidden');

        const $ = id => document.getElementById(id);
        // Track info
        $('ss2-title').textContent = track.title || '';
        $('ss2-artist').textContent = track.artist || '';
        $('ss2-album').textContent = track.album || '';
        // Album art
        const artEl = $('ss2-art');
        if (artEl && track.albumArtUrl && this.config.showAlbumArt) {
            artEl.src = track.albumArtUrl; artEl.style.display = 'block';
        } else if (artEl) { artEl.style.display = 'none'; }
        // Play/Pause icon
        const ppIcon = isPlaying
            ? '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
            : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
        const pp1 = $('ss2-playpause'); if (pp1) pp1.innerHTML = ppIcon;
        const pp2 = $('ss2-playpause2'); if (pp2) pp2.innerHTML = ppIcon;
        // Progress
        if (this.config.showProgressBar) {
            const pw = $('ss2-progress-wrap'); if (pw) pw.style.display = '';
            $('ss2-time-total').textContent = this.formatTime(this._durationMs);
        } else {
            const pw = $('ss2-progress-wrap'); if (pw) pw.style.display = 'none';
        }
        // Like
        this.updateLikeButton();
        // Shuffle/Repeat
        this.updateShuffleButton();
        this.updateRepeatButton();
        this.updateQueueButton();
        // Volume
        const volSlider = $('ss2-volume');
        if (volSlider && volSlider !== document.activeElement) {
            volSlider.value = this._volumePercent;
            const pctEl = $('ss2-volume-pct');
            if (pctEl) pctEl.textContent = `${this._volumePercent}%`;
        }
        // Hide/show optional sections
        const extCtrl = $('ss2-ext-controls');
        const volWrap = $('ss2-volume-wrap');
        if (extCtrl) {
            const shuffleBtn = $('ss2-shuffle');
            const repeatBtn = $('ss2-repeat');
            const likeBtn = $('ss2-like');
            if (shuffleBtn) shuffleBtn.style.display = this.config.showShuffleRepeat ? '' : 'none';
            if (repeatBtn) repeatBtn.style.display = this.config.showShuffleRepeat ? '' : 'none';
            if (likeBtn) likeBtn.style.display = (this.config.showLikeButton && this.hasPremium()) ? '' : 'none';
        }
        if (volWrap) volWrap.style.display = this.config.showVolumeSlider ? 'flex' : 'none';

        // Hide/Show Premium-only buttons
        const premiumOnly = document.querySelectorAll('.ss2-premium-only');
        const hasPrem = this.hasPremium();
        premiumOnly.forEach(el => el.style.display = hasPrem ? '' : 'none');
    }

    updateLikeButton() {
        const btn = document.getElementById('ss2-like');
        if (!btn) return;
        btn.classList.toggle('ss2-like-active', this._isLiked);
        btn.title = this._isLiked ? this.t('unlike') : this.t('like');
        btn.innerHTML = this._isLiked
            ? '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
            : '<svg viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg>';
    }

    updateShuffleButton() {
        const btn = document.getElementById('ss2-shuffle');
        if (btn) {
            btn.classList.toggle('ss2-active', this._shuffleState);
            const disallowed = this._disallows?.toggling_shuffle;
            btn.style.opacity = disallowed ? '0.3' : '1';
            btn.style.pointerEvents = disallowed ? 'none' : 'auto';
            btn.style.cursor = disallowed ? 'default' : 'pointer';
        }
    }

    updateRepeatButton() {
        const btn = document.getElementById('ss2-repeat');
        if (!btn) return;
        const disallowed = this._disallows?.toggling_repeat_context || this._disallows?.toggling_repeat_track;
        btn.classList.toggle('ss2-active', this._repeatState !== 'off');
        btn.innerHTML = this._repeatState === 'track'
            ? '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>'
            : '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>';
        btn.style.opacity = disallowed ? '0.3' : '1';
        btn.style.pointerEvents = disallowed ? 'none' : 'auto';
        btn.style.cursor = disallowed ? 'default' : 'pointer';
    }

    updateQueueButton() {
        const btn = document.getElementById('ss2-queue-btn');
        if (!btn) return;
        // Strict check: only allow if context is 'playlist'
        const type = this._context?.type;
        const disabled = type !== 'playlist';

        if (disabled) {
            btn.style.setProperty('opacity', '0.3', 'important');
            btn.style.setProperty('pointer-events', 'none', 'important');
            btn.style.setProperty('cursor', 'default', 'important');
        } else {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
            btn.style.cursor = 'pointer';
        }
        btn.title = disabled ? 'Queue only available for Playlists' : 'Queue';
    }

    hideWidget() {
        const widget = document.getElementById('ss2-widget');
        if (widget) widget.classList.add('ss2-hidden');
    }

    removeWidget() {
        if (this.reinjectInterval) { clearInterval(this.reinjectInterval); this.reinjectInterval = null; }
        if (this.widgetElement) { this.widgetElement.remove(); this.widgetElement = null; }
        const existing = document.getElementById('ss2-widget');
        if (existing) existing.remove();
    }

    // ═══════════════════ SETTINGS PANEL ═══════════════════
    getSettingsPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = 'padding:20px;font-family:"Segoe UI",sans-serif;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;';

        const render = () => {
            const toggle = (label, key) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;">
                    <span style="color:#fff;font-size:0.9em;">${label}</span>
                    <div class="ss2-set-switch ${this.config[key] ? 'on' : ''}" data-key="${key}" style="width:40px;height:22px;background:${this.config[key] ? '#1DB954' : 'rgba(255,255,255,0.15)'};border-radius:11px;position:relative;cursor:pointer;transition:all 0.3s;">
                        <div style="position:absolute;width:18px;height:18px;background:#fff;border-radius:50%;top:2px;left:${this.config[key] ? '20px' : '2px'};transition:left 0.3s;"></div>
                    </div>
                </div>`;

            const isPremium = this.hasPremium();

            panel.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h2 style="color:#fff;margin:0;display:flex;align-items:center;gap:8px;">
                        <span style="color:#1DB954;">🎵</span> ${this.t('title')}
                        <span style="color:rgba(255,255,255,0.3);font-size:0.5em;font-weight:400;">v2.0.0</span>
                    </h2>
                    <select id="ss2-lang" style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:#fff;padding:5px 8px;">
                        <option value="en" ${this.config.language === 'en' ? 'selected' : ''}>English</option>
                        <option value="pt-BR" ${this.config.language === 'pt-BR' ? 'selected' : ''}>Português</option>
                        <option value="es" ${this.config.language === 'es' ? 'selected' : ''}>Español</option>
                    </select>
                </div>

                <div style="background:rgba(255,255,255,0.05);border:1px solid ${this.isConnectedToSolari ? 'rgba(29,185,84,0.4)' : 'rgba(239,68,68,0.4)'};border-radius:8px;padding:12px 14px;margin-bottom:12px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="width:8px;height:8px;border-radius:50%;background:${this.isConnectedToSolari ? '#1DB954' : '#ef4444'};"></div>
                        <span style="color:rgba(255,255,255,0.6);font-size:0.85em;">${this.t('solari')}:</span>
                        <span style="color:${this.isConnectedToSolari ? '#1DB954' : '#ef4444'};font-weight:600;">${this.isConnectedToSolari ? this.t('connected') : this.t('disconnected')}</span>
                    </div>
                </div>

                <!-- Premium Section -->
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                        <h3 style="color:#fff;margin:0;font-size:1em;">💎 ${this.t('premiumTitle')}</h3>
                        <span style="font-size:0.8em;padding:2px 6px;border-radius:4px;background:${isPremium ? '#1DB954' : '#444'};color:#fff;">
                            ${isPremium ? this.t('connected') : this.t('disconnected')}
                        </span>
                    </div>
                    <p style="color:rgba(255,255,255,0.6);font-size:0.85em;margin:0 0 12px 0;">${this.t('premiumHelp')}</p>
                    
                    ${!isPremium ? `
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        
                        <!-- Step 1 -->
                        <div style="background:rgba(255,255,255,0.05);padding:10px;border-radius:6px;border-left:3px solid #1DB954;">
                            <strong style="color:#fff;display:block;margin-bottom:4px;">${this.t('step1')}</strong>
                            <span style="color:rgba(255,255,255,0.6);font-size:0.85em;display:block;margin-bottom:6px;">${this.t('step1Help')}</span>
                            <div style="position:relative;display:flex;align-items:center;gap:8px;">
                                <input id="ss2-client-id" type="password" value="${this.config.spotifyClientId || ''}" placeholder="${this.t('clientId')}" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px;border-radius:4px;" />
                                <button id="ss2-toggle-client-id" style="background:transparent;border:none;cursor:pointer;font-size:1.2em;padding:4px;" title="Toggle Visibility">👁️</button>
                            </div>
                        </div>

                        <!-- Step 2 -->
                        <div style="background:rgba(255,255,255,0.05);padding:10px;border-radius:6px;border-left:3px solid #1DB954;">
                            <strong style="color:#fff;display:block;margin-bottom:4px;">${this.t('step2')}</strong>
                            <span style="color:rgba(255,255,255,0.6);font-size:0.85em;display:block;margin-bottom:6px;">${this.t('step2Help')}</span>
                            <input id="ss2-redirect-uri" type="text" value="${this.config.spotifyRedirectUri || 'http://localhost/callback'}" readonly style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);color:#aaa;padding:6px;border-radius:4px;cursor:not-allowed;" />
                        </div>

                        <!-- Step 3 & 4 -->
                        <div style="background:rgba(255,255,255,0.05);padding:10px;border-radius:6px;border-left:3px solid #1DB954;">
                            <strong style="color:#fff;display:block;margin-bottom:4px;">${this.t('step3')}</strong>
                            <button id="ss2-auth-btn" style="background:#1DB954;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;font-weight:600;margin-bottom:12px;display:block;width:100%;">${this.t('authorize')}</button>
                            
                            <strong style="color:#fff;display:block;margin-bottom:4px;">${this.t('step4')}</strong>
                            <span style="color:rgba(255,255,255,0.6);font-size:0.85em;display:block;margin-bottom:6px;">${this.t('step4Help')}</span>
                            <div style="display:flex;gap:8px;">
                                <input id="ss2-auth-url" type="text" placeholder="${this.t('pasteUrl')}" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px;border-radius:4px;" />
                                <button id="ss2-connect-btn" style="background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2);padding:6px 12px;border-radius:4px;cursor:pointer;">${this.t('connect')}</button>
                            </div>
                        </div>

                    </div>
                    ` : `
                    <div style="display:flex;gap:10px;align-items:center;background:rgba(29,185,84,0.1);padding:10px;border-radius:6px;">
                        <div style="flex:1;">
                            <div style="color:#fff;font-weight:600;">${this.t('connectedAs')}</div>
                            <div style="color:rgba(255,255,255,0.6);font-size:0.85em;">Ready to rock! 🎸</div>
                        </div>
                        <button id="ss2-logout-btn" style="background:#ef4444;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;font-size:0.9em;">Disconnect</button>
                    </div>
                    `}
                </div >

            <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:4px 14px;margin-bottom:12px;">
                ${toggle(this.t('showControls'), 'showControls')}
                ${toggle(this.t('showAlbumArt'), 'showAlbumArt')}
                ${toggle(this.t('showProgressBar'), 'showProgressBar')}
                ${toggle(this.t('showLikeButton'), 'showLikeButton')}
                ${toggle(this.t('showShuffleRepeat'), 'showShuffleRepeat')}
                ${toggle(this.t('showVolumeSlider'), 'showVolumeSlider')}
            </div>
                ${this.config.showControls ? `
                <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 14px;margin-bottom:12px;">
                    <div style="color:rgba(255,255,255,0.7);font-size:0.85em;margin-bottom:8px;">${this.t('controlsVisibility')}</div>
                    <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;color:#fff;margin-bottom:10px;">
                        <input type="radio" name="ss2vis" value="whenOpen" ${this.config.controlsVisibility === 'whenOpen' ? 'checked' : ''} style="accent-color:#1DB954;margin-top:3px;"/>
                        <div><div>${this.t('whenOpen')}</div><div style="font-size:0.8em;color:rgba(255,255,255,0.4);">${this.t('whenOpenHint')}</div></div>
                    </label>
                    <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;color:#fff;">
                        <input type="radio" name="ss2vis" value="whenPlaying" ${this.config.controlsVisibility === 'whenPlaying' ? 'checked' : ''} style="accent-color:#1DB954;margin-top:3px;"/>
                        <div><div>${this.t('whenPlaying')}</div><div style="font-size:0.8em;color:rgba(255,255,255,0.4);">${this.t('whenPlayingHint')}</div></div>
                    </label>
                </div>` : ''
                }
        `;

            // Event listeners
            panel.querySelectorAll('.ss2-set-switch').forEach(sw => {
                sw.addEventListener('click', () => {
                    const key = sw.dataset.key;
                    this.config[key] = !this.config[key];
                    this.saveConfig();
                    if (key === 'showControls') {
                        if (this.config.showControls) this.injectWidget(); else this.removeWidget();
                    }
                    render();
                });
            });
            panel.querySelector('#ss2-lang')?.addEventListener('change', (e) => {
                this.config.language = e.target.value;
                this.saveConfig();
                render();
            });
            panel.querySelectorAll('input[name="ss2vis"]').forEach(r => {
                r.addEventListener('change', (e) => {
                    this.config.controlsVisibility = e.target.value;
                    this.saveConfig();
                });
            });

            // Auth Listeners
            panel.querySelector('#ss2-client-id')?.addEventListener('change', (e) => {
                this.config.spotifyClientId = e.target.value.trim();
                this.saveConfig();
            });
            panel.querySelector('#ss2-toggle-client-id')?.addEventListener('click', (e) => {
                const inp = panel.querySelector('#ss2-client-id');
                if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
            });
            panel.querySelector('#ss2-redirect-uri')?.addEventListener('change', (e) => {
                this.config.spotifyRedirectUri = e.target.value.trim();
                this.saveConfig();
            });
            panel.querySelector('#ss2-auth-btn')?.addEventListener('click', () => this.startPremiumAuth());
            panel.querySelector('#ss2-connect-btn')?.addEventListener('click', () => {
                const url = panel.querySelector('#ss2-auth-url')?.value.trim();
                if (url) this.finishPremiumAuth(url);
            });
            panel.querySelector('#ss2-logout-btn')?.addEventListener('click', () => {
                this.config.spotifyAccessToken = '';
                this.config.spotifyRefreshToken = '';
                this.config.spotifyTokenExpiry = 0;
                this.saveConfig();
                render();
            });
        };

        render();
        return panel;
    }

    // ═══════════════════ UI: LIST HELPER ═══════════════════
    async renderListView(type) {
        const container = document.getElementById('sth-list-view');
        if (!container) return;
        document.getElementById('ss2-widget')?.classList.add('ss2-mode-list');

        // ════════ TEMPLATES & STYLES ════════
        const CSS_SCROLLBAR = `
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
            ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
        `;

        const STYLE_CONTAINER = `
            position: absolute; inset: 0; z-index: 50;
            background: rgba(18, 18, 18, 0.98);
            backdrop-filter: blur(20px);
            display: flex; flex-direction: column;
            animation: ss2-slide-up 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
            user-select: none;
        `;

        const STYLE_HEADER = `
            flex-shrink: 0; display: flex; align-items: center; gap: 16px;
            padding: 16px 20px;
            background: rgba(255,255,255,0.03);
            border-bottom: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;

        const STYLE_LIST = `
            flex: 1; overflow-y: auto; overflow-x: hidden;
            padding: 12px; display: flex; flex-direction: column; gap: 4px;
        `;

        // ════════ DATA FETCH ════════
        // Show loading skeleton
        container.innerHTML = `
            <style>${CSS_SCROLLBAR}</style>
            <div style="${STYLE_CONTAINER}">
                <div style="${STYLE_HEADER}">
                    <div style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.1);"></div>
                    <div style="height:20px;width:100px;background:rgba(255,255,255,0.1);border-radius:4px;"></div>
                </div>
                <div style="flex:1;display:flex;align-items:center;justify-content:center;">
                    <svg viewBox="0 0 24 24" style="width:40px;height:40px;fill:rgba(255,255,255,0.2);animation:ss2-spin 1s linear infinite;"><path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/></svg>
                </div>
            </div>
        `;

        let items = [];
        let source = '';
        let title = '';
        let subTitle = '';

        try {
            if (type === 'library') {
                title = this.t('library');
                items = this._playlists || [];
                // If empty, try fetching again
                if (items.length === 0) items = await this.fetchUserPlaylists();
            } else {
                title = this.t('queue');
                const qData = await this.fetchPlayerQueue();
                items = qData.queue;
                source = qData.source;
                // Capture context LOCALLY to prevent race conditions during playback
                // This ensures we play from the context that generated this list, not whatever random state the player is in now
                var listContext = qData.context;

                if (source === 'recommendations') subTitle = this.t('recommended');
                else if (source === 'context') subTitle = this.t('contextq');
            }
        } catch (e) {
            console.error('[SpotifySync] List fetch error:', e);
            items = [];
        }

        // ════════ RENDER ════════
        const closeIcon = `<svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:currentColor;"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`;

        container.innerHTML = `
            <style>
                ${CSS_SCROLLBAR}
                @keyframes ss2-slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .sth-item { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
                .sth-item:hover { background: rgba(255,255,255,0.1); }
                .sth-item:active { background: rgba(255,255,255,0.15); transform: scale(0.99); }
            </style>
            <div style="${STYLE_CONTAINER}">
                <!-- Header -->
                <div style="${STYLE_HEADER}">
                    <button id="sth-back-btn" style="background:transparent;border:none;color:#fff;cursor:pointer;padding:4px;border-radius:50%;display:flex;">${closeIcon}</button>
                    <div style="display:flex;flex-direction:column;">
                        <span style="font-weight:700;font-size:16px;color:#fff;letter-spacing:-0.3px;">${title}</span>
                        ${subTitle ? `<span style="font-size:11px;color:#1DB954;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${subTitle}</span>` : ''}
                    </div>
                </div>

                <!-- List -->
                <div style="${STYLE_LIST}">
                    ${items.length === 0 ? `<div style="padding:40px;text-align:center;color:rgba(255,255,255,0.5);">${this.t('empty')}</div>` : ''}
                    ${items.map((item, i) => {
            const isPlaylist = type === 'library';
            const image = isPlaylist ? item.images?.[0]?.url : item.album?.images?.[0]?.url;
            const header = item.name;
            const sub = isPlaylist ? (item.owner?.display_name || '') : (item.artists?.map(a => a.name).join(', '));
            // Use explicit flags if available, otherwise fallback to index 0 for non-playlist contexts
            const isPlaying = item._isCurrent || (!isPlaylist && i === 0 && source !== 'library' && !item._isHistory);
            const isHistory = item._isHistory;
            const uri = item.uri;

            return `
                        <div class="sth-item" data-uri="${uri}" data-idx="${i}" style="${isHistory ? 'opacity:0.5;filter:grayscale(1);' : ''}">
                             <div style="position:relative;width:48px;height:48px;flex-shrink:0;border-radius:4px;overflow:hidden;box-shadow:0 4px 8px rgba(0,0,0,0.3);background:#282828;">
                                ${image ? `<img src="${image}" style="width:100%;height:100%;object-fit:cover;">` : ''}
                                ${isPlaying ? '<div style="position:absolute;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;"><div style="width:10px;height:10px;background:#1DB954;border-radius:50%;box-shadow:0 0 10px #1DB954;animation:ss2-pulse 2s infinite;"></div></div>' : ''}
                             </div>
                             <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;">
                                <span style="color:${isPlaying ? '#1DB954' : '#fff'};font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${header}</span>
                                <span style="color:rgba(255,255,255,0.6);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sub}</span>
                             </div>
                        </div>`;
        }).join('')}
                </div>
            </div>
        `;

        // ════════ EVENTS ════════
        // Back Button
        const btnBack = container.querySelector('#sth-back-btn');
        if (btnBack) btnBack.onclick = (e) => {
            e.stopPropagation();
            container.innerHTML = '';
            document.getElementById('ss2-widget')?.classList.remove('ss2-mode-list');
        };

        // Item Clicks
        container.querySelectorAll('.sth-item').forEach(el => {
            el.onclick = async (e) => {
                e.stopPropagation();
                const uri = el.dataset.uri;
                if (!uri) return;

                if (type === 'library') {
                    this.playContext(uri);
                    this.safeShowToast('Playing playlist...', { type: 'success' });
                    container.innerHTML = '';
                    document.getElementById('ss2-widget')?.classList.remove('ss2-mode-list');
                } else {
                    // Queue item click
                    try {
                        // Use captured listContext
                        const ctx = listContext;
                        this.safeShowToast('Playing...', { type: 'info' });

                        if (ctx && (ctx.type === 'playlist' || ctx.type === 'album')) {
                            try {
                                await this.playTrackInContext(ctx.uri, uri);
                            } catch (err) {
                                console.warn('[SpotifySync] Context play failed, fallback to direct:', err);
                                await this.spotifyApi('/play', 'PUT', { uris: [uri] });
                            }
                        } else {
                            await this.spotifyApi('/play', 'PUT', { uris: [uri] });
                        }
                    } catch (e) {
                        console.error('[SpotifySync] Click handler error:', e);
                        this.safeShowToast('Error playing track', { type: 'error' });
                    } finally {
                        setTimeout(() => {
                            container.innerHTML = '';
                            document.getElementById('ss2-widget')?.classList.remove('ss2-mode-list');
                        }, 500); // Delay closing slightly to allow feedback
                    }
                }
            };
        });
    }
};

/**
 * @name SpotifySync
 * @author TheDroid
 * @authorLink https://solarirpc.com
 * @description Premium Spotify controller & Rich Presence companion for Discord. Features Glassmorphism UI, dynamic album color tinting, animated rhythm visualizer, synced LRC lyrics with seek, Spotify Connect device picker, queue explorer, and 1-click Solari authentication.
 * @version 3.0.0
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
            whenOpenHint: 'Widget stays visible even when Spotify is paused/idle', whenPlaying: 'Only show when playing music',
            whenPlayingHint: 'Hides when music is paused', tokenExpired: 'Session expired! Reconnect or play a song.',
            shuffle: 'Shuffle', repeat: 'Repeat',            like: 'Save to Liked Songs', unlike: 'Remove from Liked Songs', liked: 'Saved to Liked Songs!', unliked: 'Removed from Liked Songs',
            volume: 'Volume', showAlbumArt: 'Album Art', showProgressBar: 'Progress Bar',
            showLikeButton: 'Like Button', showVolumeSlider: 'Volume Slider', showShuffleRepeat: 'Shuffle & Repeat',
            showVisualizer: 'Animated Rhythm Visualizer', dynamicTheme: 'Dynamic Album Art Color Tinting',
            showLyricsButton: 'Lyrics Button', showQueueButton: 'Queue Button', showDevicesButton: 'Spotify Connect Button',
            showPlaylistsButton: 'Playlists Button', showShareButton: 'Share Button', startCompact: 'Start in Compact Mode',
            startCompactHint: 'Always start with the player collapsed', copyArtUrl: 'Copy Album Art Link',
            openArt: 'Open Album Art', expandLyrics: 'Large Lyrics View',
            openInSpotify: 'Open in Spotify', by: 'by', on: 'on',
            share: 'Share in Chat', shareCopied: 'Link copied to clipboard!', copyTrackUrl: 'Copy Song Link',
            copyArtistUrl: 'Copy Artist Link', copyAlbumUrl: 'Copy Album Link', copied: 'Copied!',
            lyrics: 'Lyrics', noLyrics: 'No lyrics found for this song', lyricsBy: 'Lyrics via LRCLIB',
            copyLyrics: 'Copy Lyrics', lyricsCopied: 'Lyrics copied to clipboard!',
            devices: 'Spotify Connect', noDevices: 'No devices found', transferring: 'Transferring to', activeDevice: 'Active',
            queue: 'Play Queue', emptyQueue: 'No upcoming tracks in queue', recommended: 'Recommended', contextq: 'From Context',
            library: 'Your Playlists', emptyLibrary: 'No playlists found',
            // Premium Auth
            premiumTitle: 'Spotify Connection',
            premiumNoticeTitle: '👑 Spotify Premium Required for Full Powers',
            premiumNoticeDesc: 'To enjoy full powers and remote playback controls (Timeline Seek, Volume Slider, Like Songs, Next/Prev Track, Play Queue, Playlists, and Spotify Connect Device Switching), an active Spotify Premium subscription is strictly required. Free accounts have remote playback control restrictions enforced by the official Spotify API.',
            fullPowersTitle: 'Full Powers',
            fullPowersDesc: 'Remote playback commands (Volume, Timeline Seek, Skip Tracks, Playlists, and Devices) require an active Spotify Premium subscription on the linked account.',
            premiumHelp: 'Connect your Spotify account to unlock all features. An active Spotify Premium subscription is strictly required to enjoy full playback control powers.',
            step1: '1. Open Browser Login',
            step1Help: 'Click below to authorize on Spotify in your default browser.',
            step2: '2. Copy Redirect Link',
            step2Help: 'After logging in, copy the full address bar URL (e.g. http://127.0.0.1:8888/callback?code=...).',
            step3: '3. Paste Link & Connect',
            step3Help: 'Paste the copied URL or authorization code into the field below and click Connect.',
            solariAutoNotice: '⚡ 1-Click Auto-Connect: If the Solari Desktop App is running on your PC, it captures the link and connects everything automatically without copying!',
            clientId: 'Client ID',
            authorize: 'Open Spotify Login',
            pasteUrl: 'Paste redirect URL or code here...',
            connect: 'Connect Account',
            connectedAs: 'Connected to Spotify',
            status: 'Status',
            howTo: 'Instructions',
            redirectUri: 'Redirect URI',
            devSettings: 'Developer Options (Custom Client ID & Redirect URI)',
            devSettingsHelp: 'Only required if you are using your own custom Spotify Developer App.',
            disconnect: 'Disconnect Account',
            copy: 'Copy',
            premiumRequired: 'Note: Advanced controls (Volume, Seek, Queue, Devices) require Spotify Premium.',
            updateTitle: 'Update Available',
            updateDesc: 'A new version of {name} is available!',
            currentVersion: 'Current Version',
            newVersion: 'New Version',
            updateAction: 'Update Now',
            updateLater: 'Later',
            updateNotice: 'The plugin will be updated automatically and reloaded instantly in the background.',
            updateSuccess: 'Updated to v{version}!',
            changelogTitle: "What's New",
            devVersionNotice: 'Unreleased / Development Build'
        },
        'pt-BR': {
            title: 'Configurações SpotifySync', solari: 'Solari', connected: 'Conectado', disconnected: 'Desconectado',
            nowPlaying: 'Tocando Agora', notPlaying: 'Não Tocando', showControls: 'Mostrar Player',
            language: 'Idioma', connectedToSolari: 'Conectado ao Solari', disconnectedFromSolari: 'Desconectado do Solari',
            spotifySynced: 'SpotifySync: Conectado ao Solari!', previous: 'Anterior', playPause: 'Play/Pause', next: 'Próxima',
            controlsVisibility: 'Visibilidade do Widget', whenOpen: 'Sempre mostrar',
            whenOpenHint: 'Widget visível mesmo com Spotify pausado/fechado', whenPlaying: 'Mostrar apenas quando tocando',
            whenPlayingHint: 'Oculta quando a música é pausada', tokenExpired: 'Sessão expirada! Reconecte ou toque uma música.',
            shuffle: 'Aleatório', repeat: 'Repetir', repeatOff: 'Repetir Desligado', repeatAll: 'Repetir Todas', repeatOne: 'Repetir Uma',
            like: 'Salvar nas Curtidas', unlike: 'Remover das Curtidas', liked: 'Salvo nas Curtidas!', unliked: 'Removido das Curtidas',
            volume: 'Volume', showAlbumArt: 'Capa do Álbum', showProgressBar: 'Barra de Progresso',
            showLikeButton: 'Botão de Curtir', showVolumeSlider: 'Controle de Volume', showShuffleRepeat: 'Aleatório e Repetir',
            showVisualizer: 'Mini Equalizador Animado', dynamicTheme: 'Acentuação Dinâmica da Capa (Glow)',
            showLyricsButton: 'Botão de Letras', showQueueButton: 'Botão de Fila', showDevicesButton: 'Botão de Dispositivos (Connect)',
            showPlaylistsButton: 'Botão de Playlists', showShareButton: 'Botão de Compartilhar', startCompact: 'Iniciar no Modo Compacto',
            startCompactHint: 'Manter player recolhido ao iniciar o Discord', copyArtUrl: 'Copiar Link da Capa',
            openArt: 'Abrir Capa em Alta Resolução', expandLyrics: 'Modo Letras Ampliado',
            openInSpotify: 'Abrir no Spotify', by: 'por', on: 'em',
            share: 'Compartilhar no Chat', shareCopied: 'Link copiado para a área de transferência!', copyTrackUrl: 'Copiar Link da Música',
            copyArtistUrl: 'Copiar Link do Artista', copyAlbumUrl: 'Copiar Link do Álbum', copied: 'Copiado!',
            lyrics: 'Letras', noLyrics: 'Nenhuma letra encontrada para esta música', lyricsBy: 'Letras via LRCLIB',
            copyLyrics: 'Copiar Letra Completa', lyricsCopied: 'Letras copiadas para a área de transferência!',
            devices: 'Spotify Connect', noDevices: 'Nenhum dispositivo encontrado', transferring: 'Transferindo para', activeDevice: 'Ativo',
            queue: 'Fila de Reprodução', emptyQueue: 'Nenhuma faixa seguinte na fila', recommended: 'Recomendadas', contextq: 'Do Contexto',
            library: 'Suas Playlists', emptyLibrary: 'Nenhuma playlist encontrada',
            // Premium Auth
            premiumTitle: 'Conexão Spotify',
            premiumNoticeTitle: '👑 Spotify Premium Necessário para Poderes Completos',
            premiumNoticeDesc: 'Para usufruir de todos os poderes e controles de reprodução (Barra de Progresso interativa/Seek, Controle de Volume, Curtir faixas, Pular/Voltar faixas, Fila de Reprodução, Playlists e Spotify Connect), é estritamente necessária uma assinatura Spotify Premium ativa. Contas gratuitas (Free) possuem limitações técnicas impostas pela API oficial do Spotify que bloqueiam comandos de controle remoto.',
            fullPowersTitle: 'Poderes Completos',
            fullPowersDesc: 'Os comandos de controle de reprodução (Volume, Seek, Troca de Faixas, Playlists e Dispositivos) exigem que a conta vinculada possua assinatura Spotify Premium ativa.',
            premiumHelp: 'Conecte sua conta do Spotify para liberar todos os recursos. É estritamente necessária uma conta com Spotify Premium para usufruir de poderes completos!',
            step1: '1. Fazer Login no Navegador',
            step1Help: 'Clique no botão abaixo para abrir a página oficial de autorização do Spotify no seu navegador.',
            step2: '2. Copiar Link Redirecionado',
            step2Help: 'Após fazer login, copie o link completo que aparecer na barra de endereços do navegador (ex: http://127.0.0.1:8888/callback?code=...).',
            step3: '3. Colar Link e Conectar',
            step3Help: 'Cole o link completo copiado (ou apenas o código) no campo abaixo e clique em Conectar.',
            solariAutoNotice: '⚡ Conexão em 1 Clique: Se o Solari Desktop App estiver aberto no seu computador, ele captura o link e conclui a conexão automaticamente sem você precisar colar nada!',
            clientId: 'Client ID',
            authorize: 'Abrir Login do Spotify',
            pasteUrl: 'Cole aqui a URL de redirecionamento ou código...',
            connect: 'Conectar Conta',
            connectedAs: 'Conectado ao Spotify',
            status: 'Status',
            howTo: 'Instruções',
            redirectUri: 'Redirect URI',
            devSettings: 'Opções de Desenvolvedor (Client ID & Redirect URI)',
            devSettingsHelp: 'Necessário apenas se você estiver utilizando uma aplicação própria no Spotify Developer Dashboard.',
            disconnect: 'Desconectar Conta',
            copy: 'Copiar',
            premiumRequired: 'Nota: Controles avançados (Volume, Seek, Fila, Dispositivos) exigem Spotify Premium.',
            updateTitle: 'Atualização Disponível',
            updateDesc: 'Uma nova versão do {name} está disponível!',
            currentVersion: 'Versão Atual',
            newVersion: 'Nova Versão',
            updateAction: 'Atualizar Agora',
            updateLater: 'Depois',
            updateNotice: 'O plugin será atualizado automaticamente e recarregado em segundo plano de forma instantânea.',
            updateSuccess: 'Atualizado para v{version}!',
            changelogTitle: "O que há de novo",
            devVersionNotice: 'Versão em Desenvolvimento / Indefinida'
        },
        es: {
            title: 'SpotifySync Configuración', solari: 'Solari', connected: 'Conectado', disconnected: 'Desconectado',
            nowPlaying: 'Reproduciendo', notPlaying: 'Sin Reproducir', showControls: 'Mostrar Reproductor',
            language: 'Idioma', connectedToSolari: 'Conectado a Solari', disconnectedFromSolari: 'Desconectado de Solari',
            spotifySynced: 'SpotifySync: ¡Conectado a Solari!', previous: 'Anterior', playPause: 'Play/Pausa', next: 'Siguiente',
            controlsVisibility: 'Visibilidad del Widget', whenOpen: 'Siempre mostrar',
            whenOpenHint: 'Widget visible incluso con Spotify en pausa/cerrado', whenPlaying: 'Solo mostrar cuando hay música',
            whenPlayingHint: 'Se oculta cuando la música está pausada', tokenExpired: '¡Sesión expirada! Vuelve a conectar o reproduce una canción.',
            shuffle: 'Aleatorio', repeat: 'Repetir', repeatOff: 'Repetir Desactivado', repeatAll: 'Repetir Todo', repeatOne: 'Repetir Una',
            like: 'Guardar en Favoritos', unlike: 'Quitar de Favoritos', liked: '¡Guardado en Favoritos!', unliked: 'Eliminado de Favoritos',
            volume: 'Volumen', showAlbumArt: 'Carátula', showProgressBar: 'Barra de Progresso',
            showLikeButton: 'Botón Me Gusta', showVolumeSlider: 'Control de Volumen', showShuffleRepeat: 'Aleatorio y Repetir',
            showVisualizer: 'Ecualizador Animado', dynamicTheme: 'Color Dinámico de Portada',
            showLyricsButton: 'Botón de Letras', showQueueButton: 'Botón de Cola', showDevicesButton: 'Botón de Dispositivos (Connect)',
            showPlaylistsButton: 'Botón de Playlists', showShareButton: 'Botón de Compartir', startCompact: 'Iniciar en Modo Compacto',
            startCompactHint: 'Mantener reproductor colapsado al iniciar', copyArtUrl: 'Copiar Enlace de Portada',
            openArt: 'Abrir Portada en Pantalla Completa', expandLyrics: 'Modo Letras Ampliado',
            openInSpotify: 'Abrir en Spotify', by: 'por', on: 'en',
            share: 'Compartir en Chat', shareCopied: '¡Enlace copiado al portapapeles!', copyTrackUrl: 'Copiar Enlace de Canción',
            copyArtistUrl: 'Copiar Enlace del Artista', copyAlbumUrl: 'Copiar Enlace del Álbum', copied: '¡Copiado!',
            lyrics: 'Letras', noLyrics: 'No se encontraron letras para esta canción', lyricsBy: 'Letras via LRCLIB',
            copyLyrics: 'Copiar Letras', lyricsCopied: '¡Letras copiadas al portapapeles!',
            devices: 'Spotify Connect', noDevices: 'No se encontraron dispositivos', transferring: 'Transfiriendo a', activeDevice: 'Activo',
            queue: 'Cola de Reproducción', emptyQueue: 'No hay canciones en cola', recommended: 'Recomendadas', contextq: 'Del Contexto',
            library: 'Tus Playlists', emptyLibrary: 'No se encontraron playlists',
            // Premium Auth
            premiumTitle: 'Conexión Spotify',
            premiumNoticeTitle: '👑 Spotify Premium Necesario para Poderes Completos',
            premiumNoticeDesc: 'Para disfrutar de todos los poderes y controles de reproducción (Seek en la barra, Control de Volumen, Me Gusta, Saltar Pistas, Cola de Reproducción, Playlists y Spotify Connect), se requiere estrictamente una suscripción Spotify Premium activa. Las cuentas gratuitas tienen restricciones de control remoto impuestas por la API oficial de Spotify.',
            fullPowersTitle: 'Poderes Completos',
            fullPowersDesc: 'Los comandos de reproducción remota (Volumen, Seek, Cambio de Canción, Playlists y Dispositivos) requieren que la cuenta vinculada tenga Spotify Premium activo.',
            premiumHelp: 'Conecta tu cuenta Spotify para desbloquear todas las funciones. ¡Se necesita estrictamente una cuenta con Spotify Premium para tener poderes completos!',
            step1: '1. Iniciar Sesión en el Navegador',
            step1Help: 'Haz clic en el botón de abajo para abrir la autorización de Spotify en tu navegador.',
            step2: '2. Copiar Enlace Redirigido',
            step2Help: 'Tras autorizar, copia el enlace completo de la barra de direcciones (ej: http://127.0.0.1:8888/callback?code=...).',
            step3: '3. Pegar Enlace y Conectar',
            step3Help: 'Pega el enlace copiado o código en el campo de abajo y haz clic en Conectar.',
            solariAutoNotice: '⚡ Conexión Automática: Si Solari App está abierta, captura el enlace y conecta automáticamente.',
            clientId: 'Client ID',
            authorize: 'Abrir Login de Spotify',
            pasteUrl: 'Pega aquí el enlace de redirección o código...',
            connect: 'Conectar Cuenta',
            connectedAs: 'Conectado a Spotify',
            status: 'Estado',
            howTo: 'Instrucciones',
            redirectUri: 'Redirect URI',
            devSettings: 'Opciones de Desarrollador (Client ID y Redirect URI)',
            devSettingsHelp: 'Solo necesario si utilizas una aplicación propia de desarrollador.',
            disconnect: 'Desconectar Cuenta',
            copy: 'Copiar',
            premiumRequired: 'Nota: Controles avanzados (Volumen, Seek, Cola, Dispositivos) requieren Spotify Premium.',
            updateTitle: 'Actualización Disponible',
            updateDesc: '¡Una nueva versión de {name} está disponible!',
            currentVersion: 'Versión Actual',
            newVersion: 'Nueva Versión',
            updateAction: 'Actualizar Ahora',
            updateNotice: 'El plugin se actualizará automáticamente y se recargará en segundo plano.',
            updateSuccess: '¡Actualizado a v{version}!',
            changelogTitle: "Novedades",
            devVersionNotice: 'Versión en Desarrollo / Indefinida'
        }
    };

    // ═══════════════════ CONSTRUCTOR ═══════════════════
    constructor(meta) {
        this.meta = meta;
        this.ws = null;
        this.shouldReconnect = false;
        this.isConnectedToSolari = false;
        this.widgetElement = null;

        // Playback state cache
        this._trackId = null;
        this._positionMs = 0;
        this._durationMs = 0;
        this._positionTimestamp = 0;
        this._isPlaying = false;
        this._isLiked = false;
        this._likeCheckPending = false;
        this._shuffleState = false;
        this._repeatState = 'off'; // 'off' | 'context' | 'track'
        this._volumePercent = 100;
        this._lastFullStateTime = 0;
        this._albumArtUrl = null;
        this._expanded = false;
        this._activeSubView = null; // null | 'lyrics' | 'queue' | 'library' | 'devices'
        this._isLyricsFullscreen = false;
        this._artistIds = [];
        this._albumId = null;
        this._context = null;

        // Beat Sync & Audio Features
        this._audioFeaturesCache = new Map();
        this._currentBpm = 120;
        this._currentEnergy = 0.7;
        this._lastFeaturesTrackId = null;
        this._volOverlayTimeout = null;

        // Performance & Animation Frame Loop
        this._rafId = null;
        this._fluxUnsubscribe = null;
        this._heartbeatInterval = null;
        this._lyricsInterval = null;
        this._premiumPollInterval = null;
        this._observer = null;

        // Color extraction cache: { [url]: { accent, glow, bg } }
        this._colorCache = new Map();
        this._currentAccent = '#1DB954';
        this._currentGlow = 'rgba(29, 185, 84, 0.3)';

        // Lyrics Cache
        this._lyricsCache = {};

        // Configuration
        this.config = {
            enabled: true,
            showControls: true,
            showAlbumArt: true,
            showProgressBar: true,
            showLikeButton: true,
            showVolumeSlider: true,
            showShuffleRepeat: true,
            showVisualizer: true,
            dynamicTheme: true,
            controlsVisibility: 'whenPlaying', // 'whenOpen' | 'whenPlaying'
            showLyricsButton: true,
            showQueueButton: true,
            showDevicesButton: true,
            showPlaylistsButton: true,
            showShareButton: true,
            startCompact: false,
            language: 'pt-BR',
            serverUrl: 'ws://127.0.0.1:6464', // Solari App Master WebSocket Port
            // Auth Keys
            spotifyClientId: '',
            spotifyAccessToken: '',
            spotifyRefreshToken: '',
            spotifyTokenExpiry: 0,
            spotifyVerifier: '',
            spotifyRedirectUri: 'http://127.0.0.1:8888/callback',
            _userDisplayName: '',
            _userProduct: ''
        };

        this.lastControlTime = 0;
        this._refreshPromise = null;
        this._boundAnimLoop = this._animLoop.bind(this);
        this._boundVisibilityChange = this._handleVisibilityChange.bind(this);
    }

    // ═══════════════════ INTERNAL WEBPACK MODULE FINDER ═══════════════════
    getSpotifyModules() {
        if (this._cachedActionCreators) return this._cachedActionCreators;

        try {
            const strategies = [
                m => m && typeof m.play === 'function' && typeof m.pause === 'function' && typeof m.skipNext === 'function',
                m => m && typeof m.saveTrack === 'function' && typeof m.play === 'function',
                m => m && typeof m.sync === 'function' && typeof m.play === 'function',
                m => m && typeof m.setActiveDevice === 'function' && typeof m.play === 'function',
                m => m && typeof m.getAccessToken === 'function' && typeof m.play === 'function'
            ];

            for (const filter of strategies) {
                const mod = BdApi.Webpack.getModule(filter, { first: true, searchExports: true });
                if (mod && !mod.loadAnimation && !mod.resize) {
                    this._cachedActionCreators = mod;
                    return mod;
                }
            }

            // Fallback scan
            const fallback = BdApi.Webpack.getModule(m => m && m.getAccessToken, { first: true, searchExports: true });
            if (fallback) {
                this._cachedActionCreators = fallback;
                return fallback;
            }
        } catch (e) {
            console.warn('[SpotifySync] Webpack module scan error:', e);
        }

        return null;
    }

    // ═══════════════════ SETTINGS SCHEMA (SOLARI DESKTOP APP) ═══════════════════
    getSettingsSchema() {
        const isPremium = this.hasPremium();
        const premiumStatus = isPremium ? 'connected' : 'disconnected';

        const displayChildren = [
            { type: 'toggle', key: 'showControls', label: this.t('showControls') },
            { type: 'toggle', key: 'startCompact', label: this.t('startCompact') },
            { type: 'toggle', key: 'showAlbumArt', label: this.t('showAlbumArt') },
            { type: 'toggle', key: 'showProgressBar', label: this.t('showProgressBar') },
            { type: 'toggle', key: 'showVisualizer', label: this.t('showVisualizer') },
            { type: 'toggle', key: 'dynamicTheme', label: this.t('dynamicTheme') },
            { type: 'toggle', key: 'showVolumeSlider', label: this.t('showVolumeSlider') },
            { type: 'toggle', key: 'showLyricsButton', label: this.t('showLyricsButton') },
            { type: 'toggle', key: 'showShareButton', label: this.t('showShareButton') },
            {
                type: 'select', key: 'controlsVisibility', label: this.t('controlsVisibility'), options: [
                    { value: 'whenPlaying', label: this.t('whenPlaying'), hint: this.t('whenPlayingHint') },
                    { value: 'whenOpen', label: this.t('whenOpen'), hint: this.t('whenOpenHint') }
                ]
            }
        ];

        // Options that strictly require a connected Spotify Premium account
        if (isPremium) {
            displayChildren.splice(7, 0,
                { type: 'toggle', key: 'showLikeButton', label: this.t('showLikeButton') },
                { type: 'toggle', key: 'showShuffleRepeat', label: this.t('showShuffleRepeat') },
                { type: 'toggle', key: 'showQueueButton', label: this.t('showQueueButton') },
                { type: 'toggle', key: 'showDevicesButton', label: this.t('showDevicesButton') },
                { type: 'toggle', key: 'showPlaylistsButton', label: this.t('showPlaylistsButton') }
            );
        }

        return [
            { type: 'custom_header', title: this.t('title'), version: this.meta.version || '3.0.0' },
            { type: 'status_card', id: 'solariStatus', label: this.t('solari'), status: this.isConnectedToSolari ? 'connected' : 'disconnected' },
            {
                type: 'group', label: 'Display & Aesthetics', children: displayChildren
            },
            {
                type: 'section_card',
                title: this.t('premiumTitle'),
                status: premiumStatus,
                statusLabel: premiumStatus === 'connected' ? this.t('connected') : this.t('disconnected'),
                description: `<div style="background: rgba(29, 185, 84, 0.1); border-left: 4px solid #1DB954; padding: 10px; margin-bottom: 15px; color: #1DB954; font-weight: bold;">👑 ${this.t('premiumHelp')}</div>`,
                children: [
                    {
                        type: 'step_card',
                        step: 1,
                        title: this.t('step1'),
                        text: `${this.t('step1Help')}\n\n${this.t('solariAutoNotice')}`,
                        action: { label: this.t('authorize'), id: 'authBtn', action: 'start_auth', style: 'spotify' }
                    },
                    {
                        type: 'step_card',
                        step: 2,
                        title: this.t('step3'),
                        text: this.t('step3Help'),
                        input: {
                            placeholder: this.t('pasteUrl'),
                            id: 'finishAuthBtn',
                            action: 'finish_auth',
                            btnLabel: this.t('connect')
                        }
                    },
                    {
                        type: 'step_card',
                        step: 3,
                        title: this.t('step2'),
                        text: this.t('step2Help'),
                        copyValue: this.config.spotifyRedirectUri || 'http://127.0.0.1:8888/callback',
                        copyLabel: this.t('redirectUri')
                    },
                    {
                        type: 'step_card',
                        step: 4,
                        title: this.t('clientId'),
                        text: this.t('devSettingsHelp'),
                        inputConfig: {
                            key: 'spotifyClientId',
                            value: this.config.spotifyClientId || '',
                            editable: true,
                            secret: true,
                            placeholder: 'Paste Spotify Client ID (or leave empty for Solari default)',
                            label: this.t('clientId')
                        }
                    }
                ]
            }
        ];
    }

    // ═══════════════════ LIFECYCLE ═══════════════════
    start() {
        console.log(`[SpotifySync] Starting v${this.meta.version || '3.0.0'} (Next-Gen)...`);
        this.loadConfig();
        this.checkChangelog();
        this.checkForUpdates();

        // 1. Connect to Solari WebSocket on port 6464
        this.connectToServer();

        // 2. Setup Discord Event Subscriptions (Flux Architecture)
        this.setupFluxSubscriptions();

        // 3. Setup Window Visibility Listener for Power/CPU Saving
        document.addEventListener('visibilitychange', this._boundVisibilityChange);

        // 4. Inject Player Widget into Sidebar
        if (this.config.showControls) {
            this.injectWidget();
        }

        // 5. Start Background Heartbeat & Fallback Polling (Safe 5s interval, no spam)
        this.startHeartbeat();

        // 6. Warm up Spotify modules
        setTimeout(() => {
            this.getSpotifyModules();
        }, 1500);
    }

    stop() {
        console.log('[SpotifySync] Stopping...');
        this.shouldReconnect = false;

        // Teardown Event Subscriptions
        if (typeof this._fluxUnsubscribe === 'function') {
            this._fluxUnsubscribe();
            this._fluxUnsubscribe = null;
        }

        document.removeEventListener('visibilitychange', this._boundVisibilityChange);

        // Stop RAF Loop
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }

        // Stop intervals
        if (this._heartbeatInterval) {
            clearInterval(this._heartbeatInterval);
            this._heartbeatInterval = null;
        }
        if (this._lyricsInterval) {
            clearInterval(this._lyricsInterval);
            this._lyricsInterval = null;
        }
        if (this._premiumPollInterval) {
            clearInterval(this._premiumPollInterval);
            this._premiumPollInterval = null;
        }

        // Disconnect MutationObserver
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }

        // Disconnect WebSocket
        if (this.ws) {
            this.ws.onclose = null;
            this.ws.close();
            this.ws = null;
        }

        // Clean DOM & Settings Panel references
        this.removeWidget();
        document.querySelectorAll('.ss2-ctx-menu').forEach(m => m.remove());
        this._activeSettingsPanel = null;
        this._refreshSettingsPanel = null;
        this._authWaiting = false;
        this._isConnectingAuth = false;
    }

    // ═══════════════════ DISCORD FLUX & STATE DISCOVERY ═══════════════════
    setupFluxSubscriptions() {
        try {
            const Dispatcher = BdApi.Webpack.getModule(m => m.dispatch && m.subscribe);
            if (Dispatcher) {
                const handler = (event) => {
                    if (!this.config.enabled) return;
                    // React to Spotify state updates immediately
                    this.syncStateWithDiscord(event);
                };

                const events = [
                    'SPOTIFY_PLAYER_STATE',
                    'SPOTIFY_SET_DEVICES',
                    'SPOTIFY_ACCOUNT_ADD',
                    'SPOTIFY_ACCOUNT_REMOVE',
                    'LOCAL_ACTIVITY_UPDATE',
                    'PRESENCE_UPDATES'
                ];

                events.forEach(evt => Dispatcher.subscribe(evt, handler));
                this._fluxUnsubscribe = () => {
                    events.forEach(evt => {
                        try { Dispatcher.unsubscribe(evt, handler); } catch (e) { }
                    });
                };

                console.log('[SpotifySync] Discord Flux Dispatcher connected successfully.');
            }
        } catch (e) {
            console.warn('[SpotifySync] Flux subscription fallback:', e);
        }
    }

    _handleVisibilityChange() {
        if (document.hidden) {
            // Stop RAF progress loop to save CPU & battery
            if (this._rafId) {
                cancelAnimationFrame(this._rafId);
                this._rafId = null;
            }
        } else {
            // Resume progress loop if music is playing
            if (this._isPlaying) {
                this._startProgressLoop();
            }
            this.syncStateWithDiscord();
        }
    }

    // ═══════════════════ PROGRESS BAR (RAF 60FPS SMOOTH) ═══════════════════
    _startProgressLoop() {
        if (this._rafId) return;
        this._rafId = requestAnimationFrame(this._boundAnimLoop);
    }

    _animLoop() {
        if (!this._isPlaying || !this._durationMs || document.hidden) {
            this._rafId = null;
            return;
        }

        const elapsed = Date.now() - this._positionTimestamp;
        const currentPos = Math.min(this._positionMs + elapsed, this._durationMs);
        const pct = (currentPos / this._durationMs) * 100;

        const fill = document.getElementById('ss2-progress-fill');
        const timeEl = document.getElementById('ss2-time-current');
        const remEl = document.getElementById('ss2-time-remaining');
        const miniFill = document.getElementById('ss2-mini-progress-fill');

        if (fill) fill.style.width = `${pct}%`;
        if (miniFill) miniFill.style.width = `${pct}%`;
        if (timeEl) timeEl.textContent = this.formatTime(currentPos);
        if (remEl) remEl.textContent = '-' + this.formatTime(Math.max(0, this._durationMs - currentPos));

        this._rafId = requestAnimationFrame(this._boundAnimLoop);
    }

    // ═══════════════════ DYNAMIC COLOR EXTRACTOR ═══════════════════
    async extractDominantColor(imgUrl) {
        if (!imgUrl || !this.config.dynamicTheme) {
            return { accent: '#1DB954', glow: 'rgba(29, 185, 84, 0.3)', bg: 'rgba(29, 185, 84, 0.08)' };
        }

        if (this._colorCache.has(imgUrl)) {
            return this._colorCache.get(imgUrl);
        }

        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 32;
                    canvas.height = 32;
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    ctx.drawImage(img, 0, 0, 32, 32);
                    const data = ctx.getImageData(0, 0, 32, 32).data;

                    let bestColor = null;
                    let bestScore = -1;

                    for (let i = 0; i < data.length; i += 16) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];

                        const max = Math.max(r, g, b);
                        const min = Math.min(r, g, b);
                        const delta = max - min;
                        const sat = max === 0 ? 0 : delta / max;
                        const lum = (max + min) / 510;

                        // Filter out dark/near-white colors, favor vibrant hues
                        if (lum > 0.18 && lum < 0.82 && sat > 0.22) {
                            const score = sat * (1 - Math.abs(lum - 0.5));
                            if (score > bestScore) {
                                bestScore = score;
                                bestColor = { r, g, b };
                            }
                        }
                    }

                    if (bestColor) {
                        const { r, g, b } = bestColor;
                        const accent = `rgb(${r}, ${g}, ${b})`;
                        const glow = `rgba(${r}, ${g}, ${b}, 0.35)`;
                        const bg = `rgba(${r}, ${g}, ${b}, 0.12)`;
                        const result = { accent, glow, bg };
                        this._colorCache.set(imgUrl, result);
                        resolve(result);
                        return;
                    }
                } catch (e) { }

                // Fallback to Spotify Green
                const fallback = { accent: '#1DB954', glow: 'rgba(29, 185, 84, 0.3)', bg: 'rgba(29, 185, 84, 0.08)' };
                this._colorCache.set(imgUrl, fallback);
                resolve(fallback);
            };

            img.onerror = () => {
                const fallback = { accent: '#1DB954', glow: 'rgba(29, 185, 84, 0.3)', bg: 'rgba(29, 185, 84, 0.08)' };
                resolve(fallback);
            };

            img.src = imgUrl;
        });
    }

    applyDynamicTheme(colors) {
        const widget = document.getElementById('ss2-widget');
        if (!widget || !colors) return;

        this._currentAccent = colors.accent;
        this._currentGlow = colors.glow;

        widget.style.setProperty('--ss-accent', colors.accent);
        widget.style.setProperty('--ss-accent-glow', colors.glow);
        widget.style.setProperty('--ss-accent-bg', colors.bg);
    }

    // ═══════════════════ STATE DETECTION ENGINE ═══════════════════
    getSpotifyState() {
        try {
            // Method 0: Direct SpotifyStore (Discord Internal)
            const SpotifyStore = BdApi.Webpack.getModule(m => m.getTrack && m.getPlaybackState);
            if (SpotifyStore) {
                const track = SpotifyStore.getTrack?.();
                const pb = SpotifyStore.getPlaybackState?.();
                if (track) {
                    const art = track.album?.image?.url || track.album?.images?.[0]?.url || null;
                    this._artistIds = (track.artists || []).map(a => ({ name: a.name, id: a.id }));
                    this._albumId = track.album?.id || null;
                    return {
                        isPlaying: pb?.isPlaying === true,
                        isSpotifyOpen: true,
                        track: {
                            title: track.name || 'Unknown',
                            artist: track.artists?.map(a => a.name).join(', ') || 'Unknown',
                            album: track.album?.name || '',
                            albumArtUrl: art,
                            trackId: track.id || null,
                            duration: track.duration || 0,
                            position: pb?.position || 0,
                            _config: this.config
                        }
                    };
                }

                // Check socket for open but paused player
                const socket = BdApi.Webpack.getModule(m => m.getActiveSocketAndDevice);
                if (socket?.getActiveSocketAndDevice()?.socket) {
                    return {
                        isPlaying: false,
                        isSpotifyOpen: true,
                        track: {
                            title: this.t('notPlaying'),
                            artist: '',
                            album: '',
                            albumArtUrl: null,
                            trackId: null,
                            duration: 0,
                            position: 0,
                            _config: this.config
                        }
                    };
                }
            }

            // Method 1: ActivityStore (Rich Presence activity)
            const ActivityStore = BdApi.Webpack.getModule(m => m.getActivity && m.getName?.() === 'SpotifyStore');
            if (ActivityStore) {
                const act = ActivityStore.getActivity();
                if (act?.type === 2) {
                    const art = act.assets?.large_image ? `https://i.scdn.co/image/${act.assets.large_image.replace('spotify:', '')}` : null;
                    return {
                        isPlaying: true,
                        isSpotifyOpen: true,
                        track: {
                            title: act.details || 'Unknown',
                            artist: act.state || 'Unknown',
                            album: act.assets?.large_text || '',
                            albumArtUrl: art,
                            trackId: act.sync_id || null,
                            duration: act.timestamps?.end && act.timestamps?.start ? act.timestamps.end - act.timestamps.start : 0,
                            position: act.timestamps?.start ? Date.now() - act.timestamps.start : 0
                        }
                    };
                }
            }

            // Method 2: PresenceStore for Current User
            const UserStore = BdApi.Webpack.getModule(m => m.getCurrentUser);
            const PresenceStore = BdApi.Webpack.getModule(m => m.getActivities);
            if (UserStore && PresenceStore) {
                const user = UserStore.getCurrentUser();
                if (user) {
                    const sa = PresenceStore.getActivities(user.id)?.find(a => a.type === 2 && a.name === 'Spotify');
                    if (sa) {
                        const art = sa.assets?.large_image ? `https://i.scdn.co/image/${sa.assets.large_image.replace('spotify:', '')}` : null;
                        return {
                            isPlaying: true,
                            isSpotifyOpen: true,
                            track: {
                                title: sa.details || 'Unknown',
                                artist: sa.state || 'Unknown',
                                album: sa.assets?.large_text || '',
                                albumArtUrl: art,
                                trackId: sa.sync_id || null,
                                duration: sa.timestamps?.end && sa.timestamps?.start ? sa.timestamps.end - sa.timestamps.start : 0,
                                position: sa.timestamps?.start ? Date.now() - sa.timestamps.start : 0,
                                _config: this.config
                            }
                        };
                    }
                }
            }

            // Always Show fallback if configured
            if (this.config.controlsVisibility === 'whenOpen') {
                return {
                    isPlaying: false,
                    isSpotifyOpen: true,
                    track: {
                        title: this.t('notPlaying'),
                        artist: '',
                        album: '',
                        albumArtUrl: null,
                        trackId: null,
                        duration: 0,
                        position: 0,
                        _config: this.config
                    }
                };
            }

            return { isPlaying: false, isSpotifyOpen: false, track: null };
        } catch (e) {
            console.warn('[SpotifySync] getSpotifyState exception:', e);
            return { isPlaying: false, isSpotifyOpen: false, track: null };
        }
    }

    async syncStateWithDiscord(event = null) {
        // 1. Sync volume from Discord event or active socket device
        if (event) {
            const devVol = event.device?.volume_percent 
                ?? event.volumePercent 
                ?? event.devices?.find(d => d.is_active)?.volume_percent;
            if (typeof devVol === 'number') {
                this.updateVolumeSliders(devVol);
            }
        }

        try {
            const store = BdApi.Webpack.getModule(m => m?.getActiveSocketAndDevice);
            const sd = store?.getActiveSocketAndDevice?.();
            if (sd?.device && typeof sd.device.volume_percent === 'number') {
                this.updateVolumeSliders(sd.device.volume_percent);
            }
        } catch (e) { }

        // 2. If user has Spotify Premium connected, sync live device volume & playback state
        if (this.hasPremium()) {
            const now = Date.now();
            if (!this._lastApiSync || (now - this._lastApiSync > 3500) || event?.type === 'SPOTIFY_SET_DEVICES' || event?.type === 'SPOTIFY_PLAYER_STATE') {
                this._lastApiSync = now;
                this.syncPlaybackStateFromApi();
            }
        }

        let state = this.getSpotifyState();
        let shouldShow = this.config.controlsVisibility === 'whenOpen'
            ? state.isSpotifyOpen
            : (state.isPlaying && state.track);

        // Premium AFK Fallback: if Discord Store has no track but user is linked to Spotify API
        const hasRealTrack = state.track && state.track.trackId;
        if (!hasRealTrack && this.hasPremium()) {
            const fallback = await this.getSpotifyStatePremiumFallback();
            if (fallback && fallback.track && fallback.track.trackId) {
                state = fallback;
                shouldShow = true;
            }
        }

        if (shouldShow && state.track) {
            // Track changed?
            if (state.track.trackId && state.track.trackId !== this._trackId) {
                this._trackId = state.track.trackId;
                this.checkIfLiked(this._trackId);

                // Extract and apply dynamic artwork palette
                if (state.track.albumArtUrl) {
                    this.extractDominantColor(state.track.albumArtUrl).then(colors => {
                        this.applyDynamicTheme(colors);
                    });
                }
            }

            this._isPlaying = state.isPlaying;
            this._positionMs = state.track.position || 0;
            this._durationMs = state.track.duration || 0;
            this._positionTimestamp = Date.now();
            this._albumArtUrl = state.track.albumArtUrl;

            this.updateWidget(state.track, state.isPlaying);

            if (this._isPlaying) {
                this._startProgressLoop();
            }

            // Send playback state to Solari Desktop App for RPC synchronization
            this.send({ type: 'spotify_state', state: { isPlaying: this._isPlaying, track: state.track } });
        } else {
            this.hideWidget();
        }
    }

    // Background Heartbeat for Resilience (Every 5s)
    startHeartbeat() {
        if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
        this._heartbeatInterval = setInterval(() => {
            if (!this.config.enabled) return;
            this.syncStateWithDiscord();
        }, 5000);
    }

    // ═══════════════════ SPOTIFY WEB API CLIENT ═══════════════════
    async getAccessToken(ignorePremium = false) {
        // 1. Check Premium OAuth Tokens
        if (!ignorePremium && this.config.spotifyAccessToken && this.config.spotifyRefreshToken) {
            if (Date.now() > this.config.spotifyTokenExpiry - 60000) {
                await this.refreshPremiumToken();
            }
            if (this.config.spotifyAccessToken) return this.config.spotifyAccessToken;
        }

        // 2. Resolve Account ID from Discord Internal Stores
        let resolvedToken = null;
        try {
            const store = BdApi.Webpack.getModule(m => m?.getActiveSocketAndDevice);
            if (store) {
                const sd = store.getActiveSocketAndDevice();
                if (sd?.socket?.accountId) {
                    this.accountId = sd.socket.accountId;
                    resolvedToken = sd.socket.accessToken;
                }
            }
            if (!this.accountId) {
                const accountStore = BdApi.Webpack.getModule(m => m?.getAccounts);
                if (accountStore) {
                    const accounts = accountStore.getAccounts();
                    for (const id in accounts) {
                        if (accounts[id]?.type === 'spotify') {
                            this.accountId = id;
                            resolvedToken = accounts[id].accessToken;
                            break;
                        }
                    }
                }
            }
        } catch (e) { }

        // 3. Force Refresh via Discord ActionCreators if requested
        if (ignorePremium && this.accountId) {
            try {
                const actionCreators = this.getSpotifyModules();
                if (actionCreators?.getAccessToken) {
                    const newToken = await actionCreators.getAccessToken(this.accountId);
                    if (newToken) {
                        return (typeof newToken === 'string') ? newToken : newToken.accessToken;
                    }
                }
            } catch (e) { }
        }

        return resolvedToken;
    }

    async refreshPremiumToken() {
        if (!this.config.spotifyRefreshToken) return false;

        if (this._refreshPromise) {
            return this._refreshPromise;
        }

        this._refreshPromise = (async () => {
            try {
                const body = new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: this.config.spotifyRefreshToken,
                    client_id: this.config.spotifyClientId || '8483b8b60a3c4803b9ad6f4cbe5fb901' // Solari Default Client ID
                });

                const res = await fetch('https://accounts.spotify.com/api/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body
                });
                const data = await res.json();

                if (data.error) {
                    if (data.error === 'invalid_grant') {
                        console.warn('[SpotifySync] Token revoked or invalid.');
                        this.config.spotifyAccessToken = '';
                        this.config.spotifyRefreshToken = '';
                        this.config.spotifyTokenExpiry = 0;
                        this.saveConfig();
                    }
                    return false;
                }

                this.config.spotifyAccessToken = data.access_token;
                if (data.refresh_token) this.config.spotifyRefreshToken = data.refresh_token;
                this.config.spotifyTokenExpiry = Date.now() + (data.expires_in * 1000);
                this.saveConfig();
                return true;
            } catch (e) {
                console.error('[SpotifySync] Refresh Token error:', e);
                return false;
            } finally {
                this._refreshPromise = null;
            }
        })();

        return this._refreshPromise;
    }

    async spotifyApi(endpoint, method = 'GET', body = null, isPlayer = true) {
        let token = await this.getAccessToken(false);
        if (!token) return null;

        const makeRequest = async (t) => {
            const base = isPlayer ? 'https://api.spotify.com/v1/me/player' : 'https://api.spotify.com/v1';
            const url = `${base}${endpoint}`;
            const opts = {
                method,
                headers: {
                    'Authorization': `Bearer ${t}`,
                    'Content-Type': 'application/json'
                }
            };
            if (body) opts.body = JSON.stringify(body);
            return fetch(url, opts);
        };

        try {
            let res = await makeRequest(token);

            // Rate Limit: 429 Retry-After Handling
            if (res.status === 429) {
                const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
                console.warn(`[SpotifySync] Rate limited (429). Retrying after ${retryAfter}s...`);
                await new Promise(r => setTimeout(r, (retryAfter + 1) * 1000));
                res = await makeRequest(token);
            }

            // Unauthorized: 401 Recovery
            if (res.status === 401) {
                const refreshed = await this.refreshPremiumToken();
                if (refreshed) {
                    token = this.config.spotifyAccessToken;
                    res = await makeRequest(token);
                } else {
                    token = await this.getAccessToken(true);
                    if (token) res = await makeRequest(token);
                }
            }

            if (res.status === 204) return true;
            if (res.ok) {
                try { return await res.json(); } catch { return true; }
            }

            // Forbidden: 403 (Player command failed: Spotify Premium required)
            if (res.status === 403 && isPlayer) {
                this.safeShowToast('👑 ' + this.t('premiumNoticeTitle') + '!', { type: 'warning' });
                return null;
            }

            return null;
        } catch (e) {
            console.error('[SpotifySync] API Error:', e);
            return null;
        }
    }

    async getSpotifyStatePremiumFallback() {
        if (!this.hasPremium()) return null;
        try {
            const data = await this.spotifyApi('', 'GET');
            if (!data || !data.item) return null;

            const track = data.item;
            const art = track.album?.images?.[0]?.url || null;
            this._artistIds = (track.artists || []).map(a => ({ name: a.name, id: a.id }));
            this._albumId = track.album?.id || null;
            this._volumePercent = data.device?.volume_percent ?? this._volumePercent;
            this._shuffleState = data.shuffle_state ?? false;
            this._repeatState = data.repeat_state ?? 'off';
            if (data.context) this._context = data.context;

            return {
                isPlaying: data.is_playing === true,
                isSpotifyOpen: true,
                track: {
                    title: track.name || 'Unknown',
                    artist: track.artists?.map(a => a.name).join(', ') || 'Unknown',
                    album: track.album?.name || '',
                    albumArtUrl: art,
                    trackId: track.id || null,
                    duration: track.duration_ms || 0,
                    position: data.progress_ms || 0,
                    _config: this.config
                }
            };
        } catch (e) {
            return null;
        }
    }

    updateVolumeSliders(vol = this._volumePercent) {
        if (typeof vol !== 'number' || isNaN(vol)) return;
        this._volumePercent = Math.max(0, Math.min(100, Math.round(vol)));

        const volSlider = document.getElementById('ss2-vol-slider');
        if (volSlider && volSlider !== document.activeElement) {
            volSlider.value = this._volumePercent;
        }
        const miniVolSlider = document.getElementById('ss2-mini-vol-slider');
        if (miniVolSlider && miniVolSlider !== document.activeElement) {
            miniVolSlider.value = this._volumePercent;
        }
        this.updateVolumeIcons();
    }

    async syncPlaybackStateFromApi() {
        if (!this.hasPremium()) return null;
        try {
            const data = await this.spotifyApi('', 'GET');
            if (!data) return null;

            if (data.device && typeof data.device.volume_percent === 'number') {
                this._activeDevice = data.device;
                this.updateVolumeSliders(data.device.volume_percent);
            }
            if (typeof data.shuffle_state === 'boolean') {
                this._shuffleState = data.shuffle_state;
                this.updateShuffleButton();
            }
            if (data.repeat_state) {
                this._repeatState = data.repeat_state;
                this.updateRepeatButton();
            }
            return data;
        } catch (e) {
            return null;
        }
    }

    // ═══════════════════ PLAYBACK CONTROL COMMANDS ═══════════════════
    executeControl(action) {
        if (Date.now() - this.lastControlTime < 350) return; // 350ms snappy debounce
        this.lastControlTime = Date.now();

        // 1. Local Control Strategy (Most reliable, works with Free Spotify)
        try {
            const actionCreators = this.getSpotifyModules();
            if (actionCreators && this.accountId) {
                let localSuccess = false;
                switch (action) {
                    case 'play':
                        if (actionCreators.play) { actionCreators.play(this.accountId); localSuccess = true; }
                        break;
                    case 'pause':
                        if (actionCreators.pause) { actionCreators.pause(this.accountId); localSuccess = true; }
                        break;
                    case 'playpause':
                        if (this._isPlaying) {
                            if (actionCreators.pause) { actionCreators.pause(this.accountId); localSuccess = true; }
                        } else {
                            if (actionCreators.play) { actionCreators.play(this.accountId); localSuccess = true; }
                        }
                        break;
                    case 'next':
                        if (actionCreators.skipNext) { actionCreators.skipNext(this.accountId); localSuccess = true; }
                        else if (actionCreators.next) { actionCreators.next(this.accountId); localSuccess = true; }
                        break;
                    case 'previous':
                        if (actionCreators.skipPrevious) { actionCreators.skipPrevious(this.accountId); localSuccess = true; }
                        else if (actionCreators.previous) { actionCreators.previous(this.accountId); localSuccess = true; }
                        break;
                }

                if (localSuccess) {
                    // Instantly reflect state optimistically
                    if (action === 'playpause') this._isPlaying = !this._isPlaying;
                    else if (action === 'play') this._isPlaying = true;
                    else if (action === 'pause') this._isPlaying = false;
                    this.updatePlayPauseIcons();
                    return;
                }
            }
        } catch (e) { }

        // 2. Web API Strategy (Premium fallback)
        switch (action) {
            case 'play':
                this._isPlaying = true;
                this.updatePlayPauseIcons();
                return this.spotifyApi('/play', 'PUT');
            case 'pause':
                this._isPlaying = false;
                this.updatePlayPauseIcons();
                return this.spotifyApi('/pause', 'PUT');
            case 'playpause':
                this._isPlaying = !this._isPlaying;
                this.updatePlayPauseIcons();
                return this.spotifyApi(this._isPlaying ? '/play' : '/pause', 'PUT');
            case 'next':
                return this.spotifyApi('/next', 'POST');
            case 'previous':
                return this.spotifyApi('/previous', 'POST');
        }
    }

    seek(ms) {
        return this.spotifyApi(`/seek?position_ms=${Math.floor(ms)}`, 'PUT');
    }

    setVolume(pct) {
        this._volumePercent = pct;
        return this.spotifyApi(`/volume?volume_percent=${Math.floor(pct)}`, 'PUT');
    }

    setShuffle(state) {
        this._shuffleState = state;
        return this.spotifyApi(`/shuffle?state=${state}`, 'PUT');
    }

    setRepeat(state) {
        this._repeatState = state;
        return this.spotifyApi(`/repeat?state=${state}`, 'PUT');
    }

    showVolumeIndicator(pct) {
        const overlay = document.getElementById('ss2-vol-overlay');
        if (!overlay) return;
        overlay.textContent = `🔊 ${pct}%`;
        overlay.classList.add('visible');
        if (this._volOverlayTimeout) clearTimeout(this._volOverlayTimeout);
        this._volOverlayTimeout = setTimeout(() => {
            overlay.classList.remove('visible');
        }, 1100);
    }

    async fetchAudioFeatures(trackId) {
        if (!trackId) return null;
        if (this._audioFeaturesCache.has(trackId)) {
            return this._audioFeaturesCache.get(trackId);
        }
        try {
            const data = await this.spotifyApi(`/audio-features/${trackId}`, 'GET', null, false);
            if (data && data.tempo) {
                const feat = {
                    tempo: Math.max(40, Math.min(240, Math.round(data.tempo))),
                    energy: typeof data.energy === 'number' ? data.energy : 0.7,
                    danceability: typeof data.danceability === 'number' ? data.danceability : 0.6
                };
                this._audioFeaturesCache.set(trackId, feat);
                return feat;
            }
        } catch (e) {
            // silent fallback
        }
        return null;
    }

    async applyBeatSync(trackId) {
        let bpm = 120;
        let energy = 0.7;
        const feat = await this.fetchAudioFeatures(trackId);
        if (feat) {
            bpm = feat.tempo;
            energy = feat.energy;
        }
        this._currentBpm = bpm;
        this._currentEnergy = energy;

        const beatDurationMs = Math.round(60000 / bpm);
        const halfBeatMs = Math.round(beatDurationMs / 2);
        const quarterBeatMs = Math.round(beatDurationMs / 4);
        const eighthBeatMs = Math.round(beatDurationMs / 8);

        const widget = document.getElementById('ss2-widget');
        if (widget) {
            widget.style.setProperty('--ss-beat-duration', `${beatDurationMs}ms`);
            widget.style.setProperty('--ss-beat-half', `${halfBeatMs}ms`);
            widget.style.setProperty('--ss-beat-quarter', `${quarterBeatMs}ms`);
            widget.style.setProperty('--ss-beat-eighth', `${eighthBeatMs}ms`);
            widget.style.setProperty('--ss-beat-energy', energy.toFixed(2));
        }
    }

    async likeTrack(id) {
        if (!id) return;
        try {
            if (this.hasPremium()) {
                const token = await this.getAccessToken();
                if (!token) return;
                const res = await fetch(`https://api.spotify.com/v1/me/tracks?ids=${id}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                if (res.ok || res.status === 200) {
                    this._isLiked = true;
                    this.safeShowToast('💚 ' + this.t('liked'), { type: 'success' });
                    this.updateLikeButton();
                }
                return;
            }

            // Local fallback
            const ac = this.getSpotifyModules();
            if (ac && (ac.saveTrack || ac.addTrack) && this.accountId) {
                const func = ac.saveTrack || ac.addTrack;
                func(this.accountId, id);
                this._isLiked = true;
                this.safeShowToast('💚 ' + this.t('liked'), { type: 'success' });
                this.updateLikeButton();
            }
        } catch (e) { }
    }

    async unlikeTrack(id) {
        if (!id) return;
        try {
            if (this.hasPremium()) {
                const token = await this.getAccessToken();
                if (!token) return;
                const res = await fetch(`https://api.spotify.com/v1/me/tracks?ids=${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok || res.status === 200) {
                    this._isLiked = false;
                    this.safeShowToast(this.t('unliked'), { type: 'info' });
                    this.updateLikeButton();
                }
                return;
            }

            const ac = this.getSpotifyModules();
            if (ac && (ac.unsaveTrack) && this.accountId) {
                ac.unsaveTrack(this.accountId, id);
                this._isLiked = false;
                this.safeShowToast(this.t('unliked'), { type: 'info' });
                this.updateLikeButton();
            }
        } catch (e) { }
    }

    async checkIfLiked(id) {
        if (!id || this._likeCheckPending || !this.hasPremium()) return;
        this._likeCheckPending = true;
        const token = await this.getAccessToken();
        if (!token) { this._likeCheckPending = false; return; }
        try {
            const res = await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const arr = await res.json();
                this._isLiked = arr?.[0] === true;
            }
        } catch (e) { }
        this._likeCheckPending = false;
        this.updateLikeButton();
    }

    // ═══════════════════ LYRICS ENGINE (LRCLIB) ═══════════════════
    async fetchLyrics(trackName, artistName, albumName, durationMs) {
        const cacheKey = this._trackId;
        if (cacheKey && this._lyricsCache[cacheKey]) return this._lyricsCache[cacheKey];

        const cleanTrack = (trackName || '')
            .replace(/\s*[-–]\s*(Remaster(ed)?|Deluxe|Bonus Track|Anniversary|Edition|Mix|Version|Live|Acoustic|Demo|Radio Edit).*$/i, '')
            .replace(/\s*\((?:feat\.|ft\.|with |Remaster|Deluxe|Bonus|Anniversary|Edition|Live|Acoustic|Demo|Radio Edit)[^)]*\)\s*/gi, '')
            .replace(/\s*\[(?:feat\.|ft\.|Remaster|Deluxe)[^\]]*\]\s*/gi, '')
            .trim();
        const primaryArtist = (artistName || '').split(/,\s*|&\s*/)[0].trim();
        const durationSec = Math.round((durationMs || 0) / 1000);

        try {
            // Tier 1: Exact Match
            const params1 = new URLSearchParams({
                track_name: trackName || '',
                artist_name: artistName || '',
                album_name: albumName || '',
                duration: durationSec.toString()
            });
            let res = await fetch(`https://lrclib.net/api/get?${params1}`);
            if (res.ok) {
                const data = await res.json();
                const parsed = this._parseLyrics(data.syncedLyrics, data.plainLyrics);
                if (parsed.lines.length > 0) {
                    if (cacheKey) this._lyricsCache[cacheKey] = parsed;
                    return parsed;
                }
            }

            // Tier 2: Cleaned Track & Primary Artist
            const params2 = new URLSearchParams({ track_name: cleanTrack, artist_name: primaryArtist });
            res = await fetch(`https://lrclib.net/api/get?${params2}`);
            if (res.ok) {
                const data = await res.json();
                const parsed = this._parseLyrics(data.syncedLyrics, data.plainLyrics);
                if (parsed.lines.length > 0) {
                    if (cacheKey) this._lyricsCache[cacheKey] = parsed;
                    return parsed;
                }
            }

            // Tier 3: Search Query Fallback
            const params3 = new URLSearchParams({ q: `${primaryArtist} ${cleanTrack}` });
            res = await fetch(`https://lrclib.net/api/search?${params3}`);
            if (res.ok) {
                const results = await res.json();
                if (results && results.length > 0) {
                    const best = results.find(r => r.syncedLyrics) || results.find(r => r.plainLyrics) || results[0];
                    const parsed = this._parseLyrics(best.syncedLyrics, best.plainLyrics);
                    if (parsed.lines.length > 0) {
                        if (cacheKey) this._lyricsCache[cacheKey] = parsed;
                        return parsed;
                    }
                }
            }

            return { synced: false, plain: null, lines: [] };
        } catch (e) {
            return { synced: false, plain: null, lines: [] };
        }
    }

    _parseLyrics(syncedLyrics, plainLyrics) {
        if (syncedLyrics) {
            const lines = [];
            const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)/g;
            let match;
            while ((match = regex.exec(syncedLyrics)) !== null) {
                const min = parseInt(match[1], 10);
                const sec = parseInt(match[2], 10);
                const ms = match[3].length === 2 ? parseInt(match[3], 10) * 10 : parseInt(match[3], 10);
                const timeMs = (min * 60 + sec) * 1000 + ms;
                const text = match[4].trim();
                if (text) lines.push({ timeMs, text });
            }
            if (lines.length > 0) return { synced: true, plain: plainLyrics, lines };
        }
        if (plainLyrics) {
            const lines = plainLyrics.split('\n').filter(l => l.trim()).map(text => ({ timeMs: -1, text: text.trim() }));
            return { synced: false, plain: plainLyrics, lines };
        }
        return { synced: false, plain: null, lines: [] };
    }

    // ═══════════════════ SPOTIFY CONNECT DEVICES ═══════════════════
    async fetchDevices() {
        const data = await this.spotifyApi('/devices', 'GET');
        this._devicesCache = data?.devices || [];
        return this._devicesCache;
    }

    async transferPlayback(deviceId, play = true, targetVolume = null, deviceName = null) {
        try {
            if (!deviceName && this._devicesCache) {
                const found = this._devicesCache.find(d => d.id === deviceId);
                if (found?.name) deviceName = found.name;
            }
            if (typeof targetVolume === 'number') {
                this.updateVolumeSliders(targetVolume);
                this.showVolumeIndicator(targetVolume);
            } else if (this._devicesCache) {
                const found = this._devicesCache.find(d => d.id === deviceId);
                if (typeof found?.volume_percent === 'number') {
                    this.updateVolumeSliders(found.volume_percent);
                    this.showVolumeIndicator(found.volume_percent);
                }
            }
            const res = await this.spotifyApi('', 'PUT', { device_ids: [deviceId], play });
            if (res !== null) {
                const displayName = deviceName || deviceId;
                this.safeShowToast(`🔊 ${this.t('transferring')}: ${displayName}`, { type: 'success' });
            }
            // Sync live state from API after handoff
            setTimeout(() => this.syncPlaybackStateFromApi(), 400);
            setTimeout(() => this.syncPlaybackStateFromApi(), 1200);
            return res;
        } catch (e) {
            return null;
        }
    }

    // ═══════════════════ QUEUE & PLAYLISTS ═══════════════════
    async fetchPlayerQueue() {
        try {
            const data = await this.spotifyApi('/queue', 'GET', null, true);
            if (!data) return { queue: [] };
            const current = data.currently_playing ? [data.currently_playing] : [];
            const queue = data.queue || [];
            return { queue: [...current, ...queue] };
        } catch (e) {
            return { queue: [] };
        }
    }

    async fetchUserPlaylists() {
        const data = await this.spotifyApi('/me/playlists?limit=30', 'GET', null, false);
        return data?.items || [];
    }

    // ═══════════════════ UI: CSS STYLING ═══════════════════
    getWidgetCSS() {
        return `
        /* SpotifySync Next-Gen Glassmorphic Player */
        #ss2-widget {
            --ss-accent: #1DB954;
            --ss-accent-glow: rgba(29, 185, 84, 0.35);
            --ss-accent-bg: rgba(29, 185, 84, 0.12);
            position: relative;
            margin: 6px 8px;
            padding: 10px 12px;
            border-radius: 12px;
            background: linear-gradient(145deg, var(--ss-accent-bg, rgba(29, 185, 84, 0.12)) 0%, rgba(18, 18, 22, 0.75) 100%);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35), 0 0 15px var(--ss-accent-glow);
            transition: background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease, max-height 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
            color: var(--text-normal, #f3f4f6);
            font-family: var(--font-primary, 'gg sans', 'Segoe UI', sans-serif);
            overflow: hidden;
            box-sizing: border-box;
        }

        #ss2-widget.ss2-hidden { display: none !important; }

        /* Top Row: Thumbnail + Info + Equalizer + Controls */
        .ss2-header-row {
            display: flex;
            align-items: center;
            gap: 10px;
            min-height: 40px;
        }

        /* Expanded Brand Bar in Header */
        .ss2-exp-header-bar {
            display: none;
            align-items: center;
            gap: 7px;
            flex: 1;
            min-width: 0;
        }
        .ss2-spotify-icon {
            width: 16px;
            height: 16px;
            fill: var(--ss-accent, #1DB954);
            flex-shrink: 0;
            filter: drop-shadow(0 0 4px var(--ss-accent-glow, rgba(29, 185, 84, 0.4)));
        }
        .ss2-exp-brand-name {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.65);
        }
        .ss2-status-pill {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            padding: 1px 6px;
            border-radius: 10px;
            background: rgba(29, 185, 84, 0.15);
            color: var(--ss-accent, #1DB954);
            border: 1px solid rgba(29, 185, 84, 0.3);
            line-height: 1.4;
        }
        .ss2-status-pill.ss2-status-paused {
            background: rgba(255, 255, 255, 0.08);
            color: rgba(255, 255, 255, 0.5);
            border-color: rgba(255, 255, 255, 0.12);
        }

        #ss2-widget.ss2-is-expanded .ss2-art-container,
        #ss2-widget.ss2-is-expanded .ss2-track-meta {
            display: none !important;
        }
        #ss2-widget.ss2-is-expanded .ss2-exp-header-bar {
            display: flex;
        }

        .ss2-art-container {
            position: relative;
            width: 38px;
            height: 38px;
            flex-shrink: 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 3px 10px rgba(0,0,0,0.4);
            cursor: pointer;
            transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .ss2-art-container:hover {
            transform: scale(1.05);
            box-shadow: 0 0 12px var(--ss-accent);
        }
        .ss2-art {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .ss2-track-meta {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .ss2-title {
            font-size: 13px;
            font-weight: 700;
            color: var(--header-primary, #fff);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.25;
            cursor: pointer;
        }
        .ss2-title:hover {
            color: var(--ss-accent, #1DB954);
            text-decoration: underline;
        }
        .ss2-artist {
            font-size: 11px;
            color: var(--text-muted, rgba(255, 255, 255, 0.65));
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.3;
            cursor: pointer;
        }
        .ss2-artist:hover {
            color: #fff;
            text-decoration: underline;
        }
        .ss2-album {
            font-size: 10px;
            color: var(--text-muted, rgba(255, 255, 255, 0.4));
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.2;
            display: none;
            margin-top: 2px;
        }

        /* Mini Animated Equalizer Visualizer (Beat-Synchronized) */
        .ss2-eq {
            display: inline-flex;
            align-items: flex-end;
            gap: 2.5px;
            height: 18px;
            padding: 0 4px;
            flex-shrink: 0;
        }
        .ss2-eq-bar {
            width: 3px;
            height: 3px;
            background: var(--ss-accent, #1DB954);
            border-radius: 2px;
            transition: height 0.15s ease, opacity 0.2s ease;
            box-shadow: 0 0 6px var(--ss-accent-glow);
            opacity: 0.4;
        }
        .ss2-eq.ss2-eq-playing .ss2-eq-bar {
            opacity: 1;
        }
        .ss2-eq.ss2-eq-playing .ss2-eq-1 {
            animation: ss2-eq-beat-1 var(--ss-beat-duration, 500ms) ease-in-out infinite alternate;
        }
        .ss2-eq.ss2-eq-playing .ss2-eq-2 {
            animation: ss2-eq-beat-2 var(--ss-beat-half, 250ms) ease-in-out infinite alternate;
        }
        .ss2-eq.ss2-eq-playing .ss2-eq-3 {
            animation: ss2-eq-beat-3 var(--ss-beat-duration, 500ms) ease-in-out infinite alternate calc(var(--ss-beat-quarter, 125ms) * 0.5);
        }
        .ss2-eq.ss2-eq-playing .ss2-eq-4 {
            animation: ss2-eq-beat-4 var(--ss-beat-half, 250ms) ease-in-out infinite alternate var(--ss-beat-eighth, 62ms);
        }

        @keyframes ss2-eq-beat-1 {
            0% { height: 3px; }
            50% { height: calc(11px * var(--ss-beat-energy, 1)); }
            100% { height: calc(17px * var(--ss-beat-energy, 1)); }
        }
        @keyframes ss2-eq-beat-2 {
            0% { height: calc(15px * var(--ss-beat-energy, 1)); }
            50% { height: 4px; }
            100% { height: calc(12px * var(--ss-beat-energy, 1)); }
        }
        @keyframes ss2-eq-beat-3 {
            0% { height: 4px; }
            50% { height: calc(16px * var(--ss-beat-energy, 1)); }
            100% { height: calc(7px * var(--ss-beat-energy, 1)); }
        }
        @keyframes ss2-eq-beat-4 {
            0% { height: calc(13px * var(--ss-beat-energy, 1)); }
            50% { height: 3px; }
            100% { height: calc(15px * var(--ss-beat-energy, 1)); }
        }

        /* Compact Controls in Header */
        .ss2-mini-ctrls {
            display: flex;
            align-items: center;
            gap: 3px;
            flex-shrink: 0;
        }

        .ss2-btn {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            width: 28px;
            height: 28px;
            border-radius: 50%;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
            padding: 0;
        }
        .ss2-btn:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.12);
            transform: scale(1.1);
        }
        .ss2-btn:active {
            transform: scale(0.94);
        }
        .ss2-btn svg { width: 16px; height: 16px; fill: currentColor; }

        .ss2-btn-play {
            width: 32px;
            height: 32px;
            background: var(--ss-accent, #1DB954);
            color: #000;
            box-shadow: 0 2px 8px var(--ss-accent-glow);
        }
        .ss2-btn-play:hover {
            background: #fff;
            color: #000;
            transform: scale(1.12);
            box-shadow: 0 0 14px var(--ss-accent);
        }

        .ss2-btn-expand {
            width: 24px;
            height: 24px;
            color: rgba(255, 255, 255, 0.45);
        }
        .ss2-btn-expand:hover { color: #fff; }
        .ss2-btn-expand svg {
            transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        #ss2-widget.ss2-is-expanded .ss2-btn-expand svg {
            transform: rotate(180deg);
        }

        /* Compact Volume Control (Inline in Header) */
        .ss2-mini-vol-wrap {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
            padding: 2px 6px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.05);
            transition: all 0.2s ease;
        }
        .ss2-mini-vol-wrap:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        #ss2-widget.ss2-is-expanded .ss2-mini-vol-wrap { display: none !important; }

        .ss2-mini-vol-btn {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.75);
            width: 20px;
            height: 20px;
            border-radius: 50%;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            flex-shrink: 0;
            transition: color 0.15s ease, transform 0.15s ease;
        }
        .ss2-mini-vol-btn:hover {
            color: #fff;
            transform: scale(1.1);
        }
        .ss2-mini-vol-btn svg { width: 14px; height: 14px; fill: currentColor; }

        .ss2-mini-vol-slider {
            width: 52px;
            height: 4px;
            -webkit-appearance: none;
            appearance: none;
            background: rgba(255, 255, 255, 0.22);
            border-radius: 2px;
            outline: none;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        .ss2-mini-vol-slider:hover {
            background: rgba(255, 255, 255, 0.38);
        }
        .ss2-mini-vol-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
            cursor: pointer;
            transition: transform 0.15s ease, background 0.15s ease;
        }
        .ss2-mini-vol-slider:hover::-webkit-slider-thumb {
            background: var(--ss-accent, #1DB954);
            transform: scale(1.25);
        }

        /* Floating Volume Badge for Wheel Scroll */
        .ss2-vol-overlay {
            position: absolute;
            top: 10px;
            right: 12px;
            background: rgba(0, 0, 0, 0.85);
            border: 1px solid var(--ss-accent, #1DB954);
            color: #fff;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 6px;
            pointer-events: none;
            opacity: 0;
            transform: translateY(-4px);
            transition: all 0.2s ease;
            z-index: 120;
            box-shadow: 0 2px 10px rgba(0,0,0,0.4);
        }
        .ss2-vol-overlay.visible {
            opacity: 1;
            transform: translateY(0);
        }

        /* Interactive Scrubber Bar in Compact Mode */
        .ss2-mini-progress {
            height: 3px;
            background: rgba(255, 255, 255, 0.12);
            border-radius: 2px;
            margin-top: 6px;
            position: relative;
            cursor: pointer;
            transition: height 0.18s ease, background 0.18s ease;
            user-select: none;
        }
        .ss2-mini-progress:hover {
            height: 6px;
            background: rgba(255, 255, 255, 0.22);
        }
        .ss2-mini-progress-fill {
            height: 100%;
            background: var(--ss-accent, #1DB954);
            border-radius: 2px;
            width: 0%;
            position: relative;
            box-shadow: 0 0 6px var(--ss-accent);
        }
        .ss2-mini-progress-handle {
            position: absolute;
            right: -4px;
            top: 50%;
            transform: translateY(-50%);
            width: 8px;
            height: 8px;
            background: #fff;
            border-radius: 50%;
            opacity: 0;
            box-shadow: 0 0 6px rgba(0,0,0,0.6);
            transition: opacity 0.15s ease;
        }
        .ss2-mini-progress:hover .ss2-mini-progress-handle {
            opacity: 1;
        }
        .ss2-mini-tooltip {
            position: absolute;
            bottom: calc(100% + 4px);
            left: 0;
            transform: translateX(-50%);
            background: rgba(18, 18, 22, 0.95);
            border: 1px solid var(--ss-accent, #1DB954);
            color: #fff;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.15s ease;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            z-index: 100;
        }
        .ss2-mini-progress:hover .ss2-mini-tooltip {
            opacity: 1;
        }
        #ss2-widget.ss2-is-expanded .ss2-mini-progress { display: none !important; }

        /* Expanded Accordion Body */
        .ss2-expanded-body {
            display: none;
            flex-direction: column;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            animation: ss2-fade-in 0.25s ease;
        }
        #ss2-widget.ss2-is-expanded .ss2-expanded-body { display: flex; }
        #ss2-widget.ss2-is-expanded .ss2-mini-ctrls { display: none !important; }

        /* Expanded Hero Card (64px Art + Rich Track Metadata) */
        .ss2-hero-card {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
            padding: 2px 2px 6px 2px;
        }
        .ss2-hero-art-wrap {
            position: relative;
            width: 64px;
            height: 64px;
            border-radius: 10px;
            flex-shrink: 0;
            cursor: pointer;
        }
        .ss2-hero-art {
            position: relative;
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 10px;
            z-index: 1;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.55);
            transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .ss2-hero-art-wrap:hover .ss2-hero-art {
            transform: scale(1.03);
            box-shadow: 0 0 16px var(--ss-accent, #1DB954);
        }
        .ss2-hero-art-glow {
            position: absolute;
            inset: 0;
            border-radius: 10px;
            background: var(--ss-accent, #1DB954);
            filter: blur(12px);
            opacity: 0.28;
            z-index: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        .ss2-hero-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 3px;
        }
        .ss2-hero-title {
            font-size: 14px;
            font-weight: 700;
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.25;
            cursor: pointer;
            transition: color 0.15s ease;
        }
        .ss2-hero-title:hover {
            color: var(--ss-accent, #1DB954);
            text-decoration: underline;
        }
        .ss2-hero-artist {
            font-size: 12px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.7);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.25;
            cursor: pointer;
            transition: color 0.15s ease;
        }
        .ss2-hero-artist:hover {
            color: #fff;
            text-decoration: underline;
        }
        .ss2-hero-album {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.42);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.25;
            cursor: pointer;
            margin-top: 1px;
            transition: color 0.15s ease;
        }
        .ss2-hero-album:hover {
            color: rgba(255, 255, 255, 0.85);
        }
        .ss2-hero-disc-icon {
            width: 12px;
            height: 12px;
            fill: currentColor;
            flex-shrink: 0;
            opacity: 0.7;
        }

        /* Scrubber Progress Bar */
        .ss2-scrub-wrap {
            position: relative;
            cursor: pointer;
            padding: 6px 0 2px 0;
            user-select: none;
        }
        .ss2-scrub-track {
            height: 4px;
            background: rgba(255, 255, 255, 0.12);
            border-radius: 2px;
            position: relative;
            transition: height 0.18s ease;
        }
        .ss2-scrub-wrap:hover .ss2-scrub-track { height: 6px; }
        .ss2-scrub-fill {
            height: 100%;
            background: var(--ss-accent, #1DB954);
            border-radius: 2px;
            position: relative;
            width: 0%;
            box-shadow: 0 0 8px var(--ss-accent);
        }
        .ss2-scrub-handle {
            position: absolute;
            right: -5px;
            top: 50%;
            transform: translateY(-50%);
            width: 10px;
            height: 10px;
            background: #fff;
            border-radius: 50%;
            opacity: 0;
            box-shadow: 0 0 6px rgba(0,0,0,0.5);
            transition: opacity 0.15s ease;
        }
        .ss2-scrub-wrap:hover .ss2-scrub-handle { opacity: 1; }

        /* Non-Premium Progress Display (No seek interaction) */
        #ss2-widget:not(.ss2-has-premium) .ss2-scrub-wrap,
        #ss2-widget:not(.ss2-has-premium) .ss2-mini-progress {
            cursor: default !important;
        }
        #ss2-widget:not(.ss2-has-premium) .ss2-scrub-handle,
        #ss2-widget:not(.ss2-has-premium) .ss2-mini-progress-handle,
        #ss2-widget:not(.ss2-has-premium) .ss2-mini-tooltip {
            display: none !important;
        }

        .ss2-time-labels {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: rgba(255, 255, 255, 0.45);
            margin-top: 3px;
            font-weight: 500;
            font-variant-numeric: tabular-nums;
        }
        .ss2-time-remaining {
            color: rgba(255, 255, 255, 0.32);
            font-size: 9.5px;
            letter-spacing: 0.2px;
        }

        /* Expanded Action Controls Grid */
        .ss2-ctrls-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 6px;
        }
        .ss2-active-dot {
            position: relative;
        }
        .ss2-active-dot::after {
            content: '';
            position: absolute;
            bottom: 2px;
            width: 4px;
            height: 4px;
            background: var(--ss-accent, #1DB954);
            border-radius: 50%;
            box-shadow: 0 0 6px var(--ss-accent);
        }
        .ss2-btn.ss2-liked { color: #e91e63 !important; }
        .ss2-btn.ss2-liked svg { fill: #e91e63 !important; }

        /* Premium vs Non-Premium buttons in ctrls row */
        #ss2-widget:not(.ss2-has-premium) .ss2-premium-only {
            display: none !important;
        }
        #ss2-widget.ss2-has-premium .ss2-non-premium-only {
            display: none !important;
        }
        .ss2-non-premium-only svg {
            width: 16px;
            height: 16px;
            fill: var(--interactive-normal, #b5bac1);
            transition: fill 0.15s ease, transform 0.15s ease;
        }
        .ss2-non-premium-only:hover svg {
            fill: #fff;
            transform: scale(1.08);
        }
        #ss2-open-spotify-btn:hover svg {
            fill: var(--ss-accent, #1DB954) !important;
        }

        /* Sub-toolbar (Lyrics, Queue, Devices, Volume) */
        .ss2-subbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            gap: 8px;
        }
        .ss2-subbar-tools {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        /* Volume Slider */
        .ss2-vol-box {
            display: flex;
            align-items: center;
            gap: 6px;
            flex: 1;
            max-width: 110px;
        }
        .ss2-vol-box svg { width: 14px; height: 14px; fill: rgba(255, 255, 255, 0.5); flex-shrink: 0; }
        .ss2-vol-slider {
            width: 100%;
            height: 3px;
            -webkit-appearance: none;
            appearance: none;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 2px;
            outline: none;
            cursor: pointer;
        }
        .ss2-vol-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 10px;
            height: 10px;
            background: #fff;
            border-radius: 50%;
            box-shadow: 0 0 4px rgba(0,0,0,0.4);
            cursor: pointer;
        }

        /* Inline Sidebar Sub-Views (Lyrics / Queue / Devices / Library) */
        #ss2-widget.ss2-subview-active {
            min-height: 480px;
            max-height: 560px;
            transition: min-height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), max-height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        #ss2-widget.ss2-lyrics-active {
            min-height: 580px;
            max-height: 660px;
        }
        #ss2-widget.ss2-lyrics-fullscreen {
            min-height: 720px;
            max-height: 85vh;
        }

        .ss2-subview-panel {
            position: absolute;
            inset: 0;
            z-index: 40;
            background: rgba(14, 15, 18, 0.98);
            backdrop-filter: blur(24px);
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: ss2-slide-up 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
            height: 100%;
        }
        .ss2-subview-header {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            background: rgba(255, 255, 255, 0.04);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            flex-shrink: 0;
        }
        .ss2-subview-title {
            font-size: 13px;
            font-weight: 700;
            color: #fff;
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .ss2-subview-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .ss2-subview-content::-webkit-scrollbar { width: 4px; }
        .ss2-subview-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }

        /* Lyrics Styling */
        .ss2-lyrics-scroll-wrap {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 24px 14px;
            mask-image: linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%);
            -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%);
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .ss2-lyrics-scroll-wrap::-webkit-scrollbar { width: 4px; }
        .ss2-lyrics-scroll-wrap::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }

        .ss2-lyric-line {
            padding: 8px 12px;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.4);
            border-radius: 8px;
            line-height: 1.6;
            transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
            cursor: pointer;
            text-align: center;
            user-select: none;
        }
        .ss2-lyric-line:hover {
            color: rgba(255, 255, 255, 0.85);
            background: rgba(255, 255, 255, 0.06);
            transform: scale(1.02);
        }
        .ss2-lyric-line.ss2-lyric-active {
            color: #fff !important;
            font-weight: 800;
            font-size: 17px;
            background: var(--ss-accent-bg, rgba(29, 185, 84, 0.16));
            text-shadow: 0 0 16px var(--ss-accent, #1DB954);
            transform: scale(1.05);
            padding: 10px 14px;
            border: 1px solid var(--ss-accent-glow, rgba(29, 185, 84, 0.3));
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        /* List Items (Queue / Devices / Library) */
        .ss2-item-card {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid transparent;
            cursor: pointer;
            transition: all 0.18s ease;
        }
        .ss2-item-card:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.1);
        }
        .ss2-item-card.ss2-item-active {
            background: var(--ss-accent-bg, rgba(29, 185, 84, 0.12));
            border-color: var(--ss-accent-glow);
        }
        .ss2-item-img {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            object-fit: cover;
            background: #282828;
            flex-shrink: 0;
        }
        .ss2-item-meta {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
        }
        .ss2-item-title {
            font-size: 12px;
            font-weight: 600;
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .ss2-item-sub {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.5);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Context Menu */
        .ss2-ctx-menu {
            position: fixed;
            z-index: 10000;
            background: var(--background-floating, #111215);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 6px;
            min-width: 190px;
            box-shadow: 0 8px 28px rgba(0, 0, 0, 0.5);
            animation: ss2-fade-in 0.15s ease;
        }
        .ss2-ctx-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            border-radius: 6px;
            font-size: 13px;
            color: var(--interactive-normal, #b5bac1);
            cursor: pointer;
            transition: all 0.1s ease;
        }
        .ss2-ctx-item:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #fff;
        }
        .ss2-ctx-item svg { width: 16px; height: 16px; fill: currentColor; }
        .ss2-ctx-sep { height: 1px; background: rgba(255, 255, 255, 0.08); margin: 4px 6px; }

        @keyframes ss2-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ss2-slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        /* When NOT connected to Spotify Premium, strictly hide premium-only API controls */
        #ss2-widget:not(.ss2-has-premium) #ss2-like-btn,
        #ss2-widget:not(.ss2-has-premium) #ss2-shuffle-btn,
        #ss2-widget:not(.ss2-has-premium) #ss2-repeat-btn,
        #ss2-widget:not(.ss2-has-premium) #ss2-queue-tab-btn,
        #ss2-widget:not(.ss2-has-premium) #ss2-devices-tab-btn,
        #ss2-widget:not(.ss2-has-premium) #ss2-library-tab-btn {
            display: none !important;
        }
        `;
    }

    // ═══════════════════ UI: INJECTION & MOUNTING ═══════════════════
    injectWidget() {
        const findTargetAndMount = () => {
            if (document.getElementById('ss2-widget')) return;

            const selectors = [
                'section[class*="panels_"]',
                'div[class*="panels_"]',
                '[class*="panels_"] > [class*="container_"]'
            ];

            let target = null;
            for (const s of selectors) {
                target = document.querySelector(s);
                if (target) break;
            }

            if (!target) {
                const muteBtn = document.querySelector('button[aria-label*="Mute"], button[aria-label*="Silenciar"], button[aria-label*="mute"]');
                if (muteBtn) target = muteBtn.closest('section') || muteBtn.closest('[class*="panels"]');
            }

            if (!target) return;

            const el = document.createElement('div');
            el.id = 'ss2-widget';
            el.className = 'ss2-hidden';
            el.innerHTML = `
                <style>${this.getWidgetCSS()}</style>

                <!-- Header Row (Always visible in widget) -->
                <div class="ss2-header-row">
                    <!-- Expanded Header Brand Bar -->
                    <div class="ss2-exp-header-bar" id="ss2-exp-header-bar">
                        <svg class="ss2-spotify-icon" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.308-1.758-8.793-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.51 9.722 1.113.294.18.386.563.207.857zm1.23-2.738c-.226.367-.706.482-1.072.256-2.687-1.652-6.785-2.131-9.965-1.166-.413.127-.848-.106-.973-.517-.125-.413.108-.848.52-.973 3.632-1.102 8.147-.568 11.234 1.328.366.226.48.707.256 1.072zm.105-2.853C14.7 8.877 9.4 8.703 6.34 9.63c-.495.15-1.022-.128-1.172-.623-.15-.495.13-1.022.624-1.172 3.532-1.073 9.404-.866 13.115 1.337.445.264.59.838.327 1.282-.264.443-.838.59-1.282.327z"/></svg>
                        <span class="ss2-exp-brand-name">Spotify</span>
                        <span class="ss2-status-pill" id="ss2-status-pill">${this._isPlaying ? (this.t('nowPlaying') || 'TOCANDO') : (this.t('notPlaying') || 'PAUSADO')}</span>
                    </div>

                    <!-- Compact Track Presentation -->
                    <div class="ss2-art-container" id="ss2-art-wrap">
                        <img class="ss2-art" id="ss2-art" src="" alt="Album Art" />
                    </div>
                    <div class="ss2-track-meta">
                        <div class="ss2-title" id="ss2-title" title="${this.t('copyTrackUrl')}">--</div>
                        <div class="ss2-artist" id="ss2-artist" title="${this.t('copyArtistUrl')}">--</div>
                        <div class="ss2-album" id="ss2-album" title="${this.t('copyAlbumUrl')}">--</div>
                    </div>

                    <!-- Compact Quick Controls -->
                    <div class="ss2-mini-ctrls">
                        <button class="ss2-btn" id="ss2-mini-prev" title="${this.t('previous')}">
                            <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                        </button>
                        <button class="ss2-btn ss2-btn-play" id="ss2-mini-play" title="${this.t('playPause')}">
                            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                        <button class="ss2-btn" id="ss2-mini-next" title="${this.t('next')}">
                            <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                        </button>
                    </div>

                    <!-- Compact Volume Control -->
                    <div class="ss2-mini-vol-wrap" id="ss2-mini-vol-wrap" title="${this.t('volume')}">
                        <button class="ss2-mini-vol-btn" id="ss2-mini-vol-btn" title="${this.t('volume')}">
                            <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                        </button>
                        <input type="range" class="ss2-mini-vol-slider" id="ss2-mini-vol-slider" min="0" max="100" value="100" />
                    </div>

                    <!-- Mini Equalizer Bars -->
                    <div class="ss2-eq" id="ss2-eq-visualizer" title="${this.t('showVisualizer')}">
                        <span class="ss2-eq-bar ss2-eq-1"></span>
                        <span class="ss2-eq-bar ss2-eq-2"></span>
                        <span class="ss2-eq-bar ss2-eq-3"></span>
                        <span class="ss2-eq-bar ss2-eq-4"></span>
                    </div>

                    <!-- Expand / Collapse Accordion Arrow -->
                    <button class="ss2-btn ss2-btn-expand" id="ss2-btn-expand" title="Expand / Collapse">
                        <svg viewBox="0 0 24 24"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>
                    </button>
                </div>

                <!-- Thin Progress Line (Compact Mode Interactive Scrubber) -->
                <div class="ss2-mini-progress" id="ss2-mini-scrub" title="Buscar tempo">
                    <div class="ss2-mini-progress-fill" id="ss2-mini-progress-fill">
                        <div class="ss2-mini-progress-handle"></div>
                    </div>
                    <div class="ss2-mini-tooltip" id="ss2-mini-tooltip">0:00</div>
                </div>

                <!-- Volume Indicator Badge Overlay -->
                <div class="ss2-vol-overlay" id="ss2-vol-overlay">🔊 100%</div>

                <!-- Expanded Body -->
                <div class="ss2-expanded-body">
                    <!-- Expanded Hero Card (64px Art + Metadata) -->
                    <div class="ss2-hero-card" id="ss2-hero-card">
                        <div class="ss2-hero-art-wrap" id="ss2-hero-art-wrap" title="${this.t('openInSpotify')}">
                            <img class="ss2-hero-art" id="ss2-hero-art" src="" alt="Album Art" />
                            <div class="ss2-hero-art-glow" id="ss2-hero-art-glow"></div>
                        </div>
                        <div class="ss2-hero-info">
                            <div class="ss2-hero-title" id="ss2-hero-title" title="${this.t('copyTrackUrl')}">--</div>
                            <div class="ss2-hero-artist" id="ss2-hero-artist" title="${this.t('copyArtistUrl')}">--</div>
                            <div class="ss2-hero-album" id="ss2-hero-album" title="${this.t('copyAlbumUrl')}">
                                <svg class="ss2-hero-disc-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/></svg>
                                <span id="ss2-hero-album-text">--</span>
                            </div>
                        </div>
                    </div>

                    <!-- Scrubber Progress Bar -->
                    <div class="ss2-scrub-wrap" id="ss2-scrub-wrap">
                        <div class="ss2-scrub-track">
                            <div class="ss2-scrub-fill" id="ss2-progress-fill">
                                <div class="ss2-scrub-handle"></div>
                            </div>
                        </div>
                        <div class="ss2-time-labels">
                            <span id="ss2-time-current">0:00</span>
                            <span id="ss2-time-remaining" class="ss2-time-remaining">-0:00</span>
                            <span id="ss2-time-total">0:00</span>
                        </div>
                    </div>

                    <!-- Main Controls Row -->
                    <div class="ss2-ctrls-row">
                        <!-- Non-Premium Quick Utility: Abrir no Spotify -->
                        <button class="ss2-btn ss2-non-premium-only" id="ss2-open-spotify-btn" title="${this.t('openInSpotify')}">
                            <svg viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.308-1.758-8.793-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.51 9.722 1.113.294.18.386.563.207.857zm1.23-2.738c-.226.367-.706.482-1.072.256-2.687-1.652-6.785-2.131-9.965-1.166-.413.127-.848-.106-.973-.517-.125-.413.108-.848.52-.973 3.632-1.102 8.147-.568 11.234 1.328.366.226.48.707.256 1.072zm.105-2.853C14.7 8.877 9.4 8.703 6.34 9.63c-.495.15-1.022-.128-1.172-.623-.15-.495.13-1.022.624-1.172 3.532-1.073 9.404-.866 13.115 1.337.445.264.59.838.327 1.282-.264.443-.838.59-1.282.327z"/></svg>
                        </button>
                        <button class="ss2-btn ss2-premium-only" id="ss2-shuffle-btn" title="${this.t('shuffle')}">
                            <svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
                        </button>
                        <button class="ss2-btn" id="ss2-exp-prev" title="${this.t('previous')}">
                            <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                        </button>
                        <button class="ss2-btn ss2-btn-play" id="ss2-exp-play" title="${this.t('playPause')}">
                            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                        <button class="ss2-btn" id="ss2-exp-next" title="${this.t('next')}">
                            <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                        </button>
                        <button class="ss2-btn ss2-premium-only" id="ss2-repeat-btn" title="${this.t('repeat')}">
                            <svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
                        </button>
                        <button class="ss2-btn ss2-premium-only" id="ss2-like-btn" title="${this.t('like')}">
                            <svg viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg>
                        </button>
                        <!-- Non-Premium Quick Utility: Copiar Link -->
                        <button class="ss2-btn ss2-non-premium-only" id="ss2-copy-link-btn" title="${this.t('copyTrackUrl')}">
                            <svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
                        </button>
                    </div>

                    <!-- Subbar Tools & Volume -->
                    <div class="ss2-subbar">
                        <div class="ss2-subbar-tools">
                            <button class="ss2-btn" id="ss2-lyrics-tab-btn" title="${this.t('lyrics')}">
                                <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zm-2 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
                            </button>
                            <button class="ss2-btn" id="ss2-queue-tab-btn" title="${this.t('queue')}">
                                <svg viewBox="0 0 24 24"><path d="M4 10h12v2H4zm0-4h12v2H4zm0 8h8v2H4zM20 10V4.16c0-.53-.21-1.04-.59-1.41-.37-.38-.88-.59-1.41-.59h-1v2h1v6h2zm-2 10v-5l5 2.5z"/></svg>
                            </button>
                            <button class="ss2-btn" id="ss2-library-tab-btn" title="${this.t('library')}">
                                <svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"/></svg>
                            </button>
                            <button class="ss2-btn" id="ss2-devices-tab-btn" title="${this.t('devices')}">
                                <svg viewBox="0 0 24 24"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>
                            </button>
                            <button class="ss2-btn" id="ss2-share-btn" title="${this.t('share')}">
                                <svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
                            </button>
                        </div>

                        <!-- Volume Slider -->
                        <div class="ss2-vol-box" id="ss2-vol-box">
                            <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                            <input type="range" class="ss2-vol-slider" id="ss2-vol-slider" min="0" max="100" value="100" />
                        </div>
                    </div>
                </div>

                <!-- Sub-view Mount Container (Inside sidebar widget) -->
                <div id="ss2-subview-mount"></div>
            `;

            this._expanded = !this.config.startCompact;
            el.classList.toggle('ss2-is-expanded', this._expanded);
            el.classList.toggle('ss2-has-premium', this.hasPremium());

            try {
                target.insertBefore(el, target.firstChild);
            } catch {
                try { target.parentElement.insertBefore(el, target); } catch (err) { return; }
            }

            this.widgetElement = el;
            this.bindEvents();
            if (this._track) {
                this.updateWidget(this._track, this._isPlaying);
            }
        };

        findTargetAndMount();

        // Safe MutationObserver to re-inject if Discord navigates or re-renders panels
        if (this._observer) this._observer.disconnect();
        this._observer = new MutationObserver(() => {
            if (!document.getElementById('ss2-widget')) {
                this.widgetElement = null;
                findTargetAndMount();
            }
        });

        const appMount = document.getElementById('app-mount') || document.body;
        this._observer.observe(appMount, { childList: true, subtree: true });
    }

    removeWidget() {
        if (this.widgetElement) {
            this.widgetElement.remove();
            this.widgetElement = null;
        }
        document.querySelectorAll('#ss2-widget').forEach(w => w.remove());
    }

    hideWidget() {
        const w = document.getElementById('ss2-widget');
        if (w) w.classList.add('ss2-hidden');
    }

    // ═══════════════════ UI: EVENT BINDING ═══════════════════
    bindEvents() {
        const widget = document.getElementById('ss2-widget');
        if (!widget) return;

        // Play/Pause Click
        const handlePlayPause = (e) => {
            e.stopPropagation();
            this.executeControl('playpause');
        };
        document.getElementById('ss2-mini-play')?.addEventListener('click', handlePlayPause);
        document.getElementById('ss2-exp-play')?.addEventListener('click', handlePlayPause);

        // Previous
        const handlePrev = (e) => {
            e.stopPropagation();
            this.executeControl('previous');
        };
        document.getElementById('ss2-mini-prev')?.addEventListener('click', handlePrev);
        document.getElementById('ss2-exp-prev')?.addEventListener('click', handlePrev);

        // Next
        const handleNext = (e) => {
            e.stopPropagation();
            this.executeControl('next');
        };
        document.getElementById('ss2-mini-next')?.addEventListener('click', handleNext);
        document.getElementById('ss2-exp-next')?.addEventListener('click', handleNext);

        // Expand/Collapse Accordion
        document.getElementById('ss2-btn-expand')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this._expanded = !this._expanded;
            widget.classList.toggle('ss2-is-expanded', this._expanded);
            if (this._track) {
                this.updateWidget(this._track, this._isPlaying);
            }
            if (this._expanded) {
                this.syncStateWithDiscord();
            }
        });

        // Scrubber / Seek Click
        const scrubWrap = document.getElementById('ss2-scrub-wrap');
        scrubWrap?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this._durationMs) return;
            const rect = scrubWrap.getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const seekMs = pct * this._durationMs;
            this._positionMs = seekMs;
            this._positionTimestamp = Date.now();
            const fill = document.getElementById('ss2-progress-fill');
            if (fill) fill.style.width = `${pct * 100}%`;
            const timeEl = document.getElementById('ss2-time-current');
            if (timeEl) timeEl.textContent = this.formatTime(seekMs);
            const remEl = document.getElementById('ss2-time-remaining');
            if (remEl) remEl.textContent = '-' + this.formatTime(Math.max(0, this._durationMs - seekMs));
            this.seek(seekMs);
        });

        // Compact Progress Scrubber & Live Tooltip
        const miniScrub = document.getElementById('ss2-mini-scrub');
        const miniTooltip = document.getElementById('ss2-mini-tooltip');
        if (miniScrub) {
            miniScrub.addEventListener('mousemove', (e) => {
                if (!this._durationMs || !miniTooltip) return;
                const rect = miniScrub.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const hoverMs = pct * this._durationMs;
                miniTooltip.textContent = this.formatTime(hoverMs);
                miniTooltip.style.left = `${pct * 100}%`;
            });
            miniScrub.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!this._durationMs) return;
                const rect = miniScrub.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const seekMs = pct * this._durationMs;
                this._positionMs = seekMs;
                this._positionTimestamp = Date.now();
                const fill = document.getElementById('ss2-mini-progress-fill');
                if (fill) fill.style.width = `${pct * 100}%`;
                const mainFill = document.getElementById('ss2-progress-fill');
                if (mainFill) mainFill.style.width = `${pct * 100}%`;
                this.seek(seekMs);
            });
        }

        // Like Button
        document.getElementById('ss2-like-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this._isLiked) this.unlikeTrack(this._trackId);
            else this.likeTrack(this._trackId);
        });

        // Shuffle Button
        document.getElementById('ss2-shuffle-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this._shuffleState = !this._shuffleState;
            this.setShuffle(this._shuffleState);
            this.updateShuffleButton();
        });

        // Repeat Button
        document.getElementById('ss2-repeat-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const states = ['off', 'context', 'track'];
            const nextIdx = (states.indexOf(this._repeatState) + 1) % 3;
            this._repeatState = states[nextIdx];
            this.setRepeat(this._repeatState);
            this.updateRepeatButton();
        });

        // Expanded Volume Slider
        const volSlider = document.getElementById('ss2-vol-slider');
        volSlider?.addEventListener('input', (e) => {
            e.stopPropagation();
            this._volumePercent = parseInt(e.target.value, 10);
            const miniVol = document.getElementById('ss2-mini-vol-slider');
            if (miniVol) miniVol.value = this._volumePercent;
            this.updateVolumeIcons();
            this.showVolumeIndicator(this._volumePercent);
        });
        volSlider?.addEventListener('change', (e) => {
            e.stopPropagation();
            this.setVolume(parseInt(e.target.value, 10));
        });

        // Compact Volume Slider & Mute Toggle
        const miniVolSlider = document.getElementById('ss2-mini-vol-slider');
        miniVolSlider?.addEventListener('input', (e) => {
            e.stopPropagation();
            this._volumePercent = parseInt(e.target.value, 10);
            if (volSlider) volSlider.value = this._volumePercent;
            this.updateVolumeIcons();
            this.showVolumeIndicator(this._volumePercent);
        });
        miniVolSlider?.addEventListener('change', (e) => {
            e.stopPropagation();
            this.setVolume(parseInt(e.target.value, 10));
        });

        document.getElementById('ss2-mini-vol-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this._volumePercent > 0) {
                this._preMuteVolume = this._volumePercent;
                this._volumePercent = 0;
            } else {
                this._volumePercent = this._preMuteVolume || 50;
            }
            if (volSlider) volSlider.value = this._volumePercent;
            if (miniVolSlider) miniVolSlider.value = this._volumePercent;
            this.updateVolumeIcons();
            this.showVolumeIndicator(this._volumePercent);
            this.setVolume(this._volumePercent);
        });

        // Mouse Wheel Volume on Widget
        widget.addEventListener('wheel', (e) => {
            if (e.target.closest('.ss2-subview-content')) return;
            e.preventDefault();
            const delta = e.deltaY < 0 ? 5 : -5;
            const newVol = Math.max(0, Math.min(100, (this._volumePercent || 50) + delta));
            this._volumePercent = newVol;
            const mainVol = document.getElementById('ss2-vol-slider');
            const miniVol = document.getElementById('ss2-mini-vol-slider');
            if (mainVol) mainVol.value = newVol;
            if (miniVol) miniVol.value = newVol;
            this.updateVolumeIcons();
            this.showVolumeIndicator(newVol);
            if (this._volDebounce) clearTimeout(this._volDebounce);
            this._volDebounce = setTimeout(() => {
                this.setVolume(newVol);
            }, 120);
        }, { passive: false });

        // Sub-View Buttons (Inside sidebar)
        document.getElementById('ss2-lyrics-tab-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSubView('lyrics');
        });
        document.getElementById('ss2-queue-tab-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSubView('queue');
        });
        document.getElementById('ss2-library-tab-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSubView('library');
        });
        document.getElementById('ss2-devices-tab-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSubView('devices');
        });

        // Share to Chat
        document.getElementById('ss2-share-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this._trackId) {
                this.sendToChat(`https://open.spotify.com/track/${this._trackId}`);
            }
        });

        // Artwork, Title, Artist Links (Compact & Expanded Hero)
        const openTrack = () => { if (this._trackId) window.open(`https://open.spotify.com/track/${this._trackId}`, '_blank'); };
        const openArtist = () => { if (this._artistIds?.[0]?.id) window.open(`https://open.spotify.com/artist/${this._artistIds[0].id}`, '_blank'); };
        const openAlbum = () => { if (this._albumId) window.open(`https://open.spotify.com/album/${this._albumId}`, '_blank'); };

        document.getElementById('ss2-art-wrap')?.addEventListener('click', openTrack);
        document.getElementById('ss2-title')?.addEventListener('click', openTrack);
        document.getElementById('ss2-artist')?.addEventListener('click', openArtist);
        document.getElementById('ss2-album')?.addEventListener('click', openAlbum);

        document.getElementById('ss2-hero-art-wrap')?.addEventListener('click', openTrack);
        document.getElementById('ss2-hero-title')?.addEventListener('click', openTrack);
        document.getElementById('ss2-hero-artist')?.addEventListener('click', openArtist);
        document.getElementById('ss2-hero-album')?.addEventListener('click', openAlbum);

        // Non-Premium Quick Utility Buttons
        document.getElementById('ss2-open-spotify-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            openTrack();
        });
        document.getElementById('ss2-copy-link-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this._trackId) this.copyToClipboard(`https://open.spotify.com/track/${this._trackId}`);
        });

        // Context Menus
        this.setupContextMenus();
    }

    setupContextMenus() {
        const linkIcon = '<svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>';
        const openIcon = '<svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>';
        const shareIcon = '<svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>';

        const showMenu = (e, items) => {
            e.preventDefault();
            e.stopPropagation();
            document.querySelectorAll('.ss2-ctx-menu').forEach(m => m.remove());

            const menu = document.createElement('div');
            menu.className = 'ss2-ctx-menu';
            menu.innerHTML = items.map(item => {
                if (item.sep) return '<div class="ss2-ctx-sep"></div>';
                return `<div class="ss2-ctx-item" data-action="${item.action}">${item.icon || ''} ${item.label}</div>`;
            }).join('');

            menu.style.left = `${Math.min(e.clientX, window.innerWidth - 210)}px`;
            menu.style.top = `${Math.min(e.clientY, window.innerHeight - 150)}px`;
            document.body.appendChild(menu);

            menu.querySelectorAll('.ss2-ctx-item').forEach(el => {
                el.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const act = el.dataset.action;
                    if (act === 'copyTrack') this.copyToClipboard(`https://open.spotify.com/track/${this._trackId}`);
                    else if (act === 'copyArtist' && this._artistIds?.[0]?.id) this.copyToClipboard(`https://open.spotify.com/artist/${this._artistIds[0].id}`);
                    else if (act === 'copyAlbum' && this._albumId) this.copyToClipboard(`https://open.spotify.com/album/${this._albumId}`);
                    else if (act === 'openTrack') window.open(`https://open.spotify.com/track/${this._trackId}`, '_blank');
                    else if (act === 'openAlbum' && this._albumId) window.open(`https://open.spotify.com/album/${this._albumId}`, '_blank');
                    else if (act === 'copyArt' && this._albumArtUrl) this.copyToClipboard(this._albumArtUrl);
                    else if (act === 'openArt' && this._albumArtUrl) window.open(this._albumArtUrl, '_blank');
                    else if (act === 'share') this.sendToChat(`https://open.spotify.com/track/${this._trackId}`);
                    menu.remove();
                });
            });

            const close = (ev) => {
                if (!menu.contains(ev.target)) {
                    menu.remove();
                    document.removeEventListener('click', close);
                }
            };
            setTimeout(() => document.addEventListener('click', close), 10);
        };

        // Album Art Context Menu (Both Compact and Hero)
        const bindArtMenu = (id) => {
            document.getElementById(id)?.addEventListener('contextmenu', (e) => {
                if (!this._trackId && !this._albumId) return;
                showMenu(e, [
                    { action: 'openTrack', label: this.t('openInSpotify'), icon: openIcon },
                    { action: 'copyAlbum', label: this.t('copyAlbumUrl'), icon: linkIcon },
                    { action: 'openAlbum', label: this.t('openAlbumUrl') || 'Abrir Álbum no Spotify', icon: openIcon },
                    { sep: true },
                    { action: 'copyArt', label: this.t('copyArtUrl') || 'Copiar Link da Capa', icon: linkIcon },
                    { action: 'openArt', label: this.t('openArtUrl') || 'Abrir Imagem da Capa', icon: openIcon }
                ]);
            });
        };
        bindArtMenu('ss2-art-wrap');
        bindArtMenu('ss2-hero-art-wrap');

        document.getElementById('ss2-title')?.addEventListener('contextmenu', (e) => {
            if (!this._trackId) return;
            showMenu(e, [
                { action: 'copyTrack', label: this.t('copyTrackUrl'), icon: linkIcon },
                { action: 'openTrack', label: this.t('openInSpotify'), icon: openIcon },
                { sep: true },
                { action: 'share', label: this.t('share'), icon: shareIcon }
            ]);
        });

        document.getElementById('ss2-artist')?.addEventListener('contextmenu', (e) => {
            if (!this._artistIds?.length) return;
            showMenu(e, [
                { action: 'copyArtist', label: this.t('copyArtistUrl'), icon: linkIcon }
            ]);
        });
    }

    // ═══════════════════ UI: DYNAMIC UPDATES ═══════════════════
    updateWidget(track, isPlaying) {
        const widget = document.getElementById('ss2-widget');
        if (!widget || !track) return;
        widget.classList.remove('ss2-hidden');

        this._track = track;
        this._isPlaying = isPlaying;
        this._albumArtUrl = track.albumArtUrl || null;

        // Apply Beat Sync Animation based on Spotify Web API tempo & energy
        if (track.trackId) {
            this.applyBeatSync(track.trackId);
        }

        // Track Text (Compact Header)
        const titleEl = document.getElementById('ss2-title');
        const artistEl = document.getElementById('ss2-artist');
        const albumEl = document.getElementById('ss2-album');
        if (titleEl) titleEl.textContent = track.title || '';
        if (artistEl) artistEl.textContent = track.artist || '';
        if (albumEl) albumEl.textContent = track.album || '';

        // Track Text (Expanded Hero Card)
        const heroTitle = document.getElementById('ss2-hero-title');
        const heroArtist = document.getElementById('ss2-hero-artist');
        const heroAlbum = document.getElementById('ss2-hero-album-text');
        if (heroTitle) heroTitle.textContent = track.title || '';
        if (heroArtist) heroArtist.textContent = track.artist || '';
        if (heroAlbum) heroAlbum.textContent = track.album || '';

        // Status Pill in Brand Bar
        const statusPill = document.getElementById('ss2-status-pill');
        if (statusPill) {
            statusPill.textContent = isPlaying ? (this.t('nowPlaying') || 'TOCANDO') : (this.t('notPlaying') || 'PAUSADO');
            statusPill.classList.toggle('ss2-status-paused', !isPlaying);
        }

        // Album Art (Compact & Hero)
        const artEl = document.getElementById('ss2-art');
        const artWrap = document.getElementById('ss2-art-wrap');
        const heroArt = document.getElementById('ss2-hero-art');
        const heroArtWrap = document.getElementById('ss2-hero-art-wrap');

        if (track.albumArtUrl && this.config.showAlbumArt) {
            if (artEl) artEl.src = track.albumArtUrl;
            if (artWrap) artWrap.style.display = 'block';
            if (heroArt) heroArt.src = track.albumArtUrl;
            if (heroArtWrap) heroArtWrap.style.display = 'block';
        } else {
            if (artWrap) artWrap.style.display = 'none';
            if (heroArtWrap) heroArtWrap.style.display = 'none';
        }

        // Equalizer Animation State
        const eqEl = document.getElementById('ss2-eq-visualizer');
        if (eqEl) {
            eqEl.style.display = this.config.showVisualizer ? 'flex' : 'none';
            eqEl.classList.toggle('ss2-eq-playing', isPlaying);
        }

        // Play/Pause Icons
        this.updatePlayPauseIcons();

        // Durations & Remaining Time
        const timeTotal = document.getElementById('ss2-time-total');
        if (timeTotal) timeTotal.textContent = this.formatTime(this._durationMs);
        const remEl = document.getElementById('ss2-time-remaining');
        if (remEl) {
            const rem = Math.max(0, (this._durationMs || 0) - (this._positionMs || 0));
            remEl.textContent = '-' + this.formatTime(rem);
        }

        // Buttons
        this.updateLikeButton();
        this.updateShuffleButton();
        this.updateRepeatButton();

        // Volume Sliders (Main and Compact)
        this.updateVolumeSliders(this._volumePercent);

        // Mini Controls, Mini Volume, & Mini Progress (Header Row):
        // In EXPANDED mode, ALWAYS hide mini controls, mini volume, and mini progress line
        // to prevent duplicating playback controls, volume, and seek bar!
        const isPremium = this.hasPremium();
        widget.classList.toggle('ss2-has-premium', isPremium);

        const miniCtrls = widget.querySelector('.ss2-mini-ctrls');
        const miniScrub = document.getElementById('ss2-mini-scrub');
        const miniVolWrap = document.getElementById('ss2-mini-vol-wrap');

        if (this._expanded) {
            if (miniCtrls) miniCtrls.style.display = 'none';
            if (miniScrub) miniScrub.style.display = 'none';
            if (miniVolWrap) miniVolWrap.style.display = 'none';
        } else {
            // In compact mode:
            if (miniCtrls) {
                let showCtrls = true;
                if (!this.config.showControls) showCtrls = false;
                else if (this.config.controlsVisibility === 'whenPlaying') showCtrls = isPlaying;
                else if (this.config.controlsVisibility === 'whenOpen') showCtrls = false; // 'whenOpen' means controls are shown ONLY when expanded
                miniCtrls.style.display = showCtrls ? 'flex' : 'none';
            }
            if (miniScrub) {
                miniScrub.style.display = this.config.showProgressBar ? 'block' : 'none';
            }
            if (miniVolWrap) {
                // Mini volume appears whenever showVolumeSlider is enabled
                miniVolWrap.style.display = this.config.showVolumeSlider ? 'inline-flex' : 'none';
            }
        }

        // Show/Hide expanded features based on config
        const scrubWrap = document.getElementById('ss2-scrub-wrap');
        if (scrubWrap) scrubWrap.style.display = this.config.showProgressBar ? 'block' : 'none';

        const volBox = document.getElementById('ss2-vol-box');
        if (volBox) volBox.style.display = this.config.showVolumeSlider ? 'flex' : 'none';

        const likeBtn = document.getElementById('ss2-like-btn');
        if (likeBtn) likeBtn.style.display = (isPremium && this.config.showLikeButton) ? 'flex' : 'none';

        const shuffleBtn = document.getElementById('ss2-shuffle-btn');
        if (shuffleBtn) shuffleBtn.style.display = (isPremium && this.config.showShuffleRepeat) ? 'flex' : 'none';

        const repeatBtn = document.getElementById('ss2-repeat-btn');
        if (repeatBtn) repeatBtn.style.display = (isPremium && this.config.showShuffleRepeat) ? 'flex' : 'none';

        const openSpotifyBtn = document.getElementById('ss2-open-spotify-btn');
        if (openSpotifyBtn) openSpotifyBtn.style.display = !isPremium ? 'flex' : 'none';

        const copyLinkBtn = document.getElementById('ss2-copy-link-btn');
        if (copyLinkBtn) copyLinkBtn.style.display = !isPremium ? 'flex' : 'none';

        const lyricsBtn = document.getElementById('ss2-lyrics-tab-btn');
        if (lyricsBtn) lyricsBtn.style.display = this.config.showLyricsButton ? 'flex' : 'none';

        const queueBtn = document.getElementById('ss2-queue-tab-btn');
        if (queueBtn) queueBtn.style.display = (isPremium && this.config.showQueueButton) ? 'flex' : 'none';

        const libraryBtn = document.getElementById('ss2-library-tab-btn');
        if (libraryBtn) libraryBtn.style.display = (isPremium && this.config.showPlaylistsButton) ? 'flex' : 'none';

        const devicesBtn = document.getElementById('ss2-devices-tab-btn');
        if (devicesBtn) devicesBtn.style.display = (isPremium && this.config.showDevicesButton) ? 'flex' : 'none';

        const shareBtn = document.getElementById('ss2-share-btn');
        if (shareBtn) shareBtn.style.display = this.config.showShareButton ? 'flex' : 'none';
    }

    updatePlayPauseIcons() {
        const playIcon = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
        const pauseIcon = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
        const currentIcon = this._isPlaying ? pauseIcon : playIcon;

        const miniPlay = document.getElementById('ss2-mini-play');
        const expPlay = document.getElementById('ss2-exp-play');
        if (miniPlay) miniPlay.innerHTML = currentIcon;
        if (expPlay) expPlay.innerHTML = currentIcon;
    }

    updateVolumeIcons() {
        const volIcon = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>';
        const muteIcon = '<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
        const icon = (this._volumePercent === 0) ? muteIcon : volIcon;

        const miniBtn = document.getElementById('ss2-mini-vol-btn');
        if (miniBtn) miniBtn.innerHTML = icon;

        const volBox = document.getElementById('ss2-vol-box');
        if (volBox) {
            const svg = volBox.querySelector('svg');
            if (svg) svg.outerHTML = icon;
        }
    }

    updateLikeButton() {
        const btn = document.getElementById('ss2-like-btn');
        if (!btn) return;
        btn.classList.toggle('ss2-liked', this._isLiked);
        btn.title = this._isLiked ? this.t('unlike') : this.t('like');
        btn.innerHTML = this._isLiked
            ? '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
            : '<svg viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg>';
    }

    updateShuffleButton() {
        const btn = document.getElementById('ss2-shuffle-btn');
        if (btn) {
            btn.classList.toggle('ss2-active-dot', this._shuffleState);
            btn.style.color = this._shuffleState ? 'var(--ss-accent, #1DB954)' : 'rgba(255, 255, 255, 0.7)';
        }
    }

    updateRepeatButton() {
        const btn = document.getElementById('ss2-repeat-btn');
        if (!btn) return;
        const isActive = this._repeatState !== 'off';
        btn.classList.toggle('ss2-active-dot', isActive);
        btn.style.color = isActive ? 'var(--ss-accent, #1DB954)' : 'rgba(255, 255, 255, 0.7)';
        btn.innerHTML = this._repeatState === 'track'
            ? '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>'
            : '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>';
    }

    // ═══════════════════ SUB-VIEWS (EXPANDABLE IN SIDEBAR) ═══════════════════
    toggleSubView(viewName) {
        const mount = document.getElementById('ss2-subview-mount');
        if (!mount) return;

        if (viewName !== 'lyrics' && !this.hasPremium()) {
            this.safeShowToast('👑 Esta função requer uma conta do Spotify Premium conectada!', { type: 'warning' });
            return;
        }

        if (this._activeSubView === viewName) {
            // Close sub-view
            this.closeSubView();
            return;
        }

        this._activeSubView = viewName;
        const widget = document.getElementById('ss2-widget');
        if (widget) {
            widget.classList.add('ss2-subview-active');
            widget.classList.toggle('ss2-lyrics-active', viewName === 'lyrics');
            if (viewName !== 'lyrics') {
                widget.classList.remove('ss2-lyrics-fullscreen');
                this._isLyricsFullscreen = false;
            }
        }

        if (viewName === 'lyrics') this.renderLyricsView(mount);
        else if (viewName === 'queue') this.renderQueueView(mount);
        else if (viewName === 'devices') this.renderDevicesView(mount);
        else if (viewName === 'library') this.renderLibraryView(mount);
    }

    closeSubView() {
        this._activeSubView = null;
        const widget = document.getElementById('ss2-widget');
        if (widget) {
            widget.classList.remove('ss2-subview-active', 'ss2-lyrics-active', 'ss2-lyrics-fullscreen');
        }
        this._isLyricsFullscreen = false;
        const mount = document.getElementById('ss2-subview-mount');
        if (mount) mount.innerHTML = '';
        if (this._lyricsInterval) {
            clearInterval(this._lyricsInterval);
            this._lyricsInterval = null;
        }
    }

    // 1. Lyrics Sub-View
    async renderLyricsView(mount) {
        const closeIcon = '<svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:currentColor;"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>';
        const copyIcon = '<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
        const expandIcon = '<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';

        mount.innerHTML = `
            <div class="ss2-subview-panel">
                <div class="ss2-subview-header">
                    <button class="ss2-btn" id="ss2-subview-back" title="Voltar">${closeIcon}</button>
                    <span class="ss2-subview-title">${this.t('lyrics')}</span>
                    <button class="ss2-btn" id="ss2-lyrics-size-btn" title="Expandir / Reduzir">${expandIcon}</button>
                    <button class="ss2-btn" id="ss2-lyrics-copy-btn" title="${this.t('copyLyrics')}">${copyIcon}</button>
                </div>
                <div class="ss2-lyrics-scroll-wrap">
                    <div class="ss2-subview-content" id="ss2-lyrics-scroll" style="align-items:center;justify-content:center;">
                        <div style="color:rgba(255,255,255,0.4);font-size:12px;">Carregando letras...</div>
                    </div>
                </div>
            </div>
        `;

        mount.querySelector('#ss2-subview-back')?.addEventListener('click', () => this.closeSubView());

        mount.querySelector('#ss2-lyrics-size-btn')?.addEventListener('click', () => {
            const widget = document.getElementById('ss2-widget');
            if (widget) {
                this._isLyricsFullscreen = !this._isLyricsFullscreen;
                widget.classList.toggle('ss2-lyrics-fullscreen', this._isLyricsFullscreen);
            }
        });

        const trackTitle = document.getElementById('ss2-title')?.textContent || '';
        const trackArtist = document.getElementById('ss2-artist')?.textContent || '';
        const trackAlbum = document.getElementById('ss2-album')?.textContent || '';

        const lyrics = await this.fetchLyrics(trackTitle, trackArtist, trackAlbum, this._durationMs);
        const scroll = mount.querySelector('#ss2-lyrics-scroll');
        if (!scroll) return;

        if (!lyrics || lyrics.lines.length === 0) {
            scroll.innerHTML = `<div style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;padding:20px;">${this.t('noLyrics')}</div>`;
            return;
        }

        // Copy all lyrics
        mount.querySelector('#ss2-lyrics-copy-btn')?.addEventListener('click', () => {
            const fullText = lyrics.lines.map(l => l.text).join('\n');
            this.copyToClipboard(fullText);
            this.safeShowToast(this.t('lyricsCopied'), { type: 'success' });
        });

        scroll.innerHTML = lyrics.lines.map((l, i) => `
            <div class="ss2-lyric-line" data-time="${l.timeMs}" data-idx="${i}">
                ${l.text}
            </div>
        `).join('');

        // Click on line to seek
        scroll.querySelectorAll('.ss2-lyric-line').forEach(lineEl => {
            lineEl.addEventListener('click', () => {
                const t = parseInt(lineEl.dataset.time, 10);
                if (t >= 0) {
                    this._positionMs = t;
                    this._positionTimestamp = Date.now();
                    this.seek(t);
                }
            });
        });

        // Synced Scrolling Engine
        if (lyrics.synced) {
            let lastIdx = -1;
            if (this._lyricsInterval) clearInterval(this._lyricsInterval);
            this._lyricsInterval = setInterval(() => {
                if (!this._isPlaying || !this._durationMs || document.hidden) return;
                const elapsed = Date.now() - this._positionTimestamp;
                const curPos = this._positionMs + elapsed;

                let activeIdx = -1;
                for (let i = lyrics.lines.length - 1; i >= 0; i--) {
                    if (lyrics.lines[i].timeMs <= curPos) {
                        activeIdx = i;
                        break;
                    }
                }

                if (activeIdx !== lastIdx) {
                    lastIdx = activeIdx;
                    const allLines = scroll.querySelectorAll('.ss2-lyric-line');
                    allLines.forEach((el, i) => {
                        el.classList.toggle('ss2-lyric-active', i === activeIdx);
                    });
                    if (activeIdx >= 0 && allLines[activeIdx]) {
                        allLines[activeIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, 200);
        }
    }

    // 2. Queue Sub-View
    async renderQueueView(mount) {
        const closeIcon = '<svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:currentColor;"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>';
        mount.innerHTML = `
            <div class="ss2-subview-panel">
                <div class="ss2-subview-header">
                    <button class="ss2-btn" id="ss2-subview-back">${closeIcon}</button>
                    <span class="ss2-subview-title">${this.t('queue')}</span>
                </div>
                <div class="ss2-subview-content" id="ss2-queue-content">
                    <div style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;padding:20px;">Carregando fila...</div>
                </div>
            </div>
        `;

        mount.querySelector('#ss2-subview-back')?.addEventListener('click', () => this.closeSubView());

        if (!this.hasPremium()) {
            const content = mount.querySelector('#ss2-queue-content');
            if (content) {
                content.innerHTML = `
                    <div style="color:#1DB954;font-size:13px;text-align:center;padding:36px 16px;line-height:1.5;">
                        <div style="font-size:2.2em;margin-bottom:8px;">👑</div>
                        <b style="color:#fff;font-size:1.05em;">${this.t('fullPowersTitle')}</b>
                        <p style="color:rgba(255,255,255,0.72);font-size:12px;margin:8px 0 0 0;">${this.t('fullPowersDesc')}</p>
                    </div>`;
            }
            return;
        }

        const qData = await this.fetchPlayerQueue();
        const content = mount.querySelector('#ss2-queue-content');
        if (!content) return;

        if (!qData.queue || qData.queue.length === 0) {
            content.innerHTML = `<div style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;padding:20px;">${this.t('emptyQueue')}</div>`;
            return;
        }

        content.innerHTML = qData.queue.map((item, idx) => {
            const isCur = idx === 0;
            const imgUrl = item.album?.images?.[0]?.url || '';
            const artistNames = (item.artists || []).map(a => a.name).join(', ');
            return `
                <div class="ss2-item-card ${isCur ? 'ss2-item-active' : ''}" data-uri="${item.uri}">
                    <img class="ss2-item-img" src="${imgUrl}" alt="" />
                    <div class="ss2-item-meta">
                        <span class="ss2-item-title">${item.name || 'Unknown'}</span>
                        <span class="ss2-item-sub">${artistNames}</span>
                    </div>
                </div>
            `;
        }).join('');

        content.querySelectorAll('.ss2-item-card').forEach(card => {
            card.addEventListener('click', () => {
                const uri = card.dataset.uri;
                if (uri) {
                    this.spotifyApi('/play', 'PUT', { uris: [uri] });
                    this.safeShowToast('Tocando faixa selecionada...', { type: 'success' });
                    this.closeSubView();
                }
            });
        });
    }

    // 3. Spotify Connect Devices Sub-View
    async renderDevicesView(mount) {
        const closeIcon = '<svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:currentColor;"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>';
        mount.innerHTML = `
            <div class="ss2-subview-panel">
                <div class="ss2-subview-header">
                    <button class="ss2-btn" id="ss2-subview-back">${closeIcon}</button>
                    <span class="ss2-subview-title">${this.t('devices')}</span>
                </div>
                <div class="ss2-subview-content" id="ss2-devices-content">
                    <div style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;padding:20px;">Buscando dispositivos...</div>
                </div>
            </div>
        `;

        mount.querySelector('#ss2-subview-back')?.addEventListener('click', () => this.closeSubView());

        if (!this.hasPremium()) {
            const content = mount.querySelector('#ss2-devices-content');
            if (content) {
                content.innerHTML = `
                    <div style="color:#1DB954;font-size:13px;text-align:center;padding:36px 16px;line-height:1.5;">
                        <div style="font-size:2.2em;margin-bottom:8px;">👑</div>
                        <b style="color:#fff;font-size:1.05em;">${this.t('fullPowersTitle')}</b>
                        <p style="color:rgba(255,255,255,0.72);font-size:12px;margin:8px 0 0 0;">${this.t('fullPowersDesc')}</p>
                    </div>`;
            }
            return;
        }

        const devices = await this.fetchDevices();
        const content = mount.querySelector('#ss2-devices-content');
        if (!content) return;

        if (!devices || devices.length === 0) {
            content.innerHTML = `<div style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;padding:20px;">${this.t('noDevices')}</div>`;
            return;
        }

        const deviceIcon = (type) => {
            switch ((type || '').toLowerCase()) {
                case 'smartphone': return '📱';
                case 'speaker': return '🔊';
                case 'tv': return '📺';
                default: return '💻';
            }
        };

        content.innerHTML = devices.map(d => `
            <div class="ss2-item-card ${d.is_active ? 'ss2-item-active' : ''}" data-dev-id="${d.id}" data-dev-name="${d.name || 'Device'}" data-volume="${d.volume_percent ?? ''}">
                <div style="font-size: 20px; width: 32px; text-align: center;">${deviceIcon(d.type)}</div>
                <div class="ss2-item-meta">
                    <span class="ss2-item-title">${d.name || 'Device'}</span>
                    <span class="ss2-item-sub">${d.type} • 🔊 ${d.volume_percent ?? '?'}%</span>
                </div>
                ${d.is_active ? `<span style="font-size:10px;font-weight:700;color:var(--ss-accent);background:var(--ss-accent-bg);padding:2px 6px;border-radius:10px;">${this.t('activeDevice')}</span>` : ''}
            </div>
        `).join('');

        content.querySelectorAll('.ss2-item-card').forEach(card => {
            card.addEventListener('click', () => {
                const devId = card.dataset.devId;
                const devName = card.dataset.devName || devId;
                const volStr = card.dataset.volume;
                const targetVol = (volStr !== '' && !isNaN(volStr)) ? parseInt(volStr, 10) : null;
                if (devId) {
                    this.transferPlayback(devId, true, targetVol, devName);
                    this.closeSubView();
                }
            });
        });
    }

    // 4. Playlists Library Sub-View
    async renderLibraryView(mount) {
        const closeIcon = '<svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:currentColor;"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>';
        mount.innerHTML = `
            <div class="ss2-subview-panel">
                <div class="ss2-subview-header">
                    <button class="ss2-btn" id="ss2-subview-back">${closeIcon}</button>
                    <span class="ss2-subview-title">${this.t('library')}</span>
                </div>
                <div class="ss2-subview-content" id="ss2-library-content">
                    <div style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;padding:20px;">Carregando playlists...</div>
                </div>
            </div>
        `;

        mount.querySelector('#ss2-subview-back')?.addEventListener('click', () => this.closeSubView());

        if (!this.hasPremium()) {
            const content = mount.querySelector('#ss2-library-content');
            if (content) {
                content.innerHTML = `
                    <div style="color:#1DB954;font-size:13px;text-align:center;padding:36px 16px;line-height:1.5;">
                        <div style="font-size:2.2em;margin-bottom:8px;">👑</div>
                        <b style="color:#fff;font-size:1.05em;">${this.t('fullPowersTitle')}</b>
                        <p style="color:rgba(255,255,255,0.72);font-size:12px;margin:8px 0 0 0;">${this.t('fullPowersDesc')}</p>
                    </div>`;
            }
            return;
        }

        const playlists = await this.fetchUserPlaylists();
        const content = mount.querySelector('#ss2-library-content');
        if (!content) return;

        if (!playlists || playlists.length === 0) {
            content.innerHTML = `<div style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;padding:20px;">${this.t('emptyLibrary')}</div>`;
            return;
        }

        content.innerHTML = playlists.map(p => `
            <div class="ss2-item-card" data-uri="${p.uri}">
                <img class="ss2-item-img" src="${p.images?.[0]?.url || ''}" alt="" />
                <div class="ss2-item-meta">
                    <span class="ss2-item-title">${p.name || 'Playlist'}</span>
                    <span class="ss2-item-sub">${p.tracks?.total || 0} faixas • ${p.owner?.display_name || ''}</span>
                </div>
            </div>
        `).join('');

        content.querySelectorAll('.ss2-item-card').forEach(card => {
            card.addEventListener('click', () => {
                const uri = card.dataset.uri;
                if (uri) {
                    this.spotifyApi('/play', 'PUT', { context_uri: uri });
                    this.safeShowToast('Tocando playlist...', { type: 'success' });
                    this.closeSubView();
                }
            });
        });
    }

    // ═══════════════════ WEBSOCKET & SOLARI APP BRIDGE ═══════════════════
    connectToServer() {
        try {
            this.shouldReconnect = true;
            this.ws = new WebSocket(this.config.serverUrl || 'ws://127.0.0.1:6464');
            this.ws.onopen = () => {
                this.isConnectedToSolari = true;
                console.log('[SpotifySync] Connected to Solari Desktop App WSS (Port 6464)');
                this.safeShowToast(this.t('spotifySynced'), { type: 'success' });
                this.send({ type: 'handshake', source: 'SpotifySync' });
                this.send({ type: 'spotify_config', config: this.config, schema: this.getSettingsSchema() });
                this.refreshSettingsUI();
            };
            this.ws.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    this.handleMessage(data);
                } catch (err) { }
            };
            this.ws.onclose = () => {
                this.isConnectedToSolari = false;
                this.refreshSettingsUI();
                if (this.shouldReconnect) {
                    setTimeout(() => this.connectToServer(), 6000);
                }
            };
            this.ws.onerror = () => { };
        } catch (e) {
            console.error('[SpotifySync] WS connection error:', e);
        }
    }

    send(data) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    handleMessage(data) {
        if (!data) return;

        if (data.type === 'update_spotify_settings' || data.type === 'spotify_sync_settings_update') {
            const incoming = data.settings || {};
            const cleanSettings = { ...incoming };

            // Protect existing tokens from being erased by empty payloads
            if (!cleanSettings.spotifyAccessToken && this.config.spotifyAccessToken) {
                delete cleanSettings.spotifyAccessToken;
                delete cleanSettings.spotifyRefreshToken;
                delete cleanSettings.spotifyTokenExpiry;
            }

            this.config = { ...this.config, ...cleanSettings };
            this.saveConfig();
            this.syncStateWithDiscord();
            this.send({ type: 'spotify_config', config: this.config, schema: this.getSettingsSchema() });
            this.refreshSettingsUI();
        } else if (data.type === 'spotify_control') {
            this.executeControl(data.action);
        } else if (data.type === 'start_spotify_auth') {
            this.startPremiumAuth();
        } else if (data.type === 'finish_spotify_auth') {
            this.finishPremiumAuth(data.code);
        } else if (data.type === 'set_language' && data.language) {
            this.config.language = data.language;
            this.saveConfig();
            this.refreshSettingsUI();
        }
    }

    // ═══════════════════ AUTHENTICATION (PKCE & SOLARI 1-CLICK) ═══════════════════
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
        const clientId = this.config.spotifyClientId || '8483b8b60a3c4803b9ad6f4cbe5fb901';
        const redirectUri = this.config.spotifyRedirectUri || 'http://127.0.0.1:8888/callback';

        // Notify Solari App to launch local listener on 8888
        this.send({ type: 'start_spotify_auth_server' });

        const { verifier, challenge } = await this.generatePKCE();
        this.config.spotifyVerifier = verifier;
        this.saveConfig();

        const scope = 'user-read-playback-state user-modify-playback-state user-read-currently-playing app-remote-control streaming user-library-read user-library-modify playlist-read-private playlist-read-collaborative';
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge_method=S256&code_challenge=${challenge}&scope=${encodeURIComponent(scope)}`;

        window.open(authUrl, '_blank');
        this.safeShowToast('Abrindo login do Spotify no navegador... 🎵', { type: 'info' });
    }

    async finishPremiumAuth(urlOrCode) {
        if (!urlOrCode) return;
        let code = urlOrCode.trim();
        if (code.includes('code=')) {
            const match = code.match(/[?&#]code=([^&]*)/);
            if (match && match[1]) code = decodeURIComponent(match[1]);
        }

        try {
            const clientId = this.config.spotifyClientId || '8483b8b60a3c4803b9ad6f4cbe5fb901';
            const redirectUri = this.config.spotifyRedirectUri || 'http://127.0.0.1:8888/callback';

            const body = new URLSearchParams({
                client_id: clientId,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                code_verifier: this.config.spotifyVerifier
            });

            const res = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error_description || data.error);

            this.config.spotifyAccessToken = data.access_token;
            if (data.refresh_token) this.config.spotifyRefreshToken = data.refresh_token;
            this.config.spotifyTokenExpiry = Date.now() + (data.expires_in * 1000);
            this.config.spotifyVerifier = '';
            this._authWaiting = false;
            this._isConnectingAuth = false;
            this.saveConfig();

            // Sincroniza status com o Solari Desktop App
            this.send({
                type: 'spotify_status_update',
                connected: true,
                accessToken: this.config.spotifyAccessToken,
                refreshToken: this.config.spotifyRefreshToken,
                tokenExpiry: this.config.spotifyTokenExpiry
            });
            this.send({
                type: 'spotify_config',
                config: this.config,
                schema: this.getSettingsSchema()
            });
            this.send({
                type: 'spotify-config-updated',
                config: this.config,
                schema: this.getSettingsSchema()
            });

            this.safeShowToast('✨ Conexão com Spotify concluída!', { type: 'success' });
            // Immediate real-time refresh of BetterDiscord settings modal
            this.refreshSettingsUI();
            await this.fetchUserProfile();
            this.syncStateWithDiscord();
        } catch (e) {
            this._authWaiting = false;
            this._isConnectingAuth = false;
            console.error('[SpotifySync] Auth Code Exchange error:', e);
            this.safeShowToast(`❌ Erro de Autenticação: ${e.message}`, { type: 'error' });
            this.refreshSettingsUI();
        }
    }

    async fetchUserProfile() {
        const data = await this.spotifyApi('/me', 'GET', null, false);
        if (data) {
            if (data.display_name) this.config._userDisplayName = data.display_name;
            if (data.product) this.config._userProduct = data.product;
            this.saveConfig();
            this.refreshSettingsUI();
        }
    }

    hasPremium() {
        if (!this.config.spotifyRefreshToken) return false;
        if (this.config._userProduct && this.config._userProduct !== 'premium') return false;
        return true;
    }

    // ═══════════════════ REACTIVE SETTINGS PANEL REFRESHER ═══════════════════
    refreshSettingsUI() {
        const target = (this._activeSettingsPanel && document.body.contains(this._activeSettingsPanel))
            ? this._activeSettingsPanel
            : document.querySelector('.ss2-settings-panel');

        if (target && typeof this._refreshSettingsPanel === 'function') {
            this._activeSettingsPanel = target;
            try {
                this._refreshSettingsPanel();
            } catch (e) {
                console.error('[SpotifySync] Error refreshing settings UI:', e);
            }
        }
    }

    // ═══════════════════ SETTINGS PANEL (BETTERDISCORD UI) ═══════════════════
    getSettingsPanel() {
        const panel = document.createElement('div');
        panel.className = 'ss2-settings-panel';
        panel.style.cssText = 'padding:20px;font-family:"Segoe UI",sans-serif;background:linear-gradient(135deg,#12131a 0%,#181a24 100%);border-radius:12px;color:#fff;';

        const render = () => {
            const target = (this._activeSettingsPanel && document.body.contains(this._activeSettingsPanel))
                ? this._activeSettingsPanel
                : (document.querySelector('.ss2-settings-panel') || panel);
            if (!target) return;

            // Preserve input values and details state
            const currentAuthUrl = target.querySelector('#ss2-auth-url')?.value || '';
            const currentClientId = target.querySelector('#ss2-client-id')?.value || '';
            const wasDevOpen = target.querySelector('details')?.open || false;

            const isPremium = this.hasPremium();
            const toggle = (label, key) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <span style="color:#fff;font-size:0.9em;">${label}</span>
                    <div class="ss2-switch ${this.config[key] ? 'on' : ''}" data-key="${key}" style="width:40px;height:22px;background:${this.config[key] ? '#1DB954' : 'rgba(255,255,255,0.15)'};border-radius:11px;position:relative;cursor:pointer;transition:all 0.3s;">
                        <div style="position:absolute;width:18px;height:18px;background:#fff;border-radius:50%;top:2px;left:${this.config[key] ? '20px' : '2px'};transition:left 0.3s;"></div>
                    </div>
                </div>`;

            target.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h2 style="color:#fff;margin:0;display:flex;align-items:center;gap:8px;">
                        <span style="color:#1DB954;">🎵</span> ${this.t('title')}
                        <span style="color:rgba(255,255,255,0.35);font-size:0.5em;font-weight:600;padding:3px 8px;border-radius:12px;background:rgba(255,255,255,0.08);">${this.t('devVersionNotice')}</span>
                    </h2>
                    <select id="ss2-lang" style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:#fff;padding:5px 8px;">
                        <option value="en" ${this.config.language === 'en' ? 'selected' : ''}>English</option>
                        <option value="pt-BR" ${this.config.language === 'pt-BR' ? 'selected' : ''}>Português</option>
                        <option value="es" ${this.config.language === 'es' ? 'selected' : ''}>Español</option>
                    </select>
                </div>

                <!-- Solari App Link Status -->
                <div style="background:rgba(255,255,255,0.04);border:1px solid ${this.isConnectedToSolari ? 'rgba(29,185,84,0.4)' : 'rgba(239,68,68,0.4)'};border-radius:8px;padding:12px 14px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="width:8px;height:8px;border-radius:50%;background:${this.isConnectedToSolari ? '#1DB954' : '#ef4444'};box-shadow:0 0 8px ${this.isConnectedToSolari ? '#1DB954' : '#ef4444'};"></div>
                        <span style="color:rgba(255,255,255,0.7);font-size:0.9em;">Solari Desktop App:</span>
                        <span style="color:${this.isConnectedToSolari ? '#1DB954' : '#ef4444'};font-weight:700;">${this.isConnectedToSolari ? this.t('connected') : this.t('disconnected')}</span>
                    </div>
                </div>

                <!-- Banner Spotify Premium Obrigatório para Poderes Completos -->
                <div style="background:linear-gradient(135deg,rgba(29,185,84,0.14) 0%,rgba(18,19,26,0.9) 100%);border:1px solid rgba(29,185,84,0.4);border-left:4px solid #1DB954;border-radius:10px;padding:14px 16px;margin-bottom:16px;display:flex;align-items:flex-start;gap:12px;box-shadow:0 4px 20px rgba(0,0,0,0.25);">
                    <div style="width:34px;height:34px;border-radius:8px;background:rgba(29,185,84,0.18);color:#1DB954;display:flex;align-items:center;justify-content:center;font-size:1.3em;flex-shrink:0;">👑</div>
                    <div style="flex:1;">
                        <strong style="color:#1DB954;font-size:0.95em;display:block;margin-bottom:4px;letter-spacing:0.2px;">
                            ${this.t('premiumNoticeTitle')}
                        </strong>
                        <p style="color:rgba(255,255,255,0.78);font-size:0.83em;margin:0;line-height:1.45;">
                            ${this.t('premiumNoticeDesc')}
                        </p>
                    </div>
                </div>

                <!-- Spotify Connection Card -->
                <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:16px;margin-bottom:16px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                        <h3 style="margin:0;font-size:1.05em;color:#fff;display:flex;align-items:center;gap:6px;">💎 ${this.t('premiumTitle')}</h3>
                        <span style="font-size:0.8em;padding:3px 8px;border-radius:6px;background:${isPremium ? '#1DB954' : '#333'};color:${isPremium ? '#000' : '#bbb'};font-weight:700;">
                            ${isPremium ? this.t('connected') : this.t('disconnected')}
                        </span>
                    </div>
                    <p style="color:rgba(255,255,255,0.6);font-size:0.85em;margin:0 0 16px 0;line-height:1.4;">${this.t('premiumHelp')}</p>

                    ${!isPremium ? `
                        <!-- Passo 1: Abrir Login -->
                        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-left:3px solid #1DB954;border-radius:8px;padding:12px 14px;margin-bottom:12px;">
                            <strong style="color:#fff;font-size:0.95em;display:block;margin-bottom:4px;">${this.t('step1')}</strong>
                            <p style="color:rgba(255,255,255,0.65);font-size:0.85em;margin:0 0 10px 0;line-height:1.4;">${this.t('step1Help')}</p>
                            <button id="ss2-auth-btn" style="background:#1DB954;color:#000;font-weight:700;font-size:0.95em;border:none;padding:10px 18px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;width:100%;box-shadow:0 4px 14px rgba(29,185,84,0.3);transition:all 0.2s;">
                                ${this._authWaiting ? '⏳ Aguardando autorização no navegador...' : `🚀 ${this.t('authorize')}`}
                            </button>
                        </div>

                        <!-- Passo 2: Copiar Link -->
                        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-left:3px solid #1DB954;border-radius:8px;padding:12px 14px;margin-bottom:12px;">
                            <strong style="color:#fff;font-size:0.95em;display:block;margin-bottom:4px;">${this.t('step2')}</strong>
                            <p style="color:rgba(255,255,255,0.65);font-size:0.85em;margin:0 0 8px 0;line-height:1.4;">${this.t('step2Help')}</p>
                            <div style="background:rgba(29,185,84,0.08);border:1px solid rgba(29,185,84,0.2);border-radius:6px;padding:8px 12px;color:rgba(255,255,255,0.85);font-size:0.8em;line-height:1.4;">
                                ${this.t('solariAutoNotice')}
                            </div>
                        </div>

                        <!-- Passo 3: Colar Link e Conectar -->
                        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-left:3px solid #1DB954;border-radius:8px;padding:12px 14px;margin-bottom:12px;">
                            <strong style="color:#fff;font-size:0.95em;display:block;margin-bottom:4px;">${this.t('step3')}</strong>
                            <p style="color:rgba(255,255,255,0.65);font-size:0.85em;margin:0 0 10px 0;line-height:1.4;">${this.t('step3Help')}</p>
                            <div style="display:flex;gap:8px;align-items:center;">
                                <input id="ss2-auth-url" type="text" placeholder="${this.t('pasteUrl')}" value="${currentAuthUrl}" style="flex:1;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:10px 14px;border-radius:8px;font-size:12px;outline:none;transition:border 0.2s;" />
                                <button id="ss2-connect-btn" ${this._isConnectingAuth ? 'disabled' : ''} style="background:#1DB954;color:#000;font-weight:700;border:none;padding:10px 18px;border-radius:8px;cursor:${this._isConnectingAuth ? 'not-allowed' : 'pointer'};white-space:nowrap;font-size:0.9em;box-shadow:0 2px 10px rgba(29,185,84,0.25);transition:all 0.2s;opacity:${this._isConnectingAuth ? '0.7' : '1'};">
                                    ${this._isConnectingAuth ? '⏳ Conectando...' : this.t('connect')}
                                </button>
                            </div>
                        </div>

                        <!-- Opções Avançadas de Desenvolvedor -->
                        <details style="margin-top:12px;background:rgba(0,0,0,0.2);padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);">
                            <summary style="cursor:pointer;color:rgba(255,255,255,0.6);font-size:0.85em;font-weight:600;user-select:none;">⚙️ ${this.t('devSettings')}</summary>
                            <div style="margin-top:10px;display:flex;flex-direction:column;gap:10px;">
                                <p style="color:rgba(255,255,255,0.5);font-size:0.8em;margin:0;">${this.t('devSettingsHelp')}</p>
                                <div>
                                    <label style="color:rgba(255,255,255,0.7);font-size:0.8em;display:block;margin-bottom:4px;">${this.t('redirectUri')}</label>
                                    <div style="display:flex;gap:6px;">
                                        <input type="text" value="${this.config.spotifyRedirectUri || 'http://127.0.0.1:8888/callback'}" readonly style="flex:1;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.15);color:#aaa;padding:6px 10px;border-radius:6px;font-size:12px;cursor:not-allowed;" />
                                        <button id="ss2-copy-uri-btn" style="background:rgba(255,255,255,0.1);color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.8em;">${this.t('copy')}</button>
                                    </div>
                                </div>
                                <div>
                                    <label style="color:rgba(255,255,255,0.7);font-size:0.8em;display:block;margin-bottom:4px;">${this.t('clientId')}</label>
                                    <input id="ss2-client-id" type="text" placeholder="8483b8b60a3c4803b9ad6f4cbe5fb901 (Padrão)" value="${currentClientId || this.config.spotifyClientId || ''}" style="width:100%;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.15);color:#fff;padding:6px 10px;border-radius:6px;font-size:12px;box-sizing:border-box;" />
                                </div>
                            </div>
                        </details>
                    ` : `
                        <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(29,185,84,0.1);padding:12px 16px;border-radius:8px;border:1px solid rgba(29,185,84,0.25);margin-bottom:12px;">
                            <div style="display:flex;align-items:center;gap:12px;">
                                <div style="width:36px;height:36px;border-radius:50%;background:#1DB954;color:#000;display:flex;align-items:center;justify-content:center;font-size:1.1em;font-weight:700;">🎵</div>
                                <div>
                                    <div style="color:#fff;font-weight:700;font-size:0.95em;">${this.t('connectedAs')}</div>
                                    <div style="color:rgba(255,255,255,0.7);font-size:0.85em;">${this.config._userDisplayName || 'Conta Spotify Conectada'}</div>
                                </div>
                            </div>
                            <button id="ss2-logout-btn" style="background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.4);padding:8px 14px;border-radius:8px;cursor:pointer;font-size:0.85em;font-weight:600;transition:all 0.2s;">
                                ${this.t('disconnect')}
                            </button>
                        </div>
                        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-left:3px solid #1DB954;border-radius:8px;padding:10px 14px;font-size:0.82em;color:rgba(255,255,255,0.75);line-height:1.45;">
                            👑 <b style="color:#1DB954;">${this.t('fullPowersTitle')}:</b> ${this.t('fullPowersDesc')}
                        </div>
                    `}
                </div>

                <!-- Controls Visibility (When Playing vs Always Show) -->
                <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:14px 16px;margin-bottom:16px;">
                    <div style="color:rgba(255,255,255,0.85);font-size:0.95em;font-weight:700;margin-bottom:10px;">${this.t('controlsVisibility')}</div>
                    <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;color:#fff;margin-bottom:12px;">
                        <input type="radio" name="ss2vis" value="whenPlaying" ${this.config.controlsVisibility === 'whenPlaying' ? 'checked' : ''} style="accent-color:#1DB954;margin-top:3px;cursor:pointer;width:16px;height:16px;"/>
                        <div>
                            <div style="font-weight:600;font-size:0.9em;">${this.t('whenPlaying')}</div>
                            <div style="font-size:0.8em;color:rgba(255,255,255,0.45);margin-top:2px;">${this.t('whenPlayingHint')}</div>
                        </div>
                    </label>
                    <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;color:#fff;">
                        <input type="radio" name="ss2vis" value="whenOpen" ${this.config.controlsVisibility === 'whenOpen' ? 'checked' : ''} style="accent-color:#1DB954;margin-top:3px;cursor:pointer;width:16px;height:16px;"/>
                        <div>
                            <div style="font-weight:600;font-size:0.9em;">${this.t('whenOpen')}</div>
                            <div style="font-size:0.8em;color:rgba(255,255,255,0.45);margin-top:2px;">${this.t('whenOpenHint')}</div>
                        </div>
                    </label>
                </div>

                <!-- Display Settings -->
                <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:8px 16px;margin-bottom:16px;">
                    ${toggle(this.t('showControls'), 'showControls')}
                    ${toggle(this.t('startCompact'), 'startCompact')}
                    ${toggle(this.t('showAlbumArt'), 'showAlbumArt')}
                    ${toggle(this.t('showProgressBar'), 'showProgressBar')}
                    ${toggle(this.t('showVisualizer'), 'showVisualizer')}
                    ${toggle(this.t('dynamicTheme'), 'dynamicTheme')}
                    ${toggle(this.t('showVolumeSlider'), 'showVolumeSlider')}
                    ${toggle(this.t('showLyricsButton'), 'showLyricsButton')}
                    ${toggle(this.t('showShareButton'), 'showShareButton')}
                    ${isPremium ? `
                        <div style="margin:12px 0 6px 0;padding-top:10px;border-top:1px solid rgba(29,185,84,0.25);display:flex;align-items:center;gap:6px;">
                            <span style="font-size:0.85em;color:#1DB954;font-weight:700;">👑 ${this.t('fullPowersTitle')}</span>
                        </div>
                        ${toggle(this.t('showLikeButton'), 'showLikeButton')}
                        ${toggle(this.t('showShuffleRepeat'), 'showShuffleRepeat')}
                        ${toggle(this.t('showQueueButton'), 'showQueueButton')}
                        ${toggle(this.t('showDevicesButton'), 'showDevicesButton')}
                        ${toggle(this.t('showPlaylistsButton'), 'showPlaylistsButton')}
                    ` : ''}
                </div>
            `;

            // Restore details state if open
            if (wasDevOpen) {
                const devDetails = target.querySelector('details');
                if (devDetails) devDetails.open = true;
            }

            // Listeners
            target.querySelectorAll('.ss2-switch').forEach(sw => {
                sw.addEventListener('click', () => {
                    const k = sw.dataset.key;
                    this.config[k] = !this.config[k];
                    this.saveConfig();
                    if (k === 'showControls') {
                        if (this.config.showControls) this.injectWidget();
                        else this.removeWidget();
                    } else {
                        this.syncStateWithDiscord();
                    }
                    this.send({ type: 'spotify_config', config: this.config, schema: this.getSettingsSchema() });
                    this.send({ type: 'spotify-config-updated', config: this.config, schema: this.getSettingsSchema() });
                    this.refreshSettingsUI();
                });
            });

            target.querySelectorAll('input[name="ss2vis"]').forEach(r => {
                r.addEventListener('change', (e) => {
                    this.config.controlsVisibility = e.target.value;
                    this.saveConfig();
                    this.syncStateWithDiscord();
                });
            });

            target.querySelector('#ss2-lang')?.addEventListener('change', (e) => {
                this.config.language = e.target.value;
                this.saveConfig();
                this.refreshSettingsUI();
            });

            target.querySelector('#ss2-auth-btn')?.addEventListener('click', () => {
                this._authWaiting = true;
                this.startPremiumAuth();
                this.refreshSettingsUI();
            });

            target.querySelector('#ss2-connect-btn')?.addEventListener('click', () => {
                const clientId = target.querySelector('#ss2-client-id')?.value.trim();
                if (clientId) this.config.spotifyClientId = clientId;
                const val = target.querySelector('#ss2-auth-url')?.value.trim();
                if (val) {
                    this._isConnectingAuth = true;
                    this.refreshSettingsUI();
                    this.finishPremiumAuth(val);
                } else {
                    this.safeShowToast('Cole a URL ou código de autorização primeiro!', { type: 'warning' });
                }
            });

            target.querySelector('#ss2-auth-url')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    target.querySelector('#ss2-connect-btn')?.click();
                }
            });

            target.querySelector('#ss2-auth-url')?.addEventListener('paste', () => {
                setTimeout(() => {
                    const val = target.querySelector('#ss2-auth-url')?.value.trim();
                    if (val && (val.includes('code=') || val.startsWith('http'))) {
                        target.querySelector('#ss2-connect-btn')?.click();
                    }
                }, 50);
            });

            target.querySelector('#ss2-copy-uri-btn')?.addEventListener('click', () => {
                this.copyToClipboard(this.config.spotifyRedirectUri || 'http://127.0.0.1:8888/callback');
            });

            target.querySelector('#ss2-logout-btn')?.addEventListener('click', () => {
                this._authWaiting = false;
                this._isConnectingAuth = false;
                this.config.spotifyAccessToken = '';
                this.config.spotifyRefreshToken = '';
                this.config.spotifyTokenExpiry = 0;
                this.config._userDisplayName = '';
                this.config._userProduct = '';
                this.saveConfig();
                this.send({
                    type: 'spotify_status_update',
                    connected: false,
                    accessToken: null,
                    refreshToken: null,
                    tokenExpiry: 0
                });
                this.send({
                    type: 'spotify_config',
                    config: this.config,
                    schema: this.getSettingsSchema()
                });
                this.send({
                    type: 'spotify-config-updated',
                    config: this.config,
                    schema: this.getSettingsSchema()
                });
                this.refreshSettingsUI();
            });
        };

        this._activeSettingsPanel = panel;
        this._refreshSettingsPanel = render;

        render();
        return panel;
    }

    // ═══════════════════ HELPERS & UTILITIES ═══════════════════
    t(key) {
        const lang = this.config.language || 'pt-BR';
        return SpotifySync.translations[lang]?.[key] || SpotifySync.translations['en']?.[key] || key;
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
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
        }
        this.safeShowToast(this.t('copied'), { type: 'success' });
    }

    sendToChat(text) {
        try {
            const ComponentDispatch = BdApi.Webpack.getModule(m => m.dispatchToLastSubscribed && m.emitter, { first: true });
            if (ComponentDispatch) {
                ComponentDispatch.dispatchToLastSubscribed('INSERT_TEXT', { plainText: text });
                this.safeShowToast(this.t('shareCopied'), { type: 'success' });
                return;
            }
        } catch (e) { }
        this.copyToClipboard(text);
    }

    safeShowToast(message, options = {}) {
        try {
            if (typeof BdApi.showToast === 'function') BdApi.showToast(message, options);
            else if (BdApi.UI?.showToast) BdApi.UI.showToast(message, options);
        } catch (e) { }
    }

    loadConfig() {
        try {
            const saved = BdApi.Data.load('SpotifySync', 'config');
            if (saved) this.config = { ...this.config, ...saved };
        } catch (e) { }
    }

    saveConfig() {
        try {
            BdApi.Data.save('SpotifySync', 'config', this.config);
            if (this.isConnectedToSolari) {
                this.send({ type: 'spotify_config', config: this.config, schema: this.getSettingsSchema() });
            }
        } catch (e) { }
    }

    isNewerVersion(current, remote) {
        const c = String(current).split('.').map(p => parseInt(p, 10) || 0);
        const r = String(remote).split('.').map(p => parseInt(p, 10) || 0);
        for (let i = 0; i < Math.max(c.length, r.length); i++) {
            const cVal = c[i] || 0;
            const rVal = r[i] || 0;
            if (rVal > cVal) return true;
            if (cVal > rVal) return false;
        }
        return false;
    }

    checkForUpdates() {
        const updateUrl = this.meta?.updateUrl;
        if (!updateUrl) return;

        fetch(`${updateUrl}?t=${Date.now()}`)
            .then(res => res.text())
            .then(code => {
                const match = code.match(/@version\s+([0-9.]+)/);
                if (!match) return;
                const remote = match[1];
                if (this.isNewerVersion(this.meta.version, remote)) {
                    console.log(`[SpotifySync] Remote version v${remote} available.`);
                }
            })
            .catch(() => { });
    }

    checkChangelog() {
        try {
            const lastVer = BdApi.Data.load('SpotifySync', 'lastVersion');
            if (lastVer && this.isNewerVersion(lastVer, this.meta.version)) {
                console.log(`[SpotifySync] Upgraded from ${lastVer} to ${this.meta.version}`);
            }
            BdApi.Data.save('SpotifySync', 'lastVersion', this.meta.version);
        } catch (e) { }
    }
};

/**
 * @name SolariPlayer
 * @author TheDroid
 * @authorLink https://solarirpc.com
 * @description Premium Video Player for Discord. Features Theater Mode, Glassmorphism UI, Picture-in-Picture, Speed Control, and Screenshot Bypass.
 * @version 1.0.0
 * @source https://github.com/TheDroidBR/Solari
 * @website https://solarirpc.com
 * @updateUrl https://raw.githubusercontent.com/TheDroidBR/Solari/main/plugins/SolariPlayer.plugin.js
 */

class SolariPlayer {

    getName() { return "SolariPlayer"; }
    getDescription() { return "Premium Video Player for Discord. Features Theater Mode, Glassmorphism UI, Picture-in-Picture, Speed Control, and Screenshot Bypass."; }
    getVersion() { return "1.0.0"; }
    getAuthor() { return "TheDroid"; }

    static PLUGIN_ID = "SolariPlayer";

    constructor() {
        this._observer = null;
        this._overlays = [];
    }

    start() {
        console.log(`[${SolariPlayer.PLUGIN_ID}] Iniciando v${this.getVersion()} (Hardcore Edition)`);
        this.injectCSS();
        this.startObserver();

        document.querySelectorAll('video').forEach(v => this.injectOverlay(v));
        BdApi.UI.showToast(`SolariPlayer actived! 🎬✨`, { type: 'success' });
    }

    stop() {
        console.log(`[${SolariPlayer.PLUGIN_ID}] Parando...`);
        if (this._observer) this._observer.disconnect();

        // Remover backdrops e restaurar wrappers em modo teatro
        document.querySelectorAll('.solari-theater-backdrop').forEach(b => b.remove());
        document.querySelectorAll('.solari-theater-mode').forEach(wrapper => {
            wrapper.classList.remove('solari-theater-mode');
            if (wrapper._theaterParent) {
                const p = wrapper._theaterParent;
                const n = wrapper._theaterNext;
                if (p) { if (n && n.parentElement === p) p.insertBefore(wrapper, n); else p.appendChild(wrapper); }
                wrapper._theaterParent = null;
                wrapper._theaterNext = null;
            }
        });

        this._overlays.forEach(overlay => {
            if (overlay._solariDefender) overlay._solariDefender.disconnect();
            if (overlay && overlay.parentNode) {
                if (BdApi.ReactDOM && BdApi.ReactDOM.unmountComponentAtNode) {
                    BdApi.ReactDOM.unmountComponentAtNode(overlay);
                } else if (overlay._reactRoot) {
                    overlay._reactRoot.unmount();
                }
                overlay.remove();
            }
        });
        this._overlays = [];

        document.querySelectorAll('video[data-solari="true"]').forEach(v => {
            v.removeAttribute('data-solari');
            v.removeAttribute('controls');
            if (v.parentElement) v.parentElement.classList.remove("solari-video-wrapper");
        });

        this.removeCSS();
    }

    startObserver() {
        this._observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'VIDEO') {
                            this.injectOverlay(node);
                        } else {
                            const videos = node.querySelectorAll('video');
                            videos.forEach(v => this.injectOverlay(v));
                        }
                        this.cleanupNativeUI(node);
                    }
                }
            }
        });
        this._observer.observe(document.body, { childList: true, subtree: true });
    }

    cleanupNativeUI(root) {
        if (!root || !root.querySelectorAll) return;
        const selectors = [
            '[class*="downloadButton"]', '[class*="downloadWrapper"]',
            '[class*="downloadLink"]', '[class*="videoControls"]',
            '[aria-label*="Download"]', '[title*="Download"]',
            'a[href*="discordapp.net/attachments/"]'
        ];
        root.querySelectorAll(selectors.join(',')).forEach(el => {
            if (!el.closest('.solari-video-overlay')) {
                el.style.setProperty('display', 'none', 'important');
                el.style.setProperty('opacity', '0', 'important');
                el.style.setProperty('pointer-events', 'none', 'important');
                try { el.remove(); } catch (e) { }
            }
        });
    }

    injectOverlay(videoNode) {
        if (videoNode.dataset.solari || videoNode.classList.contains('solari-vp-preview-vid')) return;

        // 1. Filtro Agressivo (Proibir UI fora de mensagens)
        const isInvalidArea = videoNode.closest(`
            [class*="avatar"], [class*="panels_"], [class*="members_"], 
            [class*="sidebar_"], [class*="banner_"], [class*="profile"],
            [class*="emoji"], [class*="sticker"]
        `);
        if (isInvalidArea) return;

        // 3. Garantir que está no Chat ou Modal
        const isValidArea = videoNode.closest(`
            [class*="messageListItem_"], [class*="layer_"], [class*="modal_"]
        `);
        if (!isValidArea && !videoNode.closest('[class*="wrapperAudio_"]')) return;

        videoNode.dataset.solari = "true";
        videoNode.removeAttribute("controls");

        const overlay = document.createElement("div");
        overlay.className = "solari-video-overlay";

        if (videoNode.parentElement) {
            const parent = videoNode.parentElement;
            parent.classList.add("solari-video-wrapper");
            parent.style.position = "relative";

            parent.appendChild(overlay);
            this._overlays.push(overlay);

            this.mountReactControls(overlay, videoNode);

            // Defender Observer: Força o Discord a manter nossa UI intacta durante re-renders do React
            const defender = new MutationObserver(() => {
                if (!parent.classList.contains("solari-video-wrapper")) {
                    parent.classList.add("solari-video-wrapper");
                }
                if (overlay.parentElement !== parent) {
                    parent.appendChild(overlay);
                }
            });
            defender.observe(parent, { childList: true, attributes: true, attributeFilter: ['class'] });
            overlay._solariDefender = defender;
        }
    }

    mountReactControls(container, videoNode) {
        const React = BdApi.React;
        const ReactDOM = BdApi.ReactDOM;
        const el = React.createElement(this.VideoControls.bind(this), { video: videoNode });

        if (ReactDOM.createRoot) {
            container._reactRoot = ReactDOM.createRoot(container);
            container._reactRoot.render(el);
        } else if (ReactDOM.render) {
            ReactDOM.render(el, container);
        }
    }

    // ─── ÍCONES MODERNOS (Estilo Lucide) ────────────────────────────────────
    static Icons = {
        Play: () => BdApi.React.createElement('svg', { viewBox: "0 0 24 24", fill: "currentColor", stroke: "currentColor", strokeWidth: "1", strokeLinecap: "round", strokeLinejoin: "round" }, BdApi.React.createElement('polygon', { points: "5 3 19 12 5 21 5 3" })),
        Pause: () => BdApi.React.createElement('svg', { viewBox: "0 0 24 24", fill: "currentColor", stroke: "currentColor", strokeWidth: "1", strokeLinecap: "round", strokeLinejoin: "round" }, BdApi.React.createElement('rect', { x: "6", y: "4", width: "4", height: "16", rx: "1" }), BdApi.React.createElement('rect', { x: "14", y: "4", width: "4", height: "16", rx: "1" })),
        VolumeHigh: () => BdApi.React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, BdApi.React.createElement('polygon', { points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5" }), BdApi.React.createElement('path', { d: "M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" })),
        VolumeLow: () => BdApi.React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, BdApi.React.createElement('polygon', { points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5" }), BdApi.React.createElement('path', { d: "M15.54 8.46a5 5 0 0 1 0 7.07" })),
        VolumeMuted: () => BdApi.React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, BdApi.React.createElement('polygon', { points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5" }), BdApi.React.createElement('line', { x1: "23", y1: "9", x2: "17", y2: "15" }), BdApi.React.createElement('line', { x1: "17", y1: "9", x2: "23", y2: "15" })),
        Fullscreen: () => BdApi.React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, BdApi.React.createElement('path', { d: "M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" })),
        ExitFullscreen: () => BdApi.React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, BdApi.React.createElement('path', { d: "M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" })),
        PiP: () => BdApi.React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, BdApi.React.createElement('rect', { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }), BdApi.React.createElement('rect', { x: "12", y: "11", width: "7", height: "5", rx: "1", ry: "1" })),
        Download: () => BdApi.React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, BdApi.React.createElement('path', { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" })),
        Loop: () => BdApi.React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, BdApi.React.createElement('polyline', { points: "16 3 21 3 21 8" }), BdApi.React.createElement('line', { x1: "4", y1: "14", x2: "21", y2: "3" }), BdApi.React.createElement('polyline', { points: "8 21 3 21 3 16" }), BdApi.React.createElement('line', { x1: "20", y1: "10", x2: "3", y2: "21" })),
        Settings: () => BdApi.React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, BdApi.React.createElement('circle', { cx: "12", cy: "12", r: "3" }), BdApi.React.createElement('path', { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" })),
        Rewind10: () => BdApi.React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, BdApi.React.createElement('path', { d: "M11 17l-5-5 5-5" }), BdApi.React.createElement('path', { d: "M18 17l-5-5 5-5" })),
        Forward10: () => BdApi.React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, BdApi.React.createElement('path', { d: "M13 17l5-5-5-5" }), BdApi.React.createElement('path', { d: "M6 17l5-5-5-5" })),
        Camera: () => BdApi.React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, BdApi.React.createElement('path', { d: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" }), BdApi.React.createElement('circle', { cx: "12", cy: "13", r: "4" })),
        Theater: () => BdApi.React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, BdApi.React.createElement('rect', { x: "2", y: "6", width: "20", height: "12", rx: "2" })),
        Link: () => BdApi.React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, BdApi.React.createElement('path', { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), BdApi.React.createElement('path', { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })),
        Browser: () => BdApi.React.createElement('svg', { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, BdApi.React.createElement('circle', { cx: "12", cy: "12", r: "10" }), BdApi.React.createElement('line', { x1: "2", y1: "12", x2: "22", y2: "12" }), BdApi.React.createElement('path', { d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" }))
    };

    // ─── REACT COMPONENTS ───────────────────────────────────────────────────
    VideoControls({ video }) {
        const React = BdApi.React;
        const [isPlaying, setIsPlaying] = React.useState(!video.paused);
        const [currentTime, setCurrentTime] = React.useState(video.currentTime);
        const [duration, setDuration] = React.useState(video.duration || 0);
        const [volume, setVolume] = React.useState(video.muted ? 0 : video.volume);
        const [isMuted, setIsMuted] = React.useState(video.muted);
        const [isFullscreen, setIsFullscreen] = React.useState(false);
        const [showControls, setShowControls] = React.useState(true);
        const [isLooping, setIsLooping] = React.useState(video.loop);
        const [playbackRate, setPlaybackRate] = React.useState(video.playbackRate);
        const [showSettings, setShowSettings] = React.useState(false);
        const [hoverTime, setHoverTime] = React.useState(null);
        const [hoverTimePos, setHoverTimePos] = React.useState(0);
        const [isTheater, setIsTheater] = React.useState(false);

        // OSD & Ripple state
        const [osd, setOsd] = React.useState(null);
        const [ripple, setRipple] = React.useState(null);

        const timeoutRef = React.useRef(null);
        const containerRef = React.useRef(null);
        const clickTimeout = React.useRef(null);
        const lastClickTime = React.useRef(0);
        const previewRef = React.useRef(null);
        const previewTimeout = React.useRef(null);
        const osdTimeoutRef = React.useRef(null);
        const rippleTimeout = React.useRef(null);

        const formatTime = (time) => {
            if (isNaN(time)) return "00:00";
            const m = Math.floor(time / 60);
            const s = Math.floor(time % 60);
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        const showOSD = (icon, text) => {
            const id = Date.now();
            setOsd({ icon, text, id });
            if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
            osdTimeoutRef.current = setTimeout(() => {
                setOsd(curr => (curr && curr.id === id) ? null : curr);
            }, 1000);
        };

        React.useEffect(() => {
            if (!video) return;
            const onPlay = () => setIsPlaying(true);
            const onPause = () => setIsPlaying(false);
            const onTimeUpdate = () => setCurrentTime(video.currentTime);
            const onDurationChange = () => setDuration(video.duration);
            const onVolumeChange = () => { setVolume(video.volume); setIsMuted(video.muted); };
            const onRateChange = () => setPlaybackRate(video.playbackRate);

            video.addEventListener('play', onPlay);
            video.addEventListener('pause', onPause);
            video.addEventListener('timeupdate', onTimeUpdate);
            video.addEventListener('loadedmetadata', onDurationChange);
            video.addEventListener('volumechange', onVolumeChange);
            video.addEventListener('ratechange', onRateChange);

            setCurrentTime(video.currentTime);
            setDuration(video.duration);
            setIsPlaying(!video.paused);

            return () => {
                video.removeEventListener('play', onPlay);
                video.removeEventListener('pause', onPause);
                video.removeEventListener('timeupdate', onTimeUpdate);
                video.removeEventListener('loadedmetadata', onDurationChange);
                video.removeEventListener('volumechange', onVolumeChange);
                video.removeEventListener('ratechange', onRateChange);
            };
        }, [video]);

        const resetIdleTimer = () => {
            setShowControls(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                if (!video.paused && !showSettings) setShowControls(false);
            }, 3000);
        };

        React.useEffect(() => {
            resetIdleTimer();
            return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
        }, [isPlaying, showSettings]);

        // Actions
        const togglePlay = (e) => {
            if (e) e.stopPropagation();
            if (video.paused) { video.play(); showOSD('Play', null); }
            else { video.pause(); showOSD('Pause', null); }
        };

        const toggleMute = (e) => {
            if (e) e.stopPropagation();
            video.muted = !video.muted;
            showOSD(video.muted ? 'VolumeMuted' : (video.volume > 0.5 ? 'VolumeHigh' : 'VolumeLow'), video.muted ? 'Muted' : `${Math.round(video.volume * 100)}%`);
        };

        const handleVolume = (e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            let pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            video.volume = pos;
            if (pos > 0) video.muted = false;
        };

        const toggleFullscreen = (e) => {
            if (e) e.stopPropagation();
            if (isTheater) toggleTheater(); // Desativa o modo teatro antes de ir para tela cheia

            const wrapper = video.parentElement;
            if (!document.fullscreenElement) {
                wrapper.requestFullscreen().catch(() => { });
                setIsFullscreen(true);
            } else {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        };

        const togglePiP = (e) => {
            if (e) e.stopPropagation();
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture().catch(() => { });
            } else {
                video.requestPictureInPicture().catch(() => { });
            }
        };

        const toggleLoop = (e) => {
            if (e) e.stopPropagation();
            video.loop = !video.loop;
            setIsLooping(video.loop);
            showOSD('Loop', video.loop ? 'Loop ON' : 'Loop OFF');
        };

        const toggleTheater = (e) => {
            if (e) e.stopPropagation();
            if (document.fullscreenElement) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
            const wrapper = containerRef.current?.closest('.solari-video-wrapper');
            if (!wrapper) return;

            // O overlay._solariDefender é o MutationObserver que protege nossa UI.
            // Durante o teatro, ele precisa ser pausado pra não lutar com o modo teatro.
            const overlayEl = wrapper.querySelector('.solari-video-overlay');
            const defender = overlayEl?._solariDefender;

            if (!isTheater) {
                // Pausar Defender durante teatro
                if (defender) defender.disconnect();

                // Criar backdrop escuro (lightbox)
                const backdrop = document.createElement('div');
                backdrop.className = 'solari-theater-backdrop';
                backdrop.addEventListener('click', () => toggleTheaterRef.current());
                document.body.appendChild(backdrop);
                wrapper._theaterBackdrop = backdrop;

                // Salvar e limpar o inline style de position (conflita com position: fixed)
                wrapper._theaterOriginalPosition = wrapper.style.position;
                wrapper.style.position = '';

                // Teleportar wrapper para body como lightbox centralizado
                wrapper._theaterParent = wrapper.parentElement;
                wrapper._theaterNext = wrapper.nextSibling;
                document.body.appendChild(wrapper);
                wrapper.classList.add('solari-theater-mode');
                setIsTheater(true);
            } else {
                // Remover backdrop
                if (wrapper._theaterBackdrop) { wrapper._theaterBackdrop.remove(); wrapper._theaterBackdrop = null; }

                wrapper.classList.remove('solari-theater-mode');

                // Restaurar ao DOM original
                const p = wrapper._theaterParent;
                const n = wrapper._theaterNext;
                if (p) { if (n && n.parentElement === p) p.insertBefore(wrapper, n); else p.appendChild(wrapper); }

                // Restaurar inline style de position
                wrapper.style.position = wrapper._theaterOriginalPosition || 'relative';
                wrapper._theaterParent = null;
                wrapper._theaterNext = null;
                wrapper._theaterOriginalPosition = null;

                // Reativar Defender
                if (defender && overlayEl && p) {
                    defender.observe(p, { childList: true, attributes: true, attributeFilter: ['class'] });
                }

                setIsTheater(false);
            }
        };

        const handleScreenshot = (e) => {
            if (e) e.stopPropagation();
            if (!video.videoWidth || !video.videoHeight) {
                showOSD('Camera', 'Carregando...');
                return;
            }

            showOSD('Camera', 'Capturando...');

            // Criar clone do vídeo para forçar requisição CORS limpa (sem afetar o original opaco)
            const clone = document.createElement('video');
            clone.crossOrigin = 'anonymous';
            clone.src = video.src;
            clone.currentTime = video.currentTime;
            clone.muted = true;

            clone.addEventListener('seeked', () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = clone.videoWidth || video.videoWidth;
                    canvas.height = clone.videoHeight || video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(clone, 0, 0, canvas.width, canvas.height);

                    canvas.toBlob(blob => {
                        if (!blob) throw new Error("Blob nulo gerado (Possível Taint)");
                        if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
                            navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]).then(() => {
                                showOSD('Camera', 'Copiado!');
                            }).catch(err => { console.error(err); showOSD('Camera', 'Erro ao Copiar'); });
                        } else {
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(blob);
                            a.download = `screenshot_${Math.floor(Date.now() / 1000)}.png`;
                            a.click();
                            showOSD('Camera', 'Salvo!');
                        }
                    }, 'image/png');
                } catch (err) {
                    console.error("Screenshot Error:", err);
                    showOSD('Camera', 'Bloqueado (CORS)');
                }
            }, { once: true });

            clone.addEventListener('error', (err) => {
                console.error("Clone Video Error:", err);
                showOSD('Camera', 'Erro de Rede');
            }, { once: true });
        };

        const showRipple = (side) => {
            const id = Date.now();
            setRipple({ side, id });
            if (rippleTimeout.current) clearTimeout(rippleTimeout.current);
            rippleTimeout.current = setTimeout(() => setRipple(curr => (curr && curr.id === id) ? null : curr), 600);
        };

        const handleOverlayClick = (e) => {
            // Ignorar cliques diretos nos botões da barra
            if (e.target.closest('.solari-vp-bottom-pill') || e.target.closest('.solari-vp-speed-menu') || e.target.closest('.solari-vp-settings-menu')) return;

            const now = Date.now();
            const rect = containerRef.current.getBoundingClientRect();
            const isLeft = e.clientX < rect.left + rect.width / 2;

            if (now - lastClickTime.current < 300) {
                // Double tap detectado — cancela o single-tap e previne o Discord de abrir o vídeo
                clearTimeout(clickTimeout.current);
                e.nativeEvent.stopImmediatePropagation();
                e.preventDefault();

                if (!duration) return;

                if (isLeft) {
                    video.currentTime = Math.max(0, video.currentTime - 10);
                    showRipple('left');
                } else {
                    video.currentTime = Math.min(duration, video.currentTime + 10);
                    showRipple('right');
                }
                lastClickTime.current = 0;
            } else {
                // Single tap
                clickTimeout.current = setTimeout(() => {
                    togglePlay();
                }, 300);
                lastClickTime.current = now;
            }
        };

        // Refs para evitar closures obsoletas nos hotkeys
        const resetIdleTimerRef = React.useRef(resetIdleTimer);
        const showRippleRef = React.useRef(showRipple);
        const showOSDRef = React.useRef(showOSD);
        const togglePlayRef = React.useRef(togglePlay);
        const toggleMuteRef = React.useRef(toggleMute);
        const toggleFullscreenRef = React.useRef(toggleFullscreen);
        const toggleTheaterRef = React.useRef(toggleTheater);
        const handleScreenshotRef = React.useRef(handleScreenshot);
        React.useEffect(() => {
            resetIdleTimerRef.current = resetIdleTimer;
            showRippleRef.current = showRipple;
            showOSDRef.current = showOSD;
            togglePlayRef.current = togglePlay;
            toggleMuteRef.current = toggleMute;
            toggleFullscreenRef.current = toggleFullscreen;
            toggleTheaterRef.current = toggleTheater;
            handleScreenshotRef.current = handleScreenshot;
        });

        // Hotkeys
        React.useEffect(() => {
            const handleKeyDown = (e) => {
                if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA" || document.activeElement.isContentEditable)) return;

                switch (e.key.toLowerCase()) {
                    case ' ': case 'k':
                        e.preventDefault(); togglePlayRef.current(); break;
                    case 'm':
                        e.preventDefault(); toggleMuteRef.current(); break;
                    case 'f':
                        e.preventDefault(); toggleFullscreenRef.current(); break;
                    case 'j': case 'arrowleft':
                        e.preventDefault();
                        video.currentTime = Math.max(0, video.currentTime - (e.key === 'j' ? 10 : 5));
                        resetIdleTimerRef.current(); // Torna o overlay visível para mostrar o ripple
                        showRippleRef.current('left');
                        break;
                    case 'l': case 'arrowright':
                        e.preventDefault();
                        video.currentTime = Math.min(video.duration, video.currentTime + (e.key === 'l' ? 10 : 5));
                        resetIdleTimerRef.current(); // Torna o overlay visível para mostrar o ripple
                        showRippleRef.current('right');
                        break;
                    case 'arrowup':
                        e.preventDefault();
                        video.volume = Math.min(1, video.volume + 0.1);
                        video.muted = false;
                        resetIdleTimerRef.current();
                        showOSDRef.current('VolumeHigh', `${Math.round(video.volume * 100)}%`);
                        break;
                    case 'arrowdown':
                        e.preventDefault();
                        video.volume = Math.max(0, video.volume - 0.1);
                        if (video.volume === 0) video.muted = true;
                        resetIdleTimerRef.current();
                        showOSDRef.current(video.volume === 0 ? 'VolumeMuted' : 'VolumeLow', `${Math.round(video.volume * 100)}%`);
                        break;
                    case 't':
                        e.preventDefault(); toggleTheaterRef.current(); break;
                    case 's':
                        e.preventDefault(); handleScreenshotRef.current(); break;
                }
            };

            const container = containerRef.current;
            if (container) {
                container.addEventListener('mouseenter', () => document.addEventListener('keydown', handleKeyDown));
                container.addEventListener('mouseleave', () => document.removeEventListener('keydown', handleKeyDown));
            }
            return () => document.removeEventListener('keydown', handleKeyDown);
        }, []); // [] — o effect roda uma vez; os refs sempre têm os valores atuais

        const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
        const volumePercent = isMuted ? 0 : (volume * 100);

        const handleSeekHover = (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const time = pos * duration;
            setHoverTime(time);
            setHoverTimePos(pos * 100);

            // Atualização imediata do preview (sem debounce para ficar em tempo real)
            if (previewRef.current) {
                previewRef.current.currentTime = time;
            }
        };

        const handleSeekClick = (e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            video.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration;
        };

        return React.createElement('div', {
            className: `solari-vp-overlay-container ${showControls ? 'show' : 'hide'}`,
            onMouseMove: resetIdleTimer,
            onMouseLeave: () => { if (isPlaying) setShowControls(false); },
            onClick: handleOverlayClick,
            ref: containerRef,
            onContextMenu: e => e.preventDefault() // Evitar menu do browser no video
        },
            // OSD Layer
            osd && React.createElement(OSD, { key: osd.id, icon: osd.icon, text: osd.text }),

            // Ripple Layer
            ripple && React.createElement('div', {
                key: ripple.id,
                className: `solari-vp-ripple solari-vp-ripple-${ripple.side}`
            },
                React.createElement('div', { className: 'solari-vp-ripple-circle' }),
                React.createElement('div', { className: 'solari-vp-ripple-content' },
                    React.createElement(SolariPlayer.Icons[ripple.side === 'left' ? 'Rewind10' : 'Forward10'], null),
                    React.createElement('span', null, ripple.side === 'left' ? '-10s' : '+10s')
                )
            ),

            // Settings Menu (Pop-up)
            showSettings && React.createElement('div', { className: 'solari-vp-settings-menu' },
                React.createElement('div', { className: 'solari-vp-settings-header' }, 'Velocidade'),
                React.createElement('div', { className: 'solari-vp-settings-row' },
                    [0.5, 1, 1.25, 1.5, 2].map(rate =>
                        React.createElement('div', {
                            key: rate,
                            className: `solari-vp-speed-pill ${playbackRate === rate ? 'active' : ''}`,
                            onClick: (e) => { e.stopPropagation(); video.playbackRate = rate; }
                        }, rate + 'x')
                    )
                ),
                React.createElement('div', { className: 'solari-vp-settings-divider' }),
                React.createElement('div', { className: 'solari-vp-settings-item', onClick: (e) => { e.stopPropagation(); navigator.clipboard.writeText(video.src); showOSD('Link', 'Copiado!'); setShowSettings(false); } },
                    React.createElement(SolariPlayer.Icons.Link, null), React.createElement('span', null, "Copiar Link")
                ),
                React.createElement('div', {
                    className: 'solari-vp-settings-item', onClick: (e) => {
                        e.stopPropagation();
                        const a = document.createElement('a');
                        a.href = video.src;
                        a.download = ''; // Deixar o navegador decidir o nome original se possível
                        a.target = '_blank';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        setShowSettings(false);
                        showOSD('Download', 'Iniciando...');
                    }
                },
                    React.createElement(SolariPlayer.Icons.Download, null), React.createElement('span', null, "Baixar Vídeo")
                )
            ),

            // Bottom Pill Bar
            React.createElement('div', { className: 'solari-vp-bottom-pill', onClick: e => e.stopPropagation() },

                // Seek Bar Custom
                React.createElement('div', {
                    className: 'solari-vp-seek-container',
                    onClick: handleSeekClick,
                    onMouseMove: handleSeekHover,
                    onMouseLeave: () => setHoverTime(null)
                },
                    // Tooltip
                    hoverTime !== null && React.createElement('div', {
                        className: 'solari-vp-seek-tooltip',
                        style: { left: `${hoverTimePos}%` }
                    },
                        React.createElement('video', {
                            ref: previewRef,
                            src: video.src,
                            muted: true,
                            className: 'solari-vp-preview-vid'
                        }),
                        React.createElement('span', null, formatTime(hoverTime))
                    ),

                    React.createElement('div', { className: 'solari-vp-seek-bg' },
                        React.createElement('div', { className: 'solari-vp-seek-fill', style: { width: `${progressPercent}%` } }),
                        React.createElement('div', { className: 'solari-vp-seek-thumb', style: { left: `${progressPercent}%` } })
                    )
                ),

                // Controls Row
                React.createElement('div', { className: 'solari-vp-controls-row' },

                    // Left: Play, Vol, Time
                    React.createElement('div', { className: 'solari-vp-left' },
                        React.createElement('button', { className: 'solari-vp-btn btn-play', onClick: togglePlay },
                            isPlaying ? React.createElement(SolariPlayer.Icons.Pause, null) : React.createElement(SolariPlayer.Icons.Play, null)
                        ),

                        React.createElement('div', { className: 'solari-vp-volume-group' },
                            React.createElement('button', { className: 'solari-vp-btn', onClick: toggleMute },
                                isMuted || volume === 0 ? React.createElement(SolariPlayer.Icons.VolumeMuted, null) :
                                    volume < 0.5 ? React.createElement(SolariPlayer.Icons.VolumeLow, null) : React.createElement(SolariPlayer.Icons.VolumeHigh, null)
                            ),
                            React.createElement('div', { className: 'solari-vp-volume-slider-container', onClick: handleVolume },
                                React.createElement('div', { className: 'solari-vp-volume-bg' },
                                    React.createElement('div', { className: 'solari-vp-volume-fill', style: { width: `${volumePercent}%` } }),
                                    React.createElement('div', { className: 'solari-vp-volume-thumb', style: { left: `${volumePercent}%` } })
                                )
                            )
                        ),

                        React.createElement('div', { className: 'solari-vp-time' }, `${formatTime(currentTime)} / ${formatTime(duration)}`)
                    ),

                    // Right: Camera, Theater, Loop, PiP, Settings, Fullscreen
                    React.createElement('div', { className: 'solari-vp-right' },
                        React.createElement('button', { className: 'solari-vp-btn', onClick: handleScreenshot, title: "Screenshot" },
                            React.createElement(SolariPlayer.Icons.Camera, null)
                        ),
                        React.createElement('button', { className: `solari-vp-btn ${isTheater ? 'active' : ''}`, onClick: toggleTheater, title: "Modo Teatro" },
                            React.createElement(SolariPlayer.Icons.Theater, null)
                        ),
                        React.createElement('button', { className: `solari-vp-btn ${isLooping ? 'active' : ''}`, onClick: toggleLoop, title: "Loop" },
                            React.createElement(SolariPlayer.Icons.Loop, null)
                        ),
                        React.createElement('button', { className: 'solari-vp-btn', onClick: togglePiP, title: "Picture in Picture" },
                            React.createElement(SolariPlayer.Icons.PiP, null)
                        ),
                        React.createElement('button', { className: `solari-vp-btn ${showSettings ? 'active' : ''}`, onClick: e => { e.stopPropagation(); setShowSettings(!showSettings); }, title: "Configurações" },
                            React.createElement(SolariPlayer.Icons.Settings, null)
                        ),
                        React.createElement('button', { className: 'solari-vp-btn', onClick: toggleFullscreen, title: "Tela Cheia" },
                            isFullscreen ? React.createElement(SolariPlayer.Icons.ExitFullscreen, null) : React.createElement(SolariPlayer.Icons.Fullscreen, null)
                        )
                    )
                )
            )
        );
    }

    // ─── CSS INJECTION ──────────────────────────────────────────────────────
    injectCSS() {
        const css = `
            .solari-video-wrapper > *:not(video):not(.solari-video-overlay) {
                display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important;
            }
            /* Esconder controles nativos residuais de forma agressiva */
            [class*="videoControls_"], [class*="downloadButton_"], [class*="playButton_"], 
            [class*="downloadWrapper_"], [class*="downloadLink_"], a[href*="discordapp.net/attachments/"] { 
                display: none !important; opacity: 0 !important; pointer-events: none !important; 
                width: 0 !important; height: 0 !important; position: absolute !important;
            }

            .solari-video-overlay {
                position: absolute; inset: 0; z-index: 100;
                pointer-events: none;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }

            .solari-vp-overlay-container {
                position: absolute; inset: 0;
                display: flex; flex-direction: column; justify-content: flex-end;
                pointer-events: auto;
                background: radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.3) 100%);
                opacity: 1; transition: opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .solari-vp-overlay-container.hide { opacity: 0; cursor: none; }

            /* OSD (Feedback Visual Central) */
            .solari-vp-osd {
                position: absolute; top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.5);
                backdrop-filter: blur(12px);
                border-radius: 100px;
                min-width: 64px; min-height: 64px;
                padding: 12px 16px;
                display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
                color: white;
                animation: osdFade 1s forwards cubic-bezier(0.34, 1.56, 0.64, 1);
                pointer-events: none;
            }
            .solari-vp-osd svg { width: 32px; height: 32px; }
            .solari-vp-osd span { font-size: 14px; font-weight: 600; text-shadow: 0 1px 4px rgba(0,0,0,0.5); }
            @keyframes osdFade {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                15% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
                30% { transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1.1); }
            }

            /* Bottom Pill (Pro Max Glassmorphism) */
            .solari-vp-bottom-pill {
                margin: 0 12px 12px 12px;
                padding: 8px 16px;
                background: rgba(18, 18, 18, 0.6);
                backdrop-filter: blur(24px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 16px;
                box-sizing: border-box;
                display: flex; flex-direction: column; gap: 8px;
                box-shadow: 0 12px 32px rgba(0,0,0,0.4);
                transform: translateY(0);
                transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .solari-vp-overlay-container.hide .solari-vp-bottom-pill {
                transform: translateY(20px);
            }

            /* Seek Bar */
            .solari-vp-seek-container {
                height: 16px; display: flex; align-items: center; cursor: pointer; position: relative;
            }
            .solari-vp-seek-bg {
                width: 100%; height: 4px; background: rgba(255, 255, 255, 0.2); border-radius: 2px; position: relative; transition: height 0.2s;
            }
            .solari-vp-seek-container:hover .solari-vp-seek-bg { height: 6px; }
            .solari-vp-seek-fill {
                height: 100%; background: #eb4034; border-radius: 2px; position: absolute; left: 0; top: 0; pointer-events: none;
            }
            .solari-vp-seek-thumb {
                width: 12px; height: 12px; background: #fff; border-radius: 50%; position: absolute; top: 50%;
                transform: translate(-50%, -50%) scale(0); transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); pointer-events: none;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            }
            .solari-vp-seek-container:hover .solari-vp-seek-thumb { transform: translate(-50%, -50%) scale(1); }

            /* Tooltip & Preview */
            .solari-vp-seek-tooltip {
                position: absolute; bottom: 16px;
                transform: translateX(-50%);
                background: rgba(18,18,18,0.8); color: #fff;
                padding: 6px; border-radius: 8px; font-size: 11px; font-weight: 600;
                pointer-events: none; white-space: nowrap;
                display: flex; flex-direction: column; align-items: center; gap: 6px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.5);
                border: 1px solid rgba(255,255,255,0.1);
            }
            .solari-vp-preview-vid {
                max-width: 120px;
                border-radius: 4px;
                background: #000;
            }

            /* Controls Row */
            .solari-vp-controls-row { display: flex; justify-content: space-between; align-items: center; }
            .solari-vp-left, .solari-vp-right { display: flex; align-items: center; gap: 12px; }

            /* Buttons (Jelly Animation) */
            .solari-vp-btn {
                background: transparent; border: none; color: #fff; opacity: 0.7; cursor: pointer;
                padding: 4px; display: flex; align-items: center; justify-content: center;
                transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .solari-vp-btn:hover { opacity: 1; transform: scale(1.15); color: #fff; }
            .solari-vp-btn:active { transform: scale(0.9); }
            .solari-vp-btn svg { width: 20px; height: 20px; }
            .solari-vp-btn.active { opacity: 1; color: #eb4034; }
            
            .btn-play svg { width: 22px; height: 22px; }

            .solari-vp-time { color: #fff; font-size: 12px; font-weight: 500; opacity: 0.85; margin-left: 4px; font-variant-numeric: tabular-nums; }

            /* Volume Group */
            .solari-vp-volume-group { display: flex; align-items: center; gap: 6px; }
            .solari-vp-volume-slider-container {
                width: 0; opacity: 0; overflow: hidden; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                height: 24px; display: flex; align-items: center; cursor: pointer;
            }
            .solari-vp-volume-group:hover .solari-vp-volume-slider-container { width: 68px; opacity: 1; }
            .solari-vp-volume-bg { width: 100%; height: 5px; background: rgba(255,255,255,0.2); border-radius: 3px; position: relative; }
            .solari-vp-volume-fill { height: 100%; background: #fff; border-radius: 3px; position: absolute; left: 0; top: 0; pointer-events: none; }
            .solari-vp-volume-thumb { width: 12px; height: 12px; background: #fff; border-radius: 50%; position: absolute; top: 50%; transform: translate(-50%, -50%); pointer-events: none; }

            /* Ripple Animation */
            .solari-vp-ripple {
                position: absolute; top: 0; bottom: 0; width: 50%;
                display: flex; align-items: center; justify-content: center;
                pointer-events: none; overflow: hidden;
            }
            .solari-vp-ripple-left { left: 0; }
            .solari-vp-ripple-right { right: 0; }
            .solari-vp-ripple-circle {
                position: absolute; width: 100%; height: 200%;
                background: rgba(255,255,255,0.15);
                border-radius: 50%;
                transform: scale(0);
                animation: rippleExpand 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            }
            .solari-vp-ripple-left .solari-vp-ripple-circle { left: -50%; }
            .solari-vp-ripple-right .solari-vp-ripple-circle { right: -50%; }
            @keyframes rippleExpand { 0% { transform: scale(0); opacity: 1; } 50% { transform: scale(1); opacity: 1; } 100% { transform: scale(1); opacity: 0; } }
            .solari-vp-ripple-content {
                position: relative; display: flex; flex-direction: column; align-items: center; gap: 8px;
                color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.5);
                animation: rippleContent 0.6s forwards;
            }
            .solari-vp-ripple-content svg { width: 32px; height: 32px; }
            .solari-vp-ripple-content span { font-size: 16px; font-weight: bold; }
            @keyframes rippleContent { 0% { opacity: 0; transform: scale(0.8); } 20% { opacity: 1; transform: scale(1.1); } 40% { transform: scale(1); } 80% { opacity: 1; } 100% { opacity: 0; } }

            /* Settings Pop-up (Super Menu) */
            .solari-vp-settings-menu {
                position: absolute; right: 24px; bottom: 84px;
                background: rgba(18, 18, 18, 0.85); backdrop-filter: blur(24px);
                border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px;
                padding: 12px; display: flex; flex-direction: column; gap: 8px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.6);
                animation: popUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                min-width: 220px;
            }
            .solari-vp-settings-header { color: #fff; font-size: 11px; font-weight: bold; text-transform: uppercase; opacity: 0.6; padding-left: 4px; margin-bottom: -4px; }
            .solari-vp-settings-row { display: flex; gap: 4px; }
            .solari-vp-speed-pill {
                flex: 1; text-align: center; padding: 6px 0; color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; border-radius: 6px; transition: 0.2s;
                background: rgba(255,255,255,0.05);
            }
            .solari-vp-speed-pill:hover { background: rgba(255,255,255,0.15); }
            .solari-vp-speed-pill.active { background: #eb4034; }
            .solari-vp-settings-divider { width: 100%; height: 1px; background: rgba(255,255,255,0.1); margin: 4px 0; }
            .solari-vp-settings-item {
                display: flex; align-items: center; gap: 12px; padding: 8px 12px; color: #fff; font-size: 13px; font-weight: 500; cursor: pointer; border-radius: 8px; transition: 0.2s;
            }
            .solari-vp-settings-item:hover { background: rgba(255,255,255,0.1); }
            .solari-vp-settings-item svg { width: 18px; height: 18px; opacity: 0.8; }
            
            /* Theater Mode — Lightbox (backdrop + vídeo centralizado 65%) */
            .solari-theater-backdrop {
                position: fixed !important;
                inset: 0 !important;
                background: rgba(0, 0, 0, 0.88) !important;
                backdrop-filter: blur(6px) !important;
                z-index: 9999998 !important;
                cursor: zoom-out !important;
                animation: theaterFadeIn 0.25s ease;
            }
            @keyframes theaterFadeIn { from { opacity: 0; } to { opacity: 1; } }

            .solari-theater-mode {
                position: fixed !important;
                top: 50% !important; left: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: 65vw !important;
                max-width: none !important;
                height: auto !important;
                max-height: 80vh !important;
                z-index: 9999999 !important;
                background: #000 !important;
                border-radius: 10px !important;
                overflow: visible !important;
                display: flex !important; align-items: flex-end !important; justify-content: center !important;
                box-shadow: 0 32px 80px rgba(0,0,0,0.8) !important;
                margin: 0 !important; padding: 0 !important;
                pointer-events: auto !important;
            }
            .solari-theater-mode > video {
                width: 65vw !important; height: auto !important;
                max-height: 80vh !important;
                object-fit: contain !important;
                display: block !important;
                border-radius: 10px !important;
                flex-shrink: 0;
            }
            .solari-theater-mode .solari-video-overlay {
                position: absolute !important;
                top: 0 !important; left: 0 !important;
                width: 65vw !important; height: 100% !important;
                z-index: 10 !important; pointer-events: none !important;
                border-radius: 10px !important; overflow: hidden !important;
            }
            .solari-theater-mode .solari-vp-overlay-container {
                position: absolute !important; inset: 0 !important;
                pointer-events: auto !important;
                border-radius: 10px !important;
            }
            .solari-theater-mode .solari-vp-bottom-pill {
                margin: 0 12px 12px 12px !important;
                width: calc(100% - 24px) !important;
                box-sizing: border-box !important;
            }
        `;
        BdApi.DOM.addStyle(SolariPlayer.PLUGIN_ID, css);
    }

    removeCSS() { BdApi.DOM.removeStyle(SolariPlayer.PLUGIN_ID); }
}

module.exports = SolariPlayer;

// OSD Component (Forçado fora do return pra não ser recriado a cada render e quebrar a animação)
function OSD({ icon, text }) {
    const React = BdApi.React;
    const IconComponent = SolariPlayer.Icons[icon];
    return React.createElement('div', { className: 'solari-vp-osd' },
        IconComponent ? React.createElement(IconComponent, null) : null,
        text ? React.createElement('span', null, text) : null
    );
}

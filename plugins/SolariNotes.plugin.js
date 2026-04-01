/**
 * @name SolariNotes
 * @author TheDroid
 * @authorLink https://solarirpc.com
 * @description Sleek, synchronized notepad integrated strictly into Discord's UI. Saves securely to your local PC via the Solari App.
 * @version 1.0.2
 * @source https://github.com/TheDroidBR/Solari
 * @website https://solarirpc.com
 */

module.exports = class SolariNotes {
    static translations = {
        en: {
            title: 'Solari Notes Settings',
            connected: 'Connected to Solari',
            disconnected: 'Disconnected',
            placeholder: 'Type your notes here...',
            tooltip: 'Solari Notes',
            status: 'Status'
        },
        'pt-BR': {
            title: 'Configurações do Solari Notes',
            connected: 'Conectado ao Solari',
            disconnected: 'Desconectado',
            placeholder: 'Digite suas anotações aqui...',
            tooltip: 'Anotações Solari',
            status: 'Status',
            opacity: 'Opacidade do Painel',
            fontSize: 'Tamanho da Fonte',
            fontFamily: 'Família da Fonte',
            blur: 'Desfoque de Fundo',
            accent: 'Cor de Destaque',
            autoSave: 'Atraso de Auto-save',
            padding: 'Espaçamento Interno',
            reset: 'Resetar Tudo'
        }
    };

    constructor(meta) {
        this.meta = meta;
        this.ws = null;
        this.shouldReconnect = false;
        this.isConnected = false;

        this.tabs = [{ id: 1, title: 'Main', content: '' }];
        this.activeTabId = 1;

        this.isPanelOpen = false;
        this.typingTimeout = null;

        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.observer = null;

        this.config = {
            enabled: true,
            language: 'pt-BR',
            serverUrl: "ws://localhost:6464",
            windows: [
                { id: 'main', x: null, y: null, w: null, h: null, isPinned: false, isOpen: false }
            ],
            panelOpacity: 100,
            fontSize: 14,
            fontFamily: 'sans',
            blurIntensity: 16,
            accentColor: '#5865F2',
            autoSaveDelay: 1000,
            editorPadding: 16
        };
    }

    t(key) {
        const lang = this.config.language || 'en';
        return SolariNotes.translations[lang]?.[key] || SolariNotes.translations['en'][key] || key;
    }

    getSettingsSchema() {
        return [
            { type: 'custom_header', title: this.t('title'), version: 'v1.0.2' },
            { type: 'status_card', id: 'solariStatus', label: this.t('status'), status: this.isConnected ? 'connected' : 'disconnected' },
            {
                type: 'select', key: 'language', label: 'Language / Idioma', options: [
                    { value: 'en', label: 'English' },
                    { value: 'pt-BR', label: 'Português (Brasil)' }
                ]
            },
            {
                type: 'slider',
                key: 'panelOpacity',
                label: this.t('opacity'),
                min: 10, max: 100, step: 5,
                defaultValue: 100
            },
            {
                type: 'slider',
                key: 'blurIntensity',
                label: this.t('blur'),
                min: 0, max: 40, step: 2,
                suffix: 'px',
                defaultValue: 16
            },
            {
                type: 'select',
                key: 'accentColor',
                label: this.t('accent'),
                options: [
                    { value: '#5865F2', label: 'Discord Blue' },
                    { value: '#3ba55d', label: 'Solari Green' },
                    { value: '#ed4245', label: 'Crimson Red' },
                    { value: '#eb459e', label: 'Hot Pink' },
                    { value: '#fee75c', label: 'Golden Sun' },
                    { value: '#99aab5', label: 'Slate Grey' }
                ]
            },
            {
                type: 'slider',
                key: 'fontSize',
                label: this.t('fontSize'),
                min: 10, max: 32, step: 1,
                suffix: 'px',
                defaultValue: 14
            },
            {
                type: 'select',
                key: 'fontFamily',
                label: this.t('fontFamily'),
                options: [
                    { value: 'sans', label: 'Discord (gg sans)' },
                    { value: 'mono', label: 'Monospace (Consolas)' }
                ]
            },
            {
                type: 'slider',
                key: 'editorPadding',
                label: this.t('padding'),
                min: 8, max: 40, step: 2,
                suffix: 'px',
                defaultValue: 16
            },
            {
                type: 'slider',
                key: 'autoSaveDelay',
                label: this.t('autoSave'),
                min: 500, max: 5000, step: 500,
                suffix: 'ms',
                defaultValue: 1000
            },
            {
                type: 'button',
                key: 'reset_position',
                label: this.t('reset'),
                onClick: () => {
                    this.config.windows = [{ id: 'main', x: null, y: null, w: null, h: null, isPinned: false }];
                    this.config.panelOpacity = 100;
                    this.config.blurIntensity = 16;
                    this.config.fontSize = 14;
                    this.config.fontFamily = 'sans';
                    this.config.accentColor = '#5865F2';
                    this.config.editorPadding = 16;
                    this.saveConfig();

                    this.applyLiveStyles();
                    const panels = document.querySelectorAll('.solari-notes-panel');
                    panels.forEach(panel => {
                        panel.style.left = '';
                        panel.style.top = '48px';
                        panel.style.right = '16px';
                        panel.style.width = '320px';
                        panel.style.height = '400px';
                        panel.classList.remove('pinned');
                    });
                    this.safeShowToast('Settings Reset / Configurações Resetadas', { type: 'success' });
                }
            }
        ];
    }

    getSettingsPanel() {
        const panel = document.createElement("div");
        panel.className = "solari-settings-panel";

        const schema = this.getSettingsSchema();

        const renderItem = (item) => {
            const wrapper = document.createElement("div");
            wrapper.className = "solari-setting-item";

            if (item.type === 'custom_header') {
                const header = document.createElement('div');
                header.className = 'solari-setting-header';
                header.innerHTML = `
                    <div class="solari-setting-title">📝 ${item.title}</div>
                    ${item.version ? `<div class="solari-setting-version">${item.version}</div>` : ''}
                `;
                return header;
            }

            if (item.type === 'status_card') {
                const sc = document.createElement('div');
                sc.className = 'solari-setting-status-card';
                const isActive = item.status === 'connected';
                sc.innerHTML = `
                    <div class="solari-setting-status-dot" style="background: ${isActive ? '#3ba55d' : '#ed4245'}"></div>
                    <div style="flex: 1; font-weight: 500; color: ${isActive ? '#3ba55d' : '#ed4245'}">
                        ${item.label}: ${isActive ? 'Conectado' : 'Desconectado'}
                    </div>
                `;
                return sc;
            }

            const label = document.createElement("div");
            label.className = "solari-setting-label";
            label.textContent = item.label;
            wrapper.appendChild(label);

            let input;
            if (item.type === 'select') {
                input = document.createElement("select");
                input.className = "solari-setting-input";
                item.options.forEach(opt => {
                    const o = document.createElement("option");
                    o.value = opt.value;
                    o.textContent = opt.label;
                    if (this.config[item.key] === opt.value) o.selected = true;
                    input.appendChild(o);
                });
                input.addEventListener("change", () => {
                    this.config[item.key] = input.value;
                    this.saveConfig();
                });
            } else if (item.type === 'slider') {
                const container = document.createElement("div");
                container.style.display = "flex";
                container.style.alignItems = "center";
                container.style.gap = "10px";

                input = document.createElement("input");
                input.type = "range";
                input.className = "solari-setting-slider";
                input.min = item.min;
                input.max = item.max;
                input.step = item.step;
                input.value = this.config[item.key] || item.defaultValue;

                const valDisplay = document.createElement("span");
                valDisplay.className = "solari-setting-value";
                valDisplay.textContent = input.value + (item.suffix || "%");

                input.addEventListener("input", () => {
                    valDisplay.textContent = input.value + (item.suffix || "%");
                });
                input.addEventListener("change", () => {
                    this.config[item.key] = parseInt(input.value);
                    this.saveConfig();
                });

                container.appendChild(input);
                container.appendChild(valDisplay);
                wrapper.appendChild(container);
                return wrapper;
            } else if (item.type === 'button') {
                input = document.createElement("button");
                input.className = "solari-setting-button";
                input.textContent = item.label;
                input.onclick = item.onClick;
                // Remove redundant label for buttons
                label.remove();
            }

            if (input) {
                // For select, we need to handle multi-labels if item.options[...].label is set
                input.className = "solari-setting-input";
                wrapper.appendChild(input);
            }
            return wrapper;
        };

        schema.forEach(item => {
            panel.appendChild(renderItem(item));
        });

        return panel;
    }

    loadConfig() {
        try {
            const saved = BdApi.Data.load("SolariNotes", "config");
            if (saved) this.config = { ...this.config, ...saved };
        } catch (e) { console.error("[SolariNotes] Load config error:", e); }
    }

    saveConfig() {
        try {
            BdApi.Data.save("SolariNotes", "config", this.config);
            if (this.isConnected) {
                this.send({ 
                    type: 'notes_config_sync', 
                    config: this.config,
                    schema: this.getSettingsSchema()
                });
            }
        } catch (e) { console.error("[SolariNotes] Save config error:", e); }
    }

    // ═══════════════════ WEBSOCKET ═══════════════════
    connectToServer() {
        try {
            this.shouldReconnect = true;
            this.ws = new WebSocket(this.config.serverUrl);

            this.ws.onopen = () => {
                this.isConnected = true;
                console.log("[SolariNotes] Connected to Solari server on 6464");
                this.safeShowToast('Solari Notes: Conectado!', { type: "success" });

                // Envia o esquema de configurações inicial e o estado atual para o aplicativo Solari
                this.send({ 
                    type: 'notes_config_sync', 
                    config: this.config, 
                    schema: this.getSettingsSchema() 
                });

                // Request the latest notes from the disk immediately
                this.send({ type: 'notes_request' });
            };

            this.ws.onmessage = (e) => this.handleMessage(JSON.parse(e.data));

            this.ws.onclose = () => {
                this.isConnected = false;
                console.log("[SolariNotes] Disconnected from Solari server");
                if (this.shouldReconnect) setTimeout(() => this.connectToServer(), 5000);
            };

            this.ws.onerror = (err) => { }; // Prevent loud errors

        } catch (e) {
            console.error("[SolariNotes] Connection error:", e);
        }
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'notes_sync':
                // Check if backend data is the new JSON Tabs schema or Legacy Phase 6 String
                try {
                if (data.content && data.content.startsWith('{"tabs":')) {
                    const parsed = JSON.parse(data.content);
                    this.tabs = parsed.tabs;
                    // Ensure legacy tabs get a windowId
                    this.tabs.forEach(t => { if (!t.windowId) t.windowId = 'main'; });
                    this.activeTabId = parsed.activeTabId || this.tabs[0].id;
                } else if (data.content !== undefined) {
                    // Legacy migration format
                    this.tabs = [{ id: 1, title: 'Main', content: data.content || '', windowId: 'main' }];
                    this.activeTabId = 1;
                }
            } catch (e) {
                // If parse fails or something weird, assume legacy string
                this.tabs = [{ id: 1, title: 'Main', content: data.content || '', windowId: 'main' }];
                this.activeTabId = 1;
            }

            this.updateTextAreaUI();
            case 'update_notes_settings':
                this.config = { ...this.config, ...data.settings };
                this.saveConfig();
                this.applyLiveStyles();
                break;
        }
    }

    applyLiveStyles() {
        const panels = document.querySelectorAll('.solari-notes-panel');
        if (!panels.length) return;

        const opacityRatio = (this.config.panelOpacity ?? 100) / 100;
        const fFamily = this.config.fontFamily === 'mono' ? 'Consolas, Monaco, "Courier New", monospace' : "'gg sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";
        const accent = this.config.accentColor || '#5865F2';
        const blur = (this.config.blurIntensity ?? 16) + 'px';
        const padding = (this.config.editorPadding ?? 16) + 'px';

        panels.forEach(panel => {
            panel.style.setProperty('--solari-opacity', opacityRatio.toString());
            panel.style.setProperty('--solari-font-family', fFamily);
            panel.style.setProperty('--solari-font-size', (this.config.fontSize ?? 14) + 'px');
            panel.style.setProperty('--solari-accent', accent);
            panel.style.setProperty('--solari-blur', blur);
            panel.style.setProperty('--solari-padding', padding);
        });
    }

    // ═══════════════════ LIFECYCLE ═══════════════════
    start() {
        console.log("[SolariNotes] Starting...");
        this.loadConfig();

        // 1. Establish connection to Solari App
        this.connectToServer();

        // 2. Inject CSS
        BdApi.DOM.addStyle("SolariNotes-CSS", this.getCSS());

        // 3. Inject UI via MutationObserver (Reliably detects when Discord UI is ready)
        this.observer = new MutationObserver(() => {
            if (!document.getElementById("solari-notes-icon-btn")) {
                // Prevent synchronous React DOM mutation collisions that cause Chat crash (black screen)
                if (this.injectTimeout) clearTimeout(this.injectTimeout);
                this.injectTimeout = setTimeout(() => {
                    if (!document.getElementById("solari-notes-icon-btn")) {
                        this.injectUI();
                    }
                }, 300);
            }
        });
        this.observer.observe(document.body, { childList: true, subtree: true });

        // Initial attempt
        this.injectTimeout = setTimeout(() => this.injectUI(), 500);
    }

    stop() {
        console.log("[SolariNotes] Stopping...");

        this.shouldReconnect = false;
        if (this.ws) this.ws.close();

        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        if (this.injectTimeout) clearTimeout(this.injectTimeout);

        // Cleanup
        if (this.observer) this.observer.disconnect();
        BdApi.DOM.removeStyle("SolariNotes-CSS");
        this.removeUI();
    }

    onSwitch() {
        // Option 1 revised: Just hide the dashboard, no auto-merge
        this.isPanelOpen = false;

        // Ensure all detached windows are marked as 'isOpen' so they reappear when toggled
        // unless they were manually closed/destroyed.
        this.config.windows.forEach(win => {
            if (win.id !== 'main') win.isOpen = true;
        });

        setTimeout(() => {
            this.injectUI();
        }, 300);
    }

    // ═══════════════════ UI INJECTION ═══════════════════
    getCSS() {
        return `
            /* Icon in Discord Header */
            .solari-notes-icon {
                cursor: pointer;
                color: var(--interactive-normal);
                margin: 0 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: color 0.15s ease;
            }
            .solari-notes-icon:hover {
                color: var(--interactive-hover);
            }
            .solari-notes-icon.active {
                color: var(--solari-accent, var(--text-brand, #5865F2));
            }

            /* Glassmorphism Floating Panel */
            .solari-notes-panel {
                position: absolute;
                top: 48px;
                right: 16px;
                width: 320px;
                height: 400px;
                min-width: 200px;
                min-height: 150px;
                background: color-mix(in srgb, var(--background-floating, rgba(15,15,20,1)) 85%, transparent);
                backdrop-filter: blur(var(--solari-blur, 16px));
                -webkit-backdrop-filter: blur(var(--solari-blur, 16px));
                border: 1px solid var(--background-modifier-accent, rgba(255, 255, 255, 0.08));
                border-radius: 12px;
                box-shadow: var(--elevation-high, 0 8px 32px rgba(0, 0, 0, 0.4));
                display: flex;
                flex-direction: column;
                z-index: 9999;
                opacity: 0; /* Hidden initially */
                pointer-events: none;
                transition: opacity 0.2s ease, transform 0.2s ease, backdrop-filter 0.3s ease;
            }

            /* Advanced Resize Handles */
            .solari-notes-handle {
                position: absolute;
                z-index: 10000;
            }
            .solari-notes-handle-n { top: -4px; left: 0; right: 0; height: 8px; cursor: ns-resize; }
            .solari-notes-handle-s { bottom: -4px; left: 0; right: 0; height: 8px; cursor: ns-resize; }
            .solari-notes-handle-e { right: -4px; top: 0; bottom: 0; width: 8px; cursor: ew-resize; }
            .solari-notes-handle-w { left: -4px; top: 0; bottom: 0; width: 8px; cursor: ew-resize; }
            .solari-notes-handle-nw { top: -6px; left: -6px; width: 12px; height: 12px; cursor: nwse-resize; }
            .solari-notes-handle-ne { top: -6px; right: -6px; width: 12px; height: 12px; cursor: nesw-resize; }
            .solari-notes-handle-se { bottom: -6px; right: -6px; width: 12px; height: 12px; cursor: nwse-resize; }

            .solari-notes-panel.open {
                opacity: var(--solari-opacity, 1);
                transform: translateY(0);
                pointer-events: all;
            }
            .solari-notes-panel.pinned {
                /* No special styling needed here, logic handles it */
            }
            .solari-notes-panel.pinned .solari-notes-handle {
                display: none !important;
            }

            .solari-notes-status.connected {
                background: #3ba55d; /* Connected Green */
                box-shadow: 0 0 8px rgba(59, 165, 93, 0.6);
            }
            
            .solari-notes-close-btn, .solari-notes-pin-btn, .solari-notes-export-btn {
                cursor: pointer;
                color: var(--interactive-normal, rgba(255, 255, 255, 0.5));
                transition: color 0.15s ease, background 0.15s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 4px;
                border-radius: 4px;
            }
            .solari-notes-close-btn:hover {
                color: var(--info-danger-foreground, #ed4245);
                background: var(--background-modifier-hover, rgba(255, 255, 255, 0.1));
            }
            .solari-notes-pin-btn:hover, .solari-notes-export-btn:hover {
                color: var(--interactive-hover, #fff);
                background: var(--background-modifier-hover, rgba(255, 255, 255, 0.1));
            }
            .solari-notes-pin-btn.active {
                color: var(--solari-accent, var(--text-brand, #5865F2));
            }

            /* Header of the panel */
            .solari-notes-header {
                padding: 12px 16px;
                border-bottom: 1px solid var(--background-modifier-accent, rgba(255, 255, 255, 0.05));
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: var(--background-secondary-alt, rgba(0, 0, 0, 0.2));
                cursor: grab;
            }
            .solari-notes-header:active {
                cursor: grabbing;
            }
            .solari-notes-title {
                color: var(--header-primary, #fff);
                font-family: 'gg sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                font-weight: 600;
                font-size: 14px;
                letter-spacing: 0.3px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            /* Tabs Bar styling */
            .solari-notes-tab-bar {
                display: flex;
                background: var(--background-secondary, rgba(0,0,0,0.3));
                border-bottom: 1px solid var(--background-modifier-accent, rgba(255,255,255,0.05));
            }
            .solari-notes-tabs-scroll {
                display: flex;
                flex: 1;
                overflow-x: auto;
                scrollbar-width: none;
            }
            .solari-notes-tabs-scroll::-webkit-scrollbar,
            .solari-notes-tab-bar::-webkit-scrollbar {
                display: none;
            }
            .solari-notes-tab {
                padding: 8px 16px;
                font-size: 12px;
                font-weight: 500;
                color: var(--text-muted, rgba(255,255,255,0.5));
                border-right: 1px solid var(--background-modifier-accent, rgba(255,255,255,0.05));
                cursor: pointer;
                white-space: nowrap;
                transition: background 0.15s ease, color 0.15s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .solari-notes-tab:hover {
                background: var(--background-modifier-hover, rgba(255,255,255,0.05));
                color: var(--text-normal, #fff);
            }
            .solari-notes-tab.active {
                background: var(--background-primary, rgba(0,0,0,0.2));
                color: var(--header-primary, #fff);
                border-bottom: 2px solid var(--solari-accent, var(--text-brand, #5865F2));
            }
            .solari-notes-tab-add {
                padding: 8px 12px;
                cursor: pointer;
                color: var(--text-muted, rgba(255,255,255,0.5));
                font-weight: 800;
            }
            .solari-notes-tab-add:hover {
                color: var(--interactive-hover, #fff);
                background: var(--background-modifier-hover, rgba(255,255,255,0.05));
            }
            .solari-notes-tab-close {
                border-radius: 50%;
                width: 14px;
                height: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .solari-notes-tab-close:hover {
                background: var(--info-danger-background, rgba(237, 66, 69, 0.2));
                color: var(--info-danger-foreground, #ed4245);
            }

            /* The Text Area itself */
            .solari-notes-textarea {
                flex: 1;
                background: transparent;
                border: none;
                color: var(--text-normal, #dcddde);
                padding: var(--solari-padding, 16px);
                font-family: var(--solari-font-family, 'gg sans', 'Helvetica Neue', Helvetica, Arial, sans-serif);
                font-size: var(--solari-font-size, 14px);
                line-height: 1.5;
                resize: none;
                outline: none;
            }
            .solari-notes-textarea::placeholder {
                color: var(--text-muted, rgba(255, 255, 255, 0.3));
            }
            
            /* Scrollbar styling */
            .solari-notes-textarea::-webkit-scrollbar {
                width: 6px;
            }
            .solari-notes-textarea::-webkit-scrollbar-track {
                background: transparent;
            }
            .solari-notes-textarea::-webkit-scrollbar-thumb {
                background: var(--background-modifier-accent, rgba(255, 255, 255, 0.1));
                border-radius: 3px;
            }

            /* BetterDiscord Settings Panel Styles */
            .solari-settings-panel {
                padding: 20px;
                background: linear-gradient(135deg, #101015 0%, #1a1a2e 100%);
                border-radius: 12px;
                font-family: 'gg sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            }
            .solari-setting-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            .solari-setting-title {
                font-size: 1.4em;
                font-weight: 700;
                color: #fff;
            }
            .solari-setting-version {
                font-size: 0.8em;
                opacity: 0.6;
                background: rgba(255, 255, 255, 0.1);
                padding: 2px 6px;
                border-radius: 4px;
                color: #fff;
            }
            .solari-setting-status-card {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 12px;
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 20px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .solari-setting-status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
            }
            .solari-setting-item {
                margin-bottom: 16px;
            }
            .solari-setting-label {
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.9em;
                margin-bottom: 8px;
                font-weight: 500;
            }
            .solari-setting-input {
                width: 100%;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #fff;
                padding: 8px;
                border-radius: 6px;
                outline: none;
                transition: border 0.2s;
            }
            .solari-setting-input:focus {
                border-color: #5865F2;
            }
            .solari-setting-slider {
                flex: 1;
                -webkit-appearance: none;
                height: 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                outline: none;
            }
            .solari-setting-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 18px;
                height: 18px;
                background: #5865F2;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 0 10px rgba(88, 101, 242, 0.4);
            }
            .solari-setting-value {
                color: #5865F2;
                font-weight: bold;
                min-width: 40px;
                text-align: right;
            }
            .solari-setting-button {
                background: linear-gradient(135deg, #5865F2 0%, #4752c4 100%);
                color: #fff;
                border: none;
                padding: 10px 16px;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                transition: opacity 0.2s, transform 0.1s;
                width: 100%;
            }
            .solari-setting-button:hover {
                opacity: 0.9;
            }
            .solari-setting-button:active {
                transform: scale(0.98);
            }
        `;
    }

    injectUI() {
        // Enforce singleton UI elements: Clean up any old instances before injecting
        const existingIcon = document.getElementById("solari-notes-icon-btn");
        if (existingIcon) existingIcon.remove();

        // Remove all multi-window instances
        document.querySelectorAll('.solari-notes-panel').forEach(p => p.remove());

        // 1. Find the Discord Header Toolbar (next to Search / Help / Inbox)
        // We use focused selectors to avoid grabbing popup/message toolbars (which causes React crashes)
        const possibleHeaders = Array.from(document.querySelectorAll('section[class*="title_"], section[class*="headerBar_"], [class*="chatContent_"] > [class*="wrapper_"]'));
        
        // CRITICAL: Strictly avoid layer containers and popouts to prevent React from crashing (black screen bug)
        const headerContainer = possibleHeaders.find(c => 
            !c.closest('.layerContainer-2v_Sit') && 
            !c.closest('[class*="layerContainer"]') && 
            !c.closest('[class*="popout"]')
        );

        let toolbar = null;
        if (headerContainer) toolbar = headerContainer.querySelector('[class*="toolbar_"]');

        if (!toolbar) return false;

        // 2. Create Icon Button
        const iconDiv = document.createElement('div');
        iconDiv.id = "solari-notes-icon-btn";
        iconDiv.className = "solari-notes-icon" + (this.isPanelOpen ? " active" : "");
        iconDiv.setAttribute('role', 'button');
        iconDiv.setAttribute('aria-label', this.t('tooltip'));
        // Elegant Pen / Edit SVG standard icon
        iconDiv.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"/></svg>`;

        iconDiv.addEventListener('click', () => this.togglePanel());

        // Insert before the Search box usually
        const searchBox = toolbar.querySelector('[class*="search_"]');
        if (searchBox) {
            toolbar.insertBefore(iconDiv, searchBox);
        } else {
            toolbar.appendChild(iconDiv);
        }

        // 3. Create Floating Panels for each tracked window
        this.config.windows.forEach(win => {
            const panel = document.createElement('div');
            panel.dataset.windowId = win.id;
            panel.className = "solari-notes-panel";
            
            // Final Visibility Logic:
            // 1. Pinned windows: ALWAYS stay visible (persistent tools)
            // 2. Unpinned windows (main or detached): Follow the Master Toggle (isPanelOpen)
            const shouldBeVisible = win.isPinned || (this.isPanelOpen && (win.id === 'main' || win.isOpen));
            
            if (shouldBeVisible) panel.classList.add('open');
            if (win.isPinned) panel.classList.add('pinned');

            panel.innerHTML = `
                <div class="solari-notes-header" class="solari-notes-header-${win.id}" data-type="header">
                    <div class="solari-notes-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"/></svg>
                        Solari Notes
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="solari-notes-status ${this.isConnected ? 'connected' : ''}" title="${this.isConnected ? this.t('connected') : this.t('disconnected')}"></div>
                        <div class="solari-notes-export-btn" title="Export as .txt">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9H15V3H9V9H5L12 16L19 9ZM5 18V20H19V18H5Z"/></svg>
                        </div>
                        <div class="solari-notes-pin-btn ${win.isPinned ? 'active' : ''}" title="Pin/Lock Window">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z"/></svg>
                        </div>
                        <div class="solari-notes-close-btn" title="Close">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg>
                        </div>
                    </div>
                </div>
                <div class="solari-notes-tab-bar"></div>
                <!-- ID removed, using class to allow multiple textareas -->
                <textarea class="solari-notes-textarea" placeholder="${this.t('placeholder')}" spellcheck="false"></textarea>

                <!-- 8-point resize handles -->
                <div class="solari-notes-handle solari-notes-handle-n" data-dir="n"></div>
                <div class="solari-notes-handle solari-notes-handle-s" data-dir="s"></div>
                <div class="solari-notes-handle solari-notes-handle-e" data-dir="e"></div>
                <div class="solari-notes-handle solari-notes-handle-w" data-dir="w"></div>
                <div class="solari-notes-handle solari-notes-handle-nw" data-dir="nw"></div>
                <div class="solari-notes-handle solari-notes-handle-ne" data-dir="ne"></div>
                <div class="solari-notes-handle solari-notes-handle-sw" data-dir="sw"></div>
                <div class="solari-notes-handle solari-notes-handle-se" data-dir="se"></div>
            `;

            // Apply saved position
            if (win.x !== null && win.y !== null) {
                panel.style.right = 'auto'; // Reset right anchor
                panel.style.left = win.x + 'px';
                panel.style.top = Math.max(22, win.y) + 'px'; // Protege contra ficar preso no topo da tela do Discord
            }

            // Apply saved size with safety
            if (win.w !== null && win.h !== null) {
                const safeW = Math.max(300, win.w);
                const safeH = Math.max(200, win.h);
                panel.style.width = safeW + 'px';
                panel.style.height = safeH + 'px';
            }

            // Apply Opacity/Fonts (Global Config)
            const opacityRatio = (this.config.panelOpacity ?? 100) / 100;
            panel.style.setProperty('--solari-opacity', opacityRatio.toString());
            const fFamily = this.config.fontFamily === 'mono' ? 'Consolas, Monaco, "Courier New", monospace' : "'gg sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";
            panel.style.setProperty('--solari-font-family', fFamily);
            panel.style.setProperty('--solari-font-size', (this.config.fontSize ?? 14) + 'px');
            panel.style.setProperty('--solari-accent', this.config.accentColor || '#5865F2');
            panel.style.setProperty('--solari-blur', (this.config.blurIntensity ?? 16) + 'px');
            panel.style.setProperty('--solari-padding', (this.config.editorPadding ?? 16) + 'px');

            // The panel needs absolute positioning relative to the app mount so it doesn't get clipped
            const appMount = document.getElementById('app-mount');
            if (appMount) {
                appMount.appendChild(panel);
            }

            // 4. Input Listener with Debounce
            const textArea = panel.querySelector('.solari-notes-textarea');
            if (textArea) {
                textArea.addEventListener('input', (e) => {
                    const active = this.tabs.find(t => t.id === this.activeTabId && t.windowId === win.id);
                    if (active) {
                        active.content = e.target.value;
                    }

                    if (this.typingTimeout) clearTimeout(this.typingTimeout);
                    this.typingTimeout = setTimeout(() => {
                        this.saveNotesToBackend();
                    }, this.config.autoSaveDelay || 1000);
                });
            }

            // 5. Buttons Logic (Isolated to this Panel)
            const closeBtn = panel.querySelector('.solari-notes-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    if (win.id === 'main') {
                        this.togglePanel(false);
                    } else {
                        // Close the detached window (completely destroy it)
                        panel.remove();
                        this.config.windows = this.config.windows.filter(w => w.id !== win.id);

                        // Find the "closest" available window to dump tabs into (default back to main)
                        let targetWinId = 'main';
                        if (this.config.windows.length > 0) {
                            targetWinId = this.config.windows[this.config.windows.length - 1].id;
                        }

                        // Reassign any tabs trapped inside this window back to the target so data isn't lost
                        this.tabs.forEach(t => { if (t.windowId === win.id) t.windowId = targetWinId; });

                        // Switch focus to a tab in the target window to prevent crash
                        const targetTab = this.tabs.find(t => t.windowId === targetWinId);
                        if (targetTab) {
                            this.activeTabId = targetTab.id;
                        } else if (this.tabs.length > 0) {
                            this.activeTabId = this.tabs[0].id;
                        }

                        this.saveNotesToBackend();
                        this.saveConfig();

                        // Re-render specifically main to show rescued tabs
                        this.removeUI();
                        this.injectUI();
                    }
                });
            }

            const exportBtn = panel.querySelector('.solari-notes-export-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    try {
                        const active = this.tabs.find(t => t.id === this.activeTabId && t.windowId === win.id);
                        if (!active) return;
                        const txtContent = active.content;
                        const safeName = active.title.replace(/[^a-z0-9]/gi, '_');

                        const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `SolariNotes_${safeName}_${new Date().toISOString().slice(0, 10)}.txt`;
                        document.body.appendChild(a);
                        a.click();

                        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
                        this.safeShowToast('Notes Exported / Notas Exportadas', { type: 'success' });
                    } catch (e) { console.error("[SolariNotes] Failed to export:", e); }
                });
            }

            const pinBtn = panel.querySelector('.solari-notes-pin-btn');
            if (pinBtn) {
                pinBtn.addEventListener('click', () => {
                    win.isPinned = !win.isPinned;
                    this.saveConfig();

                    if (win.isPinned) {
                        panel.classList.add('pinned');
                        pinBtn.classList.add('active');
                    } else {
                        panel.classList.remove('pinned');
                        pinBtn.classList.remove('active');
                    }
                });
            }

            // 6. Make Draggable (Isolated)
            this.makeDraggable(panel, panel.querySelector('.solari-notes-header'), win);

            // 7. Make Resizable Persistence (Isolated)
            this.makeResizable(panel, win);
        });

        // 8. Initial Tab Rendering across all windows
        this.renderTabs();

        // 9. Auto-Close Click Listener (Clean up old ones safely to prevent leaks onSwitch)
        document.removeEventListener('mousedown', this.handleOutsideClick);
        document.addEventListener('mousedown', this.handleOutsideClick);

        console.log("[SolariNotes] UI Injected successfully.");
        return true;
    }

    renderTabs() {
        const panels = document.querySelectorAll('.solari-notes-panel');
        panels.forEach(panel => {
            const winId = panel.dataset.windowId;
            const tabBar = panel.querySelector('.solari-notes-tab-bar');
            const textArea = panel.querySelector('.solari-notes-textarea');
            if (!tabBar || !textArea) return;

            tabBar.innerHTML = '';
            const scroller = document.createElement('div');
            scroller.className = 'solari-notes-tabs-scroll';

            const windowTabs = this.tabs.filter(t => t.windowId === winId);

            windowTabs.forEach((tab, index) => {
                const tabEl = document.createElement('div');
                tabEl.className = `solari-notes-tab ${this.activeTabId === tab.id ? 'active' : ''}`;

                // --- HTML5 Drag & Drop (Tear-off Tabs) ---
                tabEl.draggable = true;
                tabEl.addEventListener('dragstart', (e) => {
                    // Do not drag if renaming
                    if (tabEl.querySelector('span[contenteditable="true"]')) {
                        e.preventDefault();
                        return;
                    }
                    e.dataTransfer.setData('text/plain', tab.id.toString());
                    e.dataTransfer.effectAllowed = 'move';
                    tabEl.style.opacity = '0.5';
                });
                tabEl.addEventListener('dragend', (e) => {
                    tabEl.style.opacity = '1';

                    // We handle the creation of new windows by checking where the drop happened
                    let dropTarget = null;
                    if (e.clientX !== undefined && e.clientY !== undefined) {
                        // Temporarily hide the dragged tab clone so it doesn't block the physical drop coordinates
                        tabEl.style.display = 'none';
                        dropTarget = document.elementFromPoint(e.clientX, e.clientY);
                        tabEl.style.display = '';
                    }

                    const targetPanel = dropTarget ? dropTarget.closest('.solari-notes-panel') : null;

                    if (!targetPanel) {
                        // 1. Dropped in the void: Tear it off!
                        console.log("[SolariNotes] Tearing off tab " + tab.id);
                        if (this.tabs.length <= 1) return; // Cannot rip absolute last tab

                        // Create realistic target drop bounds
                        const dropX = e.clientX - 100; // Center the window roughly on cursor
                        const dropY = e.clientY - 20;

                        // Create new window object
                        const newWinId = 'win_' + Date.now();
                        this.config.windows.push({
                            id: newWinId,
                            x: Math.max(0, dropX),
                            y: Math.max(0, dropY),
                            w: 320, h: 400,
                            isPinned: false,
                            isOpen: true
                        });

                        // Reassign tab to new window
                        tab.windowId = newWinId;
                        this.activeTabId = tab.id; // Switch focus

                        this.saveConfig();
                        this.saveNotesToBackend();

                        // Cleanup explicitly before re-rendering
                        this.cleanupEmptyWindows();

                        // Critical: Refresh entire UI to spawn new panel
                        this.removeUI();
                        this.injectUI();
                    } else {
                        // 2. Dropped onto an existing panel: Move it!
                        const targetWinId = targetPanel.dataset.windowId;
                        if (targetWinId && targetWinId !== winId) {
                            console.log(`[SolariNotes] Moving tab ${tab.id} to window ${targetWinId}`);
                            tab.windowId = targetWinId;
                            this.activeTabId = tab.id;
                            this.saveNotesToBackend();

                            this.cleanupEmptyWindows();
                            this.removeUI();
                            this.injectUI();
                        }
                    }
                });

                // Title span
                const titleSpan = document.createElement('span');
                titleSpan.textContent = tab.title;
                titleSpan.title = "Double click or Right-click to rename";

                const enableRename = (e) => {
                    e.preventDefault(); e.stopPropagation();
                    titleSpan.contentEditable = true; titleSpan.focus();
                    const range = document.createRange(); range.selectNodeContents(titleSpan);
                    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
                    titleSpan.style.cursor = 'text'; titleSpan.style.outline = 'none'; titleSpan.style.borderBottom = '1px solid var(--text-brand)';
                };

                const finishRename = () => {
                    titleSpan.contentEditable = false; titleSpan.style.cursor = ''; titleSpan.style.borderBottom = '';
                    const newTitle = titleSpan.textContent.trim();
                    if (newTitle && newTitle !== tab.title) {
                        tab.title = newTitle; this.saveNotesToBackend();
                    } else { titleSpan.textContent = tab.title; }
                };

                titleSpan.addEventListener('dblclick', enableRename);
                titleSpan.addEventListener('contextmenu', enableRename);
                titleSpan.addEventListener('blur', finishRename);
                titleSpan.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') { e.preventDefault(); titleSpan.blur(); }
                    else if (e.key === 'Escape') { titleSpan.textContent = tab.title; titleSpan.blur(); }
                });

                tabEl.addEventListener('click', () => {
                    if (titleSpan.contentEditable === 'true') return;
                    if (this.activeTabId === tab.id) return;
                    this.activeTabId = tab.id;
                    this.renderTabs();
                    if (textArea) textArea.focus();
                });

                tabEl.appendChild(titleSpan);

                // Close Button (Only allow closing if not the absolute last tab in the window, to prevent empty zombie windows)
                if (windowTabs.length > 1) {
                    const closeBtn = document.createElement('div');
                    closeBtn.className = 'solari-notes-tab-close';
                    closeBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg>`;
                    closeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.tabs = this.tabs.filter(t => t.id !== tab.id);
                        if (this.activeTabId === tab.id) {
                            // Find next available tab in THIS window
                            const nextTab = this.tabs.find(t => t.windowId === winId);
                            this.activeTabId = nextTab ? nextTab.id : (this.tabs[0] ? this.tabs[0].id : null);
                        }
                        this.saveNotesToBackend();
                        this.renderTabs();
                    });
                    tabEl.appendChild(closeBtn);
                }
                scroller.appendChild(tabEl);
            });

            tabBar.appendChild(scroller);

            // Add New Tab Button
            const addBtn = document.createElement('div');
            addBtn.className = 'solari-notes-tab-add'; addBtn.textContent = '+'; addBtn.title = 'New Tab';
            addBtn.addEventListener('click', () => {
                const newId = Date.now();
                this.tabs.push({ id: newId, title: "Note " + (this.tabs.length + 1), content: "", windowId: winId });
                this.activeTabId = newId;
                this.renderTabs();
                textArea.focus();
            });
            tabBar.appendChild(addBtn);

            // Update Text Area content based on active tab for THIS window
            const activeItem = windowTabs.find(t => t.id === this.activeTabId);
            if (activeItem) {
                textArea.value = activeItem.content;
            } else if (windowTabs.length > 0) {
                // Failsafe: if active tab isn't in this window, show first available
                textArea.value = windowTabs[0].content;
            }
        });
    }

    togglePanel(forceState) {
        const icon = document.getElementById('solari-notes-icon-btn');
        if (!icon) return;

        this.isPanelOpen = forceState !== undefined ? forceState : !this.isPanelOpen;

        if (this.isPanelOpen) {
            icon.classList.add('active');
        } else {
            icon.classList.remove('active');
        }

        // Just update visibility classes
        const panels = document.querySelectorAll('.solari-notes-panel');
        panels.forEach(panel => {
            const winId = panel.dataset.windowId;
            const win = this.config.windows.find(w => w.id === winId);
            if (!win) return;

            const shouldBeOpen = win.isPinned || (this.isPanelOpen && (win.id === 'main' || win.isOpen));
            
            if (shouldBeOpen) {
                panel.classList.add('open');
                if (win.id === 'main') {
                     const textArea = panel.querySelector('.solari-notes-textarea');
                     if (textArea) {
                         textArea.focus();
                         textArea.selectionStart = textArea.selectionEnd = textArea.value.length;
                     }
                }
            } else {
                panel.classList.remove('open');
            }
        });
    }

    handleOutsideClick(e) {
        const icon = document.getElementById('solari-notes-icon-btn');

        // 1. If clicked inside ANY panel or inside the toolbar icon, ignore it.
        if (e.target.closest('.solari-notes-panel')) return;
        if (icon && icon.contains(e.target)) return;

        // 2. Ignore clicks on Discord overlays/toasts
        if (e.target.closest('.layerContainer-2v_Sit, .layerContainer_cd0de5, [class*="layerContainer"]')) return;
        if (document.querySelector('.toast-item')?.contains(e.target)) return;

        // 3. Option 1 revised: Clean Sweep means VISUAL closing, but we don't destroy layout anymore (per user)
        if (this.isPanelOpen) {
            this.togglePanel(false);
        }
    }

    makeDraggable(panel, header, win) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        const dragMouseDown = (e) => {
            if (win.isPinned) return;
            if (e.target.closest && (e.target.closest('.solari-notes-close-btn') || e.target.closest('.solari-notes-pin-btn'))) return;

            e.preventDefault();
            // Get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.addEventListener('mouseup', closeDragElement);
            document.addEventListener('mousemove', elementDrag);
        };

        const elementDrag = (e) => {
            e.preventDefault();
            // Calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            // Restrição de limite para não prender debaixo da barra de título (22px) do Discord
            let newTop = panel.offsetTop - pos2;
            if (newTop < 22) newTop = 22;

            // Set the element's new position:
            panel.style.top = newTop + "px";
            panel.style.left = (panel.offsetLeft - pos1) + "px";
            panel.style.right = "auto";
            panel.style.bottom = "auto";
        };

        const closeDragElement = () => {
            // Stop moving when mouse button is released:
            document.removeEventListener('mouseup', closeDragElement);
            document.removeEventListener('mousemove', elementDrag);

            win.x = panel.offsetLeft;
            win.y = Math.max(22, panel.offsetTop); // Garante que nunca seja salvo menor que 22
            this.saveConfig();
        };

        header.onmousedown = dragMouseDown;
    }

    makeResizable(panel, win) {
        if (!window.ResizeObserver) return;

        // 1. Resize Persistence via Observer (Stays for backend saving)
        let resizeTimeout;
        const resizeObserver = new ResizeObserver(entries => {
            if (win.id === 'main' && !this.isPanelOpen) return;
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                for (let entry of entries) {
                    if (entry.target === panel) {
                        const rect = entry.contentRect;
                        if (rect.width > 0 && rect.height > 0) {
                            win.w = Math.floor(panel.offsetWidth);
                            win.h = Math.floor(panel.offsetHeight);
                            win.x = panel.offsetLeft;
                            win.y = panel.offsetTop;
                            this.saveConfig();
                        }
                    }
                }
            }, 300);
        });
        resizeObserver.observe(panel);

        // 2. Advanced Multi-edge Resize Interaction
        const handles = panel.querySelectorAll('.solari-notes-handle');
        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                if (win.isPinned) return;
                e.preventDefault();
                e.stopPropagation();

                const dir = handle.dataset.dir;
                let startX = e.clientX;
                let startY = e.clientY;
                let startW = panel.offsetWidth;
                let startH = panel.offsetHeight;
                let startL = panel.offsetLeft;
                let startT = panel.offsetTop;

                const onMouseMove = (moveEvent) => {
                    const deltaX = moveEvent.clientX - startX;
                    const deltaY = moveEvent.clientY - startY;

                    if (dir.includes('e')) {
                        panel.style.width = (startW + deltaX) + 'px';
                    }
                    if (dir.includes('w')) {
                        const newW = startW - deltaX;
                        if (newW > 200) {
                            panel.style.width = newW + 'px';
                            panel.style.left = (startL + deltaX) + 'px';
                            panel.style.right = 'auto';
                        }
                    }
                    if (dir.includes('s')) {
                        panel.style.height = (startH + deltaY) + 'px';
                    }
                    if (dir.includes('n')) {
                        const newH = startH - deltaY;
                        if (newH > 150) {
                            panel.style.height = newH + 'px';
                            panel.style.top = (startT + deltaY) + 'px';
                            panel.style.bottom = 'auto';
                        }
                    }
                };

                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    }

    cleanupEmptyWindows() {
        const windowsToKeep = [];
        let configChanged = false;

        this.config.windows.forEach(win => {
            if (win.id === 'main') {
                windowsToKeep.push(win); // Never destroy main
                return;
            }

            const hasTabs = this.tabs.some(t => t.windowId === win.id);
            if (hasTabs) {
                windowsToKeep.push(win);
            } else {
                console.log("[SolariNotes] Destroying empty zombie window:", win.id);
                // The DOM removal might already be handled by the closeBtn listener, 
                // but this acts as an automatic garbage collector for drag-and-drop tear-offs
                const panelNode = document.querySelector(`.solari-notes-panel[data-window-id="${win.id}"]`);
                if (panelNode) panelNode.remove();
                configChanged = true;
            }
        });

        if (configChanged) {
            this.config.windows = windowsToKeep;
            this.saveConfig();
        }
    }

    saveNotesToBackend() {
        if (!this.isConnected) return;
        const payload = JSON.stringify({ tabs: this.tabs, activeTabId: this.activeTabId });
        this.send({ type: 'notes_update', content: payload });
    }

    updateTextAreaUI() {
        const panels = document.querySelectorAll('.solari-notes-panel');
        
        panels.forEach(panel => {
            const winId = panel.dataset.windowId;
            const textArea = panel.querySelector('.solari-notes-textarea');
            const statusDot = panel.querySelector('.solari-notes-status');

            if (textArea && document.activeElement !== textArea) {
                const active = this.tabs.find(t => t.id === this.activeTabId && t.windowId === winId);
                if (active) {
                    textArea.value = active.content;
                } else {
                    // Fallback to first tab in this window if active tab is in another window
                    const firstInWin = this.tabs.find(t => t.windowId === winId);
                    textArea.value = firstInWin ? firstInWin.content : '';
                }
            }

            if (statusDot) {
                if (this.isConnected) {
                    statusDot.classList.add('connected');
                    statusDot.title = this.t('connected');
                } else {
                    statusDot.classList.remove('connected');
                    statusDot.title = this.t('disconnected');
                }
            }
        });

        this.renderTabs();
    }

    removeUI() {
        document.removeEventListener('mousedown', this.handleOutsideClick);
        const icon = document.getElementById('solari-notes-icon-btn');
        if (icon) icon.remove();
        document.querySelectorAll('.solari-notes-panel').forEach(p => p.remove());
    }

    safeShowToast(message, options = {}) {
        try {
            if (typeof BdApi.showToast === "function") BdApi.showToast(message, options);
            else if (BdApi.UI?.showToast) BdApi.UI.showToast(message, options);
        } catch (e) { console.error("[SolariNotes] Toast error:", e); }
    }
};

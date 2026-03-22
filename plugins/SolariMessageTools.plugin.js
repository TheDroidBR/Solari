/**
 * @name SolariMessageTools
 * @author TheDroid
 * @authorLink https://solarirpc.com
 * @version 1.0.0
 * @description A powerful suite of message utilities for Discord including Quick Edit, Macros, and Active Translation. Integrated with Solari.
 * @source https://github.com/TheDroidBR/Solari
 * @website https://solarirpc.com
 * @updateUrl https://raw.githubusercontent.com/TheDroidBR/Solari/main/plugins/SolariMessageTools.plugin.js
 */

module.exports = class SolariMessageTools {
    constructor() {
        const defaultSettings = {
            quickEditEnabled: true,
            antiTypingEnabled: false,
            translationEnabled: true,
            translationModalEnabled: true,
            textMacrosEnabled: true,
            language: "en" // Idioma padrão: Inglês
        };

        // Merge dos defaults para evitar undefined em configs antigas
        this.config = Object.assign({}, defaultSettings, BdApi.Data.load("SolariMessageTools", "settings"));

        this.macroLibrary = [
            {
                category: 'Populares', items: [
                    { alias: '/shrug', value: '¯\\_(ツ)_/¯', desc: 'Envia o clássico encolher de ombros.' },
                    { alias: '/lenny', value: '( ͡° ͜ʖ ͡°)', desc: 'Envia a cara de safadeza ( ͡° ͜ʖ ͡°).' },
                    { alias: '/solari', value: '☀️ Solari Power', desc: 'Sinta o poder do Solari!' },
                    { alias: '/tableflip', value: '(╯°□°）╯︵ ┻━┻', desc: 'Vira uma mesa com raiva.' },
                    { alias: '/unflip', value: '┬─┬ ノ( ゜-゜ノ)', desc: 'Desvira a mesa gentilmente.' }
                ]
            },
            {
                category: 'Afeto', items: [
                    { alias: '/hug', value: '(づ｡◕‿‿◕｡)づ', desc: 'Envia um abraço carinhoso.' },
                    { alias: '/kiss', value: '(づ￣ ³￣)づ', desc: 'Manda um beijinho.' },
                    { alias: '/love', value: '(｡♥‿♥｡)', desc: 'Mostra que você amou isso!' },
                    { alias: '/blush', value: '(〃▽〃)', desc: 'Fica com vergonha.' },
                    { alias: '/shy', value: '(◡‿◡✿)', desc: 'Fica tímido.' }
                ]
            },
            {
                category: 'Emoções', items: [
                    { alias: '/angry', value: '(ノಠ益ಠ)ノ', desc: 'Fica muito furioso!' },
                    { alias: '/poker', value: '( ⚆ _ ⚆ )', desc: 'Cara de poker face.' },
                    { alias: '/cry', value: '(╥﹏╥)', desc: 'Começa a chorar.' },
                    { alias: '/joy', value: '(^▽^)', desc: 'Fica feliz da vida.' },
                    { alias: '/wow', value: '(⊙_⊙)', desc: 'Fica impressionado (Uau!).' },
                    { alias: '/think', value: '(・へ・)', desc: 'Fica pensativo...' },
                    { alias: '/sus', value: 'ඞ', desc: 'Among Us? Impostor detectado.' }
                ]
            },
            {
                category: 'Ações', items: [
                    { alias: '/dance', value: '└(＾＾)┐ ┌(＾＾)┘', desc: 'Começa a dançar no chat.' },
                    { alias: '/fight', value: '(ง •̀_•́)ง', desc: 'Chama pra briga!' },
                    { alias: '/dead', value: '(×_×)', desc: 'Faleceu... (Morto).' },
                    { alias: '/magic', value: '(∩^o^)⊃━☆', desc: 'Faz uma mágica!' },
                    { alias: '/run', value: 'ε=ε=┌(;￣▽￣)┘', desc: 'Sai correndo rapidamente!' }
                ]
            },
            {
                category: 'Animais', items: [
                    { alias: '/cat', value: '(=^·^=)', desc: 'Desenha um gatinho.' },
                    { alias: '/dog', value: '(U^Ⓣ^U)', desc: 'Desenha um cachorrinho.' },
                    { alias: '/bear', value: 'ʕ•ᴥ•ʔ', desc: 'Desenha um ursinho pooh.' },
                    { alias: '/bird', value: '(•ө•)', desc: 'Desenha um passarinho.' },
                    { alias: '/fish', value: 'くコ:彡', desc: 'Desenha uma lula/peixe.' }
                ]
            }
        ];

        // Guarda as promessas de patches do Webpack
        this.cancelPatches = [];
        this.initI18n(); // Inicializa as traduções
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    getSettingsSchema() {
        return [
            { type: 'custom_header', title: 'Solari MessageTools', icon: '💬', version: 'v1.0.0' },
            { type: 'toggle', key: 'quickEditEnabled', label: 'Quick Edit & Delete', description: 'Duplo clique para editar, Shift+Clique para deletar de vez.' },
            { type: 'toggle', key: 'antiTypingEnabled', label: 'Anti-Typing (Modo Anônimo)', description: 'Digite livremente sem acionar o indicador de is typing do Discord na DM ou Canais.' },
            { type: 'toggle', key: 'translationEnabled', label: 'Tradução Ativa (Pelo Google)', description: 'Menu de contexto super tunado de tradução direta nos chats em tempo real.' },
            { type: 'toggle', key: 'textMacrosEnabled', label: 'Macros de Texto Mágicos', description: 'Transforma /solari e outros atalhos customizados na hora de enviar.' },
        ];
    }

    saveConfig() {
        try {
            // Salva internamente pro BD
            BdApi.Data.save("SolariMessageTools", "settings", this.config);

            // Grava o arquivo de schema e fallback pro Solari App renderizar na UI dinamicamente!
            const fs = require('fs');
            const path = require('path');
            const appData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
            const cfgPath = path.join(appData, 'BetterDiscord', 'plugins', 'SolariMessageTools.config.json');

            const payload = {
                settings: this.config,
                schema: this.getSettingsSchema()
            };
            fs.writeFileSync(cfgPath, JSON.stringify(payload, null, 4), 'utf8');
        } catch (e) {
            console.error("[SolariMessageTools] Erro ao sincronizar Solari Config:", e);
        }
    }

    start() {
        console.log("[SolariMessageTools] Starting v1.0.0...");

        // Helper a prova de falhas para Webpack (Backwards & Forwards compatibility)
        this.getModuleObject = (...props) => {
            const { Webpack, Filters } = BdApi;
            let m;
            try {
                if (Webpack && Webpack.getModule) {
                    if (Filters && typeof Filters.byProps === "function") m = Webpack.getModule(Filters.byProps(...props));
                    if (!m) m = Webpack.getModule(mod => props.every(p => (mod && mod[p] !== undefined) || (mod && mod.default && mod.default[p] !== undefined)));
                }
            } catch (e) { }
            return m || (BdApi.findModuleByProps ? BdApi.findModuleByProps(...props) : null);
        };

        // Salvar Schema dinamicamente para o Solari App renderizar a UI sem builds customizadas
        this.saveConfig();

        // Carrega o CSS global do plugin
        this.injectCSS();

        // Aplica as interceptações na UI (Typing, ContextMenu, Macros)
        this.applyPatches();

        // Registra os ouvintes globais de DOM
        document.addEventListener('dblclick', this.handleDoubleClick);
        document.addEventListener('click', this.handleClick);
    }

    stop() {
        console.log("[SolariMessageTools] Stopping...");

        // Limpa ouvintes do DOM
        document.removeEventListener('dblclick', this.handleDoubleClick);
        document.removeEventListener('click', this.handleClick);

        // Limpa o CSS
        BdApi.DOM.removeStyle("SolariMessageTools-CSS");

        // Desfaz as interceptações (Unpatch)
        BdApi.Patcher.unpatchAll("SolariMessageTools");
        for (const cancel of this.cancelPatches) {
            cancel();
        }
    }

    injectCSS() {
        BdApi.DOM.addStyle("SolariMessageTools-CSS", `
            :root {
                --smt-accent: #a855f7;
                --smt-accent-dark: #7e22ce;
                --smt-bg-card: rgba(0, 0, 0, 0.4);
                --smt-border: rgba(255, 255, 255, 0.08);
            }

            .smt-settings-container {
                background: linear-gradient(135deg, rgba(20, 20, 25, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%);
                backdrop-filter: blur(20px);
                border-radius: 16px;
                padding: 24px;
                color: #fff;
                font-family: 'Inter', 'gg sans', sans-serif;
                border: 1px solid var(--smt-border);
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                max-width: 600px;
                margin: 0 auto;
            }

            .smt-header-main {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 28px;
                padding-bottom: 20px;
                border-bottom: 1px solid var(--smt-border);
            }

            .smt-header-icon {
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, var(--smt-accent) 0%, var(--smt-accent-dark) 100%);
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
            }

            .smt-header-text h1 {
                margin: 0;
                font-size: 22px;
                font-weight: 700;
                background: linear-gradient(90deg, #fff, rgba(255,255,255,0.7));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .smt-header-text p {
                margin: 4px 0 0 0;
                font-size: 13px;
                color: rgba(255,255,255,0.5);
            }

            .smt-section {
                margin-bottom: 24px;
            }

            .smt-section-title {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--smt-accent);
                font-weight: 700;
                margin-bottom: 12px;
                opacity: 0.8;
            }

            .smt-card {
                background: var(--smt-bg-card);
                border: 1px solid var(--smt-border);
                border-radius: 12px;
                padding: 14px 18px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 10px;
                transition: all 0.2s ease;
            }

            .smt-card:hover {
                border-color: rgba(168, 85, 247, 0.3);
                background: rgba(168, 85, 247, 0.05);
                transform: translateX(4px);
            }

            .smt-card-info {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .smt-card-title {
                font-size: 15px;
                font-weight: 600;
                color: #eee;
            }

            .smt-card-desc {
                font-size: 11px;
                color: rgba(255,255,255,0.45);
                line-height: 1.4;
            }

            /* Premium Switch Styling */
            .smt-switch {
                position: relative;
                display: inline-block;
                width: 44px;
                height: 24px;
                cursor: pointer;
            }

            .smt-switch input {
                opacity: 0; width: 0; height: 0;
            }

            .smt-switch-slider {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(255,255,255,0.1);
                transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
                border-radius: 20px;
                border: 1px solid rgba(255,255,255,0.05);
            }

            .smt-switch-knob {
                position: absolute;
                height: 18px; width: 18px;
                left: 3px; bottom: 2px;
                background: #fff;
                transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            }

            input:checked + .smt-switch-slider {
                background: var(--smt-accent);
                box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
            }

            input:checked + .smt-switch-slider .smt-switch-knob {
                transform: translateX(20px);
            }

            /* Custom Select Styling */
            .smt-select-wrap {
                margin-top: 8px;
                position: relative;
            }

            .smt-select {
                width: 100%;
                background: rgba(0,0,0,0.4);
                border: 1px solid var(--smt-border);
                border-radius: 8px;
                padding: 12px;
                color: #fff;
                font-size: 14px;
                outline: none;
                cursor: pointer;
                transition: border-color 0.2s;
                -webkit-appearance: none;
            }

            .smt-select:focus {
                border-color: var(--smt-accent);
            }

            .smt-footer {
                margin-top: 20px;
                text-align: center;
                font-size: 11px;
                color: rgba(255,255,255,0.3);
            }

            /* Original Plugin Features Styles */
            .smt-reaction-bar {
                display: none;
                position: absolute;
                top: -10px;
                right: 15px;
                background: var(--background-secondary);
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                padding: 4px;
                z-index: 100;
            }
            .message-2CShn3:hover .smt-reaction-bar {
                display: flex;
            }

            /* Macro Library UI */
            .smt-macro-library {
                margin-top: 20px;
                border: 1px solid var(--smt-border);
                border-radius: 12px;
                background: rgba(0,0,0,0.2);
                overflow: hidden;
            }
            .smt-macro-tabs {
                display: flex;
                background: rgba(255,255,255,0.03);
                border-bottom: 1px solid var(--smt-border);
                gap: 2px;
                padding: 4px;
                overflow-x: auto;
            }
            .smt-macro-tab {
                padding: 8px 14px;
                font-size: 11px;
                font-weight: 600;
                color: rgba(255,255,255,0.4);
                cursor: pointer;
                border-radius: 6px;
                transition: all 0.2s;
                white-space: nowrap;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .smt-macro-tab:hover {
                color: rgba(255,255,255,0.8);
                background: rgba(255,255,255,0.05);
            }
            .smt-macro-tab.active {
                color: #fff;
                background: var(--smt-accent);
                box-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
            }
            .smt-macro-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
                gap: 10px;
                padding: 16px;
                max-height: 350px;
                overflow-y: auto;
            }
            .smt-macro-item {
                background: rgba(255,255,255,0.03);
                border: 1px solid var(--smt-border);
                border-radius: 8px;
                padding: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .smt-macro-item:hover {
                border-color: var(--smt-accent);
                background: rgba(168, 85, 247, 0.05);
                transform: translateY(-2px);
            }
            .smt-macro-alias {
                font-size: 10px;
                color: var(--smt-accent);
                font-weight: 700;
                font-family: monospace;
            }
            .smt-macro-value {
                font-size: 14px;
                color: #fff;
                text-align: center;
            }
            .smt-macro-grid::-webkit-scrollbar {
                width: 6px;
            }
            .smt-macro-grid::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
            }
        `);
    }

    initI18n() {
        this.i18n = {
            en: {
                title: "Solari MessageTools",
                desc: "Full control over your Discord messages",
                language: "Language",
                features: "Features",
                quickEditLabel: "Quick Edit & Delete",
                quickEditDesc: "Double click to edit, Shift+Click to delete instantly.",
                antiTypingLabel: "Anti-Typing (Stealth)",
                antiTypingDesc: "Prevents Discord from showing that you are typing.",
                translationLabel: "Active Translation",
                translationDesc: "Enables translation tools via context menu.",
                macrosLabel: "Text Macros",
                macrosDesc: "Replaces shortcuts like /shrug and /solari instantly.",
                library: "Macro Library",
                all: "All",
                languageHint: "Choose your preferred interface language.",
                footer: "Solari Power • v1.0.0 • Tap a macro to copy the command",
                copySuccess: "Emote copied",
                translating: "Translating via Solari...",
                transTitle: "Solari Translation",
                copyTrans: "Copy Translation",
                close: "Close",
                transSuccess: "Translation copied!",
                cat_all: "All",
                cat_popular: "Popular",
                cat_affection: "Affection",
                cat_emotion: "Emotion",
                cat_action: "Action",
                cat_animal: "Animals",
                translationError: "Error translating. Check your connection.",
                featureToggleToast: "Feature {feature} is now {status}",
                languageChangeToast: "Language changed to {lang}. Reopen settings.",
                enabled: "Enabled",
                disabled: "Disabled",
                contextLabel: "Translate Message (Solari)",
                to_en: "To English",
                to_pt: "To Portuguese",
                to_de: "To German",
                to_es: "To Spanish"
            },
            pt: {
                title: "Solari MessageTools",
                desc: "Controle total sobre suas mensagens no Discord",
                language: "Idioma",
                features: "Funcionalidades",
                quickEditLabel: "Quick Edit & Delete",
                quickEditDesc: "Duplo clique para editar, Shift+Click para deletar instantaneamente.",
                antiTypingLabel: "Anti-Typing (Furtividade)",
                antiTypingDesc: "Impede que o Discord mostre que você está digitando.",
                translationLabel: "Tradução Ativa",
                translationDesc: "Habilita ferramentas de tradução via menu de contexto.",
                macrosLabel: "Macros de Texto",
                macrosDesc: "Substitui atalhos como /shrug e /solari instantaneamente.",
                library: "Biblioteca de Macros",
                all: "Todos",
                languageHint: "Escolha seu idioma de interface preferido.",
                footer: "Solari Power • v1.0.0 • Toque em um macro para copiar o comando",
                copySuccess: "Emote copiado",
                translating: "Traduzindo via Solari...",
                transTitle: "Tradução Solari",
                copyTrans: "Copiar Tradução",
                close: "Fechar",
                transSuccess: "Tradução copiada!",
                cat_all: "Todos",
                cat_popular: "Populares",
                cat_affection: "Afeto",
                cat_emotion: "Emoções",
                cat_action: "Ações",
                cat_animal: "Animais",
                translationError: "Erro ao traduzir. Verifique sua conexão.",
                featureToggleToast: "Funcionalidade {feature} agora está {status}",
                languageChangeToast: "Idioma alterado para {lang}. Reabra as configurações.",
                enabled: "Ativada",
                disabled: "Desativada",
                contextLabel: "Traduzir Mensagem (Solari)",
                to_en: "Para Inglês",
                to_pt: "Para Português",
                to_de: "Para Alemão",
                to_es: "Para Espanhol"
            },
            de: {
                title: "Solari MessageTools",
                desc: "Vollständige Kontrolle über Ihre Discord-Nachrichten",
                language: "Sprache",
                features: "Funktionen",
                quickEditLabel: "Schnell Bearbeiten & Löschen",
                quickEditDesc: "Doppelklick zum Bearbeiten, Umschalt+Klick zum sofortigen Löschen.",
                antiTypingLabel: "Anti-Tippen (Stealth)",
                antiTypingDesc: "Verhindert, dass Discord anzeigt, dass Sie tippen.",
                translationLabel: "Aktive Übersetzung",
                translationDesc: "Aktiviert Übersetzungswerkzeuge über das Kontextmenü.",
                macrosLabel: "Text-Makros",
                macrosDesc: "Ersetzt Verknüpfungen wie /shrug und /solari sofort.",
                library: "Makro-Bibliothek",
                all: "Alle",
                languageHint: "Wählen Sie Ihre bevorzugte Oberflächensprache.",
                footer: "Solari Power • v1.0.0 • Tippe auf ein Makro, um den Befehl zu kopieren",
                copySuccess: "Emote kopiert",
                translating: "Übersetzung via Solari...",
                transTitle: "Solari Übersetzung",
                copyTrans: "Übersetzung kopieren",
                close: "Schließen",
                transSuccess: "Übersetzung kopiert!",
                cat_all: "Alle",
                cat_popular: "Beliebt",
                cat_affection: "Zuneigung",
                cat_emotion: "Emotionen",
                cat_action: "Aktionen",
                cat_animal: "Tiere",
                translationError: "Fehler beim Übersetzen. Überprüfen Sie Ihre Verbindung.",
                featureToggleToast: "Funktion {feature} ist jetzt {status}",
                languageChangeToast: "Sprache auf {lang} geändert. Einstellungen erneut öffnen.",
                enabled: "Aktiviert",
                disabled: "Deaktiviert",
                contextLabel: "Nachricht übersetzen (Solari)",
                to_en: "Auf Englisch",
                to_pt: "Auf Portugiesisch",
                to_de: "Auf Deutsch",
                to_es: "Auf Spanisch"
            }
        };
    }

    t(key, params = {}) {
        const lang = this.config.language || "en";
        let str = this.i18n[lang]?.[key] || this.i18n["en"][key] || key;
        if (typeof str === 'string') {
            Object.keys(params).forEach(p => {
                str = str.replace(`{${p}}`, params[p]);
            });
        }
        return str;
    }

    applyPatches() {
        // Intercepta módulo de Typings para impedir emissão caso ativado
        const TypingModule = this.getModuleObject("startTyping");
        if (TypingModule) {
            BdApi.Patcher.instead("SolariMessageTools", TypingModule, "startTyping", (thisObject, args, originalFunction) => {
                if (this.config.antiTypingEnabled) {
                    return Promise.resolve(); // Aborta o ping para o servidor dizendo que digitou
                }
                return originalFunction.apply(thisObject, args);
            });

            BdApi.Patcher.instead("SolariMessageTools", TypingModule, "stopTyping", (thisObject, args, originalFunction) => {
                if (this.config.antiTypingEnabled) {
                    return Promise.resolve();
                }
                return originalFunction.apply(thisObject, args);
            });
        }

        // Patcher para Macros de Texto (Interrompendo sendMessage)
        try {
            const MessageActions = this.getModuleObject("sendMessage");
            if (MessageActions && MessageActions.sendMessage) {
                BdApi.Patcher.before("SolariMessageTools", MessageActions, "sendMessage", (_, args) => {
                    if (this.config.textMacrosEnabled !== false && args[1]) {
                        let content = args[1].content;
                        // Aplica todos os macros da biblioteca
                        this.macroLibrary.forEach(category => {
                            category.items.forEach(item => {
                                // Cria regex global para substituir todas as ocorrências
                                const regex = new RegExp(item.alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                                content = content.replace(regex, item.value);
                            });
                        });
                        args[1].content = content;
                    }
                });
            }
        } catch (e) { console.error("[SolariMessageTools] Erro no patch de TextMacros:", e); }

        // Patcher do Menu de Contexto de Mensagens
        if (BdApi.ContextMenu && typeof BdApi.ContextMenu.patch === 'function') {
            const patchHandler = (res, props) => {
                if (!res || !res.props) return res;

                const message = props.message;
                // Modificado para usar check seguro (false explícito), evitando bloqueio por undefined
                if (!message || !message.content || this.config.translationEnabled === false) return res;

                // Construímos um array espalhado (flattened array) de elementos do menu do BetterDiscord
                const menuElements = BdApi.ContextMenu.buildMenuChildren([
                    {
                        type: "group",
                        items: [
                            {
                                type: "submenu",
                                label: this.t('contextLabel'),
                                id: "smt-translate-menu",
                                action: () => {}, // Submenu itself doesn't have an action, its items do
                                items: [
                                    { type: "text", label: this.t('to_en'), id: "smt-trans-en", action: () => this.translateMessage(message, "en") },
                                    { type: "text", label: this.t('to_pt'), id: "smt-trans-pt", action: () => this.translateMessage(message, "pt") },
                                    { type: "text", label: this.t('to_de'), id: "smt-trans-de", action: () => this.translateMessage(message, "de") },
                                    { type: "text", label: this.t('to_es'), id: "smt-trans-es", action: () => this.translateMessage(message, "es") }
                                ]
                            }
                        ]
                    }
                ]);

                // Injeção purista, totalmente flatten para a árvore React do Context Menu do Discord
                try {
                    const children = res.props.children;
                    if (Array.isArray(children)) {
                        children.push(...menuElements);
                    } else if (children && children.props && Array.isArray(children.props.children)) {
                        children.props.children.push(...menuElements);
                    } else {
                        res.props.children = [children, ...menuElements];
                    }
                } catch (err) {
                    console.error("[SolariMessageTools] Falha ao injetar no Context Menu: ", err);
                }

                return res;
            };

            // Aplica via Multi-Hooks em todas as variações de menus de mensagens possíveis do BD
            const messageNavIds = ["message", "Message", "MessageContextMenu", "message-actions", "MESSAGE"];
            messageNavIds.forEach(navId => {
                try {
                    this.cancelPatches.push(BdApi.ContextMenu.patch(navId, patchHandler));
                } catch (e) {
                    console.log(`[SolariMessageTools] Falha ao registrar hook no menu ${navId}`);
                }
            });
        }

    }

    async translateMessage(messageObj, targetLang) {
        if (!messageObj || !messageObj.content) return;

        try {
            BdApi.UI.showToast(this.t('translating'), { type: "info", icon: true });
            const p = new URLSearchParams({
                client: 'gtx',
                sl: 'auto',
                tl: targetLang,
                dt: 't',
                q: messageObj.content
            });

            const response = await fetch(`https://translate.googleapis.com/translate_a/single?${p.toString()}`);
            const data = await response.json();

            if (data && data[0]) {
                const translatedText = data[0].map(part => part[0]).join("");

                // EXIBIÇÃO EM JANELA (MÉTODO SEGURO E PREMIUM)
                const React = BdApi.React;

                // Busca o componente de Markdown do Discord para manter a formatação
                const Markdown = this.getModuleObject("parser", "rules") || ((props) => React.createElement("div", {}, props.children || props.content));

                // Box de Tradução
                const translationMarkup = React.createElement("div", {
                    style: {
                        color: "#fff",
                        background: "rgba(168, 85, 247, 0.08)",
                        padding: "16px",
                        borderRadius: "12px",
                        border: "1px solid rgba(168, 85, 247, 0.3)",
                        boxShadow: "0 0 20px rgba(168, 85, 247, 0.1)",
                        marginTop: "12px",
                        cursor: "text",
                        userSelect: "text",
                        fontFamily: "'Inter', sans-serif",
                        whiteSpace: "pre-wrap" // Preserva espaços e quebras de linha
                    }
                }, React.createElement(Markdown, {}, translatedText));

                // Box Original
                const originalMarkup = React.createElement("div", {
                    style: {
                        opacity: "0.5",
                        fontSize: "12px",
                        lineHeight: "1.4",
                        fontStyle: "italic",
                        borderLeft: "3px solid var(--smt-accent)",
                        paddingLeft: "12px",
                        marginTop: "20px",
                        userSelect: "text",
                        whiteSpace: "pre-wrap"
                    }
                }, "Original: " + messageObj.content);

                // Disparamos o formModal do Discord
                BdApi.UI.showConfirmationModal(
                    `${this.t('transTitle')} (${targetLang.toUpperCase()})`,
                    [translationMarkup, originalMarkup],
                    {
                        confirmText: this.t('copyTrans'),
                        cancelText: this.t('close'),
                        onConfirm: () => {
                            require("electron").clipboard.writeText(translatedText);
                            BdApi.UI.showToast(this.t('transSuccess'), { type: "success" });
                        }
                    }
                );
            }
        } catch (error) {
            console.error("[SolariMessageTools] Erro na tradução:", error);
            BdApi.UI.showToast(this.t('translationError'), { type: "error" });
        }
    }

    handleDoubleClick(e) {
        if (!this.config.quickEditEnabled) return;

        // Procura o conteúdo da mensagem (classe resiliente a hifens/sublinhados)
        const messageContent = e.target.closest('[class*="messageContent"]');
        if (!messageContent) return;

        if (e.target.closest('a') || e.target.closest('[class*="mention"]')) return;

        // Procura o container da linha da mensagem
        const messageContainer = messageContent.closest('[class*="messageListItem"]') || messageContent.closest('[class*="message-"]');
        if (!messageContainer) return;

        // Tenta usar o módulo do Discord primeiro (mais seguro)
        const MessageActions = this.getModuleObject("startEditMessage");
        if (MessageActions) {
            const messageElement = messageContainer.querySelector('[class*="message-"]');
            if (messageElement) {
                const idAttr = messageElement.id;
                if (idAttr && idAttr.startsWith('chat-messages-')) {
                    const parts = idAttr.split('-');
                    if (parts.length >= 4) {
                        const channelId = parts[2];
                        const messageId = parts[3];
                        MessageActions.startEditMessage(channelId, messageId, "");
                        return;
                    }
                }
            }
        }

        // Fallback DOM (funciona se a barra de ferramentas estiver visível)
        const btn = messageContainer.querySelector('[aria-label*="Editar"], [aria-label*="Edit"], [aria-label*="Modifier"], [aria-label*="Bearbeiten"]');
        if (btn) btn.click();
    }

    handleClick(e) {
        if (!e.shiftKey || !this.config.quickEditEnabled) return;

        // Procura o conteúdo da mensagem (classe resiliente)
        const messageContent = e.target.closest('[class*="messageContent"]');
        if (!messageContent) return;

        const messageContainer = messageContent.closest('[class*="messageListItem"]') || messageContent.closest('[class*="message-"]');
        if (!messageContainer) return;

        // Se for Shift+Click, tentamos deletar
        const MessageActions = this.getModuleObject("deleteMessage");
        if (MessageActions) {
            const messageElement = messageContainer.querySelector('[class*="message-"]') || messageContainer.querySelector('[id*="chat-messages-"]');
            if (messageElement) {
                const idAttr = messageElement.id;
                if (idAttr && idAttr.startsWith('chat-messages-')) {
                    const parts = idAttr.split('-');
                    if (parts.length >= 4) {
                        const channelId = parts[2];
                        const messageId = parts[3];
                        MessageActions.deleteMessage(channelId, messageId);

                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                }
            }
        }

        // Fallback DOM para o botão Deletar
        const btn = messageContainer.querySelector('[aria-label*="Excluir"], [aria-label*="Delete"], [aria-label*="Supprimer"], [aria-label*="Löschen"]');
        if (btn) btn.click();
    }

    getSettingsPanel() {
        const panel = document.createElement("div");
        panel.className = "smt-settings-container";
        this.renderSettings(panel);
        return panel;
    }

    renderSettings(panel) {
        panel.innerHTML = `
            <div class="smt-header-main">
                <div class="smt-header-icon">💬</div>
                <div class="smt-header-text">
                    <h1>${this.t('title')}</h1>
                    <p>${this.t('desc')}</p>
                </div>
            </div>

            <div class="smt-section">
                <div class="smt-section-title">${this.t('language')}</div>
                <div class="smt-card">
                    <div class="smt-card-info">
                        <span class="smt-card-title">${this.t('language')}</span>
                        <span class="smt-card-desc">${this.t('languageHint')}</span>
                    </div>
                    <select id="smt-lang-select" style="background: rgba(0,0,0,0.2); color: white; border: 1px solid rgba(168,85,247,0.3); padding: 8px; border-radius: 8px; outline: none; cursor: pointer;">
                        <option value="en" ${this.config.language === 'en' ? 'selected' : ''}>English</option>
                        <option value="pt" ${this.config.language === 'pt' ? 'selected' : ''}>Português</option>
                        <option value="de" ${this.config.language === 'de' ? 'selected' : ''}>Deutsch</option>
                    </select>
                </div>
            </div>

            <div class="smt-section">
                <div class="smt-section-title">${this.t('features')}</div>
                
                <div class="smt-card">
                    <div class="smt-card-info">
                        <span class="smt-card-title">${this.t('quickEditLabel')}</span>
                        <span class="smt-card-desc">${this.t('quickEditDesc')}</span>
                    </div>
                    <label class="smt-switch">
                        <input type="checkbox" id="smt-quickedit" ${this.config.quickEditEnabled ? 'checked' : ''}>
                        <span class="smt-switch-slider"><span class="smt-switch-knob"></span></span>
                    </label>
                </div>

                <div class="smt-card">
                    <div class="smt-card-info">
                        <span class="smt-card-title">${this.t('antiTypingLabel')}</span>
                        <span class="smt-card-desc">${this.t('antiTypingDesc')}</span>
                    </div>
                    <label class="smt-switch">
                        <input type="checkbox" id="smt-antityping" ${this.config.antiTypingEnabled ? 'checked' : ''}>
                        <span class="smt-switch-slider"><span class="smt-switch-knob"></span></span>
                    </label>
                </div>

                <div class="smt-card">
                    <div class="smt-card-info">
                        <span class="smt-card-title">${this.t('translationLabel')}</span>
                        <span class="smt-card-desc">${this.t('translationDesc')}</span>
                    </div>
                    <label class="smt-switch">
                        <input type="checkbox" id="smt-translation" ${this.config.translationEnabled ? 'checked' : ''}>
                        <span class="smt-switch-slider"><span class="smt-switch-knob"></span></span>
                    </label>
                </div>

                <div class="smt-card">
                    <div class="smt-card-info">
                        <span class="smt-card-title">${this.t('macrosLabel')}</span>
                        <span class="smt-card-desc">${this.t('macrosDesc')}</span>
                    </div>
                    <label class="smt-switch">
                        <input type="checkbox" id="smt-macros" ${this.config.textMacrosEnabled ? 'checked' : ''}>
                        <span class="smt-switch-slider"><span class="smt-switch-knob"></span></span>
                    </label>
                </div>

            </div>

            <div class="smt-section">
                <div class="smt-section-title">${this.t('library')}</div>
                <div class="smt-macro-library">
                    <div class="smt-macro-tabs">
                        <div class="smt-macro-tab active" data-cat="all">${this.t('cat_all')}</div>
                        ${this.macroLibrary.map(cat => {
                            const catKey = {
                                "Populares": "cat_popular",
                                "Afeto": "cat_affection",
                                "Emoções": "cat_emotion",
                                "Ações": "cat_action",
                                "Animais": "cat_animal"
                            }[cat.category] || "cat_all";
                            return `<div class="smt-macro-tab" data-cat="${cat.category}">${this.t(catKey)}</div>`;
                        }).join('')}
                    </div>
                    <div class="smt-macro-grid" id="smt-macro-grid">
                        <!-- Injetado via JS -->
                    </div>
                </div>
            </div>

            <div class="smt-footer">
                ${this.t('footer')}
            </div>
        `;

        const toggleHandler = (e, key, isSelect = false) => {
            const val = isSelect ? e.target.value : e.target.checked;
            this.config[key] = val;
            this.saveConfig();

            if (!isSelect) {
                const statusStr = this.t(val ? 'enabled' : 'disabled');
                BdApi.UI.showToast(this.t('featureToggleToast', { feature: this.t(key.replace('Enabled', 'Label')), status: statusStr }), { type: val ? 'success' : 'info' });
            }
        };

        panel.querySelector('#smt-quickedit').addEventListener('change', (e) => toggleHandler(e, 'quickEditEnabled'));
        panel.querySelector('#smt-antityping').addEventListener('change', (e) => toggleHandler(e, 'antiTypingEnabled'));
        panel.querySelector('#smt-translation').addEventListener('change', (e) => toggleHandler(e, 'translationEnabled'));
        panel.querySelector('#smt-macros').addEventListener('change', (e) => toggleHandler(e, 'textMacrosEnabled'));
        
        panel.querySelector('#smt-lang-select').addEventListener('change', (e) => {
            this.config.language = e.target.value;
            this.saveConfig();
            this.renderSettings(panel); // Repopula o container com o novo idioma IMEDIATAMENTE
        });

        // Lógica da Biblioteca de Macros
        const grid = panel.querySelector('#smt-macro-grid');
        const tabs = panel.querySelectorAll('.smt-macro-tab');

        const renderMacros = (cat = 'all') => {
            grid.innerHTML = '';
            let items = [];
            if (cat === 'all') {
                this.macroLibrary.forEach(c => items.push(...c.items));
            } else {
                const category = this.macroLibrary.find(c => c.category === cat);
                if (category) items = category.items;
            }

            items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'smt-macro-card';
                div.innerHTML = `
                    <div class="smt-macro-alias">${item.alias}</div>
                    <div class="smt-macro-value">${item.value}</div>
                `;
                div.onclick = () => {
                    const textToCopy = item.value;
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        BdApi.UI.showToast(`${this.t('copySuccess')}: ${item.alias}`, { type: "success" });
                    }).catch(() => {
                        require("electron").clipboard.writeText(textToCopy);
                        BdApi.UI.showToast(`${this.t('copySuccess')}: ${item.alias}`, { type: "success" });
                    });
                };
                grid.appendChild(div);
            });
        };

        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderMacros(tab.dataset.cat);
            };
        });

        renderMacros();
    }
};

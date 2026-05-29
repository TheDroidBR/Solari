/**
 * @name SolariManager
 * @author TheDroid
 * @authorLink https://solarirpc.com
 * @description Core manager plugin for the Solari ecosystem. Confirms BetterDiscord is running and allows the Solari App to remotely enable/disable other plugins.
 * @version 1.0.0
 * @source https://github.com/TheDroidBR/Solari
 * @website https://solarirpc.com
 * @updateUrl https://raw.githubusercontent.com/TheDroidBR/Solari/main/plugins/SolariManager.plugin.js
 */

module.exports = class SolariManager {
    static translations = {
        en: {
            connected: 'Connected to Solari',
            disconnected: 'Disconnected from Solari',
            connectedToast: 'SolariManager: Connected!',
            pluginEnabled: 'Plugin enabled',
            pluginDisabled: 'Plugin disabled',
            title: 'Solari Manager',
            status: 'Connection Status',
            heartbeat: 'Heartbeat',
            active: 'Active',
            inactive: 'Inactive',
            plugins: 'Managed Plugins',
            language: 'Language',
            done: '💾 Done',
            noPlugins: 'No plugins detected.',
            updateTitle: 'Update Available',
            updateDesc: 'A new version of {name} is available!',
            currentVersion: 'Current Version',
            newVersion: 'New Version',
            updateAction: 'Update Now',
            updateLater: 'Later',
            updateNotice: 'The plugin will be updated automatically and reloaded instantly in the background.',
            updateSuccess: 'Updated to v{version}!',
            changelogTitle: "What's New"
        },
        'pt-BR': {
            connected: 'Conectado ao Solari',
            disconnected: 'Desconectado do Solari',
            connectedToast: 'SolariManager: Conectado!',
            pluginEnabled: 'Plugin ativado',
            pluginDisabled: 'Plugin desativado',
            title: 'Solari Manager',
            status: 'Status da Conexão',
            heartbeat: 'Heartbeat',
            active: 'Ativo',
            inactive: 'Inativo',
            plugins: 'Plugins Gerenciados',
            language: 'Idioma',
            done: '💾 Feito',
            noPlugins: 'Nenhum plugin detectado.',
            updateTitle: 'Atualização Disponível',
            updateDesc: 'Uma nova versão do {name} está disponível!',
            currentVersion: 'Versão Atual',
            newVersion: 'Nova Versão',
            updateAction: 'Atualizar Agora',
            updateLater: 'Depois',
            updateNotice: 'O plugin será atualizado automaticamente e recarregado em segundo plano de forma instantânea.',
            updateSuccess: 'Atualizado para v{version}!',
            changelogTitle: 'O que há de novo'
        },
        es: {
            connected: 'Conectado a Solari',
            disconnected: 'Desconectado de Solari',
            connectedToast: 'SolariManager: ¡Conectado!',
            pluginEnabled: 'Plugin habilitado',
            pluginDisabled: 'Plugin deshabilitado',
            title: 'Solari Manager',
            status: 'Estado de la Conexión',
            heartbeat: 'Heartbeat',
            active: 'Activo',
            inactive: 'Inactivo',
            plugins: 'Plugins Gestionados',
            language: 'Idioma',
            done: '💾 Listo',
            noPlugins: 'No se detectaron plugins.',
            updateTitle: 'Actualización Disponible',
            updateDesc: '¡Una nueva versión de {name} está disponible!',
            currentVersion: 'Versión Actual',
            newVersion: 'Nueva Versión',
            updateAction: 'Actualizar Ahora',
            updateLater: 'Más tarde',
            updateNotice: 'El plugin se actualizará automáticamente y se recargará al instante en segundo plano.',
            updateSuccess: '¡Actualizado a v{version}!',
            changelogTitle: 'Novedades'
        }
    };

    constructor(meta) {
        this.meta = meta;
        this.ws = null;
        this.shouldReconnect = false;
        this.heartbeatInterval = null;
        this.config = {
            language: 'en',
            serverUrl: 'ws://localhost:6464'
        };
    }

    t(key) {
        const lang = this.config.language || 'en';
        return SolariManager.translations[lang]?.[key]
            || SolariManager.translations['en'][key]
            || key;
    }

    loadConfig() {
        try {
            const saved = BdApi.Data.load('SolariManager', 'config');
            if (saved) this.config = { ...this.config, ...saved };
        } catch (e) {
            console.error('[SolariManager] Error loading config:', e);
        }
    }

    saveConfig() {
        try {
            BdApi.Data.save('SolariManager', 'config', {
                language: this.config.language,
                serverUrl: this.config.serverUrl
            });
        } catch (e) {
            console.error('[SolariManager] Error saving config:', e);
        }
    }

    checkForUpdates() {
        const updateUrl = this.meta?.updateUrl;
        if (!updateUrl) return;

        fetch(`${updateUrl}?t=${Date.now()}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.text();
            })
            .then(code => {
                const versionMatch = code.match(/@version\s+([0-9.]+)/);
                if (!versionMatch) return;
                const remoteVersion = versionMatch[1];

                if (this.isNewerVersion(this.meta.version, remoteVersion)) {
                    this.showUpdateModal(remoteVersion, code);
                }
            })
            .catch(err => {
                console.error(`[${this.meta.name}] Update check failed:`, err);
            });
    }

    showUpdateModal(remoteVersion, code) {
        const React = BdApi.React;
        const content = React.createElement("div", {
            style: {
                color: "#f3f4f6",
                fontFamily: "'Inter', sans-serif",
                lineHeight: "1.6",
                fontSize: "14px"
            }
        },
            React.createElement("p", { style: { marginBottom: "12px" } },
                this.t('updateDesc').replace('{name}', this.meta.name)
            ),
            React.createElement("div", {
                style: {
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "16px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    textAlign: "center"
                }
            },
                React.createElement("div", {},
                    React.createElement("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" } }, this.t('currentVersion')),
                    React.createElement("div", { style: { fontSize: "16px", fontWeight: "bold", color: "#ef4444" } }, `v${this.meta.version}`)
                ),
                React.createElement("div", {},
                    React.createElement("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" } }, this.t('newVersion')),
                    React.createElement("div", { style: { fontSize: "16px", fontWeight: "bold", color: "#1DB954" } }, `v${remoteVersion}`)
                )
            ),
            React.createElement("p", { style: { fontSize: "12px", color: "rgba(255,255,255,0.5)" } },
                this.t('updateNotice')
            )
        );

        BdApi.UI.showConfirmationModal(
            this.t('updateTitle'),
            content,
            {
                confirmText: this.t('updateAction'),
                cancelText: this.t('updateLater'),
                onConfirm: () => {
                    const fs = require("fs");
                    const path = require("path");
                    const filename = `${this.meta.name}.plugin.js`;
                    const pluginPath = path.join(BdApi.Plugins.folder, filename);

                    fs.writeFile(pluginPath, code, "utf8", (err) => {
                        if (err) {
                            console.error(`[${this.meta.name}] Failed to write update:`, err);
                            BdApi.UI.showToast(`❌ Error: ${err.message}`, { type: "error" });
                            return;
                        }
                        BdApi.UI.showToast(`✨ ${this.t('updateSuccess').replace('{version}', remoteVersion)}`, { type: "success" });
                    });
                }
            }
        );
    }

    isNewerVersion(current, remote) {
        const c = current.split('.').map(Number);
        const r = remote.split('.').map(Number);
        for (let i = 0; i < Math.max(c.length, r.length); i++) {
            const cVal = c[i] || 0;
            const rVal = r[i] || 0;
            if (rVal > cVal) return true;
            if (cVal > rVal) return false;
        }
        return false;
    }

    checkChangelog() {
        try {
            const lastVersion = BdApi.Data.load('SolariManager', 'lastVersion');
            if (lastVersion && this.isNewerVersion(lastVersion, this.meta.version)) {
                const metaUrl = "https://raw.githubusercontent.com/TheDroidBR/Solari/main/plugins/plugins-meta.json";
                fetch(`${metaUrl}?t=${Date.now()}`)
                    .then(res => {
                        if (!res.ok) throw new Error("HTTP error " + res.status);
                        return res.json();
                    })
                    .then(data => {
                        const spotMeta = data.solarimanager;
                        if (spotMeta && spotMeta.changelog) {
                            const changelog = spotMeta.changelog;
                            const versionHeader = `### v${this.meta.version}`;
                            const idx = changelog.indexOf(versionHeader);
                            if (idx !== -1) {
                                const nextIdx = changelog.indexOf("###", idx + versionHeader.length);
                                const versionText = nextIdx !== -1 ? changelog.substring(idx, nextIdx) : changelog.substring(idx);
                                const lines = versionText.split("\n")
                                    .map(line => line.trim())
                                    .filter(line => line.startsWith("-"))
                                    .map(line => line.substring(1).trim());

                                if (lines.length > 0) {
                                    BdApi.UI.showChangelogModal({
                                        title: "Solari Manager",
                                        subtitle: `v${this.meta.version}`,
                                        blurb: this.t('updateSuccess').replace('{version}', this.meta.version),
                                        changes: [
                                            {
                                                title: this.t('changelogTitle'),
                                                type: "improved",
                                                items: lines
                                            }
                                        ]
                                    });
                                }
                            }
                        }
                    })
                    .catch(err => console.error('[SolariManager] Failed to show changelog:', err));
            }
            BdApi.Data.save('SolariManager', 'lastVersion', this.meta.version);
        } catch (e) {
            console.error('[SolariManager] Error in checkChangelog:', e);
        }
    }

    start() {
        console.log('[SolariManager] Starting...');
        this.loadConfig();
        this.checkChangelog();
        this.checkForUpdates();
        this.connectToServer();
    }

    stop() {
        console.log('[SolariManager] Stopping...');
        this.shouldReconnect = false;
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    // ---- WebSocket ----

    connectToServer() {
        this.shouldReconnect = true;
        try {
            this.ws = new WebSocket(this.config.serverUrl);

            this.ws.onopen = () => {
                console.log('[SolariManager] Connected to Solari App');
                this.safeShowToast(this.t('connectedToast'), { type: 'success' });

                // Identify ourselves and send BD version info
                const bdVersion = this._getBDVersion();
                this.send({ type: 'handshake', source: 'SolariManager', bdVersion });

                // Send full plugin list immediately
                this._sendPluginList();

                // Start heartbeat every 30 seconds
                if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
                this.heartbeatInterval = setInterval(() => {
                    this.send({ type: 'heartbeat', source: 'SolariManager', ts: Date.now() });
                }, 30000);
            };

            this.ws.onmessage = (e) => {
                try {
                    this.handleMessage(JSON.parse(e.data));
                } catch (err) {
                    console.error('[SolariManager] Message parse error:', err);
                }
            };

            this.ws.onclose = () => {
                console.log('[SolariManager] Disconnected from Solari');
                if (this.heartbeatInterval) {
                    clearInterval(this.heartbeatInterval);
                    this.heartbeatInterval = null;
                }
                if (this.shouldReconnect) {
                    setTimeout(() => this.connectToServer(), 5000);
                }
            };

            this.ws.onerror = (err) => {
                console.error('[SolariManager] WebSocket error:', err);
            };
        } catch (e) {
            console.error('[SolariManager] Connection error:', e);
            if (this.shouldReconnect) {
                setTimeout(() => this.connectToServer(), 5000);
            }
        }
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'plugin:toggle':
                this._togglePlugin(data.pluginName, data.enabled);
                break;
            case 'plugin:get_list':
                this._sendPluginList();
                break;
            case 'set_language':
                if (data.language && SolariManager.translations[data.language]) {
                    this.config.language = data.language;
                    this.saveConfig();
                }
                break;
        }
    }

    // ---- Plugin Management ----

    _getBDVersion() {
        try {
            // BdApi.version is available since BD 1.8.x
            return BdApi.version || 'unknown';
        } catch (e) {
            return 'unknown';
        }
    }

    _sendPluginList() {
        try {
            const all = BdApi.Plugins.getAll();
            const plugins = all.map(p => ({
                name: p.name || p.getName?.() || 'Unknown',
                version: p.version || p.getVersion?.() || '?',
                description: p.description || p.getDescription?.() || '',
                enabled: BdApi.Plugins.isEnabled(p.name || p.getName?.())
            }));
            this.send({ type: 'plugins_list', plugins });
        } catch (e) {
            console.error('[SolariManager] Error getting plugin list:', e);
        }
    }

    _togglePlugin(pluginName, enable) {
        try {
            if (pluginName === 'SolariManager') return; // never self-disable

            if (enable) {
                BdApi.Plugins.enable(pluginName);
                console.log(`[SolariManager] Enabled: ${pluginName}`);
                this.safeShowToast(`✅ ${this.t('pluginEnabled')}: ${pluginName}`, { type: 'success' });
            } else {
                BdApi.Plugins.disable(pluginName);
                console.log(`[SolariManager] Disabled: ${pluginName}`);
                this.safeShowToast(`🔴 ${this.t('pluginDisabled')}: ${pluginName}`, { type: 'warning' });
            }

            // Report updated list back to app
            setTimeout(() => this._sendPluginList(), 500);
        } catch (e) {
            console.error('[SolariManager] Toggle plugin error:', e);
        }
    }

    // ---- Helpers ----

    safeShowToast(message, options = {}) {
        try {
            if (BdApi.UI?.showToast) {
                BdApi.UI.showToast(message, options);
            } else if (typeof BdApi.showToast === 'function') {
                BdApi.showToast(message, options);
            }
        } catch (e) {
            console.log(`[SolariManager Toast] ${message}`);
        }
    }

    // ---- Settings Panel ----

    getSettingsPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            padding: 20px;
            font-family: 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #16162a 100%);
            border-radius: 12px;
            color: #e0e0ff;
        `;

        const isConnected = this.ws && this.ws.readyState === WebSocket.OPEN;
        const dotColor = isConnected ? '#4ade80' : '#f87171';
        const dotGlow = isConnected ? 'rgba(74,222,128,0.6)' : 'rgba(248,113,113,0.6)';
        const statusText = isConnected ? this.t('connected') : this.t('disconnected');

        // Get plugin list
        let pluginsHtml = `<p style="color:rgba(255,255,255,0.4);font-size:0.85em;">${this.t('noPlugins')}</p>`;
        try {
            const plugins = BdApi.Plugins.getAll();
            if (plugins.length > 0) {
                pluginsHtml = plugins.map(p => {
                    const name = p.name || p.getName?.() || 'Unknown';
                    const enabled = BdApi.Plugins.isEnabled(name);
                    const dotC = enabled ? '#4ade80' : '#6b7280';
                    return `
                        <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;
                            background:rgba(255,255,255,0.04);border-radius:8px;margin-bottom:6px;">
                            <span style="width:8px;height:8px;border-radius:50%;background:${dotC};flex-shrink:0;"></span>
                            <span style="flex:1;font-size:0.88em;">${name}</span>
                            <span style="font-size:0.75em;color:rgba(255,255,255,0.35);">v${p.version || p.getVersion?.() || '?'}</span>
                        </div>
                    `;
                }).join('');
            }
        } catch (e) { /* ignore */ }

        panel.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
                <div style="width:40px;height:40px;border-radius:10px;
                    background:linear-gradient(135deg,rgba(99,102,241,0.3),rgba(56,189,248,0.2));
                    display:flex;align-items:center;justify-content:center;font-size:20px;">🧩</div>
                <div>
                    <div style="font-weight:700;font-size:1.05rem;background:linear-gradient(135deg,#818cf8,#38bdf8);
                        -webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                        ${this.t('title')}
                    </div>
                    <div style="font-size:0.75em;color:rgba(255,255,255,0.35);margin-top:2px;">v${this.meta.version}</div>
                </div>
            </div>

            <!-- Status Row -->
            <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;
                background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;margin-bottom:16px;">
                <span style="font-size:0.85em;color:rgba(255,255,255,0.5);">${this.t('status')}:</span>
                <div style="width:8px;height:8px;border-radius:50%;background:${dotColor};
                    box-shadow:0 0 8px ${dotGlow};flex-shrink:0;"></div>
                <span style="font-size:0.88em;font-weight:600;color:${dotColor};">${statusText}</span>
            </div>

            <!-- Plugin List -->
            <div style="margin-bottom:16px;">
                <div style="font-size:0.8em;font-weight:600;color:rgba(255,255,255,0.4);
                    text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">
                    ${this.t('plugins')}
                </div>
                ${pluginsHtml}
            </div>

            <!-- Language -->
            <div style="display:flex;align-items:center;justify-content:space-between;
                padding:12px 16px;background:rgba(255,255,255,0.04);
                border:1px solid rgba(255,255,255,0.08);border-radius:10px;">
                <span style="font-size:0.85em;color:rgba(255,255,255,0.5);">${this.t('language')}</span>
                <select id="solari-manager-lang" style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.12);
                    color:#fff;padding:4px 10px;border-radius:6px;font-size:0.85em;cursor:pointer;">
                    <option value="en" ${this.config.language === 'en' ? 'selected' : ''}>English</option>
                    <option value="pt-BR" ${this.config.language === 'pt-BR' ? 'selected' : ''}>Português</option>
                </select>
            </div>
        `;

        // Language change handler
        setTimeout(() => {
            const langSelect = panel.querySelector('#solari-manager-lang');
            if (langSelect) {
                langSelect.addEventListener('change', (e) => {
                    this.config.language = e.target.value;
                    this.saveConfig();
                    this.send({ type: 'language_update', language: this.config.language });
                });
            }
        }, 0);

        return panel;
    }
};

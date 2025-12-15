/**
 * @name SmartAFKDetector
 * @author TheDroid
 * @authorLink https://solarirpc.com
 * @description Detects AFK and changes Discord status. ⚠️ LIMITATION: BetterDiscord plugins have limited AFK detection (only works while Discord is focused). For full system-wide AFK detection, use the Solari app!
 * @version 1.0.0
 * @source https://github.com/TheDroidBR/Solari
 * @website https://solarirpc.com
 * @updateUrl https://raw.githubusercontent.com/TheDroidBR/Solari/main/plugins/SmartAFKDetector.plugin.js
 */

module.exports = class SmartAFKDetector {
    // Translation strings
    static translations = {
        en: {
            title: 'SmartAFK Settings',
            solari: 'Solari',
            connected: 'Connected',
            disconnected: 'Disconnected',
            status: 'Status',
            active: 'Active',
            afkLevel: 'AFK Level',
            afkLevels: 'AFK Levels',
            afkLevelsHint: 'Configure multiple AFK levels with different times and status:',
            level: 'Level',
            minutes: 'min →',
            statusPlaceholder: 'Status text',
            addLevel: '+ Add Level',
            done: '💾 Done',
            savedSynced: '✓ Saved and synced!',
            language: 'Language',
            // Log messages
            returnedFromAFK: 'Returned from AFK',
            statusChangedTo: 'Status changed to:',
            customStatusChangedTo: 'Custom status changed to:',
            cleared: '(cleared)',
            systemActivityDetected: 'System activity detected (via Solari)',
            levelUp: 'Moved to Level',
            welcomeBack: 'SmartAFK: Welcome back!',
            errorModuleNotFound: 'Error: Status module not found.',
            // Connection logs
            connectedToSolari: 'Connected to Solari',
            connectedToSolariToast: 'SmartAFK: Connected to Solari!',
            disconnectedFromSolari: 'Disconnected from Solari',
            configUpdatedByApp: 'Config updated by App',
            configUpdatedToast: 'SmartAFK: Config Updated!'
        },
        'pt-BR': {
            title: 'SmartAFK Configurações',
            solari: 'Solari',
            connected: 'Conectado',
            disconnected: 'Desconectado',
            status: 'Status',
            active: 'Ativo',
            afkLevel: 'AFK Nível',
            afkLevels: 'Níveis de AFK',
            afkLevelsHint: 'Configure múltiplos níveis de AFK com diferentes tempos e status:',
            level: 'Nível',
            minutes: 'min →',
            statusPlaceholder: 'Texto do status',
            addLevel: '+ Adicionar Nível',
            done: '💾 Feito',
            savedSynced: '✓ Salvo e sincronizado!',
            language: 'Idioma',
            // Log messages
            returnedFromAFK: 'Voltou do AFK',
            statusChangedTo: 'Status alterado para:',
            customStatusChangedTo: 'Custom status alterado para:',
            cleared: '(limpo)',
            systemActivityDetected: 'Atividade do sistema detectada (via Solari)',
            levelUp: 'Subiu para Nível',
            welcomeBack: 'SmartAFK: Bem-vindo de volta!',
            errorModuleNotFound: 'Erro: Módulo de status não encontrado.',
            // Connection logs
            connectedToSolari: 'Conectado ao Solari',
            connectedToSolariToast: 'SmartAFK: Conectado ao Solari!',
            disconnectedFromSolari: 'Desconectado do Solari',
            configUpdatedByApp: 'Configurações atualizadas pelo App',
            configUpdatedToast: 'SmartAFK: Config Atualizada!'
        }
    };

    constructor(meta) {
        this.meta = meta;
        this.ws = null;
        this.idleTimer = null;
        this.isAFK = false;
        this.currentTierIndex = -1; // Which tier is currently active (-1 = none)
        this.lastActivity = Date.now();
        this.useSolariAFK = false; // When true, use Solari's system-wide detection instead of local

        this.config = {
            enabled: true,
            language: 'en', // 'en' or 'pt-BR'
            // Multiple AFK tiers - sorted by minutes ascending
            afkTiers: [
                { minutes: 5, status: "Ausente" }
            ],
            serverUrl: "ws://localhost:6464"
        };

        // For backwards compatibility - first tier's minutes
        this.config.timeoutMinutes = this.config.afkTiers[0]?.minutes || 5;
        this.config.afkStatusText = this.config.afkTiers[0]?.status || "Ausente";

        this.logs = [];
    }

    // Get translation for current language
    t(key) {
        const lang = this.config.language || 'en';
        return SmartAFKDetector.translations[lang]?.[key] || SmartAFKDetector.translations['en'][key] || key;
    }

    // Load saved config from BetterDiscord data storage
    loadConfig() {
        try {
            const savedConfig = BdApi.Data.load("SmartAFKDetector", "config");
            if (savedConfig) {
                this.config = { ...this.config, ...savedConfig };
                // Ensure tiers are sorted by minutes ascending
                if (this.config.afkTiers && this.config.afkTiers.length > 0) {
                    this.config.afkTiers.sort((a, b) => a.minutes - b.minutes);
                }
                console.log("[SmartAFK] Loaded saved config:", this.config.afkTiers?.length || 1, "tiers");
            }
        } catch (e) {
            console.error("[SmartAFK] Error loading config:", e);
        }
    }

    // Save current config to BetterDiscord data storage
    saveConfig() {
        try {
            BdApi.Data.save("SmartAFKDetector", "config", {
                enabled: this.config.enabled,
                language: this.config.language,
                afkTiers: this.config.afkTiers,
                timeoutMinutes: this.config.timeoutMinutes,
                afkStatusText: this.config.afkStatusText
            });
            console.log("[SmartAFK] Config saved:", this.config.afkTiers?.length || 1, "tiers");
        } catch (e) {
            console.error("[SmartAFK] Error saving config:", e);
        }
    }

    start() {
        console.log("[SmartAFK] Starting...");
        this.loadConfig(); // Load saved config first

        // CRITICAL: Add beforeunload listener to reset status before Discord closes
        // This ensures that if the plugin sets AFK during shutdown, we correct it
        this.beforeUnloadHandler = () => {
            console.log("[SmartAFK] beforeunload triggered - resetting status to online");
            this.isAFK = false;
            this.currentTierIndex = -1;
            this.setStatus('online');
            this.setCustomStatus(null);
        };
        window.addEventListener('beforeunload', this.beforeUnloadHandler);

        this.connectToServer();
        this.attachListeners();
        this.startIdleCheck();
    }

    stop() {
        console.log("[SmartAFK] Stopping...");

        // Remove beforeunload listener
        if (this.beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this.beforeUnloadHandler);
        }

        this.detachListeners();
        if (this.idleTimer) clearInterval(this.idleTimer);
        if (this.ws) this.ws.close();
        this.returnFromAFK();
    }

    // Helper for safe toasts
    safeShowToast(message, options = {}) {
        try {
            if (typeof BdApi.showToast === "function") {
                BdApi.showToast(message, options);
            } else if (BdApi.UI && typeof BdApi.UI.showToast === "function") {
                BdApi.UI.showToast(message, options);
            } else {
                console.log(`[SmartAFK Toast] ${message}`);
            }
        } catch (e) {
            console.error("[SmartAFK] Toast error:", e);
        }
    }

    // --- Communication ---
    connectToServer() {
        try {
            this.ws = new WebSocket(this.config.serverUrl);
            this.ws.onopen = () => {
                this.safeShowToast(this.t('connectedToSolariToast'), { type: "success" });
                this.log(this.t('connectedToSolari'));
                this.send({ type: 'handshake', source: 'SmartAFKDetector' });
                // Send current config to Solari
                this.sendConfig();
            };
            this.ws.onmessage = (e) => this.handleMessage(JSON.parse(e.data));
            this.ws.onclose = () => {
                this.log(this.t('disconnectedFromSolari'));
                this.useSolariAFK = false; // Reset connection indicator
                setTimeout(() => this.connectToServer(), 5000);
            };
            this.ws.onerror = (err) => console.error("[SmartAFK] WebSocket Error:", err);
        } catch (e) {
            console.error("[SmartAFK] Connection error:", e);
        }
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    sendConfig() {
        // Send current config to Solari so it can update its UI
        const configToSend = {
            enabled: this.config.enabled,
            timeoutMinutes: this.config.timeoutMinutes,
            afkStatusText: this.config.afkStatusText,
            afkTiers: this.config.afkTiers
        };
        console.log("[SmartAFK] Sending config to Solari:", configToSend.afkTiers?.length || 0, "tiers");
        this.send({
            type: 'afk_config',
            config: configToSend
        });
    }

    handleMessage(data) {
        if (data.type === 'update_afk_settings') {
            this.config = { ...this.config, ...data.settings };
            // Ensure tiers are sorted by minutes ascending
            if (this.config.afkTiers && this.config.afkTiers.length > 0) {
                this.config.afkTiers.sort((a, b) => a.minutes - b.minutes);
            }
            this.saveConfig(); // Persist to BetterDiscord data storage
            this.log(this.t('configUpdatedByApp'));
            this.safeShowToast(this.t('configUpdatedToast'), { type: "info" });
            // Send updated config back to confirm sync
            this.sendConfig();
        } else if (data.type === 'set_language') {
            // Language sync from Solari
            if (data.language && SmartAFKDetector.translations[data.language]) {
                this.config.language = data.language;
                this.saveConfig();
                console.log(`[SmartAFK] Language synced from Solari: ${data.language}`);
            }
        } else if (data.type === 'show_toast') {
            this.safeShowToast(data.message, { type: data.toastType || "info" });
        } else if (data.type === 'system_idle_update') {
            // Solari is providing system-wide AFK detection - use it!
            this.useSolariAFK = true;

            const idleMinutes = data.idleMinutes;
            console.log(`[SmartAFK] System idle update: ${idleMinutes.toFixed(1)} min`);

            // Find the highest tier that should be active based on idle time
            const newTierIndex = this.findActiveTier(idleMinutes);

            if (newTierIndex >= 0) {
                // Should be in some AFK tier
                if (!this.isAFK) {
                    // First time entering AFK
                    this.currentTierIndex = newTierIndex;
                    const tier = this.config.afkTiers[newTierIndex];
                    this.log(`${this.t('levelUp')} ${newTierIndex + 1}: ${tier.status} (${tier.minutes} min)`);
                    this.goAFKWithTier(newTierIndex);
                    this.lastStatusRenewal = Date.now();
                } else if (newTierIndex > this.currentTierIndex) {
                    // Upgrading to a higher tier
                    this.currentTierIndex = newTierIndex;
                    const tier = this.config.afkTiers[newTierIndex];
                    this.log(`${this.t('levelUp')} ${newTierIndex + 1}: ${tier.status} (${tier.minutes} min)`);
                    this.applyTierStatus(newTierIndex);
                    this.lastStatusRenewal = Date.now();
                } else {
                    // Same tier - renew status every 5 seconds to prevent 5-min expiration
                    // This ensures status stays alive while PC is on, but expires if PC shuts down
                    if (!this.lastStatusRenewal || Date.now() - this.lastStatusRenewal > 5000) {
                        const tier = this.config.afkTiers[this.currentTierIndex];
                        console.log(`[SmartAFK] Renewing status for tier ${this.currentTierIndex + 1}`);
                        this.setCustomStatus(tier.status);
                        this.lastStatusRenewal = Date.now();
                    }
                }
            } else {
                // Not in any AFK tier - user is active
                if (this.isAFK) {
                    this.lastActivity = Date.now();
                    this.log(this.t('systemActivityDetected'));
                    this.returnFromAFK();
                } else {
                    this.lastActivity = Date.now();
                }
            }
        }
    }

    // --- Idle Logic ---
    attachListeners() {
        this.activityHandler = () => {
            this.lastActivity = Date.now();

            // If Solari is providing system-wide AFK detection, don't return from AFK based on local events
            // Only Solari should control AFK state when connected
            if (this.useSolariAFK) {
                return; // Let Solari handle AFK detection
            }

            // Fallback: local detection only when Solari is not connected
            if (this.isAFK) {
                console.log("[SmartAFK] Local activity detected! Returning from AFK...");
                this.returnFromAFK();
            }
        };

        // Track all types of user activity within Discord
        document.addEventListener('mousemove', this.activityHandler);
        document.addEventListener('keydown', this.activityHandler);
        document.addEventListener('keyup', this.activityHandler);
        document.addEventListener('mousedown', this.activityHandler);
        document.addEventListener('mouseup', this.activityHandler);
        document.addEventListener('click', this.activityHandler);
        document.addEventListener('scroll', this.activityHandler, true); // capture scroll in all elements
        document.addEventListener('wheel', this.activityHandler);
        document.addEventListener('touchstart', this.activityHandler);
        document.addEventListener('touchmove', this.activityHandler);

        console.log("[SmartAFK] Activity listeners attached");
    }

    detachListeners() {
        if (this.activityHandler) {
            document.removeEventListener('mousemove', this.activityHandler);
            document.removeEventListener('keydown', this.activityHandler);
            document.removeEventListener('keyup', this.activityHandler);
            document.removeEventListener('mousedown', this.activityHandler);
            document.removeEventListener('mouseup', this.activityHandler);
            document.removeEventListener('click', this.activityHandler);
            document.removeEventListener('scroll', this.activityHandler, true);
            document.removeEventListener('wheel', this.activityHandler);
            document.removeEventListener('touchstart', this.activityHandler);
            document.removeEventListener('touchmove', this.activityHandler);
        }
        console.log("[SmartAFK] Activity listeners detached");
    }

    startIdleCheck() {
        // Check every 5 seconds for more responsive AFK detection
        this.idleTimer = setInterval(() => {
            if (!this.config.enabled) return;
            if (this.isAFK) return; // Already AFK, no need to check

            // If Solari is handling system-wide AFK, skip local check entirely
            if (this.useSolariAFK) return;

            const idleTimeMs = Date.now() - this.lastActivity;
            const idleTimeMinutes = idleTimeMs / 60000;
            const timeoutMinutes = this.config.timeoutMinutes;

            // Log progress every minute (for debugging)
            if (Math.floor(idleTimeMinutes) !== Math.floor((idleTimeMs - 5000) / 60000)) {
                console.log(`[SmartAFK] Idle for ${idleTimeMinutes.toFixed(1)} min (timeout: ${timeoutMinutes} min)`);
            }

            if (idleTimeMinutes >= timeoutMinutes) {
                console.log(`[SmartAFK] Timeout reached! Going AFK after ${idleTimeMinutes.toFixed(1)} minutes of inactivity`);
                this.goAFK();
            }
        }, 5000); // Check every 5 seconds

        console.log(`[SmartAFK] Idle check started (timeout: ${this.config.timeoutMinutes} min)`);
    }

    // --- AFK Tier Helpers ---
    findActiveTier(idleMinutes) {
        // Find the highest tier that has been reached
        // Tiers should be sorted by minutes ascending
        const tiers = this.config.afkTiers || [];
        let activeTierIndex = -1;

        for (let i = 0; i < tiers.length; i++) {
            if (idleMinutes >= tiers[i].minutes) {
                activeTierIndex = i;
            }
        }

        return activeTierIndex;
    }

    goAFKWithTier(tierIndex) {
        this.isAFK = true;
        this.currentTierIndex = tierIndex;

        const tier = this.config.afkTiers[tierIndex];
        if (!tier) return;

        // 1. Set Status to Idle (Yellow)
        this.setStatus('idle');

        // 2. Set Custom Status Text from tier
        this.setCustomStatus(tier.status);

        this.send({ type: 'afk_status_change', isAFK: true, tier: tierIndex + 1, status: tier.status });
        this.safeShowToast(`SmartAFK: Nível ${tierIndex + 1} - ${tier.status}`, { type: "warning" });
    }

    applyTierStatus(tierIndex) {
        const tier = this.config.afkTiers[tierIndex];
        if (!tier) return;

        // Update custom status to the new tier's status
        this.setCustomStatus(tier.status);

        this.send({ type: 'afk_tier_change', tier: tierIndex + 1, status: tier.status });
        this.safeShowToast(`SmartAFK: ${this.t('levelUp')} ${tierIndex + 1} - ${tier.status}`, { type: "warning" });
    }

    // --- AFK Actions ---
    goAFK() {
        // Legacy method - use first tier
        this.goAFKWithTier(0);
    }

    returnFromAFK() {
        if (!this.isAFK) return;

        this.isAFK = false;
        this.currentTierIndex = -1;
        this.log(this.t('returnedFromAFK'));

        // 1. Restore Status to Online (Green)
        this.setStatus('online');

        // 2. Clear Custom Status
        this.setCustomStatus(null);

        this.send({ type: 'afk_status_change', isAFK: false });
        this.safeShowToast(this.t('welcomeBack'), { type: "success" });
    }

    // --- Discord Internal API Helpers ---
    // Get module references (cached for performance)
    getUserSettingsProtoUtils() {
        if (!this._userSettingsProtoUtils) {
            this._userSettingsProtoUtils = BdApi.Webpack.getModule(
                (m) => m.ProtoClass && m.ProtoClass.typeName.endsWith(".PreloadedUserSettings"),
                { first: true, searchExports: true }
            );
        }
        return this._userSettingsProtoUtils;
    }

    setStatus(status) {
        try {
            console.log("[SmartAFK] Attempting to set status to:", status);

            const UserSettingsProtoUtils = this.getUserSettingsProtoUtils();

            if (UserSettingsProtoUtils && UserSettingsProtoUtils.updateAsync) {
                console.log("[SmartAFK] Using UserSettingsProtoUtils.updateAsync");
                UserSettingsProtoUtils.updateAsync(
                    "status",
                    (statusSetting) => {
                        console.log("[SmartAFK] Current statusSetting:", statusSetting);
                        statusSetting.status.value = status;
                    },
                    0
                );
                this.log(`${this.t('statusChangedTo')} ${status}`);
                return true;
            }

            console.error("[SmartAFK] UserSettingsProtoUtils not found!");
            this.safeShowToast(this.t('errorModuleNotFound'), { type: "error" });
            return false;
        } catch (e) {
            console.error("[SmartAFK] setStatus error:", e);
            return false;
        }
    }

    setCustomStatus(text) {
        try {
            console.log("[SmartAFK] Attempting to set custom status to:", text);

            const UserSettingsProtoUtils = this.getUserSettingsProtoUtils();

            if (UserSettingsProtoUtils && UserSettingsProtoUtils.updateAsync) {
                console.log("[SmartAFK] Using UserSettingsProtoUtils for custom status");
                UserSettingsProtoUtils.updateAsync(
                    "status",
                    (statusSetting) => {
                        if (text) {
                            // Set expiration to 5 minutes from now
                            // This ensures if plugin stops (PC shutdown), status auto-clears
                            // The status is renewed periodically while AFK to stay alive
                            const expirationMs = Date.now() + (5 * 60 * 1000); // 5 minutes
                            statusSetting.customStatus = {
                                text: text,
                                expiresAtMs: expirationMs.toString(), // Discord expects string
                                emojiId: null,
                                emojiName: null
                            };
                            console.log(`[SmartAFK] Custom status set, expires at: ${new Date(expirationMs).toLocaleTimeString()}`);
                        } else {
                            statusSetting.customStatus = null;
                        }
                    },
                    0
                );
                this.log(`${this.t('customStatusChangedTo')} ${text || this.t('cleared')}`);
                return true;
            }

            console.error("[SmartAFK] UserSettingsProtoUtils not found for custom status!");
            return false;
        } catch (e) {
            console.error("[SmartAFK] setCustomStatus error:", e);
            return false;
        }
    }

    // --- Logging ---
    log(message) {
        const entry = { time: new Date().toLocaleTimeString(), message };
        this.logs.unshift(entry);
        if (this.logs.length > 50) this.logs.pop();

        this.send({ type: 'afk_logs', logs: this.logs });
        console.log(`[SmartAFK] ${message}`);
    }

    // --- Settings Panel (for BetterDiscord) ---
    getSettingsPanel() {
        const panel = document.createElement("div");
        panel.style.cssText = "padding: 20px; font-family: 'Segoe UI', 'Roboto', sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px;";

        const renderPanel = () => {
            const tiersHtml = this.config.afkTiers.map((tier, index) => `
                <div class="tier-row" data-index="${index}" style="display: flex; gap: 12px; margin-bottom: 10px; padding: 14px 16px; background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; align-items: center; transition: all 0.2s;">
                    <span style="background: linear-gradient(135deg, #ff9966 0%, #ff5e62 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700; min-width: 65px; font-size: 0.95em;">${this.t('level')} ${index + 1}</span>
                    <input type="number" class="tier-minutes" value="${tier.minutes}" min="1" max="120" style="width: 55px; padding: 8px 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.9em; text-align: center;" placeholder="Min">
                    <span style="color: rgba(255,255,255,0.4); font-size: 0.85em;">${this.t('minutes')}</span>
                    <input type="text" class="tier-status" value="${tier.status}" style="flex: 1; padding: 8px 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.9em;" placeholder="${this.t('statusPlaceholder')}">
                    <button class="remove-tier" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 1em; transition: all 0.2s; ${this.config.afkTiers.length <= 1 ? 'opacity: 0.3; cursor: not-allowed;' : ''}">✕</button>
                </div>
            `).join('');

            panel.innerHTML = `
                <style>
                    .smartafk-card {
                        background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%);
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 10px;
                        padding: 14px 18px;
                        transition: all 0.2s ease;
                    }
                    .smartafk-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
                    .tier-row:hover { background: rgba(255,255,255,0.08) !important; }
                    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                    .lang-select { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; padding: 6px 10px; font-size: 0.85em; cursor: pointer; }
                </style>
                
                <!-- Header with Language Selector -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #fff; margin: 0; font-size: 1.4em; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.2em;">🌙</span> ${this.t('title')}
                    </h2>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: rgba(255,255,255,0.5); font-size: 0.8em;">🌐 ${this.t('language')}:</span>
                        <select id="lang-select" class="lang-select">
                            <option value="en" ${this.config.language === 'en' ? 'selected' : ''}>English</option>
                            <option value="pt-BR" ${this.config.language === 'pt-BR' ? 'selected' : ''}>Português</option>
                        </select>
                    </div>
                </div>

                <!-- Status Cards -->
                <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                    <!-- Connection Status -->
                    <div class="smartafk-card" style="flex: 1; display: flex; align-items: center; gap: 12px; border-color: ${this.useSolariAFK ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}; background: linear-gradient(135deg, rgba(${this.useSolariAFK ? '74,222,128' : '239,68,68'},0.12) 0%, rgba(${this.useSolariAFK ? '74,222,128' : '239,68,68'},0.03) 100%);">
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${this.useSolariAFK ? '#4ade80' : '#ef4444'}; box-shadow: 0 0 8px ${this.useSolariAFK ? '#4ade80' : '#ef4444'}; ${this.useSolariAFK ? 'animation: pulse 2s infinite;' : ''}"></div>
                        <div>
                            <div style="color: rgba(255,255,255,0.5); font-size: 0.7em; text-transform: uppercase; letter-spacing: 0.5px;">${this.t('solari')}</div>
                            <div style="color: ${this.useSolariAFK ? '#4ade80' : '#ef4444'}; font-weight: 600; font-size: 0.9em;">${this.useSolariAFK ? this.t('connected') : this.t('disconnected')}</div>
                        </div>
                    </div>
                    <!-- AFK Status -->
                    <div class="smartafk-card" style="flex: 1; display: flex; align-items: center; gap: 12px; border-color: ${this.isAFK ? 'rgba(255,189,46,0.3)' : 'rgba(74,222,128,0.3)'}; background: linear-gradient(135deg, rgba(${this.isAFK ? '255,189,46' : '74,222,128'},0.12) 0%, rgba(${this.isAFK ? '255,189,46' : '74,222,128'},0.03) 100%);">
                        <span style="font-size: 1.3em;">${this.isAFK ? '💤' : '🟢'}</span>
                        <div>
                            <div style="color: rgba(255,255,255,0.5); font-size: 0.7em; text-transform: uppercase; letter-spacing: 0.5px;">${this.t('status')}</div>
                            <div style="color: ${this.isAFK ? '#ffbd2e' : '#4ade80'}; font-weight: 600; font-size: 0.9em;">${this.isAFK ? `${this.t('afkLevel')} ${this.currentTierIndex + 1}` : this.t('active')}</div>
                        </div>
                    </div>
                </div>

                <!-- Tiers Section -->
                <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 18px; border: 1px solid rgba(255,255,255,0.05);">
                    <h3 style="color: #fff; margin: 0 0 8px 0; font-size: 1em; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                        <span>📊</span> ${this.t('afkLevels')}
                    </h3>
                    <p style="color: rgba(255,255,255,0.5); font-size: 0.8em; margin: 0 0 16px 0;">${this.t('afkLevelsHint')}</p>
                    
                    <div id="tiers-container">
                        ${tiersHtml}
                    </div>
                    
                    <div style="display: flex; gap: 12px; margin-top: 16px;">
                        <button id="add-tier" class="smartafk-btn" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9em; transition: all 0.2s;">${this.t('addLevel')}</button>
                        <button id="save-tiers" class="smartafk-btn" style="background: linear-gradient(135deg, #5865F2 0%, #4752C4 100%); color: white; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9em; transition: all 0.2s; margin-left: auto;">${this.t('done')}</button>
                    </div>
                    <p id="save-status" style="color: #4ade80; margin: 12px 0 0 0; font-size: 0.85em; display: none;">${this.t('savedSynced')}</p>
                </div>
            `;
            // Helper to collect current tier values from panel inputs
            const collectCurrentValues = () => {
                const rows = panel.querySelectorAll(".tier-row");
                rows.forEach((row, index) => {
                    if (this.config.afkTiers[index]) {
                        this.config.afkTiers[index].minutes = parseInt(row.querySelector(".tier-minutes").value) || 5;
                        this.config.afkTiers[index].status = row.querySelector(".tier-status").value || "Ausente";
                    }
                });
            };

            // Add tier button
            panel.querySelector("#add-tier").addEventListener("click", () => {
                // Save current values before adding
                collectCurrentValues();

                const lastTier = this.config.afkTiers[this.config.afkTiers.length - 1];
                this.config.afkTiers.push({
                    minutes: (lastTier?.minutes || 5) + 5,
                    status: `AFK Nível ${this.config.afkTiers.length + 1}`
                });
                renderPanel();
            });

            // Remove tier buttons
            panel.querySelectorAll(".remove-tier").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    if (this.config.afkTiers.length <= 1) return;
                    // Save current values before removing
                    collectCurrentValues();

                    const index = parseInt(e.target.closest(".tier-row").dataset.index);
                    this.config.afkTiers.splice(index, 1);
                    renderPanel();
                });
            });

            // Save button
            panel.querySelector("#save-tiers").addEventListener("click", () => {
                // Collect all tier values
                const rows = panel.querySelectorAll(".tier-row");
                const newTiers = [];
                rows.forEach(row => {
                    const minutes = parseInt(row.querySelector(".tier-minutes").value) || 5;
                    const status = row.querySelector(".tier-status").value || "Ausente";
                    newTiers.push({ minutes, status });
                });

                // Sort by minutes ascending
                newTiers.sort((a, b) => a.minutes - b.minutes);
                this.config.afkTiers = newTiers;

                // Update legacy fields for compatibility
                this.config.timeoutMinutes = newTiers[0]?.minutes || 5;
                this.config.afkStatusText = newTiers[0]?.status || "Ausente";

                // Save to persistent storage
                this.saveConfig();

                // Sync with Solari
                this.sendConfig();

                panel.querySelector("#save-status").style.display = "block";
                setTimeout(() => {
                    panel.querySelector("#save-status").style.display = "none";
                }, 2000);

                this.safeShowToast("Configurações salvas e sincronizadas!", { type: "success" });
                renderPanel(); // Re-render to show sorted order
            });

            // Language selector
            panel.querySelector("#lang-select").addEventListener("change", (e) => {
                this.config.language = e.target.value;
                this.saveConfig();
                renderPanel(); // Re-render with new language
            });
        };

        renderPanel();
        return panel;
    }
};

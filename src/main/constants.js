/**
 * Solari - Constants
 * Centralized configuration values
 * 
 * v1.10: All magic numbers extracted here for maintainability.
 */

const APP_VERSION = require('../../package.json').version;

module.exports = {
    // App Identity
    APP_VERSION,
    APP_USER_AGENT: `Solari/${APP_VERSION}`,

    // WebSocket Server
    WS_HOST: '127.0.0.1',
    WS_PORT: 6464,

    // Data Storage
    DATA_FILENAME: 'customrp-data.json',
    SAVE_DEBOUNCE_MS: 500, // Trailing debounce for disk writes

    // Debug Logs
    MAX_LOGS: 500,
    LOG_INTERVAL_CHECKS: 6, // Log every 6th check (every 30 seconds at 5s interval)
    DEBUG_MODE: false, // Master debug flag (development only)

    // Granular Debug Flags (v1.10 — only active when DEBUG_MODE is true)
    DEBUG_RPC: false,        // RPC connection & activity logging
    DEBUG_WS: false,         // WebSocket message logging
    DEBUG_AUTODETECT: false, // Process/website detection logging
    DEBUG_HW: false,         // Hardware monitor logging

    // Process Detection
    PROCESS_CHECK_INTERVAL_MS: 2000,
    AFK_CHECK_INTERVAL_MS: 3000,
    MAX_PROCESS_CHECK_ERRORS: 3,
    BACKOFF_DURATION_MS: 30000,
    PROCESS_TIMEOUT_MS: 5000,
    EXEC_MAX_BUFFER: 1024 * 1024, // 1MB max buffer for exec calls

    // RPC Connection
    RPC_RETRY_DELAY_MS: 3000,
    RPC_SWITCH_MAX_ATTEMPTS: 300, // Max attempts for switchRpcClient (~5 min at 1s, ~25 min at 5s)
    RPC_LONG_RETRY_DELAY_MS: 10000,
    RPC_HEALTH_CHECK_INTERVAL_MS: 5000,
    ACTIVITY_UPDATE_DEBOUNCE_MS: 300,
    PRESENCE_UPDATE_THROTTLE_MS: 100, // Leading-edge throttle for cascading updatePresence calls
    SWITCH_LOGIN_TIMEOUT_MS: 10000, // Timeout for switchRpcClient login attempts

    // Startup Delays
    AUTO_DETECT_STARTUP_DELAY_MS: 3000,
    CONSOLE_HIDE_DELAY_MS: 500,
    RPC_READY_RESTORE_DELAY_MS: 2000, // Wait before restoring activity after RPC ready

    // Discord API
    DISCORD_API_TIMEOUT_MS: 5000,

    // BetterDiscord Auto-Repair
    BD_POLL_INTERVAL_MS: 5000, // Status check polling interval (v1.10: was 3s)
    BD_BROKEN_THRESHOLD: 3,    // Consecutive broken detections before repair
    BD_REPAIR_COOLDOWN_MS: 120000, // 2-minute cooldown between repairs
    BD_REPAIR_WINDOW_MS: 600000,   // 10-minute sliding window
    BD_MAX_REPAIRS_WINDOW: 3,      // Max repairs in the window

    // Browser Extension
    EXTENSION_CLEAR_DEBOUNCE_MS: 1000, // Grace period before clearing extension presence
    EXTENSION_DISCONNECT_TIMEOUT_MS: 3000, // Wait before clearing presence on WS disconnect

    // Hardware Monitor
    HW_GPU_POLL_INTERVAL_MS: 6000, // GPU sampling interval (nvidia-smi is expensive)
    HW_RPC_THROTTLE_MS: 5500, // Min interval between HW-triggered RPC updates

    // Website Detection
    WEBSITE_FAIL_THRESHOLD: 3, // Consecutive failures before clearing website presence

    // SoundBoard
    SOUNDBOARD_DEFAULT_PORT: 6465,

    // Auto-Updater URLs (electron-updater Generic Provider)
    UPDATE_URL_PRIMARY: 'https://github.com/TheDroidBR/Solari/releases/latest/download',
    UPDATE_URL_FALLBACK: 'https://gitlab.com/TheDroidBR/solari/-/raw/main/',

    // Default Values
    DEFAULT_ACTIVITY_TYPE: 0, // Playing
    DEFAULT_THEME: 'default',
    DEFAULT_LANGUAGE: 'en',

    // Priority Defaults
    PRIORITY_DEFAULTS: {
        autoDetect: 1,
        manualPreset: 2,
        defaultFallback: 3
    }
};

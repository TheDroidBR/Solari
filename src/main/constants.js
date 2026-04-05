/**
 * Solari - Constants
 * Centralized configuration values
 */

module.exports = {
    // WebSocket Server
    WS_HOST: '127.0.0.1',
    WS_PORT: 6464,

    // Data Storage
    DATA_FILENAME: 'customrp-data.json',

    // Debug Logs
    MAX_LOGS: 500,
    LOG_INTERVAL_CHECKS: 6, // Log every 6th check (every 30 seconds at 5s interval)
    DEBUG_MODE: false, // Set to true for verbose logging (development only)

    // Process Detection
    PROCESS_CHECK_INTERVAL_MS: 2000,
    AFK_CHECK_INTERVAL_MS: 3000,
    MAX_PROCESS_CHECK_ERRORS: 3,
    BACKOFF_DURATION_MS: 30000,
    PROCESS_TIMEOUT_MS: 5000,

    // RPC Connection
    RPC_RETRY_DELAY_MS: 3000,
    RPC_SWITCH_MAX_ATTEMPTS: 300, // Max attempts for switchRpcClient (~5 min at 1s, ~25 min at 5s)
    RPC_LONG_RETRY_DELAY_MS: 10000,
    ACTIVITY_UPDATE_DEBOUNCE_MS: 300,

    // Startup Delays
    AUTO_DETECT_STARTUP_DELAY_MS: 3000,
    CONSOLE_HIDE_DELAY_MS: 500,

    // Discord API
    DISCORD_API_TIMEOUT_MS: 5000,

    // Auto-Updater URLs (electron-updater Generic Provider)
    // Primary: GitHub releases (change this URL when account is resolved)
    UPDATE_URL_PRIMARY: 'https://github.com/TheDroidBR/Solari/releases/latest/download',
    // Fallback: GitLab releases (always available - point to RAW main branch)
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

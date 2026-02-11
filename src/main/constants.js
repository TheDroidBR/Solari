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
    RPC_MAX_ATTEMPTS: 999999, // Effectively infinite - never give up
    RPC_LONG_RETRY_DELAY_MS: 10000,
    ACTIVITY_UPDATE_DEBOUNCE_MS: 300,

    // Startup Delays
    AUTO_DETECT_STARTUP_DELAY_MS: 3000,
    CONSOLE_HIDE_DELAY_MS: 500,

    // Discord API
    DISCORD_API_TIMEOUT_MS: 5000,

    // GitHub API
    GITHUB_RELEASES_PATH: '/repos/TheDroidBR/Solari/releases/latest',

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

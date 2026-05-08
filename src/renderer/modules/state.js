/**
 * Solari - Renderer Shared State
 *
 * A single mutable object that holds all UI state shared between
 * renderer modules. Modules import this object and mutate its
 * properties directly — JavaScript passes objects by reference.
 *
 * This eliminates the need to declare global `let` variables at
 * the top of renderer.js and thread them through function parameters.
 *
 * @module state
 */

'use strict';

const state = {
    // ── Plugin connections ──────────────────────────────────────────────────
    connectedPlugins: [],
    blockedPlugins: [],
    selectedPlugin: null,

    // ── Identities ──────────────────────────────────────────────────────────
    identities: [],

    // ── App settings (mirrored from main) ───────────────────────────────────
    appSettings: {},

    // ── i18n ────────────────────────────────────────────────────────────────
    /** Flag set to true while a language change is in progress. */
    isSyncingLanguage: false,
    languageSyncTimeout: null,

    // ── AFK ─────────────────────────────────────────────────────────────────
    afkTiers: [{ minutes: 5, status: 'Away' }],
    afkDisabledPresets: [],
    lastAfkSaveTime: 0,

    // ── Spotify ──────────────────────────────────────────────────────────────
    spotifyConnected: false,

    // ── Plugin connection tracking ────────────────────────────────────────────
    /** True after SmartAFK plugin has established WS connection. */
    smartAfkConnected: false,
    /** True when Discord RPC is actually connected (from main process). */
    isRpcActuallyConnected: false,

    // ── SoundBoard ───────────────────────────────────────────────────────────
    vbCableDriverInstalled: false,

    // ── Misc ─────────────────────────────────────────────────────────────────
    showTrash: false,
};

module.exports = state;

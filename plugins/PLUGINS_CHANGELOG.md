# Plugins Changelog

## SolariNotes v1.0.1 (2026-03-24)
- 🛡️ **Critical Fix: Discord UI Crash**: Relocated panel injection from `#app-mount` to `document.body`. This prevents a React 18 rendering conflict that caused the Discord interface to "cut off" and show black areas when opening user profiles.
- 🎯 **Fixed Icon Injection**: Updated toolbar selectors to be more specific, preventing the notes icon from accidentally injecting itself into user profile modals.

## SolariNotes v1.0.0 (2026-03-22)
- 🚀 **Initial Release**: A sleek, synchronized notepad integrated directly into the Discord toolbar.
- 💾 **Local Sync**: Automatically saves notes to your PC via the Solari Desktop App.
- 🪟 **Multi-Window Support**: Ability to "tear off" tabs into independent floating windows.
- 🎨 **Glassmorphism UI**: Premium design with customizable blur, opacity, and accent colors.

## Solari MessageTools v1.0.0 (2026-03-22)
- 🚀 **Initial Release**: Power-user utilities for Discord messaging.
- ⌨️ **Text Macros**: Support for 25+ advanced commands and custom snippets.
- 🚫 **Anti-Typing**: Option to hide your "typing..." status from others.
- 📝 **Quick Edit & Reveal**: Enhanced message editing and deletion awareness.

## SpotifySync v2.1.3 (2026-03-19)
- 🔒 **Critical Fix: Token Amnesia**: The plugin now completely ignores Auth sync payloads pushed from the Solari Desktop App to prevent Discord from overwriting its valid tokens with empty ones on PC startup.
- 🛡️ **Critical Fix: Race Condition**: Wrapped the `refresh_token` Spotify Web API OAuth flow inside a JavaScript Promise Mutex. This prevents concurrent background routines (like lyrics fetchers and status pollers) from firing duplicate refresh requests at the exact millisecond the 1-hour token expires. Duplicate requests previously caused Spotify to return an `invalid_grant` error, forcing the plugin to falsely assume access was revoked and wiping your perfectly valid login keys from disk. Your Premium connection is now immortal.

## SpotifySync v2.1.2 (2026-03-18)
- ⚡ **Play/Pause Responsiveness**: Reduced internal debounce from 800ms to 400ms for snappier playback controls.
- 💾 **Connection Persistence**: Added "Safe Merge" logic to prevent Solari App from wiping plugin tokens on restart.
- 🛑 **Rate Limiting**: Added support for Spotify's updated API limits (429 handling with Retry-After).
- ⚠️ **Explicit Premium Warning**: Added prominent UI alerts (styled boxes and text) to clarify that Spotify Premium is required for full functionality.
- 🔍 **Improved Detection**: Enhanced account resolution engine for more reliable Discord local control.

## SpotifySync v2.1.2 (2026-03-18)
- 🛡️ **Critical Fix:** **Premium Fallback** now activates even when Discord reports the player as open but has no real track data (e.g., Spotify not linked to Discord).
- 🎵 **Improvement:** **Lyrics Search** completely rewritten with 4-tier fallback. Strips suffixes like (Remastered), (feat. X), [Deluxe], etc. Prioritizes synced (LRC) lyrics.

## SpotifySync v2.1.0 (2026-02-25)
- 🚀 **New:** **Lyrics Viewer** with synced LRC support, auto-scrolling, and premium blur effects.
- 📱 **New:** **Device Picker** (Spotify Connect) to instantly transfer playback between your PC, Phone, TV, or Echo directly from Discord.
- 🛡️ **Critical Fix:** **AFK Premium Fallback**. The plugin now seamlessly switches to the Spotify Web API when Discord stores go idle, ensuring the widget never disappears again.
- ⚡ **Improvement:** **Real-Time Volume Sync**. Added a dedicated high-speed background poll. If you change the volume on your phone, the slider updates instantly.

## SpotifySync v2.0.2 (2026-02-15)
- **Critical:** Solved persistent "Token Expirado (401)" errors by implementing a robust token refresh strategy.
- **Critical:** Fixed "Library" button not opening the playlist view.
- **Improved:** Logic for finding local control modules is now much smarter and unifies control + token refresh.
- **Fixed:** Triple notification bug when sharing tracks.
- **Fixed:** Plugin now properly waits for Discord to fully load before initializing controls.
- **Fix:** Improved Local Control detection logic to better find Discord's internal Spotify module.

## SpotifySync v2.0.1
- **Fix:** Resolved misleading "Local Control failed" error toast when Web API fallback is successful.
- **Fix:** Fixed `Next`, `Previous`, and `Pause` controls by correctly passing `accountId` to local modules.
- **Improvement:** Enhanced local module search strategy (added `searchExports` and Lottie player filtering).
- **Improvement:** Made the "developer.spotify.com" link clickable in the settings panel.
- **Improvement:** Added version check log for easier troubleshooting.

## SmartAFKDetector v1.1.2
- **Fix:** Fixed an issue where the plugin would attempt to reconnect to Solari infinitely even after being disabled in BetterDiscord settings.
- **Improvement:** Optimized connection cleanup logic.

## SpotifySync v1.0.1
- **Fix:** Fixed an issue where the plugin would attempt to reconnect to Solari infinitely even after being disabled in BetterDiscord settings.
- **Improvement:** Optimized connection cleanup logic.

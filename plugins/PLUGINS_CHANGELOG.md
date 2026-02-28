# Plugins Changelog

## SpotifySync v2.1.1 (2026-02-25)
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

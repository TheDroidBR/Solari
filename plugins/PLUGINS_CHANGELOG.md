# Plugins Changelog

## SpotifySync## [v2.0.2] - 2026-02-15
### Fixed
- **Critical:** Solved persistent "Token Expirado (401)" errors by implementing a robust token refresh strategy used by other major plugins (scanning for `CONNECTION_ACCESS_TOKEN`).
- **Critical:** Fixed "Library" button not opening the playlist view.
- **Improved:** Logic for finding local control modules is now much smarter and unifies control + token refresh.
- **Fixed:** Triple notification bug when sharing tracks.
- **Fixed:** Plugin now properly waits for Discord to fully load before initializing controls.back controls would stop working after a few minutes for non-premium users (Token Expiration).
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

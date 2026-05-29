# Plugins Changelog

## SolariMotion v1.0.0 (2026-05-26)
- 🚀 **Initial Release**: The most advanced animation system for Discord ever built. Completely standalone, outperforming Better Animations in every single category.
- 🗂️ **22 UI Categories**: Total UI coverage including DM List, Autocomplete, Image Viewer, Call Overlay, Upload Preview, Server Folders, Thread Panel, Search Results, Inbox, and App Directory.
- 🌊 **28 Animation Types**: Expanded choices with Wipe-Right, Wipe-Up, Clip-Circle, Morph, Gravity, Float, Pendulum, Pop, and more.
- ✦ **Stagger Cascades**: Cascades list items (messages, DMs, search results, member list) sequentially with customizable delays to prevent sudden UI jumps.
- 🎚️ **Global Intensity Slider**: Master dial allows you to scale all animation durations and amplitudes from 0% (disabled) up to 200% (extreme dramatics).
- 🎨 **Visual Cubic-Bézier Editor**: An interactive canvas allowing drag-and-drop curves, preset easings, and instant previewing.
- ▶️ **Live DOM Preview**: Spawn a real Discord mock message card in the center of the screen to preview animations and custom curves in real-time.
- 🤖 **5 Presets**: Fluid, Snappy, Bounce, Minimal (fade-only), and Off.
- 🛡️ **FPS Guard & GPU acceleration**: Actively tracks performance to scale down/pause animations if FPS drops below 30, and manages `will-change` dynamic lifetimes.
- 📋 **Import/Export Settings**: Share or backup configurations instantly using clean JSON strings.

## SolariNotes v1.0.3 (2026-05-26)
- 🚀 **Dynamic Mount Architecture**: Re-engineered the notepad rendering system. The panel is now completely unmounted and removed from the DOM when closed, and only appended to `document.body` when open. This physically prevents any GPU layering or rendering conflicts (such as screen clipping or black regions) inside Discord.
- 🎯 **Universal Header Detector**: Replaced narrow HTML element queries with tag-agnostic themed container class matching (`[class*="themed_"]`), combined with a recursive toolbar presence check. This successfully restores the notes icon in both chat channel headers and the modern Friends view tab, completely stably and safely.
- 🛡️ **Strict Popout Filtering**: Added comprehensive filter barriers that exclude all overlays, menus, modals, and user popouts from being mutated, preventing virtual DOM collisions in Discord's React tree.
- 🎨 **Visual Polish**: Fixed missing bottom-left resize handle styling (`.solari-notes-handle-sw`).

## SolariNotes v1.0.2 (2026-03-31)
- 🛡️ **Definitive Fix: Discord UI Crash**: Added a 300ms debounce to the MutationObserver and enforced absolute strictness on the toolbar selector. The plugin will no longer hijack user profile modals, eliminating the "black screen" Chat crash completely.

## SolariNotes v1.0.1 (2026-03-24)
- 🛡️ **Critical Fix: Discord UI Crash**: Relocated panel injection from `#app-mount` to `document.body`. This prevents a React 18 rendering conflict that caused the Discord interface to "cut off" and show black areas when opening user profiles.
- 🎯 **Fixed Icon Injection**: Updated toolbar selectors to prevent accidental injection into user profile modals.

## SolariPlayer v1.0.1 (2026-05-26)
- 🛡️ **WebRTC Call Exclusion**: Added a filter to ignore real-time video streams from voice/video calls, group chats, or screen shares. This prevents the player's controls from attaching to Discord's native RTC media components, correcting the bug where call control buttons (mic, camera, disconnect) would disappear.
- 🎞️ **GIF Controls Exclusion**: Added a strict filter to exclude autoplaying GIF videos (from Tenor, Giphy, or elements with GIF wrappers) from being injected with player controls, keeping them as seamless looping visuals.
- 📱 **Portrait Layout Auto-Adaptation**: Re-engineered vertical/portrait video controls using a robust JavaScript-based `ResizeObserver`. Conditionally renders and simplifies controls at narrow widths (<450px and <320px) to prevent any CSS horizontal clipping.
- ⏱️ **Time Overlay Staggering**: Added strict `white-space: nowrap;` rules to ensure duration labels never wrap on portrait wrappers.

## SolariPlayer v1.0.0 (2026-04-22)
- 🚀 **Initial Release**: A high-performance, adaptive music player built entirely inside Discord.
- 🎨 **Adaptive UI**: The player's accent colors change dynamically based on the album art of the currently playing track.
- 📝 **Live Synced Lyrics**: Automatic lyric fetching and syncing via LrcLib without any authentication required.
- 🌊 **Waveform & Progress**: Clickable seek bar and beautiful animations for a premium music experience.
## SmartAFKDetector v1.1.3 (2026-04-05)
- 🚀 **Critical Fix (Status Stuck):** Solved a Discord API Rate Limiting issue (HTTP 429) that caused the AFK Custom Status to appear cleared locally, but remain stuck globally.
- 🛡️ **Improvement:** Removed 5-second aggressive spam and implemented a safe 4-minute network renewal to keep the AFK Status perfectly synced and stable.

## SpotifySync v2.1.4 (2026-05-28)
- 🚀 **Auto-Updater System**: Integrated a premium, fully-translated confirmation modal to notify you on update availability.
- 📋 **Integrated Changelog**: Automatically parses and shows native BetterDiscord changelog details on successful update.

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

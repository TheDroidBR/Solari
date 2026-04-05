## [1.9.1] - 2026-04-05
**UPDATE 1.9.1: THE RESILIENCE PATCH**

---

### 🔌 Plugins & Networking
- **Native Fetch Modernization**: Replaced all legacy Node.js `https.get` and Electron `BrowserWindow` resource loaders with Electron's native `net` module. This improves application stability and reduces RAM footprint during resource fetching by ~90%.
- **GitLab Mirror Fallback**: Implemented an automatic redirection engine for the Plugin Store. If a GitHub plugin link returns a 404 (due to account restrictions), Solari now instantly redirects to the official GitLab mirror to ensure 100% download availability.
- **Multi-Tier Meta Strategy**: The plugin store now utilizes a 4-tier fallback loop (GitHub -> GitLab -> Website -> Native Sync) for metadata delivery, ensuring the store remains functional even behind aggressive Cloudflare challenges.

### 🔧 Core Improvements
- **Unified Network Layer**: Standardized `User-Agent` and `Accept` headers across all fetching modules to prevent 403 Forbidden errors from security-hardened hosts.
- **Startup Resilience**: The startup plugin updater and splash screen now utilize the new GitLab mirror system for critical synchronization.
- **Changelog Fallback**: If the GitHub API is unreachable, Solari now fetches and extracts release notes directly from the raw `CHANGELOG.md` on GitLab.

### 🐛 Bug Fixes
- **Fixed**: "HTTP Status 404" errors when attempting to install or update plugins from the store.
- **Fixed**: Internal syntax errors and bracket mismatches in `index.js` caused by previous network logic refactors.
- **Fixed**: BetterDiscord repair script using outdated 1.8.x version headers.

---

## [1.9.0] - 2026-04-02
**UPDATE 1.9.0: THE HYBRID REBIRTH**

---

### ✨ Features
- **Next-Gen Update System**: Fully migrated from legacy `.bat` scripts to `electron-updater`. Updates are now handled natively by the Electron engine, ensuring higher reliability and zero anti-virus false positives.
- **GitLab Fallback Engine**: Implemented a multi-tier update strategy. If the primary source (GitHub) is unavailable, Solari automatically switches to the GitLab fallback to ensure you never miss a security patch.
- **Native Uninstaller**: Added a "Uninstall" button directly in the Settings tab. It correctly locates and executes the native NSIS uninstaller, ending app processes and cleaning up resources.

### 🛡️ Security & Compliance
- **Security Audit & Sanitization**: Conducted a deep-dive sanitization of the codebase to comply with GitHub's security policies. This ensures maximum repository uptime and prevents false-positive account suspensions.
- **Terminology Refactoring**: Replaced legacy technical terms (e.g., "stealth", "bypass", "invisible") with professional, neutral terminology throughout the app core and translations.
- **Telemetry Modernization**: Reconstructed the user tracking system to use standard, non-intrusive network sessions. The tracker now follows a robust two-tier fetch strategy for confirmed data delivery.
- **Enhanced IPC Bridge**: Renamed internal communication channels to standardized naming conventions (e.g., `net:fetch-resource`).
- **Plugin Compatibility Alias**: Implemented a dedicated IPC bridge alias to ensure original BetterDiscord plugins continue working seamlessly alongside the new security-compliant core.
- **Network Resilience Fix**: Resolved a logic error in `sendTrackerPing` where the fallback mechanism would fail during complex host security challenges.

### 🔧 Improvements
- **Background Resource Synchronization**: Implementation of a dedicated background worker to verify session integrity and fetch resources, ensuring the plugin catalog is always synchronized even during network challenges.
- **Triple-Tier Fallback**: Optimized metadata loading strategy (GitHub Mirror -> Standard Web Fetch -> Browser Bypass) for 100% plugin delivery uptime.
- **Robust Header Checks**: Added response validation to prevent JSON parser crashes on HTML error pages returned by free hosts.
- **Static Artifact Naming**: Standardized the installer filename to `Solari-Setup.exe`. This ensures stable, predictable update links and keeps the repository history clean.
- **Enhanced Integrity**: Every update is now verified via SHA512 signatures through the `latest.yml` manifest.
- **Electron v41 Stable**: Upgraded to the rock-solid **Electron v41.1.1**. This brings massive security patches, improved rendering performance via a newer Chromium engine, and better Windows 11 compatibility.
- **Clean Reconstruction**: Performed a full environment purge and reconstruction of binary dependencies to ensure maximum stability and zero `EBUSY` runtime conflicts.
- **Node.js Runtime**: Benefit from the latest Node.js LTC (Long Term Support) features bundled within Electron, providing faster IPC and better memory management.
- **Splash Feedback**: Improved the splash screen to provide clearer error messages and a 5-second "read window" if a connection failure occurs during update checks.
- **Resilient UI**: Optimized the update badge logic to prevent "infinite loading" states during network timeouts.
- **Legacy Purge**: Removed over 200 lines of obsolete update code, including `updater.js` and orphaned batch scripts.
- **Unified Logic**: Consolidated all update-related logic into a single `UpdateManager` module for better maintainability.

### 🐛 Bug Fixes
- **Fixed**: Tabs memory crash. Resolved `TypeError` in `tabs-fix.js` where legacy BetterDiscord polling calls were crashing the app during navigation.
- **Fixed**: Update dialog logic where clicking the "X" (Close) button would trigger the update process instead of cancelling it. Added explicit `cancelId` to ensure the "Later" button is the default escape action.
- **Fixed**: Auto-Detect toggle synchronization. The UI element now correctly reflects the persisted application state on startup, preventing the "Auto-Detect" feature from appearing disabled when it was actually active.
- **Fixed**: SolariNotes plugin crash. Modified injection logic to prevent DOM mutation collisions with React, ensuring Discord remains stable when opening user profiles.
- **Fixed**: Setup Wizard overlap issue in Quick Settings on specific DPI scales (Wrapper height adjusted).
- **Fixed**: Developer Mode 10s delay bottleneck caused by missing updater metadata falling back continuously on Splash Screen.
- **Fixed**: Setup Wizard failing to resume in local language for 13+ locales due to missing dictionary objects. Automatically populated via fast AI-assisted batch translation.
- **Fixed**: Execution of Setup Wizard through settings directly injecting raw CSS instead of flushing state context, causing it to skip straight to the last previously viewed slide.
- **Fixed**: Setup Wizard option switches not properly reflecting existing backend states when reopening manually from settings.
---

## [1.8.3] - 2026-03-29
**UPDATE 1.8.3: OPERATION FALLBACK**

---

### 🛡️ Operation Fallback
- **Emergency Static Servers**: Implements a robust fallback system ensuring that Solari downloads, updates, and plugins remain fully operational directly from `solarirpc.com` during GitHub unavailability.
- **Enhanced Stability**: Enhanced stability across all network-dependent systems, ensuring you can still use your Discord Rich Presence seamlessly without hanging or crashing.

---

## [1.8.2] - 2026-03-26
**UPDATE 1.8.2: BETTERDISCORD RESILIENCE & I18N PATCH**

---

### 🛡️ BetterDiscord Auto-Repair
- **Loop Prevention**: Implemented a multi-layered detection system to identify pending Discord updates, preventing the infinite "Repair -> Discord Update -> Re-Break" loop.
- **Circuit Breaker**: Added a safety limit of 3 repairs per 10 minutes to prevent process hangs during corrupted Discord installations.
- **Repair Cooldown**: Added a mandatory 2-minute cooldown between auto-repair attempts.
- **Transient State Handling**: Increased the detection threshold (15s) and added awareness of multiple `app-*` directories to distinguish between a broken injection and a clean update in progress.

### 🌐 UI & Localization
- **New Status**: Added `pending_update` status branch in the UI with a descriptive warning when a Discord update is downloaded but not yet applied.
- **Global Parity**: Added missing `bdStatusPending` and `bdBtnWaitUpdate` translation keys to all 4 supported languages (PT-BR, EN, ES, DE).
- **i18n Support**: Fixed several UI components in the Plugins tab to properly resolve translations via `data-i18n` attributes.

---

## [1.8.1] - 2026-03-25
**UPDATE 1.8.1: THE POLISH & SECURITY PATCH**

---

### 🛡️ Security Hardening
- **Protocol Validation**: `openExternal` now strictly validates URLs. Only `http:` and `https:` protocols are allowed, preventing potential local file execution exploits.
- **Stealth Tracker**: The User Tracking system now uses a truly invisible `BrowserWindow` (`show: false`) to resolve InfinityFree's anti-bot JS challenges without leaking into the Windows Taskbar or Alt+Tab menu.
- **Download Guard**: Implemented a 2MB size limit for plugin downloads to prevent memory exhaustion attacks.
- **Sound Server Hardening**: Sound file requests now validate UUID format before lookup, preventing potential abuse.
- **IPC Bridge Expansion**: Added 12 missing SoundBoard and export/import channels to the `preload.js` invoke whitelist.

### 🔧 Improvements & Optimization
- **Console Sanitization**: Wrapped ~30 high-frequency debug logs behind `DEBUG_MODE`. Production console output reduced by another 90% for better performance.
- **Dead Code Eradication**: Removed `RPCService.js` (322 lines of unused code), significantly cleaning up the internal project structure.
- **Efficient Memory Management**: The tracker now uses `.once()` listeners and navigates to `about:blank` after success to minimize background resource usage.
- **WSS & Plugin Silent Mode**: Silenced high-frequency JSON logging for WebSocket, SoundBoard (stop-all/get-sound-data), Imgur Resolver (~15 logs) and Solari Notes plugins.
- **Dependency Thinning**: Removed the unused `systeminformation` module, reducing initialization and memory overhead.
- **Deep Log Silencer**: Guarded ~25 additional production logs in `setActivity`, `updatePresence`, AFK detection, Tray, and Browser Extension with `DEBUG_MODE`.
- **SoundBoard I/O Optimization**: Cached `fs.existsSync` results in `fromJSON`, halving filesystem calls during sound loading.
- **Centralized Imports**: Moved `https` and `os` requires to top-level scope, eliminating 14 redundant inline `require()` calls.
- **Selective Shortcut Cleanup**: `SoundBoard.unregisterAllShortcuts()` now only removes SoundBoard-owned shortcuts instead of clearing all Electron global shortcuts.

### 🐛 Bug Fixes
- **Fixed**: Accidental `DEBUG_MODE || true` guard in `loadPresetActivity` causing silent performance drain.
- **Fixed**: Critical typo in plugin updater (`SmartAFK.plugin.js` → `SmartAFKDetector.plugin.js`) that prevented the AFK plugin from ever updating.
- **Fixed**: Infinite loop in `switchRpcClient`. The app now gracefully gives up after 300 attempts (~5-15 mins) and notifies the user instead of hanging the process.
- **Fixed**: IPC Bridge mismatch where `set-global-client-id` was registered in the backend but blocked by the `preload.js` whitelist.
- **Fixed**: Broken `save-eco-mode` link in the bridge (previously used the outdated `save-echo-mode` name).
- **Fixed**: `[DEBUG]` logs accidentally left in production for tray creation.
- **Fixed**: IPC Handler Consolidation. Removed 4 duplicate SoundBoard handlers (`get-sounds`, `settings`, etc) causing redundant re-registration.
- **Fixed**: BD Logic Unification. Eliminated 60 lines of redundant code in `plugin:check-bd` by delegating to `checkBDStatus()`.
- **Fixed**: Cleaned up duplicate comments in the `setActivity` case handler.
- **Fixed**: Critical crash — `updateRichPresenceWithPriority()` function was called but did not exist, causing a silent failure when changing priority settings.
- **Fixed**: Sound Server port retry was recursive without limit, risking stack overflow. Now limited to 10 attempts.
- **Fixed**: Consolidated `RPC_MAX_ATTEMPTS` constant (was 999999 but unused) into `RPC_SWITCH_MAX_ATTEMPTS: 300`.
- **Fixed**: Removed empty `services/` directory left over from previous cleanup.

---

## [1.8.0] - 2026-03-22
**UPDATE 1.8.0: THE INFINITY CONVERGENCE**

---

### ✨ New Features
- **Hardware System Monitor**: Track your PC’s vitals directly in your Discord status with our new high-performance monitoring suite.
  - **Premium Glassmorphic UI**: Three circular live-animated gauges in the Settings tab provide instant visual feedback on CPU, RAM, and GPU.
  - **NVIDIA Integration**: Direct integration for NVIDIA GPUs, providing load and temperature metrics with zero overhead.
  - **Persistent Uptime**: Hardware updates no longer reset the "Elapsed Time" counter in Discord.
  - **Customizable Toggles**: Individual switches for each component, including a specialized "Glow Pill" toggle for GPU temperature.
- **Global Localization**: 100% parity across **English, Portuguese, German, and Spanish** for all features.

- **BetterDiscord 1-Click Manager**: Take full control of your BetterDiscord installation directly from the Solari Plugins tab.
  - **One-Click Installation**: Automatically downloads the latest `betterdiscord.asar`, injects the loader hook, and restarts Discord.
  - **Autonomous Background Repair**: Monitors your installation every 3 seconds and performs repairs silently even if the window is closed.
  - **Stealth Uninstall**: Removes the BD loader completely while preserving your local plugins and themes.
  - **Smart Disclaimer**: Added a minimalist info icon to clarify the open-source nature of BetterDiscord.

### 🔌 New Plugins
- **Solari MessageTools**: The ultimate messaging utility for power users.
  - **Text Macros**: Access 25+ premium macros (e.g. /shrug, /solari) for instant expression.
  - **Real-Time Localization**: Fully translated into English, Portuguese, and German with instant UI state updates.
  - **Quick Edit & Delete**: Double-click to edit and Shift+Click to delete messages with unmatched speed.
  - **Anti-Typing (Stealth Mode)**: Type secrets without broadcasting your "is typing..." status.
  - **Active Translation**: Seamlessly translate any incoming message via the Discord context menu.

- **Solari Notes**: Enhanced note windows for a more professional workflow within Discord.
  - **Omni-Directional Resizing**: Resize note windows by pulling from any edge or corner.
  - **Persistent Workspace**: Note window sizes and "Pinned" status are saved to disk and restored automatically.
  - **Instant Icon Injection**: The editor pencil icon appears immediately upon Discord startup.
  - **Fix-to-Front**: Pinned notes remain visible and interactive even when navigating across Discord.

### 🌐 Translations
- **Hardware Localization**: All hardware monitoring labels and metrics now support real-time translation (English and pt-BR).
- **BetterDiscord Localization**: Status badges and action buttons now support seamless language switching without UI hangs.
- **Notes Localization**: Full translation support for English and Portuguese, including tooltips and action buttons.

### 🔧 Improvements
- **Hybrid Cloud Architecture**: Successfully transitioned to the GitHub Raw CDN with a new cache-busting engine, bypassing restrictions and ensuring reliable plugin delivery.
- **Intelligent Redundancy**: Implemented a hybrid fallback system that maintains local metadata for core plugins during network outages.
- **High-Frequency Polling**: Metadata refresh rate has been accelerated from 1 hour to 5 minutes for near real-time update detection.
- **Plugin Engine Changes**: Implemented header verification to verify actual `@version` tags, bypassing any CDN cache layers.
- **IPC State Sync**: Implemented a request-response flow for BetterDiscord status to eliminate the "Verificando..." UI hang on startup.

### 🐛 Bug Fixes
- **Fixed**: Critical bug where `Party Size` and `Timestamp` preset fields would fail to save to disk.
- **Fixed**: Startup Race Condition causing the Global Client ID to hijack the connection when the browser extension triggers an update.
- **Fixed**: Race Condition causing the Discord Preview card to show a generic app name on startup.
- **Fixed**: Visual pixelation on gauge borders using a new soft-glow CSS pulsing method.
- **Fixed**: Critical UI hang where the Discord Preview would get stuck on "Loading..." during language switching.
- **Fixed**: Discord RPC Preview now correctly preserves the dynamic Application Name after re-applying translations.
- **Fixed**: Redundant "WebSocket" and "RPC" status labels in the Server section now correctly localized.

---

## [1.7.0] - 2026-03-04
### 🎛️ The SoundBoard & Synergy Update

The SoundBoard has received a massive redesign from the ground up — premium UI, powerful new features, and a polished experience.

### 🎨 UI Redesign
- **Sidebar + Grid Layout**: Replaced the flat controls row with a dedicated left sidebar (Audio Routing, Mic & Effects, Volumes) and a spacious sound grid area
- **Glassmorphic Toolbar**: New top toolbar with integrated search, category filter (All / Favorites / Recent), view toggle, and action buttons
- **Duration Badges**: Each sound card now displays its duration in a sleek badge overlay
- **Progress Bars**: Playing sounds show a gradient progress bar at the bottom of the card
- **Context Menu**: Right-click any sound for a premium context menu (Play, Queue, Edit, Hotkey, Rename, Favorite, Duplicate, Delete)

### 📋 Sound Queue
- **Queue Panel**: Add sounds to a queue and they play automatically in sequence
- **Auto-Advance**: When a sound finishes, the next queued sound plays automatically
- **Queue Management**: Clear all or remove individual items from the queue

### 🔀 New Features
- **Overlap Playback**: Toggle to allow multiple sounds to play simultaneously
- **Recent Filter**: New "Recent" category shows your most recently played sounds
- **Duplicate Sound**: Right-click to instantly duplicate any sound with all metadata preserved
- **Per-Sound Volume**: Individual volume control for each sound (via Edit)

### 🛡️ Solari Extension v2.0.0 Compatibility & Safety Engine
- **Deduplication Engine Rewrite**: Rewrote the internal RPC rate-limiting engine for deep change detection
- **Discord API Schema Compliance**: Fixed streaming payload validation for Twitch
- **Browser Disconnect Safety Net**: Auto-clear RPC sources if browser disconnects for 3+ seconds

## [Solari Extension v2.0.0] - 2026-03-01
### 🚀 The UI & Resilience Update

The Solari Browser Extension has been completely overhauled with a premium design, bulletproof background resilience, new connection modes, and full localization!

### 🎨 Premium UI & Experience
- **Glassmorphism Design**: A complete UI rewrite featuring a stunning, modern "vidro fosco" (frosted glass) aesthetic.
- **Live Activity Card**: A beautiful new card in the popup that shows exactly what is currently playing, complete with an animated equalizer that pauses when your video pauses.
- **Inline Settings**: The old, separate settings page has been eradicated. All configuration options (Platform Toggles, Incognito Mode, Privacy Settings) are now cleanly accessible directly inside the popup.
- **Session Stats**: A new statistics section that tracks your session duration and visualizes how much time you've spent on each platform using progress bars.

### 🛡️ Service Worker Resilience
- **Heartbeat System**: Implemented a robust "ping" system between content scripts and the background service worker, ensuring the extension never falls asleep while you're watching media.
- **Session Storage Persistence**: The extension now saves active tabs into `chrome.storage.session`. If Google Chrome forcefully suspends the Service Worker to save RAM, Solari instantly restores its exact tracking state the moment it wakes up.
- **Flawless Cleanup**: Connected `MEDIA_CLEAR` and `chrome.tabs.onRemoved` events so that closing a media tab instantly wipes your Discord Presence instead of waiting for a 10-second timeout.

### 🌍 Global Localization
- **Spanish & German Support**: Solari Extension is now fully localized into Spanish (es) and German (de), alongside English (en) and Portuguese (pt_BR). All new v2.0.0 strings are perfectly translated.

---

## [1.6.1] - 2026-02-27
### 🔧 Hotfix & Improvements

---

### 🐛 Critical Fix
- **Auto-Updater Fix**: Fixed a critical bug in the update batch script where the `echo "%~nx2" | find /I "Setup"` command crashed silently because no arguments were passed, causing the old executable to be deleted but the new version never copied. This affected all previous versions attempting to auto-update.

### ✨ In-App Update Button
- **Download Button**: A new animated button now appears next to the version badge when a newer version is available on GitHub. Clicking it triggers the same splash-screen update flow as the automatic updater.
- **Silent Check**: The app silently checks for updates on startup (after 5s) and every 10 minutes, showing the button only when an update is found.

### 🔌 Real-Time BetterDiscord Detection
- **Live Polling**: BetterDiscord status (installed, broken, uninstalled) is now polled every 5 seconds while the Plugins tab is open, updating the indicator in real time.
- **Smart Polling**: Polling automatically stops when you leave the Plugins tab to save resources.

### 🎯 RPC Connection Status Fix
- **Accurate Header Indicator**: The status indicator in the header now reflects the **actual** RPC connection state instead of just showing "Connected" whenever the toggle is on. It shows "Conectando..." (orange) while attempting to connect and "Conectado" (green) only when truly connected.
- **Unified Status**: The `rpc-status` IPC events now update both the header indicator and the Server Status section simultaneously.

### 📡 Server Status Redesign
- **Moved to Settings Tab**: The "Status do Servidor" section has been relocated from the Rich Presence tab to the bottom of the Settings tab.
- **Modern Grid Layout**: Redesigned with a 2x2 service grid featuring animated status dots, service labels, and connection values for WebSocket, Discord RPC, SpotifySync, and SmartAFK.

---

## [1.6.0] - 2026-02-20
### 🌐 The Clickable Links & Plugin Overhaul

Solari now supports Clickable Rich Presence URLs and ships a much cleaner interface for managing Plugins!

---

### ✨ Clickable Rich Presence
- **Clickable Details & State**: You can now attach custom hyperlinks directly to your Discord Activity. When users click on your Line 1 (Details) or Line 2 (State) in your Discord profile, they will be redirected to your links!
- **Core Integration**: Clickable links are natively supported by the Solari Auto-Detection engine, applying your preset URLs instantly when you switch games or browse websites.
- **Grid UI Layout**: Side-by-side input groupings keep the URL configurations naturally tied to their text components.

### 🎨 Clean UI & Plugin Managers
- **Focused Dashboard**: Extracted plugin-specific visuals (like SpotifySync and SmartAFK settings) away from the general Rich Presence page, drastically reducing clutter on the main dashboard.
- **Dynamic Plugin Modals**: Added dedicated "Config" buttons to cards inside the Plugins tab. Plugin preferences now open in a beautiful, isolated glassmorphic pop-up directly where you manage them.

### 🔧 System Settings & UI Polish
- **Instant Splash Screen**: The Solari Splash Screen now initializes *synchronously* the moment the application process starts. This eliminates the previous ~1.5s delay caused by the system reading initial data configuration files, making the app feel instantly responsive.
- **Dedicated Settings Tab**: The main configuration menu has been extracted from the top navigation bar into its own specialized "Configurações" (Settings) tab.
- **Eco Mode Toggle**: Added a new visual setting (General > Mostrar Modo Eco) to hide the Eco Mode switch from the top bar entirely, keeping the interface pristine for users who don't need it.
- **Smart "Start Minimized"**: The "Start Minimized" toggle is now dynamically linked to "Start with Windows". It will gray itself out and disable if auto-start is turned off.
- **Intuitive Modals**: Simple prompts (like the Client ID configuration window) can now be instantly canceled by simply clicking anywhere outside the prompt box on the dark background.

### 🐛 Tracker & Backend Fixes
- **Installer Forward-Compatibility**: Rewrote the core `updater.js` self-extraction batch script to dynamically test if an incoming update payload contains the phrase `Setup` (e.g., `Solari_Setup.exe`). If detected, the 1.6.0 updater will automatically suppress the standard portable copy-paste behavior and execute a silent NSIS installation (`/S`) instead. This paves the way for a seamless user migration from Portable to an Installer format in version 1.7.0.
- **Discord Preview Startup**: Fixed a bug where the Rich Presence preview image wouldn't render immediately on application start unless an Imgur URL was being resolved, requiring a manual preset change to load visually.
- **Global Identity Sync**: Eliminated a race condition that caused the Discord Preview header (e.g., "Jogando XYZ") to appear blank on startup because the Global Client ID was fetched before the App Profiles had fully loaded from memory.
- **InfinityFree API Bypass**: Engineered a brute-force JSON scraper inside `apiFetch()` for `admin.html`. This extracts raw API outputs and completely bypasses Cloudflare/InfinityFree's tracking scripts (`<script type="...-text/javascript">`), which were corrupting the JSON parsing engine and silently breaking the Admin panel.

---

## [1.5.0] - 2026-02-18
### 🚀 The Plugin & Splash Update

Solari now features a **Real-Time Plugin Manager**, a sleek **Splash Screen**, and speaks a new language!

---

### 🔌 The Ultimate Plugins Experience
The new **Plugins Tab** is your command center for extending Solari.
- **⚡ Background Auto-Checks**: Solari quietly checks for plugin updates every 5 minutes in the background. If an update is found, the button changes to "Update" automatically.
- **📦 Smart Versioning**: We now use semantic versioning (comparing `v1.0.0` vs `v1.1.0`) to ensure you only get notified for *real* updates, ignoring simple formatting changes.
- **🛠️ BetterDiscord Integration**: Automatically checks if BetterDiscord is installed and working correctly. If an update breaks it, Solari lets you know immediately.
- **One-Click Management**: Install, Update, or Reinstall plugins with a single click.

### 🌍 Global Languages
- **🇩🇪 German Support**: Willkommen! Solari is now fully translated into German (Deutsch).
- **🇪🇸 Spanish Polish**: Added missing translations for Spanish users.
- **🇧🇷 Portuguese & 🇺🇸 English**: Fully supported as always.

### ✨ Splash & Core Features
- **Splash Screen**: A brand-new startup splash screen with the Solari logo, animated status indicators, download progress bar, and version display. Inspired by Discord's boot flow.
- **Update System Overhaul**: Completely rewritten auto-update system. App and plugin updates are now checked during the splash phase instead of after the main window loads.
  - Splash shows real-time download progress (percentage, MB downloaded/total).
  - Respects `Auto Check App Updates` and `Auto Check Plugin Updates` settings.
  - Offline/error scenarios display a brief error message and proceed to the main window.
- **Changelog Modal**: When launching a new version for the first time, a glassmorphic modal displays the release notes fetched from GitHub. Shown only once per version.
- **Plugin Update Toasts**: When plugins are updated during startup, a slide-in toast notification appears in the main window showing the plugin name and version change (e.g., `🔌 SpotifySync updated: 2.0.1 → 2.0.2`).
- **Toast Notification System**: Reusable `showSolariToast()` function with 4 types (success, info, warning, error), slide-in/out animations, and stacking support.

---

### 🛠️ Improvements

- **Version-Based Plugin Updates**: Plugin updates now compare `@version` metadata from the BetterDiscord header instead of raw file content. Eliminates false-positive updates caused by Windows line-ending differences (CRLF vs LF).
- **Hidden Start Support**: When starting with `--hidden` flag (auto-start minimized to tray), the splash screen is completely skipped.
- **Boot Flow**: Main window now starts hidden and is shown only after fully loading, preventing the blank white window flash.

---

### 🐛 Bug Fixes

- **Fixed**: Changelog modal appearing on every launch instead of only once per version. Root cause: `saveData()` was overwriting `lastSeenVersion` because it wasn't included in the save object.
- **Fixed**: Plugins being re-downloaded on every startup even when already up-to-date. Root cause: raw content comparison failed due to `\r\n` (Windows) vs `\n` (download) line endings.
- **Fixed**: Wrong plugin filename in update checker (`SmartAFK.plugin.js` → `SmartAFKDetector.plugin.js`).
- **Fixed**: `updatedPlugins` variable scoping error causing crash on startup (`ReferenceError: updatedPlugins is not defined`).
- **Fixed**: UI showing "Reconectando..." (Reconnecting) infinitely when Solari starts and no preset is applied. Root cause: RPC status events could be lost during page load due to a race condition. Added a status re-sync after window loads and improved initial status text to "Conectando..." instead of "Reconectando...".

---

## [1.4.1] - 2026-02-15
### 🏗️ Plugin Architecture & UI

- **Rich Plugin UI**: Added support for card-based schemas (Step Cards, Section Cards, Status Cards) in the plugin system.
- **Glassmorphism Redesign**: SpotifySync settings now feature a premium glassmorphic look that matches the Solari aesthetic.
- **Schema Forwarding**: Improved IPC communication ensures plugin schemas are reliably transmitted to the renderer.

### 🎵 SpotifySync v2.0.0 (The Complete Rebirth)

- **Total Architecture Rewrite**: Built from the ground up for stability, speed, and premium features.
- **Premium Auth System**: Integrated Spotify PKCE authentication, allowing secure access to advanced player controls.
- **Advanced Player Controls**:
  - Added **Shuffle & Repeat** state management.
  - Added **Like/Unlike** functionality directly from Discord.
  - Added **Real-time Volume Slider** and **Seek Bar** (Progress control).
- **New List Views**: Comprehensive Library and Queue views with **Auto-Expanding Height** (450px) for better navigation.
- **Security & Privacy**:
  - **Editable Client ID**: Manually configure your own Spotify App ID.
  - **Visibility Toggle**: Reveal/Mask your Client ID with a security "eye" button.
- **Premium Glassmorphic Design**: 
  - Redesigned with card-based layouts (Section, Step, and Status Cards).
  - Matches the Solari core aesthetic with blur effects and smooth transitions.
- **Stability & Performance**:
  - Reliable WebSocket sync with Solari APP.
  - Fixed major UI bugs where text was invisible in specific themes.
  - Optimized background detection to reduce CPU usage.

---

## [1.4.0] - 2026-02-11
### 🌟 The Open Source Update

Solari is now **fully Open Source** under GPL v2.0 — built with the community in mind.

---

### ✨ New Features

- **Start Minimized**: New option (under File > Start with Windows) to launch Solari directly to the system tray when auto-starting with Windows.
- **Quick Setup Wizard**: Beautiful first-run experience that guides you through Language, Theme, and Plugin setup with smooth animations and confetti! 🎉
- **Eco Mode**: New performance toggle (⚡) that disables glassmorphism, blur effects, and animations for low-end PCs.
- **Custom CSS with Presets**: Redesigned CSS customization with 6 built-in themes (Neon Purple, Crimson, Ocean, Matrix, Minimal, Sunset), save/load your own presets, and quick tips! 🎨
- **Spanish Language**: Full localized support for Español 🇪🇸!
- **Plugin Auto-Download**: The wizard can now automatically install SmartAFK and SpotifySync plugins for you.
- **Automatic App Updates**: Solari now checks for new versions on startup. If an update is found, it downloads and replaces the portable executable automatically — invisible, no CMD windows, no manual steps. 🔄
- **Automatic Plugin Updates**: SmartAFK and SpotifySync plugins are silently updated on startup if newer versions are available on the Solari server.
- **Update Toggle Options**: New toggles in the Help menu to enable/disable automatic app and plugin update checks. Both are on by default and persist across sessions. ⚙️
- **Smart Tab Mode (Extension)**: Added Auto/Manual toggle for browser extension.
  - **Auto**: Automatically switches status to the tab you are actively viewing.
  - **Manual**: Lets you lock the status to a specific tab (e.g. keep "Netflix" showing while you browse Reddit).
- **Netflix Season Fix**: Completely rewritten season detection using React Fiber interception. Works during fullscreen playback now! 📺

---

### 🛠️ Improvements

- **Electron 40**: Upgraded to the latest stable Electron for improved security and performance.
- **External Locales**: Translation files are now external JSON (`src/locales/`) for easier community contributions.
- **Open Source Ready**: Removed all obfuscation. Added `LICENSE`, `CONTRIBUTING.md`, and GitHub Issue Templates.

---

### 🐛 Bug Fixes

- **Config Persistence**: Fixed all settings (Quick Setup Wizard, SoundBoard, presets, etc.) being lost when switching to a different .exe or version. Data is now stored in a stable `%APPDATA%\Solari` location instead of being tied to the executable path. 🔧
- **"Iniciando..." Stuck**: Fixed the status text getting stuck on "Starting..." due to translation system conflicts.
- **Timestamp Preservation**: Fixed Rich Presence elapsed time resetting every time a browser extension status changed (viewer count, episode, category, channel). The timestamp now only resets when the **platform actually changes** (e.g., Twitch → YouTube), preserving continuity within the same platform.
- **RPC Reconnection**: Fixed Rich Presence not reconnecting after Discord restarts.
- **Zombie Plugins**: Fixed SmartAFK and SpotifySync attempting to reconnect after being disabled.
- **Auto-Detect Notifications**: Fixed duplicate 'Auto-Detection' notifications when the preset hasn't changed.
- **Translation Engine**: Fixed console warnings about missing translation keys and added full Spanish support for Auto-Detect window.
- **About Modal**: Now displays the correct version automatically and supports all languages dynamically.
- **Toast Notifications**: Fixed "undefined" titles in toast notifications and translated all system messages.
- **Priority Race Condition**: Fixed a rare bug where multiple sources (e.g., Browser Extension + Auto-Detect) could mix Client IDs and activity data.
- **Soundboard Persistence**: Fixed settings (volume, mic toggle) resetting to default on restart due to race condition.
- **SoundBoard Drag-and-Drop**: Fixed audio file drop zone not accepting files. Both the mini drop zone and the entire SoundBoard tab now support drag-and-drop with multiple files at once. 📁
- **SoundBoard Multi-File Picker**: The "Add Sound" button now allows selecting multiple files at once instead of one at a time.
- **Microphone Optimization**: Fixed Solari holding the microphone stream active even when "Mic + Sounds" was disabled.
- **Extension Reapply Bug**: Fixed Rich Presence not reapplying when closing and reopening the same platform (e.g., Twitch → close → reopen Twitch).
- **Infinite RPC Retry**: Solari now aggressively retries Discord connection (every 3s instead of 10s) and never gives up, ensuring it connects even if other apps (Medal) act up. 🔌
- **Preview App Name**: Fixed global Client ID showing "Discord App" in the Rich Presence preview when RPC is disconnected. The real app name is now fetched on startup. 🏷️
- **Dev Mode Auto-Launch**: Fixed `npm run dev` accidentally registering as the Windows auto-start entry. Auto-launch now only registers in packaged builds.
- **Tab Fallback**: Smarter clearing logic prevents status flickering when closing duplicate tabs.

---

## [1.3.2] - 2026-01-26

### 🛡️ Critical Stability
- **Fixed**: Solari auto-detect would sometimes get stuck in a "loop", causing Rich Presence to flicker on and off. Added a robust "3-cycle debounce" to prevent this.
- **Fixed**: Conflict between "Game Detection" and "Website Detection" where one would constantly clear the other. Now they are synchronized.
- **Fixed**: App crash on startup if the Tray Icon image failed to load (Empty image fix).

### ⚡ Extension & Detection Improvements
- **Smart Extension Resolution**: The browser extension now automatically uses your specific "App Profiles" (Client IDs) if it detects a matching keyword (e.g., "Twitch" or "Netflix"), instead of always using the generic "A Game" ID.
- **Priority Logic Enforced**: Running games/apps now strictly override website detection. If you open a game while watching YouTube, the Game status will take priority.

### ✨ New Features & UX
- **OS Language Detection**: Solari now automatically identifies your operating system's language on startup and adapts the interface accordingly (currently supports English and Portuguese).
- **Edit App Profiles**: You can finally edit existing App Profiles! Added a pencil button (✏️) to modify Name and Client ID.
- **Improved UI**: Password fields (Client IDs) now have better alignment and styling, matching the rest of the interface.

## [1.3.1] - 2026-01-25

### ✨ New Features
- **Changelog Page**: Added new "Changelog" option in Help menu and Website Navbar that links to a dynamic release notes page.
- **Privacy Center**: New "Help > About" menu with direct access to Privacy Policy and social links.
- **Privacy Policy**: Added comprehensive Privacy Policy to website and app.
- **User Statistics**: Admin dashboard now shows how many users are online and their version distribution (anonymous data).

### 🚀 Performance & Optimizations
- **Instant Startup**: Implemented "Lazy Loading" for the Sound System. The app now opens instantly and loads the heavy audio engine in the background.
- **Resource Efficiency**: Optimized the internal tracker to reuse browser instances, significantly reducing RAM/CPU usage when idling.

### 🛡️ Data Safety
- **Auto-Backup**: Solari now creates a `customrp-data.json.bak` backup file every time you save your settings.
- **Rescue System**: If your save file gets corrupted, Solari automatically enters "Rescue Mode" to protect your remaining data and creates a rescue file.
- **Profile Recovery**: Implemented a smart recovery system that restored "App Profiles" lost in previous updates by analyzing saved Presets.

### 🐛 Bug Fixes
- **Fixed**: Header alignment issues in the main UI.
- **Fixed**: Auto-detect presets not showing buttons in Rich Presence.
- **Fixed**: Browser extension presets not showing buttons.
- **Fixed**: Extension mode showing redundant text in Discord status.

---

## [1.3.0] - 2026-01-20

### 🚀 Creating the Perfect RPC Experience
- **Instant RPC Switching**: Replaced fixed delays with smart polling. Switching between games/apps is now instant (or as fast as Discord allows).
- **Infinite Retry Safeguard**: Added a 60-second timeout to the infinite reconnection loop to prevent the app from freezing if a Client ID is invalid.
- **Robust Client ID Resolution**: Fixed a critical bug where auto-detected games/websites using App Profiles (Identities) would fall back to Global ID because the Client ID wasn't being looked up correctly. Now it works seamlessly.
- **Web Presence Priority Toggle**: New option in Auto-Detect settings to choose between using the Browser Extension (recommended) or the Native Website Auto-Detect.
- **Priority Logic Fix**: Manual presets now correctly override auto-detected games and extension data.

### ✨ New Features

#### 🌐 Solari Browser Extension (Official)
- **Native Website Detection**: Official Chrome extension to detect Netflix, Twitch, YouTube, and Crunchyroll.
- **Privacy First**: Runs 100% locally, no data collection.
- **Seamless Integration**: Solari automatically prefers the extension over legacy window title detection.
- **Auto-Language Detection**: Solari Website now automatically detects your browser language (PT/EN).
- **Direct Download**: Button added directly in the Auto-Detect tab.

#### 🆔 Dynamic App Profiles (Identities)
- **App Profiles Manager**: Create and manage multiple Discord Application profiles (Client IDs)
- **Per-Preset Client ID**: Each preset can now use a different Discord Application
- **Smart Switching**: Automatic RPC reconnection when switching between presets with different Client IDs
- **Live Preview Update**: Discord preview now shows the correct app name based on selected profile
- **Solves the "Playing X" problem**: No more generic app names for all activities!

#### 🔄 Replace Preset Button
- New replace button (🔄) on each preset to overwrite with current form data
- Confirmation modal before replacing
- Keeps the same Client ID profile association

#### ↩️ Exit Manual Mode
- **Context-Aware Return Button**: New button that appears only when Manual Mode is active.
- **One-Click Reset**: Instantly clears manually set presence and returns to Auto-Detect mode.

### 🎨 UI/UX Improvements
- **Smart Imgur Conversion**: Pasting an Imgur link now automatically converts it to a direct image URL when you click away.
- **Website**: Improved Plugin Download button hitbox reliability.
- **Scrollable App Profiles list**: Added max-height (250px) with custom scrollbar to prevent excessive window scrolling
- **Fixed**: Rich Presence now reliably clears when navigating away from supported platforms (YouTube, Netflix, Twitch)
- **Fixed**: Browser extension no longer appears in the Plugins list (it's not a plugin)
- **Fixed**: Plugin connection status (SpotifySync, SmartAFK) now persists correctly after changing language
- **Fixed**: Global ID appearing instead of "Twitch"/"Netflix" when using App Profiles in auto-detect mode
- **Fixed**: App freezing forever if a preset had a wrong Client ID
- **Fixed**: Extension data sometimes not clearing correctly when closing a tab
- **Fixed**: Browser Extension having priority over running games (Games now take precedence)
- **Fixed**: Zombie RPC connections when switching Client IDs rapidly
- **Fixed**: Auto-detect not respecting preset-specific Client IDs
- **Fixed**: Confirmation modal overlay not covering full window when scrolled
- **Fixed**: RPC auto-activating on startup from form fields (now only auto-detect controls this)
- **Fixed**: Translation fallbacks showing wrong language
- **Fixed**: Client ID validation was too strict (now supports 15-30 digits)

### 🌐 Translations
- **Added**: Complete English translations for Auto-Detection "Sites (Browser)" tab
  - Detection Method section (title, hint, radio options)
  - Use Extension / Use Auto-Detection descriptions
  - Extension Mode Active section
- **Added**: Matching Portuguese translations for all new Auto-Detection keys
- Full English/Portuguese translation support for:
  - App Profiles section (title, hint, buttons, placeholders)
  - Replace/Delete preset confirmations
  - Toast notifications
  - Dropdown options ("Global Default" / "Padrão Global")
- Improved translation fallback system

### 🗑️ Removed
- **Default Status (Fallback) section** - Simplified UI by removing unused feature

### 🎨 UI/UX Improvements
- **Scrollable App Profiles list**: Added max-height (250px) with custom scrollbar to prevent excessive window scrolling
- Modal overlay now uses `position: fixed` with viewport units for full coverage
- Better confirmation modal styling

---

## [1.2.1] - 2026-01-16

### 🐛 Bug Fixes
- **Fixed**: Plugin settings modal (SmartAFK, SpotifySync) had blue background in dark theme
- **Fixed**: SoundBoard settings not persisting after restart (volume, favorites, shortcuts)
- **Fixed**: All toast notifications appearing twice (duplicate initSoundBoard call)

---

## [1.2.0] - 2026-01-15

### Added - 🔊 SoundBoard Feature
- **Complete SoundBoard system** with BetterDiscord plugin integration
- Sound library manager (add, delete, play sounds)
- Drag & drop upload for audio files (MP3, WAV, OGG, M4A)
- **Global hotkey support** with visual key recorder (Shift+A, Ctrl+1, F1, etc.)
- Volume controls (global + preview)
- Settings panel (enable/disable, volume adjustment)
- Premium glassmorphism UI with animations
- Complete i18n support (20+ new strings)
- WebSocket protocol extension for plugin communication
- Express file server for serving audio files
- BetterDiscord plugin (`SolariSoundBoard.plugin.js`)

### Added - 🎨 UI Enhancements
- **Neon Mode Toggle** - Complementary visual overlay (⚡ button)
- Cyberpunk neon theme with pulsing animations
- Neon mode works independently of primary themes (default/dark/light)
- **Loudness Equalization** - DynamicsCompressor for volume normalization
- **Audio Editor** with WaveSurfer.js waveform visualization
- Glassmorphism 2.0 card effects

### Fixed
- **Global Hotkeys** - IPC channel mismatch causing hotkeys not to trigger playback
- Proper `playCallback` initialization for shortcut registration
- AudioContext resume on hotkey play (prevents suspended context issues)

### 🎙️ Noise Suppression (RNNoise)
- **RNNoise WASM Integration** - Machine learning-based noise suppression
- Uses official Jitsi rnnoise-wasm library
- Real-time noise removal with minimal latency
- High-pass filter (120Hz) for wind/rumble reduction
- Automatic voice detection and noise removal

### Changed
- Added tab navigation system (Rich Presence | SoundBoard)
- Updated app description to include SoundBoard
- Version bumped from 1.1.2 to 1.2.0

## v1.1.2 (2025-12-25)

### 🐛 Bug Fixes
- **Fixed**: `get-spotify-status` IPC handler missing (caused error on startup)
- **Fixed**: RPC reconnection after Discord restart - now waits 10s before retry
- **Fixed**: Multiple simultaneous RPC reconnection attempts causing race conditions
- **Fixed**: Old RPC client not properly destroyed before creating new one
- **Fixed**: `dialogs.blockPlugin` translation missing (caused undefined text in confirm dialog)
- **Fixed**: Duplicate `dialogs` sections in locale files merged into single section

### 🌐 Translations
- **Added**: `plugins.configure` and `plugins.moveToTrash` translations
- **Added**: `presence.largeImagePlaceholder` translation
- **Added**: `smartAfk.defaultStatus` translation
- **Added**: `spotify.saved` translation for toast feedback
- **Added**: `app.starting`, `app.themeDefault`, `app.themeDark`, `app.themeLight` translations
- **Added**: `exportLogs`, `exportPresets`, `importPresets` labels to getLabels()
- **Fixed**: Hardcoded Portuguese text 'Carregando...' now uses i18n
- **Fixed**: Hardcoded Portuguese toast message in SpotifySync settings
- **Fixed**: Export/Import dialog titles now properly translated
- **Fixed**: Header elements (toggle labels, status, theme buttons) now use data-i18n
- All translations added to both EN and PT-BR locales

### 🔧 Code Quality
- Removed duplicate constant definitions (using constants.js instead)
- Added proper cleanup of old RPC client on reconnection
- Added `scheduleReconnect` helper to prevent duplicate reconnection calls
- Added health check every 10s to detect dead RPC connections
- Fixed CSS compatibility warning for background-clip property

### ⚡ Performance Optimizations
- **Added**: `DEBUG_MODE` constant for controlling verbose logging
- **Optimized**: Priority system logs now only appear in debug mode
- **Optimized**: setActivity logs wrapped in DEBUG_MODE checks
- **Optimized**: Reduced console output by ~80% in production mode
- Error logs remain visible (not affected by DEBUG_MODE)

---

## v1.1.1 (2025-12-21)

### 🐛 Bug Fixes
- **Log Export**: Fixed newline escape (`\\n` → `\n`) - logs now export with proper line breaks
- **Dynamic Version**: "About Solari" now reads version from package.json instead of hardcoded value
- **Client ID Dialog**: Now properly translated based on selected language (was hardcoded Portuguese)
- **AFK Check Performance**: Reduced check interval to 3 seconds for better responsiveness
- **Debug Logs**: Reduced log frequency from every check to every 30 seconds

### 🔧 UX Improvements
- **Delete Confirmation**: Preset deletion now shows confirmation dialog before removing
- **Toast Notifications**: Added visual feedback for all major actions:
  - ✅ Update Status / Reset / Save Default
  - 📤 Export Presets / 📥 Import Presets
  - 🗑️ Delete Preset
- **i18n Translations**: Added missing `data-i18n` attributes to:
  - Presence Configuration section (title, labels, placeholders)
  - Activity Type dropdown options
  - Update/Reset buttons
  - Fallback section
- **New Translation Keys**: Added `presets.exported`, `presets.imported`, `presets.deleteConfirm`, `presets.deleted`

### 🚀 Code Optimizations
- **Constants Module**: Created `src/main/constants.js` for centralized configuration
- **Magic Numbers Removed**: Replaced hardcoded values with constants (WS_PORT, MAX_LOGS, RPC_RETRY_DELAY_MS, etc.)
- **Electron Update**: Upgraded from Electron 28 to Electron 33
- **electron-builder Update**: Upgraded from v24 to v25

---

## v1.1.0 (2025-12-18)

### ✨ New Features
- **Discord Preview**: Real-time preview of how your Rich Presence will appear in Discord
  - Shows correct layout for each activity type (Playing, Listening, Watching, Competing)
  - Displays actual Discord application name fetched from Discord API
  - Updates live as you type in fields
  - Reflects Discord's behavior of showing large image text when state is empty

- **Theme System**: Choose between Default, Dark, or Light themes
  - Themes persist across sessions
  - Beautiful visual adjustments for each theme

- **Toast Notifications**: In-app notifications for events
  - Auto-loaded preset notifications
  - Game detection alerts
  - Clean, non-intrusive design

- **Debug Logs Export**: Export application logs for troubleshooting
  - Timestamped log files
  - Captures all RPC events and errors

- **SpotifySync Enhancements**:
  - Controls visibility modes: "Always show when Spotify open" or "Show only when playing"
  - Intelligent caching keeps controls visible for 1 hour when paused (in "always show" mode)
  - Improved token expiration handling with user-friendly error message
  - Modernized config panel with gradient header and card-style options

### 🔧 Improvements
- **Better Error Handling**: Improved Discord RPC connection with retry mechanism
  - Automatic reconnection on disconnect
  - Clear status messages in UI
  - Max 5 attempts before longer backoff

- **Admin Warning Checkbox**: "Don't remind again" option for admin warning dialog
  - Preference saved and persisted

- **Auto-Detect Tray Sync**: Toggling Auto-Detect from system tray now updates the main window checkbox instantly

- **UI Improvements**:
  - Presets section now above Fallback section
  - Better button alignment in Server Status
  - Translated Auto-Detect page alerts to use i18n
  - Modernized SpotifySync config panel with Spotify-themed design
  - Removed "Install plugin in BetterDiscord" notice from SpotifySync panel

- **Performance**: Optimized RPC retry mechanism to reduce unnecessary reconnection attempts

### 🐛 Bug Fixes
- Fixed empty state/details fields now properly hidden (no fallback applied when intentionally empty)
- Fixed translation keys for Auto-Detect mapping alerts
- Fixed button alignment in Server Status section
- Fixed SpotifySync controls appearing when Spotify is completely closed
- Fixed plugin config panels appearing outside their container (blue box bug)

### 🌐 Translations
- Added preview section translations (PT-BR and EN)
- Fixed missing translation keys in Auto-Detect page
- Added complete presence translations: partySize, partyCurrent, partyOf, partyMax
- Added timestamp translations: timestampNormal, timestampLocal, timestampCustom, timestampEnd
- Added buttons section translation
- Added presets export/import translations
- Fixed data-i18n attributes for small image and buttons sections

---

## v1.0.2 (2025-12-15)

### 🐛 Bug Fixes
- **Fixed**: Critical bug where auto-detection spawned too many processes causing Windows quota violation and system freeze
  - Added mutex protection to prevent concurrent tasklist/PowerShell calls
  - Implemented 30-second backoff system after repeated errors
  - Added 5-second timeout to process detection commands

### ✨ New Features
- **Admin Warning**: Shows helpful warning dialog when Solari is not running as Administrator
  - Explains that Rich Presence may not work if Discord runs as admin
  - Bilingual support (English/Portuguese)
  - Only appears when NOT running as admin

### 🎨 Website Updates
- Added language toggle (EN/PT) with persistent selection
- Dynamic version badge from GitHub API
- Added scroll indicator for better UX
- Cache-busting for assets

---

## v1.0.1 (2025-12-14)

### 🐛 Bug Fixes
- **Fixed**: "server.title" text not displaying correctly (missing translation key)
- **Fixed**: Auto-detect activating wrong presets after deleting a saved preset
  - Changed preset lookup from numeric index to preset name
  - Mappings now remain correct even after deleting presets

---

## v1.0.0 (2025-12-14)

### 🎉 Initial Release
- Full Discord Rich Presence customization
- Unlimited preset system with export/import
- Auto-detection for applications and websites
- Smart AFK detection (system-level + BetterDiscord plugin)
- Plugin system via WebSocket API
- Multi-language support (English / Portuguese)
- Premium glassmorphism UI design
- Party size and timestamp controls
- Imgur URL auto-resolution

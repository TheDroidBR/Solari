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

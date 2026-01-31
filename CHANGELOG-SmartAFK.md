# SmartAFK Detector - Changelog

## v1.1.1 (2026-01-20)

### 🐛 Bug Fix
- **Fixed:** Custom status now properly syncs with Discord servers when cleared
- **Fixed:** Status no longer persists when opening Discord on another device after returning from AFK

### ⚡ Technical Changes
- **Changed:** `updateAsync` now uses `aca=1` (USER_GUILD_UPDATE) instead of `aca=0` for better server synchronization
- **New:** Added retry mechanism (3 attempts with delays) when clearing status to ensure server propagation
- **New:** Added detailed logging for status update attempts

---

## v1.1.0 (2024-12-24)

### 🐛 Critical Bug Fix
- **Fixed:** Status no longer gets permanently stuck on "Idle" when opening Discord on another device (mobile/browser)

### ⚡ Technical Changes
- **New:** Plugin now patches Discord's internal idle timeout modules instead of manually setting status
- **New:** Finds and patches all modules containing the 600000ms (10 min) idle constant
- **Changed:** Idle detection is now handled natively by Discord after timeout is patched
- **Changed:** Plugin only sets custom status text, no longer forces idle/online status
- **Changed:** Removed `expiresAtMs` from custom status to fix "unknown value object" error

### 🔧 How it works now
1. Plugin patches Discord's idle timeout from 10 minutes to your configured time
2. Discord natively detects inactivity and changes status to Idle
3. Plugin only adds the custom status text (e.g., "Away", "AFK")
4. Status syncs correctly across all devices because Discord manages it

---

## v1.0.0 (2024-12-14)

### 🎉 Initial Release
- Multi-tier AFK system with customizable times and status messages
- Integration with Solari app for system-wide idle detection
- Custom status text with auto-expiration
- BetterDiscord settings panel with modern UI
- Bilingual support (English / Portuguese)
- WebSocket sync with Solari desktop app

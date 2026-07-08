# Solari - Premium Discord Rich Presence

<div align="center">
  <img src="SolariPhotoTransparente.png" alt="Solari Logo" width="128" height="128">
  
  <h1>Solari RPC</h1>
  
  <p>
    <strong>The most advanced Rich Presence client for Discord.</strong>
  </p>

  <p>
    <a href="https://github.com/TheDroidBR/Solari/releases/latest">
      <img src="https://img.shields.io/github/v/tag/TheDroidBR/Solari?style=for-the-badge&color=orange" alt="Release">
    </a>
    <a href="https://www.solarirpc.com">
      <img src="https://img.shields.io/website?url=https%3A%2F%2Fsolarirpc.com&style=for-the-badge&label=Website" alt="Website">
    </a>
  </p>

  <h3>
    <a href="https://github.com/TheDroidBR/Solari/releases/latest/download/Solari-Setup.exe">📥 Download for Windows</a>
  </h3>
</div>

---

## ✨ About

**Solari** gives you total control over your Discord Status (Rich Presence). 
With a modern interface, unlimited presets, and a plugin system, you can show exactly what you are doing with style.

## 🚀 Features

- **🧩 Browser Extension**: Detects YouTube, YouTube Music, Netflix, Twitch, and Prime Video automatically.
- **🎨 8 Premium Custom Themes**: Sakura Breeze, Retro Amber, Swiss Brutalist, Aero Glass, E-Ink, Cyber-Noir, Polaroid 70s, and Aurora Polaris.
- **🔄 Browser Extension ID Mappings**: Customize presets and Client IDs dynamically for each platform.
- **✨ Setup Wizard Redesign**: Overhauled onboarding experience with interactive BetterDiscord plugin and browser extension controls.
- **🎵 YouTube Music Integration**: Dedicated extension integration with Listening status and real-time progress bar.
- **🔍 Quick-Search Client ID Modal**: Live search overlay to filter and select Client IDs instantly.
- **🖱️ Clickable Presence Images**: Link Large and Small images directly to URLs, making profile images interactive inside Discord.
- **🛡️ Fsync-Safe Atomic File Writes**: Prevents zero-byte file corruption on sudden power loss.
- **🔋 Eco Mode & Performance Overhaul**: Dynamically throttles background resource usage when minimized or in tray.
- **😴 Smart AFK**: Automatically switches to away status when you leave your PC.
- **🎵 Spotify Sync**: Control your music directly from Discord with our dedicated plugin.
- **🌐 Multi-Language**: Fully localized in English, Portuguese (Brazil), Spanish, and German.
- **🔌 Plugins**: Expandable system via BetterDiscord plugins.
- **💎 Premium Design**: Interface inspired by Cyberpunk/Glassmorphism.

## 📦 How to Install

1. Download the latest version from **[Releases](https://github.com/TheDroidBR/Solari/releases)**.
2. Run the `Solari-Setup.exe` file.
3. **(Optional)** Install the **Browser Extension** for website detection (included in release).
4. Done! Solari is portable and requires no complex installation.

## 🔑 How to Get a Client ID

To use Solari, you need a Discord Application Client ID. Here is how to get one:

1. Go to the **[Discord Developer Portal](https://discord.com/developers/applications)**.
2. Click on **"New Application"** (top right button).
3. Give it a name (e.g., "Playing Solari" or the name of the game/status you want to show).
4. Go to the **"Rich Presence"** → **"Art Assets"** tab to upload images (Large/Small Image Keys).
5. Go back to the **"General Information"** tab.
6. Copy the **"Application ID"**.
7. Paste this ID into Solari in the **"Client ID"** field.

## 🧩 Plugins (BetterDiscord)

Solari integrates with Discord via BetterDiscord plugins to enable advanced features. You can toggle and manage these plugins directly from the **Plugins** tab in the Solari App.

### 🔌 SmartAFK (Auto-Away)
Patches Discord's native idle detection to ensure perfect inactivity/away status synchronization across all your devices.
*   **Filename**: `SmartAFKDetector.plugin.js`

### 🎵 Spotify Sync
Integrates full playback controls (Play/Pause/Next/Previous), active lyrics viewer with auto-scroll, device picker, and real-time volume slider directly on your Discord profile. *(Requires Spotify Premium for full interactive controls)*.
*   **Filename**: `SpotifySync.plugin.js`

### 👑 Solari Manager (Core)
The core bridge plugin of the Solari ecosystem. Confirms BetterDiscord is running in real-time, displays connection status, and enables the desktop app to remotely toggle other plugins.
*   **Filename**: `SolariManager.plugin.js`

### 🎨 Solari Motion
The ultimate animation system for Discord. Features 28 animation types across 22 UI categories, stagger list entries cascades, a global intensity slider, cubic-bezier visual easing editor, and active FPS guard protection.
*   **Filename**: `SolariMotion.plugin.js`

### 📝 Solari Notes
A premium, glassmorphic floating notepad mounted cleanly into Discord's interface, allowing you to write notes that sync and save securely to your local PC.
*   **Filename**: `SolariNotes.plugin.js`

### ⚡ Solari MessageTools
Adds text macros (e.g., `/shrug`), active on-the-fly context menu message translation, quick double-click message edit, and incognito anti-typing mode.
*   **Filename**: `SolariMessageTools.plugin.js`

### 🎞️ Solari Player
Cinematic video player for Discord. Adds Theater Mode, Picture-in-Picture, speed controls, double-tap seek with ripple effects, and screenshot bypass capability.
*   **Filename**: `SolariPlayer.plugin.js`

### 🛠️ How to Install Plugins:
1. Move the `.plugin.js` files to your BetterDiscord **plugins** folder:
   - **Windows**: `%APPDATA%\BetterDiscord\plugins`
2. Enable them in Discord Settings under **Plugins**.


## 🛡️ Security

Solari is **Freeware and Open Source**, developed with a focus on privacy and security.
The code is fully transparent and available on GitHub under the GPL v2.0 license.

## 🔒 Privacy

Solari features a **Hybrid Telemetry Model** designed with your privacy in mind:

- **Basic Telemetry (Mandatory):** Collects minimal data to help us count active users, detect BetterDiscord installation health, and track extension usage history.
  - ✅ App version (e.g., "2.0.0")
  - ✅ Random ID (not tied to your identity)
  - ✅ BetterDiscord installation health status
  - ✅ Extension ever used history
- **Advanced Telemetry (Optional):** Collects additional non-identifiable usage information regarding the Solari ecosystem to help us improve the application. You can opt-out at any time via the "Privacidade" tab in settings.
- ❌ **What we NEVER collect:** No IP addresses, Discord tokens, personal data, or file contents.

This data is used solely for usage statistics. For more details, see our [Privacy Policy](https://solarirpc.com/privacy.html).

## 🔒 Security & Trust (SmartScreen)

**Solari** is safe, open-source software. Since we do not pay for a digital signature certificate (which costs hundreds of dollars), Windows SmartScreen may display a warning when opening the `.exe` for the first time.

**To open safely:**
1. Click on **"More info"**.
2. Click on **"Run anyway"**.

This happens only because we are an independent project. You can verify the entire source code here on GitHub.

> ⚠️ **Important:** By downloading any application or component from the Solari ecosystem, you automatically agree to the terms described in our [Privacy Policy](https://solarirpc.com/privacy.html).

## 👨‍💻 Credits

Developed by **[TheDroid](https://github.com/TheDroidBR)**.

---

<p align="center">
  © 2026 Solari RPC. All rights reserved.
</p>

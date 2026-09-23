# Plugins Changelog

## SolariMotion v1.0.3 (2026-07-08)
- 🛡️ **Fix Native Controls Overlap**: Narrowed imageViewer animation selectors to target only the image and video wrapper elements. This prevents CSS transforms on the parent modal from breaking the absolute positioning of Discord's native close, download, and share buttons, keeping them aligned at the edges rather than centered.

## SolariMotion v1.0.2 (2026-06-14)
- ⚙️ **Dynamic Configuration**: Fully integrated with the Solari APP's dynamic settings panel via local configuration schema export.
- 🔄 **Real-Time Synchronization**: Implemented a background file watcher to monitor settings changes from Solari APP and apply them instantly inside Discord.
- 🧹 **Resource Cleanup**: Properly unbinds and cleans up background file watcher instances upon plugin deactivation to prevent memory leaks.

## SolariMotion v1.0.1 (2026-05-29)
- 🚀 **Auto-Updater System**: Integrated a premium, fully-translated confirmation modal to notify you on update availability.
- 📋 **Integrated Changelog**: Automatically parses and shows native BetterDiscord changelog details on successful update.

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

## SolariNotes v1.0.4 (2026-05-29)
- 🚀 **Auto-Updater System**: Integrated a premium, fully-translated confirmation modal to notify you on update availability.
- 📋 **Integrated Changelog**: Automatically parses and shows native BetterDiscord changelog details on successful update.

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

## SolariPlayer v1.0.3 (2026-07-08)
- 🛡️ **Fix Overlap on Avatars**: Added strict asset URL filters to prevent the video player from attaching to animated user avatars, guild icons, custom banners, custom status emojis, and stickers inside the chat area and media viewer popups.

## SolariPlayer v1.0.2 (2026-05-29)
- 🚀 **Auto-Updater System**: Integrated a premium, fully-translated confirmation modal to notify you on update availability.
- 📋 **Integrated Changelog**: Automatically parses and shows native BetterDiscord changelog details on successful update.

## SolariPlayer v1.0.1 (2026-05-26)
- 🛡️ **WebRTC Call Exclusion**: Added a filter to ignore real-time video streams from voice/video calls, group chats, or screen shares. This prevents the player's controls from attaching to Discord's native RTC media components, correcting the bug where call control buttons (mic, camera, disconnect) would disappear.
- 🎞️ **GIF Controls Exclusion**: Added a strict filter to exclude autoplaying GIF videos (from Tenor, Giphy, or elements with GIF wrappers) from being injected with player controls, keeping them as seamless looping visuals.
- 📱 **Portrait Layout Auto-Adaptation**: Re-engineered vertical/portrait video controls using a robust JavaScript-based `ResizeObserver`. Conditionally renders and simplifies controls at narrow widths (<450px and <320px) to prevent any CSS horizontal clipping.
- ⏱️ **Time Overlay Staggering**: Added strict `white-space: nowrap;` rules to ensure duration labels never wrap on portrait wrappers.

## SolariPlayer v1.0.0 (2026-04-22)
- 🚀 **Initial Release**: A brand new Premium Video Player for Discord.
- 🎭 **Theater Mode**: Transforms any video into a cinematic, centered lightbox with a darkened background.
- ⚡ **Speed Control**: Advanced speed selector (0.5x, 1x, 1.25x, 1.5x, 2x) straight from the player.
- 📱 **Double Tap to Seek**: Instantly skip or rewind 10 seconds with a double tap on the sides of the video, complete with ripple animations.
- 🖼️ **Picture-in-Picture**: Watch videos in a floating window while browsing other channels.
- 📸 **Screenshot Bypass**: Easily capture video frames with our anti-CORS clone strategy.
- 🎨 **Glassmorphism UI**: Beautiful, fully customized controls using Solari's premium aesthetic, completely replacing Discord's native UI.

## SolariManager v1.0.1 (2026-05-29)
- 🚀 **Auto-Updater System**: Integrated a premium, fully-translated confirmation modal to notify you on update availability.
- 📋 **Integrated Changelog**: Automatically parses and shows native BetterDiscord changelog details on successful update.

## SolariManager v1.0.0 (2026-04-29)
- 🚀 **Initial Release**: Core manager plugin for the Solari ecosystem.
- 💓 **Runtime Heartbeat**: Sends a heartbeat every 30s confirming BD is alive, unlocking the new 'active' status badge in the Solari App.
- 🔌 **Remote Plugin Control**: Allows the Solari App to enable/disable any BetterDiscord plugin with a single toggle, relayed via WebSocket.
- 📋 **Plugin List Sync**: Reports the full list of installed BD plugins (name, version, enabled state) to the Solari App on connect and on demand.
- 🌍 **Language Sync**: Automatically syncs the language setting with the Solari App.
- 🛡️ **Self-Protection**: SolariManager cannot disable itself via remote commands.

## SolariMessageTools v1.0.1 (2026-05-29)
- 🚀 **Auto-Updater System**: Integrated a premium, fully-translated confirmation modal to notify you on update availability.
- 📋 **Integrated Changelog**: Automatically parses and shows native BetterDiscord changelog details on successful update.

## SolariMessageTools v1.0.0 (2026-05-28)
- 🚀 **Initial Release**: Message utilities integrated natively with Solari App.
- ⚡ **Text Macros**: Instant shortcuts like /shrug and /solari.
- 🌍 **Active Translation**: Translate incoming messages on the fly via context menus.
- ⚡ **Quick Edit**: Double click to edit, Shift+Click to delete instantly.
- 🤫 **Anti-Typing**: Prevent Discord from broadcasting your typing status.

## SmartAFKDetector v1.1.4 (2026-05-29)
- 🚀 **Auto-Updater System**: Integrated a premium, fully-translated confirmation modal to notify you on update availability.
- 📋 **Integrated Changelog**: Automatically parses and shows native BetterDiscord changelog details on successful update.

## SmartAFKDetector v1.1.3 (2026-04-05)
- 🚀 **Critical Fix (Status Stuck):** Solved a Discord API Rate Limiting issue (HTTP 429) that caused the AFK Custom Status to appear cleared locally, but remain stuck globally.
- 🛡️ **Improvement:** Removed 5-second aggressive spam and implemented a safe 4-minute network renewal to keep the AFK Status perfectly synced and stable.

## SpotifySync v3.1.0 (2026-09-23)
- ⚡ **Smart Play & Auto PC Wake**: Pressionar o botão de Play quando nenhum dispositivo estiver reproduzindo ativamente faz o plugin buscar automaticamente os aparelhos na rede Spotify Connect, identificar o computador atual e transferir a reprodução para ele instantaneamente.
- 💻 **Priorização Inteligente do Computador Atual**: Implementado detector de hostname local (`os.hostname` / `COMPUTERNAME`) para destacar o PC do usuário com o badge "Este Computador (Recomendado)" no topo do seletor de dispositivos.
- 🎵 **Resiliência e Retomada Automática**: Quando o Spotify fica ocioso por muito tempo e a fila de reprodução é esvaziada pela API, o plugin recupera a última música tocada e inicia a reprodução sem que o usuário precise abrir ou interagir manualmente com o cliente do Spotify.
- 🎛️ **Card de Prontidão Ociosa (Idle Ready State)**: Em vez de desaparecer ou ficar congelado como "Não Tocando", o widget agora exibe o status de prontidão com o computador alvo e mantém o botão de Play pronto para despertar.
- 🔄 **Botão de Atualizar Dispositivos**: Adicionado botão de atualização rápida no cabeçalho do Spotify Connect para detectar aparelhos recém-abertos instantaneamente.
- 🎚️ **Barra de Volume Expandida & Ergonômica**: Barra compacta expandida para 104px no hover/foco com 22px de área de clique vertical (hit target), preenchimento gradiente dinâmico com a cor de destaque do Spotify (`--ss-vol-pct`) e thumb tátil de 14px com zoom de arrasto.
- 🖱️ **Scroll Gradual e Suave de Volume**: O ajuste de volume pela roda do mouse agora progride em passos suaves de 2% em 2% (ou micro-ajuste de 1% em 1% segurando Shift, Ctrl ou em touchpads contínuos), com atualização visual imediata e debounce de 75ms.
- 📜 **Correção Crítica nas Letras (Início da Música Inacessível)**: Corrigido o bug que cortava as estrofes do começo da música devido ao alinhamento vertical flexbox com overflow (`justify-content: center`). Removido o contêiner de rolagem duplo, permitindo rolar com perfeição de 00:00 até o final.
- 🎯 **Rolagem Inteligente nas Letras & Botão Sincronizar**: Adicionada pausa automática na rolagem acompanhada quando o usuário rola manualmente para ler a letra com o mouse, acompanhada de botão flutuante "Sincronizar letra" para retornar suavemente à estrofe ativa.
- 🔇 **Isolamento de Scroll nas Letras e Subtelas**: Corrigido bug em que usar a rodinha do mouse na visualização de letras acionava o ajuste de volume e o badge flutuante em vez de rolar a letra. As subtelas agora isolam eventos de wheel com prioridade nativa.
- 🎚️ **Retração Fluida da Barra de Volume Compacta**: Corrigido bug em que clicar na barra deslizante deixava o slider travado em estado expandido mesmo após o mouse sair da barra. Removida retenção de foco do DOM com liberação e recolhimento instantâneo no mouseleave.
- 💾 **Persistência do Modo Compacto/Expandido**: O player agora memoriza e salva automaticamente sua preferência de modo recolhido ou expandido ao clicar na seta do accordion (`ss2-btn-expand`), preservando o estado escolhido entre reinicializações do Discord e trocas de faixas.
- ⚙️ **Novas Configurações**: Adicionadas opções para ativar/desativar as sugestões em repouso e a preferência pelo computador atual nas configurações do plugin.

## SpotifySync v3.0.1 (2026-09-17)
- ⏯️ **Compact Mode Playback Controls**: Restored and optimized Play/Pause, Previous, and Next track buttons directly inside the collapsed header row for instant 1-click playback navigation.
- 🎚️ **Collapsible Hover Volume & Fluid Header Layout**: Re-engineered the compact volume slider to smoothly expand on hover/focus and collapse when idle, giving priority to playback controls and track title legibility without cluttering narrow sidebars.
- 🛡️ **Always-Active Controls Logic**: Decoupled compact controls from the idle visibility filter, ensuring Play, Pause, and Skip actions remain instantly accessible even when playback is paused.
- 🔊 **Precise Volume Clamping**: Fixed a bug where scrolling the mouse wheel below 0% caused volume to reset to 50% due to falsy zero evaluation, ensuring stable clamping between 0% and 100%.

## SpotifySync v3.0.0 (2026-09-17)
- 🚀 **Next-Gen Total Overhaul**: Redesigned from the ground up for maximum responsiveness, zero lag, and premium glassmorphic aesthetics.
- 👑 **Full Spotify Premium Powers**: Comprehensive visual indicators, intuitive guidance, and seamless remote playback capabilities (Timeline Seek, Volume Slider, Like/Unlike, Track Skipping, Queue, Playlists, and Spotify Connect). Sleek Hero Card view even when disconnected.
- 🎴 **Expanded Hero Card & Dynamic Ambient Glow**: Enlarged 64px album art presentation with real-time dynamic ambient glow matching the active track's cover palette via offscreen canvas.
- 🎛️ **Independent Expanded & Compact Controls**: Dedicated playback and volume controls for both widget modes without duplication. In compact mode, adjust volume with a popup slider or mouse wheel scroll with live percentage badge.
- 🔊 **Spotify Connect Device Hub & Instant Volume Sync**: Seamlessly transfer playback between PC, Phone, TV, or smart speakers with friendly device name toasts and automatic volume slider synchronization to the new active device.
- 🥁 **Beat-Synced Dynamic Visualizer**: 4-bar equalizer smoothly animated to the real-time tempo (BPM) and rhythm energy of the song via Spotify Web API.
- ⚡ **Zero-Polling Flux Architecture**: Direct subscriptions to Discord native Flux Dispatchers (`SPOTIFY_PLAYER_STATE`, `LOCAL_ACTIVITY_UPDATE`) with 60fps `requestAnimationFrame` progress interpolation, drastically reducing CPU/battery usage.
- 📜 **Enlarged Synced Lyrics Experience**: Expansive lyrics view inside the sidebar (up to 85vh) with smooth centered auto-scroll, active verse luminescence, and 1-click line copying.
- 🔄 **Reactive Real-Time Settings**: BetterDiscord's settings modal updates instantly upon connection or token refresh without needing to close and reopen.
- 🔗 **Dual-Sync & Local OAuth Server**: 1-click authentication with automatic local callback capture on port 8888 or direct redirect URL pasting.
- 📑 **Play Queue Explorer & Library**: Browse upcoming songs and start playlists directly from your Discord sidebar.
- 🛠️ **Restored Comprehensive Settings**: Brought back full control granularity (`controlsVisibility`, `startCompact`, `showControls`, `showAlbumArt`, `showProgressBar`, `showVisualizer`, `dynamicTheme`, `showLikeButton`, `showShuffleRepeat`, `showVolumeSlider`, `showLyricsButton`, `showQueueButton`, `showDevicesButton`, `showPlaylistsButton`, `showShareButton`).

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

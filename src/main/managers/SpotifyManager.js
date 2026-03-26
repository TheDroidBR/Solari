const { ipcMain, shell } = require('electron');
const WebSocket = require('ws'); // Assuming it's used for broadcasting

class SpotifyManager {
    constructor(mainWindow, wss, appSettings, saveData) {
        this.mainWindow = mainWindow;
        this.wss = wss;
        this.appSettings = appSettings;
        this.saveData = saveData;
        this.spotifyClientId = '';
        this.spotifyTokens = { accessToken: null, refreshToken: null, tokenExpiry: 0 };
        this.spotifyConnected = false;

        this.setupIpc();
    }

    setupIpc() {
        // IPC handler for Spotify status
        ipcMain.handle('get-spotify-status', () => {
            return {
                connected: !!(this.spotifyTokens.accessToken && this.spotifyTokens.refreshToken),
                accessToken: this.spotifyTokens.accessToken,
                clientId: this.spotifyClientId
            };
        });

        // IPC: Set Spotify Client ID
        ipcMain.on('set-spotify-client-id', (event, id) => {
            this.spotifyClientId = id;
            this.saveData();
            console.log('[SpotifyManager] Spotify Client ID updated:', id);
            this.broadcastToPlugins({
                type: 'update_spotify_settings',
                settings: { spotifyClientId: id }
            });
        });

        // IPC: Spotify Login
        ipcMain.on('spotify-login', () => {
            console.log('[SpotifyManager] Triggering Spotify Login in Plugin...');
            this.broadcastToPlugins({ type: 'start_spotify_auth' });
        });

        // IPC: Spotify Finish Auth
        ipcMain.on('spotify-finish-auth', (event, codeOrUrl) => {
            console.log('[SpotifyManager] Finishing Spotify Auth in Plugin...');
            this.broadcastToPlugins({
                type: 'finish_spotify_auth',
                code: codeOrUrl
            });
        });

        // IPC: Spotify Logout
        ipcMain.on('spotify-logout', () => {
            console.log('[SpotifyManager] Spotify Logout...');
            this.spotifyTokens = { accessToken: null, refreshToken: null, tokenExpiry: 0 };
            this.saveData();
            this.broadcastToPlugins({
                type: 'update_spotify_settings',
                settings: {
                    spotifyAccessToken: '',
                    spotifyRefreshToken: '',
                    spotifyTokenExpiry: 0
                }
            });
            if (this.mainWindow) {
                this.mainWindow.webContents.send('spotify-status-update', {
                    loggedIn: false,
                    clientId: this.spotifyClientId
                });
            }
        });

        // Spotify Control
        ipcMain.on('spotify-control', (event, action) => {
            console.log(`[SpotifyManager] Spotify control: ${action}`);
            this.broadcastToPlugins({
                type: 'spotify_control',
                action: action
            });
        });

        // Update Spotify Settings
        ipcMain.on('update-spotify-settings', (event, settings) => {
            this.broadcastToPlugins({
                type: 'update_spotify_settings',
                settings: settings
            });
        });
    }

    handlePluginMessage(ws, data) {
        if (data.type === 'spotify_status_update') {
            this.spotifyConnected = data.connected;
            this.spotifyTokens = {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                tokenExpiry: data.tokenExpiry
            };
            this.saveData();
            if (this.mainWindow) {
                this.mainWindow.webContents.send('spotify-status-update', {
                    loggedIn: data.connected,
                    clientId: this.spotifyClientId
                });
            }
        } else if (data.type === 'spotify_track_updated') {
            if (this.mainWindow) {
                this.mainWindow.webContents.send('spotify-track-updated', data.track);
            }
        }
    }

    broadcastToPlugins(payload) {
        if (this.wss) {
            this.wss.clients.forEach(client => {
                if (client.readyState === 1) { // WebSocket.OPEN
                    client.send(JSON.stringify(payload));
                }
            });
        }
    }

    toJSON() {
        return {
            spotifyClientId: this.spotifyClientId,
            spotifyTokens: this.spotifyTokens
        };
    }

    fromJSON(data) {
        if (data) {
            this.spotifyClientId = data.spotifyClientId || '';
            this.spotifyTokens = data.spotifyTokens || { accessToken: null, refreshToken: null, tokenExpiry: 0 };
        }
    }
}

module.exports = SpotifyManager;

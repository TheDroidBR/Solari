const express = require('express');
const path = require('path');
const fs = require('fs');

class SoundServer {
    constructor(soundBoard, port = 6465) {
        this.soundBoard = soundBoard;
        this.port = port;
        this.app = express();
        this.server = null;

        this.setupRoutes();
    }

    setupRoutes() {
        // CORS for local access
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });

        // Serve sound files
        this.app.get('/sounds/:soundId', (req, res) => {
            const { soundId } = req.params;
            const sound = this.soundBoard.getSoundById(soundId);

            if (!sound || !fs.existsSync(sound.path)) {
                return res.status(404).json({ error: 'Sound not found' });
            }

            res.sendFile(sound.path);
        });

        // Get sound list
        this.app.get('/sounds', (req, res) => {
            const sounds = this.soundBoard.sounds.map(s => ({
                id: s.id,
                name: s.name,
                filename: s.filename,
                category: s.category,
                size: s.size
            }));
            res.json(sounds);
        });

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', port: this.port });
        });
    }

    start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.port, '127.0.0.1', () => {
                    console.log(`[SoundServer] Listening on http://127.0.0.1:${this.port}`);
                    resolve(this.port);
                });

                this.server.on('error', (err) => {
                    if (err.code === 'EADDRINUSE') {
                        console.log(`[SoundServer] Port ${this.port} in use, trying ${this.port + 1}`);
                        this.port += 1;
                        this.start().then(resolve).catch(reject);
                    } else {
                        reject(err);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log('[SoundServer] Stopped');
        }
    }

    getBaseUrl() {
        return `http://127.0.0.1:${this.port}`;
    }
}

module.exports = SoundServer;

const express = require('express');
const path = require('path');
const fs = require('fs');

// UUID v4 format validator
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class SoundServer {
    constructor(soundBoard, port = 6465) {
        this.soundBoard = soundBoard;
        this.port = port;
        this.app = express();
        this.server = null;
        this.maxPortRetries = 10;

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

            // Validate soundId format before lookup
            if (!UUID_REGEX.test(soundId)) {
                return res.status(400).json({ error: 'Invalid sound ID format' });
            }

            const sound = this.soundBoard.getSoundById(soundId);

            if (!sound) {
                console.error(`[SoundServer] Sound not found: ${soundId}`);
                return res.status(404).json({ error: 'Sound not found' });
            }

            if (!fs.existsSync(sound.path)) {
                console.error(`[SoundServer] File missing: ${sound.path}`);
                return res.status(404).json({ error: 'Sound file missing' });
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

    start(retryCount = 0) {
        return new Promise((resolve, reject) => {
            if (retryCount >= this.maxPortRetries) {
                reject(new Error(`[SoundServer] Failed to find open port after ${this.maxPortRetries} attempts`));
                return;
            }

            try {
                this.server = this.app.listen(this.port, '127.0.0.1', () => {
                    console.log(`[SoundServer] Listening on http://127.0.0.1:${this.port}`);
                    resolve(this.port);
                });

                this.server.on('error', (err) => {
                    if (err.code === 'EADDRINUSE') {
                        console.log(`[SoundServer] Port ${this.port} in use, trying ${this.port + 1}`);
                        this.port += 1;
                        this.start(retryCount + 1).then(resolve).catch(reject);
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

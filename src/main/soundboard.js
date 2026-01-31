const fs = require('fs');
const path = require('path');
const { app, globalShortcut } = require('electron');
const { v4: uuidv4 } = require('uuid');

class SoundBoard {
    constructor() {
        this.soundsDir = path.join(app.getPath('userData'), 'sounds');
        this.defaultSoundsDir = path.join(this.soundsDir, 'default');
        this.customSoundsDir = path.join(this.soundsDir, 'custom');
        this.sounds = [];
        this.categories = ['default', 'custom']; // User-defined categories
        this.playHistory = []; // Last played sounds
        this.settings = {
            enabled: true, // Default to enabled
            globalVolume: 0.8,
            previewVolume: 0.5,
            viewMode: 'grid',
            showFavoritesFirst: true,
            maxHistoryItems: 10
        };

        this.ensureDirectories();
    }

    ensureDirectories() {
        [this.soundsDir, this.defaultSoundsDir, this.customSoundsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    loadSounds() {
        // Load sounds from both default and custom directories
        const defaultSounds = this.scanDirectory(this.defaultSoundsDir, 'default');
        const customSounds = this.scanDirectory(this.customSoundsDir, 'custom');
        this.sounds = [...defaultSounds, ...customSounds];
        return this.sounds;
    }

    scanDirectory(dir, category) {
        const sounds = [];
        try {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const ext = path.extname(file).toLowerCase();
                if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
                    const filePath = path.join(dir, file);
                    const stats = fs.statSync(filePath);
                    sounds.push({
                        id: uuidv4(),
                        name: path.basename(file, ext),
                        filename: file,
                        category: category,
                        customCategory: null, // User-defined category
                        path: filePath,
                        size: stats.size,
                        shortcut: null,
                        volume: 1.0,
                        favorite: false,
                        color: null, // Hex color for visual organization
                        loop: false,
                        dateAdded: stats.birthtime
                    });
                }
            });
        } catch (e) {
            console.error(`[SoundBoard] Error scanning directory ${dir}:`, e);
        }
        return sounds;
    }

    addSound(sourcePath, name = null, category = 'custom') {
        try {
            const ext = path.extname(sourcePath);
            const soundName = name || path.basename(sourcePath, ext);
            const filename = `${soundName}${ext}`;
            const targetDir = category === 'default' ? this.defaultSoundsDir : this.customSoundsDir;
            const targetPath = path.join(targetDir, filename);

            // Copy file
            fs.copyFileSync(sourcePath, targetPath);

            const sound = {
                id: uuidv4(),
                name: soundName,
                filename: filename,
                category: category,
                customCategory: null,
                path: targetPath,
                size: fs.statSync(targetPath).size,
                shortcut: null,
                volume: 1.0,
                favorite: false,
                color: null,
                loop: false,
                dateAdded: new Date()
            };

            this.sounds.push(sound);
            return sound;
        } catch (e) {
            console.error('[SoundBoard] Error adding sound:', e);
            throw e;
        }
    }

    deleteSound(soundId) {
        const soundIndex = this.sounds.findIndex(s => s.id === soundId);
        if (soundIndex === -1) return false;

        const sound = this.sounds[soundIndex];
        try {
            // Delete file
            if (fs.existsSync(sound.path)) {
                fs.unlinkSync(sound.path);
            }
            // Remove from array
            this.sounds.splice(soundIndex, 1);
            return true;
        } catch (e) {
            console.error('[SoundBoard] Error deleting sound:', e);
            return false;
        }
    }

    updateSound(soundId, updates) {
        const sound = this.sounds.find(s => s.id === soundId);
        if (!sound) return null;

        // Update allowed fields
        if (updates.name !== undefined) sound.name = updates.name;
        if (updates.shortcut !== undefined) sound.shortcut = updates.shortcut;
        if (updates.volume !== undefined) sound.volume = Math.max(0, Math.min(1, updates.volume));
        if (updates.favorite !== undefined) sound.favorite = updates.favorite;
        if (updates.color !== undefined) sound.color = updates.color;
        if (updates.loop !== undefined) sound.loop = updates.loop;
        if (updates.customCategory !== undefined) sound.customCategory = updates.customCategory;

        return sound;
    }

    // Toggle favorite status
    toggleFavorite(soundId) {
        const sound = this.sounds.find(s => s.id === soundId);
        if (!sound) return null;
        sound.favorite = !sound.favorite;
        return sound;
    }

    // Get favorites
    getFavorites() {
        return this.sounds.filter(s => s.favorite);
    }

    // Add to play history
    addToHistory(soundId) {
        const sound = this.sounds.find(s => s.id === soundId);
        if (!sound) return;

        // Remove if already in history
        this.playHistory = this.playHistory.filter(h => h.id !== soundId);

        // Add to front
        this.playHistory.unshift({
            id: soundId,
            name: sound.name,
            playedAt: new Date()
        });

        // Keep only max items
        if (this.playHistory.length > this.settings.maxHistoryItems) {
            this.playHistory = this.playHistory.slice(0, this.settings.maxHistoryItems);
        }
    }

    // Get sounds by category
    getSoundsByCategory(category) {
        return this.sounds.filter(s => s.customCategory === category || s.category === category);
    }

    // Add custom category
    addCategory(name) {
        if (!this.categories.includes(name)) {
            this.categories.push(name);
        }
        return this.categories;
    }

    // Remove custom category
    removeCategory(name) {
        if (name !== 'default' && name !== 'custom') {
            this.categories = this.categories.filter(c => c !== name);
            // Reset sounds in this category
            this.sounds.forEach(s => {
                if (s.customCategory === name) s.customCategory = null;
            });
        }
        return this.categories;
    }

    getSoundById(soundId) {
        return this.sounds.find(s => s.id === soundId);
    }

    getSoundByShortcut(shortcut) {
        return this.sounds.find(s => s.shortcut === shortcut);
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        return this.settings;
    }

    // --- GLOBAL SHORTCUTS HANDLER ---

    initializeShortcuts(playCallback) {
        this.playCallback = playCallback; // Logic to execute when hotkey is pressed
        this.unregisterAllShortcuts(); // Clean slate

        let registerCount = 0;
        this.sounds.forEach(sound => {
            if (sound.shortcut) {
                this.registerShortcut(sound.id, sound.shortcut);
                registerCount++;
            }
        });
        console.log(`[SoundBoard] Initialized ${registerCount} global shortcuts.`);
    }

    registerShortcut(soundId, accelerator) {
        const sound = this.getSoundById(soundId);
        if (!sound) return false;

        // Unregister potential old shortcut or conflict
        if (sound.shortcut && globalShortcut.isRegistered(sound.shortcut)) {
            globalShortcut.unregister(sound.shortcut);
        }

        try {
            const success = globalShortcut.register(accelerator, () => {
                console.log(`[SoundBoard] Hotkey pressed: ${accelerator} -> Playing ${sound.name}`);
                if (this.playCallback) this.playCallback(sound.id);
            });

            if (success) {
                sound.shortcut = accelerator;
                return true;
            } else {
                console.warn(`[SoundBoard] Failed to register hotkey: ${accelerator}`);
                return false;
            }
        } catch (e) {
            console.error('[SoundBoard] Shortcut register error:', e);
            return false;
        }
    }

    unregisterShortcut(soundId) {
        const sound = this.getSoundById(soundId);
        if (!sound || !sound.shortcut) return false;

        globalShortcut.unregister(sound.shortcut);
        sound.shortcut = null;
        return true;
    }

    unregisterAllShortcuts() {
        globalShortcut.unregisterAll();
    }

    // Data persistence helpers
    toJSON() {
        return {
            sounds: this.sounds.map(s => ({
                id: s.id,
                name: s.name,
                filename: s.filename,
                category: s.category,
                customCategory: s.customCategory,
                shortcut: s.shortcut,
                volume: s.volume,
                favorite: s.favorite,
                color: s.color,
                loop: s.loop
            })),
            settings: this.settings,
            categories: this.categories,
            playHistory: this.playHistory
        };
    }

    fromJSON(data) {
        if (data.settings) {
            this.settings = { ...this.settings, ...data.settings };
        }
        if (data.categories) {
            this.categories = data.categories;
        }
        if (data.playHistory) {
            this.playHistory = data.playHistory;
        }
        if (data.sounds) {
            // Reconstruct sounds with full paths
            this.sounds = data.sounds.map(s => {
                const dir = s.category === 'default' ? this.defaultSoundsDir : this.customSoundsDir;
                const filePath = path.join(dir, s.filename);
                return {
                    ...s,
                    path: filePath,
                    size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
                    dateAdded: new Date()
                };
            });
        }
    }
}

module.exports = SoundBoard;

const { exec } = require('child_process');

class AutoDetectManager {
    constructor(constants, debugMode = false) {
        this.CONSTANTS = constants;
        this.debugMode = debugMode;
        this.isBrowserCheckRunning = false;
        this.processCheckBackoffUntil = 0;
        this.currentDetectedProcess = null;
        this.currentDetectedWebsite = null;
    }

    async scanProcesses() {
        if (Date.now() < this.processCheckBackoffUntil) return [];

        return new Promise((resolve) => {
            const command = 'tasklist /NH /FO CSV';
            exec(command, { timeout: this.CONSTANTS.PROCESS_TIMEOUT_MS, maxBuffer: this.CONSTANTS.EXEC_MAX_BUFFER }, (error, stdout) => {
                if (error) {
                    if (this.debugMode) console.error('[AutoDetect] Error scanning processes:', error);
                    resolve([]);
                    return;
                }

                const lines = stdout.split('\n');
                const processes = lines.map(line => {
                    const parts = line.split('","');
                    return parts[0] ? parts[0].replace(/"/g, '') : null;
                }).filter(Boolean);

                resolve(processes);
            });
        });
    }

    async scanBrowsers() {
        if (this.isBrowserCheckRunning || Date.now() < this.processCheckBackoffUntil) return [];

        return new Promise((resolve) => {
            // Optimized command from v1.11.1
            const tasklistCommand = `tasklist /V /FI "STATUS eq running" /FO CSV /NH | findstr /I "brave chrome firefox msedge opera"`;
            this.isBrowserCheckRunning = true;

            exec(tasklistCommand, { encoding: 'utf8', timeout: 5000, maxBuffer: this.CONSTANTS.EXEC_MAX_BUFFER }, (error, stdout) => {
                this.isBrowserCheckRunning = false;
                if (error || !stdout) {
                    resolve([]);
                    return;
                }

                // Parse titles from tasklist /V output
                const lines = stdout.trim().split('\n');
                const titles = lines.map(line => {
                    try {
                        const parts = line.split('","');
                        // In CSV format, title is the last column (index 8 for tasklist /V)
                        const title = parts[parts.length - 1] ? parts[parts.length - 1].replace(/"/g, '') : '';
                        return title;
                    } catch (e) { return null; }
                }).filter(t => t && t.length > 3);

                resolve(titles);
            });
        });
    }

    checkMatch(activeProcesses, activeTitles, mappings) {
        // ... (Logic from index.js)
    }
}

module.exports = AutoDetectManager;

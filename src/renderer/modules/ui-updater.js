/**
 * Solari - UI: In-App Update Check
 *
 * Handles the silent update check badge and the update button click.
 * Extracted from the IIFE in renderer.js.
 *
 * Usage:
 *   const updater = require('./ui-updater');
 *   updater.init();
 *
 * @module ui-updater
 */

'use strict';

const { ipcRenderer } = require('electron');
const { t } = require('../i18n');

function init() {
    const updateBtn = document.getElementById('updateAvailableBtn');
    const updateLabel = document.getElementById('updateVersionLabel');
    if (!updateBtn) return;

    async function checkSilently() {
        try {
            const result = await ipcRenderer.invoke('check-update-silent');
            if (result?.hasUpdate) {
                if (updateLabel) updateLabel.textContent = `v${result.latestVersion}`;
                updateBtn.title = `${t('settings.updateAvailableTitle') || 'Update available!'} v${result.latestVersion}`;
                updateBtn.style.display = 'inline-flex';
            } else {
                updateBtn.style.display = 'none';
            }
        } catch (e) {
            console.error('[Solari] Silent update check failed:', e);
        }
    }

    // Initial check after 5 s, then every 10 min
    setTimeout(checkSilently, 5000);
    setInterval(checkSilently, 600000);

    updateBtn.addEventListener('click', () => {
        updateBtn.textContent = '⏳';
        updateBtn.disabled = true;
        ipcRenderer.send('trigger-update-via-splash');
    });
}

module.exports = { init };

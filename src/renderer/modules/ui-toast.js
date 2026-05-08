/**
 * Solari - UI: Toast Notification System
 *
 * Provides in-app toast notifications for the renderer.
 * Self-contained — no external imports needed.
 *
 * Usage:
 *   const toast = require('./ui-toast');
 *   toast.show('Preset saved!', 'success');
 *   toast.show('Connection error', 'error', 6000);
 *
 * @module ui-toast
 */

'use strict';

/**
 * Show a toast notification at the bottom-right of the screen.
 * @param {string} message
 * @param {'success'|'info'|'warning'|'error'} type
 * @param {number} [duration=4000]
 */
function show(message, type = 'info', duration = 4000) {
    let container = document.getElementById('solariToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'solariToastContainer';
        container.className = 'solari-toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: '✅', info: 'ℹ️', warning: '⚠️', error: '❌' };

    const toast = document.createElement('div');
    toast.className = `solari-toast solari-toast-${type}`;
    toast.innerHTML = `<span class="solari-toast-icon">${icons[type] || icons.info}</span><span class="solari-toast-msg">${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

module.exports = { show };

/**
 * Solari - UI: Changelog Modal
 *
 * Displays release notes on first launch of a new version.
 * Registered globally so it can be triggered from an IPC event.
 *
 * Usage:
 *   const changelog = require('./ui-changelog');
 *   changelog.init();  // registers the IPC listener
 *
 * @module ui-changelog
 */

'use strict';

const { ipcRenderer } = require('electron');
const { t } = require('../i18n');

/**
 * Basic Markdown → HTML converter (no external deps).
 * Handles headers, bold, italic, lists, links, inline code, code blocks.
 * @param {string} md
 * @returns {string}
 */
function convertMarkdownToHtml(md) {
    if (!md) return '';

    let html = md
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/```([^`]*?)```/gs, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/^### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^## (.+)$/gm, '<h3>$1</h3>')
        .replace(/^# (.+)$/gm, '<h2>$1</h2>')
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    return '<p>' + html + '</p>';
}

/**
 * Show the changelog modal.
 * @param {{ version: string, body: string, name: string }} data
 */
function show({ version, body, name }) {
    if (document.getElementById('changelogModal')) return;

    const htmlBody = convertMarkdownToHtml(body);

    const overlay = document.createElement('div');
    overlay.id = 'changelogModal';
    overlay.className = 'changelog-overlay';
    overlay.innerHTML = `
        <div class="changelog-container">
            <div class="changelog-header">
                <div class="changelog-title-row">
                    <span class="changelog-icon">🎉</span>
                    <h2>${name || 'Solari v' + version}</h2>
                </div>
                <p class="changelog-subtitle">${t('changelog') || 'Changelog'}</p>
            </div>
            <div class="changelog-body">${htmlBody}</div>
            <div class="changelog-footer">
                <button class="btn-primary changelog-close-btn" id="closeChangelogBtn">
                    ${t('wizard.start') || 'OK'}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    const close = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    };

    document.getElementById('closeChangelogBtn')?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

/**
 * Register the IPC listener. Must be called once at startup.
 */
function init() {
    ipcRenderer.on('show-changelog', (_event, data) => show(data));
}

module.exports = { init, show, convertMarkdownToHtml };

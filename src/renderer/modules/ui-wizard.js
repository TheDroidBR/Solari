/**
 * Solari - UI: Confetti + Wizard Drag
 *
 * Standalone animations used by the Setup Wizard.
 * No imports required.
 *
 * Usage:
 *   const wizard = require('./ui-wizard');
 *   wizard.init();        // registers drag events
 *   wizard.confetti();    // launches confetti burst
 *
 * @module ui-wizard
 */

'use strict';

/**
 * Launch a confetti particle burst centered in the setup wizard.
 */
function confetti() {
    const canvas = document.createElement('canvas');
    const container = document.getElementById('setupWizard');
    if (!container) return;

    Object.assign(canvas.style, {
        position: 'absolute', top: '0', left: '0',
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: '10001'
    });

    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const colors = ['#ff6b35', '#ff2d92', '#00d4ff', '#39ff14', '#ffd700'];
    const particles = Array.from({ length: 100 }, () => ({
        x: canvas.width / 2,
        y: canvas.height / 2 + 50,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 1) * 15 - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        life: 100
    }));

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;
        particles.forEach(p => {
            if (p.life > 0) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.5;
                p.life--;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                active = true;
            }
        });
        if (active) requestAnimationFrame(animate);
        else canvas.remove();
    }
    animate();
}

/**
 * Register wizard drag-to-reposition behavior.
 * Must be called after the DOM is ready.
 */
function init() {
    const wizardContainer = document.querySelector('.wizard-containerglass');
    const wizardOverlay = document.getElementById('wizardOverlay') || document.querySelector('.wizard-overlay');
    if (!wizardContainer) return;

    let isDragging = false;
    let startX, startY, initLeft, initTop;

    wizardContainer.addEventListener('mousedown', (e) => {
        if (!wizardOverlay?.classList.contains('preview-mode')) return;
        if (e.target.tagName === 'BUTTON' || e.target.closest('.theme-card') || e.target.closest('.lang-card')) return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = wizardContainer.getBoundingClientRect();
        initLeft = rect.left;
        initTop = rect.top;

        wizardContainer.style.transition = 'none';
        wizardContainer.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        Object.assign(wizardContainer.style, {
            position: 'fixed',
            left: `${initLeft + dx}px`,
            top: `${initTop + dy}px`,
            margin: '0',
            transform: 'none'
        });
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            wizardContainer.style.cursor = 'grab';
        }
    });
}

module.exports = { init, confetti };

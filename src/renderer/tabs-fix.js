// Safe Tab Switching Logic — Solari 2.0 (Vertical Sidebar)
// Runs on DOMContentLoaded for fast startup
document.addEventListener('DOMContentLoaded', () => {
    const tabIndicator = document.querySelector('.tab-indicator');

    /**
     * Atualiza a posição e altura do indicador de aba (vertical)
     */
    function updateTabIndicator(activeBtn) {
        if (!tabIndicator || !activeBtn) return;
        // Vertical sidebar: use offsetTop / offsetHeight
        tabIndicator.style.top    = `${activeBtn.offsetTop}px`;
        tabIndicator.style.height = `${activeBtn.offsetHeight}px`;
    }

    const titlebarTitleEl = document.getElementById('titlebarTitle');

    function updateTitlebarTitle() {
        const activeBtn = document.querySelector('.tab-btn.active');
        if (activeBtn && titlebarTitleEl) {
            const labelEl = activeBtn.querySelector('.tab-label');
            if (labelEl) {
                titlebarTitleEl.textContent = labelEl.textContent;
            }
        }
    }

    function switchTab(targetId) {
        // Re-query LIVE buttons because we replaced them with clones
        const liveTabs     = document.querySelectorAll('.tab-btn');
        const liveContents = document.querySelectorAll('.tab-content');

        // Remove active class from all tabs
        liveTabs.forEach(t     => t.classList.remove('active'));
        liveContents.forEach(c => c.classList.remove('active'));

        // Add active to target
        const btn     = document.querySelector(`.tab-btn[data-tab="${targetId}"]`);
        const content = document.getElementById(targetId);

        if (btn) {
            btn.classList.add('active');
            updateTabIndicator(btn);
            updateTitlebarTitle();
        }
        if (content) {
            content.classList.add('active');
        }

        // Special handling for SoundBoard init
        if (targetId === 'soundboard-tab') {
            if (window.initSoundBoard && !window.sbInitialized) {
                window.initSoundBoard();
                window.sbInitialized = true;
            }
        }

        // Special handling for Plugins init
        if (targetId === 'plugins-tab') {
            if (typeof PluginsTabManager !== 'undefined') {
                PluginsTabManager.init();
            }
        }

        // Special handling for Extension tab active state
        if (targetId === 'extension-tab') {
            if (typeof ExtensionTabManager !== 'undefined') {
                ExtensionTabManager.init();
            }
        }

        // Special handling for RPC tab active state
        if (targetId === 'rpc-tab') {
            document.dispatchEvent(new CustomEvent('rpc-tab-active'));
        }
    }

    // Attach listeners (cloning to clear old handlers)
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);
        const tabId = newTab.getAttribute('data-tab');

        newTab.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            switchTab(tabId);
        });
    });

    // Initialize indicator position
    window.addEventListener('load', () => {
        const activeBtn = document.querySelector('.tab-btn.active');
        if (activeBtn) updateTabIndicator(activeBtn);
        updateTitlebarTitle();
    });

    // On resize (sidebar width change doesn't affect offsetTop, but keep for safety)
    window.addEventListener('resize', () => {
        const activeBtn = document.querySelector('.tab-btn.active');
        if (activeBtn) updateTabIndicator(activeBtn);
    });

    // Language change — text labels may shift row height
    document.addEventListener('languageChanged', () => {
        setTimeout(() => {
            const activeBtn = document.querySelector('.tab-btn.active');
            if (activeBtn) updateTabIndicator(activeBtn);
            updateTitlebarTitle();
        }, 50);
    });

    // Sync sidebar status dot with RPC connection changes
    // (mirrors the .status-indicator state managed by renderer.js)
    const sidebarDot = document.getElementById('sidebarStatusDot');
    if (sidebarDot) {
        const observer = new MutationObserver(() => {
            const mainDot = document.querySelector('.status-indicator');
            if (!mainDot) return;
            // renderer.js sets background-color inline on .status-indicator
            const color = mainDot.style.backgroundColor;
            sidebarDot.style.background = color || '';
            // Add 'connected' class when green
            sidebarDot.classList.toggle('connected',
                color === 'rgb(74, 222, 128)' || color === '#4ade80' || color === 'var(--success)');
        });

        const mainDot = document.querySelector('.status-indicator');
        if (mainDot) {
            observer.observe(mainDot, { attributes: true, attributeFilter: ['style'] });
        }
    }

    console.log('[SafeTabs 2.0] Initialized with Vertical Indicator');
});

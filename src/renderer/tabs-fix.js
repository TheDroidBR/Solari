// Safe Tab Switching Logic - Runs on DOMContentLoaded for fast startup
document.addEventListener('DOMContentLoaded', () => {
    const tabIndicator = document.querySelector('.tab-indicator');

    /**
     * Atualiza a posição e largura do indicador de aba
     */
    function updateTabIndicator(activeBtn) {
        if (!tabIndicator || !activeBtn) return;
        tabIndicator.style.width = `${activeBtn.offsetWidth}px`;
        tabIndicator.style.left = `${activeBtn.offsetLeft}px`;
    }

    function switchTab(targetId) {
        // Re-query LIVE buttons because we replaced them with clones
        const liveTabs = document.querySelectorAll('.tab-btn');
        const liveContents = document.querySelectorAll('.tab-content');

        // Remove active class from all tabs
        liveTabs.forEach(t => t.classList.remove('active'));
        liveContents.forEach(c => c.classList.remove('active'));

        // Add active to target
        const btn = document.querySelector(`.tab-btn[data-tab="${targetId}"]`);
        const content = document.getElementById(targetId);

        if (btn) {
            btn.classList.add('active');
            updateTabIndicator(btn);
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
    });

    window.addEventListener('resize', () => {
        const activeBtn = document.querySelector('.tab-btn.active');
        if (activeBtn) updateTabIndicator(activeBtn);
    });

    console.log('[SafeTabs] Initialized with Indicator');
});

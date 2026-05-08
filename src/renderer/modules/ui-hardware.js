/**
 * Solari - UI: Hardware Monitor (Renderer Side)
 *
 * All DOM interaction for the HW Monitor tab: ring gauges,
 * master toggle, individual toggles, and live stats reception.
 * Extracted from the IIFE at the bottom of renderer.js.
 *
 * Usage:
 *   const hwMonitorUI = require('./ui-hardware');
 *   hwMonitorUI.init();
 *
 * @module ui-hardware
 */

'use strict';

const { ipcRenderer } = require('electron');
const { t } = require('../i18n');

const CIRCUMFERENCE = 2 * Math.PI * 52; // r=52 from SVG

function init() {
    const toggle = document.getElementById('hw-monitor-toggle');
    const gaugesContainer = document.getElementById('hw-gauges-container');
    const rpcPreview = document.getElementById('hw-rpc-preview');
    const rpcPreviewText = document.getElementById('hw-rpc-preview-text');
    const card = document.querySelector('.hw-monitor-card');

    const cpuRing = document.getElementById('hw-cpu-ring');
    const cpuValue = document.getElementById('hw-cpu-value');
    const ramRing = document.getElementById('hw-ram-ring');
    const ramValue = document.getElementById('hw-ram-value');
    const gpuRing = document.getElementById('hw-gpu-ring');
    const gpuValue = document.getElementById('hw-gpu-value');
    const gpuGauge = document.getElementById('hw-gauge-gpu');

    const toggleCPU = document.getElementById('hw-toggle-cpu');
    const toggleRAM = document.getElementById('hw-toggle-ram');
    const toggleGPU = document.getElementById('hw-toggle-gpu');
    const toggleGPUTemp = document.getElementById('hw-toggle-gputemp');

    if (!toggle || !gaugesContainer) return;

    // ── Ring helpers ──────────────────────────────────────────────────────────

    function setRingProgress(ring, percent) {
        const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
        ring.style.strokeDashoffset = Math.max(0, offset);
    }

    function resetGauges() {
        setRingProgress(cpuRing, 0);
        setRingProgress(ramRing, 0);
        setRingProgress(gpuRing, 0);
        cpuValue.textContent = '0%';
        ramValue.textContent = '0/0';
        gpuValue.textContent = '--';
        rpcPreviewText.textContent = '—';
    }

    // ── Stats update ──────────────────────────────────────────────────────────

    function updateGauges(stats) {
        if (!stats) return;

        if (stats.cpu && toggleCPU.checked) {
            setRingProgress(cpuRing, stats.cpu.usage);
            cpuValue.textContent = `${stats.cpu.usage}%`;
            document.getElementById('hw-gauge-cpu')?.classList.remove('disabled');
        }

        if (stats.ram && toggleRAM.checked) {
            setRingProgress(ramRing, stats.ram.usagePercent);
            ramValue.textContent = `${stats.ram.usedGB}/${stats.ram.totalGB}`;
            document.getElementById('hw-gauge-ram')?.classList.remove('disabled');
        }

        if (stats.gpu && toggleGPU.checked) {
            gpuGauge?.classList.remove('hw-gauge-gpu-unavailable');
            const showTemp = toggleGPUTemp.checked && stats.gpu.temp !== null;
            const gpuPercent = stats.gpu.usage !== null ? stats.gpu.usage : (showTemp ? Math.min(stats.gpu.temp, 100) : 0);
            setRingProgress(gpuRing, gpuPercent);

            if (stats.gpu.usage !== null && showTemp) {
                gpuValue.innerHTML = `${stats.gpu.usage}%<br><span style="font-size: 0.55em; opacity: 0.7; font-weight: 500">${stats.gpu.temp}°C</span>`;
            } else if (showTemp) {
                gpuValue.textContent = `${stats.gpu.temp}°C`;
            } else if (stats.gpu.usage !== null) {
                gpuValue.textContent = `${stats.gpu.usage}%`;
            } else {
                gpuValue.textContent = '--';
            }
        } else if (!stats.gpu && toggleGPU.checked) {
            gpuGauge?.classList.add('hw-gauge-gpu-unavailable');
            gpuValue.textContent = 'N/A';
            setRingProgress(gpuRing, 0);
        }

        // RPC preview string
        const parts = [];
        if (stats.cpu && toggleCPU.checked) parts.push(`${t('hwMonitor.cpu') || 'CPU'}: ${stats.cpu.usage}%`);
        if (stats.ram && toggleRAM.checked) parts.push(`${t('hwMonitor.ram') || 'RAM'}: ${stats.ram.usedGB}/${stats.ram.totalGB}GB`);
        if (stats.gpu && toggleGPU.checked) {
            const showTemp = toggleGPUTemp.checked && stats.gpu.temp !== null;
            if (stats.gpu.usage !== null || showTemp) {
                let gpuStr = `${t('hwMonitor.gpu') || 'GPU'}:`;
                if (stats.gpu.usage !== null) gpuStr += ` ${stats.gpu.usage}%`;
                if (showTemp) gpuStr += `${stats.gpu.usage !== null ? '' : ' '}(${stats.gpu.temp}°C)`;
                parts.push(gpuStr.trim());
            }
        }
        rpcPreviewText.textContent = parts.length > 0 ? parts.join(' | ') : '—';
    }

    // ── Controls ──────────────────────────────────────────────────────────────

    toggle.addEventListener('change', async () => {
        const enabled = toggle.checked;
        await ipcRenderer.invoke('hw-monitor:toggle', enabled);

        gaugesContainer.style.display = enabled ? 'flex' : 'none';
        rpcPreview.style.display = enabled ? 'flex' : 'none';
        card?.classList.toggle('active', enabled);

        if (!enabled) resetGauges();
    });

    function onStatToggle() {
        const showCPU = toggleCPU.checked;
        const showRAM = toggleRAM.checked;
        const showGPU = toggleGPU.checked;
        const showGPUTemp = toggleGPUTemp.checked;

        document.getElementById('hw-gauge-cpu')?.classList.toggle('disabled', !showCPU);
        document.getElementById('hw-gauge-ram')?.classList.toggle('disabled', !showRAM);
        document.getElementById('hw-gauge-gpu')?.classList.toggle('disabled', !showGPU);

        document.getElementById('hw-mini-toggle-gputemp')?.classList.toggle('active-gpu', showGPUTemp);

        ipcRenderer.invoke('hw-monitor:save-settings', { showCPU, showRAM, showGPU, showGPUTemp });
        ipcRenderer.invoke('hw-monitor:get-stats').then(stats => updateGauges(stats));
    }

    toggleCPU.addEventListener('change', onStatToggle);
    toggleRAM.addEventListener('change', onStatToggle);
    toggleGPU.addEventListener('change', onStatToggle);
    toggleGPUTemp.addEventListener('change', onStatToggle);

    // Live stats from main process
    ipcRenderer.on('hw-stats-update', (_event, stats) => {
        if (stats) updateGauges(stats);
    });

    // Initialize from persisted settings
    (async () => {
        try {
            const result = await ipcRenderer.invoke('hw-monitor:get-settings');
            if (!result) return;

            toggle.checked = result.enabled;

            if (result.settings) {
                toggleCPU.checked = result.settings.showCPU !== false;
                toggleRAM.checked = result.settings.showRAM !== false;
                toggleGPU.checked = result.settings.showGPU !== false;
                toggleGPUTemp.checked = result.settings.showGPUTemp !== false;
            }

            if (result.enabled) {
                gaugesContainer.style.display = 'flex';
                rpcPreview.style.display = 'flex';
                card?.classList.add('active');
                onStatToggle();
                if (result.stats) updateGauges(result.stats);
            }

            if (result.gpuAvailable === false) {
                gpuGauge?.classList.add('hw-gauge-gpu-unavailable');
                gpuValue.textContent = 'N/A';
            }
        } catch (e) {
            console.error('[HW Monitor UI] Init error:', e);
        }
    })();
}

module.exports = { init };

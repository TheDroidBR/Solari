'use strict';

/**
 * Solari - UI: Preview Map (bidirectional field ↔ preview highlight)
 *
 * When a form field is focused → its corresponding preview element pulses.
 * When a preview element is hovered → its corresponding form field gets highlighted.
 *
 * NOTE: previewSmallImage is a CHILD of previewLargeImage in the DOM.
 * We use stopPropagation on the small image hover to prevent the large image
 * from also highlighting when only the small image is hovered.
 *
 * @module ui-preview-map
 */

// Map: input ID → preview element ID(s)
const MAP = {
    details:        ['previewDetails'],
    detailsUrl:     ['previewDetails'],
    state:          ['previewState'],
    stateUrl:       ['previewState'],
    largeImage:     ['previewLargeImage'],
    largeImageText: ['previewLargeImage'],
    smallImage:     ['previewSmallImage'],
    smallImageText: ['previewSmallImage'],
    button1Label:   ['previewBtn1'],
    button1Url:     ['previewBtn1'],
    button2Label:   ['previewBtn2'],
    button2Url:     ['previewBtn2'],
    activityType:   ['previewActivityType'],
};

// Reverse map: preview ID → input IDs
const REVERSE_MAP = {};
Object.entries(MAP).forEach(([inputId, previewIds]) => {
    previewIds.forEach(pid => {
        if (!REVERSE_MAP[pid]) REVERSE_MAP[pid] = [];
        REVERSE_MAP[pid].push(inputId);
    });
});

function _highlight(els, on) {
    els.forEach(el => { if (el) el.classList.toggle('preview-map-highlight', on); });
}

function init() {
    // 1. Input focus → highlight preview (dynamic element lookup to handle recreated DOM nodes)
    Object.entries(MAP).forEach(([inputId, previewIds]) => {
        const input = document.getElementById(inputId);
        if (!input) return;

        input.addEventListener('focus', () => {
            const currentPreviewEls = previewIds.map(id => document.getElementById(id)).filter(Boolean);
            _highlight(currentPreviewEls, true);
        });
        input.addEventListener('blur',  () => {
            const currentPreviewEls = previewIds.map(id => document.getElementById(id)).filter(Boolean);
            _highlight(currentPreviewEls, false);
        });
    });

    // Add .preview-map-hoverable class to all target preview elements
    Object.keys(REVERSE_MAP).forEach(previewId => {
        const previewEl = document.getElementById(previewId);
        if (previewEl) {
            previewEl.classList.add('preview-map-hoverable');
        }
    });

    let activeHighlightedInputs = [];
    const clearActiveHighlights = () => {
        if (activeHighlightedInputs.length > 0) {
            _highlight(activeHighlightedInputs, false);
            activeHighlightedInputs = [];
        }
    };

    // 2. Preview hover → highlight input(s) (Delegated event listener)
    // We listen on the entire preview card wrapper (which contains all these elements)
    const previewContainer = document.querySelector('.discord-profile-popout') || document.querySelector('.discord-preview-section');
    if (previewContainer) {
        previewContainer.addEventListener('mouseover', (e) => {
            // Find the closest hoverable element matching one of the preview target IDs
            const selector = Object.keys(REVERSE_MAP).map(id => `#${id}`).join(', ');
            const hoveredEl = e.target.closest(selector);
            
            if (!hoveredEl) {
                clearActiveHighlights();
                return;
            }

            const previewId = hoveredEl.id;
            const inputIds = REVERSE_MAP[previewId];
            const currentInputs = inputIds ? inputIds.map(id => document.getElementById(id)).filter(Boolean) : [];
            
            // Compare if we are already highlighting these inputs to prevent thrashing
            const isSame = activeHighlightedInputs.length === currentInputs.length && 
                           activeHighlightedInputs.every((el, idx) => el === currentInputs[idx]);
                           
            if (!isSame) {
                clearActiveHighlights();
                if (currentInputs.length > 0) {
                    _highlight(currentInputs, true);
                    activeHighlightedInputs = currentInputs;
                }
            }
        });

        previewContainer.addEventListener('mouseleave', () => {
            clearActiveHighlights();
        });
    }
}

module.exports = { init };

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
    // Input focus → highlight preview
    Object.entries(MAP).forEach(([inputId, previewIds]) => {
        const input = document.getElementById(inputId);
        if (!input) return;

        const previewEls = previewIds.map(id => document.getElementById(id)).filter(Boolean);

        input.addEventListener('focus', () => _highlight(previewEls, true));
        input.addEventListener('blur',  () => _highlight(previewEls, false));
    });

    // Preview hover → highlight input(s)
    // IMPORTANT: Handle small image first and stopPropagation so its parent
    // (large image) does NOT also trigger when only the small image is hovered.
    Object.entries(REVERSE_MAP).forEach(([previewId, inputIds]) => {
        const previewEl = document.getElementById(previewId);
        if (!previewEl) return;

        const inputs = inputIds.map(id => document.getElementById(id)).filter(Boolean);

        previewEl.classList.add('preview-map-hoverable');

        previewEl.addEventListener('mouseenter', (e) => {
            // If this is previewLargeImage but the actual target is inside
            // previewSmallImage, do nothing — smallImage handler takes over.
            const smallImg = document.getElementById('previewSmallImage');
            if (previewId === 'previewLargeImage' && smallImg && smallImg.contains(e.target)) {
                return;
            }
            _highlight(inputs, true);
        });

        previewEl.addEventListener('mouseleave', (e) => {
            // If this is previewLargeImage and we're moving INTO previewSmallImage,
            // don't clear the large image highlight (we're still inside it).
            const smallImg = document.getElementById('previewSmallImage');
            if (previewId === 'previewLargeImage' && smallImg && smallImg.contains(e.relatedTarget)) {
                _highlight(inputs, false); // clear large — small will take over
                return;
            }
            _highlight(inputs, false);
        });

        // For the small image: stop bubbling so parent (large image) doesn't trigger
        if (previewId === 'previewSmallImage') {
            previewEl.addEventListener('mouseenter', (e) => {
                e.stopPropagation();
                _highlight(inputs, true);
            });
            previewEl.addEventListener('mouseleave', (e) => {
                e.stopPropagation();
                _highlight(inputs, false);
            });
        }
    });
}

module.exports = { init };

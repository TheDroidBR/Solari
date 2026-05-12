'use strict';

/**
 * Solari - UI: Real-time Field Validator
 *
 * Adds visual ✅ / ⚠️ / ❌ / ○ feedback to Rich Presence form inputs.
 * Operates purely on blur (focus-out) to avoid disrupting typing.
 *
 * @module ui-validator
 */

const URL_RE = /^https?:\/\/.+/;
const MAX_DETAILS = 128;
const MAX_STATE = 128;
const MAX_BTN_LABEL = 32;
const MAX_BTN_URL = 512;

// State enum strings
const STATE = { VALID: 'valid', WARN: 'warn', ERROR: 'error', NEUTRAL: 'neutral' };

/**
 * Apply validation visual state to a wrapper element.
 * @param {HTMLElement} wrapper - The .form-field-validated wrapper
 * @param {string} state - 'valid' | 'warn' | 'error' | 'neutral'
 * @param {string} [msg] - Optional screen-reader / tooltip message
 */
function _applyState(input, state, msg = '') {
    input.classList.remove('fv-valid', 'fv-warn', 'fv-error', 'fv-neutral');
    if (state !== STATE.NEUTRAL) {
        input.classList.add(`fv-${state}`);
    }
    if (msg) {
        input.setAttribute('title', msg);
    } else {
        input.removeAttribute('title');
    }
}

function _validateUrl(val) {
    if (!val) return STATE.NEUTRAL;
    if (!URL_RE.test(val)) return STATE.WARN; // filled but not https
    return STATE.VALID;
}

function _validateText(val, maxLen) {
    if (!val) return STATE.NEUTRAL;
    if (val.length > maxLen) return STATE.ERROR;
    return STATE.VALID;
}

// --- Per-field rules ---
const RULES = {
    details(el) {
        return _validateText(el.value, MAX_DETAILS);
    },
    detailsUrl(el) {
        return _validateUrl(el.value);
    },
    state(el) {
        return _validateText(el.value, MAX_STATE);
    },
    stateUrl(el) {
        return _validateUrl(el.value);
    },
    largeImage(el) {
        return _validateUrl(el.value);
    },
    largeImageText(el) {
        return el.value ? STATE.VALID : STATE.NEUTRAL;
    },
    smallImage(el) {
        if (!el.value) return STATE.NEUTRAL;
        // Warn if small image set but large image is empty
        const large = document.getElementById('largeImage');
        if (large && !large.value) return STATE.WARN;
        return _validateUrl(el.value);
    },
    smallImageText(el) {
        return el.value ? STATE.VALID : STATE.NEUTRAL;
    },
    button1Label(el) {
        if (!el.value) return STATE.NEUTRAL;
        if (el.value.length > MAX_BTN_LABEL) return STATE.ERROR;
        return STATE.VALID;
    },
    button1Url(el) {
        const label = document.getElementById('button1Label');
        if (!el.value) {
            if (label && label.value) return STATE.ERROR; // label set but no URL
            return STATE.NEUTRAL;
        }
        return _validateUrl(el.value);
    },
    button2Label(el) {
        if (!el.value) return STATE.NEUTRAL;
        if (el.value.length > MAX_BTN_LABEL) return STATE.ERROR;
        return STATE.VALID;
    },
    button2Url(el) {
        const label = document.getElementById('button2Label');
        if (!el.value) {
            if (label && label.value) return STATE.ERROR;
            return STATE.NEUTRAL;
        }
        return _validateUrl(el.value);
    },
    partyCurrent(el) {
        if (!el.value) return STATE.NEUTRAL;
        const max = document.getElementById('partyMax');
        if (max && max.value && parseInt(el.value) > parseInt(max.value)) return STATE.ERROR;
        return STATE.VALID;
    },
    partyMax(el) {
        if (!el.value) return STATE.NEUTRAL;
        const curr = document.getElementById('partyCurrent');
        if (curr && curr.value && parseInt(curr.value) > parseInt(el.value)) return STATE.ERROR;
        return STATE.VALID;
    }
};

const MESSAGES = {
    details: { warn: '', error: `Exceeds ${MAX_DETAILS} character limit` },
    detailsUrl: { warn: 'URL should start with https://', error: '' },
    state: { warn: '', error: `Exceeds ${MAX_STATE} character limit` },
    stateUrl: { warn: 'URL should start with https://', error: '' },
    largeImage: { warn: 'URL should start with https://', error: '' },
    smallImage: { warn: 'Set a Large Image first for the small image to show', error: '' },
    button1Label: { warn: '', error: `Exceeds ${MAX_BTN_LABEL} character limit` },
    button1Url: { warn: 'URL should start with https://', error: 'Button 1 has a label but no URL' },
    button2Label: { warn: '', error: `Exceeds ${MAX_BTN_LABEL} character limit` },
    button2Url: { warn: 'URL should start with https://', error: 'Button 2 has a label but no URL' },
    partyCurrent: { warn: '', error: 'Current cannot exceed Max' },
    partyMax: { warn: '', error: 'Max cannot be less than Current' }
};

function _validate(id) {
    const el = document.getElementById(id);
    const rule = RULES[id];
    if (!el || !rule) return;

    const result = rule(el);
    const msgs = MESSAGES[id] || {};
    const msg = result === STATE.WARN ? (msgs.warn || '') : result === STATE.ERROR ? (msgs.error || '') : '';
    _applyState(el, result, msg);
}

function _attach(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', () => _validate(id));
    // Also cross-validate interdependent fields
    if (id === 'button1Label') el.addEventListener('blur', () => _validate('button1Url'));
    if (id === 'button2Label') el.addEventListener('blur', () => _validate('button2Url'));
    if (id === 'partyCurrent') el.addEventListener('blur', () => _validate('partyMax'));
    if (id === 'partyMax') el.addEventListener('blur', () => _validate('partyCurrent'));
    if (id === 'largeImage') el.addEventListener('blur', () => _validate('smallImage'));
}

function init() {
    Object.keys(RULES).forEach(_attach);
}

/**
 * Run all validators immediately (no blur needed).
 * Call this after form fields are populated on startup.
 */
function validateAll() {
    Object.keys(RULES).forEach(_validate);
}

module.exports = { init, validateAll };


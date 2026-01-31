/*
 * Solari RPC - Internationalization Module
 * Copyright (C) 2026 TheDroid
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 */

// Solari Internationalization Module
const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

let currentLang = 'en';
let translations = {};

// PRE-LOAD English translations synchronously as fallback
// This prevents "Missing translation" errors before initI18n() is called
try {
    const enPath = path.join(__dirname, 'locales', 'en.json');
    const enData = fs.readFileSync(enPath, 'utf-8');
    translations = JSON.parse(enData);
    console.log('[i18n] Pre-loaded English fallback translations');
} catch (e) {
    console.warn('[i18n] Could not pre-load English fallback:', e.message);
}

// Load translations
async function loadTranslations(lang) {
    try {
        const response = await fetch(`./locales/${lang}.json?v=${new Date().getTime()}`);
        translations = await response.json();
        currentLang = lang;
        return translations;
    } catch (error) {
        console.error('[i18n] Failed to load translations:', error);
        // Fallback to English
        if (lang !== 'en') {
            return loadTranslations('en');
        }
        return {};
    }
}

// Get translation by key path (e.g., 'presence.title')
function t(key, replacements = {}) {
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
        if (value && value[k] !== undefined) {
            value = value[k];
        } else {
            console.warn(`[i18n] Missing translation: ${key} (Stopped at ${k})`);
            return key;
        }
    }

    // Handle string replacements like {name}
    if (typeof value === 'string') {
        for (const [placeholder, replacement] of Object.entries(replacements)) {
            value = value.replace(`{${placeholder}}`, replacement);
        }
    }

    return value;
}

// Apply translations to all elements with data-i18n attribute
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);

        if (translation && translation !== key) {
            // Check if it's a placeholder attribute
            if (el.hasAttribute('data-i18n-attr')) {
                const attr = el.getAttribute('data-i18n-attr');
                el.setAttribute(attr, translation);
            } else {
                el.textContent = translation;
            }
        }
    });

    // Apply to placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translation = t(key);
        if (translation && translation !== key) {
            el.placeholder = translation;
        }
    });

    // Apply to titles
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const translation = t(key);
        if (translation && translation !== key) {
            el.title = translation;
        }
    });
}

// Initialize i18n
async function initI18n(lang = 'en') {
    await loadTranslations(lang);
    applyTranslations();
}

// Listen for language changes from main process
ipcRenderer.on('language-changed', async (event, lang) => {
    await loadTranslations(lang);
    applyTranslations();
    // Dispatch custom event for components that need to update dynamically
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang, translations } }));
});

// Get current language
function getCurrentLang() {
    return currentLang;
}

// Get all translations
function getTranslations() {
    return translations;
}

module.exports = { initI18n, t, applyTranslations, loadTranslations, getCurrentLang, getTranslations };

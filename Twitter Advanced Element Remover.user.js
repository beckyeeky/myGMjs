// ==UserScript==
// @name         Twitter Advanced Element Remover
// @namespace    https://github.com/beckyeeky/myGMjs
// @author       beckyeeky
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Twitter%20Advanced%20Element%20Remover.user.js
// @downloadURL  https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Twitter%20Advanced%20Element%20Remover.user.js
// @version      1.1
// @description  Hide selected Twitter/X layout elements with safer defaults
// @match        https://twitter.com/*
// @match        https://x.com/*
// @match        https://pro.twitter.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        hideBanner: true,
        hideSidebar: true,
        hideTweetText: false,
        widenMediaPanel: true
    };

    const STYLE_ID = 'tm-advanced-element-remover-style';

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const rules = [];

        if (CONFIG.hideBanner) {
            rules.push('[role="banner"] { display: none !important; }');
        }

        if (CONFIG.hideSidebar) {
            rules.push('[data-testid="sidebarColumn"] { display: none !important; }');
        }

        if (CONFIG.hideTweetText) {
            rules.push('[data-testid="tweetText"] { display: none !important; }');
        }

        if (!rules.length) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = rules.join('\n');
        document.head.appendChild(style);
    }

    function widenMediaPanels(root = document) {
        if (!CONFIG.widenMediaPanel) return;

        root.querySelectorAll?.('div[style*="width: 382.5px;"][style*="height: 510px;"]:not([data-tm-resized])').forEach((div) => {
            div.dataset.tmResized = '1';
            div.style.width = '500px';
            div.style.height = 'auto';
        });
    }

    function processNode(node) {
        if (!(node instanceof HTMLElement)) return;

        widenMediaPanels(node);

        if (
            node.matches?.('div[style*="width: 382.5px;"][style*="height: 510px;"]:not([data-tm-resized])')
        ) {
            widenMediaPanels(node.parentElement || document);
        }
    }

    function initObserver() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    processNode(node);
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    injectStyles();
    widenMediaPanels();
    initObserver();
})();

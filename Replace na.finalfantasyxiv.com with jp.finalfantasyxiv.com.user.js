// ==UserScript==
// @name         Replace na.finalfantasyxiv.com with jp.finalfantasyxiv.com
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Replace na.finalfantasyxiv.com with jp.finalfantasyxiv.com on ffxiv.eorzeacollection.com
// @author       You
// @match        https://ffxiv.eorzeacollection.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function replaceURLs() {
        const links = document.querySelectorAll('a[href*="https://na.finalfantasyxiv.com"]');

        for (let link of links) {
            link.href = link.href.replace('https://na.finalfantasyxiv.com', 'https://jp.finalfantasyxiv.com');
        }
    }

    replaceURLs();
    new MutationObserver(replaceURLs).observe(document, {childList: true, subtree: true});
})();

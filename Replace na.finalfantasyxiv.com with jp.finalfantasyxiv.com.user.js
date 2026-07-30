// ==UserScript==
// @name         Replace na.finalfantasyxiv.com with jp.finalfantasyxiv.com
// @namespace    https://github.com/beckyeeky/myGMjs
// @author       beckyeeky
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Replace%20na.finalfantasyxiv.com%20with%20jp.finalfantasyxiv.com.user.js
// @downloadURL  https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Replace%20na.finalfantasyxiv.com%20with%20jp.finalfantasyxiv.com.user.js
// @version      1.0
// @description  Replace na.finalfantasyxiv.com with jp.finalfantasyxiv.com on ffxiv.eorzeacollection.com
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

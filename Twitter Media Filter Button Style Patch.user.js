// ==UserScript==
// @name         Twitter Media Filter Button Style Patch V4
// @namespace    https://github.com/beckyeeky/myGMjs
// @author       beckyeeky
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Twitter%20Media%20Filter%20Button%20Style%20Patch.user.js
// @downloadURL  https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Twitter%20Media%20Filter%20Button%20Style%20Patch.user.js
// @version      0.4.1
// @description  Modifies the style of the button created by the Twitter media-only filter toggle script (v0.17)
// @match        https://*.twitter.com/*
// @match        https://*.x.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==
(function() {
    'use strict';
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        nav[role="navigation"] > button:first-child {
            font-size: 12px !important;
            padding: 5px 10px !important;
            background-color: #1DA1F2 !important;
            color: white !important;
            border: none !important;
            border-radius: 15px !important;
            cursor: pointer !important;
            margin-right: 10px !important;
            transition: background-color 0.3s !important;
        }
        nav[role="navigation"] > button:first-child:hover {
            background-color: #1a91da !important;
        }
    `;
    document.head.appendChild(styleElement);

})();

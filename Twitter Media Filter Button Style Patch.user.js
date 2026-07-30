// ==UserScript==
// @name         Twitter Media Filter Button Style Patch V4
// @namespace    https://github.com/beckyeeky/myGMjs
// @version      0.4
// @description  Modifies the style of the button created by the Twitter media-only filter toggle script (v0.17)
// @author       beckyeeky
// @match        https://*.twitter.com/*
// @match        https://*.x.com/*
// @run-at       document-idle
// @grant        none
// @downloadURL https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Twitter%20Media%20Filter%20Button%20Style%20Patch.user.js
// @updateURL   https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Twitter%20Media%20Filter%20Button%20Style%20Patch.user.js
// @license      MIT
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

    const applyButtonStyle = () => {
        const button = document.querySelector('nav[role="navigation"] > button:first-child');
        if (button) {
            button.style.cssText = ""; // 清除可能存在的内联样式
            console.log("Media filter button style applied");
        }
    };

    // 初始应用样式
    setTimeout(applyButtonStyle, 1000);

    // 创建一个 MutationObserver 来监视 DOM 变化
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                applyButtonStyle();
            }
        });
    });

    // 开始观察 body 元素及其子树的变化
    observer.observe(document.body, { childList: true, subtree: true });
})();

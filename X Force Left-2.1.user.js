// ==UserScript==
// @name         X (Twitter) Force Left (No Color Change)
// @namespace    https://github.com/beckyeeky/myGMjs
// @version      2.1
// @description  只负责将X界面移到左侧，不修改背景颜色
// @author       beckyeeky
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @downloadURL  https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Force%20Left-2.1.user.js
// @updateURL    https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Force%20Left-2.1.user.js
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // 宽度设置
    const contentWidth = "950px";

    const css = `
        /* --- 1. 布局左移 --- */
        #react-root > div,
        #react-root > div > div,
        #react-root > div > div > div {
            justify-content: flex-start !important;
            align-items: flex-start !important;
            margin-left: 0 !important;
        }

        /* --- 2. 宽度锁定 --- */
        #react-root > div > div > div > div {
            max-width: ${contentWidth} !important;
            width: ${contentWidth} !important;
            flex-shrink: 0 !important;
            margin-left: 0 !important;
        }

        /* --- 3. 删除了修改背景色的代码 --- */
        /* 现在背景色会完全跟随你当前的X主题设置 */
    `;

    GM_addStyle(css);

})();

// ==UserScript==
// @name         Change Image Quality to Orig
// @namespace    https://github.com/beckyeeky/myGMjs
// @author       beckyeeky
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Change%20Image%20Quality%20to%20Orig.user.js
// @downloadURL  https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Change%20Image%20Quality%20to%20Orig.user.js
// @version      1.0.1
// @description  Change image quality to orig on x.com
// @match        https://x.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Watch for newly added images and changes to existing image sources.
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes') {
                modifyImageUrls(mutation.target);
            } else if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        modifyImageUrls(node);
                    }
                });
            }
        });
    });

    // Function to modify image URLs
    function modifyImageUrls(element) {
        if (element.nodeName === 'IMG') {
            let src = element.src;
            if (src.includes("pbs.twimg.com/media/")) {
                let url = new URL(src);
                url.searchParams.set('name', 'orig');
                const origSrc = url.toString();
                if (src !== origSrc) element.src = origSrc;
            }
        } else {
            element.querySelectorAll('img').forEach(img => {
                let src = img.src;
                if (src.includes("pbs.twimg.com/media/")) {
                    let url = new URL(src);
                    url.searchParams.set('name', 'orig');
                    const origSrc = url.toString();
                    if (src !== origSrc) img.src = origSrc;
                }
            });
        }
    }

    // Initial modification of already loaded images
    document.querySelectorAll('img').forEach(img => modifyImageUrls(img));

    // Observe the entire body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src']
    });
})();

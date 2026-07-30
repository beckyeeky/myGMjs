// ==UserScript==
// @name         Change Image Quality to Orig
// @namespace    https://github.com/beckyeeky/myGMjs
// @version      1.0
// @description  Change image quality to orig on x.com
// @author       beckyeeky
// @match        https://x.com/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Change%20Image%20Quality%20to%20Orig-1.0.user.js
// @updateURL    https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Change%20Image%20Quality%20to%20Orig-1.0.user.js
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Mutation observer to watch for new images being added to the page
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
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
                element.src = url.toString();
            }
        } else {
            element.querySelectorAll('img').forEach(img => {
                let src = img.src;
                if (src.includes("pbs.twimg.com/media/")) {
                    let url = new URL(src);
                    url.searchParams.set('name', 'orig');
                    img.src = url.toString();
                }
            });
        }
    }

    // Initial modification of already loaded images
    document.querySelectorAll('img').forEach(img => modifyImageUrls(img));

    // Observe the entire body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();

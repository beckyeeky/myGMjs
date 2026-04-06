// ==UserScript==
// @name         Twitter Advanced Element Remover
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Remove specific elements on Twitter including banner, sidebar column, and tweet texts
// @author       Your Name
// @match        https://twitter.com/*
// @match        https://pro.twitter.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to remove specified elements
    function removeElements() {
        // Remove elements with role="banner"
        const banners = document.querySelectorAll('[role="banner"]');
        banners.forEach(banner => {
            banner.style.display = 'none';
        });

        // Remove elements with role="group"
        const button = document.querySelectorAll('[role="group"]');
        button.forEach(button => {
            button.style.display = 'none';
        });

        // Remove elements with data-testid="sidebarColumn"
        const sidebarColumns = document.querySelectorAll('[data-testid="sidebarColumn"]');
        sidebarColumns.forEach(sidebar => {
            sidebar.style.display = 'none';
        });

        // Remove elements with data-testid="tweetText"
        const tweetTexts = document.querySelectorAll('[data-testid="tweetText"]');
        tweetTexts.forEach(tweet => {
            tweet.style.display = 'none';
        });
    }

    // Observe for changes in the DOM
    const observer = new MutationObserver(removeElements);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });


    function modifyDivStyles() {
        document.querySelectorAll('div[style*="width: 382.5px;"][style*="height: 510px;"]').forEach(div => {
            div.style.width = '500px';
            div.style.height = 'auto';
        });
    }

    // Function to observe DOM changes
    function observeDOM() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    modifyDivStyles(); // Apply style changes if new nodes are added
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initial removal of specified elements
    removeElements();

    // Modify styles on initial page load
    modifyDivStyles();

    // Start observing the DOM for changes
    observeDOM();
})();

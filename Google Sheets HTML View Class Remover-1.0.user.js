// ==UserScript==
// @name         Google Sheets HTML View Class Remover
// @namespace    https://github.com/beckyeeky/myGMjs
// @version      1.0
// @description  Removes specific classes from Google Sheets HTML view to enable selection
// @author       beckyeeky
// @match        https://docs.google.com/spreadsheets/d/*/htmlview*
// @run-at       document-idle
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Google%20Sheets%20HTML%20View%20Class%20Remover-1.0.user.js
// @updateURL    https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Google%20Sheets%20HTML%20View%20Class%20Remover-1.0.user.js
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Function to remove the specific classes
    function removeRestrictiveClasses() {
        // Find the sheets-viewport element
        const viewport = document.getElementById('sheets-viewport');

        if (viewport) {
            // Remove the specific classes while preserving other classes if they exist
            viewport.classList.remove('docsshared-disable-image-copy');
            viewport.classList.remove('docsshared-no-select');

            console.log('Classes removed successfully from sheets-viewport');
        }
    }

    // Initial attempt to remove classes
    removeRestrictiveClasses();

    // Set up a MutationObserver in case the element loads after the initial page load
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                removeRestrictiveClasses();
            }
        }
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();

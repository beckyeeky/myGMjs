// ==UserScript==
// @name         Twitter Screenshot Button
// @namespace    https://github.com/beckyeeky/myGMjs
// @version      0.6
// @description  Add a screenshot button next to the share button on Twitter/X
// @author       beckyeeky
// @match        https://twitter.com/*
// @match        https://x.com/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// ==/UserScript==

(function() {
    'use strict';

    const STYLE_ID = 'tm-screenshot-button-style';
    const BUTTON_CLASS = 'tm-screenshot-btn';
    const BUTTON_CONTAINER_CLASS = 'tm-screenshot-btn-container';

    const debug = (msg, ...args) => {
        console.log('[Screenshot Button]', msg, ...args);
    };

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            .${BUTTON_CONTAINER_CLASS} {
                display: flex;
                align-items: center;
            }

            .${BUTTON_CLASS} {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 34px;
                height: 34px;
                margin: 0;
                padding: 0;
                border: 0;
                border-radius: 9999px;
                background: transparent;
                color: rgb(83, 100, 113);
                cursor: pointer;
                transition: background-color 0.15s ease, opacity 0.15s ease, color 0.15s ease;
            }

            .${BUTTON_CLASS}:hover {
                background: rgba(29, 155, 240, 0.1);
                color: rgb(29, 155, 240);
            }

            .${BUTTON_CLASS}[data-busy="1"] {
                opacity: 0.5;
                pointer-events: none;
            }

            .tm-screenshot-capture * {
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
                text-rendering: optimizeLegibility !important;
            }
        `;
        document.head.appendChild(style);
    }

    function waitForImages(root) {
        const imagePromises = Array.from(root.querySelectorAll('img')).map((img) => {
            if (img.complete) return Promise.resolve();

            return new Promise((resolve) => {
                const done = () => resolve();
                img.addEventListener('load', done, { once: true });
                img.addEventListener('error', done, { once: true });
                setTimeout(done, 5000);
            });
        });

        return Promise.allSettled(imagePromises);
    }

    function downloadBlob(blob) {
        if (!blob) throw new Error('Canvas blob generation failed');

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tweet-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function captureTweet(button, buttonGroup) {
        const tweetContainer = buttonGroup.closest('article');
        if (!tweetContainer) {
            debug('Tweet container not found');
            return;
        }

        let captureContainer = null;
        button.dataset.busy = '1';

        try {
            captureContainer = document.createElement('div');
            captureContainer.className = 'tm-screenshot-capture';
            captureContainer.style.cssText = `
                position: fixed;
                left: -99999px;
                top: 0;
                padding: 20px;
                background: white;
                width: ${tweetContainer.offsetWidth}px;
                z-index: -1;
            `;

            const clone = tweetContainer.cloneNode(true);
            clone.style.backgroundColor = 'white';
            clone.style.colorScheme = 'light';

            captureContainer.appendChild(clone);
            document.body.appendChild(captureContainer);

            clone.querySelectorAll('[role="group"], .'.concat(BUTTON_CLASS)).forEach((el) => {
                el.remove();
            });

            await waitForImages(clone);

            const canvas = await html2canvas(clone, {
                backgroundColor: '#ffffff',
                scale: Math.min(window.devicePixelRatio || 2, 3),
                logging: false,
                allowTaint: false,
                useCORS: true,
                imageTimeout: 0,
                removeContainer: true,
                ignoreElements: (element) => {
                    return element.classList?.contains(BUTTON_CLASS) || element.dataset?.screenshotIgnore === '1';
                },
                onclone: (clonedDoc) => {
                    const clonedArticle = clonedDoc.querySelector('article');
                    if (clonedArticle) {
                        clonedArticle.style.transform = 'scale(1)';
                        clonedArticle.style.colorScheme = 'light';
                    }
                }
            });

            const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));
            downloadBlob(blob);
            debug('Screenshot downloaded');
        } catch (error) {
            debug('Screenshot failed', error);
            console.error('Screenshot failed:', error);
            alert('截图失败，请刷新页面后重试');
        } finally {
            if (captureContainer?.parentNode) {
                captureContainer.parentNode.removeChild(captureContainer);
            }
            delete button.dataset.busy;
        }
    }

    function createButton(buttonGroup) {
        const container = document.createElement('div');
        container.className = BUTTON_CONTAINER_CLASS;
        container.dataset.screenshotIgnore = '1';

        const button = document.createElement('button');
        button.className = BUTTON_CLASS;
        button.type = 'button';
        button.setAttribute('aria-label', '截图');
        button.dataset.screenshotIgnore = '1';
        button.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="currentColor" d="M14.12 4l1.83 2H20v12H4V6h4.05l1.83-2h4.24M15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2zm-3 7c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3m0-2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"></path>
            </svg>
        `;

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (button.dataset.busy === '1') return;
            await captureTweet(button, buttonGroup);
        });

        container.appendChild(button);
        return container;
    }

    function addScreenshotButton(tweetElement) {
        if (!(tweetElement instanceof HTMLElement)) return;
        if (tweetElement.querySelector(`.${BUTTON_CLASS}`)) return;

        const buttonGroup = tweetElement.querySelector('[role="group"]');
        if (!buttonGroup) return;

        buttonGroup.appendChild(createButton(buttonGroup));
    }

    function processNode(node) {
        if (!(node instanceof HTMLElement)) return;

        if (node.matches('article')) {
            addScreenshotButton(node);
        }

        node.querySelectorAll?.('article').forEach(addScreenshotButton);
    }

    function init() {
        injectStyles();
        document.querySelectorAll('article').forEach(addScreenshotButton);

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

    if (typeof html2canvas === 'undefined') {
        debug('html2canvas not loaded, waiting for it');
        const checkInterval = setInterval(() => {
            if (typeof html2canvas !== 'undefined') {
                clearInterval(checkInterval);
                init();
            }
        }, 100);
    } else {
        init();
    }
})();

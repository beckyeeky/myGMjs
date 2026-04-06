// ==UserScript==
// @name         Twitter Screenshot Button
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Add screenshot button next to share button on Twitter/X
// @author       You
// @match        https://twitter.com/*
// @match        https://x.com/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// ==/UserScript==

(function() {
    'use strict';

    const debug = (msg) => {
        console.log(`[Screenshot Button Debug] ${msg}`);
    };

    // 添加文字优化的CSS
    const style = document.createElement('style');
    style.textContent = `
        .screenshot-container * {
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
            text-rendering: optimizeLegibility !important;
        }
    `;
    document.head.appendChild(style);

    function addScreenshotButton(tweetElement) {
        if (tweetElement.querySelector('.screenshot-btn')) return;

        const buttonGroup = tweetElement.querySelector('[role="group"]');
        if (!buttonGroup) {
            debug('Button group not found');
            return;
        }

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'css-175oi2r r-18u37iz r-1h0z5md r-1wron08';

        const button = document.createElement('button');
        button.className = 'screenshot-btn css-175oi2r r-1777fci r-bt1l66 r-bztko3 r-lrvibr r-1loqt21 r-1ny4l3l';
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', '截图');
        button.setAttribute('type', 'button');
        button.style.cursor = 'pointer';

        const contentContainer = document.createElement('div');
        contentContainer.className = 'css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-16dba41 r-1awozwy r-6koalj r-1h0z5md r-o7ynqc r-clp7b1 r-3s2u2q';
        contentContainer.setAttribute('dir', 'ltr');
        contentContainer.style.cssText = 'color: rgb(83, 100, 113); padding: 8px;';

        contentContainer.innerHTML = `
            <div class="css-175oi2r r-xoduu5">
                <svg viewBox="0 0 24 24" width="18" height="18" class="r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1xvli5t r-1hdv0qi">
                    <path fill="currentColor" d="M14.12 4l1.83 2H20v12H4V6h4.05l1.83-2h4.24M15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2zm-3 7c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3m0-2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"></path>
                </svg>
            </div>
        `;

        button.appendChild(contentContainer);
        buttonContainer.appendChild(button);

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            debug('Screenshot button clicked');

            const tweetContainer = buttonGroup.closest('article');
            if (!tweetContainer) {
                debug('Tweet container not found');
                return;
            }

            try {
                debug('Starting screenshot process');
                button.style.opacity = '0.5';

                // 创建容器并应用优化样式
                const container = document.createElement('div');
                container.className = 'screenshot-container';
                container.style.cssText = `
                    position: fixed;
                    left: -9999px;
                    top: 0;
                    padding: 20px;
                    background: white;
                    width: ${tweetContainer.offsetWidth}px;
                `;

                // 克隆并优化
                const clone = tweetContainer.cloneNode(true);

                // 应用文字渲染优化
                clone.style.cssText = `
                    font-smooth: always;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    text-rendering: optimizeLegibility;
                    transform-origin: top left;
                    background-color: white;
                `;

                // 处理所有文本元素
                clone.querySelectorAll('*').forEach(el => {
                    if (el.textContent && el.textContent.trim()) {
                        el.style.cssText += `
                            font-smooth: always;
                            -webkit-font-smoothing: antialiased;
                            -moz-osx-font-smoothing: grayscale;
                            text-rendering: optimizeLegibility;
                        `;
                    }
                });

                container.appendChild(clone);
                document.body.appendChild(container);

                // 移除不需要的元素
                clone.querySelectorAll('[role="group"]').forEach(el => {
                    el.style.display = 'none';
                });

                // 等待图片加载
                await Promise.all(Array.from(clone.querySelectorAll('img')).map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        setTimeout(reject, 5000);
                    });
                }));

                // 截图配置
                const options = {
                    backgroundColor: null,
                    scale: 3, // 增加scale以提高文字清晰度
                    logging: true,
                    allowTaint: false,
                    useCORS: true,
                    imageTimeout: 0,
                    removeContainer: true,
                    fontSmooth: true, // 启用字体平滑
                    letterRendering: true, // 启用字母渲染优化
                    ignoreElements: (element) => {
                        return element.tagName === 'BUTTON' ||
                               element.getAttribute('role') === 'button' ||
                               element.classList.contains('screenshot-btn');
                    },
                    onclone: (clonedDoc) => {
                        const clonedElement = clonedDoc.querySelector('article');
                        if (clonedElement) {
                            clonedElement.style.transform = 'scale(1)';
                            clonedElement.style.colorScheme = 'light';
                        }
                    }
                };

                const canvas = await html2canvas(clone, options);
                debug('Screenshot captured');

                document.body.removeChild(container);

                // 使用更高质量的PNG设置
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `tweet-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    setTimeout(() => {
                        URL.revokeObjectURL(url);
                        button.style.opacity = '1';
                    }, 100);
                }, 'image/png', 1.0);

                debug('Screenshot downloaded');

            } catch (error) {
                debug('Error during screenshot: ' + error.message);
                console.error('Screenshot failed:', error);
                button.style.opacity = '1';
                alert('截图失败，请刷新页面后重试');
            }
        });

        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = 'rgba(29, 155, 240, 0.1)';
        });
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = 'transparent';
        });

        buttonGroup.appendChild(buttonContainer);
        debug('Screenshot button added successfully');
    }

    function init() {
        debug('Initializing screenshot button script');

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        const tweets = node.querySelectorAll('article');
                        tweets.forEach(addScreenshotButton);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        document.querySelectorAll('article').forEach(addScreenshotButton);
        debug('Initialization completed');
    }

    if (typeof html2canvas === 'undefined') {
        debug('html2canvas not loaded, waiting for it...');
        const checkInterval = setInterval(() => {
            if (typeof html2canvas !== 'undefined') {
                debug('html2canvas loaded');
                clearInterval(checkInterval);
                init();
            }
        }, 100);
    } else {
        init();
    }
})();
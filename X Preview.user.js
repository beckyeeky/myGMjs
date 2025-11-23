// ==UserScript==
// @name           X（旧Twitter）画像プレビュー (Right Side Edition)
// @name:en        X Image Hover Preview (Right Side)
// @name:zh-CN     X 图片悬停预览 (右侧固定版)
// @namespace      https://github.com/yourname/TwitterImageHoverPreview
// @version        1.3
// @updateURL      https://github.com/beckyeeky/myGMjs/raw/refs/heads/main/X%20Preview.user.js
// @downloadURL    https://github.com/beckyeeky/myGMjs/raw/refs/heads/main/X%20Preview.user.js
// @description    大屏专用：悬停图片时，在屏幕右侧显示固定容器预览。支持滚轮切换。
// @author         Gemini(original: @pueka_3)
// @match          https://twitter.com/*
// @match          https://x.com/*
// @icon           https://x.com/favicon.ico
// @grant          GM_addStyle
// @license MIT
// ==/UserScript==

(function () {
  'use strict';

  const CONTAINER_ID = 'tm-preview-container';
  const PREVIEW_ID = 'tm-hover-preview';
  const BORDER_PX = 2;

  /** State for wheel navigation */
  let currentGallery = [];
  let currentIndex = 0;
  let wheelBind = false;

  // ───────────────────────────────────────── Styles (Container Layout)
  GM_addStyle(`
    #${CONTAINER_ID} {
      /* 固定容器位置：右侧居中 */
      position: fixed;
      top: 0;
      right: 0;
      width: 40vw; /* 限制容器宽度为屏幕宽度的 40%，可按需调整（如 600px） */
      max-width: 600px; /* 最大宽度限制 */
      height: 100vh;
      
      /* Flex布局使内部图片垂直居中 */
      display: none; /* 默认隐藏 */
      align-items: center;
      justify-content: center;
      
      z-index: 999999;
      pointer-events: none; /* 点击穿透 */
      
      /* 容器本身的过渡效果 */
      opacity: 0;
      transition: opacity 0.15s ease-out;
      background: transparent; /* 容器背景透明 */
    }

    #${PREVIEW_ID} {
      /* 图片在容器内自适应 */
      display: block;
      max-width: 95%;  /* 留出一点边距 */
      max-height: 95vh; 
      width: auto;
      height: auto;
      object-fit: contain; /* 保持比例缩放 */
      
      box-sizing: border-box;
      border: ${BORDER_PX}px solid #fff;
      box-shadow: 0 0 12px rgba(0, 0, 0, .7);
      background: #000;
    }
  `);

  // ──────────────────────────────────────── Helpers
  function ensurePreview() {
    let container = document.getElementById(CONTAINER_ID);
    let img = document.getElementById(PREVIEW_ID);

    if (!container) {
      container = document.createElement('div');
      container.id = CONTAINER_ID;
      document.body.appendChild(container);
    }

    if (!img) {
      img = document.createElement('img');
      img.id = PREVIEW_ID;
      container.appendChild(img);
    }
    
    return { container, img };
  }

  /** Convert thumbnail URL to original quality */
  function toOrig(url) {
    try {
      const u = new URL(url);
      if (u.searchParams.has('name')) u.searchParams.set('name', 'orig');
      return u.toString().replace(/:(?:small|medium|large|orig)$/i, ':orig');
    } catch (_) {
      return url;
    }
  }

  /** True if img *belongs to* a video player (should be skipped). */
  function isVideoContext(img) {
    return (
      img.closest('[data-testid="videoPlayer"], [data-testid="videoPlayerThumbnail"]') ||
      img.closest('[aria-label*="動画" i], [aria-label*="video" i]') ||
      img.closest('article')?.querySelector('video')
    );
  }

  /** Return true if URL is a photo (jpg/png/webp), false for video / gif thumbs */
  function isPhotoUrl(url) {
    let u;
    try { u = new URL(url); } catch { return false; }

    // Reject video-related paths
    if (/(?:^|\/)(?:amplify|ext_tw|tweet)_video(?:_|\/|$)/i.test(u.pathname)) return false;
    if (/video_thumb|animated_gif/i.test(u.pathname)) return false;

    // Query-param check
    const mime = u.searchParams.get('mimetype');
    if (mime && mime.startsWith('video')) return false;
    const fmt = u.searchParams.get('format');
    if (fmt) return /^(?:jpe?g|png|webp)$/i.test(fmt);

    // File extension fallback
    return /\.(?:jpe?g|png|webp)$/i.test(u.pathname);
  }

  /** Collect all photo URLs in the same tweet (gallery) for wheel navigation */
  function collectGallery(img) {
    const article = img.closest('article');
    if (!article) return [toOrig(img.src)];

    const imgs = Array.from(article.querySelectorAll('img'));
    const urls = [];
    for (const i of imgs) {
      const url = toOrig(i.src);
      if (!url.includes('/media/')) continue; // only media images
      if (isPhotoUrl(url) && !isVideoContext(i) && !urls.includes(url)) urls.push(url);
    }
    return urls.length ? urls : [toOrig(img.src)];
  }

  // ───────────────────────────────────────── Wheel Handler
  function onWheel(e) {
    if (currentGallery.length <= 1) return;

    const direction = e.deltaY > 0 ? 1 : -1;

    // 边界检查
    if (currentIndex === 0 && direction === -1) return;
    if (currentIndex === currentGallery.length - 1 && direction === 1) return;

    e.preventDefault();

    currentIndex += direction;
    const nextSrc = currentGallery[currentIndex];

    const { container, img } = ensurePreview();
    
    // 切换图片时的简单闪烁效果（可选）
    // img.style.opacity = '0.5';

    const buffer = new Image();
    buffer.onload = () => {
      img.src = buffer.src;
      // img.style.opacity = '1';
    };
    buffer.src = nextSrc;
  }

  function bindWheel() {
    if (!wheelBind) {
      window.addEventListener('wheel', onWheel, { passive: false });
      wheelBind = true;
    }
  }
  function unbindWheel() {
    if (wheelBind) {
      window.removeEventListener('wheel', onWheel, { passive: false });
      wheelBind = false;
    }
  }

  // ───────────────────────────────────────── Events
  function showPreview(e) {
    const targetImg = /** @type {HTMLImageElement} */ (e.currentTarget);

    if (isVideoContext(targetImg)) { hidePreview(); return; }

    const src = toOrig(targetImg.src);
    if (!isPhotoUrl(src)) { hidePreview(); return; }

    currentGallery = collectGallery(targetImg);
    currentIndex = currentGallery.indexOf(src);
    if (currentIndex === -1) currentIndex = 0;

    const { container, img } = ensurePreview();

    const buffer = new Image();
    buffer.onload = () => {
      img.src = buffer.src;
      container.style.display = 'flex'; // 使用flex布局
      // 强制重绘
      void container.offsetWidth;
      container.style.opacity = '1';
      bindWheel();
    };
    buffer.src = src;

    // 如果容器是隐藏的，确保开始时opacity为0
    if (container.style.display === 'none') {
        container.style.opacity = '0';
    }
  }

  function hidePreview() {
    const container = document.getElementById(CONTAINER_ID);
    if (container) {
      container.style.opacity = '0';
      container.addEventListener('transitionend', () => { 
          if (container.style.opacity === '0') container.style.display = 'none'; 
      }, { once: true });
    }
    unbindWheel();
    currentGallery = [];
  }

  // ─────────────────────────────────── Binding & Observer
  function bind(img) {
    if (img.dataset.tmHoverBound) return;
    img.dataset.tmHoverBound = '1';
    img.addEventListener('mouseenter', showPreview);
    img.addEventListener('mouseleave', hidePreview);
  }

  const obs = new MutationObserver((mut) => {
    for (const m of mut) {
      for (const node of m.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.tagName === 'IMG') bind(node);
        node.querySelectorAll?.('img').forEach(bind);
      }
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });

  document.querySelectorAll('img').forEach(bind);
})();
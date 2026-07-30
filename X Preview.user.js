// ==UserScript==
// @name           X（旧Twitter）画像プレビュー (Right Side Edition)
// @name:en        X Image Hover Preview (Right Side)
// @name:zh-CN     X 图片悬停预览 (右侧固定版)
// @namespace    https://github.com/beckyeeky/myGMjs
// @author       beckyeeky
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Preview.user.js
// @downloadURL  https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Preview.user.js
// @version        1.4
// @description    大屏专用：悬停图片时，在屏幕右侧显示固定容器预览。仅在悬停媒体时响应滚轮切换。
// @match          https://twitter.com/*
// @match          https://x.com/*
// @icon           https://x.com/favicon.ico
// @grant          GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  const CONTAINER_ID = 'tm-preview-container';
  const PREVIEW_ID = 'tm-hover-preview';
  const BORDER_PX = 2;

  /** State for hover preview and wheel navigation */
  let currentGallery = [];
  let currentIndex = 0;
  let wheelBind = false;
  let activeHoverImg = null;
  let activeRequestId = 0;

  // ───────────────────────────────────────── Styles (Container Layout)
  GM_addStyle(`
    #${CONTAINER_ID} {
      position: fixed;
      top: 0;
      right: 0;
      width: 40vw;
      max-width: 600px;
      height: 100vh;
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease-out;
      background: transparent;
    }

    #${PREVIEW_ID} {
      display: block;
      max-width: 95%;
      max-height: 95vh;
      width: auto;
      height: auto;
      object-fit: contain;
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

  function toOrig(url) {
    try {
      const u = new URL(url);
      if (u.searchParams.has('name')) u.searchParams.set('name', 'orig');
      return u.toString().replace(/:(?:small|medium|large|orig)$/i, ':orig');
    } catch (_) {
      return url;
    }
  }

  function getMediaImage(target) {
    const img = target instanceof HTMLImageElement ? target : target.closest?.('img');
    if (!(img instanceof HTMLImageElement)) return null;
    if (!img.src || !img.src.includes('/media/')) return null;
    return img;
  }

  function getMediaRoot(img) {
    return img.closest(
      '[data-testid="tweetPhoto"], [data-testid="card.wrapper"], [data-testid="videoPlayer"], [data-testid="videoPlayerThumbnail"]'
    ) || img.closest('a[href*="/photo/"], a[href*="/status/"]') || img.parentElement;
  }

  /** True if img belongs to a nearby video-specific media block (should be skipped). */
  function isVideoContext(img) {
    const mediaRoot = getMediaRoot(img);
    if (!mediaRoot) return false;

    return Boolean(
      mediaRoot.closest('[data-testid="videoPlayer"], [data-testid="videoPlayerThumbnail"]') ||
      mediaRoot.querySelector('video') ||
      mediaRoot.matches?.('[aria-label*="動画" i], [aria-label*="video" i]') ||
      mediaRoot.closest?.('[aria-label*="動画" i], [aria-label*="video" i]')
    );
  }

  function isPhotoUrl(url) {
    let u;
    try { u = new URL(url); } catch { return false; }

    if (/(?:^|\/)(?:amplify|ext_tw|tweet)_video(?:_|\/|$)/i.test(u.pathname)) return false;
    if (/video_thumb|animated_gif/i.test(u.pathname)) return false;

    const mime = u.searchParams.get('mimetype');
    if (mime && mime.startsWith('video')) return false;
    const fmt = u.searchParams.get('format');
    if (fmt) return /^(?:jpe?g|png|webp)$/i.test(fmt);

    return /\.(?:jpe?g|png|webp)$/i.test(u.pathname);
  }

  function collectGallery(img) {
    const article = img.closest('article');
    if (!article) return [toOrig(img.src)];

    const imgs = Array.from(article.querySelectorAll('img'));
    const urls = [];
    for (const item of imgs) {
      if (!item.src || !item.src.includes('/media/')) continue;
      const url = toOrig(item.src);
      if (isPhotoUrl(url) && !isVideoContext(item) && !urls.includes(url)) urls.push(url);
    }

    return urls.length ? urls : [toOrig(img.src)];
  }

  function canHandleWheel(eventTarget) {
    if (activeHoverImg && activeHoverImg.isConnected) {
      const mediaRoot = getMediaRoot(activeHoverImg);
      if (mediaRoot?.contains(eventTarget)) return true;
    }

    const container = document.getElementById(CONTAINER_ID);
    return Boolean(container && container.contains(eventTarget));
  }

  function loadPreview(src, onReady) {
    const requestId = ++activeRequestId;
    const buffer = new Image();
    buffer.onload = () => {
      if (requestId !== activeRequestId) return;
      onReady(buffer.src);
    };
    buffer.src = src;
  }

  // ───────────────────────────────────────── Wheel Handler
  function onWheel(e) {
    if (currentGallery.length <= 1) return;
    if (!(e.target instanceof Element)) return;
    if (!canHandleWheel(e.target)) return;

    const direction = e.deltaY > 0 ? 1 : -1;

    if (currentIndex === 0 && direction === -1) return;
    if (currentIndex === currentGallery.length - 1 && direction === 1) return;

    e.preventDefault();

    currentIndex += direction;
    const nextSrc = currentGallery[currentIndex];
    const { img } = ensurePreview();

    loadPreview(nextSrc, (loadedSrc) => {
      img.src = loadedSrc;
    });
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
  function showPreviewFor(img) {
    if (isVideoContext(img)) {
      hidePreview();
      return;
    }

    const src = toOrig(img.src);
    if (!isPhotoUrl(src)) {
      hidePreview();
      return;
    }

    activeHoverImg = img;
    currentGallery = collectGallery(img);
    currentIndex = currentGallery.indexOf(src);
    if (currentIndex === -1) currentIndex = 0;

    const { container, img: previewImg } = ensurePreview();
    if (container.style.display === 'none') {
      container.style.opacity = '0';
    }

    loadPreview(src, (loadedSrc) => {
      previewImg.src = loadedSrc;
      container.style.display = 'flex';
      void container.offsetWidth;
      container.style.opacity = '1';
      bindWheel();
    });
  }

  function hidePreview() {
    const container = document.getElementById(CONTAINER_ID);
    activeRequestId += 1;
    activeHoverImg = null;
    if (container) {
      container.style.opacity = '0';
      container.addEventListener('transitionend', () => {
        if (container.style.opacity === '0') container.style.display = 'none';
      }, { once: true });
    }

    unbindWheel();
    currentGallery = [];
    currentIndex = 0;
  }

  function onPointerOver(e) {
    const img = getMediaImage(e.target);
    if (!img || img === activeHoverImg) return;
    showPreviewFor(img);
  }

  function onPointerOut(e) {
    if (!(e.target instanceof Element)) return;

    const img = getMediaImage(e.target);
    if (!img || img !== activeHoverImg) return;

    const nextTarget = e.relatedTarget;
    const mediaRoot = getMediaRoot(img);
    const container = document.getElementById(CONTAINER_ID);

    if (nextTarget instanceof Node) {
      if (mediaRoot?.contains(nextTarget)) return;
      if (container?.contains(nextTarget)) return;
    }

    hidePreview();
  }

  document.addEventListener('mouseover', onPointerOver, true);
  document.addEventListener('mouseout', onPointerOut, true);
})();

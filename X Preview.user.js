// ==UserScript==
// @name           X（旧Twitter）画像プレビュー (Right Side Edition)
// @name:en        X Image Hover Preview (Right Side)
// @name:zh-CN     X 图片悬停预览 (右侧固定版)
// @namespace      https://github.com/yourname/TwitterImageHoverPreview
// @version        1.2
// @updateURL      https://github.com/beckyeeky/myGMjs/raw/refs/heads/main/X%20Preview.user.js
// @downloadURL    https://github.com/beckyeeky/myGMjs/raw/refs/heads/main/X%20Preview.user.js
// @description    大屏专用：悬停图片时，在屏幕右侧（距右100px）显示原图预览。高度自适应占满屏幕，宽度最大1200px。支持滚轮切换。
// @author         Gemini(original: @pueka_3)
// @match          https://twitter.com/*
// @match          https://x.com/*
// @icon           https://x.com/favicon.ico
// @grant          GM_addStyle
// @license MIT
// ==/UserScript==

(function () {
  'use strict';

  const PREVIEW_ID = 'tm-hover-preview';
  const BORDER_PX = 2;

  /** State for wheel navigation */
  let currentGallery = [];
  let currentIndex = 0;
  let wheelBind = false;

  // ───────────────────────────────────────── Styles (Modified for Right Side)
  GM_addStyle(`
    #${PREVIEW_ID} {
      position: fixed;
      top: 50%;
      /* 核心修改：不再居中，而是固定在右侧 */
      left: auto;
      right: 100px; 
      /* 核心修改：垂直居中，水平方向不移动 */
      transform: translateY(-50%);
      
      /* 核心修改：尺寸限制 */
      /* 强制限制最大宽度为1200px，防止orig大图溢出 */
      max-width: 1200px !important; 
      max-height: 98vh !important;
      
      /* 确保宽高自适应 */
      width: auto !important; 
      height: auto !important;
      
      /* 重置可能干扰的最小尺寸 */
      min-width: 0 !important;
      min-height: 0 !important;
      
      /* 防止边框撑大尺寸 */
      box-sizing: border-box !important;
      
      border: ${BORDER_PX}px solid #fff;
      box-shadow: 0 0 12px rgba(0, 0, 0, .7);
      z-index: 999999;
      pointer-events: none;
      display: none;
      background: #000;
      opacity: 0;
      transition: opacity .15s ease-out;
    }
  `);

  // ──────────────────────────────────────── Helpers
  function ensurePreview() {
    let el = document.getElementById(PREVIEW_ID);
    if (!el) {
      el = document.createElement('img');
      el.id = PREVIEW_ID;
      document.body.appendChild(el);
    }
    return el;
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

    // 边界检查：第一张向上滚，或最后一张向下滚 -> 允许网页滚动，不切换
    if (currentIndex === 0 && direction === -1) return;
    if (currentIndex === currentGallery.length - 1 && direction === 1) return;

    // 否则阻止网页滚动，切换图片
    e.preventDefault();

    currentIndex += direction;
    const nextSrc = currentGallery[currentIndex];

    const preview = ensurePreview();
    preview.style.opacity = '0';

    const buffer = new Image();
    buffer.onload = () => {
      preview.src = buffer.src;
      // void preview.offsetWidth; // 这里的重绘对于连续切图不是必须的，去掉可减少闪烁
      preview.style.opacity = '1';
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
    const img = /** @type {HTMLImageElement} */ (e.currentTarget);

    if (isVideoContext(img)) { hidePreview(); return; }

    const src = toOrig(img.src);
    if (!isPhotoUrl(src)) { hidePreview(); return; }

    currentGallery = collectGallery(img);
    currentIndex = currentGallery.indexOf(src);
    if (currentIndex === -1) currentIndex = 0;

    const preview = ensurePreview();

    const buffer = new Image();
    buffer.onload = () => {
      preview.src = buffer.src;
      preview.style.display = 'block';
      // 强制重绘以触发transition
      void preview.offsetWidth;
      preview.style.opacity = '1';
      bindWheel();
    };
    buffer.src = src;

    // 加载过程中先隐藏旧图
    preview.style.opacity = '0';
  }

  function hidePreview() {
    const p = document.getElementById(PREVIEW_ID);
    if (p) {
      p.style.opacity = '0';
      // 使用 once: true 防止多次绑定堆叠
      p.addEventListener('transitionend', () => { 
          if (p.style.opacity === '0') p.style.display = 'none'; 
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
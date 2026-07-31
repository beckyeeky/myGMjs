// ==UserScript==
// @name         X 图片瀑布流画廊（稳定布局 + 自动加载）
// @namespace    https://github.com/beckyeeky/myGMjs
// @author       beckyeeky
// @license      MIT
// @version      0.6.0
// @description  汇总当前 X 时间线图片；稳定瀑布流、Like 快捷按钮、原推文链接，并可自动滚动加载。
// @downloadURL  https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Image%20Waterfall.user.js
// @updateURL    https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Image%20Waterfall.user.js
// @require      https://raw.githubusercontent.com/beckyeeky/myGMjs/main/dist/x-like-adapter.js
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
(() => {
  'use strict';
  const ID = 'minis-x-waterfall';
  const items = new Map();
  let opened = false, auto = false, autoTimer = null, mutationTimer = null;
  let previousCount = 0, idleRounds = 0, columnCount = 0;

  const style = document.createElement('style');
  style.textContent = `
#${ID}-button{position:fixed;right:20px;bottom:88px;z-index:2147483646;border:0;border-radius:999px;padding:11px 16px;background:#1d9bf0;color:#fff;font:600 14px system-ui,-apple-system,sans-serif;box-shadow:0 3px 14px #0008;cursor:pointer}
html.${ID}-locked,body.${ID}-locked{overscroll-behavior:none!important}
#${ID}-panel{position:fixed;inset:0;z-index:2147483645;display:none;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;isolation:isolate;contain:layout paint style;background:#000;padding:64px 14px 30px;box-sizing:border-box;transform:translateZ(0);backface-visibility:hidden}#${ID}-panel.open{display:block}
#${ID}-bar{position:fixed;inset:0 0 auto;height:54px;z-index:2;display:flex;align-items:center;gap:10px;padding:0 14px;background:#16181c;color:#e7e9ea;font:14px system-ui,-apple-system,sans-serif;border-bottom:1px solid #2f3336}#${ID}-bar strong{white-space:nowrap}#${ID}-bar .auto{margin-left:auto;background:#1d9bf0;color:#fff}#${ID}-bar .close{background:#2f3336;color:#e7e9ea}#${ID}-bar button{border:0;border-radius:18px;padding:7px 10px;font-weight:700;cursor:pointer}#${ID}-bar button:active{transform:scale(.96)}
@media (max-width:600px){#${ID}-panel{padding:60px 8px 20px}#${ID}-bar{height:52px;padding:0 10px;gap:7px}#${ID}-count{font-size:12px}#${ID}-bar button{padding:7px 9px}}
#${ID}-grid{display:flex;align-items:flex-start;gap:10px;width:100%;max-width:1600px;margin:auto}.${ID}-column{display:flex;flex:1 1 0;min-width:0;flex-direction:column;gap:10px}
.${ID}-card{display:block;position:relative;width:100%;overflow:hidden;border-radius:12px;background:#16181c;line-height:0;box-shadow:0 1px 3px #0005}.${ID}-card img{display:block;width:100%;height:auto;transition:transform .16s ease;pointer-events:none;user-select:none;-webkit-user-drag:none}.${ID}-card:hover img{transform:scale(1.018)}.${ID}-tag{position:absolute;right:8px;bottom:8px;z-index:1;display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px;background:#000b;color:#fff;font-size:16px;line-height:1;text-decoration:none;box-shadow:0 1px 5px #0009}.${ID}-like{position:absolute;left:8px;bottom:8px;z-index:1;display:flex;align-items:center;justify-content:center;width:34px;height:34px;border:0;border-radius:999px;background:#000b;color:#fff;font-size:18px;line-height:1;cursor:pointer;box-shadow:0 1px 5px #0009}.${ID}-like.active{color:#f91880;transform:scale(1.04)}.${ID}-like:disabled{cursor:default}
`;
  document.head.append(style);

  const launch = document.createElement('button'); launch.id = ID + '-button'; launch.textContent = '图片瀑布流';
  const panel = document.createElement('section'); panel.id = ID + '-panel';
  panel.innerHTML = `<div id="${ID}-bar"><strong>图片瀑布流</strong><span id="${ID}-count">0 张</span><button class="auto" type="button">自动加载</button><button class="close" type="button">关闭</button></div><main id="${ID}-grid"></main>`;
  document.body.append(launch, panel);
  const grid = panel.querySelector('#' + ID + '-grid');
  const counter = panel.querySelector('#' + ID + '-count');
  const autoButton = panel.querySelector('.auto');

  const mediaURL = url => url.replace(/([?&])name=[^&]*/i, '$1name=large');
  const columnsForWidth = () => innerWidth >= 1450 ? 5 : innerWidth >= 1100 ? 4 : innerWidth >= 700 ? 3 : 2;
  function setCount() { counter.textContent = `${items.size} 张（已收集）`; launch.textContent = `图片瀑布流 (${items.size})`; }
  function ensureColumns(force = false) {
    const needed = columnsForWidth();
    if (!force && grid.children.length === needed) return;
    columnCount = needed;
    grid.replaceChildren(...Array.from({length: needed}, () => {
      const column = document.createElement('div'); column.className = ID + '-column'; column.load = 0; column.cards = 0; return column;
    }));
    for (const entry of items.values()) entry.mounted = false;
  }
  function shortestColumn() {
    // 综合累计图片高度与卡片数量：Lazy-load 尚未返回尺寸时，也不会持续堆到同一列。
    return [...grid.children].reduce((best, col) =>
      (col.load + col.cards * 180) < (best.load + best.cards * 180) ? col : best
    );
  }
  async function like(entry, likeButton, event) {
    event.preventDefault(); event.stopPropagation();
    if (likeButton.disabled) return;
    const id = (entry.href.match(/status(?:es)?\/(\d{5,25})/) || [])[1];
    if (!id) return;
    likeButton.disabled = true; likeButton.textContent = '…'; likeButton.title = '正在喜欢';
    let synced = false;
    try {
      const action = window.__X_IMAGE_WATERFALL_ACTION__;
      if (action && typeof action.like === 'function') { await action.like(id); synced = true; }
    } catch (_) {}
    if (!synced && entry.article) {
      // Adapter 不可用或失败时，退回 X 页面上的原按钮。
      const button = entry.article.querySelector('[data-testid="like"]');
      if (button) { button.click(); synced = true; }
    }
    if (synced) {
      likeButton.classList.add('active'); likeButton.textContent = '♥'; likeButton.title = '已喜欢';
    } else {
      likeButton.textContent = '♡'; likeButton.title = '未能同步喜欢'; likeButton.disabled = false;
    }
  }
  function mountNew() {
    ensureColumns();
    for (const entry of items.values()) {
      if (entry.mounted) continue;
      const card = document.createElement('div'); card.className = ID + '-card';
      const image = new Image(); image.loading = 'lazy'; image.src = entry.src; image.alt = '时间线图片';
      const likeButton = document.createElement('button'); likeButton.className = ID + '-like'; likeButton.type = 'button'; likeButton.textContent = '♡'; likeButton.title = '喜欢';
      likeButton.addEventListener('click', event => like(entry, likeButton, event));
      const tag = document.createElement('a'); tag.className = ID + '-tag'; tag.href = entry.href; tag.target = '_blank'; tag.rel = 'noopener noreferrer'; tag.textContent = '🔗'; tag.title = '打开原推文'; tag.setAttribute('aria-label', '打开原推文');
      card.append(image, likeButton, tag);
      const column = shortestColumn();
      column.append(card); column.cards++;
      image.onload = () => { column.load += image.naturalHeight || image.height || 250; };
      entry.mounted = true;
    }
  }
  function addRemoteMedia(media) {
    let added = 0;
    for (const entry of (media || [])) {
      if (!entry || !entry.src || !entry.href) continue;
      const key = entry.src.replace(/([?&])name=[^&]*/i, '');
      if (!items.has(key)) { items.set(key, {src: mediaURL(entry.src), href: entry.href, article: null, mounted: false}); added++; }
    }
    if (opened && added) mountNew();
    setCount(); return added;
  }
  function scan() {
    let added = 0;
    document.querySelectorAll('article').forEach(article => {
      const status = article.querySelector('a[href*="/status/"]');
      const href = status ? status.href : location.href;
      article.querySelectorAll('img').forEach(image => {
        const src = image.currentSrc || image.src || '';
        if (!/^https:\/\/pbs\.twimg\.com\/media\//.test(src)) return;
        const key = src.replace(/([?&])name=[^&]*/i, '');
        if (!items.has(key)) { items.set(key, {src: mediaURL(src), href, article, mounted: false}); added++; }
      });
    });
    if (opened && added) mountNew();
    setCount();
    return added;
  }
  let pageScrollY = 0;
  function lockBackground() {
    pageScrollY = window.scrollY || window.pageYOffset || 0;
    document.documentElement.classList.add(ID + '-locked');
    document.body.classList.add(ID + '-locked');
  }
  function unlockBackground() {
    document.documentElement.classList.remove(ID + '-locked');
    document.body.classList.remove(ID + '-locked');
  }
  function openGallery(value) {
    const next = value ?? !opened;
    if (next === opened) return;
    opened = next;
    panel.classList.toggle('open', opened);
    if (opened) { lockBackground(); ensureColumns(true); mountNew(); setCount(); }
    else { stopAuto(); unlockBackground(); }
  }
  function timelineStep() {
    // Keep X's virtual timeline moving even while the modal is open. The panel blocks user
    // touch by covering the viewport, but we intentionally leave the document scrollable.
    const articles = document.querySelectorAll('article');
    const last = articles[articles.length - 1];
    if (last) last.scrollIntoView({block: 'end', behavior: 'auto'});
    else window.scrollBy({top: Math.round(innerHeight * .8), behavior: 'auto'});
  }
  async function apiStep() {
    const action = window.__X_IMAGE_WATERFALL_ACTION__;
    if (!action || !action.timelineReady || !action.timelineReady()) return null;
    const media = await action.loadMoreTimeline();
    return addRemoteMedia(media);
  }
  function updateAutoLabel(mode = '') { autoButton.textContent = auto ? `停止加载${mode}` : '自动加载'; }
  function stopAuto() { auto = false; clearInterval(autoTimer); autoTimer = null; updateAutoLabel(); }
  function toggleAuto() {
    if (auto) return stopAuto();
    auto = true; idleRounds = 0; previousCount = items.size; updateAutoLabel('（准备中）');
    let fallbackUsed = false;
    const tick = async () => {
      if (!auto) return;
      let added = null;
      try { added = await apiStep(); } catch (_) { added = null; }
      if (added === null) {
        // First use needs X to issue its HomeTimeline request once. Compatibility fallback only.
        fallbackUsed = true; updateAutoLabel('（兼容模式）'); timelineStep(); scan();
      } else updateAutoLabel('（无滚动）');
      idleRounds = items.size === previousCount ? idleRounds + 1 : 0;
      previousCount = items.size;
      if (idleRounds >= (fallbackUsed ? 8 : 4)) return stopAuto();
    };
    tick(); autoTimer = setInterval(tick, 1400);
  }
  // The full-screen panel itself is the interaction barrier. Do not capture-stop events:
  // that would also stop Like/link handlers and X's own programmatic timeline refresh.
  launch.onclick = () => openGallery(); panel.querySelector('.close').onclick = () => openGallery(false); autoButton.onclick = toggleAuto;
  addEventListener('keydown', e => { if (e.key === 'Escape') openGallery(false); });
  addEventListener('resize', () => { if (opened && columnsForWidth() !== columnCount) { ensureColumns(true); mountNew(); } });
  new MutationObserver(() => { clearTimeout(mutationTimer); mutationTimer = setTimeout(scan, 250); }).observe(document.documentElement, {childList: true, subtree: true});
  scan();
})();

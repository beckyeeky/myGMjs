// ==UserScript==
// @name         X 图片瀑布流画廊（稳定布局 + 自动加载）
// @namespace    https://github.com/beckyeeky/myGMjs
// @author       beckyeeky
// @license      MIT
// @version      0.7.9
// @description  面向 Tampermonkey 的 X 图片瀑布流；恢复按需 GraphQL Like，不拦截 X 启动请求。
// @downloadURL  https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Image%20Waterfall.user.js
// @updateURL    https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Image%20Waterfall.user.js
// @require      https://raw.githubusercontent.com/beckyeeky/myGMjs/main/dist/x-like-adapter.js
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==
(() => {
  'use strict';
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once: true});
  } else init();
  function init() {
  const ID = 'minis-x-waterfall';
  let maxItems = Math.max(50, Math.min(1000, Number(GM_getValue('maxItems', 500)) || 500));
  const pageWindow = typeof unsafeWindow === 'object' && unsafeWindow ? unsafeWindow : window;
  const items = new Map();
  let opened = false, auto = false, autoTimer = null, mutationTimer = null, autoBusy = false;
  let previousCount = 0, idleRounds = 0, columnCount = 0;

  const style = document.createElement('style');
  style.textContent = `
#${ID}-button{position:fixed;right:20px;bottom:88px;z-index:2147483646;border:0;border-radius:999px;padding:11px 16px;background:#1d9bf0;color:#fff;font:600 14px system-ui,-apple-system,sans-serif;box-shadow:0 3px 14px #0008;cursor:pointer}
html.${ID}-locked,body.${ID}-locked{overscroll-behavior:none!important}
#${ID}-panel{position:fixed;inset:0;z-index:2147483645;display:none;overflow:hidden;isolation:isolate;background:#000;color:#e7e9ea;box-sizing:border-box;pointer-events:auto;touch-action:none}#${ID}-panel.open{display:flex;flex-direction:column}
#${ID}-bar{position:sticky;top:0;flex:0 0 54px;width:100%;z-index:10;display:flex;align-items:center;gap:10px;padding:0 14px;box-sizing:border-box;background:#16181c;color:#e7e9ea;font:14px system-ui,-apple-system,sans-serif;border-bottom:1px solid #2f3336;box-shadow:0 2px 8px #0008}#${ID}-bar strong{white-space:nowrap}#${ID}-bar .auto{margin-left:auto;background:#1d9bf0;color:#fff}#${ID}-bar .close{background:#2f3336;color:#e7e9ea}#${ID}-bar button{border:0;border-radius:18px;padding:7px 10px;font-weight:700;cursor:pointer}#${ID}-bar button:active{transform:scale(.96)}
#${ID}-viewport{position:relative;flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;background:#000;padding:10px 14px 30px;box-sizing:border-box}
@media (max-width:600px){#${ID}-bar{flex-basis:52px;padding:0 10px;gap:7px}#${ID}-viewport{padding:8px 8px 20px}#${ID}-count{font-size:12px}#${ID}-bar button{padding:7px 9px}}
#${ID}-grid{display:flex;align-items:flex-start;gap:10px;width:100%;max-width:1600px;margin:auto}.${ID}-column{display:flex;flex:1 1 0;min-width:0;flex-direction:column;gap:10px}
.${ID}-card{display:block;position:relative;width:100%;overflow:hidden;border-radius:12px;background:#16181c;line-height:0;box-shadow:0 1px 3px #0005}.${ID}-card img{display:block;width:100%;height:auto;transition:transform .16s ease;pointer-events:none;user-select:none;-webkit-user-drag:none}.${ID}-card:hover img{transform:scale(1.018)}.${ID}-tag{position:absolute;right:6px;bottom:6px;z-index:3;display:flex;align-items:center;justify-content:center;width:42px;height:42px;padding:0;border:0;border-radius:999px;background:#000d;color:#fff;font-size:17px;line-height:1;text-decoration:none;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;box-shadow:0 1px 5px #0009}.${ID}-like{position:absolute;left:6px;bottom:6px;z-index:3;display:flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;border:0;border-radius:999px;background:#000d;color:#fff;font-size:21px;line-height:1;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;box-shadow:0 1px 5px #0009}.${ID}-like.active{color:#f91880;transform:scale(1.04)}.${ID}-like.pending{opacity:.8}.${ID}-like.error{color:#ffd400}.${ID}-like:disabled{cursor:wait}
`;
  document.head.append(style);

  const launch = document.createElement('button'); launch.id = ID + '-button'; launch.textContent = '图片瀑布流';
  const panel = document.createElement('section'); panel.id = ID + '-panel';
  panel.innerHTML = `<div id="${ID}-bar"><strong>图片瀑布流</strong><span id="${ID}-count">0 张</span><button class="auto" type="button">自动加载</button><button class="close" type="button">关闭</button></div><div id="${ID}-viewport"><main id="${ID}-grid"></main></div>`;
  document.body.append(launch, panel);
  const grid = panel.querySelector('#' + ID + '-grid');
  const counter = panel.querySelector('#' + ID + '-count');
  const autoButton = panel.querySelector('.auto');

  const mediaURL = url => url.replace(/([?&])name=[^&]*/i, '$1name=large');
  const columnsForWidth = () => innerWidth >= 1450 ? 5 : innerWidth >= 1100 ? 4 : innerWidth >= 700 ? 3 : 2;
  function setCount() { counter.textContent = `${items.size}/${maxItems} 张`; launch.textContent = `图片瀑布流 (${items.size})`; }
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
    return [...grid.children].reduce((best, col) => col.load < best.load ? col : best);
  }
  function estimatedHeight(entry) {
    const ratio = Number(entry.ratio);
    // 以统一列宽 1000 归一化高度；未知尺寸先按接近方图估算。
    return ratio > 0 ? Math.max(350, Math.min(2400, 1000 / ratio)) : 1000;
  }
  function currentArticle(id) {
    for (const article of document.querySelectorAll('article')) {
      if (article.querySelector(`a[href*="/status/${id}"]`)) return article;
    }
    return null;
  }
  async function like(entry, likeButton, event) {
    event.preventDefault(); event.stopPropagation();
    if (likeButton.disabled || likeButton.classList.contains('active')) return;
    const id = (entry.href.match(/status(?:es)?\/(\d{5,25})/) || [])[1];
    if (!id) return;
    likeButton.disabled = true; likeButton.classList.remove('error'); likeButton.classList.add('pending');
    likeButton.textContent = '…'; likeButton.title = '正在喜欢';
    let synced = false;
    try {
      const action = pageWindow.__X_IMAGE_WATERFALL_ACTION__;
      if (!action || typeof action.like !== 'function') throw new Error('Like adapter unavailable');
      const result = await action.like(id);
      synced = !!(result && result.ok);
    } catch (_) {}
    if (!synced) {
      const article = currentArticle(id) || (entry.article && entry.article.isConnected ? entry.article : null);
      const button = article && article.querySelector('[data-testid="like"]');
      if (button) { button.click(); synced = true; }
    }
    likeButton.classList.remove('pending'); likeButton.disabled = false;
    if (synced) {
      likeButton.classList.add('active'); likeButton.textContent = '♥'; likeButton.title = '已喜欢';
    } else {
      likeButton.classList.add('error'); likeButton.textContent = '♡'; likeButton.title = '未能同步喜欢，点按重试';
      setTimeout(() => likeButton.classList.remove('error'), 1600);
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
      const tag = document.createElement('button'); tag.className = ID + '-tag'; tag.type = 'button'; tag.textContent = '🔗'; tag.title = '打开原推文'; tag.setAttribute('aria-label', '打开原推文');
      tag.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); GM_openInTab(entry.href, {active: true, setParent: true}); });
      card.append(image, likeButton, tag);
      const column = shortestColumn();
      const estimate = estimatedHeight(entry);
      column.load += estimate; column.cards++; column.append(card);
      image.onload = () => {
        const actual = image.naturalWidth ? Math.max(350, Math.min(2400, 1000 * image.naturalHeight / image.naturalWidth)) : estimate;
        column.load += actual - estimate;
      };
      entry.mounted = true;
    }
  }
  function scan() {
    let added = 0;
    document.querySelectorAll('article').forEach(article => {
      if (items.size >= maxItems) return;
      const status = article.querySelector('a[href*="/status/"]');
      const href = status ? status.href : location.href;
      article.querySelectorAll('img').forEach(image => {
        const src = image.currentSrc || image.src || '';
        if (!/^https:\/\/pbs\.twimg\.com\/media\//.test(src)) return;
        const key = src.replace(/([?&])name=[^&]*/i, '');
        if (items.size < maxItems && !items.has(key)) {
          const ratio = image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : 0;
          items.set(key, {src: mediaURL(src), href, article, ratio, mounted: false}); added++;
        }
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
    if (opened) { lockBackground(); ensureColumns(true); scan(); mountNew(); setCount(); }
    else { stopAuto(); unlockBackground(); }
  }
  function scrollTimeline() {
    const articles = document.querySelectorAll('article');
    const last = articles[articles.length - 1];
    if (last) last.scrollIntoView({block: 'end', behavior: 'smooth'});
    else window.scrollBy({top: Math.round(innerHeight * .8), behavior: 'smooth'});
    autoButton.textContent = '滚动加载中…';
  }
  async function autoStep() {
    if (!auto || autoBusy) return;
    autoBusy = true; scrollTimeline();
    await new Promise(resolve => setTimeout(resolve, 650));
    const added = scan();
    autoBusy = false;
    idleRounds = added ? 0 : idleRounds + 1;
    previousCount = items.size;
    if (items.size >= maxItems || idleRounds >= 14) stopAuto();
  }
  function updateAutoLabel() { autoButton.textContent = auto ? '停止加载' : '自动加载'; }
  function stopAuto() { auto = false; autoBusy = false; clearInterval(autoTimer); autoTimer = null; updateAutoLabel(); }
  function toggleAuto() {
    if (auto) return stopAuto();
    if (items.size >= maxItems) { setCount(); return; }
    auto = true; idleRounds = 0; previousCount = items.size; updateAutoLabel();
    autoStep();
    autoTimer = setInterval(autoStep, 1400);
  }
  // The full-screen panel itself is the interaction barrier. Do not capture-stop events:
  // that would also stop Like/link handlers and X's own programmatic timeline refresh.
  GM_registerMenuCommand('打开 / 关闭图片瀑布流', () => openGallery());
  GM_registerMenuCommand('启动 / 停止自动加载', () => { if (!opened) openGallery(true); toggleAuto(); });
  GM_registerMenuCommand(`设置图片上限（当前 ${maxItems}）`, () => {
    const value = Number(prompt('图片收集上限（50–1000，刷新页面后完全生效）', String(maxItems)));
    if (!Number.isFinite(value)) return;
    maxItems = Math.max(50, Math.min(1000, Math.round(value)));
    GM_setValue('maxItems', maxItems); setCount();
  });
  launch.onclick = () => openGallery(); panel.querySelector('.close').onclick = () => openGallery(false); autoButton.onclick = toggleAuto;
  addEventListener('keydown', e => { if (e.key === 'Escape') openGallery(false); });
  addEventListener('resize', () => { if (opened && columnsForWidth() !== columnCount) { ensureColumns(true); mountNew(); } });
  const timelineRoot = document.body;
  new MutationObserver(() => { clearTimeout(mutationTimer); mutationTimer = setTimeout(scan, 180); }).observe(timelineRoot, {childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset']});
  // 捕获懒加载图片只更新 currentSrc/src 的情况，MutationObserver 不一定收到属性变化。
  document.addEventListener('load', event => {
    const image = event.target;
    if (image && image.tagName === 'IMG' && /^https:\/\/pbs\.twimg\.com\/media\//.test(image.currentSrc || image.src || '')) {
      clearTimeout(mutationTimer); mutationTimer = setTimeout(scan, 60);
    }
  }, true);
  scan();
  }
})();

// ==UserScript==
// @name         X 图片瀑布流画廊（稳定布局 + 自动加载）
// @namespace    https://github.com/beckyeeky/myGMjs
// @author       beckyeeky
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Image%20Waterfall.user.js
// @downloadURL  https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Image%20Waterfall.user.js
// @version      0.3.1
// @description  汇总当前 X 时间线图片；固定分栏、已加入卡片不重排，并可自动滚动加载。
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
#${ID}-panel{position:fixed;inset:0;z-index:2147483645;display:none;overflow-y:auto;background:#000d;padding:64px 14px 30px;box-sizing:border-box}#${ID}-panel.open{display:block}
#${ID}-bar{position:fixed;inset:0 0 auto;height:54px;z-index:2;display:flex;align-items:center;gap:10px;padding:0 14px;background:#16181c;color:#e7e9ea;font:14px system-ui,-apple-system,sans-serif}#${ID}-bar strong{white-space:nowrap}#${ID}-bar .auto{margin-left:auto;background:#1d9bf0;color:#fff}#${ID}-bar button{border:0;border-radius:18px;padding:7px 10px;font-weight:700;cursor:pointer}
#${ID}-grid{display:flex;align-items:flex-start;gap:10px;width:100%;max-width:1600px;margin:auto}.${ID}-column{display:flex;flex:1 1 0;min-width:0;flex-direction:column;gap:10px}
.${ID}-card{display:block;position:relative;width:100%;overflow:hidden;border-radius:12px;background:#16181c;line-height:0;box-shadow:0 1px 3px #0005}.${ID}-card img{display:block;width:100%;height:auto;transition:transform .16s ease}.${ID}-card:hover img{transform:scale(1.018)}.${ID}-tag{position:absolute;right:7px;bottom:7px;padding:4px 6px;border-radius:7px;background:#000a;color:#fff;font:11px system-ui,-apple-system,sans-serif;line-height:1}
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
    grid.replaceChildren(...Array.from({length: needed}, () => Object.assign(document.createElement('div'), {className: ID + '-column'})));
    for (const entry of items.values()) entry.mounted = false;
  }
  function shortestColumn() {
    return [...grid.children].reduce((best, col) => col.getBoundingClientRect().height < best.getBoundingClientRect().height ? col : best);
  }
  function mountNew() {
    ensureColumns();
    for (const entry of items.values()) {
      if (entry.mounted) continue;
      const link = document.createElement('a'); link.className = ID + '-card'; link.href = entry.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
      const image = new Image(); image.loading = 'lazy'; image.src = entry.src; image.alt = '打开原推文';
      const tag = document.createElement('span'); tag.className = ID + '-tag'; tag.textContent = '原推文';
      link.append(image, tag); shortestColumn().append(link); entry.mounted = true;
    }
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
        if (!items.has(key)) { items.set(key, {src: mediaURL(src), href, mounted: false}); added++; }
      });
    });
    if (opened && added) mountNew();
    setCount();
    return added;
  }
  function openGallery(value) { opened = value ?? !opened; panel.classList.toggle('open', opened); if (opened) { ensureColumns(true); mountNew(); setCount(); } }
  function timelineStep() {
    // scrollIntoView 能命中 X 实际使用的 Timeline 滚动容器；比 window.scrollBy 更可靠。
    const articles = document.querySelectorAll('article');
    const last = articles[articles.length - 1];
    if (last) last.scrollIntoView({block: 'end', behavior: 'smooth'});
    else window.scrollBy({top: Math.round(innerHeight * .8), behavior: 'smooth'});
  }
  function stopAuto() { auto = false; clearInterval(autoTimer); autoTimer = null; autoButton.textContent = '自动加载'; }
  function toggleAuto() {
    if (auto) return stopAuto();
    auto = true; idleRounds = 0; previousCount = items.size; autoButton.textContent = '停止加载';
    timelineStep();
    autoTimer = setInterval(() => {
      scan();
      idleRounds = items.size === previousCount ? idleRounds + 1 : 0;
      previousCount = items.size;
      if (idleRounds >= 8) return stopAuto();
      timelineStep();
    }, 1400);
  }
  launch.onclick = () => openGallery(); panel.querySelector('.close').onclick = () => openGallery(false); autoButton.onclick = toggleAuto;
  addEventListener('keydown', e => { if (e.key === 'Escape') openGallery(false); });
  addEventListener('resize', () => { if (opened && columnsForWidth() !== columnCount) { ensureColumns(true); mountNew(); } });
  new MutationObserver(() => { clearTimeout(mutationTimer); mutationTimer = setTimeout(scan, 250); }).observe(document.documentElement, {childList: true, subtree: true});
  scan();
})();

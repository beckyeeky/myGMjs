// ==UserScript==
// @name         B站评论导出 Markdown（iOS Safari）
// @namespace    https://github.com/beckyeeky/myGMjs
// @version      1.0.0
// @description  导出当前 B 站视频全部评论及楼中楼为 Markdown；针对 iPhone/iPad Safari 优化，优先调出系统分享/存储。
// @author       beckyeeky
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/list/*
// @grant        none
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';
  const DELAY = 180;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const $ = (s, root = document) => root.querySelector(s);

  function toast(text, error = false) {
    let el = $('#bce-toast');
    if (!el) { el = document.createElement('div'); el.id = 'bce-toast'; document.body.append(el); }
    el.textContent = text; el.style.background = error ? '#d94b4b' : '#00aeec'; el.classList.add('show');
    clearTimeout(el._timer); el._timer = setTimeout(() => el.classList.remove('show'), 3600);
  }
  function title() {
    return (document.querySelector('h1')?.textContent || document.title || 'B站视频')
      .replace(/_哔哩哔哩_bilibili$/i, '').replace(/[\\/:*?"<>|]+/g, '_').trim().slice(0, 100) || 'B站视频';
  }
  function bvid() { return location.pathname.match(/\/video\/(BV[\w]+)/i)?.[1]; }
  function clean(v) { return String(v || '').replace(/\s+/g, ' ').trim(); }
  function esc(v) { return clean(v).replace(/([\\`*_{}\[\]<>])/g, '\\$1'); }
  function date(ts) { return ts ? new Date(ts * 1000).toLocaleString('zh-CN', { hour12: false }) : ''; }
  function isMobilePage() {
    const uaMobile = /iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent);
    const narrow = Math.min(window.innerWidth, screen.width) < 700;
    const mobileDom = Boolean(document.querySelector('.m-header, .m-navbar, #app .m-container'));
    return uaMobile || (narrow && mobileDom);
  }
  function showDesktopHint() {
    if (!isMobilePage() || sessionStorage.getItem('bce-desktop-hint')) return;
    const box = document.createElement('section'); box.id = 'bce-desktop-hint';
    box.innerHTML = '<button class="bce-close" type="button" aria-label="关闭提示">×</button><strong>建议切换为桌面网站</strong><p>当前似乎是移动版页面。导出仍可尝试，但桌面版通常更稳定。</p><p><b>Safari：</b>点地址栏左侧的 <b>「aA」</b> → <b>「请求桌面网站」</b>，页面刷新后再导出。</p>';
    box.querySelector('.bce-close').onclick = () => { box.remove(); sessionStorage.setItem('bce-desktop-hint', '1'); };
    document.body.append(box);
  }

  async function api(url) {
    const r = await fetch(url, { credentials: 'include' });
    if (!r.ok) throw new Error(`网络请求失败（HTTP ${r.status}）`);
    const j = await r.json();
    if (j.code !== 0) throw new Error(j.message || `B站 API 错误 ${j.code}`);
    return j.data || {};
  }
  async function meta() {
    const state = window.__INITIAL_STATE__ || {};
    const aid = state.aid || state.videoData?.aid || state.videoData?.stat?.aid;
    if (aid) return Number(aid);
    const bv = bvid(); if (!bv) throw new Error('未识别到视频 BV 号');
    return Number((await api(`https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bv)}`)).aid);
  }
  async function mainReplies(oid) {
    const out = []; let pn = 1;
    for (;;) {
      toast(`正在读取主评论：${out.length} 条…`);
      const u = new URL('https://api.bilibili.com/x/v2/reply');
      Object.entries({ type: 1, oid, pn, ps: 20, sort: 0, nohot: 1 }).forEach(([k,v]) => u.searchParams.set(k,v));
      const a = (await api(u)).replies || [];
      if (!a.length) break; out.push(...a);
      if (a.length < 20) break; pn++; await sleep(DELAY);
    }
    return out;
  }
  async function subReplies(oid, root, expected) {
    const out = [], seen = new Set(); let pn = 1;
    for (;;) {
      const u = new URL('https://api.bilibili.com/x/v2/reply/reply');
      Object.entries({ type: 1, oid, root, pn, ps: 20 }).forEach(([k,v]) => u.searchParams.set(k,v));
      const a = (await api(u)).replies || [];
      for (const x of a) if (x.rpid && !seen.has(x.rpid)) { seen.add(x.rpid); out.push(x); }
      if (!a.length || a.length < 20 || out.length >= expected) break;
      pn++; await sleep(DELAY);
    }
    return out;
  }
  function line(r, prefix = '') {
    const user = esc(r.member?.uname || r.member?.name || '匿名用户');
    const text = esc(r.content?.message || '');
    const info = [date(r.ctime), r.like ? `👍 ${r.like}` : ''].filter(Boolean).join(' · ');
    const target = clean(r.reply_control?.reply_control?.location || '');
    return `${prefix}**${user}**${target ? ` → ${esc(target)}` : ''}${info ? `  \n${prefix}> ${info}` : ''}  \n${prefix}${text}`;
  }
  async function exportMarkdown() {
    const btn = $('#bce-button'); if (btn?.disabled) return;
    btn.disabled = true;
    try {
      const oid = await meta(); const mains = await mainReplies(oid);
      const rows = [`# ${esc(title())}：评论导出`, '', `- 视频：${location.href}`, `- 导出时间：${new Date().toLocaleString('zh-CN', {hour12:false})}`, `- 主评论：${mains.length} 条`, '- 已包含全部可获取的楼中楼回复', ''];
      let total = mains.length;
      for (let i = 0; i < mains.length; i++) {
        const root = mains[i]; toast(`正在读取楼中楼：${i + 1}/${mains.length}…`);
        rows.push(`## ${i + 1}F`, '', line(root), '');
        const inline = root.replies || [];
        const children = root.rcount > inline.length ? await subReplies(oid, root.rpid, Number(root.rcount)) : inline;
        const uniq = [...new Map(children.filter(x => x?.rpid).map(x => [x.rpid, x])).values()]; total += uniq.length;
        uniq.forEach((r, n) => rows.push(`### ${i + 1}-${n + 1}F`, '', line(r), ''));
        await sleep(DELAY);
      }
      rows.splice(4, 0, `- 评论总数：${total} 条（主评论 + 楼中楼）`);
      await save(`${title()}_评论_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'')}.md`, rows.join('\n'));
      toast(`导出完成：${total} 条评论`);
    } catch (e) { console.error(e); toast(`导出失败：${e.message || e}`, true); }
    finally { btn.disabled = false; btn.textContent = '导出 Markdown'; }
  }
  async function save(name, text) {
    const file = new File([text], name, { type: 'text/markdown;charset=utf-8' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ title: name, files: [file] }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(file), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
  function mount() {
    if ($('#bce-button')) return;
    const style = document.createElement('style'); style.textContent = `#bce-button{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(24px,env(safe-area-inset-bottom));z-index:2147483646;border:0;border-radius:24px;background:#00aeec;color:#fff;padding:13px 17px;font:600 15px -apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 5px 18px #0004}#bce-button:disabled{opacity:.65}#bce-toast{position:fixed;z-index:2147483647;left:50%;bottom:82px;transform:translate(-50%,20px);width:min(330px,calc(100vw - 32px));padding:11px 14px;border-radius:11px;color:white;font:14px -apple-system,BlinkMacSystemFont,sans-serif;text-align:center;opacity:0;pointer-events:none;transition:.2s}#bce-toast.show{opacity:1;transform:translate(-50%,0)}#bce-desktop-hint{position:fixed;z-index:2147483646;left:16px;right:16px;bottom:max(90px,calc(env(safe-area-inset-bottom) + 66px));padding:14px 38px 12px 14px;border-radius:13px;background:#fff8e6;color:#5a4300;font:14px/1.45 -apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 5px 20px #0003}#bce-desktop-hint strong{font-size:15px}#bce-desktop-hint p{margin:5px 0 0}.bce-close{position:absolute;right:9px;top:7px;border:0;background:transparent;color:#765;font-size:24px;line-height:24px}`; document.head.append(style);
    const b = document.createElement('button'); b.id = 'bce-button'; b.textContent = '导出 Markdown'; b.addEventListener('click', exportMarkdown); document.body.append(b);
    showDesktopHint();
  }
  mount();
})();

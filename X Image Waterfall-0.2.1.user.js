// ==UserScript==
// @name         X 图片瀑布流画廊（稳定布局 + 自动加载）
// @namespace    minis.x-waterfall
// @version      0.2.1
// @description  汇总当前 X 时间线图片；固定分栏防止已加载图片重排，并可自动滚动加载。
// @downloadURL  https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Image%20Waterfall-0.2.1.user.js
// @updateURL    https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Image%20Waterfall-0.2.1.user.js
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
(() => {'use strict';
 const ID='minis-x-waterfall', seen=new Map(); let opened=false,timer,auto=false,autoTimer,stalls=0,lastSize=0;
 const css=`#${ID}-button{position:fixed;right:18px;bottom:88px;z-index:999999;background:#1d9bf0;color:#fff;border:0;border-radius:999px;padding:11px 15px;font:600 14px -apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 3px 14px #0005;cursor:pointer}#${ID}-panel{position:fixed;inset:0;z-index:999998;background:#000d;display:none;overflow:auto;padding:62px 12px 28px;box-sizing:border-box}#${ID}-panel.open{display:block}#${ID}-bar{position:fixed;top:0;left:0;right:0;height:52px;background:#16181c;color:#e7e9ea;display:flex;align-items:center;gap:9px;padding:0 12px;z-index:2;font:14px -apple-system,BlinkMacSystemFont,sans-serif}#${ID}-bar button{border:0;border-radius:16px;padding:7px 10px;cursor:pointer;background:#eff3f4;color:#0f1419;font-weight:700}#${ID}-bar .auto{margin-left:auto;background:#1d9bf0;color:white}#${ID}-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;max-width:1600px;margin:auto}@media(min-width:700px){#${ID}-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(min-width:1100px){#${ID}-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}@media(min-width:1450px){#${ID}-grid{grid-template-columns:repeat(5,minmax(0,1fr)}}}.${ID}-col{display:flex;flex-direction:column;gap:10px;min-width:0}.${ID}-card{display:block;position:relative;border-radius:12px;overflow:hidden;background:#16181c;line-height:0}.${ID}-card img{display:block;width:100%;height:auto;transition:transform .18s ease}.${ID}-card:hover img{transform:scale(1.02)}.${ID}-badge{position:absolute;right:7px;bottom:7px;background:#000a;color:#fff;padding:4px 6px;border-radius:7px;font:11px -apple-system,BlinkMacSystemFont,sans-serif;line-height:1}`;
 const style=document.createElement('style');style.textContent=css;document.head.append(style);
 const button=document.createElement('button');button.id=ID+'-button';button.textContent='图片瀑布流';
 const panel=document.createElement('section');panel.id=ID+'-panel';panel.innerHTML=`<div id="${ID}-bar"><strong>图片瀑布流</strong><span id="${ID}-count">0 张</span><button class="auto" type="button">自动加载</button><button class="close" type="button">关闭</button></div><main id="${ID}-grid"></main>`;
 document.body.append(button,panel); const grid=panel.querySelector('#'+ID+'-grid'),count=panel.querySelector('#'+ID+'-count'),autoBtn=panel.querySelector('.auto');
 const original=u=>u.replace(/([?&])name=[^&]*/,'$1name=large');
 function scan(){let added=0;document.querySelectorAll('article').forEach(a=>{const link=a.querySelector('a[href*="/status/"]'),href=link?new URL(link.href,location.origin).href:location.href;a.querySelectorAll('img').forEach(img=>{const src=img.currentSrc||img.src;if(!/^https:\/\/pbs\.twimg\.com\/media\//.test(src))return;const key=src.replace(/[?&]name=[^&]*/,'');if(!seen.has(key)){seen.set(key,{src:original(src),href,w:img.naturalWidth||1,h:img.naturalHeight||1});added++}})});if(opened&&added)appendNew();updateCount();}
 function columns(){let n=innerWidth>=1450?5:innerWidth>=1100?4:innerWidth>=700?3:2;if(grid.children.length!==n){grid.replaceChildren(...Array.from({length:n},()=>Object.assign(document.createElement('div'),{className:ID+'-col'})));for(const x of seen.values())add(x)}return [...grid.children]}
 function add(x){const cols=columns(),col=cols.reduce((a,b)=>a.scrollHeight<=b.scrollHeight?a:b);const a=document.createElement('a'),im=new Image(),tag=document.createElement('span');a.className=ID+'-card';a.href=x.href;a.target='_blank';a.rel='noopener noreferrer';a.style.aspectRatio=`${x.w}/${x.h}`;im.loading='lazy';im.src=x.src;im.alt='打开原推文';tag.className=ID+'-badge';tag.textContent='原推文';a.append(im,tag);col.append(a)}
 function appendNew(){columns();for(const x of seen.values())if(!x.added){x.added=true;add(x)}}
 function render(){for(const x of seen.values())x.added=false;grid.replaceChildren();appendNew();updateCount()}
 function updateCount(){count.textContent=`${seen.size} 张（已加载）`;if(!opened)button.textContent=`图片瀑布流 (${seen.size})`}
 function toggle(v){opened=v??!opened;panel.classList.toggle('open',opened);if(opened)render()}
 function toggleAuto(){auto=!auto;autoBtn.textContent=auto?'停止加载':'自动加载';if(auto){stalls=0;lastSize=seen.size;autoTimer=setInterval(()=>{window.scrollBy({top:Math.round(innerHeight*.82),behavior:'smooth'});setTimeout(()=>{scan();stalls=seen.size===lastSize?stalls+1:0;lastSize=seen.size;if(stalls>=7)toggleAuto()},550)},1200)}else clearInterval(autoTimer)}
 button.onclick=()=>toggle();panel.querySelector('.close').onclick=()=>toggle(false);autoBtn.onclick=toggleAuto;addEventListener('keydown',e=>e.key==='Escape'&&toggle(false));addEventListener('resize',()=>opened&&render());new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(scan,300)}).observe(document.documentElement,{childList:true,subtree:true});scan();
})();

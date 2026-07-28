// ==UserScript==
// @name         X / Twitter — Grok 自动翻译目标语言
// @name:zh-CN   X / Twitter — Grok 自动翻译目标语言
// @name:en      X / Twitter — Grok Auto-Translate Target Language
// @namespace    https://greasyfork.org/
// @version      1.0.0
// @description  自定义 X/Twitter 上 Grok AI 自动翻译的目标语言。通过拦截翻译 API 请求修改 dst_lang 参数，让你选择翻译到任意语言。
// @description:zh-CN 自定义 X/Twitter 上 Grok AI 自动翻译的目标语言。通过拦截翻译 API 请求修改 dst_lang 参数，让你选择翻译到任意语言。
// @description:en  Customize the target language for Grok AI auto-translations on X/Twitter. Intercepts translation API requests and modifies the dst_lang parameter, allowing you to translate into any language.
// @author       Minis
// @match        https://x.com/*
// @match        https://twitter.com/*
// @match        https://grok.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    // ==================== 语言列表 ====================
    const LANGUAGES = [
        ["zh",    "中文 (Chinese)"],
        ["zh-CN", "简体中文 (Simplified Chinese)"],
        ["zh-TW", "繁體中文 (Traditional Chinese)"],
        ["en",    "English"],
        ["ja",    "日本語 (Japanese)"],
        ["ko",    "한국어 (Korean)"],
        ["fr",    "Français (French)"],
        ["de",    "Deutsch (German)"],
        ["es",    "Español (Spanish)"],
        ["pt",    "Português (Portuguese)"],
        ["it",    "Italiano (Italian)"],
        ["ru",    "Русский (Russian)"],
        ["ar",    "العربية (Arabic)"],
        ["hi",    "हिन्दी (Hindi)"],
        ["th",    "ไทย (Thai)"],
        ["vi",    "Tiếng Việt (Vietnamese)"],
        ["id",    "Bahasa Indonesia"],
        ["ms",    "Bahasa Melayu"],
        ["tr",    "Türkçe (Turkish)"],
        ["nl",    "Nederlands (Dutch)"],
        ["pl",    "Polski (Polish)"],
        ["sv",    "Svenska (Swedish)"],
        ["da",    "Dansk (Danish)"],
        ["fi",    "Suomi (Finnish)"],
        ["no",    "Norsk (Norwegian)"],
        ["cs",    "Čeština (Czech)"],
        ["hu",    "Magyar (Hungarian)"],
        ["ro",    "Română (Romanian)"],
        ["uk",    "Українська (Ukrainian)"],
        ["bg",    "Български (Bulgarian)"],
        ["el",    "Ελληνικά (Greek)"],
        ["he",    "עברית (Hebrew)"],
        ["fa",    "فارسی (Persian)"],
        ["ur",    "اردو (Urdu)"],
        ["bn",    "বাংলা (Bengali)"],
        ["ta",    "தமிழ் (Tamil)"],
        ["te",    "తెలుగు (Telugu)"],
        ["mr",    "मराठी (Marathi)"],
        ["gu",    "ગુજરાતી (Gujarati)"],
        ["kn",    "ಕನ್ನಡ (Kannada)"],
        ["ml",    "മലയാളം (Malayalam)"],
        ["pa",    "ਪੰਜਾਬੀ (Punjabi)"],
    ];

    const DEFAULT_LANG = "zh";

    // ==================== 状态 ====================
    function getTargetLang() {
        return GM_getValue("grok_tl_target_lang", DEFAULT_LANG);
    }

    // ==================== 拦截 fetch API 请求 ====================
    const originalFetch = window.fetch;
    window.fetch = function (input, init) {
        const url = typeof input === 'string' ? input :
                    input instanceof Request ? input.url : String(input);

        // 拦截 Grok 翻译 API
        if (url.includes('/grok/translation.json') || url.includes('/2/grok/translation')) {
            const targetLang = getTargetLang();

            try {
                if (init && init.body) {
                    let body = typeof init.body === 'string' ? init.body : '';

                    // 如果是 Request 对象，需要特殊处理
                    if (input instanceof Request && !init.body) {
                        // body 在 Request 内部，先放行
                        return originalFetch.apply(this, arguments).then(response => {
                            console.log(`[Grok TL] 📝 翻译目标语言: ${targetLang}`);
                            return response;
                        });
                    }

                    // 尝试修改 dst_lang
                    if (body.includes('dst_lang')) {
                        const parsed = JSON.parse(body);
                        const oldLang = parsed.dst_lang;
                        parsed.dst_lang = targetLang;

                        if (oldLang !== targetLang) {
                            console.log(`[Grok TL] 🔄 翻译目标语言: ${oldLang} → ${targetLang}`);
                        }

                        const newInit = Object.assign({}, init, {
                            body: JSON.stringify(parsed)
                        });
                        return originalFetch.call(this, input, newInit);
                    }
                }
            } catch (e) {
                console.warn('[Grok TL] ⚠️ 修改请求失败:', e);
            }
        }

        return originalFetch.apply(this, arguments);
    };

    // ==================== 拦截 XMLHttpRequest ====================
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
        this.__grok_tl_url = typeof url === 'string' ? url : String(url);
        this.__grok_tl_method = method;
        this.__grok_tl_headers = {};
        return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
        if (this.__grok_tl_headers) {
            this.__grok_tl_headers[String(name).toLowerCase()] = String(value);
        }
        return originalSetRequestHeader.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
        const url = this.__grok_tl_url || '';

        if (url.includes('/grok/translation.json') || url.includes('/2/grok/translation')) {
            const targetLang = getTargetLang();

            if (body && typeof body === 'string' && body.includes('dst_lang')) {
                try {
                    const parsed = JSON.parse(body);
                    const oldLang = parsed.dst_lang;
                    parsed.dst_lang = targetLang;

                    if (oldLang !== targetLang) {
                        console.log(`[Grok TL] 🔄 (XHR) 翻译目标语言: ${oldLang} → ${targetLang}`);
                    }

                    body = JSON.stringify(parsed);
                } catch (e) {
                    console.warn('[Grok TL] ⚠️ XHR 修改失败:', e);
                }
            } else if (!body) {
                // body 可能是 FormData 或 null，无法修改
                console.log(`[Grok TL] 📝 (XHR) 翻译目标语言: ${targetLang} (无法修改 body，请确认 API 调用方式)`);
            }
        }

        return originalSend.call(this, body);
    };

    // ==================== 语言选择器 UI ====================
    function showLanguagePicker() {
        // 移除旧弹窗
        document.getElementById('grok-tl-picker-overlay')?.remove();

        const currentLang = getTargetLang();
        const currentLabel = LANGUAGES.find(l => l[0] === currentLang)?.[1] || currentLang;

        // 遮罩
        const overlay = document.createElement('div');
        overlay.id = 'grok-tl-picker-overlay';
        overlay.style.cssText = [
            'position: fixed', 'inset: 0', 'z-index: 9999999',
            'background: rgba(0,0,0,0.45)', 'display: flex',
            'align-items: center', 'justify-content: center',
            'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ].join(';');

        // 对话框
        const dialog = document.createElement('div');
        dialog.style.cssText = [
            'background: #fff', 'border-radius: 16px', 'padding: 24px',
            'width: 360px', 'max-height: 80vh', 'display: flex',
            'flex-direction: column', 'color: #0f1419',
            'box-shadow: 0 8px 32px rgba(0,0,0,0.2)'
        ].join(';');

        // 标题
        const title = document.createElement('div');
        title.style.cssText = 'font-size: 18px; font-weight: 700; margin-bottom: 4px;';
        title.textContent = '🌐 Grok 翻译目标语言';

        const subtitle = document.createElement('div');
        subtitle.style.cssText = 'font-size: 13px; color: #536471; margin-bottom: 16px;';
        subtitle.textContent = `当前: ${currentLabel}`;

        // 搜索框
        const search = document.createElement('input');
        search.type = 'text';
        search.placeholder = '搜索语言...';
        search.style.cssText = [
            'width: 100%', 'padding: 10px 12px', 'border: 1px solid #cfd9de',
            'border-radius: 8px', 'font-size: 14px', 'outline: none',
            'box-sizing: border-box', 'margin-bottom: 12px'
        ].join(';');

        // 语言列表
        const list = document.createElement('div');
        list.style.cssText = 'overflow-y: auto; flex: 1; max-height: 50vh;';

        function renderList(filter = '') {
            list.innerHTML = '';
            const lf = filter.toLowerCase();
            let found = false;

            for (const [code, name] of LANGUAGES) {
                if (lf && !name.toLowerCase().includes(lf) && !code.toLowerCase().includes(lf)) continue;
                found = true;

                const item = document.createElement('div');
                item.style.cssText = [
                    'padding: 10px 12px', 'border-radius: 8px', 'cursor: pointer',
                    'font-size: 14px', 'display: flex', 'align-items: center',
                    'justify-content: space-between', 'transition: background 0.15s',
                    code === currentLang ? 'background: #e8f5fd; font-weight: 600; color: #1d9bf0;' : ''
                ].join(';');

                const nameSpan = document.createElement('span');
                nameSpan.textContent = name;

                const codeSpan = document.createElement('span');
                codeSpan.style.cssText = 'font-size: 12px; color: #536471; font-weight: 400;';
                codeSpan.textContent = code;

                item.append(nameSpan, codeSpan);

                item.addEventListener('mouseenter', () => {
                    if (code !== currentLang) item.style.background = '#f7f9f9';
                });
                item.addEventListener('mouseleave', () => {
                    if (code !== currentLang) item.style.background = '';
                });
                item.addEventListener('click', () => {
                    GM_setValue('grok_tl_target_lang', code);
                    overlay.remove();
                    showToast(`✅ 已设置翻译目标语言为: ${name}`);
                });

                list.appendChild(item);
            }

            if (!found) {
                const empty = document.createElement('div');
                empty.style.cssText = 'text-align: center; padding: 20px; color: #536471; font-size: 14px;';
                empty.textContent = '未找到匹配的语言 😕';
                list.appendChild(empty);
            }
        }

        search.addEventListener('input', () => renderList(search.value));

        // 重置按钮
        const resetBtn = document.createElement('button');
        resetBtn.textContent = '🔄 恢复默认 (zh)';
        resetBtn.style.cssText = [
            'margin-top: 12px', 'padding: 8px', 'border: 1px solid #cfd9de',
            'border-radius: 8px', 'background: none', 'cursor: pointer',
            'font-size: 13px', 'color: #536471', 'width: 100%'
        ].join(';');
        resetBtn.addEventListener('click', () => {
            GM_setValue('grok_tl_target_lang', DEFAULT_LANG);
            overlay.remove();
            showToast('🔄 已恢复默认目标语言 (zh)');
        });

        // 关闭按钮 (X)
        const closeBtn = document.createElement('div');
        closeBtn.style.cssText = [
            'position: absolute', 'top: 20px', 'right: 20px',
            'width: 28px', 'height: 28px', 'border-radius: 50%',
            'display: flex', 'align-items: center', 'justify-content: center',
            'cursor: pointer', 'font-size: 18px', 'color: #536471',
            'background: none', 'border: none', 'transition: background 0.15s'
        ].join(';');
        closeBtn.textContent = '✕';
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = '#f0f0f0';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'none';
        });
        closeBtn.addEventListener('click', () => overlay.remove());

        // 组装
        const headerWrap = document.createElement('div');
        headerWrap.style.cssText = 'position: relative;';
        headerWrap.append(title, subtitle, closeBtn);

        dialog.append(headerWrap, search, list, resetBtn);
        overlay.appendChild(dialog);

        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        // ESC 关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        document.body.appendChild(overlay);
        search.focus();
        renderList();
    }

    // ==================== Toast 提示 ====================
    function showToast(message) {
        const existing = document.getElementById('grok-tl-toast');
        existing?.remove();

        const toast = document.createElement('div');
        toast.id = 'grok-tl-toast';
        toast.textContent = message;
        toast.style.cssText = [
            'position: fixed', 'bottom: 40px', 'left: 50%', 'transform: translateX(-50%)',
            'z-index: 99999999', 'background: #1d9bf0', 'color: #fff',
            'padding: 12px 24px', 'border-radius: 24px', 'font-size: 14px',
            'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'box-shadow: 0 4px 16px rgba(29,155,240,0.4)', 'animation: grok-tl-fadein 0.3s ease'
        ].join(';');

        // 注入动画
        if (!document.getElementById('grok-tl-style')) {
            const style = document.createElement('style');
            style.id = 'grok-tl-style';
            style.textContent = `
                @keyframes grok-tl-fadein {
                    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes grok-tl-fadeout {
                    from { opacity: 1; transform: translateX(-50%) translateY(0); }
                    to   { opacity: 0; transform: translateX(-50%) translateY(10px); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'grok-tl-fadeout 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // ==================== 启动 ====================
    console.log('[Grok TL] ✅ 脚本已加载 | 当前目标语言:', getTargetLang());

    // 注册油猴菜单命令
    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('🌐 设置翻译目标语言', showLanguagePicker);
        GM_registerMenuCommand(`📋 当前: ${getTargetLang()}`, () => showLanguagePicker());
    }
})();

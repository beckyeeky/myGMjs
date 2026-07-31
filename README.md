# myGMjs

Personal / hard-to-attribute userscript collection.

These scripts either have no clear upstream maintainer / repo, or are small personal patches
originally saved from Tampermonkey with placeholder metadata (`@author You`, generic namespace, no update URL).
They are archived here so they can be installed and updated from a single place.

**Repo:** https://github.com/beckyeeky/myGMjs

## Install

1. Install a userscript manager (Tampermonkey / Violentmonkey / Userscripts).
2. Open a script’s **Raw** install link below (or the `.user.js` file on GitHub and click Raw).
3. Confirm install in the userscript manager.

> Tip: after install, the `@updateURL` / `@downloadURL` headers point back to this repo’s `main` branch.

## Scripts

| Script | Version | Sites | Description | Install |
|---|---|---|---|---|
| B站评论导出 Markdown（iOS Safari） | 1.0.0 | `https://www.bilibili.com/video/*, https://www.bilibili.com/list/*` | 导出当前 B 站视频全部评论及楼中楼为 Markdown；针对 iPhone/iPad Safari 优化，优先调出系统分享/存储。 | [Install](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/bilibili-comment-export-markdown-ios.user.js) |
| Change Image Quality to Orig | 1.0 | `https://x.com/*` | Change image quality to orig on x.com | [Install](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Change%20Image%20Quality%20to%20Orig.user.js) |
| FF14 Equipment Term Translator | 1.3 | `https://ff14-fc.com/*` | Translate FF14 equipment terms from Japanese to Chinese using localStorage and MutationObserver | [Install](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/FF14%20Equipment%20Term%20Translator.user.js) |
| Google Sheets HTML View Class Remover | 1.0 | `https://docs.google.com/spreadsheets/d/*/htmlview*` | Removes specific classes from Google Sheets HTML view to enable selection | [Install](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Google%20Sheets%20HTML%20View%20Class%20Remover.user.js) |
| X / Twitter — Grok 自动翻译目标语言 | 1.0.0 | `https://x.com/*, https://twitter.com/*, https://grok.com/*` | 自定义 X/Twitter 上 Grok AI 自动翻译的目标语言。通过拦截翻译 API 请求修改 dst_lang 参数，让你选择翻译到任意语言。 | [Install](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/grok-auto-translate-lang.user.js) |
| Replace na.finalfantasyxiv.com with jp.finalfantasyxiv.com | 1.0 | `https://ffxiv.eorzeacollection.com/*` | Replace na.finalfantasyxiv.com with jp.finalfantasyxiv.com on ffxiv.eorzeacollection.com | [Install](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Replace%20na.finalfantasyxiv.com%20with%20jp.finalfantasyxiv.com.user.js) |
| Twitter Advanced Element Remover | 1.1 | `https://twitter.com/*, https://x.com/*, https://pro.twitter.com/*` | Hide selected Twitter/X layout elements with safer defaults | [Install](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Twitter%20Advanced%20Element%20Remover.user.js) |
| Twitter Media Filter Button Style Patch V4 | 0.4 | `https://*.twitter.com/*, https://*.x.com/*` | Modifies the style of the button created by the Twitter media-only filter toggle script (v0.17) | [Install](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Twitter%20Media%20Filter%20Button%20Style%20Patch.user.js) |
| Twitter Screenshot Button | 0.6 | `https://twitter.com/*, https://x.com/*` | Add a screenshot button next to the share button on Twitter/X | [Install](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Twitter%20Screenshot%20Button.user.js) |
| X (Twitter) Force Left (No Color Change) | 2.1 | `https://x.com/*, https://twitter.com/*` | 只负责将X界面移到左侧，不修改背景颜色 | [Install](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Force%20Left.user.js) |
| X 图片瀑布流画廊（Tampermonkey Advanced） | 0.7.7 | `https://x.com/*, https://twitter.com/*` | 汇总当前 X 时间线图片；稳定瀑布流、Like 快捷按钮，并可自动滚动加载。 | [Install](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Image%20Waterfall.user.js) |
| X 图片瀑布流 Classic（传统 Userscript 插件） | 0.6.4-classic | `https://x.com/*, https://twitter.com/*` | 冻结的传统插件兼容版：无高级 GM API，最多收集 500 张。 | [Install](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Image%20Waterfall%20Classic.user.js) |
| X（旧Twitter）画像プレビュー (Right Side Edition) | 1.4 | `https://twitter.com/*, https://x.com/*` | 大屏专用：悬停图片时，在屏幕右侧显示固定容器预览。仅在悬停媒体时响应滚轮切换。 | [Install](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Preview.user.js) |

## File index

- [`bilibili-comment-export-markdown-ios.user.js`](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/bilibili-comment-export-markdown-ios.user.js) — B站评论导出 Markdown（iOS Safari） v1.0.0
- [`Change Image Quality to Orig.user.js`](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Change%20Image%20Quality%20to%20Orig.user.js) — Change Image Quality to Orig v1.0
- [`FF14 Equipment Term Translator.user.js`](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/FF14%20Equipment%20Term%20Translator.user.js) — FF14 Equipment Term Translator v1.3
- [`Google Sheets HTML View Class Remover.user.js`](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Google%20Sheets%20HTML%20View%20Class%20Remover.user.js) — Google Sheets HTML View Class Remover v1.0
- [`grok-auto-translate-lang.user.js`](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/grok-auto-translate-lang.user.js) — X / Twitter — Grok 自动翻译目标语言 v1.0.0
- [`Replace na.finalfantasyxiv.com with jp.finalfantasyxiv.com.user.js`](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Replace%20na.finalfantasyxiv.com%20with%20jp.finalfantasyxiv.com.user.js) — Replace na.finalfantasyxiv.com with jp.finalfantasyxiv.com v1.0
- [`Twitter Advanced Element Remover.user.js`](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Twitter%20Advanced%20Element%20Remover.user.js) — Twitter Advanced Element Remover v1.1
- [`Twitter Media Filter Button Style Patch.user.js`](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Twitter%20Media%20Filter%20Button%20Style%20Patch.user.js) — Twitter Media Filter Button Style Patch V4 v0.4
- [`Twitter Screenshot Button.user.js`](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/Twitter%20Screenshot%20Button.user.js) — Twitter Screenshot Button v0.6
- [`X Force Left.user.js`](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Force%20Left.user.js) — X (Twitter) Force Left (No Color Change) v2.1
- [`X Image Waterfall.user.js`](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Image%20Waterfall.user.js) — X 图片瀑布流画廊（Tampermonkey Advanced） v0.7.7
- [`X Preview.user.js`](https://raw.githubusercontent.com/beckyeeky/myGMjs/main/X%20Preview.user.js) — X（旧Twitter）画像プレビュー (Right Side Edition) v1.4


## Notes on provenance

Scripts here are personal archives or patches without a clear public upstream.
Scripts that already have GreasyFork / GitHub maintainers are intentionally **not** mirrored.

## License

MIT (see [LICENSE](LICENSE)). Individual scripts may carry their own `@license` header.

// ==UserScript==
// @name         FF14 Equipment Term Translator
// @namespace    https://github.com/beckyeeky/myGMjs
// @version      1.3
// @description  Translate FF14 equipment terms from Japanese to Chinese using localStorage and MutationObserver
// @author       beckyeeky
// @match        https://ff14-fc.com/*
// @grant        none
// @downloadURL https://raw.githubusercontent.com/beckyeeky/myGMjs/main/FF14%20Equipment%20Term%20Translator.user.js
// @updateURL   https://raw.githubusercontent.com/beckyeeky/myGMjs/main/FF14%20Equipment%20Term%20Translator.user.js
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // 初始化术语翻译字典
    const defaultTerms = {
        '足甲': '足甲',
        'ブーツ': '靴子',
        '革靴': '皮鞋',
        'スニーカー': '运动鞋',
        'パンプス': '高跟鞋',
        'サンダル': '凉鞋',
        'スリッパ': '拖鞋',
        '下駄・草履・足袋': '木屐・草履・足袋',
        'ソックス': '袜子',
        'ニーソ': '长筒袜',
        '着ぐるみ・スーツ': '动物装・套装',
        'その他': '其他',
        '脚鎧': '腿铠',
        'スカート': '裙子',
        '袴': '袴',
        'タイツ': '紧身裤',
        '水着': '泳装',
        'アンダーウェア': '内衣',
        'パンツ': '裤子',
        'スラックス': '长裤',
        'カーゴパンツ': '工装裤',
        'スキニー': '紧身裤',
        'ストレート': '直筒裤',
        'サルエル': '哈伦裤',
        'フレア': '喇叭裤',
        'ワイド': '宽裤',
        '甲冑': '铠甲',
        'ハーネス': '吊带',
        'シャツ': '衬衫',
        'チュニック': '长衫',
        'セーター': '毛衣',
        'ベスト': '背心',
        'ボレロ': '短外套',
        'ビスチェ': '紧身上衣',
        'ジャケット': '夹克',
        'コーティ': '外套',
        'コート': '大衣',
        'ポンチョ': '斗篷',
        'ローブ': '长袍',
        'フード': '连帽衫',
        'ワンピース・ドレス': '连衣裙',
        'ショール': '披肩',
        'エプロン': '围裙',
        '着物': '和服',
        '浴衣': '浴衣',
        '纹身': '纹身',
        'オールインワン': '连体衣',
        '兜': '头盔',
        'ヘッドギア・フェイスガード': '头饰・面罩',
        'マスク': '面具',
        'ヴェール': '面纱',
        'バンダナ・ヘッドバンド': '头巾・头带',
        'ゴーグル・スコープ': '护目镜・瞄准镜',
        '眼鏡・サングラス': '眼镜・太阳镜',
        '眼帯': '眼罩',
        '帽子': '帽子',
        'ハット': '礼帽',
        'シルクハット': '高帽',
        'カウボーイハット': '牛仔帽',
        '魔女帽子': '巫师帽',
        'キャップ': '棒球帽',
        'ベレー': '贝雷帽',
        'ロシア帽': '俄式帽',
        '三角帽': '三角帽',
        '博士帽': '学位帽',
        'ターバン': '头巾',
        '笠': '斗笠',
        'ヘッドドレス・ヘアアクセサリー': '头饰・发饰',
        '冠・ティアラ': '皇冠・头饰',
        'サークレット': '头环',
        'カチューシャ': '发箍',
        'リボン': '缎带',
        'エクステ': '发饰',
        '耳': '耳饰',
        '角': '角饰',
        'モグステーション': 'Mog Station',
        'クラフター製作': '工匠制作',
        '戦闘コンテンツ': '战斗内容',
        'ID': 'ID',
        'ノーマルレイド': '普通突袭',
        'アライアンスレイド': '联盟突袭',
        '討伐・討滅戦': '讨伐战',
        '零式': '零式',
        '絶レイド': '绝境突袭',
        '初心者の館': '新手馆',
        'ディープダンジョン': '深渊迷宫',
        'F.A.T.E': 'F.A.T.E',
        '宝の地図': '藏宝图',
        'PvP': 'PvP',
        'モグコレ': 'Mog Collection',
        'ヴァリアントダンジョン': '多样化迷宫',
        'ジョブ専用装備': '职业专用装备',
        'AF1': 'AF1',
        'AF2': 'AF2',
        'AF3': 'AF3',
        'AF4': 'AF4',
        'AF5': 'AF5',
        'クエスト': '任务',
        'メインクエスト': '主线任务',
        'サブクエスト': '支线任务',
        'イベントクエスト': '活动任务',
        'ジョブクエスト': '职业任务',
        '大規模クエスト': '大型任务',
        'マンダヴィルウェポン': 'Manderville 武器',
        'レジスタンスウェポン': '抵抗军武器',
        'エウレカウェポン': 'Eureka 武器',
        'アニマウェポン': 'Anima 武器',
        'ゾディアックウェポン': 'Zodiac 武器',
        'NPC取引': 'NPC 交易',
        'スクリップ': '抄写',
        'ギル購入': 'Gil 购买',
        'トークン': '代币',
        'クロの空想帳': 'Kuro 的幻想手册',
        'ソーチョー': 'Sohchou',
        'ゴールドソーサー': 'Gold Saucer',
        '友好部族': '友好部落',
        '軍票': '军票',
        'イシュガルド復興': '伊修加尔德复兴',
        'モブハント': '怪物猎人',
        '無人島開拓': '无人岛开发',
        'サブマリンボイジャー': '潜艇探险',
        'エアシップボイジャー': '飞船探险',
        'アチーブメント': '成就',
        'ベテランリワード': '老玩家奖励',
        '購入特典': '购买特典'
    };

    // 从localStorage中加载术语翻译字典
    function loadTerms() {
        const terms = localStorage.getItem('ff14Terms');
        return terms ? JSON.parse(terms) : defaultTerms;
    }

    // 保存术语翻译字典到localStorage
    function saveTerms(terms) {
        localStorage.setItem('ff14Terms', JSON.stringify(terms));
    }

    // 替换术语函数
    function replaceTerms(terms) {
        const container = document.querySelector('.c-modal-content.right');
        if (!container) return;

        const labels = container.querySelectorAll('label.sf-label-checkbox');
        labels.forEach(label => {
            for (const [key, value] of Object.entries(terms)) {
                if (label.innerText.includes(key)) {
                    label.innerHTML = label.innerHTML.replace(new RegExp(key, 'g'), value);
                }
            }
        });
    }

    // 监控页面内容变化并执行替换
    function observeMutations(targetNode, terms) {
        const config = { childList: true, subtree: true };
        const callback = function(mutationsList) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    replaceTerms(terms);
                }
            }
        };
        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    }

    // 在页面加载时执行替换并启动观察者
    window.addEventListener('load', () => {
        const terms = loadTerms();
        replaceTerms(terms);

        const targetNode = document.querySelector('.c-modal-content.right');
        if (targetNode) {
            observeMutations(targetNode, terms);
        }
    });

    // 让用户在控制台中手动编辑术语
    window.editFF14Terms = function() {
        const terms = loadTerms();
        const newTerms = prompt('编辑术语翻译字典 (JSON 格式):', JSON.stringify(terms));
        if (newTerms) {
            try {
                const parsedTerms = JSON.parse(newTerms);
                saveTerms(parsedTerms);
                alert('术语翻译字典已更新，请刷新页面。');
            } catch (e) {
                alert('无效的 JSON 格式!');
            }
        }
    };

    console.log('要编辑 FF14 术语翻译字典，请在控制台中调用 editFF14Terms() 函数。');
})();

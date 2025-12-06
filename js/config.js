/**
 * 幻想冒險 - 遊戲配置文件
 * 包含所有遊戲數據和配置
 * @版本 v2.0
 * @更新 2025-11-27
 */

console.log('Loading config.js...');
var CONFIG = {
    // 稀有度機率配置
    rarityProb: {
        common: 0.5,
        uncommon: 0.3,
        rare: 0.15,
        epic: 0.04,
        legendary: 0.01
    },

    // 稀有度顯示配置
    rarityDisplay: {
        common: { color: "rarity-common", label: "一般", val: 1 },
        uncommon: { color: "rarity-uncommon", label: "優質", val: 2 },
        rare: { color: "rarity-rare", label: "稀有", val: 3 },
        epic: { color: "rarity-epic", label: "史詩", val: 4 },
        legendary: { color: "rarity-legendary", label: "傳說", val: 5 },
        mythic: { color: "rarity-mythic", label: "神話", val: 6 },
        ultra: { color: "rarity-ultra", label: "極傳說", val: 7 },
        special: { color: "rarity-special", label: "特殊", val: 8 } // 新增特殊稀有度
    },

    // Buff 配置
    buffs: {
        angel_song: { id: 'angel_song', name: '👼 天使的歌頌', type: 'angel', desc: '每次事件恢復 5 HP' },
        angel_protection: { id: 'angel_protection', name: '🛡️ 天使的加護', type: 'angel', desc: '怪物造成的傷害減少 30%' },
        angel_courage: { id: 'angel_courage', name: '⚔️ 天使的勇氣', type: 'angel', desc: '致命一擊機率提升至 20%' },
        angel_wings: { id: 'angel_wings', name: '🕊️ 天使的翅膀', type: 'angel', desc: '逃跑成功率提升至 60%' },
        angel_blessing: { id: 'angel_blessing', name: '🪙 天使的恩賜', type: 'angel', desc: '商店物品價格降低 30%，素材售價提高 20%' },
        angel_fortune: { id: 'angel_fortune', name: '🍀 天使的幸運', type: 'angel', desc: '戰利品掉落率提升至 100%，10% 機率獲得額外掉落' },
        angel_vitality: { id: 'angel_vitality', name: '⚗️ 天使的活力', type: 'angel', desc: '所有藥水恢復效果提升 50%' },
        demon_wealth: { id: 'demon_wealth', name: '💰 惡魔的財富', type: 'demon', desc: '攻擊得5金幣，但逃跑失敗被攻擊時扣5金幣' },
        demon_destruction: { id: 'demon_destruction', name: '💀 惡魔的破壞', type: 'demon', desc: '10%機率秒殺怪物，觸發後扣除當前血量90%' },
        demon_enhance: { id: 'demon_enhance', name: '🔥 惡魔的強化', type: 'demon', desc: '雙方致命一擊機率變為 50%' },
        demon_wager: { id: 'demon_wager', name: '🎲 惡魔的賭約', type: 'demon', desc: '逃跑率80%，但每次逃跑有1%機率直接死亡' },
        demon_rage: { id: 'demon_rage', name: '🩸 惡魔的狂怒', type: 'demon', desc: '攻擊力 +50%，但每次攻擊消耗當前HP的 5%' }
    },

    // 怪物配置
    monsters: [
        {
            name: "史萊姆",
            weight: 13.5,
            baseGold: 1,
            icon: "🦠",
            hp: 20,
            atk: 3,
            drop: "史萊姆黏液",
            eliteDrop: "史萊姆精華",
            bossDrop: "史萊姆王冠",
            images: {
                normal: "images/monsters/slime_a.png",
                elite: "images/monsters/slime_b.png",
                boss: "images/monsters/slime_c.png"
            }
        },
        {
            name: "哥布林",
            weight: 13.5,
            baseGold: 2,
            icon: "👺",
            hp: 35,
            atk: 5,
            drop: "破布",
            eliteDrop: "哥布林耳環",
            bossDrop: "哥布林金牙",
            images: {
                normal: "images/monsters/Goblin_a.png",
                elite: "images/monsters/Goblin_b.png",
                boss: "images/monsters/Goblin_c.png"
            }
        },
        {
            name: "狂狼",
            weight: 13.5,
            baseGold: 3,
            icon: "🐺",
            hp: 50,
            atk: 8,
            drop: "狼皮",
            eliteDrop: "狼牙",
            bossDrop: "狼王披風",
            images: {
                normal: "images/monsters/wolf_a.png",
                elite: "images/monsters/wolf_b.png",
                boss: "images/monsters/wolf_c.png"
            }
        },
        {
            name: "骷髏兵",
            weight: 13.5,
            baseGold: 4,
            icon: "💀",
            hp: 60,
            atk: 10,
            drop: "骨頭",
            eliteDrop: "靈魂碎片",
            bossDrop: "死靈頭骨",
            images: {
                normal: "images/monsters/skeleton_a.png",
                elite: "images/monsters/skeleton_b.png",
                boss: "images/monsters/skeleton_c.png"
            }
        },
        {
            name: "半獸人",
            weight: 13.5,
            baseGold: 8,
            icon: "👹",
            hp: 90,
            atk: 12,
            drop: "斷劍",
            eliteDrop: "半獸人護符",
            bossDrop: "戰爭號角",
            images: {
                normal: "images/monsters/orc_a.png",
                elite: "images/monsters/orc_b.png",
                boss: "images/monsters/orc_c.png"
            }
        },
        {
            name: "幽靈",
            weight: 13.5,
            baseGold: 10,
            icon: "👻",
            hp: 70,
            atk: 15,
            drop: "靈質",
            eliteDrop: "怨念集合體",
            bossDrop: "幽靈提燈",
            images: {
                normal: "images/monsters/ghost_a.png",
                elite: "images/monsters/ghost_b.png",
                boss: "images/monsters/ghost_c.png"
            }
        },
        { name: "石巨人", weight: 10, baseGold: 15, icon: "🗿", hp: 150, atk: 20, drop: "石塊", eliteDrop: "魔力核心", bossDrop: "大地之心" },
        { name: "食人妖", weight: 5, baseGold: 25, icon: "🧟", hp: 200, atk: 25, drop: "巨棒", eliteDrop: "食人妖之血", bossDrop: "食人妖圖騰" },
        { name: "雙足飛龍", weight: 3, baseGold: 40, icon: "🐉", hp: 300, atk: 35, drop: "龍鱗", eliteDrop: "龍之淚", bossDrop: "龍心" },
        { name: "魔王", weight: 1, baseGold: 50, icon: "👿", hp: 500, atk: 50, drop: "黑暗物質", eliteDrop: "魔王印記", bossDrop: "魔神之眼" }
    ],

    // 戰利品數據
    lootData: {
        "史萊姆黏液": { price: 10, rarity: "common", icon: "💧" },
        "史萊姆精華": { price: 50, rarity: "uncommon", icon: "✨" },
        "史萊姆王冠": { price: 200, rarity: "rare", icon: "👑" },
        "破布": { price: 15, rarity: "common", icon: "🧶" },
        "哥布林耳環": { price: 60, rarity: "uncommon", icon: "💍" },
        "哥布林金牙": { price: 250, rarity: "rare", icon: "🦷" },
        "狼皮": { price: 20, rarity: "common", icon: "🧵" },
        "狼牙": { price: 80, rarity: "uncommon", icon: "🦴" },
        "狼王披風": { price: 300, rarity: "rare", icon: "🧣" },
        "骨頭": { price: 25, rarity: "common", icon: "🦴" },
        "靈魂碎片": { price: 100, rarity: "uncommon", icon: "👻" },
        "死靈頭骨": { price: 350, rarity: "rare", icon: "💀" },
        "斷劍": { price: 30, rarity: "common", icon: "🗡️" },
        "半獸人護符": { price: 120, rarity: "uncommon", icon: "🧿" },
        "戰爭號角": { price: 400, rarity: "rare", icon: "📯" },
        "靈質": { price: 35, rarity: "common", icon: "🌫️" },
        "怨念集合體": { price: 150, rarity: "uncommon", icon: "👿" },
        "幽靈提燈": { price: 450, rarity: "rare", icon: "🏮" },
        "石塊": { price: 50, rarity: "common", icon: "🪨" },
        "魔力核心": { price: 200, rarity: "rare", icon: "🔮" },
        "大地之心": { price: 600, rarity: "epic", icon: "💎" },
        "巨棒": { price: 60, rarity: "common", icon: "🪵" },
        "食人妖之血": { price: 250, rarity: "rare", icon: "🩸" },
        "食人妖圖騰": { price: 700, rarity: "epic", icon: "🗿" },
        "龍鱗": { price: 100, rarity: "uncommon", icon: "🛡️" },
        "龍之淚": { price: 400, rarity: "rare", icon: "💧" },
        "龍心": { price: 800, rarity: "epic", icon: "❤️" },
        "黑暗物質": { price: 200, rarity: "rare", icon: "⚫" },
        "魔王印記": { price: 500, rarity: "epic", icon: "🔯" },
        "魔神之眼": { price: 1000, rarity: "legendary", icon: "👁️" },
        "真實之心": { price: 5000, rarity: "mythic", icon: "💖" },
        "彈弓": { price: 0, rarity: "rare", icon: "🪃", desc: "遭遇哈比時必定擊退哈比，發動後消失，無法出售" },
        "鉤子": { price: 0, rarity: "rare", icon: "🪝", desc: "遭遇跌倒事件時可以躲避一次並獲得物品，發動後消失，無法出售" }
    },

    // 物品池
    itemPool: [
        { name: "生鏽匕首", type: "weapon", val: 3, rarity: "common", price: 15, icon: "🗡️" },
        { name: "木棒", type: "weapon", val: 4, rarity: "common", price: 20, icon: "🪵" },
        { name: "布衣", type: "armor", val: 10, rarity: "common", price: 15, icon: "👕" },
        { name: "初始盾牌", type: "shield", def: 10, rarity: "common", price: 15, icon: "🛡️" },
        { name: "治療藥水", type: "consumable", val: 30, rarity: "common", price: 25, icon: "🧪", desc: "恢復30點生命" },
        { name: "騎士長槍", type: "weapon", val: 12, rarity: "uncommon", price: 80, icon: "🔱" },
        { name: "鎖子甲", type: "armor", val: 40, rarity: "uncommon", price: 80, icon: "🛡️" },
        { name: "強力藥水", type: "consumable", val: 80, rarity: "uncommon", price: 60, icon: "🍷", desc: "恢復80點生命" },
        { name: "秘銀劍", type: "weapon", val: 30, rarity: "rare", price: 250, icon: "⚔️" },
        { name: "板甲", type: "armor", val: 100, rarity: "rare", price: 250, icon: "🛡️" },
        { name: "騎士盾", type: "shield", def: 30, rarity: "rare", price: 300, icon: "🛡️" },
        { name: "精靈藥劑", type: "consumable", val: 200, rarity: "rare", price: 150, icon: "🧉", desc: "恢復200點生命" },
        { name: "屠龍劍", type: "weapon", val: 60, rarity: "epic", price: 800, icon: "🐉" },
        { name: "龍鱗鎧甲", type: "armor", val: 250, rarity: "epic", price: 800, icon: "🥋" },
        { name: "塔盾", type: "shield", def: 50, rarity: "epic", price: 500, icon: "🧱" },
        { name: "聖劍 Excalibur", type: "weapon", val: 150, rarity: "legendary", price: 2500, icon: "🌟" },
        { name: "神之光輝", type: "armor", val: 400, rarity: "legendary", price: 2000, icon: "🌞" },
        { name: "埃癸斯之盾", type: "shield", def: 75, rarity: "legendary", price: 900, icon: "🔱" }
    ],

    // 不死鳥羽毛
    phoenixFeather: {
        id: "phoenix_feather",
        name: "不死鳥的羽毛",
        type: "revive",
        rarity: "legendary",
        icon: "🪶",
        price: 0,
        desc: "死亡時以50%生命復活，無法出售"
    },

    // 成就配置
    achievements: [
        { id: "abyss_50", name: "深淵踏入者", cond: "通過第 50 層", rarity: "common", check: (p) => p.depth >= 50 },
        { id: "abyss_100", name: "不屈探索者", cond: "通過第 100 層", rarity: "rare", check: (p) => p.depth >= 100 },
        { id: "abyss_500", name: "深淵王者", cond: "通過第 500 層", rarity: "epic", check: (p) => p.depth >= 500 },
        { id: "abyss_1000", name: "永夜漫遊者", cond: "通過第 1000 層", rarity: "legendary", check: (p) => p.depth >= 1000 },
        { id: "hero_kill", name: "勇者?", cond: "在 1000 層擊敗深層首領魔王", rarity: "legendary", check: (p) => p.kill1000Boss },
        { id: "collector", name: "收藏家", cond: "收集 20 種不同物品", rarity: "common", check: (p) => p.history.items.size >= 20 },
        { id: "researcher", name: "怪物研究員", cond: "取得所有一般與菁英掉落物(除真實之心)", rarity: "epic", check: (p) => window.Game.checkDrops('researcher') },
        { id: "prospector", name: "怪物探勘者", cond: "取得所有一般、菁英、首領掉落物(除真實之心)", rarity: "legendary", check: (p) => window.Game.checkDrops('prospector') },
        { id: "phoenix", name: "不死鳥的選中", cond: "取得「不死鳥的羽毛」", rarity: "legendary", check: (p) => p.history.items.has("不死鳥的羽毛") },
        // 賭場成就
        { id: "gambler", name: "🎲 賭徒", cond: "累積贏得 10000 金幣", rarity: "legendary", check: (p) => p.casinoStats && p.casinoStats.totalWin >= 10000 },
        { id: "gambling_god", name: "🎰 賭神", cond: "累積贏得 10000 金幣", rarity: "rare", check: (p) => p.casinoStats && p.casinoStats.totalWin >= 10000 },
        { id: "lucky_draw", name: "💎 歐皇", cond: "裝備抽獎連續抽中 3 次史詩以上", rarity: "epic", check: (p) => p.casinoStats && p.casinoStats.epicStreak >= 3 },
        { id: "unlucky_draw", name: "😭 非酋", cond: "裝備抽獎連續 5 次未抽中史詩以上", rarity: "epic", check: (p) => p.casinoStats && p.casinoStats.gachaStreak >= 5 },
        // Hidden Achievements
        { id: "rest", name: "休息?", cond: "取得所有普通到傳說的成就", rarity: "mythic", hidden: true, check: (p) => window.Game.checkTierComplete(['common', 'rare', 'epic', 'legendary']) },
        { id: "hero_true", name: "勇者", cond: "獲得真實之心", rarity: "mythic", hidden: true, check: (p) => p.history.items.has("真實之心") },
        { id: "answer", name: "答案", cond: "獲得所有物品", rarity: "mythic", hidden: true, check: (p) => window.Game.checkAllItems() },
        { id: "true_rest", name: "發自心靈的休息", cond: "獲得所有成就", rarity: "ultra", hidden: true, check: (p) => window.Game.checkAllAchievements() }
    ],
    // 詞綴系統定義
    affixes: {
        prefixes: {
            "fierce": { name: "猛烈的", type: "prefix", effect: "atk", val: 0.10, desc: "攻擊力 +10%" },
            "sturdy": { name: "堅固的", type: "prefix", effect: "hp", val: 0.10, desc: "生命上限 +10%" },
            "swift": { name: "迅捷的", type: "prefix", effect: "flee", val: 0.10, desc: "逃跑率 +10%" },
            "deadly": { name: "致命的", type: "prefix", effect: "crit", val: 0.05, desc: "暴擊率 +5%" },
            "guarding": { name: "守護的", type: "prefix", effect: "defFlat", val: 5, desc: "防禦 +5" },
            "wealthy": { name: "富有的", type: "prefix", effect: "gold", val: 0.15, desc: "金幣獲取 +15%" },
            "legendary": { name: "傳說的", type: "prefix", effect: "all", val: 0.15, desc: "生命/攻擊/爆擊/減傷 +15%" }
        },
        suffixes: {
            "leeching": { name: "之吸血", type: "suffix", allowedTypes: ['weapon'], desc: "攻擊恢復 10% 傷害的生命" },
            "frost": { name: "之冰霜", type: "suffix", allowedTypes: ['weapon'], desc: "10% 機率凍結敵人" },
            "rage": { name: "之狂暴", type: "suffix", allowedTypes: ['weapon'], desc: "每損失 1% 血量 +0.5% 攻擊" },
            "thorns": { name: "之荊棘", type: "suffix", allowedTypes: ['armor', 'shield'], desc: "反彈 20% 傷害" },
            "regen": { name: "之再生", type: "suffix", allowedTypes: ['armor', 'shield'], desc: "戰鬥結束恢復 10 HP" },
            "greed": { name: "之貪婪", type: "suffix", allowedTypes: ['weapon', 'armor', 'shield'], desc: "10% 機率戰鬥金幣翻倍" },
            "luck": { name: "之幸運", type: "suffix", allowedTypes: ['weapon', 'armor', 'shield'], effect: "luck", val: 0.2, desc: "戰利品掉落率+20%，且易掉落稀有物" }
        }
    },
    // 怪物專用詞綴
    monsterAffixes: {
        prefixes: {
            "fierce": { name: "猛烈的", type: "prefix", effect: "atk", val: 0.10, desc: "攻擊力 +10%" },
            "sturdy": { name: "堅固的", type: "prefix", effect: "hp", val: 0.10, desc: "生命上限 +10%" },
            "deadly": { name: "致命的", type: "prefix", effect: "crit", val: 0.05, desc: "暴擊率 +5%" },
            "guarding": { name: "守護的", type: "prefix", effect: "def", val: 0.05, desc: "減傷 +5%" },
            "legendary": { name: "傳說的", type: "prefix", effect: "all", val: 0.15, desc: "全屬性 +15%", rarity: "legendary" }
        },
        suffixes: {
            "leeching": { name: "之吸血", type: "suffix", effect: "leech", val: 0.10, desc: "攻擊恢復 10% 傷害的生命" },
            "frost": { name: "之冰霜", type: "suffix", effect: "freeze", val: 0.10, desc: "10% 機率凍結敵人" },
            "rage": { name: "之狂暴", type: "suffix", effect: "rage", val: 0.005, desc: "每損失 1% 血量 +0.5% 攻擊" }
        }
    },
    runes: {
        starting_potion: { id: 'starting_potion', name: '⚗️ 初始藥水', desc: '新冒險開始時額外獲得 2 瓶治療藥水', cost: 50, materials: [{ item: '史萊姆黏液', count: 5 }], effect: { type: 'initial_item', item: '治療藥水', count: 2 } },
        passive_gold: { id: 'passive_gold', name: '💰 貪婪之手', desc: '永久提升金幣獲取量 50%', cost: 200, materials: [{ item: '哥布林金牙', count: 5 }], effect: { type: 'gold_mult', val: 0.50 } },
        crit_boost: { id: 'crit_boost', name: '⚡ 致命專注', desc: '永久提升基礎暴擊率 10%', cost: 150, materials: [{ item: '狼牙', count: 10 }], effect: { type: 'crit_base', val: 10 } },
        strong_heal: { id: 'strong_heal', name: '🌿 治癒之風', desc: '藥水恢復效果增加 20%', cost: 100, materials: [{ item: '史萊姆精華', count: 5 }], effect: { type: 'potion_boost', val: 0.2 } }
    },

    // --- [新增: 創世神器碎片配置] ---
    shards: [
        { id: 'shard_knowledge', name: '知識碎片', icon: '🔮', cond: '賭場累計贏得 5000 G，並抽中傳說裝備。', type: 'casino', check: (p) => (p.casinoStats && p.casinoStats.totalWin >= 5000 && p.casinoStats.epicStreak >= 1) },
        { id: 'shard_power', name: '力量碎片', icon: '💪', cond: '成功將任意裝備強化到 +5 或以上。', type: 'blacksmith', check: (p) => p.history.maxEnhance >= 5 },
        { id: 'shard_blood', name: '血脈碎片', icon: '🩸', cond: '通過 500 層 Boss 戰鬥時，HP 低於 10%。', type: 'boss', check: (p) => p.history.lowHpBossKill },
        {
            id: 'shard_time', name: '時間碎片', icon: '⏳', cond: '解鎖 70% 的非隱藏成就。', type: 'achievement', check: (p) => {
                const visible = CONFIG.achievements.filter(a => !a.hidden).length;
                return p.achievements.size >= Math.floor(visible * 0.7);
            }
        },
        { id: 'shard_fate', name: '命運碎片', icon: '✨', cond: '深度 500 層後，極低機率在戰鬥中掉落。', type: 'drop', check: (p) => p.history.fateShardFound }
    ],

    // --- [新增: 煉金術配方 (素材用途)] ---
    recipes: {
        // 1. 狂暴藥劑 (攻擊 Buff)
        potion_atk: {
            id: 'potion_atk',
            name: '💥 狂暴密藥',
            desc: '獲得【惡魔的狂怒】Buff (攻擊力 +50%，攻擊扣血)。',
            resultType: 'consumable', // 改為消耗品
            buffId: 'demon_rage',
            icon: '🔥',
            price: 0, // 非賣品
            materials: [
                { item: "狼牙", count: 3 },
                { item: "斷劍", count: 3 }
            ]
        },
        // 2. 石膚藥劑 (防禦 Buff)
        potion_def: {
            id: 'potion_def',
            name: '🛡️ 石膚密藥',
            desc: '獲得【天使的加護】Buff (怪物傷害 -30%)。',
            resultType: 'consumable', // 改為消耗品
            buffId: 'angel_protection',
            icon: '🗿',
            price: 0, // 非賣品
            materials: [
                { item: "石塊", count: 5 },
                { item: "骨頭", count: 5 }
            ]
        },
        // 3. 幸運藥劑 (掉落 Buff)
        potion_luck: {
            id: 'potion_luck',
            name: '🍀 幸運密藥',
            desc: '獲得【天使的幸運】Buff (掉落率 100% + 額外掉落)。',
            resultType: 'consumable', // 改為消耗品
            buffId: 'angel_fortune',
            icon: '✨',
            price: 0, // 非賣品
            materials: [
                { item: "史萊姆精華", count: 2 },
                { item: "靈質", count: 2 }
            ]
        },
        // 4. 吸血附魔卷軸 (武器附魔)
        scroll_vampire: {
            id: 'scroll_vampire',
            name: '📜 吸血附魔卷軸',
            desc: '使用後，為當前武器附魔【之吸血】(攻擊恢復 10% 生命)。',
            resultType: 'scroll',
            icon: '🩸',
            price: 0, // 非賣品
            materials: [
                { item: "食人妖之血", count: 1 },
                { item: "哥布林耳環", count: 2 }
            ]
        },
        // 5. 龍之秘藥 (永久生命)
        potion_dragon: {
            id: 'potion_dragon',
            name: '🐉 龍之秘藥',
            desc: '本次冒險永久提升最大生命值 +50。',
            resultType: 'consumable',
            val: 50,
            icon: '🍷',
            price: 0, // 非賣品
            materials: [
                { item: "龍鱗", count: 1 },
                { item: "魔力核心", count: 1 }
            ]
        }
    },

    // --- [新增: 飾品製作配方 (工作檯)] ---
    craftingRecipes: {
        // --- 史萊姆系列 ---
        acc_slime_1: { id: 'acc_slime_1', name: "凝膠戒指", type: 'accessory', rarity: 'common', price: 100, icon: "⚪", desc: "毫無用處", materials: [{ item: "史萊姆黏液", count: 10 }] },
        acc_slime_2: { id: 'acc_slime_2', name: "精華護身符", type: 'accessory', rarity: 'rare', price: 500, icon: "🔵", desc: "每次事件回復 2 點生命", materials: [{ item: "史萊姆精華", count: 10 }] },
        acc_slime_3: { id: 'acc_slime_3', name: "黏液皇冠", type: 'accessory', rarity: 'epic', price: 2000, icon: "🟠", desc: "每次事件回復 10 點生命", materials: [{ item: "史萊姆王冠", count: 5 }] },

        // --- 哥布林系列 ---
        acc_gob_1: { id: 'acc_gob_1', name: "破布背包", type: 'accessory', rarity: 'common', price: 150, icon: "⚪", desc: "金幣獲取量 +5% (非商人)", materials: [{ item: "破布", count: 10 }] },
        acc_gob_2: { id: 'acc_gob_2', name: "金耳環", type: 'accessory', rarity: 'rare', price: 600, icon: "🔵", desc: "金幣獲取量 +10% (非商人)", materials: [{ item: "哥布林耳環", count: 10 }] },
        acc_gob_3: { id: 'acc_gob_3', name: "貪婪金牙", type: 'accessory', rarity: 'epic', price: 2500, icon: "🟠", desc: "金幣獲取量 +20% (非商人)", materials: [{ item: "哥布林金牙", count: 5 }] },

        // --- 狂狼系列 ---
        acc_wolf_1: { id: 'acc_wolf_1', name: "狼皮手套", type: 'accessory', rarity: 'common', price: 200, icon: "⚪", desc: "致命一擊機率 +1%", materials: [{ item: "狼皮", count: 10 }] },
        acc_wolf_2: { id: 'acc_wolf_2', name: "狼牙項鍊", type: 'accessory', rarity: 'rare', price: 800, icon: "🔵", desc: "致命一擊機率 +3%", materials: [{ item: "狼牙", count: 10 }] },
        acc_wolf_3: { id: 'acc_wolf_3', name: "血月披風", type: 'accessory', rarity: 'epic', price: 3000, icon: "🟠", desc: "致命一擊機率 +8%", materials: [{ item: "狼王披風", count: 5 }] },

        // --- 骷髏系列 ---
        acc_skel_1: { id: 'acc_skel_1', name: "骨戒", type: 'accessory', rarity: 'common', price: 250, icon: "⚪", desc: "傷害減少 5% (不含暴擊)", materials: [{ item: "骨頭", count: 10 }] },
        acc_skel_2: { id: 'acc_skel_2', name: "靈魂容器", type: 'accessory', rarity: 'rare', price: 1000, icon: "🔵", desc: "傷害減少 10% (不含暴擊)", materials: [{ item: "靈魂碎片", count: 10 }] },
        acc_skel_3: { id: 'acc_skel_3', name: "死靈護符", type: 'accessory', rarity: 'epic', price: 3500, icon: "🟠", desc: "傷害減少 15% (含暴擊)", materials: [{ item: "死靈頭骨", count: 5 }] },

        // --- 半獸人系列 ---
        acc_orc_1: { id: 'acc_orc_1', name: "斷劍掛飾", type: 'accessory', rarity: 'common', price: 300, icon: "⚪", desc: "哈比事件擊退率 +10%", materials: [{ item: "斷劍", count: 10 }] },
        acc_orc_2: { id: 'acc_orc_2', name: "蠻族護符", type: 'accessory', rarity: 'rare', price: 1200, icon: "🔵", desc: "哈比事件擊退率 +30%", materials: [{ item: "半獸人護符", count: 10 }] },
        acc_orc_3: { id: 'acc_orc_3', name: "威望號角", type: 'accessory', rarity: 'epic', price: 4000, icon: "🟠", desc: "哈比事件必定擊退", materials: [{ item: "戰爭號角", count: 5 }] },

        // --- 幽靈系列 ---
        acc_ghost_1: { id: 'acc_ghost_1', name: "靈質斗篷", type: 'accessory', rarity: 'common', price: 350, icon: "⚪", desc: "逃跑成功率 +2%", materials: [{ item: "靈質", count: 10 }] },
        acc_ghost_2: { id: 'acc_ghost_2', name: "怨念念珠", type: 'accessory', rarity: 'rare', price: 1500, icon: "🔵", desc: "逃跑成功率 +5%", materials: [{ item: "怨念集合體", count: 10 }] },
        acc_ghost_3: { id: 'acc_ghost_3', name: "冥界提燈", type: 'accessory', rarity: 'epic', price: 4500, icon: "🟠", desc: "逃跑成功率 +10%", materials: [{ item: "幽靈提燈", count: 5 }] },

        // --- 石巨人系列 ---
        acc_golem_1: { id: 'acc_golem_1', name: "石塊徽章", type: 'accessory', rarity: 'common', price: 500, icon: "⚪", desc: "生命上限 +30", materials: [{ item: "石塊", count: 10 }] },
        acc_golem_2: { id: 'acc_golem_2', name: "魔導核心", type: 'accessory', rarity: 'rare', price: 2000, icon: "🔵", desc: "生命上限 +100", materials: [{ item: "魔力核心", count: 10 }] },
        acc_golem_3: { id: 'acc_golem_3', name: "磐石之心", type: 'accessory', rarity: 'epic', price: 6000, icon: "🟠", desc: "生命上限 +200", materials: [{ item: "大地之心", count: 5 }] },

        // --- 食人妖系列 ---
        acc_troll_1: { id: 'acc_troll_1', name: "木棒護身符", type: 'accessory', rarity: 'common', price: 600, icon: "⚪", desc: "攻擊力 +10", materials: [{ item: "巨棒", count: 10 }] },
        acc_troll_2: { id: 'acc_troll_2', name: "鮮血瓶", type: 'accessory', rarity: 'rare', price: 2500, icon: "🔵", desc: "攻擊力 +20", materials: [{ item: "食人妖之血", count: 10 }] },
        acc_troll_3: { id: 'acc_troll_3', name: "古老圖騰", type: 'accessory', rarity: 'epic', price: 7000, icon: "🟠", desc: "攻擊力 +35", materials: [{ item: "食人妖圖騰", count: 5 }] },

        // --- 雙足飛龍系列 ---
        acc_wyv_1: { id: 'acc_wyv_1', name: "龍鱗片", type: 'accessory', rarity: 'common', price: 1000, icon: "⚪", desc: "首領傷害 +5%", materials: [{ item: "龍鱗", count: 10 }] },
        acc_wyv_2: { id: 'acc_wyv_2', name: "龍淚墜飾", type: 'accessory', rarity: 'rare', price: 4000, icon: "🔵", desc: "首領傷害 +8%", materials: [{ item: "龍之淚", count: 10 }] },
        acc_wyv_3: { id: 'acc_wyv_3', name: "真龍之心", type: 'accessory', rarity: 'epic', price: 8000, icon: "🟠", desc: "首領傷害 +20%", materials: [{ item: "龍心", count: 5 }] },

        // --- 魔王系列 ---
        acc_demon_1: { id: 'acc_demon_1', name: "黑暗碎片", type: 'accessory', rarity: 'rare', price: 2000, icon: "⚪", desc: "攻+10 HP+10 暴+2%", materials: [{ item: "黑暗物質", count: 10 }] },
        acc_demon_2: { id: 'acc_demon_2', name: "魔君徽章", type: 'accessory', rarity: 'epic', price: 5000, icon: "🔵", desc: "攻+20 HP+20 暴+5%", materials: [{ item: "魔王印記", count: 10 }] },
        acc_demon_3: { id: 'acc_demon_3', name: "混沌魔眼", type: 'accessory', rarity: 'legendary', price: 10000, icon: "🟠", desc: "攻+40 HP+40 暴+20%", materials: [{ item: "魔神之眼", count: 5 }] }
    },

    // --- [新增: 區域特色 (Biomes)] ---
    biomes: [
        { min: 1, max: 100, name: '🌲 迷霧森林', effect: null },
        { min: 101, max: 200, name: '❄️ 永凍冰原', effect: { type: 'freeze', chance: 0.05, desc: '寒冷刺骨，每回合 5% 機率被凍結' } },
        { min: 201, max: 300, name: '🌋 焦熱火山', effect: { type: 'burn', val: 0.02, desc: '高溫灼燒，每回合受到 2% 最大生命傷害' } },
        { min: 301, max: 400, name: '🪦 詛咒墓地', effect: { type: 'fear', critMod: -10, fleeMod: -0.2, desc: '恐懼蔓延，暴擊率 -10%，逃跑率降低' } },
        { min: 401, max: 9999, name: '🌌 深淵', effect: null }
    ],

    // --- [新增: 撤離點加成] ---
    extractionBonusMultiplier: 1.5,

    // --- [新增: 博物館套裝配置] ---
    museumSets: [
        {
            id: 'slime_set',
            name: '史萊姆收藏',
            items: ['史萊姆黏液', '史萊姆精華', '史萊姆王冠'],
            reward: { type: 'hp_bonus', val: 20, desc: '生命上限 +20' }
        },
        {
            id: 'goblin_set',
            name: '哥布林收藏',
            items: ['破布', '哥布林耳環', '哥布林金牙'],
            reward: { type: 'gold_bonus', val: 0.1, desc: '金幣獲取 +10%' }
        },
        {
            id: 'wolf_set',
            name: '狂狼收藏',
            items: ['狼皮', '狼牙', '狼王披風'],
            reward: { type: 'atk_bonus', val: 2, desc: '基礎攻擊 +2' }
        },
        {
            id: 'undead_set',
            name: '不死族收藏',
            items: ['骨頭', '靈魂碎片', '死靈頭骨'],
            reward: { type: 'def_bonus', val: 2, desc: '防禦力 +2' }
        },
        {
            id: 'orc_set',
            name: '半獸人收藏',
            items: ['斷劍', '半獸人護符', '戰爭號角'],
            reward: { type: 'atk_mult', val: 0.05, desc: '攻擊力 +5%' }
        },
        {
            id: 'ghost_set',
            name: '幽靈收藏',
            items: ['靈質', '怨念集合體', '幽靈提燈'],
            reward: { type: 'flee_bonus', val: 0.1, desc: '逃跑率 +10%' }
        },
        {
            id: 'rare_set',
            name: '稀有礦物收藏',
            items: ['石塊', '魔力核心', '大地之心'],
            reward: { type: 'def_bonus', val: 5, desc: '防禦力 +5' }
        },
        {
            id: 'boss_set',
            name: '首領收藏',
            items: ['巨棒', '食人妖之血', '食人妖圖騰'],
            reward: { type: 'hp_mult', val: 0.1, desc: '生命上限 +10%' }
        },
        {
            id: 'dragon_set',
            name: '龍族收藏',
            items: ['龍鱗', '龍之淚', '龍心'],
            reward: { type: 'crit_bonus', val: 5, desc: '暴擊率 +5%' }
        },
        {
            id: 'demon_king_set',
            name: '魔王收藏',
            items: ['黑暗物質', '魔王印記', '魔神之眼'],
            reward: { type: 'all_stats', val: 0, desc: '生命/攻擊/暴擊 +10%，防禦 +10' }
        }
    ],

    // --- [新增: 局外基地配置] ---
    hub: {
        upgradeCost: {
            atk: 10, // 兼容舊代碼 (雖然後續會改用公式)
            hp: 10
        },
        upgradeEffect: {
            atk: 1,
            hp: 10
        },
        // --- [新增: 訓練場進階配置] ---
        // --- [新增: 訓練場進階配置] ---
        training: {
            baseCost: 10,
            costIncrement: 1, // 方案 C: 線性增長，每級增加 1 EP
            // 設施升級配置 (目標等級)
            facilityUpgrades: [
                { targetLevel: 1, cost: { material: '史萊姆黏液', count: 10 }, desc: '擴建訓練場 (上限 Lv.20)' },
                { targetLevel: 2, cost: { material: '哥布林耳環', count: 10 }, desc: '擴建訓練場 (上限 Lv.30)' },
                { targetLevel: 3, cost: { material: '狼牙', count: 10 }, desc: '擴建訓練場 (上限 Lv.40)' },
                { targetLevel: 4, cost: { material: '骨頭', count: 10 }, desc: '擴建訓練場 (上限 Lv.50)' },
                { targetLevel: 5, cost: { material: '靈魂碎片', count: 10 }, desc: '擴建訓練場 (上限 Lv.60)' }
            ]
        },
        challengeMultiplier: {
            reward: 2.0 // 挑戰模式獎勵倍率
        },
        unlockDepthCost: 100 // 解鎖新層數消耗 EP
    }
};

// 導出配置
window.CONFIG = CONFIG;
console.log('CONFIG loaded');

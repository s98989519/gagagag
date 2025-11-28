/**
 * 幻想冒險 - 遊戲配置文件
 * 包含所有遊戲數據和配置
 * @版本 v2.0
 * @更新 2025-11-27
 */

const CONFIG = {
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
        ultra: { color: "rarity-ultra", label: "極傳說", val: 7 }
    },

    // Buff 配置
    buffs: {
        angel_song: { id: 'angel_song', name: '👼 天使的歌頌', type: 'angel', desc: '每次事件恢復 5 HP' },
        angel_protection: { id: 'angel_protection', name: '🛡️ 天使的加護', type: 'angel', desc: '怪物造成的傷害減少 30%' },
        angel_courage: { id: 'angel_courage', name: '⚔️ 天使的勇氣', type: 'angel', desc: '致命一擊機率提升至 20%' },
        angel_wings: { id: 'angel_wings', name: '🕊️ 天使的翅膀', type: 'angel', desc: '逃跑成功率提升至 60%' },
        angel_blessing: { id: 'angel_blessing', name: '🪙 天使的恩賜', type: 'angel', desc: '商店物品價格降低 30%，素材售價提高 20%' },
        angel_fortune: { id: 'angel_fortune', name: '🍀 天使的幸運', type: 'angel', desc: '戰利品掉落率提升至 100%，10% 機率獲得額外掉落' },
        angel_vitality: { id: 'angel_vitality', name: '⚗️ 天使的活力', type: 'angel', desc: '所有藥水恢復效果提升 50%，盾牌耐久 +1' },
        demon_wealth: { id: 'demon_wealth', name: '💰 惡魔的財富', type: 'demon', desc: '攻擊得5金幣，但逃跑失敗被攻擊時扣5金幣' },
        demon_destruction: { id: 'demon_destruction', name: '💀 惡魔的破壞', type: 'demon', desc: '10%機率秒殺怪物，觸發後扣除當前血量90%' },
        demon_enhance: { id: 'demon_enhance', name: '🔥 惡魔的強化', type: 'demon', desc: '雙方致命一擊機率變為 50%' },
        demon_wager: { id: 'demon_wager', name: '🎲 惡魔的賭約', type: 'demon', desc: '逃跑率80%，但每次逃跑有1%機率直接死亡' },
        demon_rage: { id: 'demon_rage', name: '🩸 惡魔的狂怒', type: 'demon', desc: '攻擊力 +50%，但每次攻擊消耗當前HP的 5%' }
    },

    // 怪物配置
    monsters: [
        { name: "史萊姆", weight: 13.5, baseGold: 1, icon: "🦠", hp: 20, atk: 3, drop: "史萊姆黏液", eliteDrop: "史萊姆精華", bossDrop: "史萊姆王冠" },
        { name: "哥布林", weight: 13.5, baseGold: 2, icon: "👺", hp: 35, atk: 5, drop: "破布", eliteDrop: "哥布林耳環", bossDrop: "哥布林金牙" },
        { name: "狂狼", weight: 13.5, baseGold: 3, icon: "🐺", hp: 50, atk: 8, drop: "狼皮", eliteDrop: "狼牙", bossDrop: "狼王披風" },
        { name: "骷髏兵", weight: 13.5, baseGold: 4, icon: "💀", hp: 60, atk: 10, drop: "骨頭", eliteDrop: "靈魂碎片", bossDrop: "死靈頭骨" },
        { name: "半獸人", weight: 13.5, baseGold: 8, icon: "👹", hp: 90, atk: 12, drop: "斷劍", eliteDrop: "半獸人護符", bossDrop: "戰爭號角" },
        { name: "幽靈", weight: 13.5, baseGold: 10, icon: "👻", hp: 70, atk: 15, drop: "靈質", eliteDrop: "怨念集合體", bossDrop: "幽靈提燈" },
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
        { name: "治療藥水", type: "consumable", val: 30, rarity: "common", price: 25, icon: "🧪", desc: "恢復30點生命" },
        { name: "騎士長槍", type: "weapon", val: 12, rarity: "uncommon", price: 80, icon: "🔱" },
        { name: "鎖子甲", type: "armor", val: 40, rarity: "uncommon", price: 80, icon: "🛡️" },
        { name: "強力藥水", type: "consumable", val: 80, rarity: "uncommon", price: 60, icon: "🍷", desc: "恢復80點生命" },
        { name: "秘銀劍", type: "weapon", val: 30, rarity: "rare", price: 250, icon: "⚔️" },
        { name: "板甲", type: "armor", val: 100, rarity: "rare", price: 250, icon: "🛡️" },
        { name: "騎士盾", type: "shield", val: 2, rarity: "rare", price: 300, icon: "🛡️" },
        { name: "精靈藥劑", type: "consumable", val: 200, rarity: "rare", price: 150, icon: "🧉", desc: "恢復200點生命" },
        { name: "屠龍劍", type: "weapon", val: 60, rarity: "epic", price: 800, icon: "🐉" },
        { name: "龍鱗鎧甲", type: "armor", val: 250, rarity: "epic", price: 800, icon: "🥋" },
        { name: "塔盾", type: "shield", val: 5, rarity: "epic", price: 500, icon: "🧱" },
        { name: "聖劍 Excalibur", type: "weapon", val: 150, rarity: "legendary", price: 2500, icon: "🌟" },
        { name: "神之光輝", type: "armor", val: 400, rarity: "legendary", price: 2000, icon: "🌞" },
        { name: "埃癸斯之盾", type: "shield", val: 10, rarity: "legendary", price: 900, icon: "🔱" }
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
        { id: "gambler", name: "🎲 賭徒", cond: "進行賭博 100 次", rarity: "common", check: (p) => p.casinoStats && p.casinoStats.gamesPlayed >= 100 },
        { id: "gambling_god", name: "🎰 賭神", cond: "累積贏得 10000 金幣", rarity: "rare", check: (p) => p.casinoStats && p.casinoStats.totalWin >= 10000 },
        { id: "lucky_draw", name: "💎 歐皇", cond: "裝備抽獎連續抽中 3 次史詩以上", rarity: "epic", check: (p) => p.casinoStats && p.casinoStats.epicStreak >= 3 },
        { id: "unlucky_draw", name: "😭 非酋", cond: "裝備抽獎連續 20 次未出稀有", rarity: "uncommon", check: (p) => p.casinoStats && p.casinoStats.gachaStreak >= 20 },
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
            "guarding": { name: "守護的", type: "prefix", effect: "def", val: 0.05, desc: "減傷 +5%" },
            "wealthy": { name: "富有的", type: "prefix", effect: "gold", val: 0.15, desc: "金幣獲取 +15%" },
            "legendary": { name: "傳說的", type: "prefix", effect: "all", val: 0.15, desc: "全屬性 +15%" }
        },
        suffixes: {
            "leeching": { name: "之吸血", type: "suffix", desc: "攻擊恢復 10% 傷害的生命" },
            "frost": { name: "之冰霜", type: "suffix", desc: "10% 機率凍結敵人" },
            "rage": { name: "之狂暴", type: "suffix", desc: "每損失 1% 血量 +0.5% 攻擊" },
            "thorns": { name: "之荊棘", type: "suffix", desc: "反彈 20% 傷害" },
            "regen": { name: "之再生", type: "suffix", desc: "戰鬥結束恢復 10 HP" },
            "greed": { name: "之貪婪", type: "suffix", desc: "10% 機率戰鬥金幣翻倍" }
        }
    }
};

// 導出配置（支持ES6模組和全域變數）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

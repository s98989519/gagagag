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
        angel_courage: { id: 'angel_courage', name: '⚔️ 天使的勇氣', type: 'angel', desc: '致命一擊機率提升 20%' },
        angel_wings: { id: 'angel_wings', name: '🕊️ 天使的翅膀', type: 'angel', desc: '逃跑成功率提升 15%' },
        angel_blessing: { id: 'angel_blessing', name: '🪙 天使的恩賜', type: 'angel', desc: '商店物品價格降低 30%，素材售價提高 20%' },
        angel_fortune: { id: 'angel_fortune', name: '🍀 天使的幸運', type: 'angel', desc: '戰利品掉落率提升至 100%，10% 機率獲得額外掉落' },
        angel_vitality: { id: 'angel_vitality', name: '⚗️ 天使的活力', type: 'angel', desc: '所有藥水恢復效果提升 50%' },
        demon_wealth: { id: 'demon_wealth', name: '💰 惡魔的財富', type: 'demon', desc: '攻擊得5金幣，但逃跑失敗被攻擊時扣5金幣' },
        demon_destruction: { id: 'demon_destruction', name: '💀 惡魔的破壞', type: 'demon', desc: '10%機率秒殺怪物，觸發後扣除當前血量90%' },
        demon_enhance: { id: 'demon_enhance', name: '🔥 惡魔的強化', type: 'demon', desc: '雙方致命一擊機率變為 50%' },
        demon_wager: { id: 'demon_wager', name: '🎲 惡魔的賭約', type: 'demon', desc: '逃跑率80%，但每次逃跑有1%機率直接死亡' },
        demon_rage: { id: 'demon_rage', name: '🩸 惡魔的狂怒', type: 'demon', desc: '攻擊力 +50%，但每次攻擊消耗當前HP的 5%' },

        // [New] Enhanced Demon Buffs (Lv4+)
        demon_wealth_plus: { id: 'demon_wealth_plus', name: '😈💰 惡魔的財富', type: 'demon_enhanced', desc: '攻擊得100金幣' },
        demon_destruction_plus: { id: 'demon_destruction_plus', name: '😈💀 惡魔的破壞', type: 'demon_enhanced', desc: '66%機率秒殺怪物，觸發後扣除當前血量20%' },
        demon_enhance_plus: { id: 'demon_enhance_plus', name: '😈🔥 惡魔的強化', type: 'demon_enhanced', desc: '你的致命一擊機率增加 40%' },
        demon_wager_plus: { id: 'demon_wager_plus', name: '😈🎲 惡魔的賭約', type: 'demon_enhanced', desc: '逃跑率80%，但每次逃跑有10%機率直接獲得10點攻擊力' },
        demon_rage_plus: { id: 'demon_rage_plus', name: '😈🩸 惡魔的狂怒', type: 'demon_enhanced', desc: '攻擊力 +50%，每次攻擊回復當前HP的 5%' },

        // [New] Spring Event Buff
        peace_of_mind: { id: 'peace_of_mind', name: '💧 安心', type: 'spring', desc: '每回合回復 5% 最大生命值' }
    },

    classes: {
        knight: {
            id: 'knight',
            icon: '🛡️',
            name: '🛡️ 騎士',
            desc: '受過正規訓練的戰士，擅長使用長槍與盾牌。',
            stats: { hp: 100, atk: 17, def: 10, sp: 8 },
            skill: {
                name: '聖光斬',
                desc: '消耗 8 SP，造成 150% 傷害並恢復 10% 最大生命值。',
                type: '終結技'
            },
            passive: '初始裝備騎士長槍 (攻+12)。'
        },
        merchant: {
            id: 'merchant',
            icon: '💰',
            name: '💰 商販',
            desc: '精通交易的商人，相信金錢就是力量。',
            stats: { hp: 100, atk: 9, def: 10, sp: 8 },
            skill: {
                name: '金錢力量',
                desc: '消耗 8 SP，造成 150% 傷害 + 10% 持有金幣的額外傷害 (花費5%當前金幣)。',
                type: '終結技'
            },
            passive: '出售物品價格 +20%，商店增加 2 個選項。'
        },
        thief: {
            id: 'thief',
            icon: '🗡️',
            name: '🗡️ 盜賊',
            desc: '身手矯健的盜賊，擅長尋寶與偷襲。',
            stats: { hp: 100, atk: 9, def: 10, sp: 8, evasion: 5 },
            skill: {
                name: '暗影一擊',
                desc: '消耗 8 SP，造成 150% 傷害並獲得 +10% 閃避率 (3回合)。',
                type: '終結技'
            },
            passive: '開啟寶箱時不會遇到陷阱或空箱。'
        },
        cultist: {
            id: 'cultist',
            icon: '😈',
            name: '😈 惡魔信徒',
            desc: '與惡魔簽訂契約的信徒，追求混沌的力量。',
            stats: { hp: 100, atk: 9, def: 10, sp: 8 },
            skill: {
                name: '邪神降臨',
                desc: '消耗 8 SP，造成 150% 傷害並隨機獲得一個惡魔 Buff (3回合)。',
                type: '終結技'
            },
            passive: '開局隨機獲得一個惡魔詛咒/祝福。'
        },
        scarecrow: {
            id: 'scarecrow',
            icon: '🌾',
            name: '🌾 稻草人',
            desc: '被賦予生命的稻草人，擁有令人恐懼的氣場。',
            stats: { hp: 100, atk: 9, def: 10, sp: 8 },
            skill: {
                name: '恐懼收割',
                desc: '消耗 8 SP，造成 200% 傷害並有 50% 機率暈眩敵人 (無法行動一回合)。',
                type: '終結技'
            },
            passive: '遭遇哈比時必定將其趕走。'
        },
        ape: {
            id: 'ape',
            icon: '🦍',
            name: '🦍 人猿',
            desc: '擁有強韌肉體的野獸戰士，皮糙肉厚。',
            stats: { hp: 100, atk: 9, def: 10, sp: 8 },
            skill: {
                name: '金剛重擊',
                desc: '消耗 8 SP，造成 150% 傷害並獲得 +10 防禦 (3回合)。',
                type: '終結技'
            },
            passive: '基礎防禦力 +10 (天生神力)。'
        }
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
        { name: "魔王", weight: 1, baseGold: 50, icon: "👿", hp: 500, atk: 50, drop: "黑暗物質", eliteDrop: "魔王印記", bossDrop: "魔神之眼" },
        {
            name: "哥布林族長",
            weight: 0, // 固定BOSS
            baseGold: 800,
            icon: "👺",
            hp: 888,
            atk: 8,
            drop: "破布",
            eliteDrop: "哥布林耳環",
            bossDrop: "哥布林金牙",
            tier: "boss",
            images: {
                normal: "images/monsters/goblin_c.png",
                elite: "images/monsters/goblin_c.png",
                boss: "images/monsters/goblin_c.png"
            }
        },
        {
            name: "史萊姆之王",
            weight: 0, // 固定BOSS
            baseGold: 300,
            icon: "👑",
            hp: 2000,
            atk: 5,
            drop: "史萊姆黏液",
            eliteDrop: "史萊姆精華",
            bossDrop: "史萊姆王冠",
            tier: "boss",
            images: {
                normal: "images/monsters/slime_c.png",
                elite: "images/monsters/slime_c.png",
                boss: "images/monsters/slime_c.png"
            }
        }
    ],

    // [NEW] 煉獄怪物
    infernoMonsters: [
        { name: "暗影史萊姆", weight: 20, baseGold: 50, icon: "🌑", hp: 1000, atk: 150, drop: "暗影凝膠" },
        { name: "虛空魔眼", weight: 20, baseGold: 60, icon: "👁️", hp: 2400, atk: 360, drop: "虛空之塵" },
        { name: "熔岩魔像", weight: 15, baseGold: 100, icon: "🌋", hp: 6000, atk: 400, drop: "熔岩核心", tier: "normal" },
        { name: "夢魘戰馬", weight: 15, baseGold: 120, icon: "🦄", hp: 5000, atk: 600, drop: "夢魘之角", tier: "normal" },
        { name: "墮落騎士", weight: 10, baseGold: 300, icon: "🤺", hp: 10000, atk: 800, drop: "腐朽鎧甲", tier: "elite" },
        { name: "混沌觸手", weight: 10, baseGold: 350, icon: "🦑", hp: 9000, atk: 900, drop: "混沌神經", tier: "elite" },
        { name: "鮮血伯爵", weight: 4, baseGold: 800, icon: "🧛", hp: 24000, atk: 1200, drop: "鮮血精華", tier: "boss" },
        { name: "巫妖王", weight: 4, baseGold: 900, icon: "💀", hp: 20000, atk: 1400, drop: "命匣碎片", tier: "boss" },
        { name: "深淵魔龍", weight: 2, baseGold: 2000, icon: "🐲", hp: 60000, atk: 2000, drop: "魔龍逆鱗", tier: "boss" },
        { name: "舊日支配者", weight: 0.1, baseGold: 9999, icon: "🐙", hp: 99999, atk: 9999, drop: "不可名狀之物", tier: "boss", isOldOne: true },
        { name: "神之代行者", weight: 0, baseGold: 99999, icon: "👼", hp: 999999, atk: 99999, drop: "輪迴沙漏", tier: "boss", isGod: true }
    ],

    // 煉獄神話裝備
    infernoItems: [
        { id: "w_ragnarok", name: "諸神黃昏", type: "weapon", val: 2000, rarity: "mythic", price: 10000, icon: "☄️", desc: "[真實傷害] 5% 機率一擊必殺 (對支配者與神無效)" },
        { id: "acc_red_cloth", name: "紅布", type: "accessory", rarity: "mythic", price: 5000, icon: "🧣", desc: "[鬥牛士] 暴擊率 +10%，遭遇牛頭人衝撞時必定免疫" },
        { id: "w_minotaur", name: "牛頭人戰斧", type: "weapon", val: 3000, rarity: "mythic", price: 8000, icon: "🪓", desc: "[嗜血成長] 擊殺敵人時 1% 機率永久提升 3% 基礎暴擊率" },
        { id: "w_soulreaver", name: "噬魂鐮刀", type: "weapon", val: 1500, rarity: "mythic", price: 8000, icon: "☠️", desc: "[吸血] 造成傷害的 5% 轉為生命力" },
        { id: "a_voidwalker", name: "虛空行者斗篷", type: "armor", val: 3000, rarity: "mythic", price: 9000, icon: "👻", desc: "[絕對迴避] 敵方攻擊有 10% 機率落空" },
        {
            id: "acc_wheel",
            name: "命運之輪",
            type: "accessory",
            rarity: "mythic",
            price: 12000,
            icon: "🎡",
            desc: "[暴擊突破] 暴擊率歸0轉化為傷害倍率 (每 20% 暴率提升 1 倍傷害)"
        },
        { id: "acc_chaos", name: "混沌魔方", type: "accessory", rarity: "mythic", price: 15000, icon: "🎲", desc: "[隨機倍率] 裝備時骰出 0.5~3.0 倍攻擊倍率" },
        { id: "c_harpy_blood", name: "哈比血", type: "consumable", val: 500, rarity: "mythic", price: 500, icon: "🍷", desc: "恢復 500 點生命" },
        { id: "c_pure_blood", name: "淨化血", type: "consumable", val: 99999, rarity: "mythic", price: 2000, icon: "✨", desc: "完全恢復生命" },
        { id: "w_doom", name: "破滅大劍", type: "weapon", val: 3000, rarity: "mythic", price: 20000, icon: "🗡️", desc: "單純且極致的破壞力 (攻擊力 3000)" },

        {
            id: "s_demon_wall",
            name: "魔神之壁",
            type: "shield",
            val: 10,
            rarity: "mythic",
            price: 25000,
            icon: "🛡️",
            desc: "[絕對防禦] 來自地獄的黑曜石巨盾，可抵擋 10 次攻擊"
        },
        { id: "a_apocalypse", name: "末世之鎧", type: "armor", val: 1000, rarity: "mythic", price: 20000, icon: "🛡️", desc: "[吞噬生命] 攻擊時 1% 機率永久增加 100 點基礎生命" },

        {
            id: "acc_transcendence",
            name: "超越魔方",
            type: "accessory",
            rarity: "mythic",
            price: 30000,
            icon: "🧊",
            desc: "[超越極限] 每回合隨機骰出 1.0~5.0 倍攻擊倍率 (與混沌疊加)"
        },
        {
            id: "w_void_breaker",
            name: "虛空破滅劍",
            type: "weapon",
            val: 2000,
            rarity: "mythic",
            price: 30000,
            icon: "🌌",
            desc: "[靈魂吞噬] 擊殺敵人時 10% 機率永久增加 100 點基礎攻擊力"
        },
        {
            id: "w_primordial",
            name: "原初之劍",
            type: "weapon",
            val: 33333,
            rarity: "ultra",
            price: 99999,
            icon: "⚔️",
            desc: "[原初之力] 攻擊力x1.5，且攻擊無視神之代行者的【聖潔力場】(傷害上限無效)"
        },
        {
            id: "c_inferno_scroll",
            name: "煉獄爐卷軸",
            type: "consumable",
            rarity: "mythic",
            price: 5000,
            icon: "📜",
            desc: "隨時隨地召喚煉獄爐火 (消耗品)"
        }
    ],

    // [NEW] 七宗罪裝備
    sinItems: [
        { id: "acc_pride", name: "傲慢之眼", type: "accessory", rarity: "mythic", price: 25000, icon: "🦁", desc: "[傲慢] 攻擊力 +100%，但所受傷害 +50%" },
        { id: "acc_envy", name: "嫉妒魔盒", type: "accessory", rarity: "mythic", price: 25000, icon: "🦊", desc: "[嫉妒] 攻擊時 10% 機率完全恢復生命" },
        { id: "acc_wrath", name: "暴怒指虎", type: "accessory", rarity: "mythic", price: 25000, icon: "😡", desc: "[暴怒] 攻擊力 +1000，且攻擊時 10% 機率造成兩次傷害" },
        { id: "acc_sloth", name: "眠戒", type: "accessory", rarity: "mythic", price: 25000, icon: "💤", desc: "[怠惰] 逃跑失敗時受到的傷害減少 50%" },
        { id: "acc_greed", name: "金色聖像", type: "accessory", rarity: "mythic", price: 25000, icon: "🐷", desc: "[貪婪] 擊殺怪物獲得金幣 +100%" },
        { id: "acc_gluttony", name: "暴食之牙", type: "accessory", rarity: "mythic", price: 25000, icon: "🍲", desc: "[暴食] 每次攻擊恢復 10% 最大生命" },
        { id: "acc_lust", name: "魅魔香水", type: "accessory", rarity: "mythic", price: 25000, icon: "👙", desc: "[色慾] 每場戰鬥第一次攻擊必定暴擊" },
        { id: "m_crown_sin", name: "原罪之冠", type: "material", rarity: "ultra", price: 99999, icon: "👑", desc: "[終極] 集齊七宗罪的證明，可召喚真神。" },

        // [New] Spring Event Item
        { id: "bottled_spring_water", name: "罐裝泉水", type: "consumable", rarity: "uncommon", price: 100, icon: "💧", desc: "來自平靜泉水的清澈泉水，使用時回復 20% 最大生命值。", effect: { type: "heal_percent", val: 0.2 } }
    ],

    specialItems: {
        chocolate: { name: "充滿魔力的巧克力", type: "material", rarity: "epic", icon: "🍫", desc: "散發著魔力的巧克力，無法食用。" },
        note: { name: "紙條", type: "material", rarity: "mythic", icon: "📄", desc: "上面寫著魅魔的真名。(重要道具)" },
        holy_sword: { name: "神聖光劍", type: "weapon", val: 1000, rarity: "mythic", price: 0, icon: "⚔️", desc: "莉莉絲贈送的神器。" },

        hourglass: {
            name: "輪迴沙漏",
            type: "consumable", // 這裡建議保持 consumable 或改為 special
            rarity: "ultra",
            icon: "⏳",
            desc: "發動後重置遊戲至初始狀態 (等級/金幣/物品歸零)，但可選擇一件飾品繼承。",
            price: 0
        },
        acc_truth: {
            name: "真實之冠",
            type: "accessory",
            rarity: "ultra",
            icon: "👑",
            desc: "[真神之力] 全屬性 +500，且戰鬥開始時對敵人施加「恐懼」 (攻防減半)。此物品死亡後不會消失。",
            price: 0,
            keepOnDeath: true, // [New] 死亡保留
            hp: 2000,
            atk: 500,
            def: 500
        },
        key_inferno: {
            name: "煉獄聖經",
            type: "material",
            rarity: "mythic",
            icon: "📕",
            desc: "開啟煉獄之門的鑰匙。此物品死亡後不會消失。",
            keepOnDeath: true
        }
    },

    forgeItems: [
        {
            id: "acc_shadow", name: "暗影替身", type: "accessory", rarity: "mythic", price: 20000, icon: "👤",
            desc: "[流體迴避] 10% 機率無效化傷害並反擊 (10% 防禦力)",
            recipe: { mat: "暗影凝膠", count: 10 }
        },
        {
            id: "shield_void", name: "虛空之鏡", type: "shield",
            val: 2,
            rarity: "mythic", price: 20000, icon: "🪞",
            desc: "[視線折射] 可擋暴擊，70% 機率不消耗耐久，反彈 50% 傷害",
            recipe: { mat: "虛空之塵", count: 10 }
        },
        {
            id: "armor_magma", name: "地心熔爐鎧", type: "armor", val: 2000, rarity: "mythic", price: 20000, icon: "🌋",
            desc: "[過熱反應] 受傷-20%。回合開始雙方各扣 5% HP (自身Max, 敵方Current)",
            recipe: { mat: "熔岩核心", count: 10 }
        },
        {
            id: "w_nightmare", name: "夢魘穿刺者", type: "weapon", val: 1500, rarity: "mythic", price: 20000, icon: "🦄",
            desc: "[恐懼衝鋒] 首回合攻擊 +100%。若未擊殺，下回合暈眩",
            recipe: { mat: "夢魘之角", count: 10 }
        },
        {
            id: "acc_dead", name: "亡者項鍊", type: "accessory", rarity: "mythic", price: 20000, icon: "💀",
            desc: "[亡者怨念] 死亡時進入靈魂型態 3 回合 (攻x2)，擊殺則復活",
            recipe: { mat: "腐朽鎧甲", count: 10 }
        },
        {
            id: "w_chaos", name: "理智鞭笞", type: "weapon", val: 0, rarity: "mythic", price: 20000, icon: "🦑",
            desc: "[思維污染] 攻擊 500~5000。10% 機率混亂敵人",
            recipe: { mat: "混沌神經", count: 10 }
        },
        {
            id: "acc_blood", name: "血之契約書", type: "accessory", rarity: "mythic", price: 20000, icon: "📜",
            desc: "[鮮血轉化] MaxHP 減半，減少值轉為攻擊。無法使用藥水",
            recipe: { mat: "鮮血精華", count: 10 }
        },
        {
            id: "acc_phylactery", name: "永生護符", type: "accessory", rarity: "mythic", price: 20000, icon: "⚱️",
            desc: "[命匣儲存] 擊殺存魂 (Max 200)。致死時耗 50 魂復活 50% HP",
            recipe: { mat: "命匣碎片", count: 10 }
        },
        {
            id: "armor_dragon", name: "逆鱗龍裝", type: "armor", val: 4000, rarity: "mythic", price: 20000, icon: "🐉",
            desc: "[龍之怒] 被暴擊時 10% 機率斬殺 (對神之代行者無效)",
            recipe: { mat: "魔龍逆鱗", count: 10 }
        },
        {
            id: "w_oldone", name: "滅世之槍", type: "weapon", val: 5000, rarity: "mythic", price: 50000, icon: "🔱",
            desc: "[支配者] 50% 機率支配敵人 (DoT 20, 100% 掉落)",
            recipe: { mat: "不可名狀之物", count: 5 }
        }
    ],

    sinBuffs: {
        sloth_curse: { id: 'sloth_curse', name: '💤 懶惰的詛咒', type: 'debuff', desc: '無法攻擊，只能逃跑 (剩餘 10 場)' },
        greed_shackle: { id: 'greed_shackle', name: '⛓️ 黃金枷鎖', type: 'debuff', desc: '敏捷下降，受傷增加 20% (需找惡魔商人消除)' },
        lust_charm: { id: 'lust_charm', name: '💋 媚氣環繞', type: 'debuff', desc: '每次遭遇事件扣除 10% 最大生命' }
    },
    sinMonsters: [
        { name: "鏡像", icon: "👤", hp: 1, atk: 1, drop: "", tier: "boss" }, // 數值動態生成
        { name: "狂戰士", icon: "⛓️", hp: 40000, atk: 1000, drop: "", tier: "boss" },
        { name: "黃金巨像", icon: "🗽", hp: 1, atk: 1000, drop: "", tier: "boss" } // HP 動態生成
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
        "鉤子": { price: 0, rarity: "rare", icon: "🪝", desc: "遭遇跌倒事件時可以躲避一次並獲得物品，發動後消失，無法出售" },

        // 煉獄素材
        "暗影凝膠": { price: 1000, rarity: "mythic", icon: "⚫" },
        "虛空之塵": { price: 1200, rarity: "mythic", icon: "🌫️" },
        "熔岩核心": { price: 1500, rarity: "mythic", icon: "🔥" },
        "夢魘之角": { price: 1800, rarity: "mythic", icon: "🦄" },
        "腐朽鎧甲": { price: 3000, rarity: "mythic", icon: "🛡️" },
        "混沌神經": { price: 3500, rarity: "mythic", icon: "🧠" },
        "鮮血精華": { price: 5000, rarity: "mythic", icon: "🩸" },
        "命匣碎片": { price: 6000, rarity: "mythic", icon: "💀" },
        "魔龍逆鱗": { price: 10000, rarity: "mythic", icon: "🐲" },
        "不可名狀之物": { price: 50000, rarity: "ultra", icon: "🐙" }
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
        { name: "行動工作台", type: "consumable", rarity: "rare", price: 700, icon: "🧰", effect: "open_workbench", desc: "一次性道具，隨時隨地開啟製作介面" },
        { name: "騎士盾", type: "shield", def: 30, rarity: "rare", price: 300, icon: "🛡️" },
        { name: "精靈藥劑", type: "consumable", val: 200, rarity: "rare", price: 150, icon: "🧉", desc: "恢復200點生命" },
        { name: "屠龍劍", type: "weapon", val: 60, rarity: "epic", price: 800, icon: "🐉" },
        { name: "龍鱗鎧甲", type: "armor", val: 250, rarity: "epic", price: 800, icon: "🥋" },
        { name: "塔盾", type: "shield", def: 50, rarity: "epic", price: 500, icon: "🧱" },
        { name: "聖劍 Excalibur", type: "weapon", val: 150, rarity: "legendary", price: 2500, icon: "🌟" },
        { name: "神之光輝", type: "armor", val: 400, rarity: "legendary", price: 2000, icon: "🌞" },
        { name: "埃癸斯之盾", type: "shield", def: 75, rarity: "legendary", price: 900, icon: "🔱" },
        // [New] 特殊道具
        { id: "tool_alchemy_kit", name: "便攜式煉金工具", type: "consumable", rarity: "legendary", price: 5000, icon: "⚗️", desc: "隨時隨地進行合成 (可無限使用)" }
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
            "agile": { name: "靈活的", type: "prefix", effect: "evasion", val: 0.20, desc: "閃避率 +20%" }, // [New]
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
        passive_gold: { id: 'passive_gold', name: '💰 貪婪之手', desc: '永久提升金幣獲取量 50%', cost: 100, materials: [{ item: '哥布林金牙', count: 5 }], effect: { type: 'gold_mult', val: 0.50 } },
        crit_boost: { id: 'crit_boost', name: '⚡ 致命專注', desc: '永久提升基礎暴擊率 10%', cost: 150, materials: [{ item: '狼牙', count: 10 }], effect: { type: 'crit_base', val: 10 } },
        strong_heal: { id: 'strong_heal', name: '🌿 治癒之風', desc: '藥水恢復效果增加 20%', cost: 100, materials: [{ item: '史萊姆精華', count: 5 }], effect: { type: 'potion_boost', val: 0.2 } },
        merchant_refresh: { id: 'merchant_refresh', name: '🔄 商販之友', desc: '允許在商店中刷新販賣物品（每次訪問商店可使用一次）', cost: 100, materials: [{ item: '破布', count: 10 }], effect: { type: 'merchant_refresh', val: 1 } },
        workbench_master: { id: 'workbench_master', name: '🔧 工匠大師', desc: '使用行動工作台時素材消耗降低 50%（原為 30%）', cost: 100, materials: [{ item: '魔力核心', count: 5 }], effect: { type: 'workbench_discount', val: 0.5 } }
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
        // [New] 煉獄聖經 (修正配方)
        key_inferno: {
            id: 'key_inferno',
            name: "煉獄聖經",
            type: 'consumable',
            rarity: 'mythic',
            price: 0,
            icon: "📕",
            desc: "使用後開啟煉獄之門。(消耗品，使用後會回到倉庫)",
            materials: [{ item: "真實之心", count: 1 }]
        },

        // --- 史萊姆系列 ---
        acc_slime_1: { id: 'acc_slime_1', name: "凝膠戒指", type: 'accessory', rarity: 'common', price: 100, icon: "⚪", desc: "毫無用處", materials: [{ item: "史萊姆黏液", count: 25 }] },
        acc_slime_2: { id: 'acc_slime_2', name: "精華護身符", type: 'accessory', rarity: 'rare', price: 500, icon: "🔵", desc: "每次事件回復 2 點生命", materials: [{ item: "史萊姆精華", count: 15 }] },
        acc_slime_3: { id: 'acc_slime_3', name: "黏液皇冠", type: 'accessory', rarity: 'epic', price: 2000, icon: "🟠", desc: "每次事件回復 10 點生命", materials: [{ item: "史萊姆王冠", count: 8 }] },

        // --- 哥布林系列 ---
        acc_gob_1: { id: 'acc_gob_1', name: "破布背包", type: 'accessory', rarity: 'common', price: 150, icon: "⚪", desc: "金幣獲取量 +5% (非商人)", materials: [{ item: "破布", count: 25 }] },
        acc_gob_2: { id: 'acc_gob_2', name: "金耳環", type: 'accessory', rarity: 'rare', price: 600, icon: "🔵", desc: "金幣獲取量 +10% (非商人)", materials: [{ item: "哥布林耳環", count: 15 }] },
        acc_gob_3: { id: 'acc_gob_3', name: "貪婪金牙", type: 'accessory', rarity: 'epic', price: 2500, icon: "🟠", desc: "金幣獲取量 +20% (非商人)", materials: [{ item: "哥布林金牙", count: 8 }] },

        // --- 狂狼系列 ---
        acc_wolf_1: { id: 'acc_wolf_1', name: "狼皮手套", type: 'accessory', rarity: 'common', price: 200, icon: "⚪", desc: "致命一擊機率 +1%", materials: [{ item: "狼皮", count: 25 }] },
        acc_wolf_2: { id: 'acc_wolf_2', name: "狼牙項鍊", type: 'accessory', rarity: 'rare', price: 800, icon: "🔵", desc: "致命一擊機率 +3%", materials: [{ item: "狼牙", count: 15 }] },
        acc_wolf_3: { id: 'acc_wolf_3', name: "血月披風", type: 'accessory', rarity: 'epic', price: 3000, icon: "🟠", desc: "致命一擊機率 +8%", materials: [{ item: "狼王披風", count: 8 }] },

        // --- 骷髏系列 ---
        acc_skel_1: { id: 'acc_skel_1', name: "骨戒", type: 'accessory', rarity: 'common', price: 250, icon: "⚪", desc: "傷害減少 5% (不含暴擊)", materials: [{ item: "骨頭", count: 25 }] },
        acc_skel_2: { id: 'acc_skel_2', name: "亡者之鏈", type: 'accessory', rarity: 'rare', price: 1000, icon: "🔵", desc: "傷害減少 10% (不含暴擊)", materials: [{ item: "靈魂碎片", count: 15 }] },
        acc_skel_3: { id: 'acc_skel_3', name: "死靈護符", type: 'accessory', rarity: 'epic', price: 3500, icon: "🟠", desc: "傷害減少 15% (含暴擊)", materials: [{ item: "死靈頭骨", count: 8 }] },

        // --- 半獸人系列 ---
        acc_orc_1: { id: 'acc_orc_1', name: "斷劍墜飾", type: 'accessory', rarity: 'common', price: 300, icon: "⚪", desc: "遇到哈比時 +50% 擊退率", materials: [{ item: "斷劍", count: 25 }] },
        acc_orc_2: { id: 'acc_orc_2', name: "獸角護符", type: 'accessory', rarity: 'rare', price: 1200, icon: "🔵", desc: "遇到哈比時自動擊退", materials: [{ item: "半獸人護符", count: 15 }] },
        acc_orc_3: { id: 'acc_orc_3', name: "威望號角", type: 'accessory', rarity: 'epic', price: 4000, icon: "🟠", desc: "哈比事件必定擊退", materials: [{ item: "戰爭號角", count: 8 }] },

        // --- 幽靈系列 ---
        acc_ghost_1: { id: 'acc_ghost_1', name: "鬼火靈珠", type: 'accessory', rarity: 'common', price: 350, icon: "⚪", desc: "逃跑機率 +5%", materials: [{ item: "靈質", count: 25 }] },
        acc_ghost_2: { id: 'acc_ghost_2', name: "怨念寶石", type: 'accessory', rarity: 'rare', price: 1500, icon: "🔵", desc: "逃跑機率 +10%", materials: [{ item: "怨念集合體", count: 15 }] },
        acc_ghost_3: { id: 'acc_ghost_3', name: "冥界提燈", type: 'accessory', rarity: 'epic', price: 4500, icon: "🟠", desc: "逃跑成功率 +10%", materials: [{ item: "幽靈提燈", count: 8 }] },

        // --- 石巨人系列 ---
        acc_golem_1: { id: 'acc_golem_1', name: "石護符", type: 'accessory', rarity: 'common', price: 500, icon: "⚪", desc: "生命上限 +10", materials: [{ item: "石塊", count: 25 }] },
        acc_golem_2: { id: 'acc_golem_2', name: "魔核墜飾", type: 'accessory', rarity: 'rare', price: 2000, icon: "🔵", desc: "生命上限 +25", materials: [{ item: "魔力核心", count: 15 }] },
        acc_golem_3: { id: 'acc_golem_3', name: "磐石之心", type: 'accessory', rarity: 'epic', price: 6000, icon: "🟠", desc: "生命上限 +200", materials: [{ item: "大地之心", count: 8 }] },

        // --- 食人妖系列 ---
        acc_troll_1: { id: 'acc_troll_1', name: "木棒護身符", type: 'accessory', rarity: 'common', price: 600, icon: "⚪", desc: "攻擊力 +10", materials: [{ item: "巨棒", count: 25 }] },
        acc_troll_2: { id: 'acc_troll_2', name: "鮮血瓶", type: 'accessory', rarity: 'rare', price: 2500, icon: "🔵", desc: "攻擊力 +20", materials: [{ item: "食人妖之血", count: 15 }] },
        acc_troll_3: { id: 'acc_troll_3', name: "古老圖騰", type: 'accessory', rarity: 'epic', price: 7000, icon: "🟠", desc: "攻擊力 +35", materials: [{ item: "食人妖圖騰", count: 8 }] },

        // --- 雙足飛龍系列 ---
        acc_wyv_1: { id: 'acc_wyv_1', name: "龍鱗片", type: 'accessory', rarity: 'common', price: 1000, icon: "⚪", desc: "首領傷害 +5%", materials: [{ item: "龍鱗", count: 25 }] },
        acc_wyv_2: { id: 'acc_wyv_2', name: "龍淚墜飾", type: 'accessory', rarity: 'rare', price: 4000, icon: "🔵", desc: "首領傷害 +8%", materials: [{ item: "龍之淚", count: 15 }] },
        acc_wyv_3: { id: 'acc_wyv_3', name: "真龍之心", type: 'accessory', rarity: 'epic', price: 8000, icon: "🟠", desc: "首領傷害 +20%", materials: [{ item: "龍心", count: 8 }] },

        // --- 魔王系列 ---
        acc_demon_1: { id: 'acc_demon_1', name: "黑暗碎片", type: 'accessory', rarity: 'rare', price: 2000, icon: "⚪", desc: "攻+10 HP+10 暴+2%", materials: [{ item: "黑暗物質", count: 25 }] },
        acc_demon_2: { id: 'acc_demon_2', name: "魔君徽章", type: 'accessory', rarity: 'epic', price: 5000, icon: "🔵", desc: "攻+20 HP+20 暴+5%", materials: [{ item: "魔王印記", count: 15 }] },
        acc_demon_3: { id: 'acc_demon_3', name: "混沌魔眼", type: 'accessory', rarity: 'legendary', price: 10000, icon: "🟠", desc: "攻+40 HP+40 暴+20%", materials: [{ item: "魔神之眼", count: 8 }] }
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
            items: [{ item: '史萊姆黏液', count: 10 }, { item: '史萊姆精華', count: 5 }, { item: '史萊姆王冠', count: 2 }],
            reward: { type: 'hp_bonus', val: 20, desc: '生命上限 +20' }
        },
        {
            id: 'goblin_set',
            name: '哥布林收藏',
            items: [{ item: '破布', count: 10 }, { item: '哥布林耳環', count: 5 }, { item: '哥布林金牙', count: 2 }],
            reward: { type: 'gold_bonus', val: 0.2, desc: '金幣獲取 +20%' }
        },
        {
            id: 'wolf_set',
            name: '狂狼收藏',
            items: [{ item: '狼皮', count: 10 }, { item: '狼牙', count: 5 }, { item: '狼王披風', count: 2 }],
            reward: { type: 'atk_bonus', val: 5, desc: '基礎攻擊 +5' }
        },
        {
            id: 'undead_set',
            name: '不死族收藏',
            items: [{ item: '骨頭', count: 10 }, { item: '靈魂碎片', count: 5 }, { item: '死靈頭骨', count: 2 }],
            reward: { type: 'def_bonus', val: 5, desc: '防禦力 +5' }
        },
        {
            id: 'orc_set',
            name: '半獸人收藏',
            items: [{ item: '斷劍', count: 10 }, { item: '半獸人護符', count: 5 }, { item: '戰爭號角', count: 2 }],
            reward: { type: 'atk_mult', val: 0.05, desc: '攻擊力 +5%' }
        },
        {
            id: 'ghost_set',
            name: '幽靈收藏',
            items: [{ item: '靈質', count: 10 }, { item: '怨念集合體', count: 5 }, { item: '幽靈提燈', count: 2 }],
            reward: { type: 'flee_bonus', val: 0.1, desc: '逃跑率 +10%' }
        },
        {
            id: 'rare_set',
            name: '稀有礦物收藏',
            items: [{ item: '石塊', count: 10 }, { item: '魔力核心', count: 5 }, { item: '大地之心', count: 2 }],
            reward: { type: 'def_bonus', val: 5, desc: '防禦力 +5' }
        },
        {
            id: 'boss_set',
            name: '首領收藏',
            items: [{ item: '巨棒', count: 10 }, { item: '食人妖之血', count: 5 }, { item: '食人妖圖騰', count: 2 }],
            reward: { type: 'hp_mult', val: 0.1, desc: '生命上限 +10%' }
        },
        {
            id: 'dragon_set',
            name: '龍族收藏',
            items: [{ item: '龍鱗', count: 10 }, { item: '龍之淚', count: 5 }, { item: '龍心', count: 2 }],
            reward: { type: 'crit_bonus', val: 5, desc: '暴擊率 +5%' }
        },
        {
            id: 'demon_king_set',
            name: '魔王收藏',
            items: [{ item: '黑暗物質', count: 10 }, { item: '魔王印記', count: 5 }, { item: '魔神之眼', count: 2 }],
            reward: { type: 'all_stats', val: 0, desc: '生命/攻擊/暴擊 +10%，防禦 +10' }
        }
    ],

    // [New] EP 商店配置 (方案 B) - 移至根目錄
    epShop: [
        { id: 'blessing_sp', name: '⚡ 能量飲料', desc: '這是一個特別祝福，該局 SP 上限 +8', cost: 300, effect: { type: 'sp', val: 8 } },
        { id: 'blessing_luck', name: '🍀 幸運護符', desc: '這是一個特別祝福，該局稀有掉落率 +20%', cost: 300, effect: { type: 'drop_rate', val: 0.2 } }
    ],

    // --- [新增: 局外基地配置] ---
    hub: {
        upgradeCost: {
            atk: 10, // 兼容舊代碼 (雖然後續會改用公式)
            hp: 10
        },
        upgradeEffect: {
            atk: 1,
            hp: 5
        },
        // --- [新增: 訓練場進階配置] ---
        // --- [新增: 訓練場進階配置] ---
        training: {
            baseCost: 10,
            costScale: 1.09, // 方案 A: 指數增長 (每級 +9%)
            // 設施升級配置 (目標等級)
            facilityUpgrades: [
                { targetLevel: 1, cost: { material: '史萊姆黏液', count: 10 }, desc: '擴建訓練場 (上限 Lv.20)' },
                { targetLevel: 2, cost: { material: '哥布林耳環', count: 10 }, desc: '擴建訓練場 (上限 Lv.30)' },
                { targetLevel: 3, cost: { material: '狼牙', count: 10 }, desc: '擴建訓練場 (上限 Lv.40)' },
                { targetLevel: 4, cost: { material: '骨頭', count: 10 }, desc: '擴建訓練場 (上限 Lv.50)' },
                { targetLevel: 5, cost: { material: '靈魂碎片', count: 10 }, desc: '擴建訓練場 (上限 Lv.60)' }

            ],
            // 技能強化 (根據 CSV 實裝)
            skillUpgrade: {
                maxLevel: 6,
                // Lv1 -> Lv2 Requirements (升級到 Lv2 所需)
                // index matches level (0: unused, 1: to Lv2, 2: to Lv3, etc.)
                costs: {
                    1: { ep: 50, materials: [{ item: '史萊姆黏液', count: 20 }, { item: '史萊姆精華', count: 10 }] },
                    2: { ep: 100, materials: [{ item: '破布', count: 20 }, { item: '哥布林耳環', count: 10 }, { item: '史萊姆精華', count: 5 }] },
                    3: { ep: 150, materials: [{ item: '狼皮', count: 20 }, { item: '狼牙', count: 10 }, { item: '哥布林金牙', count: 3 }] },
                    4: { ep: 200, materials: [{ item: '史萊姆黏液', count: 50 }, { item: '骨頭', count: 20 }, { item: '靈魂碎片', count: 5 }, { item: '狼王披風', count: 1 }, { item: '死靈頭骨', count: 1 }] },
                    5: { ep: 250, materials: [{ item: '史萊姆王冠', count: 1 }, { item: '哥布林金牙', count: 1 }, { item: '狼王披風', count: 1 }, { item: '死靈頭骨', count: 1 }, { item: '幽靈提燈', count: 1 }] }
                },
                // 技能數值描述 (用於UI顯示)
                // 格式: descriptions[classId][level]
                descriptions: {
                    knight: {
                        1: "造成 150% 傷害，並恢復 10% 最大生命。",
                        2: "造成 170% 傷害，並恢復 12% 最大生命。",
                        3: "造成 200% 傷害，並恢復 14% 最大生命。",
                        4: "造成 230% 傷害，並恢復 18% 最大生命。",
                        5: "造成 250% 傷害，並恢復 20% 最大生命。SP消耗-1",
                        6: "造成 300% 傷害，並恢復 25% 最大生命。SP消耗-2"
                    },
                    merchant: {
                        1: "造成 150% 傷害 + 10% 持有金幣的額外傷害。(⚠️ 花費 8% 金幣)",
                        2: "造成 170% 傷害 + 12% 持有金幣的額外傷害。(⚠️ 花費 5% 金幣)",
                        3: "造成 220% 傷害 + 15% 持有金幣的額外傷害。(⚠️ 花費 3% 金幣)",
                        4: "造成 250% 傷害 + 18% 持有金幣的額外傷害。",
                        5: "造成 270% 傷害 + 20% 持有金幣的額外傷害。SP消耗-1",
                        6: "造成 300% 傷害 + 25% 持有金幣的額外傷害。SP消耗-2"
                    },
                    thief: {
                        1: "造成 150% 傷害，+10% 閃避率 (3回合)。",
                        2: "造成 170% 傷害，+15% 閃避率 (3回合)。",
                        3: "造成 200% 傷害，+18% 閃避率 (3回合)，獲得 +40% 暴擊率 (2回合)。",
                        4: "造成 230% 傷害，+18% 閃避率 (4回合)，獲得 +50% 暴擊率 (2回合)。",
                        5: "造成 250% 傷害，+20% 閃避率 (4回合)，獲得 +60% 暴擊率 (3回合)。SP消耗-1",
                        6: "造成 300% 傷害，+20% 閃避率 (4回合)，獲得 +60% 暴擊率 (3回合)，並在暴擊時疊加閃避(+15%)。SP消耗-2"
                    },
                    cultist: {
                        1: "造成 150% 傷害，隨機獲得1個惡魔Buff (3回合)。",
                        2: "造成 170% 傷害，隨機獲得1個惡魔Buff (4回合)。",
                        3: "造成 200% 傷害，自選1個惡魔Buff (4回合)。",
                        4: "造成 230% 傷害，自選1個強化惡魔Buff (4回合)。",
                        5: "造成 250% 傷害，自選1個強化惡魔Buff (4回合)。SP消耗-1",
                        6: "造成 300% 傷害，自選2個強化惡魔Buff (4回合)。SP消耗-2"
                    },
                    scarecrow: {
                        1: "造成 200% 傷害，50% 機率暈眩。",
                        2: "造成 220% 傷害，60% 機率暈眩。",
                        3: "造成 250% 傷害，70% 機率暈眩，暈眩回血10%。",
                        4: "造成 280% 傷害，80% 機率暈眩，暈眩回血20%。",
                        5: "造成 300% 傷害，90% 機率暈眩，暈眩回血30%。SP消耗-1",
                        6: "造成 350% 傷害，100% 機率暈眩，暈眩回血50%。SP消耗-2"
                    },
                    ape: {
                        1: "造成 150% 傷害，+10 防禦力 (3回合)。",
                        2: "造成 170% 傷害，+15 防禦力 (3回合)。",
                        3: "造成 200% 傷害，+20 防禦力 (3回合)。",
                        4: "造成 220% 傷害，+25 防禦力 (4回合)。",
                        5: "造成 250% 傷害，+30 防禦力 (4回合)。SP消耗-2",
                        6: "造成 350% 傷害，+35 防禦力，若防禦>100追加100%傷害。SP消耗-2"
                    }
                }
            }
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

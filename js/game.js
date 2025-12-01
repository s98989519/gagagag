/**
 * 幻想冒險 - 主遊戲邏輯
 * 包含玩家狀態、遊戲循環、UI系統、存檔系統
 * @版本 v2.1 (局外基地版)
 * @更新 2025-11-30
 */

// ========== 遊戲狀態 ==========

const Player = {
    hp: 100,
    maxHp: 100,
    baseAtk: 5,
    gold: 100,
    depth: 0,
    class: null,
    equipment: { weapon: null, armor: null, shield: null },
    inventory: {
        equipment: [],
        consumable: [
            // 初始自帶一瓶治療藥水
            { name: "治療藥水", type: "consumable", val: 30, rarity: "common", price: 25, icon: "🧪", desc: "恢復30點生命" }
        ],
        material: []
    },
    buff: null,
    achievements: new Set(),
    history: { items: new Set() },
    kill1000Boss: false,
    // 神廟永久加成
    templeAtkBonus: 0,  // 神廟給的永久攻擊力加成
    templeHpBonus: 0,   // 神廟給的永久生命上限加成
    // 局外永久屬性
    explorationPoints: 0, // 探索點數 (EP)
    baseAtkBonus: 0,      // 訓練場永久攻擊加成
    baseHpBonus: 0,       // 訓練場永久生命加成
    maxDepthUnlocked: 0,  // 歷史最大深度
    startDepthUnlocked: [0], // 已解鎖的起始深度
    // 賭場系統
    luckPoints: 0,  // 幸運值（失敗累積）
    casinoStats: {
        totalBet: 0,      // 總下注金額
        totalWin: 0,      // 總贏得金額
        gamesPlayed: 0,   // 賭博次數
        gachaStreak: 0,   // 抽獎連抽次數（未出稀有）
        epicStreak: 0     // 連續史詩抽中次數
    },
    lastMerchantDepth: 0 // 上次遇到商店的層數
};

const GameState = {
    phase: "select_class", // select_class, combat, merchant, blacksmith, event_end, casino, hub, map_room, training
    currentEnemy: null,
    merchantStock: [],
    blacksmithAttempts: 0,
    log: [],
    isLoading: false,
    isProcessing: false, // 防止重複操作
    isChallengeMode: false, // 是否為挑戰模式
    inventorySortPreference: {
        equipment: 'default',  // 'default', 'rarity', 'type'
        consumable: 'default',
        material: 'default'
    }
};

// ========== 主遊戲對象 ==========

const Game = {
    lastEvent: null, // 上一次發生的事件類型
    /**
     * 初始化遊戲
     */
    init() {
        // 載入永久數據（成就、圖鑑）
        this.loadPersistentData();

        // 初始化音效系統
        if (window.AudioSystem) {
            window.AudioSystem.init();
        }

        // 自動檢查存檔
        if (localStorage.getItem('fantasy_adventure_save')) {
            // 有存檔，載入但不直接開始，而是進入 Hub
            this.loadGame(true);
        } else {
            // 無存檔，直接進入 Hub
            this.enterHub();
        }
    },

    // ========== 永久數據系統 ==========

    /**
     * 保存永久數據（成就、圖鑑、局外屬性）
     */
    savePersistentData() {
        try {
            const persistentData = {
                achievements: Array.from(Player.achievements),
                history: {
                    items: Array.from(Player.history.items)
                },
                // 局外屬性
                explorationPoints: Player.explorationPoints,
                baseAtkBonus: Player.baseAtkBonus,
                baseHpBonus: Player.baseHpBonus,
                maxDepthUnlocked: Player.maxDepthUnlocked,
                startDepthUnlocked: Player.startDepthUnlocked,
                // 賭場
                luckPoints: Player.luckPoints,
                casinoStats: Player.casinoStats
            };
            localStorage.setItem('fantasy_adventure_persistent', JSON.stringify(persistentData));
        } catch (e) {
            console.error("Persistent data save failed", e);
        }
    },

    /**
     * 載入永久數據（成就、圖鑑、局外屬性）
     */
    loadPersistentData() {
        try {
            const raw = localStorage.getItem('fantasy_adventure_persistent');
            if (raw) {
                const data = JSON.parse(raw);
                Player.achievements = new Set(data.achievements || []);
                Player.history.items = new Set(data.history?.items || []);

                // 載入局外屬性
                if (data.explorationPoints !== undefined) Player.explorationPoints = data.explorationPoints;
                if (data.baseAtkBonus !== undefined) Player.baseAtkBonus = data.baseAtkBonus;
                if (data.baseHpBonus !== undefined) Player.baseHpBonus = data.baseHpBonus;
                if (data.maxDepthUnlocked !== undefined) Player.maxDepthUnlocked = data.maxDepthUnlocked;
                if (data.startDepthUnlocked !== undefined) Player.startDepthUnlocked = data.startDepthUnlocked;

                // 載入賭場數據
                if (data.luckPoints !== undefined) Player.luckPoints = data.luckPoints;
                if (data.casinoStats !== undefined) Player.casinoStats = data.casinoStats;
            }
        } catch (e) {
            console.error("Persistent data load failed", e);
        }
    },

    // ========== 存檔系統 ==========

    /**
     * 保存遊戲
     */
    saveGame() {
        if (GameState.phase === 'combat' && GameState.currentEnemy) {
            // 戰鬥中不存檔，避免讀檔bug
            return;
        }
        try {
            const saveData = {
                player: Player,
                gameState: {
                    phase: GameState.phase,
                    merchantStock: GameState.merchantStock,
                    blacksmithAttempts: GameState.blacksmithAttempts,
                    log: GameState.log,
                    isChallengeMode: GameState.isChallengeMode,
                    inventorySortPreference: GameState.inventorySortPreference
                }
            };
            // 處理 Set 和 Map
            saveData.player.achievements = Array.from(Player.achievements);
            saveData.player.history.items = Array.from(Player.history.items);

            localStorage.setItem('fantasy_adventure_save', JSON.stringify(saveData));
        } catch (e) {
            console.error("Save failed", e);
        }
    },

    /**
     * 載入遊戲
     * @param {boolean} isHubStart - 是否從 Hub 開始 (不直接進入遊戲畫面)
     */
    loadGame(isHubStart = false) {
        try {
            const raw = localStorage.getItem('fantasy_adventure_save');
            if (!raw) return;

            const data = JSON.parse(raw);

            // 還原 Player
            Object.assign(Player, data.player);
            Player.achievements = new Set(data.player.achievements || []);
            Player.history = data.player.history || { items: [] };
            Player.history.items = new Set(Player.history.items || []);

            // 還原 GameState
            Object.assign(GameState, data.gameState);

            // 重新計算屬性
            this.recalcStats();

            if (isHubStart) {
                // 如果是 Hub 啟動模式，記錄原本的階段，然後進入 Hub
                this.savedPhase = GameState.phase;
                this.enterHub();
            } else {
                // 正常載入模式
                this.updateUI();
                this.log("讀取進度成功！");

                // 恢復介面顯示
                document.getElementById('hub-screen').classList.add('hidden');
                document.getElementById('game-container').classList.remove('hidden');

                if (GameState.phase === 'merchant') {
                    this.renderMerchantShop(false);
                } else if (GameState.phase === 'blacksmith') {
                    UISystem.renderBlacksmithUI();
                } else if (GameState.phase === 'select_class') {
                    this.selectClass(Player.class);
                }

                this.showFloatingText("自動載入進度", "#2196f3");
            }

        } catch (e) {
            console.error(e);
            alert("存檔損毀，開始新遊戲。");
            localStorage.removeItem('fantasy_adventure_save');
            this.enterHub();
        } finally {
            GameState.isLoading = false;
        }
    },

    /**
     * 繼續探險
     */
    resumeAdventure() {
        this.loadGame(false);
    },

    /**
     * 手動重新開始 (已棄用，保留兼容性)
     */
    manualRestart() {
        this.giveUpAdventure();
    },

    // ========== 永久數據系統 ==========

    /**
     * 保存永久數據（成就、圖鑑、局外屬性）
     */
    savePersistentData() {
        try {
            const persistentData = {
                achievements: Array.from(Player.achievements),
                history: {
                    items: Array.from(Player.history.items)
                },
                // 局外屬性
                explorationPoints: Player.explorationPoints,
                baseAtkBonus: Player.baseAtkBonus,
                baseHpBonus: Player.baseHpBonus,
                maxDepthUnlocked: Player.maxDepthUnlocked,
                startDepthUnlocked: Player.startDepthUnlocked,
                // 賭場
                luckPoints: Player.luckPoints,
                casinoStats: Player.casinoStats
            };
            localStorage.setItem('fantasy_adventure_persistent', JSON.stringify(persistentData));
        } catch (e) {
            console.error("Persistent data save failed", e);
        }
    },

    /**
     * 載入永久數據（成就、圖鑑、局外屬性）
     */
    loadPersistentData() {
        try {
            const raw = localStorage.getItem('fantasy_adventure_persistent');
            if (raw) {
                const data = JSON.parse(raw);
                Player.achievements = new Set(data.achievements || []);
                Player.history.items = new Set(data.history?.items || []);

                // 載入局外屬性
                if (data.explorationPoints !== undefined) Player.explorationPoints = data.explorationPoints;
                if (data.baseAtkBonus !== undefined) Player.baseAtkBonus = data.baseAtkBonus;
                if (data.baseHpBonus !== undefined) Player.baseHpBonus = data.baseHpBonus;
                if (data.maxDepthUnlocked !== undefined) Player.maxDepthUnlocked = data.maxDepthUnlocked;
                if (data.startDepthUnlocked !== undefined) Player.startDepthUnlocked = data.startDepthUnlocked;

                // 載入賭場數據
                if (data.luckPoints !== undefined) Player.luckPoints = data.luckPoints;
                if (data.casinoStats !== undefined) Player.casinoStats = data.casinoStats;
            }
        } catch (e) {
            console.error("Persistent data load failed", e);
        }
    },

    // ========== 存檔系統 ==========

    /**
     * 保存遊戲
     */
    saveGame() {
        if (Player.hp <= 0) {
            localStorage.removeItem('fantasy_adventure_save');
            return;
        }
        if (!Player.class) return;

        try {
            const saveData = {
                player: {
                    ...Player,
                    achievements: Array.from(Player.achievements),
                    history: {
                        items: Array.from(Player.history.items)
                    }
                },
                gameState: GameState,
                timestamp: new Date().toLocaleString()
            };
            const encrypted = btoa(encodeURIComponent(JSON.stringify(saveData)));
            localStorage.setItem('fantasy_adventure_save', encrypted);

            // 同時保存永久數據
            this.savePersistentData();
        } catch (e) {
            console.error("Auto-save failed", e);
        }
    },

    /**
     * 讀取遊戲
     */
    loadGame() {
        const raw = localStorage.getItem('fantasy_adventure_save');
        if (!raw) return;

        GameState.isLoading = true;

        try {
            let json;
            try {
                json = decodeURIComponent(atob(raw));
            } catch (e) {
                console.log("Legacy save detected");
                json = raw;
            }

            const data = JSON.parse(json);

            Object.assign(Player, data.player);
            Player.achievements = new Set(data.player.achievements);
            Player.history.items = new Set(data.player.history.items);

            Object.assign(GameState, data.gameState);

            // 初始化詞綴加成
            this.calculateModifiers();

            this.updateUI();
            document.getElementById('class-modal').style.display = 'none';

            const badgeMap = {
                'knight': '🛡️ 騎士',
                'merchant': '💰 商販',
                'thief': '🗡️ 盜賊',
                'cultist': '😈 惡魔信徒',
                'scarecrow': '🌾 稻草人',
                'ape': '🦍 人猿'
            };
            document.getElementById('class-badge').innerText = badgeMap[Player.class] || "";

            if (GameState.phase === 'combat' && GameState.currentEnemy) {
                const enemy = GameState.currentEnemy;
                this.renderEvent(`⚔️ 遭遇 ${enemy.name} (恢復)`,
                    `HP: ${enemy.hp} | 攻擊: ${enemy.atk}`,
                    "戰鬥繼續！", enemy.icon);

                let iconClass = "monster-icon";
                if (enemy.tier === "elite") iconClass += " monster-elite glow-blue";
                if (enemy.tier === "boss") iconClass += " monster-boss glow-red";
                if (enemy.isTrueForm) iconClass = "monster-icon monster-true-form glow-purple";
                document.getElementById('event-icon').className = iconClass;

                this.setButtons("戰鬥", "combatRound", "逃跑", "flee", false);
            } else if (GameState.phase === 'merchant') {
                this.triggerAnim('event-icon', 'anim-spawn');
                this.renderEvent("💰 神秘商人", "歡迎回來，要繼續交易嗎？", "點擊商品可查看詳情與購買", "👳");
                this.setButtons("離開", "nextEvent", "無", null, true);
                this.renderMerchantShop();
            } else if (GameState.phase === 'hub') {
                this.enterHub();
            } else {
                GameState.phase = "event_end";
                this.renderEvent("📂 讀取成功", `歡迎回到第 ${Player.depth} 層`, "請點擊按鈕繼續冒險。", "💾");
                document.getElementById('event-icon').className = "monster-icon";
                document.getElementById('merchant-area').classList.add('hidden');
                this.setButtons("繼續", "nextEvent", "無", null, true);
            }

            this.showFloatingText("自動載入進度", "#2196f3");

        } catch (e) {
            console.error(e);
            alert("存檔損毀，開始新遊戲。");
            localStorage.removeItem('fantasy_adventure_save');
        } finally {
            GameState.isLoading = false;
        }
    },

    /**
     * 手動重新開始
     */
    manualRestart() {
        if (confirm("⚠ 確定要重新開始遊戲嗎？\n\n按下確定後，現有的進度將會被刪除且無法復原！")) {
            localStorage.removeItem('fantasy_adventure_save');
            location.reload();
        }
    },

    // ========== 職業選擇 ==========

    /**
     * 選擇職業
     */
    /**
     * 選擇職業
     */
    selectClass(classType) {
        // 如果沒有傳入 classType，顯示職業選擇模態框
        if (!classType) {
            const modal = document.getElementById('class-modal');
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.remove('hidden');
            }
            return;
        }

        try {
            console.log("Selecting class:", classType);
            Player.class = classType;
            const modal = document.getElementById('class-modal');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.add('hidden'); // 強制隱藏
            }

            // 確保遊戲容器顯示
            const hubScreen = document.getElementById('hub-screen');
            const gameContainer = document.getElementById('game-container');

            hubScreen.classList.add('hidden');
            hubScreen.style.display = 'none'; // 強制隱藏

            gameContainer.classList.remove('hidden');
            gameContainer.style.display = 'block'; // 強制顯示

            // Debug: 檢查樣式
            console.log("Hub computed display:", window.getComputedStyle(hubScreen).display);
            console.log("Game computed display:", window.getComputedStyle(gameContainer).display);
            console.log("Game computed opacity:", window.getComputedStyle(gameContainer).opacity);
            console.log("Game computed visibility:", window.getComputedStyle(gameContainer).visibility);

            if (classType === 'knight') {
                const lance = { name: "騎士長槍", type: "weapon", val: 12, rarity: "uncommon", price: 80, icon: "🔱" };
                ItemSystem.addItemToInventory(lance, false);
                ItemSystem.equip(0, 'equipment');

                // 騎士也獲得初始盾牌
                const shield = { name: "初始盾牌", type: "shield", def: 3, rarity: "common", price: 15, icon: "🛡️" };
                ItemSystem.addItemToInventory(shield, false);
                ItemSystem.equip(0, 'equipment');
            } else {
                // 其他職業初始獲得木棒
                const club = { name: "木棒", type: "weapon", val: 4, rarity: "common", price: 20, icon: "🪵" };
                ItemSystem.addItemToInventory(club, false);
                ItemSystem.equip(0, 'equipment');

                // 其他職業獲得初始盾牌
                const shield = { name: "初始盾牌", type: "shield", def: 3, rarity: "common", price: 15, icon: "🛡️" };
                ItemSystem.addItemToInventory(shield, false);
                ItemSystem.equip(0, 'equipment');

                if (classType === 'cultist') {
                    const demonBuffs = Object.values(CONFIG.buffs).filter(b => b.type === 'demon');
                    Player.buff = demonBuffs[Math.floor(Math.random() * demonBuffs.length)];
                }
            }

            console.log("Class items equipped. Updating UI...");
            this.updateUI();
            console.log("UI Updated. Rendering event...");

            const badgeMap = {
                'knight': '🛡️ 騎士',
                'merchant': '💰 商販',
                'thief': '🗡️ 盜賊',
                'cultist': '😈 惡魔信徒',
                'scarecrow': '🌾 稻草人',
                'ape': '🦍 人猿'
            };
            document.getElementById('class-badge').innerText = badgeMap[classType];

            this.renderEvent("準備就緒", "你的冒險即將開始...", "祝你好運！", "✨");
            this.setButtons("開始冒險", "nextEvent", "無", null, true);
            console.log("Class selection complete.");

        } catch (e) {
            console.error("Error in selectClass:", e);
            alert("選擇職業時發生錯誤: " + e.message);
        }
    },

    // ========== 遊戲循環 ==========

    /**
     * 進入下一個事件
     */
    nextEvent() {
        if (Player.hp <= 0) {
            this.playerDie("未知原因");
            return;
        }

        Player.depth++;
        this.checkAchievements();
        this.log(`>>> 進入第 ${Player.depth} 層探索...`);

        // 天使歌頌buff效果
        if (Player.buff && Player.buff.id === 'angel_song') {
            if (Player.hp < Player.maxHp) {
                Player.hp = Math.min(Player.maxHp, Player.hp + 5);
                this.showFloatingText("+5 HP", "#69f0ae");
            }
        }

        // 特殊層數BOSS
        if (Player.depth >= 1000 && (Player.depth - 1000) % 500 === 0) {
            CombatSystem.triggerCombat(true, true);
            this.updateUI();
            this.saveGame(); // 自動存檔
            return;
        }

        if (Player.depth === 500) {
            CombatSystem.triggerCombat(true, false);
            this.updateUI();
            this.saveGame(); // 自動存檔
            return;
        }

        if (Player.depth === 501) {
            window.UISystem.showToast("警告：你已進入深層領域！所有怪物實力大幅增強！", "error");
        }

        // 哈比事件 (深度200後1%機率)
        if (Player.depth > 200 && Math.random() < 0.01) {
            EventSystem.triggerHarpy();
            this.updateUI();
            this.saveGame(); // 自動存檔
            return;
        }

        // 賭場事件 (深度100後1%機率，每100層必定觸發)
        if (Player.depth > 100 && (Player.depth % 100 === 0 || Math.random() < 0.01)) {
            EventSystem.triggerCasino();
            this.lastEvent = 'casino';
            this.updateUI();
            this.saveGame(); // 自動存檔
            return;
        }

        // 商店保底機制：前100層，每15層至少出現一次
        if (Player.depth <= 100 && (Player.depth - (Player.lastMerchantDepth || 0) >= 15)) {
            this.triggerMerchant();
            Player.lastMerchantDepth = Player.depth;
            this.lastEvent = 'merchant';
            this.updateUI();
            this.saveGame(); // 自動存檔
            return;
        }

        // 隨機事件
        const rand = Math.random();

        if (rand < 0.05) {
            EventSystem.triggerHeal();
            this.lastEvent = 'heal';
        } else if (rand < 0.10) {
            EventSystem.triggerStatue();
            this.lastEvent = 'statue';
        } else if (rand < 0.13) {
            EventSystem.triggerClassEvent();
            this.lastEvent = 'class';
        } else if (rand < 0.16) {
            this.triggerBlacksmith();
            this.lastEvent = 'blacksmith';
        } else if (rand < 0.21) {
            // 5% 機率觸發神廟
            EventSystem.triggerTemple();
            this.lastEvent = 'temple';
        } else if (rand < 0.32) {
            // 檢查是否連續出現商店
            if (this.lastEvent === 'merchant') {
                // 如果上次是商店，這次改為寶箱或戰鬥
                if (Math.random() < 0.5) {
                    EventSystem.triggerChest();
                    this.lastEvent = 'chest';
                } else {
                    CombatSystem.triggerCombat(false, false);
                    this.lastEvent = 'combat';
                }
            } else {
                this.triggerMerchant();
                Player.lastMerchantDepth = Player.depth;
                this.lastEvent = 'merchant';
            }
        } else if (rand < 0.40) {
            EventSystem.triggerChest();
            this.lastEvent = 'chest';
        } else {
            CombatSystem.triggerCombat(false, false);
            this.lastEvent = 'combat';
        }

        this.updateUI();
        this.saveGame(); // 自動存檔
    },

    // ========== 工匠系統 ==========

    /**
     * 觸發工匠事件
     */
    triggerBlacksmith() {
        AudioSystem.playSFX('anvil'); // 播放工匠音效
        // 自動卸下所有裝備到背包
        if (Player.equipment.weapon) {
            ItemSystem.addItemToInventory(Player.equipment.weapon, false);
            Player.equipment.weapon = null;
        }
        if (Player.equipment.armor) {
            ItemSystem.addItemToInventory(Player.equipment.armor, false);
            Player.equipment.armor = null;
        }
        if (Player.equipment.shield) {
            ItemSystem.addItemToInventory(Player.equipment.shield, false);
            Player.equipment.shield = null;
        }

        // 重新計算屬性
        this.recalcStats();

        GameState.phase = "blacksmith";
        GameState.blacksmithAttempts = 0;
        this.triggerAnim('event-icon', 'anim-spawn');
        this.renderEvent("🔨 發現工匠", "一位老練的工匠正在路邊休息...", `工匠可以幫你強化裝備！<br>需要消耗金幣(裝備價格的一半)和同名裝備作為素材。<br><span style='color:#888'>每次事件最多強化2次，最高+8</span><br><span style='color:#ff9800'>你的裝備已自動卸下</span><br><br><span style='color:#4caf50'>📊 本次強化進度: 0/2 次</span>`, "⚒️");
        this.renderBlacksmithUI();
        this.setButtons("離開", "closeBlacksmith", "無", null, true);
    },

    /**
     * 獲取道具基礎名稱（移除前綴、後綴、強化等級）
     */
    getBaseItemName(itemName) {
        let name = itemName;
        // 移除強化等級 (舊版 +1, +2 或 新版 [+1], [+2])
        name = name.replace(/\s*\+\d+$/, '').replace(/\s*\[\+\d+\]/, '');

        // 1. 移除前綴 (從 CONFIG 中匹配)
        // 必須先移除前綴，因為有些前綴可能包含空格
        if (window.CONFIG && window.CONFIG.affixes && window.CONFIG.affixes.prefixes) {
            const prefixes = Object.values(window.CONFIG.affixes.prefixes);
            for (const prefix of prefixes) {
                // 檢查是否以該前綴開頭 (例如 "猛烈的 ")
                if (name.startsWith(prefix.name + " ")) {
                    name = name.substring(prefix.name.length + 1); // +1 是為了移除空格
                    break; // 假設只有一個前綴
                }
            }
        }

        // 2. 移除後綴 (從 CONFIG 中匹配)
        if (window.CONFIG && window.CONFIG.affixes && window.CONFIG.affixes.suffixes) {
            const suffixes = Object.values(window.CONFIG.affixes.suffixes);
            for (const suffix of suffixes) {
                // 檢查是否以該後綴結尾 (例如 "之吸血")
                if (name.endsWith(suffix.name)) {
                    name = name.substring(0, name.length - suffix.name.length);
                    break; // 假設只有一個後綴
                }
            }
        }

        return name.trim();
    },
    /**
     * 顯示強化確認界面
     */
    showBlacksmithConfirm(idx) {
        // 檢查是否正在處理中或已達次數上限
        if (GameState.isProcessing || GameState.blacksmithAttempts >= 2) {
            if (GameState.blacksmithAttempts >= 2) {
                window.UISystem.showToast("已達到強化次數上限", "warning");
            }
            return;
        }

        const item = Player.inventory.equipment[idx];
        if (!item) return;

        // 獲取基礎名稱並找出所有可用素材
        const baseName = this.getBaseItemName(item.name);

        // 尋找所有可用的素材 (同名且非自己)
        const materials = [];
        Player.inventory.equipment.forEach((i, index) => {
            if (index === idx) return; // 不能是自己
            const iBaseName = this.getBaseItemName(i.name);
            if (iBaseName === baseName) {
                materials.push({ item: i, index: index });
            }
        });

        if (materials.length > 0) {
            // 讓玩家選擇素材
            window.UISystem.renderBlacksmithMaterialSelect(idx, materials);
        } else {
            window.UISystem.showToast("找不到可用的強化素材！", "error");
        }
    },

    /**
     * 取消選擇素材，返回工匠主介面
     */
    cancelBlacksmithSelect() {
        window.UISystem.hideModal();
    },

    /**
     * 確認強化（已選擇素材）
     */
    confirmEnhance(targetIdx, materialIdx) {
        window.UISystem.hideModal(); // 關閉素材選擇視窗

        // 再次檢查限制
        if (GameState.isProcessing || GameState.blacksmithAttempts >= 2) return;

        const item = Player.inventory.equipment[targetIdx];
        const material = Player.inventory.equipment[materialIdx];

        // 檢查物品是否還存在 (避免連點導致的錯誤)
        if (!item || !material) {
            window.UISystem.showToast("物品狀態異常，請重新操作", "error");
            this.renderBlacksmithUI(); // 重新渲染介面
            return;
        }

        const enhance = item.enhance || 0;
        const cost = Math.floor(item.price / 2);

        if (Player.gold < cost) {
            window.UISystem.showToast("金幣不足！", "error");
            return;
        }

        const rate = getBlacksmithRate(enhance);
        const isShield = item.type === 'shield';
        const baseVal = isShield ? item.def : item.val;

        // 盾牌特殊公式：基礎成長 + 強化等級額外加值 (每級 +1)
        const currentBonus = isShield ? enhance : 0;
        const nextBonus = isShield ? (enhance + 1) : 0;

        const currentVal = baseVal + Math.floor(baseVal * enhance * 0.1) + currentBonus;
        const nextVal = baseVal + Math.floor(baseVal * (enhance + 1) * 0.1) + nextBonus;
        const statType = item.type === 'weapon' ? '攻擊力' : item.type === 'armor' ? '生命值' : '防禦力';

        const msg = `
            <div style="text-align:left; font-size:1.1em; line-height:1.6;">
                <p><strong>強化裝備:</strong> <span style="color:#69f0ae">${item.name}</span></p>
                <p><strong>消耗素材:</strong> <span style="color:#ff9800">${material.name}</span></p>
                <p><strong>消耗金幣:</strong> <span style="color:#ffd700">${cost} G</span></p>
                <p><strong>成功機率:</strong> <span style="color:${rate.color}">${rate.rate}%</span></p>
                <hr style="border-color:#444; margin:10px 0;">
                <p><strong>📊 ${statType}變化:</strong></p>
                <p style="padding-left:15px;">當前: ${currentVal}</p>
                <p style="padding-left:15px;">成功後: <span style="color:#69f0ae">${nextVal} (+${nextVal - currentVal}) ✨</span></p>
                <p style="padding-left:15px; color:#888;">失敗: ${currentVal} (裝備不變，素材消失)</p>
                <hr style="border-color:#444; margin:10px 0;">
            </div>
        `;

        window.UISystem.showConfirmModal(
            "🔨 最終確認",
            msg,
            () => this.attemptEnhance(targetIdx, materialIdx)
        );
    },

    /**
     * 嘗試強化
     */
    attemptEnhance(idx, materialIdx) {
        if (GameState.isProcessing || GameState.blacksmithAttempts >= 2) return;

        GameState.isProcessing = true; // 鎖定操作

        // 隱藏工匠介面，避免重複點擊
        document.getElementById('merchant-area').classList.add('hidden');

        const item = Player.inventory.equipment[idx];
        const enhance = item.enhance || 0;
        const cost = Math.floor(item.price / 2);

        if (Player.gold < cost) {
            window.UISystem.showToast("金幣不足！", "error");
            GameState.isProcessing = false;
            document.getElementById('merchant-area').classList.remove('hidden'); // Restore UI if it was hidden
            this.renderBlacksmithUI();
            return;
        }

        const rateData = getBlacksmithRate(enhance);

        Player.gold -= cost;
        this.showFloatingText(`-${cost} G`, "yellow");

        // 刪除素材並調整目標索引
        Player.inventory.equipment.splice(materialIdx, 1);
        const adjustedIdx = materialIdx < idx ? idx - 1 : idx;
        const targetItem = Player.inventory.equipment[adjustedIdx];

        const success = Math.random() * 100 < rateData.rate;
        GameState.blacksmithAttempts++;

        if (success) {
            AudioSystem.playSFX('anvil_success'); // 播放強化成功音效
            targetItem.enhance = (targetItem.enhance || 0) + 1;

            // 重組名稱：前綴 [+N]基礎名稱 後綴
            const baseName = this.getBaseItemName(targetItem.name);
            let newName = "";

            // 添加前綴
            if (targetItem.prefix && window.CONFIG.affixes.prefixes[targetItem.prefix]) {
                newName += window.CONFIG.affixes.prefixes[targetItem.prefix].name + " ";
            }

            // 添加強化等級
            newName += `[+${targetItem.enhance}]`;

            // 添加基礎名稱
            newName += baseName;

            // 添加後綴
            if (targetItem.suffix && window.CONFIG.affixes.suffixes[targetItem.suffix]) {
                newName += window.CONFIG.affixes.suffixes[targetItem.suffix].name;
            }

            targetItem.name = newName;

            this.showFloatingText("強化成功!", "#69f0ae");
            this.triggerAnim('event-icon', 'anim-spawn');
            const isShield = targetItem.type === 'shield';
            const baseVal = isShield ? targetItem.def : targetItem.val;

            // 盾牌特殊公式：基礎成長 + 強化等級額外加值 (每級 +1)
            const newBonus = isShield ? targetItem.enhance : 0;
            const newVal = baseVal + Math.floor(baseVal * targetItem.enhance * 0.1) + newBonus;

            if (isShield) targetItem.def = newVal;
            else targetItem.val = newVal;

            this.renderEvent("✨ 強化成功！", `${targetItem.icon} ${targetItem.name}`, `恭喜！裝備變得更強了！<br><br>當前${targetItem.type === 'weapon' ? '攻擊力' : targetItem.type === 'armor' ? '生命值' : '防禦力'}: <span style="color:#69f0ae">${newVal}</span>`, "🎉");
        } else {
            AudioSystem.playSFX('anvil_fail'); // 播放強化失敗音效
            this.showFloatingText("強化失敗...", "#ff5252");
            this.triggerAnim('game-container', 'anim-screen-shake');
            this.renderEvent("💔 強化失敗", "工匠嘆了口氣...", `${targetItem.name} 強化失敗，但裝備未受損。<br><span style="color:#888">素材和金幣已消耗。</span>`, "😔");
        }
        this.updateUI();
        setTimeout(() => {
            GameState.isProcessing = false; // 解除鎖定
            if (GameState.blacksmithAttempts < 2) {
                this.renderEvent("🔨 發現工匠", `已強化 ${GameState.blacksmithAttempts}/2 次`, `可以繼續強化或離開<br><br><span style='color:#4caf50'>📊 本次強化進度: ${GameState.blacksmithAttempts}/2 次</span>`, "⚒️");
                this.renderBlacksmithUI();
                this.setButtons("離開", "closeBlacksmith", "無", null, true);
            } else {
                this.closeBlacksmith();
            }
        }, 2500);
    },

    /**
     * 關閉工匠
     */
    closeBlacksmith() {
        this.renderEvent("🔨 工匠離開", GameState.blacksmithAttempts > 0 ? `工匠已經幫你強化了${GameState.blacksmithAttempts}次` : "沒有進行強化", "工匠收拾工具離開了", "👋");

        // 自動裝備最強裝備
        ItemSystem.autoEquipBest();

        document.getElementById('merchant-area').classList.add('hidden');
        GameState.phase = "event_end";
        this.setButtons("繼續", "nextEvent", "無", null, true);
    },

    /**
     * 觸發商人事件
     */
    triggerMerchant() {
        AudioSystem.playSFX('shop'); // 播放商店音效
        GameState.phase = "merchant";
        this.generateMerchantStock();
        this.triggerAnim('event-icon', 'anim-spawn');
        this.renderEvent("💰 神秘商人", "「素材可是很值錢的，要賣一些嗎？」", "點擊商品可查看詳情與購買", "👳");
        this.setButtons("離開", "nextEvent", "無", null, true);
        this.renderMerchantShop();
    },

    /**
     * 生成商人商品
     */
    generateMerchantStock() {
        GameState.merchantStock = [];
        let slots = 4;

        // 商人職業特效：商店多 2 個選項
        if (Player.class === 'merchant') {
            slots += 2;
        }

        // 前100層，商店必定販賣藥水
        if (Player.depth <= 100) {
            GameState.merchantStock.push(ItemSystem.generateSpecificItem(['consumable']));
            slots--;
        }

        for (let i = 0; i < slots; i++) {
            GameState.merchantStock.push(ItemSystem.generateRandomItem());
        }
    },

    /**
     * 購買物品
     */
    buyItem(idx) {
        const item = GameState.merchantStock[idx];
        if (!item) return;

        // 計算價格（天使的恩賜：-30%）
        let finalPrice = item.price;
        if (Player.buff && Player.buff.id === 'angel_blessing') {
            finalPrice = Math.floor(finalPrice * 0.7);
        }

        if (Player.gold >= finalPrice) {
            Player.gold -= finalPrice;
            ItemSystem.addItemToInventory(item);
            GameState.merchantStock[idx] = null;
            this.showFloatingText("- " + finalPrice + " G", "yellow");
            this.log(`購買了 ${item.name}`);
            this.updateUI();
            this.renderMerchantShop(false);
        } else {
            window.UISystem.showToast("金幣不足！", "warning");
        }
    },

    // ========== 職業事件解析 ==========

    /**
     * 解析騎士幫助
     */
    resolveKnightHelp() {
        if (Math.random() < 0.6) {
            Player.gold += 100;
            Game.showFloatingText("+100 G", "gold");
            Game.renderEvent("⚔️ 救援成功", "你成功擊退了怪物！", "獲得報酬 <span class='gold-text'>100 G</span>", "🎉");
        } else {
            let dmg = Math.floor(Player.hp * 0.5);
            Player.hp -= dmg;
            Game.showFloatingText(`-${dmg} HP`, "red");
            Game.renderEvent("⚔️ 救援失敗", "怪物太強了，你受了重傷...", `損失 <span class='damage-text'>${dmg} HP</span>`, "🩸");
            if (Player.hp <= 0) { Game.playerDie("死於救援行動"); return; }
        }
        Game.setButtons("繼續", "nextEvent", "無", null, true);
        Game.updateUI();
    },

    resolveThiefChest() {
        if (Math.random() < 0.05) {
            const artifacts = CONFIG.itemPool.filter(i => i.rarity === 'legendary' && ['聖劍 Excalibur', '神之光輝', '埃癸斯之盾'].includes(i.name));
            if (artifacts.length > 0) {
                const item = { ...artifacts[Math.floor(Math.random() * artifacts.length)] };
                ItemSystem.addItemToInventory(item);
                Game.renderEvent("✨ 傳說現世", "寶箱裡竟然是傳說神器！", `獲得 <span class='rarity-legendary'>${item.name}</span>`, "👑");
            } else {
                const item = ItemSystem.generateRandomItem();
                ItemSystem.addItemToInventory(item);
                Game.renderEvent("📦 獲得物品", "", `獲得 ${item.name}`, "📦");
            }
        } else {
            let dmg = Math.floor(Player.hp * 0.5);
            Player.hp -= dmg;
            Game.showFloatingText(`-${dmg} HP`, "red");
            Game.renderEvent("💥 陷阱觸發", "強力的魔法炸飛了你！", `損失 <span class='damage-text'>${dmg} HP</span>`, "💣");
            if (Player.hp <= 0) { Game.playerDie("死於金色寶箱陷阱"); return; }
        }
        Game.setButtons("繼續", "nextEvent", "無", null, true);
        Game.updateUI();
    },

    /**
     * 解析惡魔遊戲
     */
    resolveCultistGame() {
        const pRoll = Math.floor(Math.random() * 6) + 1;
        const dRoll = Math.floor(Math.random() * 6) + 1;

        let resultHtml = `你擲出了 ${pRoll}，惡魔擲出了 ${dRoll}。<br>`;

        if (pRoll > dRoll) {
            let rarity = 'rare';
            let r = Math.random();
            if (r < 0.1) rarity = 'legendary';
            else if (r < 0.3) rarity = 'epic';

            let pool = CONFIG.itemPool.filter(i => i.rarity === rarity && ['weapon', 'armor', 'shield'].includes(i.type));
            if (pool.length === 0) pool = CONFIG.itemPool.filter(i => i.rarity === 'rare');

            const item = { ...pool[Math.floor(Math.random() * pool.length)] };
            ItemSystem.addItemToInventory(item);

            Game.renderEvent("🎲 勝利！", resultHtml, `惡魔不甘心地給了你 <span class='${CONFIG.rarityDisplay[item.rarity].color}'>${item.name}</span>`, "🎉");
        } else {
            Player.hp = Math.floor(Player.maxHp * 0.01) || 1;
            Game.showFloatingText("HP -> 1%", "darkred");
            Game.renderEvent("🎲 失敗...", resultHtml, "惡魔奪走了你的生命力...", "💀");
        }
        Game.setButtons("繼續", "nextEvent", "無", null, true);
        Game.updateUI();
    },

    /**
     * 進入局外基地 (Hub)
     */
    enterHub() {
        console.log("Executing enterHub...");
        GameState.phase = 'hub';
        GameState.isChallengeMode = false; // 重置挑戰模式狀態

        const gameContainer = document.getElementById('game-container');
        const hubScreen = document.getElementById('hub-screen');

        if (gameContainer) {
            gameContainer.classList.add('hidden');
        } else {
            console.error("CRITICAL: game-container not found in enterHub!");
        }

        if (hubScreen) {
            hubScreen.classList.remove('hidden');
            hubScreen.style.display = 'flex'; // Force display to ensure visibility
            console.log("hub-screen shown. Classes:", hubScreen.className, "Display:", hubScreen.style.display);
        } else {
            console.error("CRITICAL: hub-screen not found in enterHub!");
        }

        // 恢復取消按鈕顯示 (如果之前被隱藏)
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        if (cancelBtn) cancelBtn.style.display = 'inline-block';

        this.renderHubMenu();
    },

    /**
     * 渲染基地主選單
     */
    renderHubMenu() {
        console.log("Rendering Hub Menu...");
        const hasSave = localStorage.getItem('fantasy_adventure_save');

        let contentHtml = '';

        if (hasSave) {
            // 有存檔，顯示繼續/放棄選項
            contentHtml = `
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; max-width:600px; margin:0 auto;">
                    <button onclick="window.Game.resumeAdventure()" class="btn" style="background:#4caf50; padding: 20px; font-size: 1.2em; grid-column: 1 / -1;">
                        ⚔️ 繼續探險<br><span style="font-size:0.8em">回到上次的進度</span>
                    </button>
                    <button onclick="window.Game.giveUpAdventure()" class="btn" style="background:#d32f2f; padding: 20px; font-size: 1.2em; grid-column: 1 / -1;">
                        🏳️ 放棄探險<br><span style="font-size:0.8em">結算並重新開始</span>
                    </button>
                </div>
            `;
        } else {
            // 無存檔，顯示標準選單
            contentHtml = `
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; max-width:600px; margin:0 auto;">
                    <button onclick="window.Game.renderTrainingGrounds()" class="btn" style="background:#4caf50; padding: 20px; font-size: 1.2em;">
                        🏋️ 訓練場<br><span style="font-size:0.8em">提升基礎能力</span>
                    </button>
                    <button onclick="window.Game.renderMapRoom()" class="btn" style="background:#2196f3; padding: 20px; font-size: 1.2em;">
                        🗺️ 地圖室<br><span style="font-size:0.8em">選擇起始深度</span>
                    </button>
                    <button onclick="window.Game.renderRuneAltar()" class="btn" style="background:#9c27b0; padding: 20px; font-size: 1.2em;">
                        🔮 符文祭壇<br><span style="font-size:0.8em">解鎖永久天賦</span>
                    </button>
                    <button onclick="window.Game.renderMythicForge()" class="btn" style="background:#ff5722; padding: 20px; font-size: 1.2em;">
                        🔥 傳說熔爐<br><span style="font-size:0.8em">合成創世神器</span>
                    </button>
                </div>
            `;
        }

        const hubHtml = `
            <div style="text-align:center; padding:20px;">
                <h2 style="color:#ffd700; margin-bottom:20px; font-size: 2em;">🏰 冒險者基地</h2>
                <p style="font-size:1.5em; margin-bottom:40px;">
                    探索點數 (EP): <span style="color:#69f0ae; font-weight:bold;">${Player.explorationPoints}</span>
                </p>
                ${contentHtml}
                
                <div style="margin-top: 40px; border-top: 1px solid #444; padding-top: 20px;">
                    <button onclick="if(confirm('確定要清除所有存檔並重置遊戲嗎？此操作無法復原！')) window.Game.resetAllData()" class="btn" style="background:#d32f2f; padding: 10px 20px; font-size: 1em;">
                        🗑️ 清除所有數據 (重置)
                    </button>
                    <p style="color:#888; font-size:0.8em; margin-top:5px;">遇到嚴重錯誤或想完全重新開始時使用</p>
                </div>
            </div>
        `;

        // 渲染到全螢幕 Hub 容器
        const hubContent = document.getElementById('hub-content');
        if (hubContent) {
            hubContent.innerHTML = hubHtml;
            console.log("Hub content updated successfully.");
        } else {
            console.error("CRITICAL: hub-content not found in renderHubMenu!");
        }
    },
    renderTrainingGrounds() {
        GameState.phase = 'training';
        const costAtk = CONFIG.hub.upgradeCost.atk;
        const costHp = CONFIG.hub.upgradeCost.hp;

        const html = `
            <div style="text-align:center; padding:20px;">
                <h3 style="color:#4caf50; font-size: 1.8em; margin-bottom: 20px;">🏋️ 訓練場</h3>
                
                <!-- EP 顯示卡片 -->
                <div class="ep-card">
                    <div class="ep-title">剩餘 EP (進化點數)</div>
                    <div class="ep-value">${Player.explorationPoints}</div>
                </div>
                
                <div class="training-cards-container">
                    <!-- 攻擊力卡片 -->
                    <div class="training-card atk">
                        <span class="training-icon">⚔️</span>
                        <div class="training-title">基礎攻擊力</div>
                        <div class="training-value">當前: ${5 + Player.baseAtkBonus}</div>
                        <button onclick="window.Game.upgradeBaseStats('atk')" class="training-btn atk-btn" ${Player.explorationPoints < costAtk ? 'disabled' : ''}>
                            升級 (消耗 ${costAtk} EP)
                        </button>
                    </div>

                    <!-- 生命值卡片 -->
                    <div class="training-card hp">
                        <span class="training-icon">❤️</span>
                        <div class="training-title">基礎生命值</div>
                        <div class="training-value">當前: ${100 + Player.baseHpBonus}</div>
                        <button onclick="window.Game.upgradeBaseStats('hp')" class="training-btn hp-btn" ${Player.explorationPoints < costHp ? 'disabled' : ''}>
                            升級 (消耗 ${costHp} EP)
                        </button>
                    </div>
                </div>
                
                <button onclick="window.Game.enterHub()" class="btn" style="background:#666; margin-top:20px; padding: 10px 30px;">返回大廳</button>
            </div>
        `;
        document.getElementById('hub-content').innerHTML = html;
    },

    /**
     * 渲染符文祭壇
     */
    renderRuneAltar() {
        GameState.phase = 'rune_altar';

        // 確保數據已初始化
        if (!Player.unlockedRunes) Player.unlockedRunes = [];

        let html = `
            <div style="text-align:center; padding:20px;">
                <h3 style="color:#9c27b0; font-size: 1.8em; margin-bottom: 10px;">🔮 符文祭壇</h3>
                <p style="color:#aaa; margin-bottom: 20px;">消耗 EP 解鎖永久天賦</p>
                
                <div class="ep-card" style="margin-bottom: 20px;">
                    <div class="ep-title">剩餘 EP</div>
                    <div class="ep-value">${Player.explorationPoints}</div>
                </div>

                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:15px; max-width: 800px; margin: 0 auto;">
        `;

        for (let key in CONFIG.runes) {
            const rune = CONFIG.runes[key];
            const unlocked = Player.unlockedRunes.includes(rune.id);
            const canAfford = Player.explorationPoints >= rune.cost;

            html += `
                <div style="background: linear-gradient(135deg, #333 0%, #222 100%); border: 1px solid ${unlocked ? '#9c27b0' : '#555'}; border-radius: 10px; padding: 15px; text-align: left; position: relative;">
                    <div style="font-size: 1.2em; color: ${unlocked ? '#e1bee7' : '#fff'}; margin-bottom: 5px;">
                        ${rune.name} ${unlocked ? '✅' : ''}
                    </div>
                    <div style="font-size: 0.9em; color: #ccc; margin-bottom: 10px; height: 40px;">${rune.desc}</div>
                    
                    ${unlocked ?
                    `<button class="btn" disabled style="width:100%; background: #4a148c; color: #fff; opacity: 0.8;">已解鎖</button>` :
                    `<button onclick="window.Game.unlockRune('${rune.id}')" class="btn" style="width:100%; background: ${canAfford ? '#9c27b0' : '#555'};" ${!canAfford ? 'disabled' : ''}>
                            解鎖 (${rune.cost} EP)
                        </button>`
                }
                </div>
            `;
        }

        html += `
                </div>
                <button onclick="window.Game.enterHub()" class="btn" style="background:#666; margin-top:30px; padding: 10px 30px;">返回大廳</button>
            </div>
        `;
        document.getElementById('hub-content').innerHTML = html;
    },

    /**
     * 解鎖符文
     */
    unlockRune(runeId) {
        const rune = CONFIG.runes[runeId];
        if (!rune) return;

        // 確保數據已初始化
        if (!Player.unlockedRunes) Player.unlockedRunes = [];

        if (Player.unlockedRunes.includes(runeId)) return;

        if (Player.explorationPoints >= rune.cost) {
            Player.explorationPoints -= rune.cost;
            Player.unlockedRunes.push(runeId);
            this.savePersistentData();
            window.UISystem.showToast(`已解鎖符文：${rune.name}`, 'success');
            this.renderRuneAltar(); // 刷新介面
        } else {
            window.UISystem.showToast("EP 不足！", "error");
        }
    },

    /**
     * 渲染傳說熔爐
     */
    renderMythicForge() {
        GameState.phase = 'mythic_forge';

        // 確保數據已初始化
        if (!Player.shardsCollected) Player.shardsCollected = [];
        if (!Player.unlockedRunes) Player.unlockedRunes = [];

        // 檢查是否收集齊全
        const allCollected = CONFIG.shards.every(s => Player.shardsCollected.includes(s.id));
        const hasTrueHeart = Player.history.items && Player.history.items.has("真實之心");

        let html = `
            <div style="text-align:center; padding:20px;">
                <h3 style="color:#ff5722; font-size: 1.8em; margin-bottom: 10px;">🔥 傳說熔爐</h3>
                <p style="color:#aaa; margin-bottom: 20px;">收集創世神器的碎片，合成最終的真實</p>

                <div style="display:flex; justify-content:center; gap:10px; margin-bottom: 30px; flex-wrap: wrap;">
        `;

        CONFIG.shards.forEach(shard => {
            const collected = Player.shardsCollected.includes(shard.id);
            html += `
                <div style="width: 100px; height: 120px; background: ${collected ? 'linear-gradient(180deg, #3e2723 0%, #000 100%)' : '#222'}; border: 1px solid ${collected ? '#ff5722' : '#444'}; border-radius: 8px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 5px; opacity: ${collected ? 1 : 0.5};">
                    <div style="font-size: 2em; margin-bottom: 5px;">${shard.icon}</div>
                    <div style="font-size: 0.8em; color: ${collected ? '#ffab91' : '#888'};">${shard.name}</div>
                    ${collected ? '<div style="color:#4caf50; font-size:0.7em;">已獲得</div>' : '<div style="color:#888; font-size:0.7em;">未獲得</div>'}
                </div>
            `;
        });

        html += `</div>`;

        // 碎片詳情列表
        html += `<div style="max-width: 600px; margin: 0 auto; text-align: left; background: #1a1a1a; padding: 15px; border-radius: 8px;">`;
        CONFIG.shards.forEach(shard => {
            const collected = Player.shardsCollected.includes(shard.id);
            html += `
                <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #333; color: ${collected ? '#aaa' : '#fff'};">
                    <div style="font-weight:bold;">${shard.icon} ${shard.name}</div>
                    <div style="font-size: 0.9em; color: #888;">${shard.cond}</div>
                </div>
            `;
        });
        html += `</div>`;

        // 合成按鈕
        if (allCollected && !hasTrueHeart) {
            html += `
                <button onclick="window.Game.synthesizeTrueHeart()" class="btn" style="background: linear-gradient(45deg, #ff5722, #d84315); padding: 15px 40px; font-size: 1.5em; margin-top: 30px; border: 2px solid #ffab91; box-shadow: 0 0 15px #ff5722;">
                    ✨ 合成 真實之心 ✨
                </button>
            `;
        } else if (hasTrueHeart) {
            html += `
                <div style="margin-top: 30px; color: #ffeb3b; font-size: 1.2em; font-weight: bold;">
                    💖 你已獲得真實之心，傳說已經完成。
                </div>
            `;
        }

        html += `
                <button onclick="window.Game.enterHub()" class="btn" style="background:#666; margin-top:30px; padding: 10px 30px;">返回大廳</button>
            </div>
        `;
        document.getElementById('hub-content').innerHTML = html;
    },

    /**
     * 合成真實之心
     */
    synthesizeTrueHeart() {
        if (!CONFIG.shards.every(s => Player.shardsCollected.includes(s.id))) return;

        // 給予真實之心
        // 這裡我們直接解鎖成就或給予物品，因為這是 Hub 操作，物品無法帶入冒險，
        // 但我們可以給予一個永久的標記或特殊的起始物品。
        // 根據需求，這裡解鎖 "真結局" 或 "超級挑戰模式"。

        // 為了簡單起見，我們將其視為獲得一個永久的 "真實之心" 物品記錄在 history 中
        if (!Player.history.items) Player.history.items = new Set();
        Player.history.items.add("真實之心");

        // 解鎖相關成就
        if (window.Game.checkAchievements) window.Game.checkAchievements();

        this.savePersistentData();
        this.renderMythicForge();

        window.UISystem.showModal("✨ 傳說誕生", `
            <div style="text-align:center;">
                <div style="font-size: 4em; margin-bottom: 20px;">💖</div>
                <p>五個碎片匯聚成一體，發出了耀眼的光芒。</p>
                <p>你獲得了傳說中的神器 <strong>真實之心</strong>！</p>
                <p style="color: #ffeb3b; margin-top: 10px;">(已解鎖隱藏結局與成就)</p>
            </div>
        `);
    },

    /**
     * 檢查碎片獲取條件
     */
    checkShards() {
        if (!Player.shardsCollected) Player.shardsCollected = [];
        let newShard = false;

        CONFIG.shards.forEach(shard => {
            if (!Player.shardsCollected.includes(shard.id)) {
                if (shard.check(Player)) {
                    Player.shardsCollected.push(shard.id);
                    newShard = true;
                    window.UISystem.showToast(`✨ 獲得碎片：${shard.name}！`, 'success');
                    // 播放音效或特效 (可選)
                }
            }
        });

        if (newShard) {
            this.savePersistentData();
        }
    },

    /**
     * 升級基礎屬性
     */
    upgradeBaseStats(type) {
        const cost = CONFIG.hub.upgradeCost[type];
        if (Player.explorationPoints >= cost) {
            Player.explorationPoints -= cost;
            if (type === 'atk') {
                Player.baseAtkBonus += CONFIG.hub.upgradeEffect.atk;
                window.UISystem.showToast(`攻擊力永久 +${CONFIG.hub.upgradeEffect.atk}`, 'success');
            } else {
                Player.baseHpBonus += CONFIG.hub.upgradeEffect.hp;
                window.UISystem.showToast(`生命值永久 +${CONFIG.hub.upgradeEffect.hp}`, 'success');
            }
            this.savePersistentData();
            this.renderTrainingGrounds(); // 刷新介面
            window.UISystem.updateStatsUI();
        } else {
            window.UISystem.showToast("EP 不足！", "error");
        }
    },

    /**
     * 渲染地圖室
     */
    renderMapRoom() {
        GameState.phase = 'map_room';
        let html = `
            <div style="text-align:center; padding:20px;">
                <h3 style="color:#2196f3; font-size: 1.8em; margin-bottom: 20px;">🗺️ 地圖室</h3>
                <p style="font-size: 1.2em; margin-bottom: 20px;">選擇冒險的起點</p>
                <p style="font-size: 1.2em; margin-bottom: 30px;">目前 EP: <span style="color:#69f0ae">${Player.explorationPoints}</span></p>
                <p style="font-size:1em; color:#888;">歷史最深: ${Player.maxDepthUnlocked} 層</p>
                <hr style="border-color:#444; margin:20px 0;">
                <div style="display:flex; flex-direction:column; gap:15px; max-height:400px; overflow-y:auto; padding: 10px;">
        `;

        // 生成深度選項 (每 100 層一個節點)
        // 顯示已解鎖的
        Player.startDepthUnlocked.sort((a, b) => a - b).forEach(depth => {
            html += `
                <button onclick="window.Game.startNewAdventure(${depth})" class="btn" style="background:#00bcd4; padding: 15px; font-size: 1.1em;">
                    從第 ${depth} 層開始
                </button>
            `;
        });

        // 顯示下一個可解鎖的節點
        // 規則：必須達到過該層數，且前一個節點已解鎖
        const nextUnlock = (Player.startDepthUnlocked[Player.startDepthUnlocked.length - 1] || 0) + 100;
        if (Player.maxDepthUnlocked >= nextUnlock) {
            const cost = CONFIG.hub.unlockDepthCost;
            html += `
                <button onclick="window.Game.unlockDepth(${nextUnlock})" class="btn" style="background:#ff9800; padding: 15px; font-size: 1.1em;" ${Player.explorationPoints < cost ? 'disabled' : ''}>
                    解鎖第 ${nextUnlock} 層起點 (-${cost} EP)
                </button>
            `;
        } else if (nextUnlock <= 1000) { // 假設最高 1000 層
            html += `
                <button class="btn" disabled style="background:#555; color:#888; padding: 15px; font-size: 1.1em;">
                    需先到達第 ${nextUnlock} 層以解鎖
                </button>
            `;
        }

        html += `
                </div>
                <button onclick="window.Game.enterHub()" class="btn" style="background:#666; margin-top:30px; padding: 10px 30px;">返回大廳</button>
            </div>
        `;
        document.getElementById('hub-content').innerHTML = html;
    },

    /**
     * 解鎖新深度
     */
    unlockDepth(depth) {
        const cost = CONFIG.hub.unlockDepthCost;
        if (Player.explorationPoints >= cost) {
            Player.explorationPoints -= cost;
            Player.startDepthUnlocked.push(depth);
            this.savePersistentData();
            window.UISystem.showToast(`已解鎖第 ${depth} 層起點！`, 'success');
            this.renderMapRoom();
        } else {
            window.UISystem.showToast("EP 不足！", "error");
        }
    },

    /**
     * 渲染圖書館 (暫時簡單實作)
     */
    renderLibrary() {
        const html = `
            <div style="text-align:center; padding:20px;">
                <h3 style="color:#9c27b0; font-size: 1.8em; margin-bottom: 20px;">📚 圖書館</h3>
                <p style="font-size: 1.2em; margin-bottom: 20px;">功能開發中...</p>
                <p>這裡將允許你使用 EP 購買基於圖鑑收集度的永久 Buff。</p>
                <button onclick="window.Game.enterHub()" class="btn" style="background:#666; margin-top:30px; padding: 10px 30px;">返回大廳</button>
            </div>
        `;
        document.getElementById('hub-content').innerHTML = html;
    },

    /**
     * 渲染挑戰祭壇 (暫時簡單實作)
     */
    renderChallengeAltar() {
        const html = `
            <div style="text-align:center; padding:20px;">
                <h3 style="color:#ff5722; font-size: 1.8em; margin-bottom: 20px;">🔥 挑戰祭壇</h3>
                <p style="font-size: 1.2em; margin-bottom: 20px;">功能開發中...</p>
                <p>這裡將允許你開啟高難度模式，獲得更多 EP。</p>
                <button onclick="window.Game.enterHub()" class="btn" style="background:#666; margin-top:30px; padding: 10px 30px;">返回大廳</button>
            </div>
        `;
        document.getElementById('hub-content').innerHTML = html;
    },

    /**
     * 開始新冒險
     */
    startNewAdventure(startDepth = 1) {
        // 切換回遊戲介面
        document.getElementById('hub-screen').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');

        // 恢復按鈕顯示
        document.getElementById('btn-main').style.display = 'inline-block';
        document.getElementById('btn-sub').style.display = 'inline-block';

        // 備份永久屬性
        const persistent = {
            templeAtkBonus: Player.templeAtkBonus,
            templeHpBonus: Player.templeHpBonus,
            explorationPoints: Player.explorationPoints,
            baseAtkBonus: Player.baseAtkBonus,
            baseHpBonus: Player.baseHpBonus,
            maxDepthUnlocked: Player.maxDepthUnlocked,
            startDepthUnlocked: Player.startDepthUnlocked,
            luckPoints: Player.luckPoints,
            casinoStats: Player.casinoStats,
            achievements: Player.achievements,
            history: Player.history,
            kill1000Boss: Player.kill1000Boss,
            unlockedRunes: Player.unlockedRunes || [], // 新增: 符文
            shardsCollected: Player.shardsCollected || [] // 新增: 碎片
        };

        // 重置為初始狀態 (參考 Player 定義)
        Player.hp = 100;
        Player.maxHp = 100;
        Player.baseAtk = 5;
        Player.gold = 100;
        Player.depth = startDepth > 1 ? startDepth : 0; // 如果是選層，直接設定；否則 0 (nextEvent 會 +1)
        Player.class = null;
        Player.equipment = { weapon: null, armor: null, shield: null };
        Player.inventory = {
            equipment: [],
            consumable: [{ name: "治療藥水", type: "consumable", val: 30, rarity: "common", price: 25, icon: "🧪", desc: "恢復30點生命" }],
            material: []
        };
        Player.buff = null;

        // 還原永久屬性
        Object.assign(Player, persistent);

        // 應用永久加成
        Player.maxHp += Player.baseHpBonus + Player.templeHpBonus;
        Player.hp = Player.maxHp;

        // 應用符文效果: 初始藥水
        if (Player.unlockedRunes.includes('starting_potion')) {
            const potion = CONFIG.runes.starting_potion.effect;
            for (let i = 0; i < potion.count; i++) {
                Player.inventory.consumable.push({ name: potion.item, type: "consumable", val: 30, rarity: "common", price: 25, icon: "🧪", desc: "恢復30點生命" });
            }
            this.log("⚗️ [符文效果] 獲得初始藥水");
        }

        // 如果選擇了深度，給予一些初始補償 (可選)
        if (startDepth > 1) {
            Player.gold += startDepth * 2; // 每層 2 金幣補償
            this.log(`>>> 快速傳送至第 ${startDepth} 層！`);
        }

        GameState.phase = 'select_class';
        GameState.log = [];
        GameState.merchantStock = [];
        GameState.blacksmithAttempts = 0;

        this.updateUI();
        this.selectClass();
    },

    /**
     * 放棄探險 (結算並返回大廳)
     */
    giveUpAdventure() {
        // 移除 phase 檢查，允許從 Hub 放棄
        // if (GameState.phase === 'hub') return;

        // 計算探索點數 (每 10 層 1 點)
        let epReward = Math.floor(Player.depth / 10);

        // 挑戰模式獎勵加倍
        if (GameState.isChallengeMode) {
            epReward = Math.floor(epReward * CONFIG.hub.challengeMultiplier.reward);
        }

        Player.explorationPoints += epReward;

        // 更新最大深度紀錄
        Player.maxDepthUnlocked = Math.max(Player.maxDepthUnlocked, Player.depth);

        this.savePersistentData(); // 儲存局外數據

        // 刪除存檔
        localStorage.removeItem('fantasy_adventure_save');

        const msg = `
            <div style="text-align:center; padding: 20px;">
                <h2 style="color:#ffd700; margin-bottom:15px;">🏳️ 放棄探險</h2>
                <p style="font-size:1.2em; margin-bottom:10px;">你決定暫時撤退，整頓裝備。</p>
                <p style="font-size:1.2em; margin-bottom:10px;">冒險在第 <span style="color:#ffd700">${Player.depth}</span> 層結束。</p>
                <p style="font-size:1.1em; color:#69f0ae;">獲得探索點數 (EP): +${epReward}</p>
                <p style="color:#888; font-size:0.9em; margin-top:5px;">(目前總 EP: ${Player.explorationPoints})</p>
            </div>
        `;

        window.UISystem.showConfirmModal("冒險結束", msg, () => {
            window.Game.enterHub();
        });

        // 隱藏取消按鈕，強制確認
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        if (cancelBtn) cancelBtn.style.display = 'none';
    },

    /**
     * 獲取玩家總防禦力
     */
    getDef() {
        let def = 0;
        const player = window.Player;

        // 1. 盾牌基礎防禦
        if (player.equipment.shield && player.equipment.shield.def) {
            def += player.equipment.shield.def;
        }

        // 2. 職業加成 (人猿: +5 防禦)
        if (player.class === 'ape') {
            def += 5;
        }

        // 2. 詞綴加成
        if (this.modifiers) {
            // 固定數值加成 (例如: 守護的 +5)
            if (this.modifiers.defFlat) {
                def += this.modifiers.defFlat;
            }
            // 百分比加成 (例如: 傳說的 +15%)
            if (this.modifiers.def) {
                def = Math.floor(def * (1 + this.modifiers.def));
            }
        }

        return Math.floor(def);
    },
    /**
     * 獲取攻擊力
     */
    getAtk() {
        let atk = Player.baseAtk;
        if (Player.equipment.weapon) atk += Player.equipment.weapon.val;

        // 應用詞綴加成
        if (this.modifiers && this.modifiers.atk) {
            atk = Math.floor(atk * (1 + this.modifiers.atk));
        }

        // 最後加上神廟給的永久攻擊力加成 和 訓練場加成
        atk += (Player.templeAtkBonus || 0) + (Player.baseAtkBonus || 0);

        return atk;
    },

    /**
     * 獲取爆擊率
     */
    getCrit() {
        let crit = 5; // 基礎爆擊率 5%

        // 1. Buff 加成
        if (Player.buff) {
            if (Player.buff.id === 'angel_courage') crit = 20; // 天使的勇氣: 固定 20%
            if (Player.buff.id === 'demon_enhance') crit = 50; // 惡魔的強化: 固定 50%
        }

        // 2. 詞綴加成 (如果有)
        if (this.modifiers && this.modifiers.crit) {
            crit += Math.floor(this.modifiers.crit * 100);
        }

        return crit;
    },

    /**
     * 計算詞綴加成
     */
    calculateModifiers() {
        const mods = { atk: 0, def: 0, hp: 0, crit: 0, defFlat: 0 };
        const equipment = [
            Player.equipment.weapon,
            Player.equipment.armor,
            Player.equipment.shield
        ];

        equipment.forEach(item => {
            if (!item) return;

            // 1. 前綴加成
            if (item.prefix) {
                const affix = CONFIG.affixes.prefixes[item.prefix];
                if (affix) {
                    if (affix.effect === 'all') {
                        mods.atk += affix.val;
                        mods.hp += affix.val;
                        mods.crit += affix.val;
                        mods.def += affix.val;
                    } else if (mods[affix.effect] !== undefined) {
                        mods[affix.effect] += affix.val;
                    }
                }
            }

            // 2. 後綴加成
            if (item.suffix) {
                const affix = CONFIG.affixes.suffixes[item.suffix];
                if (affix) {
                    if (affix.effect === 'all') {
                        mods.atk += affix.val;
                        mods.hp += affix.val;
                        mods.crit += affix.val;
                        mods.def += affix.val;
                    } else if (mods[affix.effect] !== undefined) {
                        mods[affix.effect] += affix.val;
                    }
                }
            }
        });

        this.modifiers = mods;
    },

    recalcStats() {
        // 先計算詞綴
        this.calculateModifiers();

        const currentRatio = Player.maxHp > 0 ? Player.hp / Player.maxHp : 1;
        let bonusHp = Player.equipment.armor ? Player.equipment.armor.val : 0;
        let newMaxHp = 100 + bonusHp;

        // 應用生命值詞綴加成
        if (this.modifiers && this.modifiers.hp) {
            newMaxHp = Math.floor(newMaxHp * (1 + this.modifiers.hp));
        }

        // 最後加上神廟給的永久生命加成 和 訓練場加成
        newMaxHp += (Player.templeHpBonus || 0) + (Player.baseHpBonus || 0);

        Player.maxHp = newMaxHp;
        let newHp = Math.round(currentRatio * Player.maxHp);
        Player.hp = Math.min(newHp, Player.maxHp);
        if (Player.hp < 0) Player.hp = 0;
        this.updateStatsUI();
    },

    /**
     * 卸下裝備（從UI調用）
     */
    unequip(type) {
        ItemSystem.unequip(type);
    },

    /**
     * 處理副按鈕
     */
    handleSubAction() {
        // 子按鈕通過 setButtons 動態設定
    },

    /**
     * 記錄日誌
     */
    /**
     * 重置所有數據
     */
    resetAllData() {
        if (confirm("⚠️ 警告：這將刪除所有存檔、EP、成就與圖鑑！\n\n確定要完全重置遊戲嗎？此操作無法復原！")) {
            localStorage.removeItem('fantasy_adventure_save');
            localStorage.removeItem('fantasy_adventure_persistent');
            alert("所有數據已清除，網頁將重新載入。");
            location.reload();
        }
    },

    log(msg) {
        console.log(msg);
    },

    // ========== 成就與圖鑑 ==========

    /**
     * 檢查成就
     */
    checkAchievements() {
        let newUnlock = false;
        CONFIG.achievements.forEach(ach => {
            if (!Player.achievements.has(ach.id)) {
                if (ach.check(Player)) {
                    Player.achievements.add(ach.id);
                    this.showFloatingText(`🏆 達成: ${ach.name}`, CONFIG.rarityDisplay[ach.rarity].color === 'rarity-ultra' ? '#00ffcc' : 'gold');
                    newUnlock = true;
                }
            }
        });
        if (newUnlock) {
            this.savePersistentData(); // 保存成就
            this.checkAchievements();
        }

        // 同步檢查碎片
        if (this.checkShards) {
            this.checkShards();
        }
    },

    checkDrops(type) {
        let needed = [];
        CONFIG.monsters.forEach(m => {
            needed.push(m.drop);
            needed.push(m.eliteDrop);
            if (type === 'prospector') needed.push(m.bossDrop);
        });
        return needed.every(item => Player.history.items.has(item));
    },

    checkAllItems() {
        let allItems = [];
        CONFIG.itemPool.forEach(i => allItems.push(i.name));
        Object.keys(CONFIG.lootData).forEach(k => allItems.push(k));
        allItems.push(CONFIG.phoenixFeather.name);
        return allItems.every(i => Player.history.items.has(i));
    },

    checkTierComplete(tiers) {
        const targets = CONFIG.achievements.filter(a => tiers.includes(a.rarity) && !a.hidden);
        return targets.every(a => Player.achievements.has(a.id));
    },

    checkAllAchievements() {
        const others = CONFIG.achievements.filter(a => a.id !== 'true_rest');
        return others.every(a => Player.achievements.has(a.id));
    },

    showAchievements() { UISystem.showAchievements(); },
    showCompendium() { UISystem.showCompendium(); },
    showAffixCompendium() { UISystem.showAffixCompendium(); },
    showBuffCompendium() { UISystem.showBuffCompendium(); },

    // ========== 玩家死亡與局外系統 ==========

    /**
     * 玩家死亡
     */
    playerDie(reason) {
        const featherIdx = Player.inventory.material.findIndex(i => i.id === 'phoenix_feather');
        if (featherIdx !== -1) {
            Player.inventory.material.splice(featherIdx, 1);
            Player.hp = Math.floor(Player.maxHp * 0.5);

            if (GameState.phase === 'combat' && GameState.currentEnemy) {
                this.renderEvent(`⚔️ 浴火重生`, `敵方 HP: ${GameState.currentEnemy.hp}`, "不死鳥的羽毛讓你復活了！戰鬥繼續！", GameState.currentEnemy.icon);
                this.setButtons("戰鬥", "combatRound", "逃跑", "flee", false);
            } else {
                this.renderEvent("🔥 浴火重生", "不死鳥的羽毛發出耀眼光芒...", "你復活了！恢復 50% 生命值。", "🦅");
                GameState.phase = "event_end";
                this.setButtons("繼續", "nextEvent", "無", null, true);
            }

            this.updateUI();
            return;
        }

        GameState.phase = "dead";
        Player.hp = 0;
        AudioSystem.playSFX('die');
        this.updateUI();
        localStorage.removeItem('fantasy_adventure_save');

        // 計算探索點數 (每 10 層 1 點)
        let epReward = Math.floor(Player.depth / 10);

        // 挑戰模式獎勵加倍
        if (GameState.isChallengeMode) {
            epReward = Math.floor(epReward * CONFIG.hub.challengeMultiplier.reward);
        }

        Player.explorationPoints += epReward;

        // 更新最大深度紀錄
        Player.maxDepthUnlocked = Math.max(Player.maxDepthUnlocked, Player.depth);

        this.savePersistentData(); // 儲存局外數據

        let cause = reason ? reason : "未知原因";
        const msg = `
            <div style="text-align:center; padding: 20px;">
                <h2 style="color:#ff5252; margin-bottom:15px;">💀 你死了</h2>
                <p style="font-size:1.1em; margin-bottom:10px;">死因：${cause}</p>
                <p style="font-size:1.2em; margin-bottom:10px;">冒險在第 <span style="color:#ffd700">${Player.depth}</span> 層結束。</p>
                <p style="font-size:1.1em; color:#69f0ae;">獲得探索點數 (EP): +${epReward}</p>
                <p style="color:#888; font-size:0.9em; margin-top:5px;">(目前總 EP: ${Player.explorationPoints})</p>
            </div>
        `;

        window.UISystem.showConfirmModal("冒險結束", msg, () => {
            window.Game.enterHub();
        });

        // 隱藏取消按鈕，強制確認
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        if (cancelBtn) cancelBtn.style.display = 'none';
    },

    // ========== UI系統委託（實際實現在ui.js） ==========

    triggerAnim(id, animClass) { UISystem.triggerAnim(id, animClass); },
    showFloatingText(text, color) { UISystem.showFloatingText(text, color); },
    renderEvent(title, subtitle, content, icon) { UISystem.renderEvent(title, subtitle, content, icon); },
    setButtons(mainText, mainAction, subText, subAction, disableSub) { UISystem.setButtons(mainText, mainAction, subText, subAction, disableSub); },
    updateUI() { UISystem.updateUI(); },
    updateStatsUI() { UISystem.updateStatsUI(); },
    renderInvList(id, items, category) { UISystem.renderInvList(id, items, category); },
    renderBlacksmithUI() { UISystem.renderBlacksmithUI(); },
    renderMerchantShop(resetScroll = true) { UISystem.renderMerchantShop(resetScroll); },
    unequip(type) { ItemSystem.unequip(type); }
};

// ========== 綁定到全域 ==========

if (typeof window !== 'undefined') {
    window.Player = Player;
    window.GameState = GameState;
    window.Game = Game;
}

// ========== 初始化遊戲 ==========

window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

// ========== 鍵盤快捷鍵 ==========

document.addEventListener('keydown', function (event) {
    // F鍵：主按鈕
    if (event.key === 'f' || event.key === 'F' || event.keyCode === 70) {
        const mainButton = document.getElementById('btn-main');
        if (mainButton && !mainButton.disabled && mainButton.style.display !== 'none') {
            mainButton.click();
            mainButton.style.transform = 'scale(0.95)';
            setTimeout(() => { mainButton.style.transform = 'scale(1)'; }, 100);
        }
    }
    // S鍵：副按鈕
    if (event.key === 's' || event.key === 'S' || event.keyCode === 83) {
        const subButton = document.getElementById('btn-sub');
        if (subButton && !subButton.disabled && subButton.style.display !== 'none') {
            subButton.click();
            subButton.style.transform = 'scale(0.95)';
            setTimeout(() => { subButton.style.transform = 'scale(1)'; }, 100);
        }
    }
});

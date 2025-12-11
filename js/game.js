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
    equipment: { weapon: null, armor: null, shield: null, accessories: [null, null, null] },
    // --- [新增: 戰鬥資源] ---
    sp: 0,
    maxSp: 3,
    weaponType: 'none', // sword, shield, spear, none
    inventory: {
        equipment: [],
        consumable: [
            // 初始自帶一瓶治療藥水
            { name: "治療藥水", type: "consumable", val: 30, rarity: "common", price: 25, icon: "🧪", desc: "恢復30點生命" }
        ],
        material: []
    },
    pendingWarehouse: {}, // 運送中的物品 { itemName: count }
    pendingWarehouse: {}, // 運送中的物品 { itemName: count }
    buff: null,
    achievements: new Set(),
    history: { items: new Set() },
    donatedItems: new Set(),
    warehouse: {}, // 倉庫數據 { itemName: count }
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
    lastMerchantDepth: 0, // 上次遇到商店的層數
    succubusStage: 0 // [New] 魅魔事件鏈階段 (0: 初遇, 1: 餵食A, 2: 餵食B, 3: 完成)
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
            console.log("Saving persistent data...", {
                donatedItems: Array.from(Player.donatedItems),
                warehouse: Player.warehouse
            });
            const persistentData = {
                achievements: Array.from(Player.achievements),
                history: {
                    items: Array.from(Player.history.items)
                },
                runSeenItems: Array.from(Player.runSeenItems || []), // [New] 保存本局已見物品
                donatedItems: Player.donatedItems || {}, // 新增: 博物館捐贈 (Object {name: count})
                warehouse: Player.warehouse, // 新增: 倉庫
                // 局外屬性
                explorationPoints: Player.explorationPoints,
                baseAtkBonus: Player.baseAtkBonus,
                baseHpBonus: Player.baseHpBonus,
                maxDepthUnlocked: Player.maxDepthUnlocked,
                startDepthUnlocked: Player.startDepthUnlocked,
                // [Fix] 保存局外背包狀態 (防止在 Hub 取出物品後刷新丟失)
                hubInventory: (GameState.phase === 'hub' || GameState.phase === 'blacksmith' || GameState.phase === 'merchant' || GameState.phase === 'rune_altar') ? Player.inventory : null,
                hubEquipment: (GameState.phase === 'hub' || GameState.phase === 'blacksmith' || GameState.phase === 'merchant' || GameState.phase === 'rune_altar') ? Player.equipment : null,
                // 賭場
                luckPoints: Player.luckPoints,
                casinoStats: Player.casinoStats,
                // 訓練場與設施
                trainingFacilityLevel: Player.trainingFacilityLevel,
                trainingLevels: Player.trainingLevels,
                // 符文與煉金
                unlockedRunes: Player.unlockedRunes,
                shardsCollected: Player.shardsCollected
            };
            localStorage.setItem('fantasy_adventure_persistent', JSON.stringify(persistentData));
            console.log("Persistent data saved successfully.");
        } catch (e) {
            console.error("Persistent data save failed", e);
        }
    },

    /**
     * 載入永久數據（成就、圖鑑、局外屬性）
     */
    loadPersistentData() {
        try {
            console.log("Loading persistent data...");
            const raw = localStorage.getItem('fantasy_adventure_persistent');
            if (raw) {
                const data = JSON.parse(raw);
                console.log("Raw persistent data loaded:", data);

                Player.achievements = new Set(data.achievements || []);
                Player.history.items = new Set(data.history?.items || []);
                // [Migration] 博物館捐贈資料結構遷移 (Set -> Object)
                let loadedDonations = data.donatedItems || {};
                if (Array.isArray(loadedDonations)) {
                    // 舊版存檔是陣列，轉換為物件 (假設每個已捐贈數量為 1)
                    const map = {};
                    loadedDonations.forEach(name => map[name] = 1);
                    loadedDonations = map;
                }
                Player.donatedItems = loadedDonations;

                Player.warehouse = data.warehouse || {}; // 新增: 倉庫

                console.log("Restored Player data:", {
                    donatedItems: Player.donatedItems,
                    warehouse: Player.warehouse
                });

                // 載入局外屬性
                if (data.explorationPoints !== undefined) Player.explorationPoints = data.explorationPoints;
                if (data.baseAtkBonus !== undefined) Player.baseAtkBonus = data.baseAtkBonus;
                if (data.baseHpBonus !== undefined) Player.baseHpBonus = data.baseHpBonus;
                if (data.maxDepthUnlocked !== undefined) Player.maxDepthUnlocked = data.maxDepthUnlocked;
                if (data.maxDepthUnlocked !== undefined) Player.maxDepthUnlocked = data.maxDepthUnlocked;
                if (data.startDepthUnlocked !== undefined) Player.startDepthUnlocked = data.startDepthUnlocked;

                // [Fix] 如果在 Hub，嘗試撤銷上次的背包狀態 (防止取出後刷新丟失)
                // 只有當沒有 run-save (loadGame 未執行) 時才需要這樣做？
                // 或者，如果不影響正常探險，總是恢復？
                // 簡單起見，如果處於 Hub 狀態且沒有 run-save，則恢復。
                // 但 loadPersistentData 是在 loadGame 之前調用的。
                if (data.hubInventory) {
                    // 暫存，等待 enterHub 決定是否使用? 
                    // 或者直接覆蓋 (如果之後 loadGame 成功，會再次覆蓋，所以沒問題)
                    // 這樣保證了: 刷新 -> loadPersistent(有HubInv) -> Player.inv = HubInv -> loadGame(無save) -> Player保持HubInv
                    //             刷新 -> loadPersistent(有HubInv) -> Player.inv = HubInv -> loadGame(有save) -> Player.inv = RunInv
                    Player.inventory = data.hubInventory;
                }
                if (data.hubEquipment) {
                    Player.equipment = data.hubEquipment;
                }

                // 載入賭場數據
                if (data.luckPoints !== undefined) Player.luckPoints = data.luckPoints;
                if (data.casinoStats !== undefined) Player.casinoStats = data.casinoStats;

                // 載入訓練場與設施
                if (data.trainingFacilityLevel !== undefined) Player.trainingFacilityLevel = data.trainingFacilityLevel;
                if (data.trainingLevels !== undefined) Player.trainingLevels = data.trainingLevels;

                // 載入符文與煉金
                if (data.unlockedRunes !== undefined) Player.unlockedRunes = data.unlockedRunes;
                if (data.shardsCollected !== undefined) Player.shardsCollected = data.shardsCollected;
            } else {
                console.log("No persistent data found in localStorage.");
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
                player: {
                    ...Player,
                    achievements: Array.from(Player.achievements),
                    history: {
                        items: Array.from(Player.history.items)
                    },
                    donatedItems: Array.from(Player.donatedItems),
                    warehouse: Player.warehouse
                },
                gameState: {
                    phase: GameState.phase,
                    merchantStock: GameState.merchantStock,
                    blacksmithAttempts: GameState.blacksmithAttempts,
                    log: GameState.log,
                    isChallengeMode: GameState.isChallengeMode,
                    inventorySortPreference: GameState.inventorySortPreference
                },
                timestamp: Date.now()
            };

            localStorage.setItem('fantasy_adventure_save', JSON.stringify(saveData));

            // 同時保存永久數據
            this.savePersistentData();
            console.log("Game saved.");
        } catch (e) {
            console.error("Save failed", e);
        }
    },

    /**
     * 載入遊戲
     * @param {boolean} isHubStart - 是否從 Hub 開始 (不直接進入遊戲畫面)
     */
    loadGame(isHubStart = false) {
        const raw = localStorage.getItem('fantasy_adventure_save');
        if (!raw) {
            console.log("No save file found.");
            return;
        }

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
            Player.achievements = new Set(data.player.achievements || []);
            Player.history = data.player.history || { items: [] };
            Player.history.items = new Set(Player.history.items || []);
            Player.runSeenItems = new Set(data.player.runSeenItems || []); // [New] 恢復本局已見物品
            Player.donatedItems = new Set(data.player.donatedItems || []);
            Player.warehouse = data.player.warehouse || {};

            if (!Player.equipment.accessories) {
                Player.equipment.accessories = [null, null, null];
            }
            // 確保 succubusStage 存在 (舊存檔兼容)
            if (Player.succubusStage === undefined) {
                Player.succubusStage = 0;
            }

            Object.assign(GameState, data.gameState);

            // 初始化詞綴加成
            this.calculateModifiers();

            if (isHubStart) {
                this.savedPhase = GameState.phase;
                this.enterHub();
            } else {
                this.updateUI();
                this.log("讀取進度成功！");

                document.getElementById('hub-screen').classList.add('hidden');
                document.getElementById('game-container').classList.remove('hidden');
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

                    const fleeRate = window.CombatSystem.getFleeRate();
                    const fleeText = `逃跑 (${Math.round(fleeRate * 100)}%)`;
                    window.UISystem.setCombatButtons("戰鬥", "combatRound", fleeText, "flee", "playerDefend");
                } else if (GameState.phase === 'merchant') {
                    this.triggerAnim('event-icon', 'anim-spawn');
                    this.renderEvent("💰 神秘商人", "歡迎回來，要繼續交易嗎？", "點擊商品可查看詳情與購買", "👳");
                    this.setButtons("離開", "nextEvent", "無", null, true);
                    this.renderMerchantShop();
                } else if (GameState.phase === 'blacksmith') {
                    UISystem.renderBlacksmithUI();
                } else if (GameState.phase === 'select_class') {
                    this.selectClass(Player.class);
                } else {
                    // 預設恢復
                    this.updateUI();
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
            Player.runSeenItems = new Set(); // [New] 新一局開始，重置本局已見物品
            const modal = document.getElementById('class-modal');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.add('hidden'); // 強制隱藏
            }

            // 確保遊戲容器顯示
            const hubScreen = document.getElementById('hub-screen');
            const gameContainer = document.getElementById('game-container');

            hubScreen.classList.add('hidden');
            hubScreen.style.display = '';

            gameContainer.classList.remove('hidden');
            gameContainer.style.display = '';

            // 根據起始層數決定裝備發放邏輯
            if (Player.startDepth > 1) {
                // 高層起步：發放強力裝備與補給
                this.grantStartingSupplies(Player.startDepth);
            } else {
                // 正常起步 (Lv 1)：發放職業初始裝備
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
                }
            }

            // 職業特殊能力
            if (classType === 'cultist') {
                const demonBuffs = Object.values(CONFIG.buffs).filter(b => b.type === 'demon');
                Player.buff = demonBuffs[Math.floor(Math.random() * demonBuffs.length)];
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

        // [New] 煉獄模式邏輯
        if (Player.inInferno) {
            Player.depth++;
            this.log(`>>> 進入煉獄第 ${Player.depth} 層... [🔥 煉獄]`);

            // 煉獄沒有岔路和撤離點，只有無盡的戰鬥
            EventSystem.processInfernoEvent();
            return;
        }

        Player.depth++;
        this.checkAchievements();

        // 獲取當前區域資訊
        const biome = this.getCurrentBiome();
        const biomeText = biome ? ` [${biome.name}]` : '';
        this.log(`>>> 進入第 ${Player.depth} 層探索...${biomeText}`);

        // 每 50 層觸發撤離點 (優先於岔路)
        if (Player.depth % 50 === 0) {
            this.triggerExtraction();
            this.saveGame();
            return;
        }

        // 每 10 層觸發岔路選擇 (從第 10 層開始)
        if (Player.depth % 10 === 0) {
            this.showBranchSelection();
            this.saveGame();
            return;
        }

        // 天使歌頌buff效果
        if (Player.buff && Player.buff.id === 'angel_song') {
            if (Player.hp < Player.maxHp) {
                Player.hp = Math.min(Player.maxHp, Player.hp + 5);
                this.showFloatingText("+5 HP", "#69f0ae");
            }
        }

        // 飾品效果 (Slime: HP回復)
        let healAmount = 0;
        (Player.equipment.accessories || []).forEach(acc => {
            if (!acc) return;
            if (acc.id === 'acc_slime_2') healAmount += 2;
            if (acc.id === 'acc_slime_3') healAmount += 10;
        });

        if (healAmount > 0 && Player.hp < Player.maxHp) {
            Player.hp = Math.min(Player.maxHp, Player.hp + healAmount);
            this.showFloatingText(`+${healAmount} HP`, "#69f0ae");
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
            this.saveGame();
            return;
        }

        let eventType = 'combat';
        let maxAttempts = 5; // 最多重試5次，避免死循環

        for (let i = 0; i < maxAttempts; i++) {
            const rand = Math.random();

            // 新機率分佈 (非戰鬥總計約 30%)
            // 0.00 - 0.06: Statue (6%)
            // 0.06 - 0.09: Temple (3%) [需 Depth > 100]
            // 0.09 - 0.12: Class (3%)
            // 0.12 - 0.15: Blacksmith (3%)
            // 0.15 - 0.25: Merchant (10%)
            // 0.25 - 0.30: Chest (5%)
            // Else: Combat

            if (rand < 0.06) {
                eventType = 'statue';
            } else if (rand < 0.09) {
                if (Player.depth > 100) eventType = 'temple';
                else eventType = 'combat';
            } else if (rand < 0.12) {
                eventType = 'class';
            } else if (rand < 0.15) {
                eventType = 'blacksmith';
            } else if (rand < 0.25) {
                eventType = 'merchant';
            } else if (rand < 0.30) {
                eventType = 'chest';
            } else if (rand < 0.32) {
                // [New] 魅魔事件 (2%)
                eventType = 'succubus';
            } else {
                eventType = 'combat';
            }

            // 檢查是否連續 (戰鬥除外)
            if (eventType === 'combat') break; // 戰鬥可以連續
            if (eventType !== this.lastEvent) break; // 非連續事件，接受

            // 如果連續，繼續迴圈重抽
        }

        this.lastEvent = eventType;

        switch (eventType) {
            case 'statue':
                EventSystem.triggerStatue();
                break;
            case 'temple':
                EventSystem.triggerTemple();
                break;
            case 'class':
                EventSystem.triggerClassEvent();
                break;
            case 'blacksmith':
                this.triggerBlacksmith();
                break;
            case 'merchant':
                this.triggerMerchant();
                Player.lastMerchantDepth = Player.depth;
                break;
            case 'chest':
                EventSystem.triggerChest();
                break;
            case 'succubus':
                EventSystem.triggerSuccubusEvent();
                break;
            case 'combat':
            default:
                CombatSystem.triggerCombat(false, false);
                break;
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
        this.renderEvent("🔨 發現工匠", "一位老練的工匠正在路邊休息...", `工匠可以幫你強化裝備！<br>需要消耗金幣(裝備價格的一半)和<span style="color:#69f0ae">同部位、同稀有度</span>裝備作為素材。<br><span style='color:#888'>每次事件最多強化2次，最高+8</span><br><span style='color:#ff9800'>你的裝備已自動卸下</span><br><br><span style='color:#4caf50'>📊 本次強化進度: 0/2 次</span>`, "⚒️");
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

        // 尋找所有可用的素材 (同部位 & 同稀有度，非自己)
        const materials = [];
        Player.inventory.equipment.forEach((i, index) => {
            if (index === idx) return; // 不能是自己
            // 放寬限制：只要部位和稀有度相同即可
            if (i.type === item.type && i.rarity === item.rarity) {
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
        // 優化：改為純百分比成長 (每級 +20%)
        const currentVal = Math.floor(baseVal * (1 + enhance * 0.2));
        const nextVal = Math.floor(baseVal * (1 + (enhance + 1) * 0.2));
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
            // 重新計算屬性 (使用原始數值進行線性成長)
            // 查找原始物品資料
            let originalItem = window.CONFIG.itemPool.find(i => i.name === baseName);
            if (!originalItem) originalItem = window.CONFIG.lootData[baseName];
            if (!originalItem && window.CONFIG.infernoItems) originalItem = window.CONFIG.infernoItems.find(i => i.id === targetItem.id);
            if (!originalItem && window.CONFIG.forgeItems) originalItem = window.CONFIG.forgeItems.find(i => i.id === baseName || i.name === baseName); // forgeItems use ID sometimes? No, name usually.
            // fallback if not found (shouldn't happen for valid items)
            if (!originalItem) originalItem = { val: targetItem.val, def: targetItem.def };

            const isShield = targetItem.type === 'shield';
            const baseVal = isShield ? (originalItem.def || 0) : (originalItem.val || 0);

            // 修正公式：原始數值 + (原始數值 * 等級 * 20%) + (盾牌額外等級加值)
            const newBonus = isShield ? targetItem.enhance : 0;
            const newVal = Math.floor(baseVal + (baseVal * targetItem.enhance * 0.2) + newBonus);

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
        GameState.merchantRefreshed = false; // 重置刷新標記
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
     * 刷新商店物品（符文功能）
     */
    refreshMerchantStock() {
        // 檢查玩家是否擁有商販之友符文
        if (!Player.unlockedRunes || !Player.unlockedRunes.includes('merchant_refresh')) {
            window.UISystem.showToast("你尚未解鎖「商販之友」符文！", "warning");
            return;
        }

        // 檢查是否已經刷新過（每次訪問商店只能刷新一次）
        if (GameState.merchantRefreshed) {
            window.UISystem.showToast("本次訪問已經刷新過商店了！", "warning");
            return;
        }

        // 重新生成商店物品
        this.generateMerchantStock();
        GameState.merchantRefreshed = true;

        this.log("🔄 使用「商販之友」刷新了商店物品！");
        window.UISystem.showToast("商店已刷新！", "success");

        // 重新渲染商店UI
        this.renderMerchantShop();
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
            // --- [修改: 加入購買確認] ---
            const desc = window.ItemSystem.getItemDesc(item);
            const rarityColor = CONFIG.rarityDisplay[item.rarity].color;

            const html = `
                <div style="text-align:center;">
                    <div class="item ${rarityColor}" style="margin: 0 auto 15px auto; display:inline-block;">
                        ${item.icon || '📦'} ${item.name}
                    </div>
                    <div style="background:#222; padding:10px; border-radius:5px; margin-bottom:15px; font-size:0.9em; color:#ddd;">
                        ${desc}
                    </div>
                    <p>確定要花費 <span class="gold-text">${finalPrice} G</span> 購買嗎？</p>
                    ${finalPrice < item.price ? '<p style="font-size:0.8em; color:#69f0ae">(天使的恩賜 -30%)</p>' : ''}
                </div>
            `;

            if (window.UISystem && typeof window.UISystem.showConfirmModal === 'function') {
                window.UISystem.showConfirmModal(
                    "購買確認",
                    html,
                    () => {
                        // 實際購買邏輯
                        Player.gold -= finalPrice;
                        ItemSystem.addItemToInventory(item);
                        GameState.merchantStock[idx] = null;

                        this.showFloatingText("- " + finalPrice + " G", "yellow");
                        this.log(`購買了 ${item.name}`);

                        // 音效
                        if (window.AudioSystem) window.AudioSystem.playSFX('coin');

                        this.updateUI();
                        this.renderMerchantShop(false);
                    }
                );
            } else {
                console.error("UISystem.showConfirmModal not found!");
                // Fallback purchase if UI is broken
                Player.gold -= finalPrice;
                ItemSystem.addItemToInventory(item);
                GameState.merchantStock[idx] = null;
                this.updateUI();
                this.renderMerchantShop(false);
            }
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

        // [Fix] 重置煉獄模式狀態與視覺效果
        window.Player.inInferno = false;
        document.body.classList.remove('inferno-mode');

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
                    <button onclick="window.Game.showAlchemy()" class="btn" style="background:#673ab7; padding: 20px; font-size: 1.2em;">
                        ⚗️ 煉金術<br><span style="font-size:0.8em">合成藥水與轉化</span>
                    </button>
                    <button onclick="window.Game.renderLibrary()" class="btn" style="background:#00bcd4; padding: 20px; font-size: 1.2em;">
                        📚 圖書館<br><span style="font-size:0.8em">博物館與收藏</span>
                    </button>
                    <button onclick="window.Game.renderWorkbench()" class="btn" style="background:#795548; padding: 20px; font-size: 1.2em;">
                        🛠️ 工作檯<br><span style="font-size:0.8em">製作飾品與裝備</span>
                    </button>
                    <button onclick="window.Game.renderWarehouse()" class="btn" style="background:#ff9800; padding: 20px; font-size: 1.2em;">
                        📦 倉庫<br><span style="font-size:0.8em">管理你的物資</span>
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
        document.getElementById('hub-content').innerHTML = hubHtml;
    },

    /**
     * 放棄探險
     */
    giveUpAdventure() {
        // [New] 特殊物品保留邏輯 (真實之冠 & 煉獄聖經)
        this.saveSpecialItemsToWarehouse();

        // 結算 EP (給予 50%)
        const epGain = Math.floor(Player.depth * 5); // 稍微給一點
        Player.explorationPoints += epGain;

        Game.log(`放棄了探險，獲得 ${epGain} EP`);

        this.resetGame();
    },

    /**
     * 玩家死亡處理
     */
    playerDie(cause) {
        if (GameState.phase === 'dead') return;
        GameState.phase = 'dead';

        AudioSystem.playSFX('dead');

        // [New] 特殊物品保留邏輯 (真實之冠 & 煉獄聖經)
        this.saveSpecialItemsToWarehouse();

        let html = `
            <div style="text-align:center;">
                <h1 style="color:red; font-size:3em; margin-bottom:20px;">💀 你死掉了 💀</h1>
                <p style="font-size:1.5em; margin-bottom:30px;">死因: ${cause}</p>
        `;

        window.UISystem.showConfirmModal("死亡", html, () => {
            // 結算 EP
            const epGain = Math.floor(Player.depth * 10);
            Player.explorationPoints += epGain;

            // 強制切換回大廳顯示
            this.resetGame();
            // this.enterHub(); // resetGame 裡面會叫 enterHub
            window.UISystem.showToast(`冒險結束，獲得 ${epGain} EP`, "success");
        }, false, true, "回到大廳");
    },

    /**
     * [New] 保存特殊物品到倉庫 (死亡/放棄時)
     */
    /**
     * [New] 保存特殊物品到倉庫 (死亡/放棄時)
     */
    saveSpecialItemsToWarehouse() {
        // [Refactor] 改為動態檢查 keepOnDeath 屬性
        // 定義 helper 檢查函數
        const shouldKeep = (item) => {
            if (!item) return false;
            // [Fix] 強制保留真實之冠與煉獄聖經 (Name Check)
            if (item.name === "真實之冠" || item.name === "煉獄聖經") return true;

            // 優先檢查物品本身的屬性 (如果有的話)
            if (item.keepOnDeath) return true;
            // 檢查 CONFIG 中的定義 (透過 ID 或 Name 反查)
            // 1. 查找 specialItems
            if (CONFIG.specialItems) {
                const sp = Object.values(CONFIG.specialItems).find(s => s.name === item.name || s.id === item.id);
                if (sp && sp.keepOnDeath) return true;
            }
            // 2. 查找其他可能 (目前主要在 specialItems)
            return false;
        };

        let savedCount = 0;

        // 1. 檢查背包
        const invCategories = ['accessory', 'material', 'consumable', 'equipment'];
        invCategories.forEach(cat => {
            if (Player.inventory[cat]) {
                for (let i = Player.inventory[cat].length - 1; i >= 0; i--) {
                    const item = Player.inventory[cat][i];
                    if (shouldKeep(item)) {
                        window.ItemSystem.addItemToWarehouse(item.name, 1);
                        Player.inventory[cat].splice(i, 1);
                        savedCount++;
                    }
                }
            }
        });

        // 2. 檢查身上裝備 (飾品)
        if (Player.equipment.accessories) {
            for (let i = 0; i < Player.equipment.accessories.length; i++) {
                const acc = Player.equipment.accessories[i];
                if (shouldKeep(acc)) {
                    window.ItemSystem.addItemToWarehouse(acc.name, 1);
                    Player.equipment.accessories[i] = null;
                    savedCount++;
                }
            }
        }

        // 3. 檢查其他裝備
        ['weapon', 'armor', 'shield'].forEach(slot => {
            const equip = Player.equipment[slot];
            if (shouldKeep(equip)) {
                window.ItemSystem.addItemToWarehouse(equip.name, 1);
                Player.equipment[slot] = null;
                savedCount++;
            }
        });

        if (savedCount > 0) {
            console.log(`[System] 自動回收了 ${savedCount} 個特殊物品至倉庫。`);
            this.savePersistentData();
        }
    },

    /**
     * [Debug] 獲取七宗罪所有素材
     */
    cheatGetSins() {
        const sinItems = [
            "傲慢之眼", "嫉妒魔盒", "暴怒指虎", "眠戒", "金色聖像", "暴食之牙", "魅魔香水"
        ];

        sinItems.forEach(name => {
            window.ItemSystem.addItemToWarehouse(name, 1);
        });

        // 為了方便，也給一個真實之心 (合成煉獄聖經可能需要)
        window.ItemSystem.addItemToWarehouse("真實之心", 1);

        console.log("已獲得七宗罪所有素材 (及真實之心)！請查看倉庫。");
        window.UISystem.showToast("🔥 已獲得七宗罪素材！", "success");
    },

    /**
     * 重置遊戲 (單局結算)
     */
    resetGame() {
        localStorage.removeItem('fantasy_adventure_save');
        // [Fix] 重置記憶體中的玩家狀態，防止"撤退後繼續"的漏洞
        this.resetPlayerState();
        this.enterHub();
    },

    /**
     * [New] 重置玩家狀態至初始值
     */
    resetPlayerState() {
        Player.hp = 100;
        Player.maxHp = 100;
        Player.gold = 0;
        Player.depth = 1;
        // 保留 class (雖然 selectClass 會重設)
        Player.equipment = { weapon: null, armor: null, shield: null, accessories: [null, null, null] };
        // [Fix] 修正背包結構以匹配 ItemSystem (equipment, accessory, material, consumable)
        // 之前錯誤使用了 weapon, armor, shield 分開的陣列，導致 withdrawFromWarehouse 找不到 equipment 陣列而報錯
        Player.inventory = { equipment: [], accessory: [], material: [], consumable: [] };
        Player.buff = null;
        Player.modifiers = {};
        // 不重置 warehouse, achievements, etc. (這些是 persistent)
        console.log("Player state reset to initial.");
    },

    renderTrainingGrounds() {
        GameState.phase = 'training';

        // 初始化等級數據
        if (!Player.trainingLevels) {
            Player.trainingLevels = {
                atk: Player.baseAtkBonus || 0,
                hp: Math.floor((Player.baseHpBonus || 0) / 10)
            };
        }
        // 初始化設施等級
        if (typeof Player.trainingFacilityLevel === 'undefined') {
            Player.trainingFacilityLevel = 0;
        }

        const config = CONFIG.hub.training;
        const currentFacilityLevel = Player.trainingFacilityLevel;
        const maxStatLevel = (currentFacilityLevel + 1) * 10; // 0級->10, 1級->20...

        // --- 頂部設施升級區域 ---
        let facilityHtml = '';
        const nextFacilityConfig = config.facilityUpgrades.find(u => u.targetLevel === currentFacilityLevel + 1);

        if (nextFacilityConfig) {
            const mat = nextFacilityConfig.cost;
            const owned = window.ItemSystem.getItemCount(mat.material, true);
            const enough = owned >= mat.count;

            facilityHtml = `
                <div style="background: #222; border: 1px solid #4caf50; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: left;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
                        <div style="font-size: 1.2em; color: #4caf50; font-weight: bold;">
                            🏗️ 訓練場設施 Lv.${currentFacilityLevel}
                        </div>
                        <div style="font-size: 0.9em; color: #aaa;">
                            當前技能上限: Lv.${maxStatLevel}
                        </div>
                    </div>
                    
                    <div style="display:flex; align-items:center; gap: 15px;">
                        <div style="flex: 1;">
                            <div style="font-size: 0.9em; color: #ddd; margin-bottom: 5px;">${nextFacilityConfig.desc}</div>
                            <div style="font-size: 0.8em; color: #888;">
                                需求: ${mat.material} <span style="color: ${enough ? '#4caf50' : '#f44336'}">(${owned}/${mat.count})</span>
                            </div>
                        </div>
                        <button onclick="window.Game.upgradeTrainingFacility()" class="btn" 
                            style="background: ${enough ? '#4caf50' : '#555'}; padding: 8px 20px;" ${!enough ? 'disabled' : ''}>
                            升級設施
                        </button>
                    </div>
                </div>
            `;
        } else {
            // 已達最高級
            facilityHtml = `
                <div style="background: #222; border: 1px solid #ffd700; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <div style="color: #ffd700; font-weight: bold;">🏆 訓練場設施已達最高等級 (Lv.${currentFacilityLevel})</div>
                    <div style="font-size: 0.9em; color: #aaa;">技能等級上限: Lv.${maxStatLevel}</div>
                </div>
            `;
        }

        // 輔助函數：生成卡片 HTML
        const createCard = (type, icon, title, currentVal, level) => {
            // 方案 C: 線性增長公式 base + (level * increment)
            const nextCost = config.baseCost + (level * (config.costIncrement || 5));
            const isCapped = level >= maxStatLevel;
            const canAfford = Player.explorationPoints >= nextCost;

            // 進度條 HTML (顯示當前 10 級區間的進度)
            const progress = level % 10;
            // 如果剛好是 10, 20... 且未達上限，顯示 0/10 (下一階的開始)
            // 但如果是上限，顯示 10/10

            let displayProgress = progress;
            if (level > 0 && level % 10 === 0 && !isCapped) displayProgress = 0;
            if (isCapped && level % 10 === 0) displayProgress = 10;

            let progressHtml = '<div style="display:flex; gap:5px; margin-bottom:10px; justify-content:center;">';
            for (let i = 1; i <= 10; i++) {
                let active = i <= displayProgress;
                progressHtml += `<div style="
                    width: 20px; height: 20px; 
                    background: ${active ? '#4caf50' : '#333'}; 
                    border: 1px solid #555; 
                    border-radius: 3px;
                    color: ${active ? '#fff' : '#888'};
                    font-size: 0.8em;
                    line-height: 20px;
                ">${i}</div>`;
            }
            progressHtml += '</div>';

            let buttonHtml = '';
            if (isCapped) {
                buttonHtml = `
                    <button class="btn" disabled style="width:100%; background: #555; cursor: not-allowed;">
                        需升級訓練場
                    </button>
                `;
            } else {
                buttonHtml = `
                    <div style="font-size:0.9em; color:#aaa; margin-bottom:5px;">下一級消耗: ${nextCost} EP</div>
                    <button onclick="window.Game.upgradeBaseStats('${type}')" class="training-btn ${type}-btn" 
                        style="width:100%; background: ${canAfford ? (type === 'atk' ? '#f44336' : '#4caf50') : '#555'};"
                        ${!canAfford ? 'disabled' : ''}>
                        升級
                    </button>
                `;
            }

            return `
                <div class="training-card ${type}" style="display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                            <span class="training-icon">${icon}</span>
                            <div style="text-align:left;">
                                <div class="training-title">${title} <span style="font-size:0.8em; color:#aaa;">Lv.${level}</span></div>
                                <div class="training-value">加成: +${currentVal}</div>
                            </div>
                        </div>
                        ${progressHtml}
                    </div>
                    <div style="margin-top: 10px;">
                        ${buttonHtml}
                    </div>
                </div>
            `;
        };

        const html = `
            <div style="text-align:center; padding:0 20px 20px 20px;">
                <!-- 標題已移至模態框 Header -->
                
                ${facilityHtml}

                <!-- EP 顯示卡片 -->
                <div class="ep-card">
                    <div class="ep-title">剩餘 EP (進化點數)</div>
                    <div class="ep-value">${Player.explorationPoints}</div>
                </div>
                
                <div class="training-cards-container">
                    ${createCard('atk', '⚔️', '基礎攻擊力', Player.baseAtkBonus, Player.trainingLevels.atk)}
                    ${createCard('hp', '❤️', '基礎生命值', Player.baseHpBonus, Player.trainingLevels.hp)}
                </div>
                
                <!-- 底部按鈕移除，使用模態框關閉按鈕 -->
            </div>
        `;

        // 顯示模態框
        const modal = document.getElementById('training-modal');
        const content = document.getElementById('training-content');
        if (modal && content) {
            content.innerHTML = html;
            modal.style.display = 'flex';
        } else {
            console.error("Training modal elements not found!");
        }
    },

    /**
     * 升級訓練場設施
     */
    upgradeTrainingFacility() {
        const currentLevel = Player.trainingFacilityLevel || 0;
        const config = CONFIG.hub.training.facilityUpgrades.find(u => u.targetLevel === currentLevel + 1);

        if (!config) return;

        const mat = config.cost;
        const owned = window.ItemSystem.getItemCount(mat.material, true);

        if (owned >= mat.count) {
            window.ItemSystem.removeItems(mat.material, mat.count, true);
            Player.trainingFacilityLevel = currentLevel + 1;

            this.savePersistentData();
            window.UISystem.showToast(`訓練場升級成功！(Lv.${Player.trainingFacilityLevel})`, 'success');
            AudioSystem.playSFX('powerup'); // 假設有這個音效
            this.renderTrainingGrounds();
        } else {
            window.UISystem.showToast(`素材不足：${mat.material}`, "error");
        }
    },

    /**
     * 升級基礎屬性 (新版：設施等級限制)
     */
    upgradeBaseStats(type) {
        // 確保數據存在
        if (!Player.trainingLevels) {
            Player.trainingLevels = {
                atk: Player.baseAtkBonus || 0,
                hp: Math.floor((Player.baseHpBonus || 0) / 10)
            };
        }
        if (typeof Player.trainingFacilityLevel === 'undefined') {
            Player.trainingFacilityLevel = 0;
        }

        const level = Player.trainingLevels[type];
        const config = CONFIG.hub.training;
        const maxStatLevel = (Player.trainingFacilityLevel + 1) * 10;

        // 檢查上限
        if (level >= maxStatLevel) {
            window.UISystem.showToast(`已達當前設施等級上限 (Lv.${maxStatLevel})，請先升級訓練場！`, "error");
            return;
        }

        // 方案 C: 線性增長公式
        const cost = config.baseCost + (level * (config.costIncrement || 5));

        if (Player.explorationPoints >= cost) {
            Player.explorationPoints -= cost;

            // 提升等級
            Player.trainingLevels[type]++;

            // 增加屬性
            if (type === 'atk') Player.baseAtkBonus += 1;
            else Player.baseHpBonus += 10;

            this.savePersistentData();
            window.UISystem.showToast(`${type === 'atk' ? '攻擊' : '生命'}等級提升！(Lv.${Player.trainingLevels[type]})`, 'success');
            this.renderTrainingGrounds();
            window.UISystem.updateStatsUI();
        } else {
            window.UISystem.showToast("EP 不足！", "error");
        }
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
                <!-- 標題已移至模態框 Header -->
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

            // 檢查 EP
            const hasEP = Player.explorationPoints >= rune.cost;

            // 檢查素材
            let hasMaterials = true;
            let materialsHtml = '';

            if (rune.materials) {
                materialsHtml += '<div style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap;">';
                rune.materials.forEach(mat => {
                    const owned = window.ItemSystem.getItemCount(mat.item, true); // 檢查倉庫
                    const enough = owned >= mat.count;
                    if (!enough) hasMaterials = false;

                    // 尋找物品定義以獲取圖示和稀有度顏色
                    let itemDef = CONFIG.itemPool.find(i => i.name === mat.item);
                    if (!itemDef && CONFIG.lootData[mat.item]) {
                        itemDef = { ...CONFIG.lootData[mat.item], name: mat.item };
                    }
                    if (!itemDef) itemDef = { icon: '📦', rarity: 'common' }; // 預設

                    const rarityColor = CONFIG.rarityDisplay[itemDef.rarity] ? CONFIG.rarityDisplay[itemDef.rarity].color : '#fff';

                    // 使用者要求：要五個史萊姆黏液 就放5個使史萊姆黏液的ICON在上面 一整排開
                    for (let i = 0; i < mat.count; i++) {
                        const isOwned = i < owned;
                        materialsHtml += `
                            <div style="
                                width: 40px; 
                                height: 40px; 
                                background: ${isOwned ? '#333' : '#111'}; 
                                border: 1px solid ${isOwned ? rarityColor : '#444'}; 
                                border-radius: 5px; 
                                display: flex; 
                                align-items: center; 
                                justify-content: center; 
                                font-size: 1.5em; 
                                opacity: ${isOwned ? 1 : 0.3};
                                position: relative;
                                title: '${mat.item}'
                            ">
                                ${itemDef.icon || '📦'}
                                ${isOwned ? '<div style="position:absolute; bottom:-5px; right:-5px; font-size:0.5em;">✅</div>' : ''}
                            </div>
                        `;
                    }
                });
                materialsHtml += '</div>';

                // 顯示進度文字 (輔助)
                materialsHtml += `<div style="text-align:right; font-size:0.8em; color:#888; margin-bottom:10px;">
                    ${rune.materials.map(m => `${m.item}: ${window.ItemSystem.getItemCount(m.item, true)}/${m.count}`).join(' | ')}
                </div>`;
            }

            const canAfford = hasEP && hasMaterials;

            // [UI Optimization] 已解鎖符文的特殊樣式
            if (unlocked) {
                html += `
                    <div style="background: linear-gradient(135deg, #4527a0 0%, #283593 100%); border: 2px solid #b388ff; border-radius: 12px; padding: 25px 20px; text-align: center; position: relative; box-shadow: 0 0 20px rgba(124, 77, 255, 0.4); transform: scale(1.02);">
                        <div style="font-size: 1.6em; color: #fff; margin-bottom: 25px; font-weight: bold; text-shadow: 0 0 10px #7c4dff;">
                            ✨ ${rune.name}
                        </div>
                        
                        <div style="font-size: 1.2em; color: #ede7f6; margin-bottom: 25px; line-height: 1.5; font-weight: 500;">
                            ${rune.desc}
                        </div>
                        
                        <div style="display: inline-block; padding: 5px 15px; background: rgba(0,0,0,0.3); border-radius: 20px; color: #b388ff; font-size: 0.9em; border: 1px solid #7c4dff;">
                            ✅ 已啟動效果
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div style="background: linear-gradient(135deg, #333 0%, #222 100%); border: 1px solid #555; border-radius: 10px; padding: 15px; text-align: left; position: relative;">
                        <div style="font-size: 1.2em; color: #fff; margin-bottom: 5px;">
                            ${rune.name}
                        </div>
                        <div style="font-size: 0.9em; color: #ccc; margin-bottom: 10px; height: 40px;">${rune.desc}</div>
                        
                        ${materialsHtml}
                        
                        <button onclick="window.Game.unlockRune('${rune.id}')" class="btn" style="width:100%; background: ${canAfford ? '#9c27b0' : '#555'};" ${!canAfford ? 'disabled' : ''}>
                            解鎖 (${rune.cost} EP)
                        </button>
                    </div>
                `;
            }
        }

        html += `
                </div>
                <!-- 底部按鈕移除 -->
            </div>
        `;

        const modal = document.getElementById('rune-modal');
        const content = document.getElementById('rune-content');
        if (modal && content) {
            content.innerHTML = html;
            modal.style.display = 'flex';
        }
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

        // 檢查 EP
        if (Player.explorationPoints < rune.cost) {
            window.UISystem.showToast("EP 不足！", "error");
            return;
        }

        // 檢查素材
        if (rune.materials) {
            for (let mat of rune.materials) {
                const owned = window.ItemSystem.getItemCount(mat.item, true); // 檢查倉庫
                if (owned < mat.count) {
                    window.UISystem.showToast(`素材不足：${mat.item}`, "error");
                    return;
                }
            }
        }

        // 扣除 EP
        Player.explorationPoints -= rune.cost;

        // 扣除素材
        if (rune.materials) {
            for (let mat of rune.materials) {
                window.ItemSystem.removeItems(mat.item, mat.count, true); // 從倉庫移除
            }
        }

        Player.unlockedRunes.push(runeId);
        this.savePersistentData();
        window.UISystem.showToast(`已解鎖符文：${rune.name}`, 'success');
        this.renderRuneAltar(); // 刷新介面
    },

    /**
     * 渲染傳說熔爐
     */
    /**
     * 渲染傳說熔爐
     */
    renderMythicForge() {
        GameState.phase = 'mythic_forge';

        // 確保數據已初始化
        if (!Player.shardsCollected) Player.shardsCollected = [];

        // 檢查素材狀態
        // 1. 煉獄聖經素材: 真實之心 x1
        // 注意: 這裡檢查的是背包還是歷史記錄？
        // 根據邏輯，煉獄聖經是合成品，需要消耗真實之心。真實之心是掉落物，會在 inventory 中。
        const hasTrueHeart = window.ItemSystem.getItemCount("真實之心") >= 1;
        const hasBible = window.ItemSystem.getItemCount("煉獄聖經") >= 1;

        // 2. 真實之冠素材: 7宗罪飾品
        // 七宗罪飾品 ID列表
        const sinIds = ['acc_pride', 'acc_envy', 'acc_wrath', 'acc_sloth', 'acc_greed', 'acc_gluttony', 'acc_lust'];
        // 檢查背包與裝備欄 (包含身上的飾品)
        // 輔助函式：檢查是否擁有某物品 (Inventory + Equipment)
        const checkOwned = (id) => {
            const inInv = window.ItemSystem.getItemCount(id) > 0; // getItemCount 通常只查 inventory? 需確認 items.js
            // 這裡我們簡單假設 getItemCount 只查 inv，所以要額外查裝備
            // item.id 屬性是否存在？
            const inEquip = Object.values(Player.equipment).some(item => item && item.id === id);
            const inAcc = (Player.equipment.accessories || []).some(item => item && item.id === id);
            return inInv || inEquip || inAcc;
        };

        const allSinsCollected = sinIds.every(id => window.ItemSystem.hasItem(id)); // 假設 hasItem 檢查全域
        const hasCrown = window.ItemSystem.getItemCount("真實之冠") >= 1;


        let html = `
            <div style="text-align:center; padding:20px; max-height: 80vh; overflow-y: auto;">
                <p style="color:#aaa; margin-bottom: 20px;">將傳說的素材融合，鍛造出禁忌的神器</p>

                <!-- ==================== 1. 煉獄聖經區域 ==================== -->
                <div style="background: rgba(255, 87, 34, 0.1); border: 1px solid #ff5722; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                    <h3 style="color: #ff5722; margin-bottom: 15px; font-size: 1.5em;">📕 煉獄聖經</h3>
                    <p style="color: #bbb; font-size: 0.9em; margin-bottom: 20px;">開啟前往煉獄世界的鑰匙</p>

                    <!-- 素材顯示 -->
                    <div style="display:flex; justify-content:center; gap:20px; margin-bottom: 20px;">
                        <div style="width: 100px; height: 120px; background: ${hasTrueHeart ? '#3e2723' : '#222'}; border: 1px solid ${hasTrueHeart ? '#ff5722' : '#444'}; border-radius: 8px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 5px;">
                            <div style="font-size: 2.5em; margin-bottom: 5px;">💖</div>
                            <div style="font-size: 0.9em; color: ${hasTrueHeart ? '#ffab91' : '#888'};">真實之心</div>
                            ${hasTrueHeart ? '<div style="color:#4caf50; font-size:0.8em;">(1/1)</div>' : '<div style="color:#f44336; font-size:0.8em;">(0/1)</div>'}
                        </div>
                    </div>

                    <!-- 按鈕 -->
                    ${hasBible ?
                `<div style="color: #4caf50; font-weight: bold; font-size: 1.2em;">✅ 已擁有煉獄聖經</div>` :
                `<button onclick="window.Game.synthesizeInfernoBible()" class="btn" style="background: ${hasTrueHeart ? 'linear-gradient(45deg, #d84315, #bf360c)' : '#555'}; width: 80%; padding: 12px;" ${!hasTrueHeart ? 'disabled' : ''}>
                            🔥 合成 煉獄聖經
                        </button>`
            }
                </div>

                <!-- ==================== 2. 真實之冠區域 ==================== -->
                <div style="background: rgba(156, 39, 176, 0.1); border: 1px solid #ab47bc; border-radius: 12px; padding: 20px;">
                    <h3 style="color: #ab47bc; margin-bottom: 15px; font-size: 1.5em;">👑 真實之冠</h3>
                    <p style="color: #bbb; font-size: 0.9em; margin-bottom: 20px;">集齊七宗罪，加冕為真正的魔王</p>

                    <!-- 素材顯示 -->
                    <div style="display:flex; justify-content:center; gap:10px; margin-bottom: 20px; flex-wrap: wrap;">
        `;

        // 顯示 7 宗罪
        sinIds.forEach(id => {
            const item = CONFIG.sinItems.find(i => i.id === id);
            if (!item) return;

            const owned = window.ItemSystem.hasItem(id); // 使用 hasItem
            html += `
                <div style="width: 80px; height: 100px; background: ${owned ? '#311b92' : '#222'}; border: 1px solid ${owned ? '#b388ff' : '#444'}; border-radius: 8px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 5px; opacity: ${owned ? 1 : 0.6};">
                    <div style="font-size: 1.5em; margin-bottom: 5px;">${item.icon}</div>
                    <div style="font-size: 0.7em; color: ${owned ? '#d1c4e9' : '#888'}; text-align:center;">${item.name}</div>
                    ${owned ? '<div style="color:#4caf50; font-size:0.6em;">✔</div>' : '<div style="color:#888; font-size:0.6em;">❌</div>'}
                </div>
            `;
        });
        html += `</div>`; // End sins container


        // 按鈕
        if (hasCrown) {
            html += `<div style="color: #ab47bc; font-weight: bold; font-size: 1.2em;">👑 已擁有真實之冠</div>`;
        } else {
            html += `
                <button onclick="window.Game.synthesizeCrownOfTruth()" class="btn" style="background: ${allSinsCollected ? 'linear-gradient(45deg, #7b1fa2, #4a148c)' : '#555'}; width: 80%; padding: 12px;" ${!allSinsCollected ? 'disabled' : ''}>
                    ✨ 合成 真實之冠
                </button>
             `;
        }

        html += `</div></div>`; // End Crown section & Main container

        const modal = document.getElementById('mythic-modal');
        const content = document.getElementById('mythic-content');
        if (modal && content) {
            content.innerHTML = html;
            modal.style.display = 'flex';
        }
    },

    /**
     * 合成煉獄聖經
     */
    /**
     * 合成煉獄聖經
     */
    synthesizeInfernoBible() {
        // 檢查素材
        if (window.ItemSystem.getItemCount("真實之心") < 1) {
            window.UISystem.showToast("缺少真實之心！", "error");
            return;
        }

        // 消耗素材
        window.ItemSystem.removeItems("真實之心", 1);

        // 給予物品 -> 放入倉庫
        window.ItemSystem.addItemToWarehouse("煉獄聖經", 1);

        window.UISystem.showModal("🔥 傳說熔爐", `
            <div class="inferno-reveal-container">
                <div class="inferno-rays"></div>
                <div class="inferno-particles"></div>
                
                <div class="legendary-icon-container">
                    <div class="inferno-halo"></div>
                    <div class="legendary-icon">📕</div>
                </div>
                
                <div class="inferno-title">煉 獄 聖 經</div>
                <div class="inferno-subtitle">禁忌篇章 • 開啟地獄</div>
                
                <div class="legendary-desc">
                    <p>通往煉獄世界的唯一鑰匙。</p>
                    <p style="margin-top:5px;">(已放入您的倉庫)</p>
                </div>
            </div>
        `);
        AudioSystem.playSFX('equip');

        this.renderMythicForge();
    },

    /**
     * 合成真實之冠
     */
    synthesizeCrownOfTruth() {
        const sinIds = ['acc_pride', 'acc_envy', 'acc_wrath', 'acc_sloth', 'acc_greed', 'acc_gluttony', 'acc_lust'];

        // 再次檢查 (使用 ID 檢查擁有狀態，因為 getItemCount 支援 ID 反查)
        if (!sinIds.every(id => window.ItemSystem.getItemCount(id) > 0)) {
            window.UISystem.showToast("七宗罪素材不足！", "error");
            return;
        }

        // 消耗所有七宗罪
        sinIds.forEach(id => {
            // 轉為名稱以確保倉庫移除正確 (雖然 removeItems 有反查，這層防護更穩)
            let name = id;
            const sinItem = CONFIG.sinItems.find(i => i.id === id);
            if (sinItem) name = sinItem.name;

            window.ItemSystem.removeItems(name, 1);
        });

        // 重新計算屬性 (如果玩家剛好裝備著素材，移除後需要刷新數值)
        window.Game.recalcStats();

        // 給予真實之冠 -> 放入倉庫
        window.ItemSystem.addItemToWarehouse("真實之冠", 1);

        window.UISystem.showModal("✨ 傳說誕生", `
            <div class="legendary-reveal-container">
                <div class="legendary-rays"></div>
                <div class="legendary-particles"></div>
                
                <div class="legendary-icon-container">
                    <div class="legendary-halo"></div>
                    <div class="legendary-icon">👑</div>
                </div>
                
                <div class="legendary-title">真 實 之 冠</div>
                <div class="legendary-subtitle">七罪歸一 • 魔王降臨</div>
                
                <div class="legendary-desc">
                    <p>你已獲得這世間最頂級的神器。</p>
                    <p style="margin-top:5px;">(已放入您的倉庫)</p>
                </div>
            </div>
        `);
        AudioSystem.playSFX('boss_spawn');

        // 延遲刷新介面，以免模態框顯示問題
        setTimeout(() => {
            this.renderMythicForge();
        }, 500);
    },


    /**
     * 渲染工作檯 (飾品製作)
     */
    renderWorkbench() {
        GameState.phase = 'workbench';

        let html = `
            <div style="text-align:center; padding:20px;">
                <!-- 標題已移至模態框 Header -->
                <p style="color:#aaa; margin-bottom: 5px;">消耗倉庫素材製作強力飾品</p>
                ${this.isPortableSession ?
                (() => {
                    const hasWorkbenchMaster = Player.unlockedRunes && Player.unlockedRunes.includes('workbench_master');
                    const discount = hasWorkbenchMaster ? 50 : 30;
                    const runeBonus = hasWorkbenchMaster ? ' <span style="color:#ffd700;">🔧 工匠大師</span>' : '';
                    return `<div style="color:#69f0ae; margin-bottom: 20px; font-weight:bold; border:1px solid #69f0ae; display:inline-block; padding:5px 15px; border-radius:15px; background:rgba(105, 240, 174, 0.1);">
                        🧰 行動工作台模式：素材消耗 -${discount}%${runeBonus} | 成品直接放入背包
                    </div>`;
                })()
                : '<div style="margin-bottom: 20px;"></div>'}
                
                <div class="ep-card" style="margin-bottom: 20px;">
                    <div class="ep-title">剩餘 EP</div>
                    <div class="ep-value">${Player.explorationPoints}</div>
                </div>

                <div style="display:flex; flex-direction:column; gap:20px; max-width: 800px; margin: 0 auto;">
        `;

        // 定義系列 (根據 ID 前綴)
        const groups = [
            { id: 'acc_slime', label: '史萊姆系列', color: '#4caf50' },
            { id: 'acc_gob', label: '哥布林系列', color: '#8bc34a' },
            { id: 'acc_wolf', label: '狂狼系列', color: '#795548' },
            { id: 'acc_skel', label: '骷髏系列', color: '#bdbdbd' },
            { id: 'acc_orc', label: '半獸人系列', color: '#ff9800' },
            { id: 'acc_ghost', label: '幽靈系列', color: '#90a4ae' },
            { id: 'acc_golem', label: '石巨人系列', color: '#795548' },
            { id: 'acc_troll', label: '食人妖系列', color: '#5d4037' },
            { id: 'acc_wyv', label: '雙足飛龍系列', color: '#ff5722' },
            { id: 'acc_demon', label: '魔王系列', color: '#673ab7' }
        ];

        // 整理配方到各系列
        const categorizedRecipes = {};
        groups.forEach(g => categorizedRecipes[g.id] = []);

        Object.keys(CONFIG.craftingRecipes).forEach(key => {
            const recipe = CONFIG.craftingRecipes[key];
            const groupId = groups.find(g => key.startsWith(g.id))?.id;
            if (groupId) {
                categorizedRecipes[groupId].push({ ...recipe, key });
            }
        });

        // 渲染每個系列
        groups.forEach(group => {
            const recipes = categorizedRecipes[group.id];
            if (!recipes || recipes.length === 0) return;

            let groupHtml = `
                <div style="border: 1px solid ${group.color}; border-radius: 10px; overflow: hidden; background: #222;">
                    <div style="background: rgba(${parseInt(group.color.slice(1, 3), 16)}, ${parseInt(group.color.slice(3, 5), 16)}, ${parseInt(group.color.slice(5, 7), 16)}, 0.15); padding: 10px 15px; border-bottom: 1px solid ${group.color};">
                        <h3 style="margin:0; color: ${group.color}; font-size: 1.1em;">${group.label}</h3>
                    </div>
                    <div style="padding: 15px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">
            `;

            recipes.forEach(recipe => {
                const key = recipe.key;
                const ownedCount = window.ItemSystem.getItemCount(recipe.name, true);

                // 檢查素材
                let hasMaterials = true;
                let materialsHtml = '<div style="display:flex; gap:8px; margin-bottom:10px; flex-wrap:wrap; justify-content:center;">';

                recipe.materials.forEach(mat => {
                    let requiredCount = mat.count;
                    // [Mod] 行動工作台優惠 (-30% 或 -50% 如果有工匠大師符文)
                    if (window.Game.isPortableSession) {
                        // 檢查是否有工匠大師符文
                        const hasWorkbenchMaster = Player.unlockedRunes && Player.unlockedRunes.includes('workbench_master');
                        const discount = hasWorkbenchMaster ? 0.5 : 0.7; // 50% 或 30% 折扣
                        requiredCount = Math.ceil(requiredCount * discount);
                    }

                    // [Mod] 行動工作台檢查背包，Hub 檢查倉庫
                    // getItemCount(name, checkStorage)
                    // isPortableSession -> checkStorage = false (只查背包)
                    // !isPortableSession -> checkStorage = true (查背包+倉庫? 原本邏辑是這樣嗎?)
                    // 原本邏輯 getItemCount(..., true) 會查 Inventory + Warehouse
                    // 但對於 Hub Workbench，我們通常希望它能用倉庫的。
                    // 對於 Portable Workbench，使用者希望只用背包的。
                    // 所以 portable -> checkStorage = false
                    const checkStorage = !window.Game.isPortableSession;

                    // [Fix] 確保 check 正確
                    const owned = window.ItemSystem.getItemCount(mat.item, checkStorage);
                    const enough = owned >= requiredCount;
                    if (!enough) hasMaterials = false;

                    let itemDef = CONFIG.itemPool.find(i => i.name === mat.item);
                    if (!itemDef && CONFIG.lootData[mat.item]) {
                        itemDef = { ...CONFIG.lootData[mat.item], name: mat.item };
                    }
                    if (!itemDef) itemDef = { icon: '📦', rarity: 'common' };

                    const rarityColor = CONFIG.rarityDisplay[itemDef.rarity] ? CONFIG.rarityDisplay[itemDef.rarity].color : '#fff';

                    materialsHtml += `
                        <div style="display:flex; flex-direction:column; align-items:center;">
                            <div style="
                                width: 32px; 
                                height: 32px; 
                                background: #1a1a1a; 
                                border: 1px solid ${enough ? rarityColor : '#f44336'}; 
                                border-radius: 5px; 
                                display: flex; 
                                align-items: center; 
                                justify-content: center; 
                                font-size: 1.2em; 
                                position: relative;
                                title: '${mat.item}'
                            ">
                                ${itemDef.icon}
                            </div>
                            <div style="font-size:0.7em; color:${enough ? '#aaa' : '#f44336'}; margin-top:2px;">
                                ${owned}/${requiredCount}
                            </div>
                        </div>
                    `;
                });
                materialsHtml += '</div>';

                const rarityColor = CONFIG.rarityDisplay[recipe.rarity] ? CONFIG.rarityDisplay[recipe.rarity].color : '#fff';

                groupHtml += `
                    <div style="background: #2a2a2a; border: 1px solid #444; border-radius: 8px; padding: 12px; display:flex; flex-direction:column;">
                        <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
                            <div style="font-weight:bold; color:${rarityColor}; font-size:0.95em;">${recipe.icon} ${recipe.name}</div>
                            <div style="font-size:0.8em; color:#aaa;">持有: ${ownedCount}</div>
                        </div>
                        <div style="font-size:0.85em; color:#ccc; margin-bottom:10px; flex:1;">${recipe.desc}</div>
                        
                        ${materialsHtml}

                        <button onclick="window.Game.craftItem('${key}')" class="btn" style="width:100%; padding: 6px; font-size: 0.9em; background: ${hasMaterials ? '#5d4037' : '#444'}; border: 1px solid ${hasMaterials ? '#8d6e63' : '#555'}; color: ${hasMaterials ? '#fff' : '#aaa'};" ${!hasMaterials ? 'disabled' : ''}>
                            製作
                        </button>
                    </div>
                `;
            });

            groupHtml += `
                    </div>
                </div>
            `;

            html += groupHtml;
        });

        html += `
                </div>
                <!-- 底部按鈕移除 -->
            </div>
        `;

        const modal = document.getElementById('workbench-modal');
        const content = document.getElementById('workbench-content');
        if (modal && content) {
            content.innerHTML = html;
            modal.style.display = 'flex';
        }
    },

    /**
     * 開啟可攜式工作台
     */
    openPortableWorkbench() {
        console.log("Opening Portable Workbench...");
        this.isPortableSession = true;
        this.renderWorkbench();

        // [Mod] 調整模態框關閉行為
        // 當是行動工作台時，關閉應返回冒險介面，而非 Hub
        const closeBtn = document.querySelector('#workbench-modal .modal-close-btn');
        if (closeBtn) {
            closeBtn.onclick = () => {
                document.getElementById('workbench-modal').style.display = 'none';
                window.Game.closePortableWorkbench();
            };
        }
    },

    /**
     * 關閉可攜式工作台
     */
    closePortableWorkbench() {
        this.isPortableSession = false;

        // 恢復之前的狀態
        if (this.currentEnemy) {
            this.phase = 'combat';
        } else {
            // 嘗試恢復到上一個事件狀態，或預設為 adventure
            // 這裡簡單處理：如果是戰鬥中應該無法使用道具 (通常限制)
            // 如果是非戰鬥，比如事件結算或剛進入下一層
            // 我們假設玩家是在非戰鬥狀態下使用的
            if (this.phase === 'workbench') {
                // 恢復為原本的事件狀態，如果不知道就設為 event_end 或 explore
                // 為安全起見，檢查是否有 currentEnemy
                this.phase = this.currentEnemy ? 'combat' : 'event_end';
            }
        }

        // 恢復按鈕原本的行為 (如果是 Hub 的按鈕，這無所謂，因為 Hub 會重繪)
        // 但如果在冒險中，我們需要確保 UI 正常
        this.updateUI();
    },

    /**
     * 製作物品
     */
    craftItem(recipeId) {
        const recipe = CONFIG.craftingRecipes[recipeId];
        if (!recipe) return;

        // 再次檢查素材
        const checkStorage = !this.isPortableSession;

        for (let mat of recipe.materials) {
            let requiredCount = mat.count;
            if (this.isPortableSession) {
                requiredCount = Math.ceil(requiredCount * 0.7);
            }

            const owned = window.ItemSystem.getItemCount(mat.item, checkStorage);
            if (owned < requiredCount) {
                window.UISystem.showToast(`素材不足：${mat.item}`, "error");
                return;
            }
        }

        // 行動工作台消耗檢查
        if (this.isPortableSession) {
            // 檢查是否有行動工作台
            const tool = Player.inventory.consumable.find(i => i.name === "行動工作台"); // 假設在消耗品欄
            // 其實 checkItemCount 會比較準確，但我們需要物件引用來移除
            // 這裡簡單檢查數量
            if (window.ItemSystem.getItemCount("行動工作台") < 1) {
                window.UISystem.showToast("缺少行動工作台！", "error");
                this.closePortableWorkbench();
                return;
            }
        }

        // 扣除素材
        for (let mat of recipe.materials) {
            let requiredCount = mat.count;
            if (this.isPortableSession) {
                requiredCount = Math.ceil(requiredCount * 0.7);
            }
            // removeItems(idOrName, count, useWarehouse)
            // if portable, useWarehouse = false
            window.ItemSystem.removeItems(mat.item, requiredCount, checkStorage);
        }

        if (this.isPortableSession) {
            // [Mod] 行動工作台：放入背包，並消耗工作台
            window.ItemSystem.removeItems("行動工作台", 1);

            // 構建物品
            const newItem = { ...CONFIG.itemPool.find(i => i.name === recipe.name) };
            // 如果不在 itemPool (如飾品)，則查找 specialItems 或 lootData，或者手動構建
            // 通常飾品在 itemPool 找不到 (在 config.js 中很多飾品沒在 itemPool?)
            // 需要更穩健的生成方式
            let craftedItem = newItem.name ? newItem : {
                name: recipe.name,
                icon: recipe.icon,
                desc: recipe.desc,
                rarity: recipe.rarity,
                type: 'accessory', // 假設都是飾品
                price: 0
            };

            // 嘗試從 sinItems 或 forgeItems 找
            if (!craftedItem.name) {
                const sin = CONFIG.sinItems.find(i => i.name === recipe.name);
                if (sin) craftedItem = { ...sin };
                const forge = CONFIG.forgeItems.find(i => i.name === recipe.name);
                if (forge) craftedItem = { ...forge };
            }

            window.ItemSystem.addItemToInventory(craftedItem);
            window.UISystem.showToast(`製作成功：${recipe.name}`, 'success');
            AudioSystem.playSFX('anvil_success');

            // 關閉工作台 (消耗了一次)
            this.closePortableWorkbench();
            document.getElementById('workbench-modal').style.display = 'none'; // 確保 UI 關閉

        } else {
            // [Default] 一般模式：放入倉庫
            if (!Player.warehouse[recipe.name]) {
                Player.warehouse[recipe.name] = 0;
            }
            Player.warehouse[recipe.name]++;

            // 記錄解鎖 (如果是飾品，可能需要記錄到圖鑑)
            if (!Player.history.items) Player.history.items = new Set();
            Player.history.items.add(recipe.name);

            this.savePersistentData();
            window.UISystem.showToast(`製作成功：${recipe.name}`, 'success');
            AudioSystem.playSFX('anvil_success'); // 使用強化成功音效

            this.renderWorkbench(); // 刷新介面
        }
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
     * 升級基礎屬性 (新版：支援階梯成本與突破)
     */
    _old_upgradeBaseStats(type) {
        // 確保數據存在
        if (!Player.trainingLevels) {
            Player.trainingLevels = {
                atk: Player.baseAtkBonus || 0,
                hp: Math.floor((Player.baseHpBonus || 0) / 10)
            };
        }

        const level = Player.trainingLevels[type];
        const config = CONFIG.hub.training;
        const isBreakthrough = (level > 0 && level % 10 === 0);

        if (isBreakthrough) {
            // --- 突破邏輯 ---
            const btConfig = config.breakthroughs[level];
            if (!btConfig) {
                window.UISystem.showToast("已達目前版本上限！", "error");
                return;
            }

            const owned = window.ItemSystem.getItemCount(btConfig.material, true);
            if (owned >= btConfig.count) {
                // 扣除素材
                window.ItemSystem.removeItems(btConfig.material, btConfig.count, true);

                // 提升等級 (突破後進入下一級循環)
                Player.trainingLevels[type]++;

                // 增加屬性 (突破本身也給予屬性獎勵，或者只是解鎖？這裡設定為給予一次標準成長)
                if (type === 'atk') Player.baseAtkBonus += 1;
                else Player.baseHpBonus += 10;

                this.savePersistentData();
                window.UISystem.showToast(`突破成功！等級提升至 Lv.${Player.trainingLevels[type]}`, 'success');
                AudioSystem.playSFX('powerup'); // 假設有這個音效，或用 equip
                this.renderTrainingGrounds();
                window.UISystem.updateStatsUI();
            } else {
                window.UISystem.showToast(`素材不足：${btConfig.material}`, "error");
            }

        } else {
            // --- 普通升級邏輯 ---
            const cost = Math.floor(config.baseCost * Math.pow(config.costScale, level));

            if (Player.explorationPoints >= cost) {
                Player.explorationPoints -= cost;

                // 提升等級
                Player.trainingLevels[type]++;

                // 增加屬性
                if (type === 'atk') Player.baseAtkBonus += 1;
                else Player.baseHpBonus += 10;

                this.savePersistentData();
                window.UISystem.showToast(`${type === 'atk' ? '攻擊' : '生命'}等級提升！(Lv.${Player.trainingLevels[type]})`, 'success');
                this.renderTrainingGrounds();
                window.UISystem.updateStatsUI();
            } else {
                window.UISystem.showToast("EP 不足！", "error");
            }
        }
    },

    /**
     * 渲染地圖室
     */
    renderMapRoom() {
        GameState.phase = 'map_room';
        let html = `
            <div style="text-align:center; padding:20px;">
                <!-- 標題已移至模態框 Header -->
                <div style="display:flex; justify-content:flex-end; margin-bottom:20px;">
                    <button onclick="window.UISystem.showModal('環境效果', window.Game._getBiomeInfoHtml())" class="btn" style="background:#607d8b; padding:5px 10px; font-size:0.9em;">ℹ️ 環境資訊</button>
                </div>
                <p style="font-size: 1.2em; margin-bottom: 20px;">選擇冒險的起點 (每 50 層自動解鎖)</p>
                <p style="font-size: 1.2em; margin-bottom: 30px;">目前 EP: <span style="color:#69f0ae">${Player.explorationPoints}</span></p>
                <p style="font-size:1em; color:#888;">歷史最深: ${Player.maxDepthUnlocked} 層</p>
                <hr style="border-color:#444; margin:20px 0;">
                <div style="display:flex; flex-direction:column; gap:15px; max-height:400px; overflow-y:auto; padding: 10px;">
        `;

        // 自動解鎖節點：1, 51, 101, 151...
        // 規則：如果 maxDepthUnlocked >= 50，解鎖 51。
        const maxNode = Math.floor(Player.maxDepthUnlocked / 50) * 50 + 1;

        for (let depth = 1; depth <= maxNode + 50; depth += 50) {
            // 檢查是否解鎖: 
            // 第 1 層: 總是解鎖
            // 第 51 層: 需要 maxDepth >= 50
            if (depth > 1 && Player.maxDepthUnlocked < depth - 1) continue;

            const biome = CONFIG.biomes.find(b => depth >= b.min && depth <= b.max) || CONFIG.biomes[CONFIG.biomes.length - 1];

            html += `
                <button onclick="window.Game.startNewAdventure(${depth})" class="btn" style="background:#00bcd4; padding: 10px; font-size: 1.1em; display:flex; flex-direction:column; align-items:center; gap:5px;">
                    <span>從第 ${depth} 層開始</span>
                    <span style="font-size:0.8em; color:#e0f7fa; opacity:0.9;">${biome.name}</span>
                </button>
            `;
        }

        html += `
                </div>
                <!-- 底部按鈕移除 -->
            </div>
        `;

        const modal = document.getElementById('map-modal');
        const content = document.getElementById('map-content');
        if (modal && content) {
            content.innerHTML = html;
            modal.style.display = 'flex';
        }
    },

    _getBiomeInfoHtml() {
        let html = '<div style="display:flex; flex-direction:column; gap:10px;">';
        CONFIG.biomes.forEach(b => {
            html += `
                <div style="background:#333; padding:10px; border-radius:5px; border-left: 4px solid #00bcd4;">
                    <div style="font-weight:bold; color:#fff;">${b.name} (${b.min}-${b.max < 9000 ? b.max : '∞'})</div>
                    <div style="font-size:0.9em; color:#aaa;">${b.effect ? b.effect.desc : '無特殊環境效果'}</div>
                </div>
             `;
        });
        html += '</div>';
        return html;
    },

    showAlchemy() {
        window.UISystem.showAlchemy();
    },

    /**
     * 獲取當前區域
     */
    getCurrentBiome() {
        if (Player.inInferno) return { name: "🔥 煉獄", min: 0, max: 999999 };
        const depth = Player.depth;
        return CONFIG.biomes.find(b => depth >= b.min && depth <= b.max) || CONFIG.biomes[CONFIG.biomes.length - 1];
    },

    /**
     * 顯示岔路選擇
     */
    showBranchSelection() {
        const biome = this.getCurrentBiome();
        const title = `岔路口 (第 ${Player.depth} 層)`;
        const desc = `你來到了${biome.name}的一處岔路口，前方有三條路...`;

        const html = `
            <div style="display:flex; flex-direction:column; gap:15px;">
                <button onclick="Game.handleBranchSelection('safe')" class="btn" style="background:#4caf50; padding:15px;">
                    <div style="font-weight:bold;">🌿 安全小徑</div>
                    <div style="font-size:0.8em; opacity:0.8;">遭遇普通怪物，風險較低。</div>
                </button>
                <button onclick="Game.handleBranchSelection('danger')" class="btn" style="background:#f44336; padding:15px;">
                    <div style="font-weight:bold;">💀 危險捷徑</div>
                    <div style="font-size:0.8em; opacity:0.8;">必定遭遇菁英(70%)或首領(30%)，金幣與掉落加倍！</div>
                </button>
                <button onclick="Game.handleBranchSelection('mystery')" class="btn" style="background:#9c27b0; padding:15px;">
                    <div style="font-weight:bold;">🔮 神秘迷霧</div>
                    <div style="font-size:0.8em; opacity:0.8;">隨機觸發事件 (商店/祭壇/陷阱/怪物)。</div>
                </button>
            </div>
        `;

        this.renderEvent(title, desc, html, "🛤️");
        this.setButtons(null, null, null, null); // 隱藏標準按鈕，強制選擇
    },

    /**
     * 處理岔路選擇
     */
    handleBranchSelection(type) {
        this.log(`你選擇了 ${type === 'safe' ? '安全小徑' : type === 'danger' ? '危險捷徑' : '神秘迷霧'}。`);

        if (type === 'safe') {
            // 安全路徑：普通戰鬥
            CombatSystem.triggerCombat(false, false);
        } else if (type === 'danger') {
            // 危險路徑：70% 精英怪，30% 首領
            // 金幣與掉落率 +100%
            window.GameState.tempBonus = { gold: 2, drop: 2 };

            if (Math.random() < 0.7) {
                CombatSystem.triggerCombat(false, false, 'elite');
            } else {
                CombatSystem.triggerCombat(false, false, 'boss');
            }
        } else if (type === 'mystery') {
            // 神秘路徑：隨機事件池
            const rand = Math.random();
            if (rand < 0.3) this.triggerMerchant();
            else if (rand < 0.5) EventSystem.triggerStatue();
            else if (rand < 0.7) EventSystem.triggerTrap();
            else CombatSystem.triggerCombat(false, false);
        }
        this.updateUI();
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
        window.UISystem.renderMuseum();
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
        // 確保關閉所有全螢幕模態框 (包含地圖室)
        const modals = document.querySelectorAll('.full-screen-modal');
        modals.forEach(m => m.style.display = 'none');

        // 切換回遊戲介面
        document.getElementById('hub-screen').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');

        // 修復 DOM 結構 (如果被撤離事件破壞)
        const eventDisplay = document.getElementById('event-display');
        if (eventDisplay && !document.getElementById('event-title')) {
            eventDisplay.innerHTML = `
                <div id="event-icon" class="monster-icon">🎲</div>
                <h3 id="event-title">準備冒險</h3>
                <div id="event-desc">請先選擇職業...</div>
                <div id="merchant-area" class="hidden"></div>
            `;
        }

        // 恢復按鈕顯示
        document.getElementById('btn-main').style.display = 'inline-block';
        document.getElementById('btn-sub').style.display = 'inline-block';

        // 備份永久屬性
        const persistent = {
            // templeAtkBonus: Player.templeAtkBonus, // 修正：神廟加成應為單局有效
            // templeHpBonus: Player.templeHpBonus,   // 修正：神廟加成應為單局有效
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
            shardsCollected: Player.shardsCollected || [], // 新增: 碎片
            warehouse: Player.warehouse || {}, // 新增: 倉庫
            donatedItems: Player.donatedItems || new Set() // 新增: 博物館捐贈
        };

        // 重置為初始狀態 (參考 Player 定義)
        Player.hp = 100;
        Player.maxHp = 100;
        Player.baseAtk = 5;
        Player.gold = 100;
        Player.depth = startDepth > 1 ? startDepth : 0; // 如果是選層，直接設定；否則 0 (nextEvent 會 +1)
        Player.startDepth = startDepth; // 記錄起始層數，用於計算 EP 獎勵
        Player.class = null;
        Player.equipment = { weapon: null, armor: null, shield: null };
        Player.equipment = { weapon: null, armor: null, shield: null };
        Player.pendingWarehouse = {}; // 重置運送清單
        Player.succubusStage = 0; // 重置魅魔事件階段

        // 保留現有背包 (從倉庫取出的物品)，如果未初始化則初始化
        if (!Player.inventory) {
            Player.inventory = { equipment: [], consumable: [], material: [] };
        }
        // 確保結構完整
        if (!Player.inventory.equipment) Player.inventory.equipment = [];
        if (!Player.inventory.consumable) Player.inventory.consumable = [];
        if (!Player.inventory.material) Player.inventory.material = [];

        // 檢查是否已有初始藥水，沒有則添加
        const hasPotion = Player.inventory.consumable.some(i => i.name === "治療藥水");
        if (!hasPotion) {
            Player.inventory.consumable.push({ name: "治療藥水", type: "consumable", val: 30, rarity: "common", price: 25, icon: "🧪", desc: "恢復30點生命" });
        }
        Player.buff = null;

        // 還原永久屬性
        Object.assign(Player, persistent);

        // 重置局內暫時屬性
        Player.templeAtkBonus = 0; // 兼容舊存檔
        Player.templeHpBonus = 0;  // 兼容舊存檔
        Player.templeAtkMult = 0;  // 新增：神廟攻擊倍率
        Player.templeHpMult = 0;   // 新增：神廟生命倍率

        // 應用永久加成
        Player.maxHp += Player.baseHpBonus; // 修正：不再加上 templeHpBonus，因為它是局內的
        Player.hp = Player.maxHp;

        // 應用符文效果: 初始藥水
        if (Player.unlockedRunes.includes('starting_potion')) {
            const potion = CONFIG.runes.starting_potion.effect;
            for (let i = 0; i < potion.count; i++) {
                Player.inventory.consumable.push({ name: potion.item, type: "consumable", val: 30, rarity: "common", price: 25, icon: "🧪", desc: "恢復30點生命" });
            }
            this.log("⚗️ [符文效果] 獲得初始藥水");
        }

        GameState.phase = 'select_class';
        GameState.log = [];
        GameState.merchantStock = [];
        GameState.blacksmithAttempts = 0;

        this.updateUI();
        this.selectClass();
    },

    /**
     * 發放高層起步補給
     */
    grantStartingSupplies(depth) {
        let supplies = [];
        let gold = depth * 10;
        Player.gold += gold;
        supplies.push(`金幣 x${gold}`);

        // 藥水補給
        const potionCount = 2 + Math.floor(depth / 50);
        const potion = CONFIG.itemPool.find(i => i.name === '治療藥水');
        if (potion) {
            for (let i = 0; i < potionCount; i++) {
                Player.inventory.consumable.push({ ...potion, uuid: crypto.randomUUID() });
            }
            supplies.push(`治療藥水 x${potionCount}`);
        }

        // 裝備補給
        let weaponName, armorName, shieldName;

        if (depth >= 200) {
            weaponName = '屠龍劍'; armorName = '龍鱗鎧甲'; shieldName = '塔盾';
        } else if (depth >= 100) {
            weaponName = '秘銀劍'; armorName = '板甲'; shieldName = '騎士盾';
        } else if (depth >= 50) {
            weaponName = '騎士長槍'; armorName = '鎖子甲'; shieldName = '初始盾牌';
        } else if (depth >= 10) {
            weaponName = '木棒'; armorName = '布衣'; shieldName = '初始盾牌';
        }

        const equipItem = (name, type) => {
            if (!name) return;
            const item = CONFIG.itemPool.find(i => i.name === name);
            if (item) {
                const newItem = { ...item, uuid: crypto.randomUUID() };
                Player.equipment[type] = newItem;
                supplies.push(`${name}`);
            }
        };

        equipItem(weaponName, 'weapon');
        equipItem(armorName, 'armor');
        equipItem(shieldName, 'shield');

        // 顯示補給清單
        const msg = `
            <div style="text-align:center;">
                <h3 style="color:#00bcd4; margin-bottom:10px;">📦 補給物資</h3>
                <p style="color:#aaa; margin-bottom:15px;">為了支援您的深入探索，公會提供了以下物資：</p>
                <div style="background:rgba(255,255,255,0.1); padding:15px; border-radius:5px; text-align:left;">
                    ${supplies.map(s => `<div style="margin:5px 0;">🔹 ${s}</div>`).join('')}
                </div>
            </div>
        `;

        // 使用 setTimeout 確保在 UI 更新後顯示
        setTimeout(() => {
            window.UISystem.showConfirmModal("物資配發", msg, null, false);
        }, 500);
    },

    /**
     * 放棄探險 (結算並返回大廳)
     */
    giveUpAdventure() {
        // 移除 phase 檢查，允許從 Hub 放棄
        // if (GameState.phase === 'hub') return;

        // 計算探索點數 (每 5 層 1 點 - 提升獲取量)
        // 修正：只計算本次冒險推進的層數，避免刷 EP
        const progress = Math.max(0, Player.depth - (Player.startDepth || 1));
        let epReward = Math.floor(progress / 5);

        // 挑戰模式獎勵加倍
        if (GameState.isChallengeMode) {
            epReward = Math.floor(epReward * CONFIG.hub.challengeMultiplier.reward);
        }

        Player.explorationPoints += epReward;

        // 更新最大深度紀錄
        Player.maxDepthUnlocked = Math.max(Player.maxDepthUnlocked, Player.depth);

        // 放棄探險，清空所有背包
        Player.inventory = { equipment: [], consumable: [], material: [] };

        this.savePersistentData(); // 儲存局外數據

        // 刪除存檔
        localStorage.removeItem('fantasy_adventure_save');

        const msg = `
            <div style="text-align:center; padding: 20px;">
                <h2 style="color:#ffd700; margin-bottom:15px;">🏳️ 放棄探險</h2>
                <p style="font-size:1.2em; margin-bottom:10px;">你決定暫時撤退，整頓裝備。</p>
                <p style="font-size:1.2em; margin-bottom:10px;">冒險在第 <span style="color:#ffd700">${Player.depth}</span> 層結束。</p>
                <p style="font-size:1.1em; color:#69f0ae;">獲得探索點數 (EP): +${epReward}</p>
                <p style="color:#ff5252; font-size:1.1em;">背包與運送中的素材已遺失。</p>
                <p style="color:#888; font-size:0.9em; margin-top:5px;">(目前總 EP: ${Player.explorationPoints})</p>
            </div>
        `;

        // 清空運送中物品
        Player.pendingWarehouse = {};

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
        if (player.equipment.shield) {
            // [Fixed] 支持新版神話盾牌使用 val 屬性
            const s = player.equipment.shield;
            if (s.def) def += s.def;
            else if (s.val) def += s.val;
        }

        // 2. 職業加成 (人猿: +5 防禦)
        if (player.class === 'ape') {
            def += 5;
        }

        // 2. 博物館加成
        def += this.getMuseumBonus('def_bonus');
        const defMult = this.getMuseumBonus('def_mult');
        if (defMult > 0) def = Math.floor(def * (1 + defMult));

        // 3. 詞綴加成
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

        // 4. 飾品/其他裝備 防禦加成
        (window.Player.equipment.accessories || []).forEach(acc => {
            if (acc && acc.def) def += acc.def;
        });

        return Math.floor(def);
    },
    /**
     * 獲取攻擊力
     */
    getAtk() {
        let atk = Player.baseAtk;
        if (Player.equipment.weapon) atk += Player.equipment.weapon.val;

        // 應用博物館加成
        atk += this.getMuseumBonus('atk_bonus');
        const atkMult = this.getMuseumBonus('atk_mult');
        if (atkMult > 0) atk = Math.floor(atk * (1 + atkMult));

        // 應用詞綴加成
        if (this.modifiers && this.modifiers.atk) {
            atk = Math.floor(atk * (1 + this.modifiers.atk));
        }

        // 訓練場加成
        atk += (Player.baseAtkBonus || 0);

        // 最後應用神廟倍率 (動態乘算)
        if (Player.templeAtkMult) {
            atk = Math.floor(atk * (1 + Player.templeAtkMult));
        }

        // 飾品加成 (Troll: 攻擊力, Demon: 攻擊力)
        let accAtkMult = 0;

        (Player.equipment.accessories || []).forEach(acc => {
            if (!acc) return;
            // Generic ATK (Check acc.atk)
            if (acc.atk) atk += acc.atk;

            // Troll Series
            if (acc.id === 'acc_troll_1') atk += 10;
            if (acc.id === 'acc_troll_2') atk += 20;
            if (acc.id === 'acc_troll_3') atk += 35;
            // Demon Series
            if (acc.id === 'acc_demon_1') atk += 10;
            if (acc.id === 'acc_demon_2') atk += 20;
            if (acc.id === 'acc_demon_3') atk += 40;

            // Sin Series: 傲慢 [Pride] (攻擊力 +100%)
            if (acc.id === 'acc_pride') accAtkMult += 1.0;
            // Sin Series: 暴怒 [Wrath] (攻擊力 +1000)
            if (acc.id === 'acc_wrath') atk += 1000;
        });

        if (accAtkMult > 0) {
            atk = Math.floor(atk * (1 + accAtkMult));
        }

        return atk;
    },

    /**
     * 獲取爆擊率
     */
    getCrit() {
        let crit = 5; // 基礎爆擊率 5%

        // 0. 博物館加成
        crit += this.getMuseumBonus('crit_bonus');

        // 1. Buff 加成
        if (Player.buff) {
            if (Player.buff.id === 'angel_courage') crit = 20; // 天使的勇氣: 固定 20%
            if (Player.buff.id === 'demon_enhance') crit = 50; // 惡魔的強化: 固定 50%
        }

        // 2. 詞綴加成 (如果有)
        if (this.modifiers && this.modifiers.crit) {
            crit += Math.floor(this.modifiers.crit * 100);
        }

        // [New] 神話裝備成長加成 (牛頭人戰斧)
        if (Player.mythicCritBonus) {
            crit += Player.mythicCritBonus;
        }

        // 3. 符文加成 (致命專注)
        if (Player.unlockedRunes && Player.unlockedRunes.includes('crit_boost')) {
            crit += CONFIG.runes.crit_boost.effect.val;
        }

        // 4. 飾品加成 (Wolf: 暴擊, Demon: 暴擊)
        (Player.equipment.accessories || []).forEach(acc => {
            if (!acc) return;
            // Wolf Series
            if (acc.id === 'acc_wolf_1') crit += 1;
            if (acc.id === 'acc_wolf_2') crit += 3;
            if (acc.id === 'acc_wolf_3') crit += 8;
            // Demon Series
            if (acc.id === 'acc_demon_1') crit += 2;
            if (acc.id === 'acc_demon_2') crit += 5;
            if (acc.id === 'acc_demon_3') crit += 20;
        });

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

        // 應用博物館加成
        newMaxHp += this.getMuseumBonus('hp_bonus');
        const hpMult = this.getMuseumBonus('hp_mult');
        if (hpMult > 0) newMaxHp = Math.floor(newMaxHp * (1 + hpMult));

        // 訓練場加成
        newMaxHp += (Player.baseHpBonus || 0);

        // 最後應用神廟倍率 (動態乘算)
        if (Player.templeHpMult) {
            newMaxHp = Math.floor(newMaxHp * (1 + Player.templeHpMult));
        }

        // 飾品加成 - 固定數值 (Golem: HP, Demon: HP, Wrath: HP)
        (Player.equipment.accessories || []).forEach(acc => {
            if (!acc) return;
            // Generic HP support (Check acc.hp)
            if (acc.hp) newMaxHp += acc.hp;

            // Golem Series
            if (acc.id === 'acc_golem_1') newMaxHp += 30;
            if (acc.id === 'acc_golem_2') newMaxHp += 100;
            if (acc.id === 'acc_golem_3') newMaxHp += 200;
            // Demon Series
            if (acc.id === 'acc_demon_1') newMaxHp += 10;
            if (acc.id === 'acc_demon_2') newMaxHp += 20;
            if (acc.id === 'acc_demon_3') newMaxHp += 40;
            // Sin Series: 暴怒 [Wrath] (同時加攻加血)
            if (acc.id === 'acc_wrath') newMaxHp += 1000;
            // Truth Series
            if (acc.id === 'acc_truth') newMaxHp += 2000; // Explicit check or rely on generic acc.hp
        });

        // 飾品加成 - 乘算 (Sloth: HP +200%)
        let accHpMult = 0;
        (Player.equipment.accessories || []).forEach(acc => {
            if (!acc) return;
            // Sin Series: 怠惰 [Sloth] (移至戰鬥邏輯: 逃跑傷害減半)
            // if (acc.id === 'acc_sloth') accHpMult += 2.0;
        });

        if (accHpMult > 0) {
            newMaxHp = Math.floor(newMaxHp * (1 + accHpMult));
        }

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

    // ========== 博物館系統 ==========

    /**
     * 捐贈物品
     */
    /**
     * 捐贈物品 (支援數量與部分捐贈)
     */
    donateItem(itemName, confirmed = false) {
        // 查找需求數量
        let requiredCount = 1;
        for (const set of CONFIG.museumSets) {
            const config = set.items.find(i => i.item === itemName);
            if (config) {
                requiredCount = config.count;
                break;
            }
        }

        const currentDonated = Player.donatedItems[itemName] || 0;
        if (currentDonated >= requiredCount) {
            this.log(`已經完成 ${itemName} 的捐贈 (${currentDonated}/${requiredCount})。`);
            return;
        }

        const needed = requiredCount - currentDonated;

        // 計算總持有量 (倉庫 + 背包)
        const warehouseCount = Player.warehouse[itemName] || 0;
        // 假設背包中素材是不堆疊的物件 (如果是堆疊的，需要調整)
        const invCount = Player.inventory.material.filter(i => i.name === itemName).length;
        const totalOwned = warehouseCount + invCount;

        if (totalOwned <= 0) {
            this.log("你沒有這個物品可以捐贈。");
            return;
        }

        const toDonate = Math.min(needed, totalOwned);

        // 確認對話框
        if (!confirmed) {
            window.UISystem.showConfirmModal(
                "捐贈確認",
                `確定要捐贈 <span style="color:#ffd700">${toDonate} 個 ${itemName}</span> 嗎？<br>(進度: ${currentDonated} -> ${currentDonated + toDonate} / ${requiredCount})<br>捐贈後物品將會消失。`,
                () => this.donateItem(itemName, true)
            );
            return;
        }

        // 執行扣除
        let remainingToDeduct = toDonate;

        // 1. 優先從倉庫扣除
        if (warehouseCount > 0) {
            const deduct = Math.min(remainingToDeduct, warehouseCount);
            Player.warehouse[itemName] -= deduct;
            if (Player.warehouse[itemName] <= 0) delete Player.warehouse[itemName];
            remainingToDeduct -= deduct;
        }

        // 2. 從背包扣除
        if (remainingToDeduct > 0) {
            for (let i = Player.inventory.material.length - 1; i >= 0 && remainingToDeduct > 0; i--) {
                if (Player.inventory.material[i].name === itemName) {
                    Player.inventory.material.splice(i, 1);
                    remainingToDeduct--;
                }
            }
        }

        // 更新捐贈數據
        Player.donatedItems[itemName] = (Player.donatedItems[itemName] || 0) + toDonate;

        this._processDonation(itemName, toDonate);
    },

    _processDonation(itemName, amount) {
        // 1. 記錄當前已完成的套裝 ID
        const previouslyCompletedSets = new Set();
        CONFIG.museumSets.forEach(set => {
            if (this.isSetCompleted(set.id)) {
                previouslyCompletedSets.add(set.id);
            }
        });

        // 2. 執行捐贈 (已在 donateItem 更新數據)
        this.log(`捐贈了 ${amount} 個 ${itemName}！`);
        window.UISystem.showToast(`捐贈成功！已捐贈 ${itemName} x${amount}`, "success");

        // 3. 檢查新完成的套裝
        CONFIG.museumSets.forEach(set => {
            // 如果現在完成了，且之前沒完成 -> 才是新完成
            if (this.isSetCompleted(set.id) && !previouslyCompletedSets.has(set.id)) {
                this.log(`🎉 恭喜！完成了博物館套裝：${set.name}`);
                window.UISystem.showToast(`🎉 套裝完成：${set.name}`, "warning");
            }
        });

        this.savePersistentData();
        window.UISystem.renderMuseum();
    },

    /**
     * 檢查套裝是否完成
     */
    isSetCompleted(setId) {
        const set = CONFIG.museumSets.find(s => s.id === setId);
        if (!set) return false;
        // 檢查套裝中每個物品的捐贈數量是否達到要求
        return set.items.every(obj => (Player.donatedItems[obj.item] || 0) >= obj.count);
    },

    /**
     * 觸發撤離點事件
     */
    triggerExtraction() {
        const epBonus = Math.floor(Player.depth / 10 * window.CONFIG.extractionBonusMultiplier);

        const html = `
            <div style="text-align:center;">

                <p style="font-size:1.1em; margin-bottom:20px;">你發現了一個安全的撤離點。</p>
                <p style="color:#aaa;">現在撤離可以獲得額外獎勵，並保留所有素材與飾品。</p>
                
                <div style="background:rgba(0, 188, 212, 0.1); padding:15px; border-radius:10px; margin:20px 0; border:1px solid #00bcd4;">
                    <h3 style="color:#00bcd4;">撤離獎勵</h3>
                    <p style="font-size:1.2em; color:#ffd700; margin-top:10px;">探索點數 (EP): +${epBonus}</p>
                    <p style="font-size:0.9em; color:#888;">(一般放棄僅獲得 ${Math.floor(Player.depth / 10)} EP)</p>
                    <p style="color:#69f0ae; margin-top:10px;">✅ 保留素材與 💍 飾品</p>
                </div>

                <div style="display:flex; gap:15px; justify-content:center; margin-top:30px;">
                    <button onclick="window.Game.handleExtraction()" class="btn" style="background:#00bcd4; padding: 12px 30px; font-size:1.1em;">確認撤離</button>
                    <button onclick="window.Game.nextEvent()" class="btn" style="background:#666; padding: 12px 30px; font-size:1.1em;">繼續冒險</button>
                </div>
            </div>
        `;

        this.renderEvent("🚁 撤離點", "你發現了一個安全的撤離點。", html, "🚁");
        window.UISystem.hideCombatButtons();
    },

    /**
     * 處理撤離
     */
    handleExtraction() {
        // 計算獎勵 (每 5 層 1 點 - 提升獲取量)
        // 修正：只計算本次冒險推進的層數
        const progress = Math.max(0, Player.depth - (Player.startDepth || 1));
        let epReward = Math.floor(progress / 5 * window.CONFIG.extractionBonusMultiplier);

        // 挑戰模式獎勵加倍
        if (GameState.isChallengeMode) {
            epReward = Math.floor(epReward * window.CONFIG.hub.challengeMultiplier.reward);
        }

        Player.explorationPoints += epReward;
        Player.maxDepthUnlocked = Math.max(Player.maxDepthUnlocked, Player.depth);

        // 轉移素材到倉庫
        let movedCount = 0;
        let movedAccCount = 0; // 記錄轉移的飾品數量

        // 1. 處理委託運送的物品 (pendingWarehouse)
        if (Player.pendingWarehouse) {
            for (let [name, count] of Object.entries(Player.pendingWarehouse)) {
                if (!Player.warehouse[name]) Player.warehouse[name] = 0;
                Player.warehouse[name] += count;
                movedCount += count;
            }
            Player.pendingWarehouse = {}; // 清空運送清單
        }

        // 2. 處理背包剩餘素材
        if (Player.inventory.material && Player.inventory.material.length > 0) {
            Player.inventory.material.forEach(item => {
                if (!Player.warehouse[item.name]) {
                    Player.warehouse[item.name] = 0;
                }
                Player.warehouse[item.name]++;
                movedCount++;
            });
            // 清空背包素材 (因為已經轉移)
            Player.inventory.material = [];
        }

        // 3. 處理飾品 (裝備中 + 背包內)
        // 3A. 背包內的飾品
        if (Player.inventory.equipment && Player.inventory.equipment.length > 0) {
            Player.inventory.equipment.forEach(item => {
                if (item.type === 'accessory') {
                    if (!Player.warehouse[item.name]) Player.warehouse[item.name] = 0;
                    Player.warehouse[item.name]++;
                    movedAccCount++;
                }
            });
        }

        // 3B. 身上裝備的飾品
        if (Player.equipment.accessories && Player.equipment.accessories.length > 0) {
            Player.equipment.accessories.forEach(acc => {
                if (acc) { // 確認不是 null
                    if (!Player.warehouse[acc.name]) Player.warehouse[acc.name] = 0;
                    Player.warehouse[acc.name]++;
                    movedAccCount++;
                }
            });
        }

        // 清空其他背包 (裝備與消耗品在撤離時也會移除，除非有特殊保留機制)
        Player.inventory.equipment = [];
        Player.inventory.consumable = [];

        this.savePersistentData();
        localStorage.removeItem('fantasy_adventure_save');

        const msg = `
            <div style="text-align:center; padding: 20px;">
                <h2 style="color:#00bcd4; margin-bottom:15px;">🚁 成功撤離</h2>
                <p style="font-size:1.2em; margin-bottom:10px;">你帶著豐厚的戰利品安全返回了大廳。</p>
                <p style="font-size:1.2em; margin-bottom:10px;">冒險在第 <span style="color:#ffd700">${Player.depth}</span> 層結束。</p>
                <p style="font-size:1.1em; color:#69f0ae;">獲得探索點數 (EP): +${epReward}</p>
                <p style="color:#ffd700; font-size:1.1em;">已將 ${movedCount} 個素材存入倉庫。</p>
                ${movedAccCount > 0 ? `<p style="color:#ffa500; font-size:1.1em;">💍 已保留 ${movedAccCount} 個飾品至倉庫！</p>` : ''}
                <p style="color:#888; font-size:0.9em; margin-top:5px;">(目前總 EP: ${Player.explorationPoints})</p>
            </div>
        `;

        window.UISystem.showConfirmModal("撤離成功", msg, () => {
            window.Game.enterHub();
        });

        // 隱藏取消按鈕
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        if (cancelBtn) cancelBtn.style.display = 'none';
    },

    /**
     * 獲取博物館加成
     */
    getMuseumBonus(type) {
        let bonus = 0;
        CONFIG.museumSets.forEach(set => {
            if (this.isSetCompleted(set.id)) {
                if (set.reward.type === type) {
                    bonus += set.reward.val;
                }
                // 特殊處理全屬性 (魔王收藏)
                if (set.reward.type === 'all_stats') {
                    // 生命+10%, 攻擊+10%
                    if (type === 'hp_mult' || type === 'atk_mult') bonus += 0.1;
                    // 暴擊+10%, 防禦+10
                    if (type === 'crit_bonus' || type === 'def_bonus') bonus += 10;
                }
            }
        });
        return bonus;
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
        // --- [FIX] 莉莉絲獻祭事件 ---
        // 條件：打神 + 莉莉絲在場 + 莉莉絲還沒犧牲
        if (GameState.currentEnemy && GameState.currentEnemy.isGod && Player.lilithBlessing && !Player.lilithSacrificed) {

            // 1. 標記犧牲
            Player.lilithSacrificed = true;
            Player.lilithBlessing = false;

            // 2. 數值變更
            Player.lastInspirationTurns = 3;
            Player.hp = Player.maxHp;

            // 3. 削弱神
            const dmgToGod = Math.floor(GameState.currentEnemy.hp * 0.5);
            GameState.currentEnemy.hp -= dmgToGod;

            // 4. 覆蓋七宗罪 DEBUFF
            if (Player.debuff) {
                Player.debuff = null;
                this.showFloatingText("詛咒淨化", "#fff");
            }

            this.recalcStats(); // 確保 UI 更新

            // 5. 演出
            this.renderEvent("💔 起源魔法",
                "就在致命一擊即將落下時，莉莉絲擋在了你身前。",
                `「活下去...笨蛋...」<br>她化為了無數光點消散了。<br><br>
                <span style='color:#ff69b4'>獲得【最後的鼓舞】 (3回合無視神之力，HP+6666，全回復)<br>
                神之代行者受到重創 (HP -50%)</span>`,
                "✨");

            this.setButtons("帶著她的份戰鬥 (繼續)", "resumeCombat", "無", null, true);
            this.updateUI();
            return;
        }

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

        // 計算探索點數 (每 5 層 1 點)
        // 修正：只計算本次冒險推進的層數
        const progress = Math.max(0, Player.depth - (Player.startDepth || 1));
        let epReward = Math.floor(progress / 5);

        // 挑戰模式獎勵加倍
        if (GameState.isChallengeMode) {
            epReward = Math.floor(epReward * CONFIG.hub.challengeMultiplier.reward);
        }

        Player.explorationPoints += epReward;

        // 更新最大深度紀錄
        Player.maxDepthUnlocked = Math.max(Player.maxDepthUnlocked, Player.depth);

        // 死亡懲罰：清空所有背包
        Player.inventory = { equipment: [], consumable: [], material: [] };

        this.savePersistentData(); // 儲存局外數據

        let cause = reason ? reason : "未知原因";
        const msg = `
            <div style="text-align:center; padding: 20px;">
                <h2 style="color:#ff5252; margin-bottom:15px;">💀 你死了</h2>
                <p style="font-size:1.1em; margin-bottom:10px;">死因：${cause}</p>
                <p style="font-size:1.2em; margin-bottom:10px;">冒險在第 <span style="color:#ffd700">${Player.depth}</span> 層結束。</p>
                <p style="font-size:1.1em; color:#69f0ae;">獲得探索點數 (EP): +${epReward}</p>
                <p style="color:#ff5252; font-size:1.1em;">背包與運送中的素材已全部遺失。</p>
                <p style="color:#888; font-size:0.9em; margin-top:5px;">(目前總 EP: ${Player.explorationPoints})</p>
            </div>
        `;

        // 清空運送中物品
        Player.pendingWarehouse = {};

        window.UISystem.showConfirmModal("冒險結束", msg, () => {
            window.Game.enterHub();
        });

        // 隱藏取消按鈕，強制確認
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        if (cancelBtn) cancelBtn.style.display = 'none';
    },

    /**
     * 恢復戰鬥 (用於莉莉絲獻祭/復活後)
     */
    resumeCombat() {
        GameState.phase = 'combat';
        this.updateUI();
        window.UISystem.showCombatButtons();
        this.log("戰鬥繼續！");
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
    unequip(type) { ItemSystem.unequip(type); },



    /**
     * 渲染倉庫 (委託給 UI)
     */
    renderWarehouse() {
        window.UISystem.renderWarehouse();
    },

    /**
     * 從倉庫取出物品
     */
    withdrawFromWarehouse(itemName, count = 1) {
        if (!Player.warehouse[itemName] || Player.warehouse[itemName] < count) {
            window.UISystem.showToast("倉庫數量不足！", "error");
            return;
        }

        // 查找物品數據 (從 lootData 或 itemPool 或 recipes)
        let itemData = CONFIG.lootData[itemName];
        if (!itemData) {
            const poolItem = CONFIG.itemPool.find(i => i.name === itemName);
            if (poolItem) itemData = poolItem;
        }
        // 查找煉金配方產物
        if (!itemData) {
            const recipe = Object.values(CONFIG.recipes).find(r => r.name === itemName);
            if (recipe) {
                itemData = {
                    name: recipe.name,
                    icon: recipe.icon,
                    desc: recipe.desc,
                    type: recipe.resultType,
                    rarity: 'special',
                    val: recipe.val || 0,
                    buffId: recipe.buffId,
                    price: 0
                };
            }
        }
        if (!itemData && CONFIG.craftingRecipes) {
            const craftRecipe = Object.values(CONFIG.craftingRecipes).find(r => r.name === itemName);
            if (craftRecipe) {
                itemData = { ...craftRecipe }; // 直接使用配方定義的物品數據
            }
        }
        // [Fix] 查找七宗罪物品
        if (!itemData && CONFIG.sinItems) {
            const sinItem = CONFIG.sinItems.find(i => i.name === itemName);
            if (sinItem) itemData = sinItem;
        }
        // [Fix] 查找特殊物品 (如真實之冠、真實之心)
        if (!itemData && CONFIG.specialItems) {
            const specialItem = Object.values(CONFIG.specialItems).find(i => i.name === itemName);
            if (specialItem) itemData = specialItem;
        }

        if (!itemData) {
            console.error("Unknown item:", itemName);
            return;
        }

        // 扣除倉庫
        Player.warehouse[itemName] -= count;
        if (Player.warehouse[itemName] <= 0) {
            delete Player.warehouse[itemName];
        }

        // 加入背包
        // 重建完整的物品對象
        const newItem = {
            name: itemName,
            ...itemData
        };
        // 確保類型正確 (如果是素材)
        if (!newItem.type) newItem.type = 'material';

        // 加入對應背包分類
        if (newItem.type === 'consumable' || newItem.type === 'scroll') {
            window.Player.inventory.consumable.push(newItem);
        } else if (newItem.type === 'accessory') {
            // [Fix] 飾品應該放入 accessory 陣列，而非 equipment
            if (!window.Player.inventory.accessory) window.Player.inventory.accessory = [];
            window.Player.inventory.accessory.push(newItem);
        } else if (['weapon', 'armor', 'shield'].includes(newItem.type)) {
            window.Player.inventory.equipment.push(newItem);
        } else {
            window.Player.inventory.material.push(newItem);
        }

        this.savePersistentData();
        window.UISystem.renderWarehouse(); // 重新渲染更新顯示
        window.UISystem.showToast(`已取出 ${itemName}`, "success");
    },

    /**
     * 存入倉庫
     */
    depositToWarehouse(index, category = 'material') {
        const item = Player.inventory[category][index];
        if (!item) return;

        const itemName = item.name;

        // 移除背包
        // 如果是裝備，先檢查是否已裝備 (理論上 UI 只顯示背包中的，但防呆)
        if (category === 'equipment') {
            // 檢查是否被裝備中 (雖然 UI 應該只顯示 inventory 中的，但 inventory 中的物品不應該是已裝備的)
            // 這裡直接移除即可，因為 inventory 和 equipment 是分開的引用
        }
        Player.inventory[category].splice(index, 1);

        // 加入倉庫
        if (!Player.warehouse[itemName]) {
            Player.warehouse[itemName] = 0;
        }
        Player.warehouse[itemName]++;

        this.savePersistentData();
        window.UISystem.renderWarehouse(); // 重新渲染
        window.UISystem.updateUI(); // 更新背包顯示
        window.UISystem.showToast(`已存入 ${itemName}`, "success");
    }
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

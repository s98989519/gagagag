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
            console.log("Saving persistent data...", {
                donatedItems: Array.from(Player.donatedItems),
                warehouse: Player.warehouse
            });
            const persistentData = {
                achievements: Array.from(Player.achievements),
                history: {
                    items: Array.from(Player.history.items)
                },
                donatedItems: Array.from(Player.donatedItems), // 新增: 博物館捐贈
                warehouse: Player.warehouse, // 新增: 倉庫
                // 局外屬性
                explorationPoints: Player.explorationPoints,
                baseAtkBonus: Player.baseAtkBonus,
                baseHpBonus: Player.baseHpBonus,
                maxDepthUnlocked: Player.maxDepthUnlocked,
                startDepthUnlocked: Player.startDepthUnlocked,
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
                Player.donatedItems = new Set(data.donatedItems || []); // 新增: 博物館捐贈
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
                if (data.startDepthUnlocked !== undefined) Player.startDepthUnlocked = data.startDepthUnlocked;

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
            Player.achievements = new Set(data.player.achievements || []);
            Player.history = data.player.history || { items: [] };
            Player.history.items = new Set(Player.history.items || []);
            Player.donatedItems = new Set(data.player.donatedItems || []);
            Player.warehouse = data.player.warehouse || {};

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
            const isShield = targetItem.type === 'shield';
            const baseVal = isShield ? targetItem.def : targetItem.val;

            // 盾牌特殊公式：基礎成長 + 強化等級額外加值 (每級 +1)
            const newBonus = isShield ? targetItem.enhance : 0;
            const newVal = baseVal + Math.floor(baseVal * targetItem.enhance * 0.2) + newBonus;

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
                    <button onclick="window.Game.showAlchemy()" class="btn" style="background:#673ab7; padding: 20px; font-size: 1.2em;">
                        ⚗️ 煉金術<br><span style="font-size:0.8em">合成藥水與轉化</span>
                    </button>
                    <button onclick="window.Game.renderLibrary()" class="btn" style="background:#00bcd4; padding: 20px; font-size: 1.2em;">
                        📚 圖書館<br><span style="font-size:0.8em">博物館與收藏</span>
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
            <div style="text-align:center; padding:20px;">
                <h3 style="color:#4caf50; font-size: 1.8em; margin-bottom: 20px;">🏋️ 訓練場</h3>
                
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
                
                <button onclick="window.Game.enterHub()" class="btn" style="background:#666; margin-top:20px; padding: 10px 30px;">返回大廳</button>
            </div>
        `;
        document.getElementById('hub-content').innerHTML = html;
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

            html += `
                <div style="background: linear-gradient(135deg, #333 0%, #222 100%); border: 1px solid ${unlocked ? '#9c27b0' : '#555'}; border-radius: 10px; padding: 15px; text-align: left; position: relative;">
                    <div style="font-size: 1.2em; color: ${unlocked ? '#e1bee7' : '#fff'}; margin-bottom: 5px;">
                        ${rune.name} ${unlocked ? '✅' : ''}
                    </div>
                    <div style="font-size: 0.9em; color: #ccc; margin-bottom: 10px; height: 40px;">${rune.desc}</div>
                    
                    ${materialsHtml}
                    
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
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3 style="color:#2196f3; font-size: 1.8em; margin:0;">🗺️ 地圖室</h3>
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
                <button onclick="window.Game.enterHub()" class="btn" style="background:#666; margin-top:30px; padding: 10px 30px;">返回大廳</button>
            </div>
        `;
        document.getElementById('hub-content').innerHTML = html;
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
        Player.pendingWarehouse = {}; // 重置運送清單

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
        if (player.equipment.shield && player.equipment.shield.def) {
            def += player.equipment.shield.def;
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

        // 3. 符文加成 (致命專注)
        if (Player.unlockedRunes && Player.unlockedRunes.includes('crit_boost')) {
            crit += CONFIG.runes.crit_boost.effect.val;
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
    donateItem(itemName, confirmed = false) {
        if (Player.donatedItems.has(itemName)) {
            this.log(`已經捐贈過 ${itemName} 了。`);
            return;
        }

        // 檢查擁有狀態
        const hasInWarehouse = Player.warehouse[itemName] && Player.warehouse[itemName] > 0;
        const invIdx = Player.inventory.material.findIndex(i => i.name === itemName);
        const hasInInv = invIdx !== -1;

        if (!hasInWarehouse && !hasInInv) {
            this.log("你沒有這個物品可以捐贈。");
            return;
        }

        // 確認對話框
        if (!confirmed) {
            window.UISystem.showConfirmModal(
                "捐贈確認",
                `確定要捐贈 <span style="color:#ffd700">${itemName}</span> 嗎？<br>捐贈後物品將會消失。`,
                () => this.donateItem(itemName, true)
            );
            return;
        }

        // 執行扣除
        if (hasInWarehouse) {
            Player.warehouse[itemName]--;
            if (Player.warehouse[itemName] <= 0) {
                delete Player.warehouse[itemName];
            }
        } else if (hasInInv) {
            Player.inventory.material.splice(invIdx, 1);
        }

        this._processDonation(itemName);
    },

    _processDonation(itemName) {
        // 1. 記錄當前已完成的套裝 ID
        const previouslyCompletedSets = new Set();
        CONFIG.museumSets.forEach(set => {
            if (this.isSetCompleted(set.id)) {
                previouslyCompletedSets.add(set.id);
            }
        });

        // 2. 執行捐贈
        Player.donatedItems.add(itemName);
        this.log(`捐贈了 ${itemName}！`);
        window.UISystem.showToast(`捐贈成功！已捐贈 ${itemName}`, "success");

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
        return set.items.every(item => Player.donatedItems.has(item));
    },

    /**
     * 觸發撤離點事件
     */
    triggerExtraction() {
        const epBonus = Math.floor(Player.depth / 10 * window.CONFIG.extractionBonusMultiplier);

        const html = `
            <div style="text-align:center;">

                <p style="font-size:1.1em; margin-bottom:20px;">你發現了一個安全的撤離點。</p>
                <p style="color:#aaa;">現在撤離可以獲得額外獎勵，並保留所有素材。</p>
                
                <div style="background:rgba(0, 188, 212, 0.1); padding:15px; border-radius:10px; margin:20px 0; border:1px solid #00bcd4;">
                    <h3 style="color:#00bcd4;">撤離獎勵</h3>
                    <p style="font-size:1.2em; color:#ffd700; margin-top:10px;">探索點數 (EP): +${epBonus}</p>
                    <p style="font-size:0.9em; color:#888;">(一般放棄僅獲得 ${Math.floor(Player.depth / 10)} EP)</p>
                    <p style="color:#69f0ae; margin-top:10px;">✅ 保留背包內所有素材</p>
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
            // 清空背包素材 (因為已經轉移)
            Player.inventory.material = [];
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
                <p style="color:#ffd700; font-size:1.1em;">已將 ${movedCount} 個素材存入倉庫 (含委託)。</p>
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

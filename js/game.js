/**
 * 幻想冒險 - 主遊戲邏輯
 * 包含玩家狀態、遊戲循環、UI系統、存檔系統
 * @版本 v2.0 (模組化)
 * @更新 2025-11-27
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
    // 賭場系統
    luckPoints: 0,  // 幸運值（失敗累積）
    casinoStats: {
        totalBet: 0,      // 總下注金額
        totalWin: 0,      // 總贏得金額
        gamesPlayed: 0,   // 賭博次數
        gachaStreak: 0,   // 抽獎連抽次數（未出稀有）
        epicStreak: 0     // 連續史詩抽中次數
    }
};

const GameState = {
    phase: "select_class",
    currentEnemy: null,
    merchantStock: [],
    blacksmithAttempts: 0,
    log: [],
    isLoading: false,
    inventorySortPreference: {
        equipment: 'default',  // 'default', 'rarity', 'type'
        consumable: 'default',
        material: 'default'
    }
};

// ========== 主遊戲對象 ==========

const Game = {
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
            this.loadGame();
        } else {
            this.updateUI();
        }
    },

    // ========== 永久數據系統 ==========

    /**
     * 保存永久數據（成就、圖鑑）
     */
    savePersistentData() {
        try {
            const persistentData = {
                achievements: Array.from(Player.achievements),
                history: {
                    items: Array.from(Player.history.items)
                }
            };
            localStorage.setItem('fantasy_adventure_persistent', JSON.stringify(persistentData));
        } catch (e) {
            console.error("Persistent data save failed", e);
        }
    },

    /**
     * 載入永久數據（成就、圖鑑）
     */
    loadPersistentData() {
        try {
            const raw = localStorage.getItem('fantasy_adventure_persistent');
            if (raw) {
                const data = JSON.parse(raw);
                Player.achievements = new Set(data.achievements || []);
                Player.history.items = new Set(data.history?.items || []);
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
    selectClass(classType) {
        Player.class = classType;
        const modal = document.getElementById('class-modal');
        modal.style.display = 'none';
        modal.classList.add('hidden'); // 強制隱藏

        if (classType === 'knight') {
            const lance = { name: "騎士長槍", type: "weapon", val: 12, rarity: "uncommon", price: 80, icon: "🔱" };
            ItemSystem.addItemToInventory(lance, false);
            ItemSystem.equip(0, 'equipment');
        } else if (classType === 'cultist') {
            const demonBuffs = Object.values(CONFIG.buffs).filter(b => b.type === 'demon');
            Player.buff = demonBuffs[Math.floor(Math.random() * demonBuffs.length)];
            this.updateUI();
        } else {
            this.updateUI();
        }

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
    },

    // ========== 遊戲循環 ==========

    /**
     * 進入下一個事件
     */
    nextEvent() {
        if (Player.hp <= 0) {
            this.restart();
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
            return;
        }

        if (Player.depth === 500) {
            CombatSystem.triggerCombat(true, false);
            this.updateUI();
            return;
        }

        if (Player.depth === 501) {
            alert("警告：你已進入深層領域！所有怪物實力大幅增強！");
        }

        // 哈比事件 (深度200後1%機率)
        if (Player.depth > 200 && Math.random() < 0.01) {
            EventSystem.triggerHarpy();
            this.updateUI();
            return;
        }

        // 賭場事件 (深度100後1%機率，每100層必定觸發)
        if (Player.depth > 100 && (Player.depth % 100 === 0 || Math.random() < 0.01)) {
            EventSystem.triggerCasino();
            this.updateUI();
            return;
        }

        // 隨機事件
        const rand = Math.random();

        if (rand < 0.05) {
            EventSystem.triggerHeal();
        } else if (rand < 0.10) {
            EventSystem.triggerStatue();
        } else if (rand < 0.13) {
            EventSystem.triggerClassEvent();
        } else if (rand < 0.16) {
            this.triggerBlacksmith();
        } else if (rand < 0.21) {
            // 5% 機率觸發神廟
            EventSystem.triggerTemple();
        } else if (rand < 0.32) {
            this.triggerMerchant();
        } else if (rand < 0.40) {
            EventSystem.triggerChest();
        } else {
            CombatSystem.triggerCombat(false, false);
        }

        this.updateUI();
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
        // 移除強化等級 (+1, +2 等)
        name = name.replace(/\s*\+\d+$/, '');
        // 移除後綴 (之XXX)
        name = name.replace(/之[^之]+$/, '');
        // 移除前綴詞 (XXX的)
        name = name.replace(/^.+的\s*/, '');
        return name.trim();
    },

    renderBlacksmithUI() { UISystem.renderBlacksmithUI(); },

    /**
     * 顯示工匠強化確認
     */
    showBlacksmithConfirm(idx) {
        if (GameState.blacksmithAttempts >= 2) {
            alert("本次工匠事件已強化2次，無法繼續！");
            return;
        }
        const item = Player.inventory.equipment[idx];
        if (Player.gold < Math.floor(item.price / 2)) {
            alert("金幣不足！");
            return;
        }

        // 獲取基礎名稱並找出所有可用素材
        const baseItemName = this.getBaseItemName(item.name);
        const materials = Player.inventory.equipment
            .map((i, index) => ({ item: i, index }))
            .filter(({ item: i, index }) => {
                return index !== idx &&
                    this.getBaseItemName(i.name) === baseItemName &&
                    ['weapon', 'armor', 'shield'].includes(i.type);
            });

        if (materials.length === 0) {
            alert(`沒有可用的素材！\n\n需要另一個「${baseItemName}」作為強化素材。`);
            return;
        }

        // 顯示素材選擇UI
        this.showMaterialSelection(idx, materials);
    },

    /**
     * 顯示素材選擇UI
     */
    showMaterialSelection(targetIdx, materials) {
        const area = document.getElementById('merchant-area');
        const item = Player.inventory.equipment[targetIdx];
        const enhance = item.enhance || 0;
        const cost = Math.floor(item.price / 2);
        const rate = getBlacksmithRate(enhance);
        const isShield = item.type === 'shield';
        const baseVal = isShield ? item.def : item.val;

        // 盾牌特殊公式：基礎成長 + 強化等級額外加值 (每級 +1)
        const currentBonus = isShield ? enhance : 0;
        const nextBonus = isShield ? (enhance + 1) : 0;

        const currentVal = baseVal + Math.floor(baseVal * enhance * 0.1) + currentBonus;
        const nextVal = baseVal + Math.floor(baseVal * (enhance + 1) * 0.1) + nextBonus;
        const statType = item.type === 'weapon' ? '攻擊力' : item.type === 'armor' ? '生命值' : '防禦力';

        let html = `
            <h4 style="margin-bottom:15px;">🔨 選擇要消耗的素材</h4>
            <div style="background:#222; padding:15px; border-radius:8px; margin-bottom:15px; display: flex; align-items: center; gap: 20px;">
                <div style="text-align: center; flex-shrink: 0; min-width: 100px;">
                    <div style="font-size: 40px; margin-bottom: 5px;">${item.icon}</div>
                    <div style="color:#69f0ae; font-weight: bold;">${item.name}</div>
                </div>
                <div style="flex-grow: 1; border-left: 1px solid #444; padding-left: 20px;">
                    <p style="margin:5px 0;"><strong>消耗成本:</strong> <span style="color:#ffd700">${cost} G</span> + 1個素材</p>
                    <p style="margin:5px 0;"><strong>成功率:</strong> <span style="color:${rate.color}">${rate.rate}%</span></p>
                    <p style="margin:5px 0;"><strong>${statType}變化:</strong> ${currentVal} → <span style="color:#69f0ae">${nextVal}</span> (+${nextVal - currentVal})</p>
                </div>
            </div>
            <h4 style="margin-bottom:10px;">📦 可用素材 (點擊選擇):</h4>
            <div class="merchant-grid" style="max-height: 300px; overflow-y: auto; padding-right: 5px;">
        `;

        materials.forEach(({ item: mat, index }) => {
            const matEnhance = mat.enhance || 0;
            const matDesc = window.ItemSystem.getItemDesc(mat);
            html += `
                <div class="merchant-item ${CONFIG.rarityDisplay[mat.rarity].color}" 
                     onclick="Game.confirmEnhance(${targetIdx}, ${index})"
                     style="cursor:pointer;">
                    <div class="m-top">
                        <span>${mat.icon} ${mat.name}</span>
                    </div>
                    <div class="m-desc">${matDesc}</div>
                </div>
            `;
        });

        html += '</div>';
        area.innerHTML = html;
        area.classList.remove('hidden');

        // 更新按鈕為返回
        this.setButtons("返回", "returnToBlacksmithList", "無", null, true);
    },

    /**
     * 返回工匠裝備選擇界面
     */
    returnToBlacksmithList() {
        this.renderEvent("🔨 發現工匠", `已強化 ${GameState.blacksmithAttempts}/2 次`, `可以繼續強化或離開<br><br><span style='color:#4caf50'>📊 本次強化進度: ${GameState.blacksmithAttempts}/2 次</span>`, "⚒️");
        this.renderBlacksmithUI();
        this.setButtons("離開", "closeBlacksmith", "無", null, true);
    },

    /**
     * 確認強化（已選擇素材）
     */
    confirmEnhance(targetIdx, materialIdx) {
        const item = Player.inventory.equipment[targetIdx];
        const material = Player.inventory.equipment[materialIdx];
        const enhance = item.enhance || 0;
        const cost = Math.floor(item.price / 2);
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
        const item = Player.inventory.equipment[idx];
        const enhance = item.enhance || 0;
        const cost = Math.floor(item.price / 2);
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
            const baseName = targetItem.name.replace(/\s*\+\d+$/, '');
            targetItem.name = `${baseName} +${targetItem.enhance}`;
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

    // ========== 商店系統 ==========

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
        for (let i = 0; i < 4; i++) {
            GameState.merchantStock.push(ItemSystem.generateRandomItem());
        }
    },

    renderMerchantShop() { UISystem.renderMerchantShop(); },

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
            this.renderMerchantShop();
        } else {
            alert("金幣不足！");
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

    /**
     * 解析商販交易
     */
    resolveMerchantTrade() {
        if (Player.gold < 66) { alert("金幣不足！"); return; }
        Player.gold -= 66;
        Game.showFloatingText("-66 G", "gold");

        if (Math.random() < 0.1) {
            Game.renderEvent("💸 被騙了！", "商人拿了錢就跑了！", "你什麼都沒得到。", "💨");
        } else {
            let item;
            if (Math.random() < 0.01) {
                const legends = CONFIG.itemPool.filter(i => i.rarity === 'legendary' || i.rarity === 'epic');
                item = { ...legends[Math.floor(Math.random() * legends.length)] };
            } else {
                item = ItemSystem.generateSpecificItem(['weapon', 'armor', 'shield', 'consumable']);
            }
            ItemSystem.addItemToInventory(item);
            Game.renderEvent("⚖️ 交易成功", "你獲得了一個神秘包裹...", `獲得 <span class='${CONFIG.rarityDisplay[item.rarity].color}'>${item.name}</span>`, "🎁");
        }
        Game.setButtons("繼續", "nextEvent", "無", null, true);
        Game.updateUI();
    },

    /**
     * 解析盜賊寶箱
     */
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
    // ========== 玩家死亡與重啟 ==========

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
        let cause = reason ? reason : "未知原因";
        this.renderEvent("☠️ 你死了", `死因：${cause}<br>冒險結束。最終深度: ${Player.depth}`, "重新整理網頁以重新開始", "🪦");
        this.setButtons("重新冒險", "restart", "無", null, true);
    },


    /**
     * 重新開始
     */
    restart() {
        location.reload();
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

        // 2. 職業加成 (人猿: +2 防禦)
        if (player.class === 'ape') {
            def += 2;
        }

        // 2. 詞綴加成 (guarding: 守護的)
        if (this.modifiers && this.modifiers.def) {
            // 目前詞綴 def 是百分比減傷，不計入面板防禦
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

        // 最後加上神廟給的永久攻擊力加成
        atk += (Player.templeAtkBonus || 0);

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
            crit += this.modifiers.crit;
        }

        return crit;
    },
    /**
     * 計算詞綴加成
     */
    calculateModifiers() {
        const mods = { atk: 0, hp: 0, def: 0, crit: 0, flee: 0, gold: 1.0, luck: 0 };
        const equipment = [Player.equipment.weapon, Player.equipment.armor, Player.equipment.shield];

        equipment.forEach(item => {
            if (!item) return;

            // 處理前綴
            if (item.prefix) {
                const affix = CONFIG.affixes.prefixes[item.prefix];
                if (affix) {
                    if (affix.effect === 'all') {
                        mods.atk += affix.val;
                        mods.hp += affix.val;
                        mods.def += affix.val;
                        mods.crit += affix.val;
                        mods.flee += affix.val;
                        mods.gold += affix.val;
                        mods.luck += affix.val;
                    } else if (mods[affix.effect] !== undefined) {
                        mods[affix.effect] += affix.val;
                    }
                }
            }

            // 處理後綴 (如果有定義 effect)
            if (item.suffix) {
                const affix = CONFIG.affixes.suffixes[item.suffix];
                if (affix && affix.effect && mods[affix.effect] !== undefined) {
                    mods[affix.effect] += affix.val;
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

        // 最後加上神廟給的永久生命加成
        newMaxHp += (Player.templeHpBonus || 0);

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
    log(msg) {
        console.log(msg);
    },

    // ========== UI系統委託（實際實現在ui.js） ==========

    triggerAnim(id, animClass) { UISystem.triggerAnim(id, animClass); },
    showFloatingText(text, color) { UISystem.showFloatingText(text, color); },
    renderEvent(title, subtitle, content, icon) { UISystem.renderEvent(title, subtitle, content, icon); },
    setButtons(mainText, mainAction, subText, subAction, disableSub) { UISystem.setButtons(mainText, mainAction, subText, subAction, disableSub); },
    updateUI() { UISystem.updateUI(); },
    updateStatsUI() { UISystem.updateStatsUI(); },
    renderInvList(id, items, category) { UISystem.renderInvList(id, items, category); }
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
        if (mainButton && !mainButton.disabled) {
            mainButton.click();
            mainButton.style.transform = 'scale(0.95)';
            setTimeout(() => { mainButton.style.transform = 'scale(1)'; }, 100);
        }
    }
    // S鍵：副按鈕
    if (event.key === 's' || event.key === 'S' || event.keyCode === 83) {
        const subButton = document.getElementById('btn-sub');
        if (subButton && !subButton.disabled) {
            subButton.click();
            subButton.style.transform = 'scale(0.95)';
            setTimeout(() => { subButton.style.transform = 'scale(1)'; }, 100);
        }
    }
});

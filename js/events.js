/**
 * 幻想冒險 - 事件系統模組
 * 處理所有隨機事件邏輯
 * @版本 v2.0
 * @更新 2025-11-27
 */

const EventSystem = {
    /**
     * 觸發治療事件
     */
    triggerHeal() {
        const oldHp = window.Player.hp;
        window.Player.hp = window.Player.maxHp;
        const healed = window.Player.hp - oldHp;

        window.GameState.phase = "event_end";
        window.Game.triggerAnim('event-icon', 'anim-spawn');
        window.Game.renderEvent(
            "💖 休息時刻",
            "你找到一處安全的地方休息。",
            `生命值 <span class='heal-text'>完全恢復</span> (恢復了 ${healed} 點)。`,
            "🛌"
        );
        if (healed > 0) window.Game.showFloatingText(`+${healed} HP`, "#69f0ae");
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
    },

    /**
     * 觸發雕像祈禱事件
     */
    triggerStatue() {
        window.GameState.phase = "event_end";
        window.Game.triggerAnim('event-icon', 'anim-spawn');
        window.Game.renderEvent(
            "🗿 祈禱聖像",
            "你發現了一座古老的聖像...",
            "是否要進行祈禱？",
            "🙏"
        );
        window.Game.setButtons("祈禱", "pray", "離開", "nextEvent", false);
    },

    /**
     * 祈禱
     */
    pray() {
        const isAngel = Math.random() < 0.5;
        const type = isAngel ? 'angel' : 'demon';
        const icon = isAngel ? "👼" : "😈";
        const options = Object.values(CONFIG.buffs).filter(b => b.type === type);

        if (options.length === 0) return;

        const selected = options[Math.floor(Math.random() * options.length)];

        // 如果已有 Buff，進入替換確認流程
        if (window.Player.buff) {
            this.pendingBuff = selected;
            this.confirmBuffReplacement();
            return;
        }

        // 否則直接獲得
        this.applyBuffDirect(selected, isAngel);
    },

    /**
     * 確認是否替換 Buff
     */
    confirmBuffReplacement() {
        const current = window.Player.buff;
        const next = this.pendingBuff;

        const curStyle = current.type === 'angel' ? 'angel-text' : 'demon-text';
        const nextStyle = next.type === 'angel' ? 'angel-text' : 'demon-text';

        const title = "抉擇時刻";
        const desc = `
            <div style="text-align:left; background:#222; padding:10px; border-radius:5px; margin-bottom:10px;">
                <div style="margin-bottom:5px;">當前效果: <span class="${curStyle}">${current.name}</span></div>
                <div style="color:#aaa; font-size:0.9em;">${current.desc}</div>
            </div>
            <div style="text-align:center; margin:10px 0;">⬇️ 是否替換為 ⬇️</div>
            <div style="text-align:left; background:#222; padding:10px; border-radius:5px;">
                <div style="margin-bottom:5px;">新效果: <span class="${nextStyle}">${next.name}</span></div>
                <div style="color:#aaa; font-size:0.9em;">${next.desc}</div>
            </div>
        `;

        window.Game.renderEvent(title, "你的身上已經有其他力量了...", desc, "⚖️");
        window.Game.setButtons("替換", "applyBuff", "保留", "keepBuff", false);
    },

    /**
     * 確認替換 Buff
     */
    applyBuff() {
        if (!this.pendingBuff) return;
        const isAngel = this.pendingBuff.type === 'angel';
        this.applyBuffDirect(this.pendingBuff, isAngel);
        this.pendingBuff = null;
    },

    /**
     * 直接應用 Buff (內部使用)
     */
    applyBuffDirect(buff, isAngel) {
        window.Player.buff = buff;
        const title = isAngel ? "天使聖像" : "惡魔聖像";
        const style = isAngel ? "angel-text" : "demon-text";
        const icon = isAngel ? "👼" : "😈";

        window.Game.triggerAnim('event-icon', 'anim-spawn');
        const desc = `你獲得了 <span class='${style}'>${buff.name}</span> 的效果。<br><small>${buff.desc}</small>`;
        window.Game.renderEvent(title, "祈禱得到了回應...", desc, icon);
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        window.Game.updateUI();
    },

    /**
     * 保留原有 Buff
     */
    keepBuff() {
        window.Game.renderEvent(
            "堅定信念",
            "你決定保留原本的力量。",
            "你拒絕了新的賜福，轉身離開。",
            "✋"
        );
        window.Game.setButtons("離開", "nextEvent", "無", null, true);
        this.pendingBuff = null;
    },

    /**
     * 觸發寶箱事件
     */
    triggerChest() {
        window.GameState.phase = "event_end";
        window.Game.triggerAnim('event-icon', 'anim-spawn');

        window.Game.renderEvent(
            "📦 發現寶箱",
            "你發現了一個神祕的寶箱...",
            "這個寶箱看起來有些年頭了，不知道裡面裝著什麼。<br>你要打開它嗎？還是謹慎地離開？",
            "📦"
        );

        // 設置按鈕：開啟 或 離開
        window.Game.setButtons("開啟", "openChest", "離開", "leaveChest", false);
    },

    /**
     * 開啟寶箱 (原 triggerChest 邏輯)
     */
    openChest() {
        // 不死鳥羽毛檢查 (1%)
        if (Math.random() < 0.01) {
            const feather = { ...CONFIG.phoenixFeather };
            window.ItemSystem.addItemToInventory(feather);
            window.Game.renderEvent(
                "📦 發現寶箱",
                "你打開了寶箱...",
                "奇蹟發生了！你獲得了 <span class='rarity-legendary'>不死鳥的羽毛</span>！",
                "🪶"
            );
            window.Game.setButtons("繼續", "nextEvent", "無", null, true);
            return;
        }

        // 彈弓檢查 (1%)
        if (Math.random() < 0.01 && CONFIG.lootData["彈弓"]) {
            const item = { ...CONFIG.lootData["彈弓"], name: "彈弓", type: "material" };
            window.ItemSystem.addItemToInventory(item);
            window.Game.renderEvent(
                "📦 發現寶箱",
                "你打開了寶箱...",
                `獲得了特殊的工具 <span class='rarity-rare'>彈弓</span>！`,
                "🪃"
            );
            window.Game.setButtons("繼續", "nextEvent", "無", null, true);
            return;
        }

        // 鉤子檢查 (1%)
        if (Math.random() < 0.01 && CONFIG.lootData["鉤子"]) {
            const item = { ...CONFIG.lootData["鉤子"], name: "鉤子", type: "material" };
            window.ItemSystem.addItemToInventory(item);
            window.Game.renderEvent(
                "📦 發現寶箱",
                "你打開了寶箱...",
                `獲得了特殊的工具 <span class='rarity-rare'>鉤子</span>！`,
                "🪝"
            );
            window.Game.setButtons("繼續", "nextEvent", "無", null, true);
            return;
        }

        // 普通寶箱邏輯
        this.handleNormalChest();
    },

    /**
     * 離開寶箱
     */
    leaveChest() {
        window.Game.renderEvent(
            "🏃 離開",
            "謹慎的選擇",
            "你覺得這個寶箱可能有詐，決定不冒險打開它。<br>你轉身繼續你的旅程。",
            "💨"
        );
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
    },

    /**
     * 處理普通寶箱
     */
    handleNormalChest() {
        const roll = Math.random();
        let desc = "";

        const isThief = window.Player.class === 'thief';
        const safeRoll = isThief ? roll * 0.8 : roll;

        if (safeRoll < 0.30) {
            const amount = Math.floor(Math.random() * 50) + 10 + (window.Player.depth * 2);
            window.Player.gold += amount;
            desc = `獲得了 <span class='gold-text'>${amount} G</span>`;
            window.Game.showFloatingText(`+${amount} G`, "#ffd700");
        } else if (safeRoll < 0.60) {
            const item = window.ItemSystem.generateSpecificItem(['consumable']);
            window.ItemSystem.addItemToInventory(item);
            desc = `獲得了 <span class='${CONFIG.rarityDisplay[item.rarity].color}'>${item.name}</span>`;
        } else if (safeRoll < 0.80) {
            const item = window.ItemSystem.generateSpecificItem(['weapon', 'armor', 'shield']);
            window.ItemSystem.addItemToInventory(item);
            desc = `獲得了 <span class='${CONFIG.rarityDisplay[item.rarity].color}'>${item.name}</span>`;
        } else if (safeRoll < 0.90) {
            desc = "裡面空空如也...";
        } else {
            const dmg = Math.floor(window.Player.maxHp * 0.15);
            window.Player.hp = Math.max(0, window.Player.hp - dmg);
            desc = `是陷阱！受到了 <span class='damage-text'>${dmg}</span> 點傷害。`;
            window.Game.triggerAnim('game-container', 'anim-screen-shake');
            window.Game.showFloatingText(`-${dmg} HP`, "red");
            if (window.Player.hp === 0) {
                window.Game.playerDie("死於寶箱陷阱");
                return;
            }
        }

        window.Game.renderEvent("📦 發現寶箱", "你打開了寶箱...", desc, "📦");
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
    },

    /**
     * 觸發哈比事件
     */
    triggerHarpy() {
        window.GameState.phase = "event_end";
        window.Game.triggerAnim('event-icon', 'anim-spawn');

        // 稻草人職業檢查
        if (window.Player.class === 'scarecrow') {
            window.Player.gold += 500;
            window.Game.showFloatingText("+500 G", "#ffd700");
            window.Game.renderEvent(
                "🦅 遭遇哈比",
                "一隻哈比突然襲來！",
                "身為稻草人，你的外表嚇跑了哈比！<br>撿到了牠掉落的 <span class='gold-text'>500 G</span>！",
                "🌾"
            );
            window.Game.setButtons("繼續", "nextEvent", "無", null, true);
            return;
        }

        // 彈弓檢查
        const slingIndex = window.Player.inventory.material.findIndex(i => i.name === '彈弓');
        if (slingIndex !== -1) {
            window.Player.inventory.material.splice(slingIndex, 1);
            window.Player.gold += 500;
            window.Game.showFloatingText("+500 G", "#ffd700");
            window.Game.renderEvent(
                "🦅 遭遇哈比",
                "一隻哈比突然襲來！",
                `你使用 <span class='rarity-rare'>彈弓</span> 擊退了牠！(彈弓已損壞)<br>撿到了牠掉落的 <span class='gold-text'>500 G</span>！`,
                "🪃"
            );
            window.Game.setButtons("繼續", "nextEvent", "無", null, true);
            return;
        }

        // 隨機結果
        const outcome = Math.random();
        let desc = "";

        if (outcome < 0.2) {
            window.Player.gold += 500;
            window.Game.showFloatingText("+500 G", "#ffd700");
            desc = "你成功擊退了哈比，撿到了它掉落的 <span class='gold-text'>500 G</span>！";
        } else {
            const type = Math.floor(Math.random() * 4);
            if (type === 0) {
                window.Player.inventory.equipment = [];
                desc = "哈比搶走了你背包裡所有的 <span class='damage-text'>裝備</span>！";
            } else if (type === 1) {
                window.Player.inventory.consumable = [];
                desc = "哈比搶走了你背包裡所有的 <span class='damage-text'>消耗品</span>！";
            } else if (type === 2) {
                window.Player.inventory.material = [];
                desc = "哈比搶走了你背包裡所有的 <span class='damage-text'>素材</span>！";
            } else {
                window.Player.gold = 0;
                desc = "哈比搶走了你身上所有的 <span class='damage-text'>金幣</span>！";
            }
        }

        window.Game.renderEvent("🦅 遭遇哈比", "一隻哈比突然從空中襲來！", desc, "🦅");
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
    },

    /**
     * 觸發跌倒事件
     */
    triggerTrip() {
        window.GameState.phase = "event_end";
        window.Game.triggerAnim('event-icon', 'anim-damage');

        // 鉤子檢查
        const hookIndex = window.Player.inventory.material.findIndex(i => i.name === '鉤子');
        let useHook = false;
        if (hookIndex !== -1) {
            window.Player.inventory.material.splice(hookIndex, 1);
            useHook = true;
        }

        // 人猿職業檢查
        const isApe = window.Player.class === 'ape';

        // 決定結果（30%好結果，或鉤子/人猿）
        const isGoodOutcome = useHook || isApe || (Math.random() < 0.3);

        if (isGoodOutcome) {
            // 好結果：抓住岩壁 -> 獲得隨機裝備
            const item = window.ItemSystem.generateSpecificItem(['weapon', 'armor', 'shield']);
            window.ItemSystem.addItemToInventory(item);

            let msg = "";
            if (useHook) {
                msg = `你滑倒了，但<span class='rarity-rare'>鉤子</span>勾住了岩壁！(鉤子已損壞)<br>你在岩壁上發現了 <span class='${CONFIG.rarityDisplay[item.rarity].color}'>${item.name}</span>！`;
            } else if (isApe) {
                msg = `你滑倒了，但憑藉<span class='block-text'>人猿的敏捷</span>輕鬆抓住了岩壁！<br>意外發現了 <span class='${CONFIG.rarityDisplay[item.rarity].color}'>${item.name}</span>！`;
            } else {
                msg = `你滑倒了，在千鈞一髮之際抓住了岩壁！<br>意外發現了 <span class='${CONFIG.rarityDisplay[item.rarity].color}'>${item.name}</span>！`;
            }
            window.Game.renderEvent("💫 意外之喜", "雖然跌倒了...", msg, "🪝");
        } else {
            // 壞結果（70%）：失去裝備
            const equippedTypes = [];
            if (window.Player.equipment.weapon) equippedTypes.push('weapon');
            if (window.Player.equipment.armor) equippedTypes.push('armor');
            if (window.Player.equipment.shield) equippedTypes.push('shield');

            if (equippedTypes.length > 0) {
                const lostType = equippedTypes[Math.floor(Math.random() * equippedTypes.length)];
                const item = window.Player.equipment[lostType];
                const lostItemName = item.name;
                window.Player.equipment[lostType] = null;
                window.Game.recalcStats();
                window.Game.renderEvent(
                    "💫 跌倒了！",
                    "地面突然崩塌，你摔了一跤...",
                    `你不小心弄丟了 <span class='damage-text'>${lostItemName}</span>！`,
                    "🦶"
                );
            } else {
                // 沒有裝備可以丟
                const dmg = 10;
                window.Player.hp = Math.max(1, window.Player.hp - dmg);
                window.Game.updateUI();
                window.Game.renderEvent(
                    "💫 跌倒了！",
                    "地面突然崩塌，你摔了一跤...",
                    `幸好身上沒裝備，但摔得不輕 (HP -${dmg})。`,
                    "🦶"
                );
            }
        }
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
    },

    /**
     * 觸發職業專屬事件
     */
    triggerClassEvent() {
        window.GameState.phase = "event_end";
        const playerClass = window.Player.class;

        if (playerClass === 'knight') this.handleKnightEvent();
        else if (playerClass === 'merchant') this.handleMerchantEvent();
        else if (playerClass === 'thief') this.handleThiefEvent();
        else if (playerClass === 'cultist') this.handleCultistEvent();
        else {
            // 稻草人和人猿沒有額外事件
            window.Game.nextEvent();
        }
    },

    /**
     * 騎士事件
     */
    handleKnightEvent() {
        window.Game.triggerAnim('event-icon', 'anim-spawn');
        window.Game.renderEvent(
            "⚔️ 騎士的職責",
            "發現一群被怪物包圍的探險者...",
            "是否出手相助？",
            "🛡️"
        );
        window.Game.setButtons("幫助 (60%勝)", "resolveKnightHelp", "無視", "nextEvent", false);
    },

    /**
     * 商販事件
     */
    handleMerchantEvent() {
        window.Game.triggerAnim('event-icon', 'anim-spawn');
        AudioSystem.playSFX('shop'); // 播放商店音效
        window.Game.renderEvent(
            "⚖️ 黑市交易",
            "遇到一名可疑的黑市商人。",
            "花費 66 G 購買神秘物品？(10% 被騙)",
            "🕵️"
        );
        window.Game.setButtons("交易 (66 G)", "resolveMerchantTrade", "離開", "nextEvent", false);
    },

    /**
     * 解析黑市交易
     */
    resolveMerchantTrade() {
        if (window.Player.gold < 66) {
            window.Game.showFloatingText("金幣不足！", "red");
            return;
        }

        window.Player.gold -= 66;
        window.Game.showFloatingText("-66 G", "yellow");

        if (Math.random() < 0.1) {
            window.Game.renderEvent("💸 被騙了！", "商人拿了錢就跑了！", "你什麼都沒得到...", "💨");
        } else {
            const item = window.ItemSystem.generateRandomItem();
            window.ItemSystem.addItemToInventory(item);
            window.Game.renderEvent("📦 交易成功", "商人交給你一個包裹...", `獲得 <span class='${CONFIG.rarityDisplay[item.rarity].color}'>${item.name}</span>`, "🤝");
        }
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        window.Game.updateUI();
    },

    /**
     * 盜賊事件
     */
    handleThiefEvent() {
        window.Game.triggerAnim('event-icon', 'anim-spawn');
        window.Game.renderEvent(
            "🗝️ 金色寶箱",
            "遠處發現一個散發光芒的寶箱...",
            "嘗試打開？(5% 獲得神器)",
            "✨"
        );
        window.Game.setButtons("打開", "resolveThiefChest", "離開", "nextEvent", false);
    },

    /**
     * 惡魔信徒事件
     */
    handleCultistEvent() {
        window.Game.triggerAnim('event-icon', 'anim-spawn');
        window.Game.renderEvent(
            "🎲 惡魔的遊戲",
            "惡魔邀請你玩比大小...",
            "贏得稀有裝備，輸了剩 1% 血量。",
            "😈"
        );
        window.Game.setButtons("接受挑戰", "resolveCultistGame", "拒絕", "nextEvent", false);
    },

    /**
     * 觸發賭場事件
     */
    triggerCasino() {
        window.GameState.phase = "casino";
        window.Game.triggerAnim('event-icon', 'anim-spawn');
        AudioSystem.playSFX('stranger'); // 播放陌生人音效
        window.Game.renderEvent(
            "🕴️ 神秘賭客",
            "走在半路時，遇到了一個陌生人...",
            "他突然搭話：「小子，要不要來賭一把？」",
            "🕴️"
        );
        this.showCasinoMenu();
    },

    /**
     * 顯示賭場選單
     */
    showCasinoMenu() {
        const playerGold = window.Player.gold;
        const html = `
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); 
                        padding: 20px; border-radius: 12px; border: 2px solid #0f3460;">
                
                <!-- 金幣顯示 -->
                <div style="text-align: center; margin-bottom: 20px; padding: 15px; 
                            background: rgba(255, 215, 0, 0.1); border-radius: 8px; 
                            border: 1px solid rgba(255, 215, 0, 0.3);">
                    <div style="font-size: 1.1em; color: #ffd700; font-weight: bold;">
                        💰 當前金幣：<span style="font-size: 1.3em;">${playerGold}</span> G
                    </div>
                </div>
                
                <!-- 遊戲選項 -->
                <div style="display: grid; gap: 12px;">
                    
                    <!-- 幸運輪盤 -->
                    <button onclick="EventSystem.playLuckyWheel()" 
                        style="padding: 18px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        border: 2px solid #9f7aea; border-radius: 10px; color: white; 
                        font-weight: bold; cursor: pointer; font-size: 1em; transition: all 0.3s;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 2em;">🎡</span>
                            <div style="text-align: left; flex: 1;">
                                <div style="font-size: 1.1em; margin-bottom: 4px;">幸運輪盤</div>
                                <div style="font-size: 0.85em; opacity: 0.9;">
                                    下注: 50/100/200G | 中獎率: 50%
                                </div>
                            </div>
                            <span style="font-size: 1.5em;">➤</span>
                        </div>
                    </button>
                    
                    <!-- 猜大小 -->
                    <button onclick="EventSystem.playDiceGame()" 
                        style="padding: 18px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                        border: 2px solid #fc6c85; border-radius: 10px; color: white; 
                        font-weight: bold; cursor: pointer; font-size: 1em; transition: all 0.3s;
                        box-shadow: 0 4px 15px rgba(240, 147, 251, 0.4);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 2em;">🎲</span>
                            <div style="text-align: left; flex: 1;">
                                <div style="font-size: 1.1em; margin-bottom: 4px;">猜大小</div>
                                <div style="font-size: 0.85em; opacity: 0.9;">
                                    100/500/1000G | 賠率: 1.8x | ⚠️ 豹子通殺
                                </div>
                            </div>
                            <span style="font-size: 1.5em;">➤</span>
                        </div>
                    </button>
                    
                    <!-- 裝備抽獎 -->
                    <button onclick="EventSystem.playGacha()" 
                        style="padding: 18px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); 
                        border: 2px solid #00d4ff; border-radius: 10px; color: white; 
                        font-weight: bold; cursor: pointer; font-size: 1em; transition: all 0.3s;
                        box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 2em;">🎁</span>
                            <div style="text-align: left; flex: 1;">
                                <div style="font-size: 1.1em; margin-bottom: 4px;">裝備抽獎</div>
                                <div style="font-size: 0.85em; opacity: 0.9;">
                                    100/300/1000G | 獲得稀有裝備
                                </div>
                            </div>
                            <span style="font-size: 1.5em;">➤</span>
                        </div>
                    </button>
                    
                </div>
                
                <!-- 提示信息 -->
                <div style="margin-top: 15px; padding: 10px; background: rgba(255, 107, 107, 0.1); 
                            border-radius: 6px; border: 1px solid rgba(255, 107, 107, 0.3); 
                            font-size: 0.9em; color: #ff9999; text-align: center;">
                    ⚠️ 賭博有風險，投注需謹慎！
                </div>
            </div>
        `;
        document.getElementById('merchant-area').innerHTML = html;
        document.getElementById('merchant-area').classList.remove('hidden');
        window.Game.setButtons("離開賭場", "leaveCasino", "無", null, true);
    },

    /**
     * 幸運輪盤
     */
    playLuckyWheel() {
        const html = `
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 20px; border-radius: 12px; border: 2px solid #0f3460; text-align: center;">
                <h3 style="color: #ffd700; margin-bottom: 20px;">🎡 幸運輪盤</h3>
                <div style="margin-bottom: 20px; color: #aaa;">請選擇下注金額</div>
                
                <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                    <button onclick="EventSystem.resolveLuckyWheel(50)" class="btn-action" 
                        style="background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); padding: 15px 30px; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; transition: transform 0.2s;">
                        50 G
                    </button>
                    <button onclick="EventSystem.resolveLuckyWheel(100)" class="btn-action" 
                        style="background: linear-gradient(135deg, #2196f3 0%, #1565c0 100%); padding: 15px 30px; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; transition: transform 0.2s;">
                        100 G
                    </button>
                    <button onclick="EventSystem.resolveLuckyWheel(200)" class="btn-action" 
                        style="background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%); padding: 15px 30px; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; transition: transform 0.2s;">
                        200 G
                    </button>
                </div>

                <div style="margin-top: 25px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; text-align: left; font-size: 0.9em; color: #ccc;">
                    <div>🎁 大獎 (5%): 10倍獎金</div>
                    <div>💎 中獎 (15%): 3倍獎金</div>
                    <div>🪙 小獎 (30%): 1.5倍獎金</div>
                    <div>😐 未中 (50%): 失去本金</div>
                </div>
                
                <button onclick="EventSystem.showCasinoMenu()" style="margin-top: 20px; background: transparent; border: 1px solid #666; color: #888; padding: 8px 20px; border-radius: 20px; cursor: pointer;">返回選單</button>
            </div>
        `;
        document.getElementById('merchant-area').innerHTML = html;
        window.Game.setButtons("...", null, "...", null, true);
    },

    resolveLuckyWheel(bet) {
        if (window.Player.gold < bet) {
            window.Game.showFloatingText("金幣不足！", "red");
            return;
        }

        // 初始化賭場統計
        if (!window.Player.casinoStats) {
            window.Player.casinoStats = {
                totalBet: 0,
                totalWin: 0,
                gamesPlayed: 0,
                gachaStreak: 0,
                epicStreak: 0
            };
        }

        // 幸運值加成計算（每5點+2%中獎率）
        const luckBonus = Math.floor((window.Player.luckPoints || 0) / 5) * 0.02;

        window.Player.gold -= bet;
        window.Player.casinoStats.totalBet += bet;
        window.Player.casinoStats.gamesPlayed++;

        const roll = Math.random() - luckBonus;  // 幸運值提升中獎率
        let result, reward, desc, resultStyle;

        if (roll < 0.05) {
            reward = bet * 10;
            result = "🎁 大獎！";
            resultStyle = "rarity-legendary";
            desc = `<div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%); border-radius: 10px; margin: 10px 0;">
                        <div style="font-size: 2em; margin-bottom: 10px;">🎊 恭喜中獎 🎊</div>
                        <div style="font-size: 1.3em; font-weight: bold; margin-bottom: 5px;">大獎區！</div>
                        <div style="font-size: 1.5em; color: #fff;">獲得 <span style="font-size: 1.3em;">${reward}</span> G</div>
                        <div style="font-size: 0.9em; margin-top: 5px; opacity: 0.9;">下注 ${bet}G → 獎金 ${reward}G (×10倍)</div>
                    </div>`;
            window.Player.luckPoints = 0;  // 中獎重置幸運值
            window.Player.casinoStats.totalWin += reward;
        } else if (roll < 0.20) {
            reward = bet * 3;
            result = "💎 中獎！";
            resultStyle = "rarity-epic";
            desc = `<div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); border-radius: 10px; margin: 10px 0;">
                        <div style="font-size: 1.8em; margin-bottom: 10px;">🎉 恭喜中獎 🎉</div>
                        <div style="font-size: 1.2em; font-weight: bold; margin-bottom: 5px;">中獎區</div>
                        <div style="font-size: 1.3em; color: #fff;">獲得 <span style="font-size: 1.2em;">${reward}</span> G</div>
                        <div style="font-size: 0.9em; margin-top: 5px; opacity: 0.9;">下注 ${bet}G → 獎金 ${reward}G (×3倍)</div>
                    </div>`;
            window.Player.luckPoints = 0;  // 中獎重置幸運值
            window.Player.casinoStats.totalWin += reward;
        } else if (roll < 0.50) {
            reward = Math.floor(bet * 1.5);
            result = "🪙 小獎";
            resultStyle = "rarity-uncommon";
            desc = `<div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 10px; margin: 10px 0;">
                        <div style="font-size: 1.5em; margin-bottom: 10px;">✨ 小獎 ✨</div>
                        <div style="font-size: 1.1em; color: #fff;">獲得 ${reward} G</div>
                        <div style="font-size: 0.9em; margin-top: 5px; opacity: 0.9;">下注 ${bet}G → 獎金 ${reward}G (×1.5倍)</div>
                    </div>`;
            window.Player.luckPoints = 0;  // 中獎重置幸運值
            window.Player.casinoStats.totalWin += reward;
        } else {
            reward = 0;
            result = "😐 未中獎";
            resultStyle = "";
            window.Player.luckPoints = (window.Player.luckPoints || 0) + 1;  // 失敗累積幸運值
            const luckDisplay = window.Player.luckPoints >= 5 ?
                `<div style="font-size: 0.85em; margin-top: 8px; color: #ffd700;">🍀 幸運值: ${window.Player.luckPoints} (下次中獎率+${Math.floor(window.Player.luckPoints / 5) * 2}%)</div>` : '';
            desc = `<div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); border-radius: 10px; margin: 10px 0;">
                        <div style="font-size: 1.5em; margin-bottom: 10px;">😅</div>
                        <div style="font-size: 1.1em; color: #fff;">很遺憾，未中獎</div>
                        <div style="font-size: 0.9em; margin-top: 5px; opacity: 0.8;">損失 ${bet} G</div>
                        <div style="font-size: 0.85em; margin-top: 8px; opacity: 0.7;">下次會更好！</div>
                        ${luckDisplay}
                    </div>`;
        }

        window.Player.gold += reward;
        window.Game.showFloatingText(reward > 0 ? `+${reward} G` : `-${bet} G`, reward > 0 ? "gold" : "red");
        window.Game.renderEvent("🎡 幸運輪盤", result, desc, "🎲");
        window.Game.updateUI();
        window.Game.checkAchievements();  // 檢查成就

        document.getElementById('merchant-area').classList.add('hidden');
        window.Game.setButtons("離開賭場", "leaveCasino", "無", null, true);
    },

    /**
     * 猜大小遊戲
     */
    playDiceGame() {
        const html = `
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 20px; border-radius: 12px; border: 2px solid #0f3460; text-align: center;">
                <h3 style="color: #ff6b6b; margin-bottom: 20px;">🎲 猜大小</h3>
                <div style="margin-bottom: 20px; color: #aaa;">請選擇下注金額</div>
                
                <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                    <button onclick="EventSystem.selectDiceBet(100)" class="btn-action" 
                        style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding: 15px 30px; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; transition: transform 0.2s;">
                        100 G
                    </button>
                    <button onclick="EventSystem.selectDiceBet(500)" class="btn-action" 
                        style="background: linear-gradient(135deg, #ff5722 0%, #e64a19 100%); padding: 15px 30px; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; transition: transform 0.2s;">
                        500 G
                    </button>
                    <button onclick="EventSystem.selectDiceBet(1000)" class="btn-action" 
                        style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); padding: 15px 30px; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; transition: transform 0.2s;">
                        1000 G
                    </button>
                </div>

                <div style="margin-top: 25px; font-size: 0.9em; color: #ccc;">
                    賠率 1.8倍 | ⚠️ 豹子通殺
                </div>
                
                <button onclick="EventSystem.showCasinoMenu()" style="margin-top: 20px; background: transparent; border: 1px solid #666; color: #888; padding: 8px 20px; border-radius: 20px; cursor: pointer;">返回選單</button>
            </div>
        `;
        document.getElementById('merchant-area').innerHTML = html;
        window.Game.setButtons("...", null, "...", null, true);
    },

    selectDiceBet(bet) {
        if (window.Player.gold < bet) {
            window.Game.showFloatingText("金幣不足！", "red");
            return;
        }

        const html = `
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 20px; border-radius: 12px; border: 2px solid #0f3460; text-align: center;">
                <h3 style="color: #ff6b6b; margin-bottom: 10px;">🎲 猜大小</h3>
                <div style="color: #ffd700; font-size: 1.2em; margin-bottom: 20px;">下注: ${bet} G</div>
                <div style="margin-bottom: 20px; color: #aaa;">請選擇預測結果</div>
                
                <div style="display: flex; justify-content: center; gap: 20px;">
                    <button onclick="EventSystem.resolveDiceGame(${bet}, '2')" class="btn-action" 
                        style="background: linear-gradient(135deg, #3f51b5 0%, #303f9f 100%); width: 120px; padding: 20px; border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; transition: transform 0.2s;">
                        <div style="font-size: 1.5em; margin-bottom: 5px;">小</div>
                        <div style="font-size: 0.8em; opacity: 0.8;">3-10點</div>
                    </button>
                    <button onclick="EventSystem.resolveDiceGame(${bet}, '1')" class="btn-action" 
                        style="background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%); width: 120px; padding: 20px; border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; transition: transform 0.2s;">
                        <div style="font-size: 1.5em; margin-bottom: 5px;">大</div>
                        <div style="font-size: 0.8em; opacity: 0.8;">11-18點</div>
                    </button>
                </div>
                
                <button onclick="EventSystem.playDiceGame()" style="margin-top: 20px; background: transparent; border: 1px solid #666; color: #888; padding: 8px 20px; border-radius: 20px; cursor: pointer;">重選金額</button>
            </div>
        `;
        document.getElementById('merchant-area').innerHTML = html;
    },

    resolveDiceGame(bet, guess) {
        if (window.Player.gold < bet) {
            window.Game.showFloatingText("金幣不足！", "red");
            return;
        }

        // 初始化賭場統計
        if (!window.Player.casinoStats) {
            window.Player.casinoStats = {
                totalBet: 0,
                totalWin: 0,
                gamesPlayed: 0,
                gachaStreak: 0,
                epicStreak: 0
            };
        }

        window.Player.gold -= bet;
        window.Player.casinoStats.totalBet += bet;
        window.Player.casinoStats.gamesPlayed++;

        // 擲3顆骰子
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const dice3 = Math.floor(Math.random() * 6) + 1;
        const total = dice1 + dice2 + dice3;

        // 檢查豹子
        const isBaozi = (dice1 === dice2 && dice2 === dice3);

        let result, desc;

        if (isBaozi) {
            result = "🎲 豹子！";
            desc = `骰子點數：${dice1}-${dice2}-${dice3} = ${total}<br><span class="demon-text">三顆相同，豹子通殺！</span><br>損失 ${bet} G`;
        } else {
            const isBig = total >= 11 && total <= 18;
            const isSmall = total >= 3 && total <= 10;

            if ((guess === "1" && isBig) || (guess === "2" && isSmall)) {
                const reward = Math.floor(bet * 1.8);
                window.Player.gold += reward;
                window.Player.casinoStats.totalWin += reward;
                result = guess === "1" ? "🎉 猜中大！" : "🎉 猜中小！";
                desc = `骰子點數：${dice1}-${dice2}-${dice3} = ${total}<br><span class="gold-text">獲得 ${reward} G！</span>`;
                window.Game.showFloatingText(`+${reward} G`, "gold");
            } else {
                result = "😢 猜錯了";
                desc = `骰子點數：${dice1}-${dice2}-${dice3} = ${total}<br>${guess === "1" ? "開小" : "開大"}，損失 ${bet} G`;
                window.Game.showFloatingText(`-${bet} G`, "red");
            }
        }

        window.Game.renderEvent("🎲 猜大小", result, desc, "🎲");
        window.Game.updateUI();
        window.Game.checkAchievements();

        document.getElementById('merchant-area').classList.add('hidden');
        window.Game.setButtons("離開賭場", "leaveCasino", "無", null, true);
    },

    /**
     * 裝備抽獎機
     */
    playGacha() {
        const html = `
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 20px; border-radius: 12px; border: 2px solid #0f3460; text-align: center;">
                <h3 style="color: #00d4ff; margin-bottom: 20px;">🎁 裝備抽獎</h3>
                <div style="margin-bottom: 20px; color: #aaa;">請選擇抽獎檔次</div>
                
                <div style="display: grid; gap: 15px;">
                    <button onclick="EventSystem.resolveGacha(1)" class="btn-action" 
                        style="background: linear-gradient(135deg, #607d8b 0%, #455a64 100%); padding: 15px; border: 2px solid #78909c; border-radius: 10px; color: white; cursor: pointer; text-align: left; display: flex; align-items: center; transition: transform 0.2s;">
                        <div style="font-size: 1.5em; margin-right: 15px;">📦</div>
                        <div>
                            <div style="font-weight: bold; font-size: 1.1em;">普通抽 (100 G)</div>
                            <div style="font-size: 0.85em; opacity: 0.8;">保底一般，5% 優質</div>
                        </div>
                    </button>
                    
                    <button onclick="EventSystem.resolveGacha(2)" class="btn-action" 
                        style="background: linear-gradient(135deg, #0288d1 0%, #01579b 100%); padding: 15px; border: 2px solid #29b6f6; border-radius: 10px; color: white; cursor: pointer; text-align: left; display: flex; align-items: center; transition: transform 0.2s;">
                        <div style="font-size: 1.5em; margin-right: 15px;">🔷</div>
                        <div>
                            <div style="font-weight: bold; font-size: 1.1em;">高級抽 (300 G)</div>
                            <div style="font-size: 0.85em; opacity: 0.8;">保底優質，10% 稀有，1% 史詩</div>
                        </div>
                    </button>
                    
                    <button onclick="EventSystem.resolveGacha(3)" class="btn-action" 
                        style="background: linear-gradient(135deg, #7b1fa2 0%, #4a148c 100%); padding: 15px; border: 2px solid #ab47bc; border-radius: 10px; color: white; cursor: pointer; text-align: left; display: flex; align-items: center; transition: transform 0.2s;">
                        <div style="font-size: 1.5em; margin-right: 15px;">👑</div>
                        <div>
                            <div style="font-weight: bold; font-size: 1.1em;">傳說抽 (1000 G)</div>
                            <div style="font-size: 0.85em; opacity: 0.8;">保底稀有，20% 史詩，5% 傳說</div>
                        </div>
                    </button>
                </div>
                
                <button onclick="EventSystem.showCasinoMenu()" style="margin-top: 20px; background: transparent; border: 1px solid #666; color: #888; padding: 8px 20px; border-radius: 20px; cursor: pointer;">返回選單</button>
            </div>
        `;
        document.getElementById('merchant-area').innerHTML = html;
        window.Game.setButtons("...", null, "...", null, true);
    },

    resolveGacha(tier) {
        let cost, minRarity, rates;

        if (tier === 1) {
            cost = 100;
            minRarity = "common";
            rates = { common: 0.95, uncommon: 0.05, rare: 0, epic: 0, legendary: 0 };
        } else if (tier === 2) {
            cost = 300;
            minRarity = "uncommon";
            rates = { common: 0, uncommon: 0.89, rare: 0.10, epic: 0.01, legendary: 0 };
        } else if (tier === 3) {
            cost = 1000;
            minRarity = "rare";
            rates = { common: 0, uncommon: 0, rare: 0.75, epic: 0.20, legendary: 0.05 };
        }

        if (window.Player.gold < cost) {
            window.Game.showFloatingText("金幣不足！", "red");
            return;
        }

        window.Player.gold -= cost;
        window.Game.showFloatingText(`-${cost} G`, "yellow");

        // 初始化賭場統計
        if (!window.Player.casinoStats) {
            window.Player.casinoStats = {
                totalBet: 0,
                totalWin: 0,
                gamesPlayed: 0,
                gachaStreak: 0,
                epicStreak: 0
            };
        }

        window.Player.casinoStats.gamesPlayed++;

        // 決定稀有度
        const roll = Math.random();
        let rarity;
        let acc = 0;

        for (let r in rates) {
            acc += rates[r];
            if (roll <= acc) {
                rarity = r;
                break;
            }
        }

        // 更新抽獎連抽計數
        if (rarity === 'epic' || rarity === 'legendary') {
            window.Player.casinoStats.epicStreak++;
            window.Player.casinoStats.gachaStreak = 0;
        } else {
            // Common, Uncommon, Rare 都算作「未中史詩」
            window.Player.casinoStats.gachaStreak++;
            window.Player.casinoStats.epicStreak = 0;
        }

        // 生成物品
        const pool = CONFIG.itemPool.filter(i =>
            i.rarity === rarity && ['weapon', 'armor', 'shield'].includes(i.type)
        );

        let item;
        if (pool.length > 0) {
            item = { ...pool[Math.floor(Math.random() * pool.length)] };
        } else {
            item = window.ItemSystem.generateSpecificItem(['weapon', 'armor', 'shield']);
        }

        window.ItemSystem.addItemToInventory(item, false);
        AudioSystem.playSFX('item');

        const rarityClass = CONFIG.rarityDisplay[item.rarity].color;
        const rarityLabel = CONFIG.rarityDisplay[item.rarity].label;

        let streakInfo = '';
        if (window.Player.casinoStats.epicStreak >= 2) {
            streakInfo = `<div style="color: #ffd700; font-size: 0.9em; margin-top: 10px;">🔥 史詩連抽: ${window.Player.casinoStats.epicStreak} 次</div>`;
        }
        if (window.Player.casinoStats.gachaStreak >= 10) {
            streakInfo = `<div style="color: #ff6b6b; font-size: 0.9em; margin-top: 10px;">😰 未中稀有: ${window.Player.casinoStats.gachaStreak} 次</div>`;
        }

        window.Game.renderEvent(
            "🎁 裝備抽獎",
            "光芒閃耀...",
            `恭喜獲得：<br><div class="${rarityClass}" style="font-size: 1.2em; margin: 10px 0;">${item.icon} ${item.name}</div><small>稀有度：${rarityLabel}</small>${streakInfo}`,
            "✨"
        );
        window.Game.updateUI();
        window.Game.checkAchievements();

        document.getElementById('merchant-area').classList.add('hidden');
        window.Game.setButtons("離開賭場", "leaveCasino", "無", null, true);
    },

    /**
     * 觸發陷阱事件
     */
    triggerTrap() {
        window.GameState.phase = "event_end";
        window.Game.triggerAnim('event-icon', 'anim-shake');

        const damagePercent = Math.random() * 0.15 + 0.05; // 5% - 20%
        const damage = Math.floor(window.Player.maxHp * damagePercent);
        window.Player.hp -= damage;
        if (window.Player.hp < 0) window.Player.hp = 0;

        window.Game.showFloatingText(`-${damage} HP`, "red");

        let desc = `你誤觸了機關陷阱！<br>受到 <span class='damage-text'>${damage}</span> 點傷害。`;
        if (window.Player.hp <= 0) {
            desc += "<br>你受了致命傷...";
        }

        window.Game.renderEvent(
            "⚠️ 危險陷阱",
            "咔嚓！",
            desc,
            "💣"
        );

        if (window.Player.hp <= 0) {
            window.Game.playerDie("死於陷阱");
        } else {
            window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        }
        window.Game.updateUI();
    },

    /**
     * 觸發神廟捐獻事件
     */
    triggerTemple() {
        window.GameState.phase = "event_end";
        window.Game.triggerAnim('event-icon', 'anim-spawn');

        // 檢查是否已經捐獻過（這裡使用一個臨時標記，或者直接通過按鈕狀態控制）
        // 為了簡單起見，我們在 donateTemple 中處理一次性限制

        window.Game.renderEvent(
            "⛩️ 古老神廟",
            "你來到了一座莊嚴的神廟前...",
            "據說捐獻金幣可以獲得神明的庇佑。<br>每次遭遇只能捐獻一次。",
            "⛩️"
        );

        const cost = 500 + (window.Player.depth * 3);
        const canDonate = window.Player.gold >= cost;
        const btnText = canDonate ? `捐獻 (${cost} G)` : `金幣不足 (${cost} G)`;
        const btnAction = canDonate ? "donateTemple" : null;

        // 主按鈕永遠是 "離開"，副按鈕是 "捐獻"
        window.Game.setButtons("離開", "nextEvent", btnText, btnAction, !canDonate);
    },

    /**
     * 神廟捐獻
     */
    donateTemple() {
        const cost = 500 + (window.Player.depth * 3);
        if (window.Player.gold < cost) {
            window.Game.showFloatingText("金幣不足！", "red");
            return;
        }

        window.Player.gold -= cost;
        window.Game.showFloatingText(`-${cost} G`, "yellow");

        const roll = Math.random();
        let title, desc, icon;

        if (roll < 0.33) {
            // 33% 什麼都沒發生
            title = "⛩️ 神廟的沉默";
            desc = "你捐獻了金幣，但什麼事都沒發生...<br>也許神明正在午睡？";
            icon = "🍃";
        } else if (roll < 0.66) {
            // 33% 獲得屬性增幅
            const isAtk = Math.random() < 0.5;
            if (isAtk) {
                // 攻擊力提升 10-25% (改為動態乘算)
                const percentage = Math.random() * 0.15 + 0.10; // 0.10 ~ 0.25
                const percentDisplay = Math.floor(percentage * 100);

                // 累積百分比加成
                window.Player.templeAtkMult = (window.Player.templeAtkMult || 0) + percentage;

                title = "⚔️ 神力的加持";
                desc = `一道金光籠罩了你！<br>攻擊力獲得 <span class='crit-text'>+${percentDisplay}%</span> 的最終加成！`;
                icon = "💪";
                window.Game.showFloatingText(`ATK +${percentDisplay}%`, "#ff0000");
            } else {
                // 生命上限提升 10-25% (改為動態乘算)
                const percentage = Math.random() * 0.15 + 0.10; // 0.10 ~ 0.25
                const percentDisplay = Math.floor(percentage * 100);

                // 累積百分比加成
                window.Player.templeHpMult = (window.Player.templeHpMult || 0) + percentage;

                // 立即刷新數值 (recalcStats 會處理乘算)
                window.Game.recalcStats();

                title = "💖 生命的祝福";
                desc = `溫暖的光芒治癒了你！<br>生命上限獲得 <span class='heal-text'>+${percentDisplay}%</span> 的最終加成！`;
                icon = "💗";
                window.Game.showFloatingText(`MaxHP +${percentDisplay}%`, "#69f0ae");
            }
        } else {
            // 33% 獲得隨機裝備 (衣服+藥水+盾牌)
            const armor = window.ItemSystem.generateSpecificItem(['armor']);
            const potion = window.ItemSystem.generateSpecificItem(['consumable']);
            const shield = window.ItemSystem.generateSpecificItem(['shield']);

            window.ItemSystem.addItemToInventory(armor, false);
            window.ItemSystem.addItemToInventory(potion, false);
            window.ItemSystem.addItemToInventory(shield, false);

            title = "🎁 神明的回禮";
            desc = "神壇上憑空出現了幾樣物品！<br>" +
                `獲得：<span class='${CONFIG.rarityDisplay[armor.rarity].color}'>${armor.name}</span>、` +
                `<span class='${CONFIG.rarityDisplay[potion.rarity].color}'>${potion.name}</span>、` +
                `<span class='${CONFIG.rarityDisplay[shield.rarity].color}'>${shield.name}</span>`;
            icon = "🎁";
        }

        window.Game.renderEvent(title, "捐獻完成", desc, icon);
        // 捐獻後只能離開，防止重複捐獻
        window.Game.setButtons("離開", "nextEvent", "無", null, true);
        window.Game.updateUI();
    },

    /**
     * 離開賭場
     */
    leaveCasino() {
        window.GameState.phase = "event_end";
        document.getElementById('merchant-area').classList.add('hidden');
        window.Game.renderEvent("🕴️ 告別賭客", "神秘人轉身消失在陰影中...", "「下次有緣再見。」", "👋");
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
    }
};

// 綁定到全域
if (typeof window !== 'undefined') {
    window.EventSystem = EventSystem;
    window.leaveCasino = () => EventSystem.leaveCasino();
}

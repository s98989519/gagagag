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
     * Show Lilith CSS Art
     */
    showLilith() {
        const LILITH_HTML = `
        <div class="demon-wrapper">
            <div class="demon-container">
                <div class="twin-tail left"></div>
                <div class="twin-tail right"></div>
                <div class="tail">
                    <div class="tail-curve"><div class="tail-tip"></div></div>
                </div>
                <div class="body-shape">
                    <div class="collar"></div>
                </div>
                <div class="hands">
                    <div class="hand left"></div>
                    <div class="hand right"></div>
                </div>
                <div class="head">
                    <div class="horn left"></div>
                    <div class="horn right"></div>
                    <div class="hair-bangs"></div>
                    <div class="hair-side left"></div>
                    <div class="hair-side right"></div>
                </div>
                <div class="lilith-glow"></div>
            </div>
        </div>`;

        // 延遲執行以確保 DOM 已渲染
        setTimeout(() => {
            const iconEl = document.getElementById('event-icon');
            if (iconEl) {
                iconEl.innerHTML = LILITH_HTML;
                iconEl.classList.remove('monster-icon'); // 移除預設樣式避免衝突
                iconEl.classList.add('lilith-glow');
                iconEl.style.width = "100px";
                iconEl.style.height = "100px";
                iconEl.style.overflow = "visible";
                iconEl.style.marginBottom = "50px"; // 增加下邊距
            }
        }, 100);
    },

    /**
     * 觸發雕像祈禱事件
     */
    triggerStatue() {
        // [New] 檢查是否持有"原罪之冠"，若有則觸發亡者雕像事件
        if (window.Player.inventory.material.some(m => m.id === 'm_crown_sin')) {
            this.triggerDeadStatue();
            return;
        }

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
     * [New] 觸發泉水事件
     */
    triggerSpring() {
        window.GameState.phase = "event_end";
        window.Game.triggerAnim('event-icon', 'anim-spawn');

        // 添加「安心」Buff（3回合）- 使用extraBuffs系统
        if (!window.Player.extraBuffs) window.Player.extraBuffs = [];

        window.Player.extraBuffs.push({
            id: 'peace_of_mind',
            name: '安心',
            icon: '💧',
            desc: '每回合回復 5% 最大生命值',
            turns: 3,
            newThisTurn: true,
            healPercent: 0.05
        });

        window.Game.log('你獲得了 Buff：💧 安心（3回合）');

        window.Game.renderEvent(
            "💧 平靜的泉水",
            "你遇到了一處平靜的泉水，你感到很安全",
            `<div style="text-align: center; color: #4fc3f7; margin: 15px 0;">
                <div style="font-size: 1.1em; margin-bottom: 10px;">✨ 你獲得了「安心」Buff（3回合）</div>
                <div style="font-size: 0.9em; color: #aaa;">每回合回復 5% 最大生命值</div>
                <div style="margin-top: 20px; padding: 15px; border-top: 1px solid #333;">
                    <div style="font-size: 1em; color: #fff; margin-bottom: 10px;">你想要：</div>
                </div>
            </div>`,
            "💧"
        );

        window.Game.setButtons("飲用泉水", "drinkSpring", "裝一些泉水走", "collectSpring", false);
    },

    /**
     * [New] 飲用泉水（立即回復50%生命）
     */
    drinkSpring() {
        const healAmount = Math.floor(window.Player.maxHp * 0.5);
        window.Player.hp = Math.min(window.Player.hp + healAmount, window.Player.maxHp);

        window.Game.log(`你飲用了清澈的泉水，回復了 ${healAmount} 點生命值。`);
        window.UISystem.showToast(`💧 回復了 ${healAmount} HP！`, 'success');

        window.UISystem.updateUI();
        window.Game.nextEvent();
    },

    /**
     * [New] 收集泉水（獲得罐裝泉水）
     */
    collectSpring() {
        const bottledWater = {
            id: "bottled_spring_water",
            name: "罐裝泉水",
            type: "consumable",
            rarity: "uncommon",
            price: 100,
            icon: "💧",
            desc: "來自平靜泉水的清澈泉水，使用時回復 20% 最大生命值。",
            effect: { type: "heal_percent", val: 0.2 }
        };

        window.Player.inventory.consumable.push(bottledWater);
        window.Game.log('你裝了一些泉水，獲得了「罐裝泉水」。');
        window.UISystem.showToast('💧 獲得了「罐裝泉水」！', 'success');

        window.UISystem.updateUI();
        window.Game.nextEvent();
    },


    /**
     * 觸發亡者雕像 (召喚神之代行者)
     */
    triggerDeadStatue() {
        window.GameState.phase = "event_end";
        window.Game.triggerAnim('event-icon', 'anim-spawn'); // 可換成更詭異的動畫
        window.Game.renderEvent(
            "☠️ 亡者的雕像",
            "這座雕像散發著令人窒息的壓迫感...",
            "它似乎在渴望某種罪惡的獻祭。",
            "☠️"
        );
        window.Game.setButtons("放上原罪之冠", "triggerGodAgent", "離開", "nextEvent", false);
    },

    /**
     * 觸發神之代行者 Boss 戰
     */
    triggerGodAgent() {
        // 查找神之代行者資料
        const boss = CONFIG.infernoMonsters.find(m => m.name === "神之代行者");
        if (!boss) {
            console.error("God Agent boss not found in CONFIG!");
            window.Game.showFloatingText("召喚失敗...", "red");
            return;
        }

        // 播放音效或特殊效果 (可選)
        if (window.AudioSystem) window.AudioSystem.playSFX('boss_spawn');

        // 觸發戰鬥 - 強制指定敵人
        // 注意：這裡需要 CombatSystem 支援 triggerCombatWithEnemy，或者我們修改 triggerCombat
        // 目前先假設 CombatSystem.triggerCombat 支援傳入特定怪物對象，或者我們直接操作

        // 為了相容性，我們在 CombatSystem 中可能需要一個新方法，或者直接在這裡設置
        window.GameState.currentEnemy = { ...boss, maxHp: boss.hp };
        // window.GameState.phase = "combat"; // startCombatWithEnemy 會處理
        window.CombatSystem.startCombatWithEnemy(window.GameState.currentEnemy);

        window.Game.updateUI();
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

        // [New] 巧克力檢查 (5%)
        if (Math.random() < 0.05) {
            const choco = { ...window.CONFIG.specialItems.chocolate };
            window.ItemSystem.addItemToInventory(choco);
            window.Game.renderEvent(
                "📦 發現寶箱",
                "你打開了寶箱...",
                "一陣甜蜜的香氣飄了出來...<br>獲得 <span class='rarity-mythic'>充滿魔力的巧克力</span>！",
                "🍫"
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
    /**
     * 觸發哈比事件 (新版 v2.0)
     */
    triggerHarpy() {
        window.GameState.phase = "event_end";
        window.Game.triggerAnim('event-icon', 'anim-spawn');

        // 1. 特殊應對：稻草人
        if (window.Player.class === 'scarecrow') {
            window.Game.renderEvent(
                "🦅 遭遇哈比",
                "一隻貪婪的哈比擋住了去路！",
                "因為你是個稻草人，哈比似乎對你沒興趣，反而被嚇跑了。<br>掉落了 <span class='gold-text'>500 G</span>！",
                "🌾"
            );
            window.Player.gold += 500;
            window.Game.showFloatingText("+500 G", "#ffd700");
            window.Game.setButtons("繼續", "nextEvent", "無", null, true);
            return;
        }

        // 2. 特殊應對：彈弓
        const slingIndex = window.Player.inventory.material.findIndex(i => i.name === '彈弓');
        if (slingIndex !== -1) {
            window.Game.renderEvent(
                "🦅 遭遇哈比",
                "一隻貪婪的哈比擋住了去路！",
                `你可以使用 <span class='rarity-rare'>彈弓</span> 輕鬆擊退牠。<br>(消耗彈弓，獲得 500 G)`,
                "🦅"
            );
            // 按鈕：使用彈弓 / 常規選項 (戰鬥/付錢)
            // 為了簡化，如果直接有彈弓就提供額外按鈕，或者替代戰鬥邏輯
            // 這裡我們提供 3 個按鈕 (UI需支援，若不支援則用 setButtons 三參數變通)
            // 若只有兩個按鈕位，則將 "彈弓" 取代 "逃跑/付錢"
            window.Game.setButtons("戰鬥", "resolveHarpyFight", "彈弓射擊", "resolveHarpySling", false);
            return;
        }

        // 3. 特殊應對：半獸人系列飾品
        const orcAccessories = (window.Player.equipment.accessories || []).filter(acc =>
            acc && (acc.id === 'acc_orc_1' || acc.id === 'acc_orc_2' || acc.id === 'acc_orc_3')
        );

        if (orcAccessories.length > 0) {
            // 取最高等級的飾品
            const hasOrc3 = orcAccessories.some(acc => acc.id === 'acc_orc_3');
            const hasOrc2 = orcAccessories.some(acc => acc.id === 'acc_orc_2');
            const hasOrc1 = orcAccessories.some(acc => acc.id === 'acc_orc_1');

            if (hasOrc3) {
                // 威望號角：必定擊退 + 額外獎勵
                window.Player.gold += 800;
                window.Game.showFloatingText("+800 G", "#ffd700");
                window.Game.renderEvent(
                    "📯 威望顯赫",
                    "一隻貪婪的哈比擋住了去路！",
                    "你的<span class='rarity-epic'>威望號角</span>散發出駭人的氣勢！<br>哈比被嚇得魂飛魄散，丟下所有財物逃走了。<br>獲得 <span class='gold-text'>800 G</span>！",
                    "📯"
                );
                window.Game.setButtons("繼續", "nextEvent", "無", null, true);
                return;
            } else if (hasOrc2) {
                // 獸角護符：必定擊退
                window.Player.gold += 600;
                window.Game.showFloatingText("+600 G", "#ffd700");
                window.Game.renderEvent(
                    "🦴 獸王之威",
                    "一隻貪婪的哈比擋住了去路！",
                    "你的<span class='rarity-rare'>獸角護符</span>釋放出野獸的威壓！<br>哈比不敢靠近，慌忙逃走並掉落了金幣。<br>獲得 <span class='gold-text'>600 G</span>！",
                    "🦴"
                );
                window.Game.setButtons("繼續", "nextEvent", "無", null, true);
                return;
            } else if (hasOrc1) {
                // 斷劍墜飾：50% 機率擊退
                if (Math.random() < 0.5) {
                    window.Player.gold += 500;
                    window.Game.showFloatingText("+500 G", "#ffd700");
                    window.Game.renderEvent(
                        "⚔️ 戰士之魂",
                        "一隻貪婪的哈比擋住了去路！",
                        "你的<span class='rarity-common'>斷劍墜飾</span>喚醒了你的戰意！<br>哈比感受到你的殺氣，嚇得飛走了。<br>獲得 <span class='gold-text'>500 G</span>！",
                        "⚔️"
                    );
                    window.Game.setButtons("繼續", "nextEvent", "無", null, true);
                    return;
                }
                // 否則繼續正常流程（戰鬥或付錢）
            }
        }

        // 4. 一般應對：戰鬥 或 付錢
        window.Game.renderEvent(
            "🦅 遭遇哈比",
            "貪婪的哈比盯上了你的錢袋！",
            "「嘎！交出閃亮的東西，或者死！」<br>哈比身手矯健 (閃避率 20%)，但也許你能打敗她？",
            "🦅"
        );

        window.Game.setButtons("戰鬥 (奪回財物)", "resolveHarpyFight", "破財消災 (444 G)", "resolveHarpyPay", false);
    },

    resolveHarpySling() {
        const slingIndex = window.Player.inventory.material.findIndex(i => i.name === '彈弓');
        if (slingIndex !== -1) {
            window.Player.inventory.material.splice(slingIndex, 1);
            window.Player.gold += 500;
            window.Game.showFloatingText("+500 G", "#ffd700");
            window.Game.renderEvent(
                "🦅 擊退哈比",
                "你精準的一擊命中了哈比！",
                "哈比慘叫著飛走了，掉落了一袋金幣。<br>獲得 <span class='gold-text'>500 G</span> (彈弓已損壞)",
                "🪃"
            );
            window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        } else {
            // 異常處理
            this.triggerHarpy();
        }
    },

    resolveHarpyPay() {
        if (window.Player.gold >= 444) {
            window.Player.gold -= 444;
            window.Game.showFloatingText("-444 G", "yellow");
            window.Game.renderEvent(
                "💸 破財消災",
                "你丟出了 444 枚金幣...",
                "哈比興奮地接住金幣，心滿意足地飛走了。<br>至少你保住了性命和其他財物。",
                "💨"
            );
            window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        } else {
            window.Game.showFloatingText("金幣不足！", "red");
            // 錢不夠只能戰鬥
            window.Game.renderEvent(
                "🦅 遭遇哈比",
                "你的金幣不夠支付過路費！",
                "哈比看起來很生氣，準備發動攻擊！",
                "🦅"
            );
            window.Game.setButtons("應戰", "resolveHarpyFight", "無", null, true);
        }
    },

    resolveHarpyFight() {
        // 生成哈比敵人
        const harpy = {
            name: "貪婪的哈比",
            tier: "elite",
            icon: "🦅",
            hp: 120, // 基礎
            atk: 12, // 基礎
            evasion: 0, // 由 Agile 詞綴提供 +0.2
            drop: "哈比的羽毛", // 假設 config 有這個或者直接給
            baseGold: 500, // 勝利獎勵
            prefix: CONFIG.monsterAffixes.prefixes['agile'] // 強制賦予靈活詞綴
        };

        // 應用層數成長 (手動計算或依賴 CombatSystem.createEnemy 的部分邏輯)
        // 這裡我們直接呼叫 startCombatWithEnemy，但為了確保數值正確，這是一個自定義怪
        // CombatSystem.createEnemy 會重新計算 scaling，我們最好傳入模板讓它算

        // 更好的方式：利用 startCombatWithEnemy 傳入完整物件，避開 createEnemy 的隨機生成
        // 但我們需要層數 scaling。
        // 我們手動 scale 吧，參考 combat.js 的公式
        // hp: base * (1 + depth * 0.04)
        // atk: base * (1 + depth * 0.06)

        const depth = window.Player.depth;
        const hpMul = 1 + (depth * 0.04);
        const atkMul = 1 + (depth * 0.06);

        harpy.maxHp = Math.floor(harpy.hp * hpMul);
        harpy.hp = harpy.maxHp;
        harpy.atk = Math.floor(harpy.atk * atkMul);

        // 應用詞綴加成 (Agile: +20% evasion)
        // 雖然 prefix 設定了，但 combatSystem 可能不會自動應用到屬性上(視實作而定)
        // 我們手動加比較保險
        harpy.evasion = 0.2;

        // 名稱處理
        harpy.name = `<span class="affix-prefix">靈活的</span> ${harpy.name}`;

        window.CombatSystem.startCombatWithEnemy(harpy);
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
        // [New] 煉獄模式入口檢查
        if (window.Player.inInferno) {
            this.processInfernoEvent();
            return;
        }

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
     * 顯示魅魔莉莉絲 (使用 CSS Art)
     */
    showLilith() {
        const demonHTML = `
            <div class="demon-wrapper">
                <div class="demon-container">
                    <div class="twin-tail left"></div>
                    <div class="twin-tail right"></div>
                    <div class="tail">
                        <div class="tail-curve"><div class="tail-tip"></div></div>
                    </div>
                    <div class="body-shape">
                        <div class="collar"></div>
                    </div>
                    <div class="hands">
                        <div class="hand left"></div>
                        <div class="hand right"></div>
                    </div>
                    <div class="head">
                        <div class="hair-bangs"></div>
                        <div class="hair-side left"></div>
                        <div class="hair-side right"></div>
                        <div class="horn left"></div>
                        <div class="horn right"></div>
                    </div>
                    <div class="lilith-glow"></div>
                </div>
            </div>
        `;

        // 延遲執行以確保 DOM 已渲染
        setTimeout(() => {
            const iconEl = document.getElementById('event-icon');
            if (iconEl) {
                iconEl.innerHTML = demonHTML;
                iconEl.classList.remove('monster-icon'); // 移除預設樣式避免衝突
                iconEl.style.width = "100px";
                iconEl.style.height = "100px";
                iconEl.style.overflow = "visible";
                iconEl.style.marginBottom = "50px"; // 增加下邊距
            }
        }, 100);
    },

    /**
     * 離開賭場
     */
    leaveCasino() {
        window.GameState.phase = "event_end";
        document.getElementById('merchant-area').classList.add('hidden');
        window.Game.renderEvent("🕴️ 告別賭客", "神秘人轉身消失在陰影中...", "「下次有緣再見。」", "👋");
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
    },

    /**
     * 開啟煉獄之門
     */
    triggerInfernoGate() {
        window.Player.inInferno = true;
        window.Player.depth = 0;
        document.body.classList.add('inferno-mode');
        window.GameState.phase = "event_end";
        window.Game.triggerAnim('game-container', 'anim-screen-shake');
        window.Game.renderEvent("🔥 煉獄之門開啟", "煉獄聖經燃燒殆盡，周圍的世界崩塌重組...", "你已墮入煉獄。舊世界的規則不再適用。", "⛩️");

        // 移除煉獄聖經
        const idx = window.Player.inventory.material.findIndex(i => i.name === "煉獄聖經");
        if (idx > -1) window.Player.inventory.material.splice(idx, 1);

        window.Game.setButtons("面對恐懼", "nextEvent", "無", null, true);
        window.Game.checkAchievements(); // 檢查踏入地獄成就
    },

    /**
     * 處理煉獄模式事件
     */
    processInfernoEvent() {
        // [New] 寧靜的花園 (0.05% 機率)
        if (Math.random() < 0.0005) {
            this.triggerGardenEvent();
            return;
        }

        // 第 10 層保底觸發史萊姆長老
        if (window.Player.depth === 10) {
            this.triggerSlimeElderEvent();
            return;
        }

        // 0. [New] 莉莉絲的拜訪 (擁有祝福且未獻祭時觸發)
        if (window.Player.lilithBlessing && !window.Player.lilithSacrificed) {
            // 檢查是否已擁有神聖光劍，如果沒有則高機率觸發
            const hasSword = window.Player.inventory.equipment.some(i => i.name === '神聖光劍') ||
                (window.Player.equipment.weapon && window.Player.equipment.weapon.name === '神聖光劍');

            // 如果沒有劍，給予較高觸發權重 (例如 5%)
            if (!hasSword && Math.random() < 0.05) {
                this.triggerLilithVisit();
                return;
            }
        }

        const rand = Math.random();

        // 1. 史萊姆長老 (1%)
        if (rand < 0.01) { this.triggerSlimeElderEvent(); return; }

        // 2. 煉獄鍛造 (3%) -> 0.04
        if (rand < 0.04) { this.triggerInfernoForge(); return; }

        // 3. 七宗罪試煉 (5%) -> 0.09
        if (rand < 0.09) { this.triggerSinEvent(); return; }

        // 4. 米諾陶洛斯迷宮 (9%) -> 0.18
        if (rand < 0.18) { this.triggerMinotaurMaze(); return; }

        // 5. 惡魔商人 (10%) -> 0.28
        if (rand < 0.28) { this.triggerDemonMerchant(); return; }

        // 6. 虛空裂隙 (10%) -> 0.38
        if (rand < 0.38) { this.triggerVoidRift(); return; }

        // 7. 鮮血祭壇 (10%) -> 0.48
        if (rand < 0.48) { this.triggerBloodAltar(); return; }

        // 8. 牛頭人亂入 (3%) -> 0.51
        if (rand < 0.51) { this.triggerMinotaur(); return; }

        // 9. 死寂雕像 (5%) -> 0.56
        if (rand < 0.56) { this.triggerDeadStatue(); return; }

        // 10. 預設：煉獄死鬥
        this.triggerInfernoCombat();
        window.Game.updateUI();
    },

    // ================= 煉獄專屬事件 =================

    // --- 煉獄鍛造 ---
    // --- [New] 莉莉絲劇情線事件 ---

    triggerMysteriousLibrary() {
        window.GameState.phase = "event_end";
        window.UISystem.triggerAnim('event-icon', 'anim-spawn');

        const hasNote = window.Player.inventory.material.some(i => i.name === "紙條");
        if (hasNote) {
            // 已經有紙條了，讀點書
            window.Game.renderEvent("📚 神秘圖書館", "這裡充滿了古老的智慧。", "你在書堆中找到了一些關於惡魔弱點的記載。<br>(獲得少量經驗/知識 - 暫無實質效果)", "📖");
            window.Game.setButtons("離開", "nextEvent", "無", null, true);
        } else {
            window.Game.renderEvent("📚 神秘圖書館", "這是一座不存在於地圖上的圖書館。", "書架上的一本紅色古書似乎在呼喚你...", "📕");
            window.Game.setButtons("翻閱古書", "resolveLibrarySearch", "離開", "nextEvent", false);
        }
    },

    resolveLibrarySearch() {
        if (Math.random() < 0.5) {
            const note = { ...window.CONFIG.specialItems.note };
            window.ItemSystem.addItemToInventory(note);
            window.Game.renderEvent("📕 禁忌的知識", "你翻開了古書，一張紙條飄落下來。", `上面寫著一個名字...<br>獲得 <span class='rarity-mythic'>${note.name}</span>`, "📄");
        } else {
            const dmg = Math.floor(window.Player.maxHp * 0.1);
            window.Player.hp -= dmg;
            window.Game.showFloatingText(`-${dmg} HP`, "red");
            window.Game.renderEvent("📕 精神衝擊", "古書中的文字扭曲蠕動！", `你感到一陣暈眩...<br>損失 <span class='damage-text'>${dmg} HP</span>`, "💫");
            if (window.Player.hp <= 0) { window.Game.checkDeath("死於禁忌知識"); return; }
        }
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        window.Game.updateUI();
    },

    triggerLilithVisit() {
        window.GameState.phase = "event_end";
        this.showLilith(); // 使用 CSS Art

        window.Game.renderEvent("💗 深夜的訪客",
            "當你休息時，熟悉的香氣傳來...",
            "「笨蛋，別死在那個冒牌貨手裡。」<br>莉莉絲將一把散發著神聖氣息的劍交給了你。",
            ""); // icon 空置因為用了 showLilith

        // 給予神聖光劍
        const sword = { ...window.CONFIG.specialItems.holy_sword };
        window.ItemSystem.addItemToInventory(sword);

        window.Game.setButtons("收下", "nextEvent", "無", null, true);
    },

    // --- 魅魔餵食事件鏈 ---
    triggerSuccubusEvent() {
        window.GameState.phase = "event_end";
        window.UISystem.triggerAnim('event-icon', 'anim-spawn');

        const stage = window.Player.succubusStage || 0;

        if (stage === 0) {
            // Stage 0: 初遇
            window.Game.renderEvent(
                "💋 虛弱的魅魔",
                "你在路邊發現了一隻虛弱的魅魔...",
                "「這該死的詛咒...我需要魔力...」<br>她看起來快要消散了。",
                "😈"
            );
            this.showLilith();
            // 檢查是否有巧克力
            const hasChoco = window.Player.inventory.material.some(i => i.name === "充滿魔力的巧克力");
            if (hasChoco) {
                window.Game.setButtons("給予巧克力", "resolveSuccubusFeedingA", "無視", "nextEvent", false);
            } else {
                window.Game.setButtons("無視", "nextEvent", "無", null, true);
            }

        } else if (stage === 1) {
            // Stage 1: 再次相遇
            window.Game.renderEvent(
                "💋 恢復中的魅魔",
                "你再次遇見了那隻魅魔。",
                "「又是你？上次的魔力還不錯...但我還需要更多。」<br>她的氣色看起來好多了。",
                "😈"
            );
            this.showLilith();
            const hasChoco = window.Player.inventory.material.some(i => i.name === "充滿魔力的巧克力");
            if (hasChoco) {
                window.Game.setButtons("給予巧克力", "resolveSuccubusFeedingB", "離開", "nextEvent", false);
            } else {
                window.Game.setButtons("離開", "nextEvent", "無", null, true);
            }

        } else if (stage === 2) {
            // Stage 2: 最後的請求
            window.Game.renderEvent(
                "💋 魅魔的誘惑",
                "魅魔容光煥發地出現在你面前。",
                "「只差一點點了...把你剩下的存貨都給我，我會給你滿意的回報。」",
                "💋"
            );
            this.showLilith();
            const hasChoco = window.Player.inventory.material.some(i => i.name === "充滿魔力的巧克力");
            if (hasChoco) {
                window.Game.setButtons("給予巧克力 (完成)", "completeSuccubusEvent", "拒絕", "nextEvent", false);
            } else {
                window.Game.setButtons("沒有巧克力了", "nextEvent", "無", null, true);
            }

        } else {
            // Stage 3: 事件已完成 (回退為普通色慾事件或無事發生)
            this.handleLustEvent();
        }
    },

    resolveSuccubusFeedingA() {
        // 消耗巧克力
        window.ItemSystem.removeItems("充滿魔力的巧克力", 1);
        window.Player.succubusStage = 1;
        window.Game.renderEvent(
            "🍫 餵食",
            "魅魔狼吞虎嚥地吃下了巧克力。",
            "「嗯...這味道...勉強能入口。」<br>她雖然嘴硬，但臉上泛起了紅暈。",
            "❤️"
        );
        this.showLilith();
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
    },

    resolveSuccubusFeedingB() {
        window.ItemSystem.removeItems("充滿魔力的巧克力", 1);
        window.Player.succubusStage = 2;
        window.Game.renderEvent(
            "🍫 再次餵食",
            "她這次沒有猶豫，直接從你手中拿過了巧克力。",
            "「還算識相。下次見面時...或許可以給你點獎勵。」",
            "💜"
        );
        this.showLilith();
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
    },

    completeSuccubusEvent() {
        window.ItemSystem.removeItems("充滿魔力的巧克力", 1);
        window.Player.succubusStage = 3;

        // 給予獎勵：紙條
        const note = { ...window.CONFIG.specialItems.note };
        window.ItemSystem.addItemToInventory(note);

        // 成就檢查 (如果有相關成就)
        // window.Game.unlockAchievement('succubus_feeder'); 

        window.Game.renderEvent(
            "🎁 魅魔的報恩",
            "「在那邊的圖書館裡，藏著關於那個『冒牌神』的秘密。」",
            `魅魔親了你一下，留下了一張古舊的紙條。<br>獲得 <span class='rarity-mythic'>${note.name}</span>`,
            "💋"
        );
        this.showLilith();
        window.Game.setButtons("收下", "nextEvent", "無", null, true);
    },

    triggerInfernoForge() {
        window.GameState.phase = "forge";
        window.GameState.forgeUsed = false;
        window.UISystem.triggerAnim('event-icon', 'anim-spawn');
        window.Game.renderEvent("🔥 煉獄爐火", "滾燙的岩漿中聳立著一座黑曜石鐵砧。", "你可以利用它打造一次神話裝備。", "🌋");
        window.Game.setButtons("離開", "nextEvent", "無", null, true);
        window.UISystem.renderForgeUI();
    },

    craftForgeItem(itemId) {
        if (window.GameState.phase !== "forge" || window.GameState.forgeUsed) {
            console.warn("Forge action failed: Incorrect phase or already used.", window.GameState.phase, window.GameState.forgeUsed);
            window.UISystem.showToast(window.GameState.forgeUsed ? "爐火已熄滅" : "無法在此時鍛造", "error");
            return;
        }

        const itemTemplate = window.CONFIG.forgeItems.find(i => i.id === itemId);
        if (!itemTemplate) return;

        const recipe = itemTemplate.recipe;
        const ownedItems = window.Player.inventory.material.filter(m => m.name === recipe.mat);

        if (ownedItems.length < recipe.count) {
            window.UISystem.showToast("素材不足！", "error");
            return;
        }

        // 扣除素材
        window.ItemSystem.removeItems(recipe.mat, recipe.count, true);

        // 給予裝備
        window.ItemSystem.addItemToInventory({ ...itemTemplate });
        window.GameState.forgeUsed = true;

        window.UISystem.showFloatingText("鍛造成功!", "#ff3300");
        window.UISystem.renderForgeUI(); // 更新介面
        window.Game.updateUI();
        window.Game.checkAchievements();
    },

    // --- 七宗罪事件 ---
    triggerSinEvent() {
        const sins = ['pride', 'envy', 'wrath', 'sloth', 'greed', 'gluttony', 'lust'];
        const sin = sins[Math.floor(Math.random() * sins.length)];

        window.GameState.phase = "sin_event";
        window.GameState.currentSinType = sin;

        switch (sin) {
            case 'pride': this.handlePrideEvent(); break;
            case 'envy': this.handleEnvyEvent(); break;
            case 'wrath': this.handleWrathEvent(); break;
            case 'sloth': this.handleSlothEvent(); break;
            case 'greed': this.handleGreedEvent(); break;
            case 'gluttony': this.handleGluttonyEvent(); break;
            case 'lust': this.handleLustEvent(); break;
        }
    },

    // 1. 傲慢
    handlePrideEvent() {
        window.Game.renderEvent("🦁 傲慢之門", "「唯有卸下防備，方顯強者本色。」", "面對與你一模一樣的金色鏡像。\n(卸下防具戰鬥，無法逃跑)", "🪞");
        window.Game.setButtons("接受挑戰", "resolvePrideFight", "拒絕 (離開)", "nextEvent", false);
    },

    resolvePrideFight() {
        if (window.Player.equipment.armor) {
            window.ItemSystem.addItemToInventory(window.Player.equipment.armor, false);
            window.Player.equipment.armor = null;
        }
        if (window.Player.equipment.shield) {
            window.ItemSystem.addItemToInventory(window.Player.equipment.shield, false);
            window.Player.equipment.shield = null;
        }

        window.Game.recalcStats();
        window.Game.updateUI();

        const pAtk = window.Game.getAtk();
        const mirrorAtk = Math.max(1, Math.floor(pAtk * 0.5));
        const mirrorHp = Math.min(333333, pAtk * 4);

        const enemy = {
            name: "傲慢鏡像", icon: "👤",
            hp: mirrorHp, maxHp: mirrorHp,
            atk: mirrorAtk,
            tier: "boss", isSin: true, sinType: 'pride'
        };
        window.CombatSystem.startCombatWithEnemy(enemy, false);
    },

    // 2. 嫉妒
    handleEnvyEvent() {
        window.Game.renderEvent("🦊 嫉妒魔精", "「好漂亮...好強大...跟我換...」", "魔精盯著你的裝備流口水。", "👺");
        window.Game.setButtons("交換 (失去2件稀有裝備)", "resolveEnvyTrade", "拒絕", "nextEvent", false);
    },

    resolveEnvyTrade() {
        let allCandidates = [];
        allCandidates.push(...window.Player.inventory.equipment);
        allCandidates.push(...window.Player.inventory.accessory);
        if (window.Player.equipment.weapon) allCandidates.push(window.Player.equipment.weapon);
        if (window.Player.equipment.armor) allCandidates.push(window.Player.equipment.armor);
        if (window.Player.equipment.shield) allCandidates.push(window.Player.equipment.shield);
        window.Player.equipment.accessories.forEach(acc => { if (acc) allCandidates.push(acc); });

        const validItems = allCandidates.filter(i => ['rare', 'epic', 'legendary'].includes(i.rarity));

        if (validItems.length < 2) {
            window.Game.renderEvent("🦊 嫉妒魔精", "「切...窮鬼...」", "你身上沒有足夠的高級裝備。", "😒");
            window.Game.setButtons("離開", "nextEvent", "無", null, true);
            return;
        }

        const removed1 = validItems[Math.floor(Math.random() * validItems.length)];
        let remaining = validItems.filter(i => i !== removed1);
        const removed2 = remaining[Math.floor(Math.random() * remaining.length)];

        this.forceRemoveItem(removed1);
        this.forceRemoveItem(removed2);

        const reward = window.CONFIG.sinItems.find(i => i.id === 'acc_envy');
        window.ItemSystem.addItemToInventory({ ...reward });

        window.Game.updateUI();
        window.Game.renderEvent("🦊 交易完成",
            `嫉妒魔精奪走了你的 <span style="color:red">${removed1.name}</span> 與 <span style="color:red">${removed2.name}</span>...`,
            `作為交換，你獲得了 <span class="rarity-mythic">${reward.name}</span>！`, "🎁");
        window.Game.setButtons("離開", "nextEvent", "無", null, true);
    },

    // 3. 暴怒
    handleWrathEvent() {
        window.Game.renderEvent("😡 暴怒囚籠", "狂戰士咆哮著：「釋放我！讓我們廝殺至死！」", "無盡的死鬥，敵人可能會復活。", "⛓️");
        window.Game.setButtons("釋放並戰鬥", "resolveWrathFight", "無視 (-50 HP)", "resolveWrathIgnore", false);
    },

    resolveWrathFight() {
        const enemy = {
            name: "暴怒狂戰士", icon: "😡",
            hp: 50000, maxHp: 50000, atk: 2000,
            tier: "boss", isSin: true, sinType: 'wrath'
        };
        window.CombatSystem.startCombatWithEnemy(enemy);
    },

    resolveWrathIgnore() {
        window.Player.hp = Math.max(1, window.Player.hp - 50);
        window.Game.renderEvent("😡 暴怒的吼叫", "你轉身離開，背後傳來震耳欲聾的怒吼。", "HP -50", "💢");
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        window.Game.updateUI();
    },

    // 4. 懶惰
    handleSlothEvent() {
        window.Game.renderEvent("💤 懶惰之床", "一張看起來無比舒適的床...", "躺上去可以完全恢復，但會有副作用。", "🛌");
        window.Game.setButtons("睡一覺 (HP全滿+詛咒)", "resolveSlothSleep", "離開", "nextEvent", false);
    },

    resolveSlothSleep() {
        window.Player.hp = window.Player.maxHp;
        // Check if sloth_curse exists, if not use mock
        const curse = window.CONFIG.sinBuffs ? window.CONFIG.sinBuffs.sloth_curse : { id: 'sloth_curse', name: '懶惰詛咒', type: 'debuff', desc: '無法攻擊 (50%機率)' };
        window.Player.debuff = curse;
        window.Player.sinState = window.Player.sinState || {};
        window.Player.sinState.slothCount = 10;

        const reward = window.CONFIG.sinItems.find(i => i.id === 'acc_sloth');
        if (reward) window.ItemSystem.addItemToInventory({ ...reward });

        window.Game.renderEvent("💤 沉睡之後", "體力完全恢復了，且你在枕頭下發現了戒指。", "獲得狀態：懶惰的詛咒 (持續10場戰鬥) & <span class='rarity-mythic'>眠戒</span>", "🛌");
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        window.Game.updateUI();
    },

    // 5. 貪婪
    handleGreedEvent() {
        window.Game.renderEvent("🐷 黃金王座", "史萊姆王座堆滿了寶石。", "「拿去吧，只要你能承受...」", "👑");
        window.Game.setButtons("拿取大量 (5萬G+詛咒)", "resolveGreedTake", "全部都要 (BOSS戰)", "resolveGreedFight", false);
    },

    resolveGreedTake() {
        window.Player.gold += 50000;
        window.Player.sinState = window.Player.sinState || {};
        window.Player.sinState.greedActive = true;
        const curse = window.CONFIG.sinBuffs ? window.CONFIG.sinBuffs.greed_shackle : { id: 'greed_shackle', name: '黃金枷鎖', type: 'debuff', desc: '承受傷害 +20%' };
        window.Player.debuff = curse;

        window.Game.renderEvent("🐷 貪婪的代價", "你拿走了 50,000 G，但身體變得沉重。", "獲得狀態：黃金枷鎖 (受傷+20%)", "💰");
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
    },

    resolveGreedFight() {
        const enemy = {
            name: "貪婪史萊姆王", icon: "👑",
            hp: 80000, maxHp: 80000, atk: 1500,
            tier: "boss", isSin: true, sinType: 'greed'
        };
        window.CombatSystem.startCombatWithEnemy(enemy);
    },

    // 6. 暴食
    handleGluttonyEvent() {
        window.Game.renderEvent("🍲 最後的晚餐", "長桌上擺滿了腐爛但誘人的食物。", "飢餓感爆發，你想吞噬一切。", "🍖");
        window.Game.setButtons("大快朵頤 (消耗品全空)", "resolveGluttonyEat", "獻祭裝備 (80%吞噬)", "resolveGluttonySacrifice", false);
    },

    resolveGluttonyEat() {
        window.Player.inventory.consumable = [];
        window.Player.hp = window.Player.maxHp;

        const reward = window.CONFIG.sinItems.find(i => i.id === 'acc_gluttony');
        if (reward) window.ItemSystem.addItemToInventory({ ...reward });

        window.Game.renderEvent("🍲 暴食的滿足", "你吃光了所有東西，包括你的藥水。", `獲得 <span class='rarity-mythic'>${reward.name}</span>`, "😋");
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        window.Game.updateUI();
    },

    resolveGluttonySacrifice() {
        if (window.Player.inventory.equipment.length > 0) {
            const idx = Math.floor(Math.random() * window.Player.inventory.equipment.length);
            const item = window.Player.inventory.equipment[idx];
            window.Player.inventory.equipment.splice(idx, 1);

            const reward = window.CONFIG.sinItems.find(i => i.id === 'acc_gluttony');
            window.ItemSystem.addItemToInventory({ ...reward });

            window.Game.renderEvent("🍲 吞噬裝備", `你把 ${item.name} 餵給了那張大嘴。`, `獲得 <span class='rarity-mythic'>${reward.name}</span>`, "🦷");
        } else {
            window.Game.renderEvent("🍲 沒東西吃", "你背包裡沒有裝備可以獻祭。", "什麼也沒發生。", "🕸️");
        }
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        window.Game.updateUI();
    },

    // 7. 色慾
    handleLustEvent() {
        window.Game.renderEvent("👙 魅魔的交易", "「想要力量嗎？只要一點點你的精氣...」", "獻出精氣獲得力量，或拒絕誘惑。", "💋");
        const hasNote = window.Player.inventory.material.some(i => i.name === "紙條");
        if (hasNote) {
            window.Game.setButtons("出示紙條", "resolveLustNote", "獻出精氣", "resolveLustAccept", false);
        } else {
            window.Game.setButtons("獻出精氣 (MaxHP扣減)", "resolveLustAccept", "拒絕誘惑 (-50 HP)", "resolveLustDeny", false);
        }
    },

    resolveLustAccept() {
        window.Player.maxHp = Math.max(1, Math.floor(window.Player.maxHp * 0.8));
        window.Player.hp = Math.min(window.Player.hp, window.Player.maxHp);

        const reward = window.CONFIG.sinItems.find(i => i.id === 'acc_lust');
        window.ItemSystem.addItemToInventory({ ...reward });

        const curse = window.CONFIG.sinBuffs ? window.CONFIG.sinBuffs.lust_charm : null;
        if (curse) window.Player.debuff = curse;

        window.Game.renderEvent("👙 致命的歡愉", "你感到身體被掏空 (MaxHP -20%)。", `獲得 <span class='rarity-mythic'>${reward.name}</span>`, "💄");
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        window.Game.updateUI();
    },

    resolveLustDeny() {
        window.Player.hp = Math.max(1, window.Player.hp - 50);
        window.Game.renderEvent("👙 魅魔的羞怒", "「不識好歹！」", "HP -50", "💢");
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        window.Game.updateUI();
    },

    resolveLustNote() {
        if (!window.Player.history.items) window.Player.history.items = new Set();
        window.Player.history.items.add("魅魔的心意");

        // [New] 設定莉莉絲祝福旗標
        window.Player.lilithBlessing = true;

        window.Game.checkAchievements();

        const perfume = window.CONFIG.sinItems.find(i => i.id === 'acc_lust');
        window.ItemSystem.addItemToInventory({ ...perfume });
        window.Game.renderEvent("👙 莉莉絲的放行", "「原來是你...既然有這個，就讓你通過吧。」", `獲得 <span class='rarity-mythic'>${perfume.name}</span>。`, "🎫");
        this.showLilith();
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
    },

    forceRemoveItem(targetItem) {
        if (window.Player.equipment.weapon === targetItem) { window.Player.equipment.weapon = null; window.Game.recalcStats(); return; }
        if (window.Player.equipment.armor === targetItem) { window.Player.equipment.armor = null; window.Game.recalcStats(); return; }
        if (window.Player.equipment.shield === targetItem) { window.Player.equipment.shield = null; window.Game.recalcStats(); return; }
        for (let i = 0; i < 3; i++) {
            if (window.Player.equipment.accessories[i] === targetItem) {
                window.Player.equipment.accessories[i] = null;
                window.Game.recalcStats();
                return;
            }
        }
        window.ItemSystem.removeItemFromInventory(targetItem);
    },

    triggerSlimeElderEvent() {
        window.GameState.phase = "event_end";
        window.UISystem.triggerAnim('event-icon', 'anim-spawn');

        const enhanceCount = window.Player.elderEnhanceCount || 0;
        if (enhanceCount >= 5) {
            const feather = { ...window.CONFIG.phoenixFeather };
            window.ItemSystem.addItemToInventory(feather);
            window.Game.renderEvent("👑 史萊姆長老", "「你已習得所有精髓...這根羽毛送給你。」", "獲得 <span class='rarity-legendary'>不死鳥的羽毛</span>", "👴");
            window.Game.setButtons("感謝", "nextEvent", "無", null, true);
        } else {
            window.Game.renderEvent("👑 史萊姆長老", "一隻戴著皇冠的巨大史萊姆擋住了路。", `「年輕人，若你願意捨棄身外之物 (${window.Player.gold} G)，老夫可以傳授你煉獄的生存之道。」<br>(目前強化: ${enhanceCount}/5)`, "👴");
            if (window.Player.gold <= 0) {
                window.Game.setButtons("身無分文...", "nextEvent", "無", null, true);
            } else {
                window.Game.setButtons("傾家蕩產 (HP+600/攻+600)", "resolveElderEnhance", "拒絕", "nextEvent", false);
            }
        }
    },

    resolveElderEnhance() {
        if ((window.Player.elderEnhanceCount || 0) >= 5) { window.Game.nextEvent(); return; }
        window.Player.gold = 0;
        if (!window.Player.elderEnhanceCount) window.Player.elderEnhanceCount = 0;
        window.Player.elderEnhanceCount++;
        window.Player.baseMaxHp += 600;
        window.Player.maxHp += 600;
        window.Player.hp += 600;
        window.Player.baseAtk = (window.Player.baseAtk || 5) + 600;
        window.UISystem.showFloatingText("煉獄之力覺醒!", "#ff0000");
        window.Game.renderEvent("👑 長老的傳承", "你的金幣被長老吞噬，化為純粹的力量！", `最大生命 +600 / 基礎攻擊 +600<br>(已強化 ${window.Player.elderEnhanceCount}/5 次)`, "💪");
        window.Game.setButtons("感謝指點", "nextEvent", "無", null, true);
        window.Game.updateUI();
    },

    triggerMinotaurMaze() {
        window.GameState.phase = "event_end";
        window.UISystem.triggerAnim('event-icon', 'anim-spawn');
        window.Game.renderEvent("🏗️ 米諾陶洛斯迷宮", "你被困在了一座詭異的迷宮中...", "牆壁在移動，遠處傳來牛頭人的吼聲。", "🧱");
        window.Game.setButtons("尋找出口 (隨機)", "resolveMinotaurMaze", "原地待命 (遭遇戰鬥)", "triggerMinotaur", false);
    },

    resolveMinotaurMaze() {
        const rand = Math.random();
        if (rand < 0.20) {
            const item = window.CONFIG.infernoItems.find(i => i.id === 'acc_red_cloth');
            if (item) {
                window.ItemSystem.addItemToInventory({ ...item });
                window.Game.renderEvent("🧣 迷宮的角落", "你在角落發現了一塊鮮豔的布。", `獲得 <span class="rarity-mythic">${item.name}</span>！`, "🧣");
            } else {
                window.Game.renderEvent("🧣 迷宮的角落", "好像有什麼東西...", "但什麼也沒找到。", "🧣");
            }
        } else if (rand < 0.40) {
            const item = window.CONFIG.infernoItems.find(i => i.id === 'w_minotaur');
            if (item) {
                window.ItemSystem.addItemToInventory({ ...item });
                window.Game.renderEvent("🪓 迷宮的中心", "你發現了傳說中的戰斧！", `獲得 <span class="rarity-mythic">${item.name}</span>！`, "🪓");
            } else {
                window.Game.renderEvent("🪓 迷宮的中心", "這裡應該有把斧頭的...", "可惜已經被拿走了。", "🪓");
            }
        } else if (rand < 0.70) {
            window.Game.renderEvent("🧱 迷宮出口", "你在迷宮裡繞了很久...", "什麼也沒發現，但平安找到了出口。", "💨");
        } else {
            this.triggerMinotaur();
            return;
        }
        window.Game.setButtons("離開", "nextEvent", "無", null, true);
        window.Game.updateUI();
    },

    triggerMinotaur() {
        const minotaur = window.CONFIG.infernoMonsters.find(m => m.name === "米諾陶洛斯");
        if (minotaur) {
            window.CombatSystem.startCombatWithEnemy({ ...minotaur });
        } else {
            this.triggerInfernoCombat();
        }
    },

    triggerDemonMerchant() {
        window.GameState.phase = "demon_merchant";
        window.GameState.merchantRefreshed = false;
        this.generateDemonStock();
        window.UISystem.triggerAnim('event-icon', 'anim-spawn');
        window.Game.renderEvent("😈 惡魔商人", "「凡人的貨幣在這裡毫無價值...但我收煉獄金幣。」", "販賣神話裝備", "🧛");
        window.Game.setButtons("離開", "nextEvent", "無", null, true);
        window.UISystem.renderMerchantShop();
    },

    generateDemonStock() {
        window.GameState.merchantStock = [];
        const normalPool = ['w_doom', 'a_apocalypse', 'c_harpy_blood', 'c_pure_blood'];
        let slots = 4;
        if (Math.random() < 0.03) {
            const scroll = window.CONFIG.infernoItems.find(i => i.id === 'c_inferno_scroll');
            if (scroll) { window.GameState.merchantStock.push({ ...scroll }); slots--; }
        }
        if (Math.random() < 0.05) {
            const wall = window.CONFIG.infernoItems.find(i => i.id === 's_demon_wall');
            if (wall) { window.GameState.merchantStock.push({ ...wall }); slots--; }
        }
        for (let i = 0; i < slots; i++) {
            const targetId = normalPool[Math.floor(Math.random() * normalPool.length)];
            const item = window.CONFIG.infernoItems.find(i => i.id === targetId);
            if (item) window.GameState.merchantStock.push({ ...item });
        }
    },

    triggerVoidRift() {
        window.GameState.phase = "event_end";
        window.UISystem.triggerAnim('event-icon', 'anim-spawn');
        window.Game.renderEvent("🌌 虛空裂隙", "空間撕裂出一道極度危險的紫色裂縫。", "高風險高回報：50% 機率獲得神話寶物，50% 機率遭受重創。", "🌀");
        window.Game.setButtons("觸摸 (50%機率受傷)", "resolveVoidRift", "離開", "nextEvent", false);
    },

    resolveVoidRift() {
        if (Math.random() < 0.5) {
            const roll = Math.random();
            if (roll < 0.05) {
                const sword = window.CONFIG.infernoItems.find(i => i.id === 'w_void_breaker');
                if (sword) {
                    window.ItemSystem.addItemToInventory({ ...sword });
                    window.Game.renderEvent("🌌 虛空奇蹟", "你在裂隙深處看見了毀滅的光芒...", `運氣爆發！獲得 <span class='rarity-mythic'>${sword.name}</span>`, "🌌");
                    window.Game.setButtons("繼續", "nextEvent", "無", null, true);
                    return;
                }
            }
            window.Player.gold += 6666;
            window.Game.renderEvent("🌌 虛空饋贈", "裂隙吐出了一些東西。", "獲得 6666 煉獄金幣。", "🌌");
        } else {
            const dmg = Math.floor(window.Player.maxHp * 0.5);
            if (window.Player.hp <= dmg) {
                window.Player.hp = 0;
                window.Game.playerDie("被虛空吞噬");
                return;
            }
            window.Player.hp -= dmg;
            window.UISystem.showFloatingText(`-${dmg} HP (真實傷害)`, "#ff00ff");
            window.Game.renderEvent("🌌 虛空反噬", "虛空試圖將你的靈魂撕碎！", `受到 <span class='damage-text'>${dmg} (50% MaxHP)</span> 點真實傷害。`, "💀");
        }
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        window.Game.updateUI();
    },

    triggerBloodAltar() {
        window.GameState.phase = "event_end";
        window.Game.renderEvent("🩸 鮮血祭壇", "「以血換血，等價交換。」", `獻祭 50% 當前生命 (${Math.floor(window.Player.hp * 0.5)})，換取煉獄神器？(成功率 20%)`, "🧛");
        window.Game.setButtons("獻祭生命", "resolveBloodAltar", "離開", "nextEvent", false);
    },

    resolveBloodAltar() {
        const cost = Math.floor(window.Player.hp * 0.5);
        window.Player.hp -= cost;
        window.UISystem.showFloatingText(`-${cost} HP`, "red");
        if (Math.random() < 0.20) {
            const item = window.CONFIG.infernoItems[Math.floor(Math.random() * window.CONFIG.infernoItems.length)];
            window.ItemSystem.addItemToInventory({ ...item });
            window.Game.renderEvent("🩸 祭壇的回應", "血霧中浮現出一件神器...", `獲得 <span class='rarity-mythic'>${item.name}</span>`, "🎁");
        } else {
            window.Game.renderEvent("🩸 祭壇的沉默", "血液乾涸了，什麼也沒發生。", "你的犧牲白費了...", "🕸️");
        }
        if (window.Player.hp <= 0) { window.Game.playerDie("死於獻祭"); return; }
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        window.Game.updateUI();
    },

    triggerGardenEvent() {
        window.GameState.phase = "event_end";
        window.UISystem.triggerAnim('event-icon', 'anim-spawn');
        window.Game.renderEvent("🌸 寧靜的花園", "煉獄中竟然存在著這樣一片淨土...", "花園中間有一縷散發著強大氣場的魂魄。<br>(靠近可能觸發極度危險的戰鬥)", "👻");
        window.Game.setButtons("靠近", "resolveGardenFight", "離開", "nextEvent", false);
    },

    resolveGardenFight() {
        const enemy = { name: "勇者殘魂", icon: "👻", hp: 333333, maxHp: 333333, atk: 111111, tier: "boss", isGardenBoss: true };
        window.CombatSystem.startCombatWithEnemy(enemy);
        window.UISystem.showFloatingText("強者...", "#fff");
    },

    // 9. 死寂雕像 (神之代行者觸發點)
    triggerDeadStatue() {
        window.GameState.phase = "event_end";
        window.UISystem.triggerAnim('event-icon', 'anim-spawn');

        const hasCrown = window.Player.inventory.material.some(i => i.id === 'm_crown_sin');

        let desc = "它的頭部缺了一圈裝飾，底座刻著：「獻上原罪，神將降臨。」";
        let opt1 = "離開";
        let func1 = "nextEvent";

        if (hasCrown) {
            window.Game.renderEvent("🗿 死寂雕像", "一座沒有臉的巨大神像，破損不堪。", desc, "🗿");
            window.Game.setButtons("嵌入原罪之冠 (???)", "resolveDeadStatueInsert", "離開", "nextEvent", false);
        } else {
            window.Game.renderEvent("🗿 死寂雕像", "一座沒有臉的巨大神像，破損不堪。", desc + "<br>(你似乎缺少了關鍵的信物)", "🗿");
            window.Game.setButtons("離開", "nextEvent", "無", null, true);
        }
    },

    resolveDeadStatueInsert() {
        // 移除皇冠
        const crownIdx = window.Player.inventory.material.findIndex(i => i.id === 'm_crown_sin');
        if (crownIdx > -1) {
            window.Player.inventory.material.splice(crownIdx, 1);
        }

        window.Game.renderEvent("🗿 神罰降臨", "雕像崩塌了，一道聖潔而毀滅性的光柱籠罩了你。", "「僭越者...領受神罰吧。」", "🌩️");
        window.Game.setButtons("迎戰神之代行者", "triggerGodAgent", "無", null, true);
    },

    triggerGodAgent() {
        const god = window.CONFIG.infernoMonsters.find(m => m.isGod);
        if (god) {
            window.CombatSystem.startCombatWithEnemy({ ...god });
        } else {
            console.error("God's Agent not found in CONFIG!");
            this.triggerInfernoCombat();
        }
    },

    /**
     * 觸發煉獄戰鬥
     */
    triggerInfernoCombat() {
        window.GameState.phase = "combat";
        let monsterPool = CONFIG.infernoMonsters;
        if (!monsterPool || monsterPool.length === 0) {
            console.error("No inferno monsters found! Fallback to normal.");
            window.CombatSystem.triggerCombat(true); // Fallback
            return;
        }

        let totalW = monsterPool.reduce((a, b) => a + b.weight, 0);
        let r = Math.random() * totalW;
        let enemyTemplate = monsterPool[0];
        for (let m of monsterPool) {
            if (r < m.weight) { enemyTemplate = m; break; }
            r -= m.weight;
        }

        // 新手保護機制 (1-10層)
        let statModifier = 1.0;
        let namePrefix = "";

        if (window.Player.depth <= 10) {
            statModifier = 0.3; // 削弱 70%
            namePrefix = "(虛弱) ";
        }

        let enemy = {
            ...enemyTemplate,
            name: namePrefix + enemyTemplate.name,
            maxHp: Math.floor(enemyTemplate.hp * statModifier),
            hp: Math.floor(enemyTemplate.hp * statModifier),
            atk: Math.floor(enemyTemplate.atk * statModifier),
            tier: enemyTemplate.tier || "normal",
            isOldOne: enemyTemplate.isOldOne || false,
            isGod: enemyTemplate.isGod || false
        };

        if (window.Player.depth <= 10) {
            window.Game.showFloatingText("新手保護: 怪物弱化 70%", "#4caf50");
        }

        window.CombatSystem.startCombatWithEnemy(enemy);
    }
};

// 綁定到全域
if (typeof window !== 'undefined') {
    window.EventSystem = EventSystem;
    window.leaveCasino = () => EventSystem.leaveCasino();
}

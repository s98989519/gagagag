/**
 * 幻想冒險 - 物品系統模組
 * 處理物品生成、管理和裝備邏輯
 * @版本 v2.0
 * @更新 2025-11-27
 */

console.log('Loading items.js...');
var ItemSystem = {
    /**
     * 生成隨機物品
     * @param {string} tierModifier - 等級修正（normal/elite/boss）
     */
    generateRandomItem(tierModifier = "normal") {
        let r = Math.random();

        // 應用詞綴加成 (Game.modifiers.luck) - 提升稀有度
        if (window.Game && window.Game.modifiers && window.Game.modifiers.luck) {
            // 幸運值直接增加隨機數，使其更容易達到高稀有度區間
            // 例如 +0.2 幸運，原本 0.4 (common) 變成 0.6 (uncommon)
            r += window.Game.modifiers.luck;
            if (r > 1) r = 0.999; // 防止溢出，但確保是最高級
        }

        let rarityKey = "common";
        let table = CONFIG.rarityProb;
        let acc = 0;

        for (let key in table) {
            acc += table[key];
            if (r <= acc) {
                rarityKey = key;
                break;
            }
        }

        if (tierModifier === "boss" && (rarityKey === "common" || rarityKey === "uncommon")) {
            rarityKey = "rare";
        }

        const pool = CONFIG.itemPool.filter(i => i.rarity === rarityKey);
        if (pool.length === 0) return this.generateRandomItem("normal");

        const template = pool[Math.floor(Math.random() * pool.length)];
        let item = Object.assign({}, template);

        // 嘗試添加詞綴 (僅限裝備)
        if (['weapon', 'armor', 'shield'].includes(item.type)) {
            item = this.generateAffixes(item);
        }

        return item;
    },

    /**
     * 生成特定類型的物品
     * @param {Array} allowedTypes - 允許的物品類型陣列
     */
    generateSpecificItem(allowedTypes) {
        const r = Math.random();
        let rarityKey = "common";
        let table = CONFIG.rarityProb;
        let acc = 0;

        for (let key in table) {
            acc += table[key];
            if (r <= acc) {
                rarityKey = key;
                break;
            }
        }

        let pool = CONFIG.itemPool.filter(i => i.rarity === rarityKey && allowedTypes.includes(i.type));
        if (pool.length === 0) {
            pool = CONFIG.itemPool.filter(i => allowedTypes.includes(i.type));
        }

        const template = pool[Math.floor(Math.random() * pool.length)];
        let item = Object.assign({}, template);

        // 嘗試添加詞綴 (僅限裝備)
        if (['weapon', 'armor', 'shield'].includes(item.type)) {
            item = this.generateAffixes(item);
        }

        return item;
    },

    /**
     * 為物品生成詞綴
     * @param {Object} item - 原始物品對象
     */
    generateAffixes(item) {
        // 30% 機率獲得前綴
        if (Math.random() < 0.3) {
            const keys = Object.keys(CONFIG.affixes.prefixes);
            const key = keys[Math.floor(Math.random() * keys.length)];
            const affix = CONFIG.affixes.prefixes[key];

            item.prefix = key;
            item.name = `${affix.name} ${item.name}`;
            item.desc = (item.desc || "") + ` [${affix.desc}]`;
        }

        // 30% 機率獲得後綴
        if (Math.random() < 0.3) {
            const allSuffixes = Object.entries(CONFIG.affixes.suffixes);
            const validSuffixes = allSuffixes.filter(([key, affix]) => {
                return !affix.allowedTypes || affix.allowedTypes.includes(item.type);
            });

            if (validSuffixes.length > 0) {
                const [key, affix] = validSuffixes[Math.floor(Math.random() * validSuffixes.length)];

                item.suffix = key;
                item.name = `${item.name}${affix.name}`;
                item.desc = (item.desc || "") + ` [${affix.desc}]`;
            }
        }

        return item;
    },

    /**
     * 將物品添加到背包
     * @param {Object} item - 物品對象
     * @param {boolean} render - 是否立即渲染UI
     */
    addItemToInventory(item, render = true) {
        const isNewItem = !window.Player.history.items.has(item.name);
        window.Player.history.items.add(item.name);

        if (['weapon', 'armor', 'shield'].includes(item.type)) {
            window.Player.inventory.equipment.push(item);
        } else if (item.type === 'accessory') {
            if (!window.Player.inventory.accessory) window.Player.inventory.accessory = [];
            window.Player.inventory.accessory.push(item);
        } else if (item.type === 'consumable') {
            window.Player.inventory.consumable.push(item);
        } else {
            window.Player.inventory.material.push(item);
        }

        // 如果是新物品
        if (isNewItem && window.Game) {
            // 保存圖鑑
            window.Game.savePersistentData();

            // 傳說物品特效觸發（本局首次獲得時）
            const isRunNew = !window.Player.runSeenItems || !window.Player.runSeenItems.has(item.name);

            if (isRunNew && ['legendary', 'mythic', 'ultra'].includes(item.rarity) && window.UISystem) {
                window.UISystem.showLegendaryEffect(item.rarity);
            }

            // 記錄到本局已見
            if (window.Player.runSeenItems) {
                window.Player.runSeenItems.add(item.name);
            }
        }

        if (render) window.Game.updateUI();
    },

    /**
     * 添加物品到倉庫
     * @param {string} name - 物品名稱
     * @param {number} count - 數量
     */
    addItemToWarehouse(name, count = 1) {
        if (!window.Player.warehouse) window.Player.warehouse = {};
        if (!window.Player.warehouse[name]) window.Player.warehouse[name] = 0;
        window.Player.warehouse[name] += count;
    },

    /**
     * 裝備物品
     * @param {number} index - 物品索引
     * @param {string} category - 物品類別
     */
    equip(index, category) {
        const item = window.Player.inventory[category][index];
        const type = item.type;

        if (!['weapon', 'armor', 'shield', 'accessory'].includes(type)) return;

        // 飾品特殊處理
        if (type === 'accessory') {
            // 確保飾品欄位存在
            if (!window.Player.equipment.accessories) {
                window.Player.equipment.accessories = [null, null, null];
            }
            const accessories = window.Player.equipment.accessories;
            // 尋找空位
            const emptySlotIndex = accessories.findIndex(slot => slot === null);

            if (emptySlotIndex !== -1) {
                // 有空位，直接裝備
                window.Player.equipment.accessories[emptySlotIndex] = item;
                window.Player.inventory[category].splice(index, 1);

                AudioSystem.playSFX('equip');
                window.Game.recalcStats();
                window.Game.updateUI();
                window.Game.log(`裝備了 ${item.name}`);
            } else {
                // 無空位，提示玩家
                window.UISystem.showToast("飾品欄位已滿！請先卸下一個飾品。", "warning");
            }
            return;
        }

        // 一般裝備交換邏輯
        if (window.Player.equipment[type]) {
            this.addItemToInventory(window.Player.equipment[type], false);
        }

        window.Player.equipment[type] = item;
        window.Player.inventory[category].splice(index, 1);

        AudioSystem.playSFX('equip');  // 裝備音效

        // 重新計算屬性
        window.Game.recalcStats();
        window.Game.updateUI();
        window.Game.log(`裝備了 ${item.name}`);
    },

    /**
     * 卸下裝備
     * @param {string} type - 裝備類型（weapon/armor/shield/accessory）
     * @param {number} slotIndex - 飾品欄位索引 (僅飾品需要)
     */
    unequip(type, slotIndex = -1) {
        let item = null;

        if (type === 'accessory') {
            if (slotIndex < 0 || slotIndex > 2) return;
            // 確保飾品欄位存在
            if (!window.Player.equipment.accessories) {
                window.Player.equipment.accessories = [null, null, null];
            }
            item = window.Player.equipment.accessories[slotIndex];
        } else {
            item = window.Player.equipment[type];
        }

        if (!item) return;

        const typeNames = { weapon: '武器', armor: '防具', shield: '盾牌', accessory: '飾品' };

        window.UISystem.showConfirmModal(
            "卸下裝備",
            `確定要卸下 <span style="color:#69f0ae">${item.name}</span> 嗎？`,
            () => {
                this.addItemToInventory(item, false);

                if (type === 'accessory') {
                    window.Player.equipment.accessories[slotIndex] = null;
                } else {
                    window.Player.equipment[type] = null;
                }

                AudioSystem.playSFX('unequip');  // 卸裝音效

                window.Game.recalcStats();
                window.Game.updateUI();

                window.Game.log(`卸下了${typeNames[type]}`);
            }
        );
    },

    /**
     * 使用消耗品
     * @param {number} index - 物品索引
     * @param {string} category - 物品類別
     */
    useItem(index, category) {
        const item = window.Player.inventory[category][index];

        // [New] 便攜式煉金工具 (無限使用)
        if (item.id === 'tool_alchemy_kit') {
            window.UISystem.renderPortableCrafting();
            return;
        }

        // [New] 煉獄聖經使用邏輯
        if (item.name === "煉獄聖經") {
            const html = `
                <div style="text-align:center;">
                    <div style="font-size:3em; margin-bottom:10px;">📕</div>
                    <p style="margin-bottom:10px;">你準備好面對真正的恐懼了嗎？</p>
                    <p style="color:#ff5252; font-size:0.9em;">(使用後將開啟煉獄之門，此物品將會暫時離開你的身邊)</p>
                </div>
            `;
            window.UISystem.showConfirmModal("使用 煉獄聖經", html, () => {
                // 1. 移動到倉庫
                window.ItemSystem.removeItems("煉獄聖經", 1);
                if (!window.Player.warehouse["煉獄聖經"]) window.Player.warehouse["煉獄聖經"] = 0;
                window.Player.warehouse["煉獄聖經"]++;
                window.Game.savePersistentData(); // 保存倉庫狀態

                // 2. 開啟煉獄
                if (window.EventSystem && window.EventSystem.triggerInfernoGate) {
                    window.EventSystem.triggerInfernoGate();

                    // 3. 顯示離去訊息 (使用 setTimeout 確保在煉獄介面載入後顯示)
                    setTimeout(() => {
                        // 創建自定義電影式遮罩 (Cinematic Overlay)
                        const overlay = document.createElement('div');
                        Object.assign(overlay.style, {
                            position: 'fixed',
                            top: '0',
                            left: '0',
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(3px)',
                            zIndex: '99999',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            opacity: '0',
                            transition: 'opacity 1.5s ease-out',
                            pointerEvents: 'auto' // 允許點擊關閉
                        });

                        // 內容容器
                        const content = document.createElement('div');
                        Object.assign(content.style, {
                            width: '100%',
                            padding: '40px 0',
                            background: 'linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.9) 80%, transparent)',
                            borderTop: '1px solid rgba(255, 87, 34, 0.5)',
                            borderBottom: '1px solid rgba(179, 136, 255, 0.5)',
                            textAlign: 'center',
                            transform: 'scale(0.9)',
                            transition: 'transform 1.5s ease-out'
                        });

                        content.innerHTML = `
                             <div style="font-size:4rem; margin-bottom:20px; text-shadow: 0 0 30px #ff5722; animation: float 3s ease-in-out infinite;">📕</div>
                             <p style="font-size: 1.8rem; color: #fff; margin-bottom: 20px; text-shadow: 0 0 15px rgba(255, 87, 34, 0.8);">
                                你感覺 <span style="color: #ff5722; font-weight:bold; font-size: 2rem;">煉獄聖經</span> 離你而去了...
                             </p>
                             <p style="color: #ccc; font-size: 1.1rem; letter-spacing: 2px; font-style: italic;">
                                "但你的直覺告訴你，你們終將會再相遇的。"
                             </p>
                             <div style="margin-top: 30px; font-size: 0.9rem; color: #666; animation: blink 2s infinite;">[ 點擊任意處關閉 ]</div>
                        `;

                        overlay.appendChild(content);
                        document.body.appendChild(overlay);

                        // 動畫進場
                        requestAnimationFrame(() => {
                            overlay.style.opacity = '1';
                            content.style.transform = 'scale(1)';
                        });

                        // 點擊關閉
                        const close = () => {
                            overlay.style.opacity = '0';
                            content.style.transform = 'scale(1.1)'; // 散開效果
                            setTimeout(() => overlay.remove(), 1000);
                        };

                        overlay.onclick = close;

                        // 自動關閉 (時間稍微長一點以供閱讀)
                        setTimeout(close, 6000);

                    }, 500); // 稍微縮短觸發延遲
                } else {
                    console.error("EventSystem.triggerInfernoGate not found!");
                }
            });
            return;
        }

        if (item.name.includes("藥水") || item.name.includes("藥劑")) {
            let heal = item.val;
            let bonusText = "";

            // 天使的活力：藥水效果 +50%
            if (window.Player.buff && window.Player.buff.id === 'angel_vitality') {
                const bonus = Math.floor(item.val * 0.5);
                heal += bonus;
                bonusText += ` <span style="font-size:0.8em; color:#69f0ae">(天使 +${bonus})</span>`;
            }

            // 符文：治癒之風 (+20%)
            if (window.Player.unlockedRunes && window.Player.unlockedRunes.includes('strong_heal')) {
                const bonus = Math.floor(item.val * 0.2);
                heal += bonus;
                bonusText += ` <span style="font-size:0.8em; color:#69f0ae">(符文 +${bonus})</span>`;
            }

            const currentHp = window.Player.hp;
            const maxHp = window.Player.maxHp;
            const predictedHp = Math.min(maxHp, currentHp + heal);

            const msg = `
                <div style="text-align:left; font-size:1.1em; line-height:1.6;">
                    <p><strong>使用物品:</strong> <span style="color:#69f0ae">${item.name}</span></p>
                    <p><strong>回復量:</strong> <span style="color:#69f0ae">+${heal}</span>${bonusText}</p>
                    <hr style="border-color:#444; margin:10px 0;">
                    <p><strong>生命值變化:</strong></p>
                    <p style="padding-left:15px;">當前: <span style="color:${currentHp < maxHp * 0.3 ? '#ff5252' : '#fff'}">${currentHp}</span> / ${maxHp}</p>
                    <p style="padding-left:15px;">使用後: <span style="color:#69f0ae">${predictedHp}</span> / ${maxHp}</p>
                </div>
            `;

            window.UISystem.showConfirmModal(
                "使用藥水",
                msg,
                () => {
                    window.Player.hp = predictedHp;
                    window.Player.inventory[category].splice(index, 1);
                    AudioSystem.playSFX('potion');  // 喝藥水音效
                    window.Game.showFloatingText(`+${heal} HP`, "#69f0ae");
                    window.Game.updateUI();
                }
            );
        } else if (item.effect === 'open_workbench') {
            // 行動工作台 (消耗品)
            window.UISystem.showConfirmModal(
                "使用行動工作台",
                "確定要使用行動工作台嗎？<br><span style='font-size:0.9em; color:#aaa;'>(製作完成後才會消耗 1 個)</span>",
                () => {
                    // [Mod] 製作完成後才消耗，這裡不扣除
                    window.Game.openPortableWorkbench();
                }
            );
            // 不自動扣除，由 callback 扣除
            return;
        } else if (item.buffId) {
            // 特殊密藥：給予 Buff
            const buff = Object.values(CONFIG.buffs).find(b => b.id === item.buffId);
            if (buff) {
                let warning = "";
                if (window.Player.buff) {
                    warning = `<br><span style="color:#ff5252; font-size:0.9em;">(注意：將覆蓋當前的【${window.Player.buff.name}】)</span>`;
                }

                window.UISystem.showConfirmModal(
                    "使用密藥",
                    `確定要使用 <span style="color:#ffd700">${item.name}</span> 嗎？<br>效果：${buff.desc}${warning}`,
                    () => {
                        window.Player.buff = buff;
                        window.Player.inventory[category].splice(index, 1);
                        AudioSystem.playSFX('powerup');
                        window.Game.showFloatingText(`獲得 Buff: ${buff.name}`, "#ffd700");
                        window.Game.updateUI();
                    }
                );
            }
        } else if (item.name.includes("龍之秘藥")) {
            // 龍之秘藥：永久提升生命上限
            window.UISystem.showConfirmModal(
                "使用秘藥",
                `確定要飲用 <span style="color:#ff5722">${item.name}</span> 嗎？<br>最大生命值將提升 <span style="color:#69f0ae">+${item.val}</span>。`,
                () => {
                    window.Player.maxHp += item.val;
                    window.Player.hp += item.val; // 同時恢復等量生命
                    window.Player.inventory[category].splice(index, 1);
                    AudioSystem.playSFX('powerup');
                    window.Game.showFloatingText(`MaxHP +${item.val}`, "#ff5722");
                    window.Game.updateUI();
                }
            );
        } else if (item.type === 'scroll') {
            // 卷軸：武器附魔
            const weapon = window.Player.equipment.weapon;
            if (!weapon) {
                window.UISystem.showToast("你沒有裝備武器！", "error");
                return;
            }

            window.UISystem.showConfirmModal(
                "使用卷軸",
                `確定要對 <span style="color:#69f0ae">${weapon.name}</span> 使用 <span style="color:#9c27b0">${item.name}</span> 嗎？<br>現有的後綴將被覆蓋。`,
                () => {
                    // 移除舊後綴名稱 (如果有)
                    if (weapon.suffix && CONFIG.affixes.suffixes[weapon.suffix]) {
                        const oldSuffixName = CONFIG.affixes.suffixes[weapon.suffix].name;
                        if (weapon.name.endsWith(oldSuffixName)) {
                            weapon.name = weapon.name.substring(0, weapon.name.length - oldSuffixName.length);
                        }
                    }

                    // 應用新後綴 (吸血)
                    weapon.suffix = 'leeching';
                    const suffixName = CONFIG.affixes.suffixes['leeching'].name;
                    weapon.name += suffixName;
                    weapon.desc = (weapon.desc || "") + " [攻擊恢復 10% 傷害的生命]";

                    window.Player.inventory[category].splice(index, 1);
                    AudioSystem.playSFX('enchant');
                    window.Game.showFloatingText("附魔成功！", "#9c27b0");
                    window.Game.updateUI();
                }
            );
        }
    },

    /**
     * 出售物品
     * @param {number} index - 物品索引
     * @param {string} category - 物品類別
     */
    sellItem(index, category, mode = 'sell', force = false) {
        if (window.GameState.phase !== "merchant") return;

        const item = window.Player.inventory[category][index];
        if (!item) return;

        if (item.type === 'revive' || item.name === '彈弓' || item.name === '鉤子' || item.name === '煉獄聖經' || item.price <= 0) {
            alert("這件物品無法出售！");
            return;
        }

        let price = item.price;
        if (['weapon', 'armor', 'shield', 'consumable'].includes(item.type)) {
            price = Math.floor(price * 0.8);
        }

        if (window.Player.class === 'merchant') {
            price = Math.floor(price * 1.2);
        }

        // 天使的恩賜：素材售價 +20%
        if (window.Player.buff && window.Player.buff.id === 'angel_blessing') {
            if (item.type === 'material' || item.type === 'loot') {
                price = Math.floor(price * 1.2);
            }
        }

        // 委託模式：價格減半
        if (mode === 'consign') {
            price = Math.floor(price * 0.5);
        }

        const doSell = () => {
            window.Player.inventory[category].splice(index, 1);
            window.Player.gold += price;

            if (mode === 'consign') {
                if (!window.Player.pendingWarehouse) window.Player.pendingWarehouse = {};
                if (!window.Player.pendingWarehouse[item.name]) window.Player.pendingWarehouse[item.name] = 0;
                window.Player.pendingWarehouse[item.name]++;
                window.Game.showFloatingText("+ " + price + " G (委託)", "yellow");
                window.Game.log(`委託運送 ${item.name} (預付 ${price} G)`);
            } else {
                window.Game.showFloatingText("+ " + price + " G", "yellow");
                window.Game.log(`出售 ${item.name} 獲得 ${price} G`);
            }

            AudioSystem.playSFX('coin');
            window.Game.updateUI();
        };

        if (force) {
            doSell();
        } else {
            let actionText = mode === 'consign' ? '委託運送' : '出售';
            let extraDesc = mode === 'consign' ? '<br><span style="color:#00bcd4; font-size:0.9em;">(物品將送往倉庫，需活著撤退才能領取)</span>' : '';

            window.UISystem.showConfirmModal(
                `${actionText}物品`,
                `確定要以 <span style="color:gold">${price} G</span> ${actionText} <span class="${CONFIG.rarityDisplay[item.rarity].color}">${item.name}</span> 嗎？${extraDesc}`,
                doSell
            );
        }
    },

    // --- [New] 輔助函式 ---
    /**
     * 檢查是否擁有特定物品 (ID檢查)
     * 檢查背包(所有分類)、裝備欄與倉庫
     * @param {string} id - 物品ID或名稱
     */
    hasItem(id) {
        // 0. 安全檢查
        if (!window.Player) return false;

        // 1. 檢查背包 (所有分類)
        const categories = ['weapon', 'armor', 'shield', 'accessory', 'consumable', 'material'];
        for (let cat of categories) {
            if (window.Player.inventory[cat]) {
                if (window.Player.inventory[cat].some(i => i.id === id || i.name === id)) return true;
            }
        }

        // 2. 檢查裝備 (武器/防具/盾牌)
        if (['weapon', 'armor', 'shield'].some(type => window.Player.equipment[type] && (window.Player.equipment[type].id === id || window.Player.equipment[type].name === id))) return true;

        // 3. 檢查飾品 (多個欄位)
        if (window.Player.equipment.accessories && window.Player.equipment.accessories.some(a => a && (a.id === id || a.name === id))) return true;

        // 4. 檢查倉庫
        if (window.Player.warehouse) {
            // Case A: ID match (if keys are IDs? No, keys are Names)
            // But we check just in case logic changes
            if (window.Player.warehouse[id] > 0) return true;

            // Case B: Name lookup from ID
            let targetName = id; // Default to assuming input is Name

            // Try to resolve ID to Name
            let resolved = false;

            // 查 Crafting Recipes
            if (window.CONFIG && window.CONFIG.craftingRecipes) {
                for (let key in window.CONFIG.craftingRecipes) {
                    if (window.CONFIG.craftingRecipes[key].id === id) {
                        targetName = window.CONFIG.craftingRecipes[key].name;
                        resolved = true;
                        break;
                    }
                }
            }

            // 查 Sin Items
            if (!resolved && window.CONFIG && window.CONFIG.sinItems) {
                const sinItem = window.CONFIG.sinItems.find(i => i.id === id);
                if (sinItem) {
                    targetName = sinItem.name;
                    resolved = true;
                }
            }

            // If we found a name different from ID, check it
            if (resolved && window.Player.warehouse[targetName] > 0) return true;
        }

        return false;
    },

    /**
     * 獲取物品數量 (主要用於素材)
     * @param {string} idOrName - 物品ID或名稱
     * @param {boolean} checkStorage - 是否檢查倉庫 (預設 true)
     */
    getItemCount(idOrName, checkStorage = true) {
        let count = 0;
        const categories = ['material', 'consumable', 'accessory', 'weapon', 'armor', 'shield'];

        // 1. 背包
        for (let cat of categories) {
            if (window.Player.inventory[cat]) {
                window.Player.inventory[cat].forEach(i => {
                    if (i.id === idOrName || i.name === idOrName) count++;
                });
            }
        }

        // 2. 倉庫 (僅當 checkStorage 為 true)
        // 倉庫使用 名稱 作為 Key
        if (checkStorage && window.Player.warehouse) {
            // 嘗試直接取值 (如果 idOrName 是名稱)
            if (window.Player.warehouse[idOrName]) {
                count += window.Player.warehouse[idOrName];
            }

            // 如果 idOrName 是 ID，我們可能需要遍歷倉庫 (但倉庫只存名稱...)
            // 這是一個潛在問題，如果只傳 ID，倉庫檢查會失敗。
            // 但傳說熔爐傳入的是 "真實之心" (名稱) 和 "acc_pride" (ID)。
            // 對於 Name，直接取值即可。
            // 對於 ID，無法直接從倉庫檢查，除非我們有一個 ID 到 Name 的映射，或者遍歷所有 Config 找 Name。
            // 幸運的是，對於 "真實之心"，我們傳的是名稱。
            // 對於 "七宗罪"，傳的是 ID。但七宗罪飾品通常不會進倉庫(因為是裝備)，除非是委託模式?
            // "委託"將物品送往 PendingWarehouse，結算後進入 Warehouse。
            // 倉庫只存 Name -> Count。
            // 所以，如果我們要檢查 ID，我們必須先找到該 ID 對應的 Name。

            // 嘗試從 Config 查找 Name
            if (!window.Player.warehouse[idOrName]) {
                // 嘗試反查
                let targetName = null;
                // 查 items
                for (let key in CONFIG.craftingRecipes) {
                    if (CONFIG.craftingRecipes[key].id === idOrName) { targetName = CONFIG.craftingRecipes[key].name; break; }
                }
                if (!targetName) {
                    // 查 sinItems
                    if (CONFIG.sinItems) {
                        const sinItem = CONFIG.sinItems.find(i => i.id === idOrName);
                        if (sinItem) targetName = sinItem.name;
                    }
                }

                if (targetName && window.Player.warehouse[targetName]) {
                    count += window.Player.warehouse[targetName];
                }
            }
        }

        return count;
    },

    /**
     * 移除物品 (多個)
     * @param {string} idOrName - 物品ID或名稱
     * @param {number} count - 數量
     */
    removeItems(idOrName, count) {
        let remaining = count;

        // 1. 優先移除背包
        const categories = ['material', 'consumable', 'accessory', 'weapon', 'armor', 'shield'];
        for (let cat of categories) {
            if (window.Player.inventory[cat]) {
                const list = window.Player.inventory[cat];
                for (let i = list.length - 1; i >= 0; i--) {
                    if (remaining <= 0) break;
                    if (list[i].id === idOrName || list[i].name === idOrName) {
                        list.splice(i, 1);
                        remaining--;
                    }
                }
            }
            if (remaining <= 0) break;
        }

        // 2. 如果背包不夠，從倉庫移除
        if (remaining > 0 && window.Player.warehouse) {
            // 同樣需要處理 ID vs Name
            let targetName = idOrName;
            if (!window.Player.warehouse[targetName]) {
                // 嘗試反查 (同 getItemCount)
                // 查 craftingRecipes
                for (let key in CONFIG.craftingRecipes) {
                    if (CONFIG.craftingRecipes[key].id === idOrName) { targetName = CONFIG.craftingRecipes[key].name; break; }
                }
                if (!targetName) {
                    // 查 sinItems
                    if (CONFIG.sinItems) {
                        const sinItem = CONFIG.sinItems.find(i => i.id === idOrName);
                        if (sinItem) targetName = sinItem.name;
                    }
                }
            }

            if (window.Player.warehouse[targetName]) {
                const take = Math.min(remaining, window.Player.warehouse[targetName]);
                window.Player.warehouse[targetName] -= take;
                remaining -= take;
                if (window.Player.warehouse[targetName] <= 0) {
                    delete window.Player.warehouse[targetName];
                }
            }
        }

        window.Game.updateUI();
    },

    /**
     * 一鍵出售素材
     */
    sellAllMaterials() {
        if (window.GameState.phase !== "merchant") return;
        if (window.Player.inventory.material.length === 0) {
            alert("沒有可出售的素材。");
            return;
        }

        const html = `
            <div style="text-align:center;">
                <p style="margin-bottom:15px;">請選擇批量處理方式：</p>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <button onclick="window.ItemSystem.processAllMaterials('sell'); window.UISystem.hideConfirmModal();" class="btn" style="background:#e91e63; padding:15px;">
                        💰 全部出售<br><span style="font-size:0.8em">獲得 100% 金幣</span>
                    </button>
                    <button onclick="window.ItemSystem.processAllMaterials('consign'); window.UISystem.hideConfirmModal();" class="btn" style="background:#00bcd4; padding:15px;">
                        🚚 全部委託<br><span style="font-size:0.8em">獲得 50% 金幣</span>
                    </button>
                </div>
            </div>
        `;
        window.UISystem.showConfirmModal("一鍵處理", html, null, true, false);
    },

    processAllMaterials(mode) {
        let total = 0;
        let keptItems = [];
        let soldCount = 0;
        let consignedItems = {};

        window.Player.inventory.material.forEach(item => {
            if (item.type === 'revive' || item.name === '彈弓' || item.name === '鉤子') {
                keptItems.push(item);
            } else {
                let price = item.price;
                if (window.Player.class === 'merchant') {
                    price = Math.floor(price * 1.2);
                }
                // 天使的恩賜：素材售價 +20%
                if (window.Player.buff && window.Player.buff.id === 'angel_blessing') {
                    price = Math.floor(price * 1.2);
                }

                if (mode === 'consign') {
                    price = Math.floor(price * 0.5);
                    if (!consignedItems[item.name]) consignedItems[item.name] = 0;
                    consignedItems[item.name]++;
                }

                total += price;
                soldCount++;
            }
        });

        if (soldCount === 0) {
            alert("沒有可出售的素材（特殊物品保留）。");
            return;
        }

        window.Player.inventory.material = keptItems;
        window.Player.gold += total;

        if (mode === 'consign') {
            if (!window.Player.pendingWarehouse) window.Player.pendingWarehouse = {};
            for (let [name, count] of Object.entries(consignedItems)) {
                if (!window.Player.pendingWarehouse[name]) window.Player.pendingWarehouse[name] = 0;
                window.Player.pendingWarehouse[name] += count;
            }
            window.Game.showFloatingText("+ " + total + " G (委託)", "yellow");
            window.Game.log(`批量委託了 ${soldCount} 個素材，獲得 ${total} G`);
        } else {
            window.Game.showFloatingText("+ " + total + " G", "yellow");
            window.Game.log(`出售了所有素材，獲得 ${total} G`);
        }

        AudioSystem.playSFX('coin');
        window.Game.updateUI();
    },

    /**
     * 獲取物品描述（含裝備比較）
     * @param {Object} item - 物品對象
     */
    getItemDesc(item) {
        let baseDesc = '';

        if (item.desc) {
            baseDesc = item.desc;
        } else if (item.type === 'weapon') {
            baseDesc = `攻擊力 +${item.val}`;
        } else if (item.type === 'armor') {
            baseDesc = `生命上限 +${item.val}`;
        } else if (item.type === 'shield') {
            baseDesc = `防禦力 +${item.def}`;
        } else if (item.type === 'loot') {
            baseDesc = `戰利品 (可高價出售)`;
        } else {
            baseDesc = "未知物品";
        }

        // 添加裝備比較（僅在背包查看時顯示，非商店）
        if (['weapon', 'armor', 'shield'].includes(item.type) && window.GameState.phase !== 'merchant') {
            const comparison = this.getEquipmentComparison(item);
            if (comparison) {
                baseDesc += ` ${comparison}`;
            }
        }

        return baseDesc;
    },

    /**
     * 獲取裝備比較文字
     * @param {Object} newItem - 新物品
     */
    getEquipmentComparison(newItem) {
        const currentEquip = window.Player.equipment[newItem.type];
        if (!currentEquip) return '';

        let diff = 0;
        if (newItem.type === 'shield') {
            diff = (newItem.def || 0) - (currentEquip.def || 0);
        } else {
            diff = (newItem.val || 0) - (currentEquip.val || 0);
        }

        if (diff === 0) {
            return '(=)';
        } else if (diff > 0) {
            return `(+${diff})`;
        } else {
            return `(${diff})`;
        }
    },

    /**
     * 處理物品點擊事件
     * @param {number} index - 物品索引
     * @param {string} category - 物品類別
     */
    handleItemClick(index, category) {
        // 死亡狀態禁止操作背包
        if (window.Player.hp <= 0 || window.GameState.phase === 'dead') return;

        if (window.GameState.phase === "merchant") {
            if (category === 'material') {
                const item = window.Player.inventory[category][index];
                const html = `
                    <div style="text-align:center;">
                        <p style="margin-bottom:15px;">處理物品：<span class="${CONFIG.rarityDisplay[item.rarity].color}">${item.name}</span></p>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                            <button onclick="window.ItemSystem.sellItem(${index}, '${category}', 'sell', true); window.UISystem.hideModal();" class="btn" style="background:#e91e63; padding:15px;">
                                💰 直接出售<br><span style="font-size:0.8em">獲得 100% 金幣<br>物品消失</span>
                            </button>
                            <button onclick="window.ItemSystem.sellItem(${index}, '${category}', 'consign', true); window.UISystem.hideModal();" class="btn" style="background:#00bcd4; padding:15px;">
                                🚚 委託運送<br><span style="font-size:0.8em">獲得 50% 金幣<br>物品送往倉庫</span>
                            </button>
                        </div>
                    </div>
                `;
                window.UISystem.showModal(`處理 ${item.name}`, html);
            } else {
                this.sellItem(index, category);
            }
            return;
        }

        const item = window.Player.inventory[category][index];
        if (['weapon', 'armor', 'shield', 'accessory'].includes(item.type)) {
            window.UISystem.showConfirmModal(
                "裝備物品",
                `要裝備 <span class="${CONFIG.rarityDisplay[item.rarity].color}">${item.name}</span> (${this.getItemDesc(item)}) 嗎？`,
                () => this.equip(index, category)
            );
        } else if (item.type === 'consumable' || item.type === 'scroll') {
            this.useItem(index, category);
        } else {
            alert(`${item.name}: ${item.desc || "素材/戰利品"}`);
        }
    },

    /**
     * 獲取所有物品（用於圖鑑）
     */
    getAllItems() {
        const items = [];
        items.push(...CONFIG.itemPool);

        for (let [name, data] of Object.entries(CONFIG.lootData)) {
            items.push({ ...data, name: name, type: 'material' });
        }

        items.push(CONFIG.phoenixFeather);

        return items.sort((a, b) => {
            const rA = CONFIG.rarityDisplay[a.rarity].val;
            const rB = CONFIG.rarityDisplay[b.rarity].val;
            if (rA !== rB) return rA - rB;
            return a.name.localeCompare(b.name);
        });
    },

    /**
     * 自動裝備最強裝備
     */
    autoEquipBest() {
        const types = ['weapon', 'armor', 'shield'];
        let equippedCount = 0;

        types.forEach(type => {
            // 每次都需要重新尋找，因為裝備後背包索引會改變
            let bestItemIndex = -1;
            let maxVal = -1;

            window.Player.inventory.equipment.forEach((item, index) => {
                if (item.type === type) {
                    // 根據裝備類型選擇比較屬性
                    const itemVal = (type === 'shield') ? (item.def || 0) : (item.val || 0);

                    if (itemVal > maxVal) {
                        maxVal = itemVal;
                        bestItemIndex = index;
                    }
                }
            });

            if (bestItemIndex !== -1) {
                // 檢查是否比身上穿的還強（雖然鐵匠鋪出來通常是空的）
                const current = window.Player.equipment[type];
                const currentVal = current ? ((type === 'shield') ? (current.def || 0) : (current.val || 0)) : -1;

                if (!current || maxVal > currentVal) {
                    this.equip(bestItemIndex, 'equipment');
                    equippedCount++;
                }
            }
        });

        if (equippedCount > 0) {
            window.Game.showFloatingText("已自動裝備最強裝備", "#69f0ae");
        }
    }
    ,

    /**
     * 煉金術合成
     */
    /**
     * 煉金術合成
     * @param {string} recipeId - 配方ID
     * @param {boolean} useInventory - 是否使用背包素材 (隨身合成用)
     */
    craftItem(recipeId, useInventory = false) {
        const recipe = CONFIG.recipes[recipeId];
        if (!recipe) return;

        const useWarehouse = !useInventory;

        // 1. 檢查素材
        for (let mat of recipe.materials) {
            if (this.getItemCount(mat.item, useWarehouse) < mat.count) {
                window.UISystem.showToast(`${useWarehouse ? '倉庫' : '背包'}素材不足: ${mat.item}`, "error");
                return;
            }
        }

        // 2. 扣除素材
        for (let mat of recipe.materials) {
            this.removeItems(mat.item, mat.count, useWarehouse);
        }

        // 3. 生成物品
        const newItem = {
            name: recipe.name,
            icon: recipe.icon,
            desc: recipe.desc,
            type: recipe.resultType,
            rarity: 'special', // 特殊稀有度
            val: recipe.val || 0,
            buffId: recipe.buffId, // 傳遞 Buff ID
            price: 0
        };

        if (useInventory) {
            // 隨身合成 -> 放入背包
            this.addItemToInventory(newItem);
            AudioSystem.playSFX('potion');
            window.UISystem.showToast(`合成成功: ${newItem.name}`, "success");
            window.UISystem.renderPortableCrafting(); // 刷新介面
        } else {
            // 煉金術士 -> 放入倉庫
            if (!window.Player.warehouse[newItem.name]) {
                window.Player.warehouse[newItem.name] = 0;
            }
            window.Player.warehouse[newItem.name]++;

            // 保存數據
            window.Game.savePersistentData();

            // 4. 音效與更新
            AudioSystem.playSFX('potion');
            window.UISystem.showConfirmModal(
                "煉金成功",
                `你成功合成了 <span style="color:#ffd700">${newItem.name}</span>！<br>物品已安全存入您的倉庫。`,
                null,
                false
            );
            window.UISystem.updateAlchemyUI();
        }

        window.Game.updateUI();
    },

    /**
     * 從背包中移除特定物品物件
     * @param {Object} targetItem - 要移除的物品物件
     */
    removeItemFromInventory(targetItem) {
        const categories = ['equipment', 'accessory', 'consumable', 'material'];
        for (const cat of categories) {
            if (!window.Player.inventory[cat]) continue;
            const idx = window.Player.inventory[cat].indexOf(targetItem);
            if (idx !== -1) {
                window.Player.inventory[cat].splice(idx, 1);
                return;
            }
        }
    }
};

// 工匠強化系統輔助函數
function getBlacksmithRate(currentEnhance) {
    const rates = [90, 80, 70, 60, 50, 40, 30, 20]; // 提升機率 (原: 80~10)
    const rate = rates[currentEnhance] || 0;
    return {
        rate: rate,
        color: rate >= 50 ? '#69f0ae' : rate >= 30 ? '#ff9800' : '#ff5252'
    };
}

// 導出模組
window.ItemSystem = ItemSystem;
console.log('ItemSystem loaded');
window.getBlacksmithRate = getBlacksmithRate;

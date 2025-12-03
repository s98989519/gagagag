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
        } else if (item.type === 'consumable') {
            window.Player.inventory.consumable.push(item);
        } else {
            window.Player.inventory.material.push(item);
        }

        // 如果是新物品
        if (isNewItem && window.Game) {
            // 保存圖鑑
            window.Game.savePersistentData();

            // 傳說物品特效觸發（只在第一次獲得時）
            if (['legendary', 'mythic', 'ultra'].includes(item.rarity) && window.UISystem) {
                window.UISystem.showLegendaryEffect();
            }
        }

        if (render) window.Game.updateUI();
    },

    /**
     * 裝備物品
     * @param {number} index - 物品索引
     * @param {string} category - 物品類別
     */
    equip(index, category) {
        const item = window.Player.inventory[category][index];
        const type = item.type;

        if (!['weapon', 'armor', 'shield'].includes(type)) return;

        // 交換邏輯
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
     * @param {string} type - 裝備類型（weapon/armor/shield）
     */
    unequip(type) {
        if (!window.Player.equipment[type]) return;

        const item = window.Player.equipment[type];
        const typeNames = { weapon: '武器', armor: '防具', shield: '盾牌' };

        window.UISystem.showConfirmModal(
            "卸下裝備",
            `確定要卸下 <span style="color:#69f0ae">${item.name}</span> 嗎？`,
            () => {
                this.addItemToInventory(item, false);
                window.Player.equipment[type] = null;

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

        if (item.type === 'revive' || item.name === '彈弓' || item.name === '鉤子') {
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
                    <button onclick="window.ItemSystem.processAllMaterials('sell'); window.UISystem.hideModal();" class="btn" style="background:#e91e63; padding:15px;">
                        💰 全部出售<br><span style="font-size:0.8em">獲得 100% 金幣</span>
                    </button>
                    <button onclick="window.ItemSystem.processAllMaterials('consign'); window.UISystem.hideModal();" class="btn" style="background:#00bcd4; padding:15px;">
                        🚚 全部委託<br><span style="font-size:0.8em">獲得 50% 金幣</span>
                    </button>
                </div>
            </div>
        `;
        window.UISystem.showModal("一鍵處理", html);
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
        if (['weapon', 'armor', 'shield'].includes(item.type)) {
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
     * 獲取物品數量
     * @param {string} itemName - 物品名稱
     * @param {boolean} useWarehouse - 是否檢查倉庫 (預設 false)
     */
    getItemCount(itemName, useWarehouse = false) {
        if (useWarehouse) {
            return window.Player.warehouse[itemName] || 0;
        }

        // 檢查所有背包分類
        let count = 0;
        if (window.Player.inventory.material) {
            count += window.Player.inventory.material.filter(i => i.name === itemName).length;
        }
        if (window.Player.inventory.consumable) {
            count += window.Player.inventory.consumable.filter(i => i.name === itemName).length;
        }
        // 裝備通常不作為消耗素材，但如果需要也可以檢查
        return count;
    },

    /**
     * 移除物品 (指定數量)
     * @param {string} itemName - 物品名稱
     * @param {number} count - 數量
     * @param {boolean} useWarehouse - 是否從倉庫移除 (預設 false)
     */
    removeItems(itemName, count, useWarehouse = false) {
        if (useWarehouse) {
            if (window.Player.warehouse[itemName]) {
                window.Player.warehouse[itemName] -= count;
                if (window.Player.warehouse[itemName] <= 0) {
                    delete window.Player.warehouse[itemName];
                }
            }
            window.Game.updateUI(); // 更新 UI (雖然倉庫介面可能看不到，但保持一致)
            return;
        }

        let removed = 0;
        const categories = ['material', 'consumable'];

        for (let cat of categories) {
            if (!window.Player.inventory[cat]) continue;

            for (let i = window.Player.inventory[cat].length - 1; i >= 0; i--) {
                if (removed >= count) break;
                if (window.Player.inventory[cat][i].name === itemName) {
                    window.Player.inventory[cat].splice(i, 1);
                    removed++;
                }
            }
            if (removed >= count) break;
        }
        window.Game.updateUI();
    },

    /**
     * 煉金術合成
     */
    craftItem(recipeId) {
        const recipe = CONFIG.recipes[recipeId];
        if (!recipe) return;

        // 1. 檢查素材 (從倉庫)
        for (let mat of recipe.materials) {
            if (this.getItemCount(mat.item, true) < mat.count) {
                window.UISystem.showToast(`倉庫素材不足: ${mat.item}`, "error");
                return;
            }
        }

        // 2. 扣除素材 (從倉庫)
        for (let mat of recipe.materials) {
            this.removeItems(mat.item, mat.count, true);
        }

        // 3. 生成物品並存入倉庫
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

        // 存入倉庫
        if (!window.Player.warehouse[newItem.name]) {
            window.Player.warehouse[newItem.name] = 0;
        }
        window.Player.warehouse[newItem.name]++;

        // 4. 音效與更新
        AudioSystem.playSFX('potion');
        window.UISystem.showConfirmModal(
            "煉金成功",
            `你成功合成了 <span style="color:#ffd700">${newItem.name}</span>！<br>物品已安全存入您的倉庫。`,
            () => { } // 僅作為通知，無需回調
        );
        window.UISystem.updateAlchemyUI();
        window.Game.updateUI();
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

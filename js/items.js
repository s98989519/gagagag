/**
 * 幻想冒險 - 物品系統模組
 * 處理物品生成、管理和裝備邏輯
 * @版本 v2.0
 * @更新 2025-11-27
 */

const ItemSystem = {
    /**
     * 生成隨機物品
     * @param {string} tierModifier - 等級修正（normal/elite/boss）
     */
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
        this.addItemToInventory(item, false);
        window.Player.equipment[type] = null;

        AudioSystem.playSFX('unequip');  // 卸裝音效

        window.Game.recalcStats();
        window.Game.updateUI();

        const typeNames = { weapon: '武器', armor: '防具', shield: '盾牌' };
        window.Game.log(`卸下了${typeNames[type]}`);
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

            // 天使的活力：藥水效果 +50%
            if (window.Player.buff && window.Player.buff.id === 'angel_vitality') {
                heal = Math.floor(heal * 1.5);
            }

            window.Player.hp = Math.min(window.Player.maxHp, window.Player.hp + heal);
            window.Player.inventory[category].splice(index, 1);
            AudioSystem.playSFX('potion');  // 喝藥水音效
            window.Game.showFloatingText(`+${heal} HP`, "#69f0ae");
            window.Game.updateUI();
        }
    },

    /**
     * 出售物品
     * @param {number} index - 物品索引
     * @param {string} category - 物品類別
     */
    sellItem(index, category) {
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

        if (confirm(`確定要以 ${price} G 出售 ${item.name} 嗎？`)) {
            window.Player.inventory[category].splice(index, 1);
            window.Player.gold += price;
            AudioSystem.playSFX('coin');  // 出售獲得金幣音效
            window.Game.showFloatingText("+ " + price + " G", "yellow");
            window.Game.log(`出售 ${item.name} 獲得 ${price} G`);
            window.Game.updateUI();
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

        let total = 0;
        let keptItems = [];

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
                total += price;
            }
        });

        window.Player.inventory.material = keptItems;
        window.Player.gold += total;
        AudioSystem.playSFX('coin');  // 出售素材獲得金幣音效
        window.Game.showFloatingText("+ " + total + " G", "yellow");
        window.Game.log(`出售了所有素材，獲得 ${total} G`);
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
            baseDesc = `抵擋 ${item.val} 次攻擊`;
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

        const diff = newItem.val - currentEquip.val;
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
            this.sellItem(index, category);
            return;
        }

        const item = window.Player.inventory[category][index];
        if (['weapon', 'armor', 'shield'].includes(item.type)) {
            if (confirm(`要裝備 ${item.name} (${this.getItemDesc(item)}) 嗎？`)) {
                this.equip(index, category);
            }
        } else if (item.type === 'consumable') {
            if (confirm(`要使用 ${item.name} (${item.desc}) 嗎？`)) {
                this.useItem(index, category);
            }
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
                    // 簡單比較數值，若有更複雜的評價標準可在此擴充
                    if (item.val > maxVal) {
                        maxVal = item.val;
                        bestItemIndex = index;
                    }
                }
            });

            if (bestItemIndex !== -1) {
                // 檢查是否比身上穿的還強（雖然鐵匠鋪出來通常是空的）
                const current = window.Player.equipment[type];
                if (!current || maxVal > current.val) {
                    this.equip(bestItemIndex, 'equipment');
                    equippedCount++;
                }
            }
        });

        if (equippedCount > 0) {
            window.Game.showFloatingText("已自動裝備最強裝備", "#69f0ae");
        }
    }
};

// 工匠強化系統輔助函數
function getBlacksmithRate(currentEnhance) {
    const rates = [80, 70, 60, 50, 40, 30, 20, 10];
    const rate = rates[currentEnhance] || 0;
    return {
        rate: rate,
        color: rate >= 50 ? '#69f0ae' : rate >= 30 ? '#ff9800' : '#ff5252'
    };
}

// 綁定到全域
if (typeof window !== 'undefined') {
    window.ItemSystem = ItemSystem;
    window.getBlacksmithRate = getBlacksmithRate;
}

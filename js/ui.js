/**
 * 幻想冒險 - UI渲染系統模組
 * 處理所有UI更新和渲染邏輯
 * @版本 v2.1
 * @更新 2025-11-29
 */

const UISystem = {
    /**
     * 觸發動畫
     */
    triggerAnim(id, animClass) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove(animClass);
            void el.offsetWidth;
            el.classList.add(animClass);
        }
    },

    /**
     * 顯示浮動文字（隨機分散顯示，避免重疊）
     */
    showFloatingText(text, color) {
        const display = document.getElementById('event-display');
        const div = document.createElement('div');
        div.className = 'floating-text';
        div.innerHTML = text;
        div.style.color = color;

        // 隨機選擇水平位置：左(25%)、中(50%)、右(75%)
        const positions = ['25%', '50%', '75%'];
        const randomPos = positions[Math.floor(Math.random() * positions.length)];
        div.style.left = randomPos;

        // 隨機垂直起始位置，避免重疊 (30%-60%)
        const randomTop = 30 + Math.random() * 30;
        div.style.top = `${randomTop}%`;

        display.appendChild(div);

        setTimeout(() => {
            div.remove();
        }, 1000);
    },

    /**
     * 渲染事件
     */
    renderEvent(title, subtitle, content, icon) {
        document.getElementById('event-title').innerHTML = title;
        document.getElementById('event-desc').innerHTML = `<p>${subtitle}</p><p>${content}</p>`;

        const iconEl = document.getElementById('event-icon');
        if (icon) {
            // 檢查是否為圖片路徑 (包含 / 或 .png/.jpg 等)
            if (icon.includes('/') || icon.includes('.')) {
                iconEl.innerHTML = `<img src="${icon}" alt="icon" class="event-image">`;
                // 移除可能存在的 emoji 文字
                if (iconEl.firstChild.nodeType === 3) iconEl.firstChild.remove();
            } else {
                iconEl.innerText = icon;
            }
        }

        // Reset scroll position
        const display = document.getElementById('event-display');
        if (display) display.scrollTop = 0;

        // Always hide merchant area by default when rendering a new event.
        // Specific UIs (Merchant, Blacksmith) will unhide it if needed.
        const merchantArea = document.getElementById('merchant-area');
        if (merchantArea) merchantArea.classList.add('hidden');
    },

    /**
     * 獲取怪物意圖 HTML
     */
    getIntentHtml(enemy) {
        if (!enemy || !enemy.nextAction) return "";

        let icon = "";
        let text = "";
        let color = "white";

        switch (enemy.nextAction.type) {
            case 'attack':
                icon = "⚔️";
                text = "攻擊";
                color = "#ff5252";
                break;
            case 'heavy':
                icon = "💥";
                text = "重擊";
                color = "#d32f2f";
                break;
            case 'defend':
                icon = "🛡️";
                text = "防禦";
                color = "#2196f3";
                break;
            case 'heal':
                icon = "💚";
                text = "回復";
                color = "#4caf50";
                break;
            case 'buff':
                icon = "✨";
                text = "強化";
                color = "#ff9800";
                break;
            case 'skill':
                if (enemy.nextAction.name === 'WingStorm') {
                    icon = "🌪️";
                    text = "風暴之翼";
                    color = "#4fc3f7";
                } else if (enemy.nextAction.name === 'Plunder') {
                    icon = "💰";
                    text = "掠奪";
                    color = "#ffeb3b";
                } else {
                    icon = "⚡";
                    text = "技能";
                    color = "#9c27b0";
                }
                break;
            case 'prepare_flee':
                icon = "🎒";
                text = "準備逃跑";
                color = "orange";
                break;
            case 'flee':
                icon = "💨";
                text = "逃跑";
                color = "gray";
                break;
            default:
                icon = "❓";
                text = "未知";
                color = "gray";
        }

        return `<span style="color: ${color}; font-weight: bold; margin-right: 15px;">${icon} ${text}</span>`;
    },

    /**
     * 設置按鈕
     */
    setButtons(mainText, mainAction, subText, subAction, disableSub) {
        const b1 = document.getElementById('btn-main');
        const b2 = document.getElementById('btn-sub');
        b1.innerText = mainText;

        // 智能路由：根據函數名稱決定從哪個對象調用
        b1.onclick = () => {
            if (window.Game[mainAction]) {
                window.Game[mainAction]();
            } else if (window.CombatSystem[mainAction]) {
                window.CombatSystem[mainAction]();
            } else if (window.EventSystem[mainAction]) {
                window.EventSystem[mainAction]();
            }
        };

        b2.innerText = subText;
        if (subAction) {
            b2.onclick = () => {
                if (window.Game[subAction]) {
                    window.Game[subAction]();
                } else if (window.CombatSystem[subAction]) {
                    window.CombatSystem[subAction]();
                } else if (window.EventSystem[subAction]) {
                    window.EventSystem[subAction]();
                }
            };
        }
        b2.disabled = disableSub;

        // 確保非戰鬥狀態下隱藏防禦按鈕
        if (window.UISystem && window.UISystem.hideCombatButtons) {
            window.UISystem.hideCombatButtons();
        }
    },

    /**
     * 設置戰鬥按鈕 (含防禦)
     */
    setCombatButtons(mainText, mainAction, subText, subAction, defAction) {
        const b1 = document.getElementById('btn-main');
        const b2 = document.getElementById('btn-sub');
        const bDef = document.getElementById('btn-defend');
        const bSkill = document.getElementById('btn-skill');
        const bUlt = document.getElementById('btn-ultimate');

        b1.innerText = mainText;
        b1.onclick = () => {
            if (window.Game[mainAction]) window.Game[mainAction]();
            else if (window.CombatSystem[mainAction]) window.CombatSystem[mainAction]();
        };

        // 顯示防禦按鈕
        if (bDef) {
            bDef.classList.remove('hidden');
            bDef.onclick = () => {
                if (window.CombatSystem[defAction]) window.CombatSystem[defAction]();
            };
        }

        // 顯示技能按鈕 (已移除：使用者認為不需要)
        if (bSkill) {
            bSkill.classList.add('hidden');
        }

        // 顯示終結技按鈕
        if (bUlt) {
            bUlt.classList.remove('hidden');
            bUlt.onclick = () => window.CombatSystem.playerUltimate();

            // [FIX] 動態計算 SP 需求 (所有職業 Lv5: 7, Lv6: 6)
            let requiredSp = 8; // 預設
            const classId = window.Player.class === 'monkey' ? 'ape' : window.Player.class;
            const skillLv = (window.Player.skillLevels && window.Player.skillLevels[classId]) ? window.Player.skillLevels[classId] : 1;
            if (skillLv >= 6) requiredSp = 6;
            else if (skillLv >= 5) requiredSp = 7;

            if (window.Player.sp >= requiredSp) {
                bUlt.classList.add('glow-gold');
                bUlt.disabled = false;
                bUlt.innerHTML = "🔥 終結技 (已就緒)";
            } else {
                bUlt.classList.remove('glow-gold');
                bUlt.disabled = true;
                bUlt.innerHTML = `🔥 終結技 (${window.Player.sp}/${requiredSp})`;
            }
        }

        b2.innerText = subText;
        b2.onclick = () => {
            if (window.CombatSystem[subAction]) window.CombatSystem[subAction]();
        };
        b2.disabled = false;
    },

    /**
     * 隱藏戰鬥按鈕
     */
    hideCombatButtons() {
        const bDef = document.getElementById('btn-defend');
        const bSkill = document.getElementById('btn-skill');
        const bUlt = document.getElementById('btn-ultimate');

        if (bDef) bDef.classList.add('hidden');
        if (bSkill) bSkill.classList.add('hidden');
        if (bUlt) bUlt.classList.add('hidden');
    },

    /**
     * 更新狀態UI
     */
    updateStatsUI() {
        const player = window.Player;
        document.getElementById('hp-val').innerText = player.hp;
        document.getElementById('max-hp-val').innerText = player.maxHp;

        // 更新 SP
        const spEl = document.getElementById('sp-val');
        const maxSpEl = document.getElementById('max-sp-val');
        const spBar = document.getElementById('player-sp-bar');

        if (spEl && maxSpEl && spBar) {
            spEl.innerText = player.sp;
            maxSpEl.innerText = player.maxSp;
            const spPercent = (player.sp / player.maxSp) * 100;
            spBar.style.width = spPercent + '%';
        }

        document.getElementById('atk-val').innerText = window.Game.getAtk();
        // --- 新增：計算防禦減免率 ---
        const totalDef = window.Game.getDef();
        const drRaw = totalDef / (totalDef + 50); // DR 公式: Def / (Def + 50)
        const drDisplay = Math.round(drRaw * 100);

        // --- 修正防禦力面板顯示，讓它更有意義 ---
        document.getElementById('def-val').innerText = `${totalDef} (${drDisplay}%)`;
        document.getElementById('crit-val').innerText = window.Game.getCrit() + '%';
        // [New] 顯示閃避率
        document.getElementById('evasion-val').innerText = window.Game.getEvasion() + '%';
        document.getElementById('gold-val').innerText = player.gold;

        // [New] 更新大廳 EP 顯示 (若存在)
        const hubEpEl = document.getElementById('hub-ep-value');
        if (hubEpEl) {
            // [Fix] 確保顯示最新 EP
            hubEpEl.innerText = player.explorationPoints;
        }

        // 顯示深度與區域
        const biome = window.Game.getCurrentBiome();
        const biomeText = biome ? ` (${biome.name})` : '';
        document.getElementById('depth-val').innerText = player.depth + biomeText;

        // 更新玩家血條
        const healthBar = document.getElementById('player-health-bar');
        const healthPercent = player.maxHp > 0 ? (player.hp / player.maxHp) * 100 : 0;
        healthBar.style.width = healthPercent + '%';

        // 根據血量百分比改變血條顏色
        healthBar.className = 'health-bar';
        if (healthPercent <= 30) {
            healthBar.classList.add('low');
        } else if (healthPercent <= 50) {
            healthBar.classList.add('medium');
        }

        // 控制低血量覆蓋層
        const lowHealthOverlay = document.getElementById('low-health-overlay');
        if (healthPercent <= 30 && player.hp > 0) {
            lowHealthOverlay.classList.remove('hidden');
        } else {
            lowHealthOverlay.classList.add('hidden');
        }

        const buffEl = document.getElementById('buff-display');
        let buffHtml = "狀態: ";
        let buffAlertText = "";
        let hasBuff = false;

        // 1. 常駐 Buff
        if (player.buff) {
            const style = player.buff.type === 'angel' ? 'angel-text' : 'demon-text';
            buffHtml += `<span class="${style}">${player.buff.name}</span>`;
            buffAlertText += `【${player.buff.name}】(常駐)\n${player.buff.desc}\n\n`;
            hasBuff = true;
        }

        // 2. 額外/臨時 Buff
        if (player.extraBuffs && player.extraBuffs.length > 0) {
            if (hasBuff) buffHtml += " | "; // 分隔符
            player.extraBuffs.forEach((b, index) => {
                if (index > 0) buffHtml += " | ";
                // 根據 Buff 類型決定顏色 (預設用 demon-text 因為很多是惡魔)
                const style = 'demon-text';
                const icon = b.icon || '';
                buffHtml += `<span class="${style}">${icon}${b.name}(${b.turns})</span>`;
                buffAlertText += `【${b.name}】(剩餘 ${b.turns} 回合)\n${b.desc || '無描述'}\n\n`;
            });
            hasBuff = true;
        }

        // 3. 特殊戰鬥狀態：哈比威脅
        if (window.GameState.harpyThreat) {
            if (hasBuff) buffHtml += " | ";
            buffHtml += `<span class="damage-text" style="color:#ff5722">🦅 來自空中的威脅</span>`;
            buffAlertText += `【來自空中的威脅】\n受到哈比的精準盯防！\n逃跑率降低 40%，且逃跑失敗時會被偷竊物品！\n\n`;
            hasBuff = true;
        }

        if (hasBuff) {
            buffHtml += ` <span style="font-size:0.8em; cursor:pointer;">(點擊查看)</span>`;
            buffEl.onclick = () => UISystem.showBuffModal();
        } else {
            buffHtml += "無";
            buffEl.onclick = null;
        }

        buffEl.innerHTML = buffHtml;
    },

    /**
     * 渲染裝備槽位
     */
    updateEquipmentSlots() {
        const player = window.Player;
        const w = player.equipment.weapon;
        const a = player.equipment.armor;
        const s = player.equipment.shield;

        const getDisplayHtml = (item) => {
            if (!item) return null;

            // 獲取數值文字
            let statText = "";
            if (item.type === 'weapon') statText = `(攻擊+${item.val})`;
            else if (item.type === 'armor') statText = `(生命+${item.val})`;
            else if (item.type === 'shield') statText = `(防禦+${item.def || item.val})`;

            // 如果有名稱後綴，將數值插入到後綴之前
            let displayName = item.name;
            if (item.suffix && window.CONFIG.affixes.suffixes[item.suffix]) {
                const suffixName = window.CONFIG.affixes.suffixes[item.suffix].name;
                if (displayName.endsWith(suffixName)) {
                    // 插入數值到後綴前
                    const basePart = displayName.substring(0, displayName.length - suffixName.length);
                    displayName = `${basePart} <span style="font-size:0.9em; color:#ddd;">${statText}</span> ${suffixName}`;
                } else {
                    // 找不到後綴匹配（可能名稱格式不符），直接追加
                    displayName += ` <span style="font-size:0.9em; color:#ddd;">${statText}</span>`;
                }
            } else {
                // 無後綴，直接追加
                displayName += ` <span style="font-size:0.9em; color:#ddd;">${statText}</span>`;
            }

            return `<span class="${CONFIG.rarityDisplay[item.rarity].color}">${item.icon} ${displayName}</span>`;
        };

        const wEl = document.getElementById('slot-weapon');
        wEl.innerHTML = getDisplayHtml(w) || "無武器";
        wEl.className = `equip-slot ${w ? CONFIG.rarityDisplay[w.rarity].color : ''}`;

        const aEl = document.getElementById('slot-armor');
        aEl.innerHTML = getDisplayHtml(a) || "無防具";
        aEl.className = `equip-slot ${a ? CONFIG.rarityDisplay[a.rarity].color : ''}`;

        const sEl = document.getElementById('slot-shield');
        sEl.innerHTML = getDisplayHtml(s) || "無盾牌";
        sEl.className = `equip-slot ${s ? CONFIG.rarityDisplay[s.rarity].color : ''}`;

        // 飾品欄位渲染
        const accessories = player.equipment.accessories || [null, null, null];
        for (let i = 0; i < 3; i++) {
            const acc = accessories[i];
            const accEl = document.getElementById(`slot-acc-${i + 1}`);
            if (accEl) {
                accEl.innerHTML = getDisplayHtml(acc) || "無飾品";
                accEl.className = `equip-slot ${acc ? CONFIG.rarityDisplay[acc.rarity].color : ''}`;

                // 點擊卸下
                if (acc) {
                    accEl.onclick = () => window.ItemSystem.unequip('accessory', i);
                    accEl.style.cursor = 'pointer';
                } else {
                    accEl.onclick = null;
                    accEl.style.cursor = 'default';
                }
            }
        }
    },

    /**
     * 渲染背包列表
     */
    renderInvList(id, items, category) {
        const list = document.getElementById(id);
        list.innerHTML = "";

        // 裝備不堆疊，其他類別堆疊顯示
        if (category === 'equipment') {
            items.forEach((item) => {
                this.createItemElement(list, item, category, false);
            });
        } else {
            // 堆疊邏輯
            const groups = {};
            items.forEach(item => {
                if (!groups[item.name]) {
                    groups[item.name] = { item: item, count: 0 };
                }
                groups[item.name].count++;
            });

            Object.values(groups).forEach(group => {
                this.createItemElement(list, group.item, category, true, group.count);
            });
        }
    },

    /**
     * 創建物品元素（輔助函數）
     */
    createItemElement(container, item, category, isStacked, count = 1) {
        const div = document.createElement('div');
        div.className = `item ${CONFIG.rarityDisplay[item.rarity].color}`;
        if (item.rarity === 'epic') div.classList.add('rare-epic');
        if (item.rarity === 'legendary') div.classList.add('rare-legendary');
        if (item.rarity === 'mythic') div.classList.add('rarity-mythic');

        const countText = (isStacked && count > 1) ? ` x${count}` : '';

        // 獲取數值文字
        let statText = "";
        if (item.type === 'weapon') statText = ` (攻擊+${item.val})`;
        else if (item.type === 'armor') statText = ` (生命+${item.val})`;
        else if (item.type === 'shield') statText = ` (防禦+${item.def || item.val})`;

        // 構建顯示名稱
        let displayName = item.name;
        if (['weapon', 'armor', 'shield'].includes(item.type)) {
            if (item.suffix && window.CONFIG.affixes.suffixes[item.suffix]) {
                const suffixName = window.CONFIG.affixes.suffixes[item.suffix].name;
                if (displayName.endsWith(suffixName)) {
                    // 插入數值到後綴前
                    const basePart = displayName.substring(0, displayName.length - suffixName.length);
                    displayName = `${basePart} <span style="font-size:0.9em; color:#ddd;">${statText}</span> ${suffixName}`;
                } else {
                    displayName += ` <span style="font-size:0.9em; color:#ddd;">${statText}</span>`;
                }
            } else {
                displayName += ` <span style="font-size:0.9em; color:#ddd;">${statText}</span>`;
            }
        }

        div.innerHTML = `${item.icon || '📦'} ${displayName}${countText}`;

        div.onclick = () => {
            const originalArray = window.Player.inventory[category];
            const originalIndex = originalArray.findIndex(originalItem => originalItem === item);
            if (originalIndex !== -1) {
                window.ItemSystem.handleItemClick(originalIndex, category);
            }
        };

        container.appendChild(div);
    },

    /**
     * 更新所有UI
     */
    updateUI() {
        this.updateStatsUI();
        this.updateEquipmentSlots();
        this.updateInventoryUI();

        const player = window.Player;
        const gameState = window.GameState;

        // 自動存檔
        if (!gameState.isLoading && player.hp > 0 && player.class) {
            window.Game.saveGame();
        }
    },

    /**
     * 更新所有背包UI
     */
    updateInventoryUI() {
        const player = window.Player;
        const sortPref = window.GameState.inventorySortPreference;

        // 分離裝備與飾品
        // 分離裝備與飾品
        const allEquipment = player.inventory.equipment || [];
        const weaponsAndArmor = allEquipment; // equipment 陣列只包含 weapon/armor/shield，無需過濾
        const accessories = player.inventory.accessory || []; // [Fix] 飾品儲存在獨立的 accessory 陣列中

        // 排序並渲染裝備
        const sortedEquip = this.sortInventory(weaponsAndArmor, sortPref.equipment);
        this.renderInvList('inv-equip', sortedEquip, 'equipment');

        // 排序並渲染飾品 (使用相同的排序偏好，或者可以新增飾品專用的)
        const sortedAcc = this.sortInventory(accessories, sortPref.equipment);
        this.renderInvList('inv-accessory', sortedAcc, 'accessory'); // [Fix] category 改為 accessory 以正確對應 inventory.accessory 陣列

        // 更新排序按鈕狀態
        this.updateSortButtons('equipment', sortPref.equipment);

        this.renderInvList('inv-consum', player.inventory.consumable, 'consumable');
        this.renderInvList('inv-mat', player.inventory.material, 'material');
    },

    /**
     * 排序背包物品
     */
    sortInventory(items, sortType) {
        if (!items || items.length === 0) return items;

        const sorted = [...items]; // 創建副本避免修改原陣列

        if (sortType === 'rarity') {
            // 按稀有度排序（從高到低）
            const rarityOrder = {
                'ultra': 7,
                'mythic': 6,
                'legendary': 5,
                'epic': 4,
                'rare': 3,
                'uncommon': 2,
                'common': 1
            };
            sorted.sort((a, b) => {
                const rarityDiff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
                if (rarityDiff !== 0) return rarityDiff;
                // 稀有度相同時按名稱排序
                return a.name.localeCompare(b.name);
            });
        } else if (sortType === 'type') {
            // 按類型排序（武器 > 防具 > 盾牌）
            const typeOrder = { 'weapon': 1, 'armor': 2, 'shield': 3 };
            sorted.sort((a, b) => {
                const typeDiff = (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
                if (typeDiff !== 0) return typeDiff;
                // 類型相同時按名稱排序
                return a.name.localeCompare(b.name);
            });
        }

        return sorted;
    },

    /**
     * 切換排序方式
     */
    toggleSort(category, sortType) {
        const currentSort = window.GameState.inventorySortPreference[category];

        // 如果點擊已選中的排序方式，切換回預設
        if (currentSort === sortType) {
            window.GameState.inventorySortPreference[category] = 'default';
        } else {
            window.GameState.inventorySortPreference[category] = sortType;
        }

        // 儲存偏好並更新UI
        window.Game.saveGame();
        this.updateInventoryUI();
    },

    /**
     * 更新排序按鈕狀態
     */
    updateSortButtons(category, activeSort) {
        const rarityBtn = document.getElementById(`sort-${category}-rarity`);
        const typeBtn = document.getElementById(`sort-${category}-type`);

        if (rarityBtn) {
            rarityBtn.classList.toggle('active', activeSort === 'rarity');
        }
        if (typeBtn) {
            typeBtn.classList.toggle('active', activeSort === 'type');
        }
    },

    /**
     * 顯示確認模態框
     * @param {string} title - 標題
     * @param {string} message - 訊息內容
     * @param {Function} onConfirm - 確認回調
     * @param {boolean} showCancel - 是否顯示取消按鈕
     * @param {boolean} showConfirmBtn - 是否顯示確定按鈕 (預設 true)
     */
    showConfirmModal(title, message, onConfirm, showCancel = true, showConfirmBtn = true, confirmText = "確定", cancelText = "取消") {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const msgEl = document.getElementById('confirm-message');
        const yesBtn = document.getElementById('confirm-yes-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');

        titleEl.textContent = title;
        msgEl.innerHTML = message;

        // 控制取消按鈕顯示
        if (cancelBtn) {
            cancelBtn.style.display = showCancel ? 'inline-block' : 'none';
            cancelBtn.innerText = cancelText; // [Fix] 重置或設置文字
        }

        // 控制確定按鈕顯示
        if (yesBtn) {
            yesBtn.style.display = showConfirmBtn ? 'inline-block' : 'none';
            yesBtn.innerText = confirmText; // [Fix] 重置或設置文字
            yesBtn.style.background = ""; // [Fix] 清除之前可能殘留的自定義背景 (例如鍛造的紅色漸層)
            yesBtn.disabled = false;    // [Fix] 確保按鈕可用
        }

        // 清除舊的事件監聽器
        const newYesBtn = yesBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);

        newYesBtn.onclick = () => {
            if (onConfirm) onConfirm();
            this.hideConfirmModal();
        };

        // 如果是取消按鈕，也需要更新點擊事件以確保它關閉模態框
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.onclick = () => {
            this.hideConfirmModal();
        };

        modal.classList.remove('hidden');
    },

    /**
     * [New] 顯示狀態詳細模態框
     */
    showBuffModal() {
        const modal = document.getElementById('buff-detail-modal');
        const container = document.getElementById('buff-list-container');
        if (!modal || !container) return;

        container.innerHTML = ""; // Clear existing
        const player = window.Player;

        // Helper to create item
        const createItem = (name, icon, turns, desc, type) => {
            const div = document.createElement('div');
            div.style.background = '#333';
            div.style.padding = '10px';
            div.style.borderRadius = '5px';
            div.style.borderLeft = `3px solid ${type === 'angel' ? '#4caf50' : type === 'demon' ? '#9c27b0' : '#ff5722'}`;

            let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <strong style="color:white; font-size:1.1em;">${icon || ''} ${name}</strong>
                ${turns ? `<span style="font-size:0.8em; color:#aaa; background:#222; padding:2px 6px; border-radius:10px;">剩餘 ${turns} 回合</span>` : '<span style="font-size:0.8em; color:#aaa;">常駐</span>'}
            </div>
            <div style="color:#ccc; font-size:0.9em; line-height:1.4;">${desc || '無描述'}</div>`;

            div.innerHTML = html;
            return div;
        };

        // 1. 常駐 Buff
        if (player.buff) {
            container.appendChild(createItem(player.buff.name, '', null, player.buff.desc, player.buff.type));
        }

        // 2. 額外 Buff
        if (player.extraBuffs && player.extraBuffs.length > 0) {
            player.extraBuffs.forEach(b => {
                let type = 'demon';
                if (b.type) {
                    // 如果有明確指定 type (如 ep_buff)
                    type = (b.type === 'ep_buff') ? 'demon' : b.type;
                } else if (b.id) {
                    // 舊邏輯：根據 ID 判斷
                    type = b.id.includes('angel') ? 'angel' : (b.id.includes('harpy') ? 'harpy' : 'demon');
                }
                container.appendChild(createItem(b.name, b.icon, b.turns, b.desc, type));
            });
        }

        // 3. 哈比威脅
        if (window.GameState.harpyThreat) {
            container.appendChild(createItem("來自空中的威脅", "🦅", null, "受到哈比的精準盯防！<br>逃跑率降低 40%，且逃跑失敗時會被偷竊物品！", "harpy"));
        }

        modal.classList.remove('hidden');
    },

    /**
     * 隱藏確認模態框
     */
    hideConfirmModal() {
        document.getElementById('confirm-modal').classList.add('hidden');
    },

    /**
     * 顯示通用模態框
     * @param {string} title - 標題
     * @param {string} contentHtml - 內容HTML
     */
    showModal(title, contentHtml) {
        const modal = document.getElementById('generic-modal');
        const titleEl = document.getElementById('generic-modal-title');
        const contentEl = document.getElementById('generic-modal-content');

        if (modal && titleEl && contentEl) {
            titleEl.textContent = title;
            contentEl.innerHTML = contentHtml;
            modal.style.display = 'flex';
        } else {
            console.error("Generic modal elements not found!");
        }
    },

    /**
     * 隱藏通用模態框
     */
    hideModal() {
        const modal = document.getElementById('generic-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    /**
     * 顯示遊戲內通知 (Toast)
     * @param {string} message - 訊息內容
     * @param {string} type - 類型 (info, success, warning, error)
     */
    showToast(message, type = 'info') {
        // 改為添加到 body 以確保顯示在最上層
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerText = message;
        toast.style.zIndex = '20002'; // 確保高於 Hub (2000), FullScreenModal (9999) 和 ConfirmModal (20000)

        document.body.appendChild(toast);

        // 動畫進場
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // 自動移除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300); // 等待淡出動畫結束
        }, 2000);
    },


    /**
     * 渲染商店UI
     */
    renderMerchantShop(resetScroll = true) {
        const area = document.getElementById('merchant-area');
        area.innerHTML = "";
        area.classList.remove('hidden');

        // Reset scroll position
        const display = document.getElementById('event-display');
        if (resetScroll && display) display.scrollTop = 0;

        let buyHtml = "<h4>購買商品</h4><div class='merchant-grid'>";
        window.GameState.merchantStock.forEach((item, idx) => {
            if (!item) return;
            const desc = window.ItemSystem.getItemDesc(item);
            const rarityColor = CONFIG.rarityDisplay[item.rarity].color;
            buyHtml += `<div class="merchant-item ${rarityColor}" onclick="window.Game.buyItem(${idx})" style="cursor:pointer; position:relative; z-index:10;">
                <div class="m-top">
                    <span>${item.icon || '📦'} ${item.name}</span>
                    <span class="gold-text">${item.price} G</span>
                </div>
                <div class="m-desc">${desc}</div>
            </div>`;
        });
        buyHtml += "</div>";

        // 如果玩家擁有「商販之友」符文，顯示刷新按鈕
        const hasRefreshRune = window.Player.unlockedRunes && window.Player.unlockedRunes.includes('merchant_refresh');
        const canRefresh = hasRefreshRune && !window.GameState.merchantRefreshed;

        if (hasRefreshRune) {
            const refreshBtnStyle = canRefresh
                ? 'background:#4caf50; cursor:pointer;'
                : 'background:#666; cursor:not-allowed; opacity:0.5;';
            const refreshText = window.GameState.merchantRefreshed ? '🔄 已刷新' : '🔄 刷新商店';

            buyHtml += `<div style="margin-top:10px; text-align:center;">
                <button onclick="${canRefresh ? 'window.Game.refreshMerchantStock()' : ''}" 
                        style="padding:8px 16px; font-size:0.9em; ${refreshBtnStyle}" 
                        ${!canRefresh ? 'disabled' : ''}>
                    ${refreshText}
                </button>
                <p style='font-size:0.75em; color:#888; margin-top:5px'>符文效果：每次訪問商店可刷新一次</p>
            </div>`;
        }

        buyHtml += `<div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
            <h4>出售</h4>
            <button onclick="window.ItemSystem.sellAllMaterials()" style="padding:5px 10px; font-size:0.8em; background:#d32f2f;">一鍵出售素材</button>
        </div>
        <p style='font-size:0.8em; color:#888'>點擊下方背包物品即可出售。</p>`;

        area.innerHTML = buyHtml;
    },

    /**
     * 渲染工匠UI
     */
    renderBlacksmithUI() {
        const area = document.getElementById('merchant-area');
        area.classList.remove('hidden');

        // Reset scroll position
        const display = document.getElementById('event-display');
        if (display) display.scrollTop = 0;

        let html = '<h4>🔨 選擇要強化的裝備</h4>';

        if (!window.Player.inventory.equipment || window.Player.inventory.equipment.length === 0) {
            html += '<p style="color:#888; text-align:center; margin-top:20px;">背包中沒有可強化的裝備</p>';
        } else {
            html += '<div class="merchant-grid">';
            window.Player.inventory.equipment.forEach((item, idx) => {
                const desc = window.ItemSystem.getItemDesc(item);
                const rarityColor = CONFIG.rarityDisplay[item.rarity].color;
                const enhance = item.enhance || 0;
                const cost = Math.floor(item.price / 2);

                html += `<div class="merchant-item ${rarityColor}" style="position:relative;">
                    <div class="m-top">
                        <span>${item.icon || '⚔️'} ${item.name}</span>
                        <span style="font-size:0.8em; color:#aaa;">Lv.${enhance}</span>
                    </div>
                    <div class="m-desc">${desc}</div>
                    <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
                        <span class="gold-text" style="font-size:0.9em;">費用: ${cost} G</span>
                        <button onclick="window.Game.showBlacksmithConfirm(${idx})" class="btn" style="padding:5px 10px; font-size:0.9em; background:#ff5722;">強化</button>
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        // 修正：確保煉金術士的 UI 也能正確渲染
        if (window.GameState.phase === 'hub_alchemist') {
            window.Game.renderAlchemist();
        }

        area.innerHTML = html;
    },

    /**
     * 渲染工匠素材選擇介面
     */
    renderBlacksmithMaterialSelect(targetIdx, materials) {
        const targetItem = window.Player.inventory.equipment[targetIdx];

        let html = `
            <div style="text-align:center;">
                <p style="margin-bottom:15px;">請選擇要消耗的素材：<br><span style="font-size:0.8em; color:#aaa;">(只需同部位、同稀有度即可)</span></p>
                <div style="background:#222; padding:10px; border-radius:5px; margin-bottom:15px; border:1px solid #444;">
                    目標：<span class="${CONFIG.rarityDisplay[targetItem.rarity].color}">${targetItem.name}</span>
                </div>
                <div class="merchant-grid" style="max-height:300px; overflow-y:auto;">
        `;

        materials.forEach(mat => {
            const item = mat.item;
            const rarityColor = CONFIG.rarityDisplay[item.rarity].color;
            const desc = window.ItemSystem.getItemDesc(item);

            html += `<div class="merchant-item ${rarityColor}" onclick="window.Game.confirmEnhance(${targetIdx}, ${mat.index})" style="cursor:pointer;">
                <div class="m-top">
                    <span>${item.icon || '📦'} ${item.name}</span>
                </div>
                <div class="m-desc">${desc}</div>
            </div>`;
        });

        html += `
                </div>
                <button onclick="window.Game.cancelBlacksmithSelect()" class="btn" style="background:#666; margin-top:15px;">取消</button>
            </div>
        `;

        this.showModal("選擇素材", html);
    },

    /**
     * 渲染博物館介面
     */
    renderMuseum() {
        // 保存滾動位置
        const listEl = document.getElementById('museum-list');
        let scrollTop = 0;
        if (listEl) {
            scrollTop = listEl.scrollTop;
        }

        const setsHtml = this._generateMuseumSetsHtml();
        const totalBonus = {
            atk: window.Game.getMuseumBonus('atk_bonus'),
            def: window.Game.getMuseumBonus('def_bonus'),
            hp: window.Game.getMuseumBonus('hp_bonus'),
            crit: window.Game.getMuseumBonus('crit_bonus'),
            atkMult: window.Game.getMuseumBonus('atk_mult'),
            defMult: window.Game.getMuseumBonus('def_mult'),
            hpMult: window.Game.getMuseumBonus('hp_mult')
        };

        const html = `
            <div style="text-align:center; padding:20px; height:100%; display:flex; flex-direction:column;">
                <!-- 標題已移至模態框 Header -->
                
                <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:10px; margin-bottom:20px;">
                    <h4 style="color:#ffd700; margin-bottom:10px;">當前博物館加成</h4>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.9em;">
                        <div style="color:#ff5252;">攻擊力: +${totalBonus.atk} (${totalBonus.atkMult > 0 ? '+' + (totalBonus.atkMult * 100) + '%' : '0%'})</div>
                        <div style="color:#2196f3;">防禦力: +${totalBonus.def} (${totalBonus.defMult > 0 ? '+' + (totalBonus.defMult * 100) + '%' : '0%'})</div>
                        <div style="color:#69f0ae;">生命值: +${totalBonus.hp} (${totalBonus.hpMult > 0 ? '+' + (totalBonus.hpMult * 100) + '%' : '0%'})</div>
                        <div style="color:#ffeb3b;">爆擊率: +${totalBonus.crit}%</div>
                    </div>
                </div>

                <div id="museum-list" style="flex:1; overflow-y:auto; padding-right:5px; display:flex; flex-direction:column; gap:15px;">
                    ${setsHtml}
                </div>

                <div style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
                    <!-- 底部按鈕移除 -->
                </div>
            </div>
        `;

        const modal = document.getElementById('library-modal');
        const content = document.getElementById('library-content');
        if (modal && content) {
            content.innerHTML = html;
            modal.style.display = 'flex';
        }

        // 還原滾動位置
        const newListEl = document.getElementById('museum-list');
        if (newListEl) {
            newListEl.scrollTop = scrollTop;
        }
    },

    _generateMuseumSetsHtml() {
        let html = '';
        CONFIG.museumSets.forEach(set => {
            const isCompleted = window.Game.isSetCompleted(set.id);
            const progress = set.items.filter(i => (window.Player.donatedItems[i.item] || 0) >= i.count).length;
            const total = set.items.length;

            let itemsHtml = '<div style="display:flex; justify-content:center; gap:10px; margin: 10px 0;">';
            set.items.forEach(itemConfig => {
                const itemName = itemConfig.item;
                const required = itemConfig.count;
                const currentDonated = window.Player.donatedItems[itemName] || 0;
                const isCompleted = currentDonated >= required;

                // 查找物品資訊以獲取圖標和稀有度
                let icon = '📦';
                let rarityColor = 'rarity-common';

                // 嘗試從 lootData 查找
                if (CONFIG.lootData[itemName]) {
                    icon = CONFIG.lootData[itemName].icon;
                    rarityColor = CONFIG.rarityDisplay[CONFIG.lootData[itemName].rarity].color;
                } else {
                    // 嘗試從 itemPool 查找
                    const poolItem = CONFIG.itemPool.find(i => i.name === itemName);
                    if (poolItem) {
                        icon = poolItem.icon;
                        rarityColor = CONFIG.rarityDisplay[poolItem.rarity].color;
                    }
                }

                // 檢查背包或倉庫中是否有此物品 (用於捐贈提示)
                const hasInInv = window.Player.inventory.material.some(i => i.name === itemName);
                const hasInWarehouse = window.Player.warehouse[itemName] && window.Player.warehouse[itemName] > 0;
                // 只要未完成且有物品，就可以捐贈 (支援部分捐贈)
                const canDonate = !isCompleted && (hasInInv || hasInWarehouse);

                let style = `width:40px; height:40px; display:flex; align-items:center; justify-content:center; border-radius:5px; border:1px solid #444; background:#222; position:relative;`;
                if (isCompleted) {
                    style += `border-color:#ffd700; background:rgba(255, 215, 0, 0.2);`;
                } else if (canDonate) {
                    style += `border-color:#4caf50; cursor:pointer; animation: pulse 2s infinite;`;
                } else if (currentDonated > 0) {
                    style += `border-color:#2196f3;`; // 部分捐贈顯示藍色框
                }

                let clickAction = '';
                if (canDonate) {
                    clickAction = `onclick="window.Game.donateItem('${itemName}')"`;
                }

                itemsHtml += `
                    <div class="${rarityColor}" style="${style}" ${clickAction} title="${itemName} (${currentDonated}/${required}) ${isCompleted ? '(已完成)' : canDonate ? '(點擊捐贈)' : '(未擁有)'}">
                        ${icon}
                        ${isCompleted
                        ? '<span style="position:absolute; bottom:-5px; right:-5px; font-size:0.8em;">✅</span>'
                        : `<span style="position:absolute; bottom:-8px; right:-8px; font-size:0.7em; background:rgba(0,0,0,0.8); color:#fff; padding:1px 4px; border-radius:4px;">${currentDonated}/${required}</span>`
                    }
                    </div>
                `;
            });
            itemsHtml += '</div>';

            html += `
                <div style="background: linear-gradient(135deg, #333 0%, #222 100%); border: 1px solid ${isCompleted ? '#ffd700' : '#555'}; border-radius: 10px; padding: 15px; text-align: left;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size: 1.1em; color: ${isCompleted ? '#ffd700' : '#fff'}; font-weight:bold;">${set.name}</span>
                        <span style="font-size: 0.9em; color: #aaa;">${progress}/${total}</span>
                    </div>
                    
                    ${itemsHtml}
                    
                    <div style="font-size: 0.9em; color: ${isCompleted ? '#69f0ae' : '#888'}; margin-top: 5px;">
                        獎勵: ${set.reward.desc} ${isCompleted ? '(已啟用)' : ''}
                    </div>
                </div>
            `;
        });
        return html;
    },

    /**
     * 渲染倉庫介面
     */
    /**
     * 渲染倉庫介面
     */
    renderWarehouse() {
        // 保存滾動位置
        const warehouseScreen = document.getElementById('warehouse-screen');
        const warehouseList = document.getElementById('warehouse-list');
        const inventoryList = document.getElementById('inventory-list');

        const scrollPos = {
            screen: warehouseScreen ? warehouseScreen.scrollTop : 0,
            warehouse: warehouseList ? warehouseList.scrollTop : 0,
            inventory: inventoryList ? inventoryList.scrollTop : 0
        };

        // --- 準備倉庫物品列表 (分類) ---
        const categories = {
            accessory: { label: '💍 飾品', html: '', count: 0 },
            consumable: { label: '🧪 消耗品', html: '', count: 0 },
            equipment: { label: '⚔️ 裝備', html: '', count: 0 },
            material: { label: '🪵 素材', html: '', count: 0 },
            other: { label: '📦 其他', html: '', count: 0 }
        };

        const warehouseItems = Object.entries(Player.warehouse);

        if (warehouseItems.length > 0) {
            warehouseItems.forEach(([name, count]) => {
                let itemData = CONFIG.lootData[name] || CONFIG.itemPool.find(i => i.name === name);

                // 查找煉金/工作檯配方
                if (!itemData) {
                    const recipe = Object.values(CONFIG.recipes).find(r => r.name === name);
                    if (recipe) itemData = { ...recipe, icon: recipe.icon, rarity: 'special', type: recipe.resultType || 'consumable' };
                }
                if (!itemData && CONFIG.craftingRecipes) {
                    const craftRecipe = Object.values(CONFIG.craftingRecipes).find(r => r.name === name);
                    if (craftRecipe) itemData = { ...craftRecipe, icon: craftRecipe.icon, rarity: craftRecipe.rarity, type: craftRecipe.type || 'accessory' };
                }

                // 默認值
                if (!itemData) itemData = { icon: '📦', rarity: 'common', type: 'material' };

                // 判斷分類
                let catKey = 'other';
                if (itemData.type === 'accessory') catKey = 'accessory';
                else if (itemData.type === 'consumable' || itemData.resultType === 'consumable') catKey = 'consumable';
                else if (['weapon', 'armor', 'shield'].includes(itemData.type)) catKey = 'equipment';
                else if (CONFIG.lootData[name]) catKey = 'material'; // 大部分掉落物是素材

                const rarityColor = CONFIG.rarityDisplay[itemData.rarity] ? CONFIG.rarityDisplay[itemData.rarity].color : 'white';

                categories[catKey].html += `
                    <div class="warehouse-item" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:8px; margin-bottom:5px; border-radius:4px; border: 1px solid #333;">
                        <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
                            <span style="font-size:1.2em; flex-shrink:0;">${itemData.icon}</span>
                            <div style="overflow:hidden;">
                                <div class="${rarityColor}" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size: 0.9em;">${name}</div>
                                <div style="font-size:0.75em; color:#aaa; white-space:nowrap;">x ${count}</div>
                            </div>
                        </div>
                        <button onclick="window.Game.withdrawFromWarehouse('${name}', 1)" class="btn" style="background:#4caf50; padding:4px 8px; font-size:0.8em; flex-shrink:0; margin-left:5px;">取出</button>
                    </div>
                `;
                categories[catKey].count++;
            });
        }

        let warehouseHtml = '';
        let hasItems = false;
        Object.values(categories).forEach(cat => {
            if (cat.count > 0) {
                hasItems = true;
                warehouseHtml += `
                    <div style="background: #222; border: 1px solid #444; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
                        <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-bottom: 1px solid #444; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight: bold; font-size: 0.9em; color: #ddd;">${cat.label}</span>
                            <span style="font-size:0.8em; color:#aaa;">🔹</span> <!-- 裝飾圖標 -->
                        </div>
                        <div style="padding: 10px; flex: 1; display: flex; flex-direction: column; max-height: 300px; overflow-y: auto;">
                            ${cat.html}
                        </div>
                    </div>
                `;
            }
        });

        if (!hasItems) {
            warehouseHtml = '<div style="color:#888; padding:20px; grid-column: 1 / -1;">倉庫是空的</div>';
        }

        // --- 準備背包物品列表 (分類) ---
        // 為了保持一致性，背包也簡單分類 (裝備 vs 物品)
        const invCategories = {
            equipment: { label: '⚔️ 裝備', html: '', count: 0 },
            item: { label: '🎒 物品', html: '', count: 0 }
        };

        const inventoryItems = [
            ...Player.inventory.equipment.map((item, index) => ({ ...item, originalIndex: index, category: 'equipment' })),
            ...(Player.inventory.accessory || []).map((item, index) => ({ ...item, originalIndex: index, category: 'accessory' })), // [Fix] 顯示飾品
            ...Player.inventory.material.map((item, index) => ({ ...item, originalIndex: index, category: 'material' })),
            ...Player.inventory.consumable.map((item, index) => ({ ...item, originalIndex: index, category: 'consumable' }))
        ];

        if (inventoryItems.length > 0) {
            inventoryItems.forEach((item) => {
                if (item.name === '治療藥水' && item.price === 25) return;

                const rarityColor = CONFIG.rarityDisplay[item.rarity] ? CONFIG.rarityDisplay[item.rarity].color : 'white';

                const catKey = item.category === 'equipment' ? 'equipment' : (item.category === 'accessory' ? 'equipment' : 'item'); // Accessories also go to Equipment tab for visual simplicity? Or 'item'? 
                // Wait, invCategories only has 'equipment' and 'item'. 
                // Original: const catKey = item.category === 'equipment' ? 'equipment' : 'item';
                // If I map accessory to 'equipment', it will show in the "Equipment" section. That seems appropriate.

                invCategories[catKey].html += `
                    <div class="warehouse-item" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:8px; margin-bottom:5px; border-radius:4px; border: 1px solid #333;">
                        <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
                            <span style="font-size:1.2em; flex-shrink:0;">${item.icon}</span>
                            <div class="${rarityColor}" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size: 0.9em;">${item.name}</div>
                        </div>
                        <button onclick="window.Game.depositToWarehouse(${item.originalIndex}, '${item.category}')" class="btn" style="background:#ff9800; padding:4px 8px; font-size:0.8em; flex-shrink:0; margin-left:5px;">存入</button>
                    </div>
                `;
                invCategories[catKey].count++;
            });
        }

        let inventoryHtml = '';
        let hasInvItems = false;
        Object.values(invCategories).forEach(cat => {
            if (cat.count > 0) {
                hasInvItems = true;
                inventoryHtml += `
                    <div style="background: #222; border: 1px solid #444; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
                        <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-bottom: 1px solid #444; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight: bold; font-size: 0.9em; color: #ddd;">${cat.label}</span>
                             <span style="font-size:0.8em; color:#aaa;">🔹</span>
                        </div>
                        <div style="padding: 10px; flex: 1; display: flex; flex-direction: column; max-height: 300px; overflow-y: auto;">
                            ${cat.html}
                        </div>
                    </div>
                `;
            }
        });

        if (!hasInvItems) {
            inventoryHtml = '<div style="color:#888; padding:20px; grid-column: 1 / -1;">背包是空的</div>';
        }

        const html = `
            <div id="warehouse-screen" style="text-align:center; padding:20px; height:100%; display:flex; flex-direction:column; overflow-y:auto;">
                <!-- 標題已移至模態框 Header -->
                
                <div style="display:flex; gap:20px; flex:1; flex-wrap:wrap; align-content:flex-start;">
                    <!-- 倉庫區域 -->
                    <div style="flex:1 1 300px; display:flex; flex-direction:column; background:rgba(0,0,0,0.3); border-radius:10px; padding:10px; min-height:300px;">
                        <h4 style="color:#4caf50; margin-bottom:10px;">倉庫庫存</h4>
                        <div id="warehouse-list" style="flex:1; overflow-y:auto; padding-right:5px; display: grid; grid-template-columns: 1fr; gap: 10px; align-content: start;">
                            ${warehouseHtml}
                        </div>
                    </div>

                    <!-- 背包區域 -->
                    <div style="flex:1 1 300px; display:flex; flex-direction:column; background:rgba(0,0,0,0.3); border-radius:10px; padding:10px; min-height:300px;">
                        <h4 style="color:#2196f3; margin-bottom:10px;">背包素材 (攜帶中)</h4>
                        <div id="inventory-list" style="flex:1; overflow-y:auto; padding-right:5px; display: grid; grid-template-columns: 1fr; gap: 10px; align-content: start;">
                            ${inventoryHtml}
                        </div>
                    </div>
                </div>


            </div>
        `;

        const modal = document.getElementById('warehouse-modal');
        const content = document.getElementById('warehouse-content');
        if (modal && content) {
            content.innerHTML = html;
            modal.style.display = 'flex';
        }

        // 恢復滾動位置
        const newWarehouseScreen = document.getElementById('warehouse-screen');
        const newWarehouseList = document.getElementById('warehouse-list');
        const newInventoryList = document.getElementById('inventory-list');

        if (newWarehouseScreen) newWarehouseScreen.scrollTop = scrollPos.screen;
        if (newWarehouseList) newWarehouseList.scrollTop = scrollPos.warehouse;
        if (newInventoryList) newInventoryList.scrollTop = scrollPos.inventory;
    },

    /**
     * 顯示成就
     */
    showAchievements() {
        const modal = document.getElementById('achieve-modal');
        const list = document.getElementById('achieve-list-content');
        const stats = document.getElementById('achieve-stats');

        if (!modal || !list || !stats) return;

        list.innerHTML = "";
        modal.style.display = 'flex';

        const player = window.Player;
        // 計算總數時只計算可見的成就 (非隱藏 或 已解鎖的隱藏成就)
        let visibleCount = 0;
        let unlockedCount = 0;

        Object.values(CONFIG.achievements).forEach(ach => {
            const unlocked = player.achievements instanceof Set
                ? player.achievements.has(ach.id)
                : (Array.isArray(player.achievements) && player.achievements.includes(ach.id));

            // 隱藏成就邏輯：如果設定為隱藏且未解鎖，則不顯示
            if (ach.hidden && !unlocked) return;

            visibleCount++;
            if (unlocked) unlockedCount++;

            const div = document.createElement('div');
            div.className = `achieve-item ${unlocked ? 'unlocked' : ''}`;

            // 使用預設圖標
            const icon = ach.icon || '🏆';
            const rarityConf = CONFIG.rarityDisplay[ach.rarity] || { label: '一般', color: 'rarity-common' };

            div.innerHTML = `
                <div class="achieve-icon">${icon}</div>
                <div class="achieve-info">
                    <div class="achieve-title">${ach.name}</div>
                    <div class="achieve-desc">${ach.cond}</div>
                </div>
                <div class="achieve-meta">
                    <span class="achieve-tag ${rarityConf.color}">${rarityConf.label}</span>
                </div>
            `;
            list.appendChild(div);
        });

        // 顯示進度
        stats.innerText = `解鎖進度: ${unlockedCount} / ${visibleCount}`;
    },

    /**
     * 顯示圖鑑
     */
    showCompendium() {
        const modal = document.getElementById('compendium-modal');
        const list = document.getElementById('compendium-content');
        const stats = document.getElementById('compendium-stats');
        list.innerHTML = "";
        modal.style.display = 'flex';

        const player = window.Player;
        const allItems = window.ItemSystem.getAllItems();
        const unlockedCount = allItems.filter(i => player.history.items.has(i.name)).length;

        stats.innerText = `收集進度: ${unlockedCount} / ${allItems.length}`;

        allItems.forEach(item => {
            const unlocked = player.history.items.has(item.name);
            const div = document.createElement('div');

            if (!unlocked && item.name === "真實之心") {
                div.className = 'c-item secret-hidden';
                div.title = "?????";
            } else if (unlocked) {
                div.className = `c-item unlocked ${CONFIG.rarityDisplay[item.rarity].color}`;
                div.title = window.ItemSystem.getItemDesc(item) + `\n(價值: ${item.price}G)`;
                div.innerHTML = `
                    <div class="c-icon">${item.icon || '📦'}</div>
                    <div class="c-name">${item.name}</div>
                `;
            } else {
                div.className = 'c-item unknown';
                div.title = "尚未獲得";
                div.innerHTML = `
                    <div class="c-icon">❓</div>
                    <div class="c-name">???</div>
                `;
            }
            list.appendChild(div);
        });
    },
    /**
     * 顯示詞綴圖鑑（條列式）
     */
    showAffixCompendium() {
        const modal = document.getElementById('affix-modal');
        const list = document.getElementById('affix-content');
        const stats = document.getElementById('affix-stats');

        if (!modal || !list || !stats) {
            alert('詞綴圖鑑UI未就緒');
            return;
        }

        list.innerHTML = "";
        modal.style.display = 'flex';
        // 收集所有詞綴
        const prefixes = [];
        const suffixes = [];

        Object.entries(CONFIG.affixes.prefixes).forEach(([key, affix]) => {
            prefixes.push({ ...affix, key });
        });
        Object.entries(CONFIG.affixes.suffixes).forEach(([key, affix]) => {
            suffixes.push({ ...affix, key });
        });
        const total = prefixes.length + suffixes.length;
        stats.innerText = `總計: ${total} 個詞綴 (前綴: ${prefixes.length}, 後綴: ${suffixes.length})`;
        // 顯示前綴
        const prefixTitle = document.createElement('h3');
        prefixTitle.style.cssText = 'color:#4fc3f7; margin:15px 0 10px 0; font-size:1.1em; border-bottom:2px solid #4fc3f7; padding-bottom:5px;';
        prefixTitle.textContent = '🔰 前綴詞綴';
        list.appendChild(prefixTitle);
        prefixes.forEach(affix => {
            const div = document.createElement('div');
            div.style.cssText = 'background:#2a2a2a; padding:12px; border-radius:8px; border-left:4px solid #4fc3f7;';
            div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <span style="font-size:1.5em;">🔰</span>
                <span style="color:white; font-weight:bold; font-size:1.05em;">${affix.name}</span>
            </div>
            <div style="color:#aaa; font-size:0.9em; padding-left:35px;">
                ${affix.desc || '無描述'}
            </div>
        `;
            list.appendChild(div);
        });
        // 顯示後綴
        const suffixTitle = document.createElement('h3');
        suffixTitle.style.cssText = 'color:#f48fb1; margin:25px 0 10px 0; font-size:1.1em; border-bottom:2px solid #f48fb1; padding-bottom:5px;';
        suffixTitle.textContent = '✨ 後綴詞綴';
        list.appendChild(suffixTitle);
        suffixes.forEach(affix => {
            const div = document.createElement('div');
            div.style.cssText = 'background:#2a2a2a; padding:12px; border-radius:8px; border-left:4px solid #f48fb1;';
            div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <span style="font-size:1.5em;">✨</span>
                <span style="color:white; font-weight:bold; font-size:1.05em;">${affix.name}</span>
            </div>
            <div style="color:#aaa; font-size:0.9em; padding-left:35px;">
                ${affix.desc || '無描述'}
            </div>
        `;
            list.appendChild(div);
        });
    },
    /**
     * 顯示Buff圖鑑（條列式）
     */
    showBuffCompendium() {
        const modal = document.getElementById('buff-modal');
        const list = document.getElementById('buff-content');
        const stats = document.getElementById('buff-stats');

        if (!modal || !list || !stats) {
            alert('Buff圖鑑UI未就緒');
            return;
        }

        list.innerHTML = "";
        modal.style.display = 'flex';
        const allBuffs = Object.values(CONFIG.buffs);
        const angelBuffs = allBuffs.filter(b => b.type === 'angel');
        const demonBuffs = allBuffs.filter(b => b.type === 'demon');
        stats.innerText = `總計: ${allBuffs.length} 個效果 (天使祝福: ${angelBuffs.length}, 惡魔詛咒: ${demonBuffs.length})`;
        // 顯示天使祝福
        const angelTitle = document.createElement('h3');
        angelTitle.style.cssText = 'color:#69f0ae; margin:15px 0 10px 0; font-size:1.1em; border-bottom:2px solid #69f0ae; padding-bottom:5px;';
        angelTitle.textContent = '😇 天使祝福';
        list.appendChild(angelTitle);
        angelBuffs.forEach(buff => {
            const div = document.createElement('div');
            div.style.cssText = 'background:#2a2a2a; padding:12px; border-radius:8px; border-left:4px solid #69f0ae;';
            div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <span style="font-size:1.5em;">😇</span>
                <span style="color:white; font-weight:bold; font-size:1.05em;">${buff.name}</span>
            </div>
            <div style="color:#aaa; font-size:0.9em; padding-left:35px;">
                ${buff.desc || '無描述'}
            </div>
        `;
            list.appendChild(div);
        });
        // 顯示惡魔詛咒
        const demonTitle = document.createElement('h3');
        demonTitle.style.cssText = 'color:#ff6b6b; margin:25px 0 10px 0; font-size:1.1em; border-bottom:2px solid #ff6b6b; padding-bottom:5px;';
        demonTitle.textContent = '😈 惡魔詛咒';
        list.appendChild(demonTitle);
        demonBuffs.forEach(buff => {
            const div = document.createElement('div');
            div.style.cssText = 'background:#2a2a2a; padding:12px; border-radius:8px; border-left:4px solid #ff6b6b;';
            div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <span style="font-size:1.5em;">😈</span>
                <span style="color:white; font-weight:bold; font-size:1.05em;">${buff.name}</span>
            </div>
            <div style="color:#aaa; font-size:0.9em; padding-left:35px;">
                ${buff.desc || '無描述'}
            </div>
        `;
            list.appendChild(div);
        });
    },


    /**
     * [New] 顯示惡魔信徒 Buff 選擇介面
     */
    showDemonBuffSelection(skillLv, isEnhanced, pickCount, turns, callback) {
        const modal = document.getElementById('generic-modal');
        const titleEl = document.getElementById('generic-modal-title');
        const contentEl = document.getElementById('generic-modal-content');

        if (!modal) return;

        titleEl.textContent = "😈 來自深淵的餽贈";

        // 1. 篩選可用 Buff (包含 demon 和 demon_enhanced)
        const allBuffs = Object.values(CONFIG.buffs);
        let candidates = allBuffs.filter(b => b.type === 'demon' || b.type === 'demon_enhanced');

        // 如果不是強化版，排除 "_plus" 結尾的 Buff
        if (!isEnhanced) {
            candidates = candidates.filter(b => !b.id.includes('_plus'));
        } else {
            // 強化版：只顯示強化版 Buff (_plus)
            candidates = candidates.filter(b => b.id.includes('_plus'));
        }

        // 2. 顯示所有選項 (不做隨機限制，讓玩家有更多選擇)
        const options = candidates.sort((a, b) => a.id.localeCompare(b.id));

        // 儲存狀態
        this._demonSelectState = {
            options: options,
            selected: [],
            pickCount: pickCount,
            turns: turns,
            callback: callback
        };

        this._renderDemonSelection();
        modal.style.display = 'flex';
    },

    /**
     * [New] 渲染選擇內容 (內部用)
     */
    _renderDemonSelection() {
        const state = this._demonSelectState;
        if (!state) return;

        const contentEl = document.getElementById('generic-modal-content');

        let html = `<p style="color:#ba68c8; font-size:0.9em; margin-bottom:10px; text-align:center;">
            請選擇 <span style="color:#fff; font-weight:bold;">${state.pickCount}</span> 個賜福 
            <span style="color:#aaa;">(持續 ${state.turns} 回合)</span>
        </p>`;

        html += `<div style="display:flex; flex-direction:column; gap:8px;">`;

        state.options.forEach(buff => {
            const isSelected = state.selected.includes(buff);
            const bg = isSelected ? 'linear-gradient(45deg, #4a148c, #7b1fa2)' : '#2a2a2a';
            const border = isSelected ? '2px solid #ce93d8' : '1px solid #444';

            // 解析 icon（從 name 提取 emoji）
            let icon = buff.icon || '';
            if (!icon && buff.name) {
                const match = buff.name.match(/[\u{1F300}-\u{1F9FF}]/u);
                icon = match ? match[0] : '😈';
            }

            html += `
            <div onclick="window.UISystem.handleDemonObjClick('${buff.id}')"
                style="background:${bg}; border:${border}; padding:10px; border-radius:6px; cursor:pointer; display:flex; align-items:center; gap:10px; transition: all 0.2s;">
                <span style="font-size:1.8em;">${icon}</span>
                <div style="flex:1;">
                    <div style="font-weight:bold; color:${isSelected ? '#fff' : '#ddd'}; font-size:1.1em;">${buff.name || 'Unknown'}</div>
                    <div style="font-size:0.85em; color:#aaa;">${buff.desc || ''}</div>
                </div>
                ${isSelected ? '<span style="color:#69f0ae;">✔</span>' : ''}
            </div>`;
        });
        html += `</div>`;

        const canConfirm = state.selected.length === state.pickCount;

        html += `
        <div style="margin-top:20px; text-align:center;">
            <button onclick="window.UISystem.confirmDemonSelection()" 
                id="btn-confirm-demon"
                ${canConfirm ? '' : 'disabled'}
                style="padding:10px 40px; background:${canConfirm ? '#e91e63' : '#555'}; color:white; border:none; border-radius:30px; font-weight:bold; font-size:1.1em; cursor:${canConfirm ? 'pointer' : 'default'}; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                確認選擇
            </button>
        </div>`;

        contentEl.innerHTML = html;
    },

    /**
     * [New] 處理選項點擊
     */
    handleDemonObjClick(buffId) {
        const state = this._demonSelectState;
        if (!state) return;

        const buff = state.options.find(b => b.id === buffId);
        if (!buff) return;

        if (state.selected.includes(buff)) {
            state.selected = state.selected.filter(b => b !== buff);
        } else {
            if (state.selected.length < state.pickCount) {
                state.selected.push(buff);
            } else if (state.pickCount === 1) {
                state.selected = [buff]; // 單選直接切換
            }
        }
        this._renderDemonSelection();
    },

    /**
     * [New] 確認選擇
     */
    confirmDemonSelection() {
        const state = this._demonSelectState;
        if (!state) return;

        // 構造返回的 Buff
        const result = state.selected.map(b => ({
            ...b,
            turns: state.turns,
            isExtra: true,
            newThisTurn: true
        }));

        document.getElementById('generic-modal').style.display = 'none';
        if (state.callback) state.callback(result);

        this._demonSelectState = null; // Clear state
    },

    /**
     * 顯示煉金術介面
     */
    showAlchemy() {
        const modal = document.getElementById('alchemy-modal');
        const content = document.getElementById('alchemy-content');

        if (!modal || !content) return;

        this.renderAlchemyUI();
        modal.style.display = 'flex';
    },

    /**
     * 顯示職業確認視窗
     */
    showClassConfirm(classId) {
        const cls = CONFIG.classes[classId];
        if (!cls) return;

        // 獲取當前技能等級與描述
        const currentLv = (window.Player && window.Player.skillLevels && window.Player.skillLevels[classId]) ? window.Player.skillLevels[classId] : 1;
        let skillDesc = cls.skill.desc;

        // 嘗試從升級配置中獲取對應等級的描述
        if (window.CONFIG.hub && window.CONFIG.hub.training && window.CONFIG.hub.training.skillUpgrade) {
            const upgradeConfig = window.CONFIG.hub.training.skillUpgrade;
            if (upgradeConfig.descriptions && upgradeConfig.descriptions[classId] && upgradeConfig.descriptions[classId][currentLv]) {
                skillDesc = upgradeConfig.descriptions[classId][currentLv];
            }
        }

        document.getElementById('class-confirm-title').innerText = cls.name;
        // [Fix] 顯示包含訓練場加成的數值
        const bonusHp = window.Player.baseHpBonus || 0;
        const bonusAtk = window.Player.baseAtkBonus || 0;
        document.getElementById('class-confirm-hp').innerText = cls.stats.hp + bonusHp; // 顯示總和
        document.getElementById('class-confirm-sp').innerText = cls.stats.sp;
        document.getElementById('class-confirm-atk').innerText = cls.stats.atk + bonusAtk; // 顯示總和
        document.getElementById('class-confirm-def').innerText = cls.stats.def;
        // [New] 顯示基礎爆擊與閃避
        document.getElementById('class-confirm-crit').innerText = (cls.stats.crit || 5) + '%';
        document.getElementById('class-confirm-evasion').innerText = (cls.stats.evasion || 0) + '%';
        document.getElementById('class-confirm-passive').innerText = cls.passive;
        document.getElementById('class-confirm-skill-name').innerText = `${cls.skill.name} (Lv.${currentLv})`;
        document.getElementById('class-confirm-skill-desc').innerHTML = skillDesc.replace(/\n/g, '<br>');

        // 設定確認按鈕
        const okBtn = document.getElementById('class-confirm-ok-btn');
        okBtn.onclick = () => {
            document.getElementById('class-confirm-modal').style.display = 'none';
            document.getElementById('class-confirm-modal').classList.add('hidden'); // Also add hidden back
            Game.selectClass(classId);
        };

        // 顯示模態框
        const confirmModal = document.getElementById('class-confirm-modal');
        confirmModal.style.display = 'flex';
        confirmModal.classList.remove('hidden'); // CRITICAL FIX
    },

    /**
     * 渲染煉金術介面
     */
    renderAlchemyUI() {
        const content = document.getElementById('alchemy-content');
        if (!content) return;

        content.innerHTML = '';
        const recipes = CONFIG.recipes;

        Object.values(recipes).forEach(recipe => {
            const recipeEl = document.createElement('div');
            recipeEl.className = 'recipe-item';
            recipeEl.style.cssText = 'background:#333; padding:15px; border-radius:8px; display:flex; flex-direction:column; gap:10px; border:1px solid #555;';

            // 標題與描述
            let html = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:bold; font-size:1.1em; color:#ffd700;">${recipe.name}</div>
                    <div style="font-size:0.8em; color:#aaa;">${recipe.resultType === 'buff' ? 'Buff' : '物品'}</div>
                </div>
                <div style="color:#ccc; font-size:0.9em;">${recipe.desc}</div>
                <div style="height:1px; background:#444; margin:5px 0;"></div>
                <div style="font-size:0.9em; color:#ddd;">所需素材:</div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
            `;

            // 素材檢核
            let canCraft = true;
            recipe.materials.forEach(mat => {
                const owned = window.ItemSystem.getItemCount(mat.item, true); // 改為檢查倉庫
                const hasEnough = owned >= mat.count;
                if (!hasEnough) canCraft = false;

                html += `
                    <div style="background:#222; padding:5px 10px; border-radius:4px; border:1px solid ${hasEnough ? '#4caf50' : '#f44336'}; color:${hasEnough ? '#fff' : '#f44336'};">
                        ${mat.item}: ${owned} / ${mat.count}
                    </div>
                `;
            });

            html += `</div>`;

            // 合成按鈕
            html += `
                <button onclick="ItemSystem.craftItem('${recipe.id}')" 
                    ${canCraft ? '' : 'disabled'}
                    style="margin-top:10px; padding:10px; background:${canCraft ? 'linear-gradient(45deg, #673ab7, #9c27b0)' : '#444'}; color:${canCraft ? 'white' : '#888'}; border:none; border-radius:5px; cursor:${canCraft ? 'pointer' : 'not-allowed'}; font-weight:bold;">
                    ${canCraft ? '⚗️ 合成' : '素材不足'}
                </button>
            `;

            recipeEl.innerHTML = html;
            content.appendChild(recipeEl);
        });
    },

    /**
     * 更新煉金術介面 (合成後呼叫)
     */
    updateAlchemyUI() {
        if (document.getElementById('alchemy-modal').style.display !== 'none') {
            this.renderAlchemyUI();
        }
    },

    /**
     * [New] 渲染隨身合成介面 (冒險中使用)
     */
    renderPortableCrafting() {
        const area = document.getElementById('merchant-area');
        area.innerHTML = "";
        area.classList.remove('hidden');

        // Reset scroll position
        const display = document.getElementById('event-display');
        if (display) display.scrollTop = 0; // 讓玩家看到標題

        let html = `
            <div style="background: linear-gradient(135deg, #2c3e50 0%, #000000 100%); padding: 15px; border-radius: 8px; border: 1px solid #444;">
                <h4 style="text-align:center; margin-bottom:15px; color:#ba68c8;">⚗️ 隨身鍊金術</h4>
        `;

        if (!CONFIG.recipes) {
            html += `<p style="text-align:center;">暫無配方</p></div>`;
            area.innerHTML = html;
            return;
        }

        html += `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:10px;">`;

        Object.values(CONFIG.recipes).forEach(recipe => {
            // 素材檢查 (檢查背包，不檢查倉庫)
            let canCraft = true;
            let matHtml = "";

            recipe.materials.forEach(mat => {
                const count = window.ItemSystem.getItemCount(mat.item, false); // false = 檢查背包
                const hasEnough = count >= mat.count;
                if (!hasEnough) canCraft = false;

                matHtml += `
                    <div style="display:flex; justify-content:space-between; font-size:0.8em; color:${hasEnough ? '#69f0ae' : '#ff5252'};">
                        <span>${mat.item}</span>
                        <span>${count}/${mat.count}</span>
                    </div>
                `;
            });

            // 呼叫 ItemSystem.craftItem(id, useBackpack)
            html += `
                <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:6px; border:1px solid #555;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                        <span style="font-size:1.2em;">${recipe.icon || '⚗️'}</span>
                        <span style="font-weight:bold; color:#fff;">${recipe.name}</span>
                    </div>
                    <div style="margin-bottom:8px; background:rgba(0,0,0,0.3); padding:5px; border-radius:4px;">
                        ${matHtml}
                    </div>
                    <button onclick="window.ItemSystem.craftItem('${recipe.id}', true)" 
                        ${canCraft ? '' : 'disabled'}
                        style="width:100%; padding:5px; background:${canCraft ? '#ba68c8' : '#444'}; color:white; border:none; border-radius:4px; cursor:${canCraft ? 'pointer' : 'default'};">
                        合成
                    </button>
                </div>
            `;
        });

        html += `</div>`;

        // 關閉按鈕
        html += `
            <button onclick="document.getElementById('merchant-area').classList.add('hidden')" 
                style="display:block; width:100%; margin-top:15px; padding:10px; background:transparent; border:1px solid #666; color:#aaa; border-radius:20px; cursor:pointer;">
                關閉介面
            </button>
        </div>`;

        area.innerHTML = html;
    },

    /**
     * 渲染煉獄鍛造 UI
     */
    renderForgeUI() {
        const area = document.getElementById('merchant-area');
        if (!area) return;
        area.innerHTML = "";
        area.classList.remove('hidden');

        if (window.GameState.forgeUsed) {
            window.Game.renderEvent("🔥 熄滅的爐火", "爐火已經化為一攤普通的岩漿。", "無法再進行鍛造。", "🌫️");
            return;
        }

        let html = "<h4 style='text-align:center; margin-bottom:10px;'>🔥 煉獄鍛造 (限一次)</h4><div class='craft-grid' style='display:grid; grid-template-columns: 1fr 1fr; gap:10px;'>";

        window.CONFIG.forgeItems.forEach(item => {
            const recipe = item.recipe;
            const ownedItems = window.Player.inventory.material.filter(m => m.name === recipe.mat);
            const owned = ownedItems.length;
            const canCraft = owned >= recipe.count;
            const statusColor = canCraft ? '#69f0ae' : '#ff5252';
            const borderStyle = canCraft ? `1px solid ${statusColor}` : '1px solid #444';

            html += `<div class="craft-item" onclick="window.UISystem.showForgePreview('${item.id}')" 
                style="border:${borderStyle}; background:#222; padding:10px; border-radius:8px; cursor:pointer; display:flex; flex-direction:column; gap:5px; align-items:center; transition: all 0.2s;">
                <div style="font-weight:bold; color:#ffd700;">
                    <span>${item.icon} ${item.name}</span>
                </div>
                <div style="color:${statusColor}; font-size:0.9em;">
                    需: ${recipe.mat} (${owned}/${recipe.count})
                </div>
            </div>`;
        });
        html += "</div>";
        area.innerHTML = html;

        const display = document.getElementById('event-display');
        if (display) display.scrollTop = 0;
    },

    /**
     * [New] 顯示鍛造預覽
     */
    showForgePreview(itemId) {
        const item = window.CONFIG.forgeItems.find(i => i.id === itemId);
        if (!item) return;

        const recipe = item.recipe;
        const ownedItems = window.Player.inventory.material.filter(m => m.name === recipe.mat);
        const owned = ownedItems.length;
        const hasEnough = owned >= recipe.count;

        let statText = "";
        if (item.val) {
            if (item.type === 'weapon') statText = `攻擊力: <span style="color:#ff5252">${item.val}</span>`;
            else if (item.type === 'armor') statText = `生命值: <span style="color:#69f0ae">${item.val}</span>`;
            else if (item.type === 'shield') statText = `防禦力: <span style="color:#2196f3">${item.val}</span>`;
        } else if (item.def) {
            statText = `防禦力: <span style="color:#2196f3">${item.def}</span>`;
        }

        const rarityColor = CONFIG.rarityDisplay[item.rarity].color;

        let html = `
            <div style="display:flex; flex-direction:column; gap:15px; align-items:center;">
                <div class="${rarityColor}" style="font-size:3em;">${item.icon}</div>
                <div style="font-size:1.5em; font-weight:bold; color:#ffd700;">${item.name}</div>
                
                <div style="background:#222; padding:10px; border-radius:8px; width:100%; box-sizing:border-box;">
                    <div style="margin-bottom:5px; font-size:1.1em;">📊 基本數值</div>
                    <div style="margin-left:10px;">${statText || "無基礎數值"}</div>
                </div>

                <div style="background:#222; padding:10px; border-radius:8px; width:100%; box-sizing:border-box;">
                    <div style="margin-bottom:5px; font-size:1.1em;">✨ 特殊效果</div>
                    <div style="margin-left:10px; color:#aaa; font-size:0.9em;">${item.desc}</div>
                </div>

                <div style="background:#222; padding:10px; border-radius:8px; width:100%; box-sizing:border-box;">
                    <div style="margin-bottom:5px; font-size:1.1em;">🔨 所需素材</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-left:10px;">
                        <span>${recipe.mat}</span>
                        <span style="color:${hasEnough ? '#69f0ae' : '#ff5252'}">${owned} / ${recipe.count}</span>
                    </div>
                </div>
            </div>
        `;

        const confirmText = hasEnough ? "🔥 開始鍛造" : "素材不足";

        this.showConfirmModal(
            "鍛造預覽",
            html,
            () => {
                if (hasEnough) {
                    window.EventSystem.craftForgeItem(itemId);
                } else {
                    window.UISystem.showToast("素材不足！", "error");
                }
            },
            true,
            true,
            confirmText,
            "取消"
        );

        // [New] 特殊樣式處理：如果素材足夠，給確認按鈕加上煉獄風格
        const yesBtn = document.getElementById('confirm-yes-btn');
        if (yesBtn) {
            if (hasEnough) {
                yesBtn.style.background = "linear-gradient(45deg, #ff5722, #f44336)";
            } else {
                yesBtn.style.background = "#555";
                yesBtn.disabled = true; // 禁用按鈕
            }
        }
    },

    /**
     * 顯示獲得稀有物品特效
     * @param {string} rarity - 物品稀有度 (legendary, mythic, ultra)
     */
    showLegendaryEffect(rarity = 'legendary') {
        const effect = document.getElementById('legendary-effect');

        // 清除舊的稀有度樣式
        effect.classList.remove('effect-legendary', 'effect-mythic', 'effect-ultra', 'hidden');

        // 添加對應的稀有度樣式
        if (rarity === 'mythic') {
            effect.classList.add('effect-mythic');
            effect.innerHTML = '<span class="effect-text mythic">神 話</span>';
        } else if (rarity === 'ultra') {
            effect.classList.add('effect-ultra');
            effect.innerHTML = '<span class="effect-text ultra">終 極</span>';
        } else {
            effect.classList.add('effect-legendary');
            effect.innerHTML = '<span class="effect-text legendary">傳 說</span>';
        }

        // 2秒後自動隱藏
        setTimeout(() => {
            effect.classList.add('hidden');
        }, 2500); // 稍微延長一點時間讓玩家看清楚 (2.5s)
    },

    /**
     * [New] 顯示通用模態窗
     * @param {string} title - 標題 (可為 null)
     * @param {string} content - HTML 內容
     * @param {boolean} autoClose - 是否點擊背景關閉
     */
    showModal(title, content, autoClose = true) {
        console.log("[UI] showModal called");
        // 移除現有的模態窗
        this.closeModal();

        const div = document.createElement('div');
        div.className = 'modal-overlay';
        div.style.display = 'flex'; // [Fix] Force display flex to ensure visibility
        div.style.justifyContent = 'center';
        div.style.alignItems = 'center';
        div.style.zIndex = '100000'; // Ensure it's on top

        if (autoClose) {
            div.onclick = (e) => {
                if (e.target === div) this.closeModal();
            };
        }

        // 如果內容已經包含 modal-content 結構，直接使用
        if (content.includes('class="modal-content"') || content.includes("class='modal-content'")) {
            div.innerHTML = content;
        } else {
            // 否則包裝一層
            div.innerHTML = `
                <div class="modal-content">
                    ${title ? `<h3>${title}</h3>` : ''}
                    <div>${content}</div>
                    <div class="modal-actions">
                        <button class="action-btn secondary" onclick="window.UISystem.closeModal()">關閉</button>
                    </div>
                </div>
            `;
        }

        document.body.appendChild(div);

        // 強制 reflow 並添加 active class 以觸發動畫 (如果有的話)
        // setTimeout(() => div.classList.add('active'), 10);
        div.classList.add('active');
    },

    /**
     * [New] 關閉通用模態窗
     */
    closeModal() {
        const overlays = document.querySelectorAll('.modal-overlay');
        overlays.forEach(el => el.remove());
    }
};

// 綁定到全域
if (typeof window !== 'undefined') {
    window.UISystem = UISystem;
}

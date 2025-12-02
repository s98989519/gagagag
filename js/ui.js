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
        if (icon) document.getElementById('event-icon').innerText = icon;

        // Reset scroll position
        const display = document.getElementById('event-display');
        if (display) display.scrollTop = 0;

        if (window.GameState.phase !== 'merchant' && window.GameState.phase !== 'blacksmith') {
            document.getElementById('merchant-area').classList.add('hidden');
        }
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

        // 顯示技能按鈕
        if (bSkill) {
            bSkill.classList.remove('hidden');
            // 根據武器類型更新按鈕文字 (可選)
            let skillName = "技能";
            const weapon = window.Player.equipment.weapon;
            if (weapon) {
                if (weapon.name.includes('盾')) skillName = "🛡️ 盾擊";
                else if (weapon.name.includes('槍') || weapon.name.includes('矛')) skillName = "🔱 貫穿";
                else skillName = "⚔️ 強擊";
            }
            bSkill.innerText = skillName;
            bSkill.onclick = () => window.CombatSystem.playerSkill();
        }

        // 顯示終結技按鈕
        if (bUlt) {
            bUlt.classList.remove('hidden');
            bUlt.onclick = () => window.CombatSystem.playerUltimate();

            // SP 滿時發光效果
            if (window.Player.sp >= 3) {
                bUlt.classList.add('glow-gold');
                bUlt.disabled = false;
            } else {
                bUlt.classList.remove('glow-gold');
                bUlt.disabled = true; // SP 不足禁用
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
        document.getElementById('gold-val').innerText = player.gold;

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
        if (player.buff) {
            const style = player.buff.type === 'angel' ? 'angel-text' : 'demon-text';
            buffEl.innerHTML = `狀態: <span class="${style}">${player.buff.name}</span> <span style="font-size:0.8em; cursor:pointer;">(點擊查看)</span>`;
            buffEl.onclick = () => alert(`${player.buff.name}\n\n${player.buff.desc}`);
        } else {
            buffEl.innerHTML = `狀態: 無`;
            buffEl.onclick = null;
        }
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
            else if (item.type === 'shield') statText = `(防禦+${item.def})`;

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
        else if (item.type === 'shield') statText = ` (防禦+${item.def})`;

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

        // 排序並渲染裝備背包
        const sortedEquip = this.sortInventory(player.inventory.equipment, sortPref.equipment);
        this.renderInvList('inv-equip', sortedEquip, 'equipment');

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
     */
    showConfirmModal(title, message, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const msgEl = document.getElementById('confirm-message');
        const yesBtn = document.getElementById('confirm-yes-btn');

        titleEl.textContent = title;
        msgEl.innerHTML = message;

        // 清除舊的事件監聽器
        const newYesBtn = yesBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);

        newYesBtn.onclick = () => {
            onConfirm();
            this.hideConfirmModal();
        };

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
        const container = document.getElementById('game-container');
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerText = message;

        container.appendChild(toast);

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
        html += '<div class="merchant-grid">';
        let hasItems = false;

        window.Player.inventory.equipment.forEach((item, idx) => {
            if (!['weapon', 'armor', 'shield'].includes(item.type)) return;
            const enhance = item.enhance || 0;
            if (enhance >= 8) return;
            const baseName = window.Game.getBaseItemName(item.name);
            const hasDuplicate = window.Player.inventory.equipment.filter((i, index) => {
                const iBaseName = window.Game.getBaseItemName(i.name);
                return iBaseName === baseName && index !== idx;
            }).length > 0;
            if (!hasDuplicate) return;
            const cost = Math.floor(item.price / 2);
            const rateData = window.getBlacksmithRate(enhance);
            hasItems = true;
            html += `<div class="merchant-item ${CONFIG.rarityDisplay[item.rarity].color}" onclick="window.Game.showBlacksmithConfirm(${idx})"><div class="m-top"><span>${item.icon} ${item.name}</span></div><div class="m-desc">${window.ItemSystem.getItemDesc(item)}<br>消耗: <span style="color:#ffd700">${cost} G</span> + 1個同名裝備<br>成功率: <span style="color:${rateData.color}">${rateData.rate}%</span></div></div>`;
        });

        html += '</div>';
        if (!hasItems) {
            html = '<p style="color:#888;text-align:center;margin:20px 0;">沒有可強化的裝備<br><span style="font-size:0.9em">需要兩個同名裝備才能強化</span></p>';
        }
        if (window.GameState.blacksmithAttempts >= 2) {
            html += '<p style="color:#ff9800;margin-top:10px;text-align:center;">本次已強化2次，無法繼續</p>';
        }
        area.innerHTML = html;

        // 修正：確保煉金術士的 UI 也能正確渲染
        if (window.GameState.phase === 'hub_alchemist') {
            window.Game.renderAlchemist();
        }
    },

    /**
     * 渲染工匠素材選擇介面
     */
    renderBlacksmithMaterialSelect(targetIdx, materials) {
        const targetItem = window.Player.inventory.equipment[targetIdx];

        let html = `
            <div style="margin-bottom:10px; padding:10px; background:rgba(255,255,255,0.05); border-radius:5px;">
                <div style="font-size:0.9em; color:#aaa;">目標裝備:</div>
                <div class="${CONFIG.rarityDisplay[targetItem.rarity].color}">${targetItem.icon} ${targetItem.name}</div>
            </div>
            <div class="merchant-grid" style="max-height: 400px; overflow-y: auto;">
        `;

        materials.forEach(m => {
            const item = m.item;
            html += `
                <div class="merchant-item ${CONFIG.rarityDisplay[item.rarity].color}" onclick="window.Game.confirmEnhance(${targetIdx}, ${m.index})">
            <div class="m-top">
                <span>${item.icon} ${item.name}</span>
            </div>
            <div class="m-desc">
                ${window.ItemSystem.getItemDesc(item)}<br>
                    <span style="color:#ff5252; font-weight:bold;">⚠️ 將被消耗</span>
            </div>
        </div>
        `;
        });

        html += '</div>';

        // 使用通用模態框顯示
        this.showModal("🔨 選擇要消耗的素材", html);
    },

    /**
     * 更新怪物意圖顯示
     */
    updateIntentDisplay(enemy) {
        const eventDisplay = document.getElementById('event-display');
        let intentContainer = document.getElementById('intent-display');

        if (!intentContainer) {
            intentContainer = document.createElement('div');
            intentContainer.id = 'intent-display';
            intentContainer.style.cssText = "margin-top: 10px; font-size: 1.2em; color: #ffeb3b; text-align: center;";
            // 插入到 event-icon 之後
            const icon = document.getElementById('event-icon');
            if (icon && icon.nextSibling) {
                eventDisplay.insertBefore(intentContainer, icon.nextSibling);
            } else {
                eventDisplay.appendChild(intentContainer);
            }
        }

        if (!enemy || !enemy.nextAction) {
            intentContainer.innerHTML = "";
            return;
        }

        const action = enemy.nextAction;
        let icon = "";
        let text = "";
        let color = "";

        if (action.type === 'attack') {
            icon = "🗡️";
            text = "準備攻擊";
            color = "#ff5252";
        } else if (action.type === 'heavy') {
            icon = "🔥";
            text = "準備重擊";
            color = "#d50000";
        } else if (action.type === 'defend') {
            icon = "🛡️";
            text = "準備防禦";
            color = "#2196f3";
        }

        intentContainer.innerHTML = `<span style="color:${color}">${icon} ${text}</span>`;
    },

    /**
     * 顯示成就列表
     */
    showAchievements() {
        const modal = document.getElementById('achieve-modal');
        const list = document.getElementById('achieve-list-content');
        const stats = document.getElementById('achieve-stats');
        list.innerHTML = "";
        modal.style.display = 'flex';

        const player = window.Player;
        let visibleTotal = CONFIG.achievements.filter(a => !a.hidden || player.achievements.has(a.id)).length;
        let unlockedCount = player.achievements.size;

        stats.innerText = `進度: ${unlockedCount} / ${visibleTotal}`;

        CONFIG.achievements.forEach(ach => {
            if (ach.hidden && !player.achievements.has(ach.id)) return;

            const unlocked = player.achievements.has(ach.id);
            const div = document.createElement('div');
            div.className = `achieve-item ${unlocked ? 'unlocked' : ''}`;

            let colorClass = CONFIG.rarityDisplay[ach.rarity].color;
            let rarityName = CONFIG.rarityDisplay[ach.rarity].label;

            div.innerHTML = `
                <div class="achieve-info">
                    <div class="achieve-name" style="${unlocked ? 'color:white' : ''}">${ach.name}</div>
                    <div class="achieve-cond">${ach.cond}</div>
                </div>
                <div class="achieve-badge ${colorClass}">${rarityName}</div>
            `;
            list.appendChild(div);
        });
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
                const owned = window.ItemSystem.getItemCount(mat.item);
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
     * 顯示傳說物品特效
     */
    showLegendaryEffect() {
        const effect = document.getElementById('legendary-effect');
        effect.classList.remove('hidden');

        // 2秒後自動隱藏
        setTimeout(() => {
            effect.classList.add('hidden');
        }, 2000);
    }
};

// 綁定到全域
if (typeof window !== 'undefined') {
    window.UISystem = UISystem;
}

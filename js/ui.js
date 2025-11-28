/**
 * 幻想冒險 - UI渲染系統模組
 * 處理所有UI更新和渲染邏輯
 * @版本 v2.0
 * @更新 2025-11-27
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
     * 顯示浮動文字
     */
    showFloatingText(text, color) {
        const display = document.getElementById('event-display');
        const div = document.createElement('div');
        div.className = 'floating-text';
        div.innerHTML = text;
        div.style.color = color;
        display.appendChild(div);
        setTimeout(() => div.remove(), 1000);
    },

    /**
     * 渲染事件
     */
    renderEvent(title, subtitle, content, icon) {
        document.getElementById('event-title').innerText = title;
        document.getElementById('event-desc').innerHTML = `<p>${subtitle}</p><p>${content}</p>`;
        if (icon) document.getElementById('event-icon').innerText = icon;
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
    },

    /**
     * 更新狀態UI
     */
    updateStatsUI() {
        const player = window.Player;
        document.getElementById('hp-val').innerText = player.hp;
        document.getElementById('max-hp-val').innerText = player.maxHp;
        document.getElementById('atk-val').innerText = window.Game.getAtk();
        document.getElementById('gold-val').innerText = player.gold;
        document.getElementById('depth-val').innerText = player.depth;

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

        const wEl = document.getElementById('slot-weapon');
        wEl.innerHTML = w ? `<span class="${CONFIG.rarityDisplay[w.rarity].color}">${w.icon} ${w.name} (+${w.val})</span>` : "無武器";
        wEl.className = `equip-slot ${w ? CONFIG.rarityDisplay[w.rarity].color : ''}`;

        const aEl = document.getElementById('slot-armor');
        aEl.innerHTML = a ? `<span class="${CONFIG.rarityDisplay[a.rarity].color}">${a.icon} ${a.name} (+${a.val})</span>` : "無防具";
        aEl.className = `equip-slot ${a ? CONFIG.rarityDisplay[a.rarity].color : ''}`;

        const sEl = document.getElementById('slot-shield');
        sEl.innerHTML = s ? `<span class="${CONFIG.rarityDisplay[s.rarity].color}">${s.icon} ${s.name} (${s.val})</span>` : "無盾牌";
        sEl.className = `equip-slot ${s ? CONFIG.rarityDisplay[s.rarity].color : ''}`;
    },

    /**
     * 渲染背包列表
     */
    renderInvList(id, items, category) {
        const list = document.getElementById(id);
        list.innerHTML = "";
        items.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = `item ${CONFIG.rarityDisplay[item.rarity].color}`;
            if (item.rarity === 'epic') div.classList.add('rare-epic');
            if (item.rarity === 'legendary') div.classList.add('rare-legendary');
            if (item.rarity === 'mythic') div.classList.add('rarity-mythic');
            div.innerHTML = `${item.icon || '📦'} ${item.name}`;
            div.onclick = () => window.ItemSystem.handleItemClick(idx, category);
            list.appendChild(div);
        });
    },

    /**
     * 更新所有背包UI
     */
    updateInventoryUI() {
        const player = window.Player;
        this.renderInvList('inv-equip', player.inventory.equipment, 'equipment');
        this.renderInvList('inv-consum', player.inventory.consumable, 'consumable');
        this.renderInvList('inv-mat', player.inventory.material, 'material');
    },

    /**
     * 完整更新UI（主函數）
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
     * 渲染商店UI
     */
    renderMerchantShop() {
        const area = document.getElementById('merchant-area');
        area.innerHTML = "";
        area.classList.remove('hidden');

        let buyHtml = "<h4>購買商品</h4><div class='merchant-grid'>";
        window.GameState.merchantStock.forEach((item, idx) => {
            if (!item) return;
            const desc = window.ItemSystem.getItemDesc(item);
            const rarityColor = CONFIG.rarityDisplay[item.rarity].color;
            buyHtml += `<div class="merchant-item ${rarityColor}" onclick="Game.buyItem(${idx})">
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
            <button onclick="ItemSystem.sellAllMaterials()" style="padding:5px 10px; font-size:0.8em; background:#d32f2f;">一鍵出售素材</button>
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
        let html = '<h4>🔨 選擇要強化的裝備</h4>';
        html += '<div class="merchant-grid">';
        let hasItems = false;

        window.Player.inventory.equipment.forEach((item, idx) => {
            if (!['weapon', 'armor', 'shield'].includes(item.type)) return;
            const enhance = item.enhance || 0;
            if (enhance >= 8) return;
            const baseName = item.name.replace(/\s*\+\d+$/, '');
            const hasDuplicate = window.Player.inventory.equipment.filter((i, index) => {
                const iBaseName = i.name.replace(/\s*\+\d+$/, '');
                return iBaseName === baseName && index !== idx;
            }).length > 0;
            if (!hasDuplicate) return;
            const cost = Math.floor(item.price / 2);
            const rateData = window.getBlacksmithRate(enhance);
            hasItems = true;
            html += `<div class="merchant-item ${CONFIG.rarityDisplay[item.rarity].color}" onclick="Game.showBlacksmithConfirm(${idx})"><div class="m-top"><span>${item.icon} ${item.name}${enhance > 0 ? ` +${enhance}` : ''}</span></div><div class="m-desc">${window.ItemSystem.getItemDesc(item)}<br>消耗: <span style="color:#ffd700">${cost} G</span> + 1個同名裝備<br>成功率: <span style="color:${rateData.color}">${rateData.rate}%</span></div></div>`;
        });

        html += '</div>';
        if (!hasItems) {
            html = '<p style="color:#888;text-align:center;margin:20px 0;">沒有可強化的裝備<br><span style="font-size:0.9em">需要兩個同名裝備才能強化</span></p>';
        }
        if (window.GameState.blacksmithAttempts >= 2) {
            html += '<p style="color:#ff9800;margin-top:10px;text-align:center;">本次已強化2次，無法繼續</p>';
        }
        area.innerHTML = html;
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
    }
};

// 綁定到全域
if (typeof window !== 'undefined') {
    window.UISystem = UISystem;
}


/**
 * 渲染 EP 商店 (女神祭壇)
 */
renderEpShop() {
    GameState.phase = 'ep_shop';

    // 確保 nextRunBuffs 存在
    if (!Player.nextRunBuffs) Player.nextRunBuffs = [];

    let itemsHtml = '';
    CONFIG.epShop.forEach(item => {
        // 檢查是否已購買
        const isBought = Player.nextRunBuffs.includes(item.id);
        const canAfford = Player.explorationPoints >= item.cost;
        const btnColor = isBought ? '#4caf50' : (canAfford ? '#ffd700' : '#555');
        const btnText = isBought ? '已啟動' : '🙏 祈禱 (購買)';
        const btnAction = isBought ? '' : `onclick="window.Game.buyEpBuff('${item.id}')"`;
        const disabled = isBought || !canAfford ? 'disabled' : ''; // 已買也可以 disable，或僅顯示狀態
        // 這裡可以讓玩家買多個嗎？目前設計是 boolean 狀態 (isBought)，所以只能買一次。

        itemsHtml += `
                <div style="background:#333; padding:15px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; border-left: 5px solid #9c27b0;">
                    <div style="text-align:left;">
                        <div style="font-size:1.2em; color:#e1bee7; font-weight:bold; margin-bottom:5px;">${item.name}</div>
                        <div style="font-size:0.9em; color:#aaa;">${item.desc}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:0.9em; color:#ffd700; margin-bottom:5px;">${item.cost} EP</div>
                        <button ${btnAction} class="btn" style="background:${btnColor}; padding:5px 15px;" ${!canAfford && !isBought ? 'disabled' : ''}>
                            ${btnText}
                        </button>
                    </div>
                </div>
            `;
    });

    const html = `
            <div style="text-align:center; padding:20px;">
                <h2 style="color:#9c27b0; margin-bottom:10px; font-size: 2em;">🗽 女神祭壇</h2>
                <p style="font-size:1.1em; color:#ccc; margin-bottom:30px;">
                    消耗 EP 向女神祈禱，獲得僅限 <span style="color:#ffd700">下一局冒險</span> 有效的祝福。
                </p>
                <div style="display:flex; justify-content:center; gap:20px; flex-direction:column; max-width: 600px; margin: 0 auto;">
                    ${itemsHtml}
                </div>
                <div style="margin-top:30px;">
                    <p style="font-size:1.2em; margin-bottom:20px;">目前 EP: <span style="color:#69f0ae">${Player.explorationPoints}</span></p>
                    <button onclick="window.Game.enterHub()" class="btn" style="background:#555; padding:10px 30px;">
                        返回大廳
                    </button>
                </div>
            </div>
        `;

    document.getElementById('hub-content').innerHTML = html;
},

/**
 * 購買 EP Buff
 */
buyEpBuff(buffId) {
    const item = CONFIG.epShop.find(i => i.id === buffId);
    if (!item) return;

    if (Player.explorationPoints >= item.cost) {
        Player.explorationPoints -= item.cost;
        if (!Player.nextRunBuffs) Player.nextRunBuffs = [];
        Player.nextRunBuffs.push(buffId);

        this.savePersistentData();
        window.UISystem.showToast(`已獲得祝福：${item.name}`, "success");
        AudioSystem.playSFX('heal'); // 用 heal 音效代替
        this.renderEpShop(); // 重繪
    } else {
        window.UISystem.showToast("EP 不足！", "error");
    }
},

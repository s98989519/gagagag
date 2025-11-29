/**
 * 幻想冒險 - 戰鬥系統模組
 * 處理所有戰鬥相關邏輯
 * @版本 v2.1 (音效整合版)
 * @更新 2025-11-27
 */

const CombatSystem = {
    /**
     * 觸發戰鬥
     */
    triggerCombat(isForcedBoss, checkTrueForm) {
        window.GameState.phase = "combat";

        let baseMonster;
        let tier = "normal";
        let canFlee = true;

        if (isForcedBoss) {
            baseMonster = CONFIG.monsters[9];
            tier = "boss";
            canFlee = false;
        } else {
            baseMonster = this.getWeightedMonster();
            tier = this.determineMonsterTier();
        }

        const enemy = this.createEnemy(baseMonster, tier, checkTrueForm);
        window.GameState.currentEnemy = enemy;

        this.renderCombatStart(enemy);
        const fleeRate = this.getFleeRate();
        const fleeText = `逃跑 (${Math.round(fleeRate * 100)}%)`;
        window.Game.setButtons("戰鬥", "combatRound", fleeText, "flee", !canFlee);
    },

    getWeightedMonster() {
        let activeMonsters = [];

        if (window.Player.depth < 50) {
            let weakWeight = 99 / 4;
            let strongWeight = 1 / 6;
            CONFIG.monsters.forEach((m, idx) => {
                let tempM = { ...m };
                tempM.weight = (idx < 4) ? weakWeight : strongWeight;
                activeMonsters.push(tempM);
            });
        } else {
            activeMonsters = CONFIG.monsters;
        }

        let totalWeight = 0;
        for (let m of activeMonsters) totalWeight += m.weight;
        let randomVal = Math.random() * totalWeight;

        for (let m of activeMonsters) {
            if (randomVal < m.weight) return m;
            randomVal -= m.weight;
        }
        return activeMonsters[0];
    },

    determineMonsterTier() {
        const depth = window.Player.depth;
        const rand = Math.random();

        if (depth > 300) {
            if (rand < 0.1) return "normal";
            else if (rand < 0.55) return "elite";
            else return "boss";
        } else if (depth > 100) {
            if (rand < 0.1) return "boss";
            else if (rand < 0.6) return "elite";
            else return "normal";
        } else {
            if (rand < 0.01) return "boss";
            else if (rand < 0.11) return "elite";
            else return "normal";
        }
    },

    createEnemy(baseMonster, tier, checkTrueForm) {
        let hpMul = 1, atkMul = 1;
        let namePrefix = "";

        // 深層漸進式難度 (方案B)：
        // 1-299層: 無增幅
        // 300層起: 每100層 +10% HP 和 攻擊力
        // 例如: 300層(1.1x), 400層(1.2x), 1000層(1.8x)
        if (window.Player.depth >= 300) {
            const deepLayers = Math.floor(window.Player.depth / 100) - 2;
            if (deepLayers > 0) {
                hpMul *= (1 + deepLayers * 0.1);
                atkMul *= (1 + deepLayers * 0.1);
                namePrefix += "深淵 ";
            }
        }

        if (tier === "elite") {
            hpMul *= 2;
            atkMul *= 1.5;
            namePrefix += "菁英 ";
        } else if (tier === "boss") {
            hpMul *= 3;
            atkMul *= 2;
            namePrefix += "首領 ";
        }

        // 1000層後：怪物詞綴系統
        let prefix = null;
        let suffix = null;
        let extraDropRate = 0;

        if (window.Player.depth > 1000) {
            // 30% 機率出現前綴
            if (Math.random() < 0.3) {
                const prefixes = Object.entries(CONFIG.monsterAffixes.prefixes);
                // 傳說詞綴機率較低 (5%)
                const roll = Math.random();
                if (roll < 0.05) {
                    const legend = prefixes.find(([k, v]) => k === 'legendary');
                    if (legend) prefix = { key: legend[0], ...legend[1] };
                } else {
                    const normalPrefixes = prefixes.filter(([k, v]) => k !== 'legendary');
                    const picked = normalPrefixes[Math.floor(Math.random() * normalPrefixes.length)];
                    prefix = { key: picked[0], ...picked[1] };
                }
            }

            // 30% 機率出現後綴
            if (Math.random() < 0.3) {
                const suffixes = Object.entries(CONFIG.monsterAffixes.suffixes);
                const picked = suffixes[Math.floor(Math.random() * suffixes.length)];
                suffix = { key: picked[0], ...picked[1] };
            }
        }

        // 應用詞綴加成
        if (prefix) {
            namePrefix = `<span class="affix-prefix">${prefix.name}</span> ` + namePrefix;
            extraDropRate += 0.5; // 每個詞綴增加 50% 掉落率

            if (prefix.effect === 'atk' || prefix.effect === 'all') atkMul *= (1 + prefix.val);
            if (prefix.effect === 'hp' || prefix.effect === 'all') hpMul *= (1 + prefix.val);
            // crit 和 def (減傷) 在戰鬥邏輯中處理
        }

        if (suffix) {
            namePrefix = namePrefix + ` <span class="affix-suffix">${suffix.name}</span>`;
            extraDropRate += 0.5;
            // 後綴通常是特殊效果，在戰鬥邏輯中處理
        }

        let enemy = {
            ...baseMonster,
            name: namePrefix + baseMonster.name,
            maxHp: Math.floor(baseMonster.hp * hpMul),
            hp: Math.floor(baseMonster.hp * hpMul),
            atk: Math.floor(baseMonster.atk * atkMul),
            tier: tier,
            prefix: prefix,
            suffix: suffix,
            extraDropRate: extraDropRate
        };

        if (checkTrueForm) {
            const hasSword = window.Player.equipment.weapon?.name?.includes("聖劍 Excalibur");
            const hasArmor = window.Player.equipment.armor?.name?.includes("神之光輝");

            if (hasSword && hasArmor) {
                enemy.name = "魔王真身";
                enemy.maxHp = 4000;
                enemy.hp = 4000;
                enemy.atk = 200;
                enemy.isTrueForm = true;
                // 真身也可以有詞綴，保留上面的 prefix/suffix
                if (prefix) enemy.name = `<span class="affix-prefix">${prefix.name}</span> ` + enemy.name;
                if (suffix) enemy.name = enemy.name + ` <span class="affix-suffix">${suffix.name}</span>`;
            }
        }

        return enemy;
    },

    renderCombatStart(enemy) {
        let iconClass = "monster-icon";
        if (enemy.tier === "elite") iconClass += " monster-elite glow-blue";
        if (enemy.tier === "boss") iconClass += " monster-boss glow-red";
        if (enemy.isTrueForm) iconClass = "monster-icon monster-true-form glow-purple";

        document.getElementById('event-icon').className = iconClass;
        window.Game.triggerAnim('event-icon', 'anim-spawn');

        window.Game.renderEvent(
            `⚔️ 遭遇 ${enemy.name}`,
            `HP: ${enemy.hp} | 攻擊: ${enemy.atk}`,
            "準備戰鬥！",
            enemy.icon
        );

        // 顯示敵人血條
        this.showEnemyHealthBar(enemy);
    },

    combatRound() {
        if (window.GameState.phase !== "combat") return;

        const enemy = window.GameState.currentEnemy;
        let logHtml = "";

        const playerAttack = this.executePlayerAttack(enemy);
        logHtml += playerAttack.log;

        if (playerAttack.enemyDead) {
            this.combatWin();
            return;
        }

        if (playerAttack.isFrozen) {
            logHtml += "敵人被凍結，無法行動！<br>";
        } else {
            const monsterAttack = this.executeMonsterAttack(enemy);
            logHtml += monsterAttack.log;
        }

        window.Game.renderEvent(
            `⚔️ 戰鬥中 - ${enemy.name}`,
            `敵方 HP: ${Math.max(0, enemy.hp)}`,
            logHtml,
            enemy.icon
        );

        // 更新敵人血條
        this.updateEnemyHealthBar(enemy);

        if (window.Player.hp <= 0) {
            window.Game.playerDie(`被 ${enemy.name} 殺死`);
        } else {
            const fleeRate = this.getFleeRate();
            const fleeText = `逃跑 (${Math.round(fleeRate * 100)}%)`;
            window.Game.setButtons("戰鬥", "combatRound", fleeText, "flee", false);
            window.Game.updateUI();
        }
    },


    executePlayerAttack(enemy) {
        let pDmg = window.Game.getAtk();
        let pCritRate = 0.05;
        let log = "";

        const player = window.Player;

        // 檢查詞綴效果 (Rage: 之狂暴)
        if (player.equipment.weapon && player.equipment.weapon.suffix === 'rage') {
            const missingHpPercent = (player.maxHp - player.hp) / player.maxHp * 100;
            const bonusPercent = missingHpPercent * 0.005; // 每 1% 血量 + 0.5% 攻擊
            pDmg = Math.floor(pDmg * (1 + bonusPercent));
        }

        if (player.buff) {
            if (player.buff.id === 'angel_courage') pCritRate = 0.2;
            if (player.buff.id === 'demon_enhance') pCritRate = 0.5;

            if (player.buff.id === 'demon_wealth') {
                player.gold += 5;
                window.Game.showFloatingText("+5 G", "gold");
                log += `<span class='demon-text'>[惡魔財富]</span> 獲得 5 G<br>`;
            }

            if (player.buff.id === 'demon_destruction' && Math.random() < 0.1) {
                enemy.hp = 0;
                let pain = Math.floor(player.hp * 0.9);
                player.hp -= pain;
                window.Game.showFloatingText(`-${pain} HP`, "darkred");
                log += `<span class='demon-text'>[惡魔破壞]</span> 觸發秒殺！自身扣除 ${pain} HP。<br>`;
                return { log, enemyDead: true };
            }

            // 惡魔的狂怒：攻擊力 +50%
            if (player.buff.id === 'demon_rage') {
                pDmg = Math.floor(pDmg * 1.5);
            }
        }

        // 應用詞綴加成 (Game.modifiers)
        if (window.Game.modifiers && window.Game.modifiers.crit) {
            pCritRate += window.Game.modifiers.crit;
        }

        let pCrit = Math.random() < pCritRate;
        if (pCrit) pDmg *= 2;

        enemy.hp -= pDmg;
        window.Game.triggerAnim('event-icon', 'anim-damage');
        window.Game.showFloatingText(pDmg, pCrit ? "red" : "white");
        AudioSystem.playSFX('attack');  // 攻擊音效

        log += `你對 ${enemy.name} 造成 ${pCrit ? "<span class='crit-text'>爆擊 " : ""}${pDmg}${pCrit ? "</span>" : ""} 點傷害。<br>`;

        // 檢查詞綴效果 (Leeching: 之吸血)
        if (player.equipment.weapon && player.equipment.weapon.suffix === 'leeching') {
            const heal = Math.floor(pDmg * 0.1);
            if (heal > 0) {
                player.hp = Math.min(player.maxHp, player.hp + heal);
                window.Game.showFloatingText(`+${heal}`, "#69f0ae");
                log += `<span class='heal-text'>[吸血]</span> 恢復 ${heal} HP<br>`;
            }
        }

        // 檢查詞綴效果 (Frost: 之冰霜)
        let isFrozen = false;
        if (player.equipment.weapon && player.equipment.weapon.suffix === 'frost') {
            if (Math.random() < 0.1) {
                isFrozen = true;
                log += `<span class='ice-text'>❄️ [冰霜]</span> 敵人被凍結了！<br>`;
            }
        }

        // 惡魔的狂怒：扣除 5% 當前HP
        if (player.buff && player.buff.id === 'demon_rage') {
            let selfDmg = Math.max(1, Math.floor(player.hp * 0.05));
            player.hp -= selfDmg;
            window.Game.showFloatingText(`-${selfDmg} HP`, "darkred");
            log += `<span class='demon-text'>[惡魔狂怒]</span> 狂暴代價：扣除 ${selfDmg} HP<br>`;
        }

        return { log, enemyDead: enemy.hp <= 0, isFrozen };
    },

    executeMonsterAttack(enemy) {
        // 怪物攻擊力計算 (含 Rage 詞綴)
        let currentAtk = enemy.atk;
        if (enemy.suffix && enemy.suffix.key === 'rage') {
            const lostHpPercent = (1 - enemy.hp / enemy.maxHp) * 100;
            if (lostHpPercent > 0) {
                const bonus = Math.floor(enemy.atk * lostHpPercent * 0.005);
                currentAtk += bonus;
            }
        }

        let mDmg = currentAtk;
        let mCritRate = 0.1;
        let log = "";

        const player = window.Player;

        // 怪物暴擊計算 (含 Deadly/Legendary 詞綴)
        if (enemy.prefix && (enemy.prefix.key === 'deadly' || enemy.prefix.key === 'legendary')) {
            mCritRate += 0.05;
        }

        if (player.buff) {
            if (player.buff.id === 'demon_enhance') mCritRate = 0.5;
            if (player.buff.id === 'angel_protection') mDmg = Math.floor(mDmg * 0.7);
        }

        // 應用詞綴加成 (Game.modifiers.def) - 減傷
        if (window.Game.modifiers && window.Game.modifiers.def) {
            mDmg = Math.floor(mDmg * (1 - window.Game.modifiers.def));
        }

        let mCrit = Math.random() < mCritRate;
        if (mCrit) mDmg *= 2;

        AudioSystem.playSFX('damage');  // 受傷音效

        // 計算防禦減傷 (最低傷害機制：至少受到 10% 攻擊力或 1 點傷害)
        const def = window.Game.getDef();
        // 怪物防禦穿透? 目前沒有，但可以考慮 Guarding 詞綴對玩家傷害的減免 (反向思考，Guarding 是減傷，所以這裡不影響攻擊)

        const minDmg = Math.max(1, Math.floor(currentAtk * 0.1));
        mDmg = Math.max(minDmg, mDmg - def);

        // 檢查詞綴效果 (Thorns: 之荊棘)
        // 檢查防具和盾牌
        let thornsDamage = 0;
        if (player.equipment.armor && player.equipment.armor.suffix === 'thorns') {
            thornsDamage += Math.floor(mDmg * 0.2);
        }
        if (player.equipment.shield && player.equipment.shield.suffix === 'thorns') {
            thornsDamage += Math.floor(mDmg * 0.2);
        }

        if (thornsDamage > 0) {
            enemy.hp -= thornsDamage;
            window.Game.showFloatingText(`-${thornsDamage}`, "purple"); // 紫色顯示反傷
            log += `<span class='thorns-text'>[荊棘]</span> 反彈 ${thornsDamage} 點傷害！<br>`;
        }

        if (mDmg > 0) {
            player.hp -= mDmg;
            window.Game.triggerAnim('event-icon', 'anim-lunge');
            window.Game.triggerAnim('game-container', 'anim-screen-shake');
            window.Game.showFloatingText(`-${mDmg}`, "red");
            log += `${enemy.name} 攻擊！造成 ${mCrit ? "<span class='crit-text'>致命 " : ""}${mDmg}${mCrit ? "</span>" : ""} 點傷害。`;

            // 處理怪物特殊詞綴效果
            // 1. 吸血 (Leeching)
            if (enemy.suffix && enemy.suffix.key === 'leeching') {
                const heal = Math.floor(mDmg * 0.1);
                if (heal > 0) {
                    enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
                    window.Game.showFloatingText(`+${heal}`, "green"); // 怪物回血
                    log += `<br><span class='affix-suffix'>[吸血]</span> 怪物恢復了 ${heal} 點生命`;
                    this.updateEnemyHealthBar(enemy);
                }
            }

            // 2. 冰霜 (Frost)
            if (enemy.suffix && enemy.suffix.key === 'frost') {
                if (Math.random() < 0.1) {
                    // 冰凍效果：玩家下回合無法行動? 或者扣除體力? 
                    // 簡化實作：造成額外冰凍傷害並提示
                    const frostDmg = Math.floor(player.maxHp * 0.05);
                    player.hp -= frostDmg;
                    window.Game.showFloatingText(`凍結! -${frostDmg}`, "cyan");
                    log += `<br><span class='affix-suffix'>[冰霜]</span> 你被凍傷了！受到額外 ${frostDmg} 點傷害`;
                }
            }
        } else {
            // 理論上不會再有完全無傷的情況，除非 minDmg 為 0 (不可能)
            // 但為了保險起見保留這個分支，或者改為顯示極低傷害
            window.Game.showFloatingText("防禦!", "#2196f3");
            log += `<span class='block-text'>🛡️ 你的防禦大幅減輕了攻擊！</span><br>`;
        }

        return { log };
    },

    combatWin() {
        const enemy = window.GameState.currentEnemy;
        window.GameState.phase = "event_end";

        // 隱藏敵人血條
        this.hideEnemyHealthBar();

        if (window.Player.depth === 1000 && enemy.tier === 'boss') {
            window.Player.kill1000Boss = true;
        }

        const drops = this.calculateDrops(enemy);
        const dropText = this.processDrops(enemy, drops);

        const winTitle = enemy.isTrueForm ? "👑 弒神者" : "🏆 戰鬥勝利";
        const winMsg = enemy.isTrueForm ? "你擊敗了魔王真身，傳說將永遠流傳！" : "你擊敗了敵人！";

        // 檢查詞綴效果 (Regen: 之再生)
        let regenLog = "";
        let regenAmount = 0;
        ['armor', 'shield'].forEach(slot => {
            if (window.Player.equipment[slot] && window.Player.equipment[slot].suffix === 'regen') {
                regenAmount += 10;
            }
        });

        if (regenAmount > 0) {
            window.Player.hp = Math.min(window.Player.maxHp, window.Player.hp + regenAmount);
            regenLog = `<br><span class='heal-text'>[再生]</span> 戰鬥結束恢復 ${regenAmount} HP`;
            window.Game.showFloatingText(`+${regenAmount} HP`, "#69f0ae");
        }

        window.Game.renderEvent(winTitle, winMsg, (dropText || "沒有掉落任何物品。") + regenLog, "🎉");
        document.getElementById('event-icon').className = "monster-icon";

        window.Game.checkAchievements();
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        window.Game.updateUI();
    },

    calculateDrops(enemy) {
        let drops = [];

        if (enemy.isTrueForm && CONFIG.lootData["真實之心"]) {
            drops.push({ ...CONFIG.lootData["真實之心"], name: "真實之心", type: "loot" });
            return drops;
        }

        // 天使的幸運：普通掉落率提升至 100%
        let normalDropRate = (window.Player.buff && window.Player.buff.id === 'angel_fortune') ? 1.0 : 0.7;

        // 應用詞綴加成 (Game.modifiers.luck)
        if (window.Game.modifiers && window.Game.modifiers.luck) {
            normalDropRate += window.Game.modifiers.luck;
        }

        // 應用怪物詞綴加成 (extraDropRate)
        if (enemy.extraDropRate) {
            normalDropRate += enemy.extraDropRate;
        }

        if (Math.random() < normalDropRate && CONFIG.lootData[enemy.drop]) {
            drops.push({ ...CONFIG.lootData[enemy.drop], name: enemy.drop, type: "loot" });
        }

        // 菁英/首領/詞綴怪物 額外掉落判定
        // 基礎機率 30%，如果有詞綴則大幅提升
        let specialDropRate = 0.3;
        if (enemy.extraDropRate) specialDropRate += enemy.extraDropRate;

        if ((enemy.tier === "elite" || enemy.tier === "boss" || enemy.prefix || enemy.suffix) && Math.random() < specialDropRate) {
            if (CONFIG.lootData[enemy.eliteDrop]) {
                drops.push({ ...CONFIG.lootData[enemy.eliteDrop], name: enemy.eliteDrop, type: "loot" });
            }
        }

        if (enemy.tier === "boss" && Math.random() < 0.1) {
            if (CONFIG.lootData[enemy.bossDrop]) {
                drops.push({ ...CONFIG.lootData[enemy.bossDrop], name: enemy.bossDrop, type: "loot" });
            }
        }

        if (Math.random() < 0.1) {
            drops.push(window.ItemSystem.generateRandomItem(enemy.tier));
        }

        // 天使的幸運：10% 機率額外掉落
        if (window.Player.buff && window.Player.buff.id === 'angel_fortune' && Math.random() < 0.1) {
            if (CONFIG.lootData[enemy.drop]) {
                drops.push({ ...CONFIG.lootData[enemy.drop], name: enemy.drop, type: "loot" });
            }
        }

        return drops;
    },

    processDrops(enemy, drops) {
        let log = "";
        let gold = enemy.baseGold;
        if (enemy.tier === "elite") gold *= 2;
        if (enemy.tier === "boss") gold *= 5;

        for (let item of drops) {
            window.ItemSystem.addItemToInventory(item, false);
            const rarityClass = CONFIG.rarityDisplay[item.rarity || "common"].color;
            log += `<div class="${rarityClass}">${item.icon || '📦'} ${item.name}</div>`;
            AudioSystem.playSFX('item');  // 獲得物品音效
        }

        if (gold > 0) {
            // 檢查詞綴效果 (Greed: 之貪婪)
            // 檢查所有裝備
            let greedChance = 0;
            ['weapon', 'armor', 'shield'].forEach(slot => {
                if (window.Player.equipment[slot] && window.Player.equipment[slot].suffix === 'greed') {
                    greedChance += 0.1;
                }
            });

            if (Math.random() < greedChance) {
                gold *= 2;
                window.Game.showFloatingText("貪婪!", "gold");
                log += `<span class='gold-text'>[貪婪] 金幣翻倍！</span><br>`;
            }

            // 應用詞綴加成 (Game.modifiers.gold)
            if (window.Game.modifiers && window.Game.modifiers.gold > 1.0) {
                // 這裡的 gold modifier 是 1.0 + bonus，例如 1.15
                // 我們只取額外部分，或者直接乘算？
                // 根據 game.js，wealthy 是 +0.15，所以 modifiers.gold 會是 1.15
                // 我們直接乘算
                gold = Math.floor(gold * window.Game.modifiers.gold);
            }

            window.Player.gold += gold;
            window.Game.showFloatingText(`+${gold} G`, "gold");
            AudioSystem.playSFX('coin');  // 獲得金幣音效
            log += `<p><span class="gold-text">獲得 ${gold} 金幣</span></p>`;
        }

        return log;
    },

    /**
     * 計算當前逃跑率
     */
    getFleeRate() {
        let fleeRate = 0.5;
        const player = window.Player;

        if (player.buff) {
            if (player.buff.id === 'angel_wings') fleeRate = 0.6;
            if (player.buff.id === 'demon_wager') fleeRate = 0.8;
        }

        // 應用詞綴加成 (Game.modifiers.flee)
        if (window.Game.modifiers && window.Game.modifiers.flee) {
            fleeRate += window.Game.modifiers.flee;
        }

        return Math.min(1.0, Math.max(0, fleeRate));
    },

    flee() {
        const player = window.Player;

        // 惡魔賭約：先檢查死亡風險
        if (player.buff && player.buff.id === 'demon_wager') {
            if (Math.random() < 0.01) {
                player.hp = 0;
                window.Game.playerDie("死於惡魔賭約");
                return;
            }
        }

        const fleeRate = this.getFleeRate();
        const enemy = window.GameState.currentEnemy;
        const fleeSuccess = Math.random() < fleeRate;

        window.Game.recalcStats();

        if (fleeSuccess) {
            AudioSystem.playSFX('flee');  // 逃跑成功音效
            window.GameState.phase = "event_end";
            this.hideEnemyHealthBar(); // 隱藏敵人血條
            window.Game.log("> 成功逃跑！");
            window.Game.renderEvent("🏃 逃跑成功", "你成功逃離了戰鬥！", "深呼吸，繼續前進。", "💨");
            document.getElementById('event-icon').className = "monster-icon";
            window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        } else {
            AudioSystem.playSFX('damage');  // 逃跑失敗受傷音效
            let dmg = enemy.atk;

            // 計算防禦減傷 (最低傷害機制)
            const def = window.Game.getDef();
            const minDmg = Math.max(1, Math.floor(enemy.atk * 0.1));
            dmg = Math.max(minDmg, dmg - def);

            window.Game.triggerAnim('event-icon', 'anim-lunge');

            if (dmg > 0) {
                player.hp -= dmg;
                window.Game.showFloatingText(`-${dmg} HP`, "red");
                window.Game.triggerAnim('game-container', 'anim-screen-shake');

                let msg = `受到 <span class='damage-text'>${dmg} 點傷害</span>。`;

                if (player.buff?.id === 'demon_wealth' && player.gold >= 5) {
                    player.gold -= 5;
                    window.Game.showFloatingText("-5 G", "red");
                    msg += `<br><span class='demon-text'>[惡魔財富]</span> 損失 5 G`;
                }

                window.Game.renderEvent("❌ 逃跑失敗", `敵人追上並攻擊了你！`, msg, enemy.icon);
            } else {
                window.Game.showFloatingText("防禦!", "#2196f3");
                window.Game.renderEvent("❌ 逃跑失敗", "敵人追上了你！", "<span class='block-text'>🛡️ 你的防禦大幅減輕了追擊！</span>", enemy.icon);
            }

            if (player.hp <= 0) {
                window.Game.playerDie(`在逃跑時被 ${enemy.name} 殺死`);
            } else {
                window.Game.log("> 逃跑失敗！敵人趁機攻擊。");
                const fleeRate = this.getFleeRate();
                const fleeText = `逃跑 (${Math.round(fleeRate * 100)}%)`;
                window.Game.setButtons("戰鬥", "combatRound", fleeText, "flee", false);
                window.Game.updateUI();
            }
        }
    },

    /**
     * 顯示敵人血條
     */
    showEnemyHealthBar(enemy) {
        const eventDisplay = document.getElementById('event-display');

        // 檢查是否已存在敵人血條容器
        let container = document.getElementById('enemy-health-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'enemy-health-container';
            container.innerHTML = `
                <div id="enemy-health-label"></div>
                <div class="health-bar-container">
                    <div class="health-bar" id="enemy-health-bar" style="width: 100%;"></div>
                </div>
            `;
            eventDisplay.appendChild(container);
        }

        this.updateEnemyHealthBar(enemy);
    },

    /**
     * 更新敵人血條
     */
    updateEnemyHealthBar(enemy) {
        const healthBar = document.getElementById('enemy-health-bar');
        const healthLabel = document.getElementById('enemy-health-label');

        if (!healthBar || !healthLabel) return;

        const healthPercent = enemy.maxHp > 0 ? (enemy.hp / enemy.maxHp) * 100 : 0;
        healthBar.style.width = Math.max(0, healthPercent) + '%';

        // 根據血量百分比改變血條顏色
        healthBar.className = 'health-bar';
        if (healthPercent <= 30) {
            healthBar.classList.add('low');
        } else if (healthPercent <= 50) {
            healthBar.classList.add('medium');
        }

        healthLabel.textContent = `${enemy.name}: ${Math.max(0, enemy.hp)} / ${enemy.maxHp}`;
    },

    /**
     * 隱藏敵人血條
     */
    hideEnemyHealthBar() {
        const container = document.getElementById('enemy-health-container');
        if (container) {
            container.remove();
        }
    }
};

if (typeof window !== 'undefined') {
    window.CombatSystem = CombatSystem;
}

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
    triggerCombat(isForcedBoss, checkTrueForm, forceTier = null) {
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
            tier = forceTier ? forceTier : this.determineMonsterTier();
        }

        const enemy = this.createEnemy(baseMonster, tier, checkTrueForm);
        window.GameState.currentEnemy = enemy;

        this.renderCombatStart(enemy);
        const fleeRate = this.getFleeRate();
        const fleeText = `逃跑 (${Math.round(fleeRate * 100)}%)`;


        // 使用新的戰鬥按鈕設置
        window.UISystem.setCombatButtons("戰鬥", "combatRound", fleeText, "flee", "playerDefend");
    },

    getWeightedMonster() {
        let activeMonsters = [];

        const depth = window.Player.depth;
        let maxIndex = 2; // 預設只開放前3隻 (史萊姆, 哥布林, 狂狼)

        if (depth >= 200) {
            maxIndex = 9; // 全開放 (包含飛龍, 魔王)
        } else if (depth >= 100) {
            maxIndex = 7; // 開放至食人妖 (排除飛龍, 魔王)
        } else if (depth >= 50) {
            maxIndex = 5; // 開放至幽靈
        }

        // 嚴格篩選可出現的怪物
        CONFIG.monsters.forEach((m, idx) => {
            if (idx <= maxIndex) {
                activeMonsters.push(m);
            }
        });

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
        } else if (depth >= 50) {
            // 50-100層 (原設定)
            if (rand < 0.01) return "boss";
            else if (rand < 0.11) return "elite";
            else return "normal";
        } else {
            // 50層以下：不出現 Boss
            if (rand < 0.1) return "elite";
            else return "normal";
        }
    },

    createEnemy(baseMonster, tier, checkTrueForm) {
        let hpMul = 1, atkMul = 1;
        let namePrefix = "";
        let penetration = 0; // 新增：穿透屬性

        // 平滑化成長曲線 (方案B優化版)：
        // 50層起: 每10層 +1% (50-299層)
        // 300層起: 每100層 +10% (原設定)

        let depth = window.Player.depth;

        // 1. 基礎成長 (50-299層)
        if (depth >= 50 && depth < 300) {
            let bonus = Math.floor((depth - 50) / 10) * 0.01; // 每10層+1%
            hpMul *= (1 + bonus);
            atkMul *= (1 + bonus);
        }

        // 2. 深層成長 (300層+)
        if (depth >= 300) {
            let bonus = 0;
            // 先加上 50-299 的滿額加成 (25%)
            let earlyBonus = 0.25;

            if (depth < 600) {
                // 階段1: 300~599層 (每50層+10%)
                const chunks = Math.floor((depth - 300) / 50) + 1;
                bonus = earlyBonus + (chunks * 0.10);
            } else {
                // 階段2: 600層+
                // 300-599 滿額 (60%)
                bonus = earlyBonus + 0.60;
                // 600+ (每50層+12%)
                const chunks = Math.floor((depth - 600) / 50) + 1;
                bonus += chunks * 0.12;
            }

            hpMul *= (1 + bonus);
            atkMul *= (1 + bonus);
            namePrefix += "深淵 ";
        }

        if (tier === "elite") {
            hpMul *= 2;
            atkMul *= 1.5;
            namePrefix += "菁英 ";
        } else if (tier === "boss") {
            hpMul *= 3;
            atkMul *= 2;
            namePrefix += "首領 ";
            penetration = 0.25;
        }

        // 怪物詞綴系統 (1000層後 或 精英怪低機率)
        let prefix = null;
        let suffix = null;
        let extraDropRate = 0;

        // 條件：深度 > 1000 或 (深度 > 50 且 精英怪 且 20%機率)
        const canHaveAffix = (depth > 1000) || (depth > 50 && tier === 'elite' && Math.random() < 0.2);

        if (canHaveAffix) {
            // 30% 機率出現前綴 (深層) 或 必定出現 (若為早期精英觸發)
            const chance = (depth > 1000) ? 0.3 : 1.0;

            if (Math.random() < chance) {
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
            extraDropRate: extraDropRate,
            penetration: penetration // 新增穿透屬性
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

        // --- [新增: 生成初始意圖] ---
        this.generateEnemyIntent(enemy);

        window.Game.renderEvent(
            `⚔️ 遭遇 ${enemy.name}`,
            `敵方下次攻擊 將會造成 : ${this.calculateNextDamage(enemy)}`,
            "準備戰鬥！",
            enemy.icon
        );

        // 顯示敵人血條
        this.showEnemyHealthBar(enemy);

        window.UISystem.updateIntentDisplay(enemy);
    },

    /**
     * 生成怪物意圖
     */
    generateEnemyIntent(enemy) {
        const rand = Math.random();
        // 簡單邏輯：70% 攻擊，20% 重擊，10% 防禦
        if (rand < 0.7) {
            enemy.nextAction = { type: 'attack', val: 1.0 }; // 普通攻擊
        } else if (rand < 0.9) {
            enemy.nextAction = { type: 'heavy', val: 2.0 }; // 重擊 (2倍傷害)
        } else {
            enemy.nextAction = { type: 'defend', val: 0.5 }; // 防禦 (減傷)
        }
    },

    // 重新實作 combatRound
    combatRound() {
        if (window.GameState.phase !== "combat") return;

        const enemy = window.GameState.currentEnemy;
        let logHtml = "";
        const biome = window.Game.getCurrentBiome();
        let playerFrozen = false;

        // 1. 環境效果 (回合開始)
        if (biome && biome.effect) {
            if (biome.effect.type === 'freeze' && Math.random() < biome.effect.chance) {
                playerFrozen = true;
                logHtml += `<span style="color:#00bcd4">❄️ [寒冷] 你被凍結了，無法行動！</span><br>`;
            } else if (biome.effect.type === 'burn') {
                const dmg = Math.floor(window.Player.maxHp * biome.effect.val);
                window.Player.hp -= dmg;
                window.Game.showFloatingText(`-${dmg}`, "#ff5722");
                logHtml += `<span style="color:#ff5722">🔥 [灼燒] 環境高溫造成 ${dmg} 點傷害。</span><br>`;
            }
        }

        // 2. 玩家回合
        let enemyFrozen = false;
        if (!playerFrozen) {
            // 普攻增加 1 SP
            if (window.Player.sp < window.Player.maxSp) {
                window.Player.sp++;
            }

            const playerAttack = this.executePlayerAttack(enemy);
            logHtml += playerAttack.log;
            if (playerAttack.enemyDead) {
                this.combatWin();
                return;
            }
            if (playerAttack.isFrozen) enemyFrozen = true;
        }

        // 3. 敵人回合 (根據意圖行動)
        if (window.Player.hp > 0) {
            if (enemyFrozen) {
                logHtml += "敵人被凍結，無法行動！<br>";
            } else {
                // 執行意圖
                const action = enemy.nextAction || { type: 'attack', val: 1.0 };

                if (action.type === 'defend') {
                    logHtml += `🛡️ ${enemy.name} 採取了防禦姿態！<br>`;
                    // 防禦邏輯在玩家攻擊時計算 (減傷)，這裡只是視覺
                } else {
                    // 攻擊或重擊
                    const monsterAttack = this.executeMonsterAttack(enemy, action.val);
                    logHtml += monsterAttack.log;
                }
            }
        }

        // 4. 回合結束：生成下回合意圖
        this.generateEnemyIntent(enemy);
        window.UISystem.updateIntentDisplay(enemy);

        // 5. 結算與渲染
        window.Game.renderEvent(
            `⚔️ 戰鬥中 - ${enemy.name}`,
            `敵方下次攻擊 將會造成 : ${this.calculateNextDamage(enemy)}`,
            logHtml,
            enemy.icon
        );

        this.updateEnemyHealthBar(enemy);

        if (window.Player.hp <= 0) {
            window.Game.playerDie(`被 ${enemy.name} 殺死`);
        } else {
            const fleeRate = this.getFleeRate();
            const fleeText = `逃跑 (${Math.round(fleeRate * 100)}%)`;
            // 更新按鈕 (包含技能與終結技狀態)
            window.UISystem.setCombatButtons("戰鬥", "combatRound", fleeText, "flee", "playerDefend");
            window.Game.updateUI();
        }
    },

    /**
     * 玩家技能 (消耗 HP 或其他資源)
     */
    playerSkill() {
        if (window.GameState.phase !== "combat") return;
        const player = window.Player;
        const enemy = window.GameState.currentEnemy;
        let logHtml = "";

        // 根據武器類型判斷技能
        // 簡單判斷：看武器名稱
        let type = 'sword'; // 預設
        if (player.equipment.weapon) {
            if (player.equipment.weapon.name.includes('盾')) type = 'shield';
            else if (player.equipment.weapon.name.includes('槍') || player.equipment.weapon.name.includes('矛')) type = 'spear';
        }

        let skillDmg = 0;
        let selfDmg = 0;
        let isStun = false;

        if (type === 'sword') {
            // 強擊: 消耗 10% HP, 150% 傷害
            selfDmg = Math.floor(player.maxHp * 0.1);
            if (player.hp <= selfDmg) {
                window.UISystem.showToast("生命不足，無法使用強擊！", "error");
                return;
            }
            player.hp -= selfDmg;
            skillDmg = Math.floor(window.Game.getAtk() * 1.5);
            logHtml += `⚔️ [強擊] 消耗 ${selfDmg} HP，造成巨大傷害！<br>`;
        } else if (type === 'shield') {
            // 盾擊: 50% 傷害, 30% 暈眩
            skillDmg = Math.floor(window.Game.getAtk() * 0.5);
            if (Math.random() < 0.3) isStun = true;
            logHtml += `🛡️ [盾擊] 衝撞敵人！<br>`;
        } else if (type === 'spear') {
            // 貫穿: 100% 傷害 (無視防禦 - 這裡簡化為直接傷害)
            skillDmg = window.Game.getAtk(); // 實際穿透邏輯需配合 monsterDef
            logHtml += `🔱 [貫穿] 無視防禦的攻擊！<br>`;
        }

        // 執行傷害
        enemy.hp -= skillDmg;
        window.Game.showFloatingText(skillDmg, "#ffeb3b");
        logHtml += `你對 ${enemy.name} 造成 ${skillDmg} 點技能傷害。<br>`;

        if (enemy.hp <= 0) {
            this.combatWin();
            return;
        }

        // 敵人回合
        if (isStun) {
            logHtml += "敵人被暈眩了！<br>";
        } else {
            // 正常敵人行動 (需考慮意圖)
            const action = enemy.nextAction || { type: 'attack', val: 1.0 };
            if (action.type !== 'defend') {
                const monsterAttack = this.executeMonsterAttack(enemy, action.val);
                logHtml += monsterAttack.log;
            } else {
                logHtml += `🛡️ ${enemy.name} 保持防禦。<br>`;
            }
        }

        // 回合結束更新
        this.generateEnemyIntent(enemy);
        window.UISystem.updateIntentDisplay(enemy);

        window.Game.renderEvent(
            `⚔️ 技能發動 - ${enemy.name}`,
            `敵方下次攻擊 將會造成 : ${this.calculateNextDamage(enemy)}`,
            logHtml,
            enemy.icon
        );
        this.updateEnemyHealthBar(enemy);

        if (player.hp <= 0) window.Game.playerDie(`被 ${enemy.name} 殺死`);
        else {
            const fleeRate = this.getFleeRate();
            const fleeText = `逃跑 (${Math.round(fleeRate * 100)}%)`;
            window.UISystem.setCombatButtons("戰鬥", "combatRound", fleeText, "flee", "playerDefend");
            window.Game.updateUI();
        }
    },

    /**
     * 玩家終結技 (消耗 3 SP)
     */
    playerUltimate() {
        if (window.GameState.phase !== "combat") return;
        if (window.Player.sp < 3) {
            window.UISystem.showToast("SP 不足！", "error");
            return;
        }

        const player = window.Player;
        const enemy = window.GameState.currentEnemy;
        let logHtml = "";

        player.sp = 0; // 消耗 SP
        let ultDmg = 0;

        // 根據職業
        if (player.class === 'knight') {
            // 聖光斬: 200% 傷害 + 回復 20% HP
            ultDmg = window.Game.getAtk() * 2;
            const heal = Math.floor(player.maxHp * 0.2);
            player.hp = Math.min(player.maxHp, player.hp + heal);
            logHtml += `✨ [聖光斬] 聖光照耀！恢復 ${heal} HP 並造成重創！<br>`;
        } else if (player.class === 'thief') {
            // 背刺: 250% 傷害 (必定暴擊)
            ultDmg = window.Game.getAtk() * 2.5 * 2; // 暴擊
            logHtml += `🗡️ [背刺] 致命一擊！<br>`;
        } else if (player.class === 'merchant') {
            // 撒幣: 消耗 10% 金幣，造成 金幣量 * 0.5 傷害
            const cost = Math.floor(player.gold * 0.1);
            player.gold -= cost;
            ultDmg = Math.floor(cost * 5); // 1金幣換5傷害
            logHtml += `💰 [乾坤一擲] 消耗 ${cost} G 造成大量傷害！<br>`;
        } else {
            // 通用
            ultDmg = window.Game.getAtk() * 3;
            logHtml += `💥 [全力一擊] 釋放所有力量！<br>`;
        }

        enemy.hp -= ultDmg;
        window.Game.showFloatingText(ultDmg, "#e91e63");
        window.Game.triggerAnim('game-container', 'anim-screen-shake');
        logHtml += `終結技對 ${enemy.name} 造成 <span style="color:#e91e63; font-size:1.2em;">${ultDmg}</span> 點傷害！<br>`;

        if (enemy.hp <= 0) {
            this.combatWin();
            return;
        }

        // 敵人回合 (終結技通常會打斷敵人，這裡設定為敵人無法行動)
        logHtml += "敵人被終結技的氣勢震懾，無法行動！<br>";

        this.generateEnemyIntent(enemy);
        window.UISystem.updateIntentDisplay(enemy);

        window.Game.renderEvent(
            `🔥 終結技爆發 - ${enemy.name}`,
            `敵方下次攻擊 將會造成 : ${this.calculateNextDamage(enemy)}`,
            logHtml,
            enemy.icon
        );
        this.updateEnemyHealthBar(enemy);
        const fleeRate = this.getFleeRate();
        const fleeText = `逃跑 (${Math.round(fleeRate * 100)}%)`;
        window.UISystem.setCombatButtons("戰鬥", "combatRound", fleeText, "flee", "playerDefend");
        window.Game.updateUI();
    },

    /**
     * 玩家防禦
     */
    playerDefend() {
        if (window.GameState.phase !== "combat") return;

        const player = window.Player;
        const enemy = window.GameState.currentEnemy;
        let logHtml = "";

        // 1. 設定防禦狀態
        player.isDefending = true;
        player.nextAtkBonus = true; // 下回合攻擊加成

        logHtml += `<span class="block-text">🛡️ 你採取了防禦姿態！</span><br>`;
        logHtml += `<span class="buff-text">下回合攻擊力將提升 20%！</span><br>`;

        window.Game.triggerAnim('event-icon', 'anim-guard'); // 假設有這個動畫，或者用其他
        AudioSystem.playSFX('equip'); // 暫用裝備音效代替防禦音效

        // 2. 怪物攻擊 (傷害減半由 executeMonsterAttack 處理)
        const monsterAttack = this.executeMonsterAttack(enemy);
        logHtml += monsterAttack.log;

        // 3. 渲染結果
        window.Game.renderEvent(
            `🛡️ 防禦中 - ${enemy.name}`,
            `敵方下次攻擊 將會造成 : ${this.calculateNextDamage(enemy)}`,
            logHtml,
            enemy.icon
        );

        // 4. 清除防禦狀態 (回合結束)
        player.isDefending = false;

        // 5. 檢查死亡
        if (window.Player.hp <= 0) {
            window.Game.playerDie(`被 ${enemy.name} 殺死`);
        } else {
            const fleeRate = this.getFleeRate();
            const fleeText = `逃跑 (${Math.round(fleeRate * 100)}%)`;
            window.UISystem.setCombatButtons("戰鬥", "combatRound", fleeText, "flee", "playerDefend");
            window.Game.updateUI();
        }
    },


    executePlayerAttack(enemy) {
        let pDmg = window.Game.getAtk();
        let pCritRate = 0.05;
        let log = "";

        const player = window.Player;

        // 檢查反擊加成
        if (player.nextAtkBonus) {
            pDmg = Math.floor(pDmg * 1.2);
            player.nextAtkBonus = false; // 消耗加成
            log += `<span class="buff-text">⚔️ 反擊！攻擊力提升 20%！</span><br>`;
        }

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

        // 應用區域效果 (墓地: 恐懼)
        const biome = window.Game.getCurrentBiome();
        if (biome && biome.effect && biome.effect.type === 'fear') {
            pCritRate += (biome.effect.critMod / 100); // critMod 是 -10
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

    /**
     * 計算敵人下次攻擊的預計傷害
     */
    calculateNextDamage(enemy) {
        if (!enemy.nextAction) return "???";

        if (enemy.nextAction.type === 'defend') {
            return "0 (防禦中)";
        }

        const multiplier = enemy.nextAction.val;
        let dmg = Math.floor(enemy.atk * multiplier);

        // Buff 減傷 (天使的加護: -30%)
        if (window.Player.buff && window.Player.buff.id === 'angel_protection') {
            dmg = Math.floor(dmg * 0.7);
        }

        // 計算防禦減傷 (百分比公式: 100 / (100 + Def))
        const def = window.Game.getDef();
        let effectiveDef = def;
        if (enemy.penetration) {
            effectiveDef = Math.floor(def * (1 - enemy.penetration));
        }

        const reduction = 100 / (100 + effectiveDef);
        dmg = Math.floor(dmg * reduction);

        const minDmg = 1;
        dmg = Math.max(minDmg, dmg);

        return dmg;
    },

    executeMonsterAttack(enemy, multiplier = 1.0) {
        let log = "";
        // 根據意圖倍率調整傷害
        let dmg = Math.floor(enemy.atk * multiplier);

        // 檢查玩家防禦
        if (window.Player.isDefending) {
            dmg = Math.floor(dmg * 0.5); // 減傷 50%
        }

        // Buff 減傷 (天使的加護: -30%)
        if (window.Player.buff && window.Player.buff.id === 'angel_protection') {
            dmg = Math.floor(dmg * 0.7);
        }

        // 計算防禦減傷 (百分比公式)
        const def = window.Game.getDef();
        // 穿透計算 (BOSS)
        let effectiveDef = def;
        if (enemy.penetration) {
            effectiveDef = Math.floor(def * (1 - enemy.penetration));
        }

        const reduction = 100 / (100 + effectiveDef);
        dmg = Math.floor(dmg * reduction);

        const minDmg = 1;
        dmg = Math.max(minDmg, dmg);

        window.Game.triggerAnim('event-icon', 'anim-lunge');

        if (dmg > 0) {
            window.Player.hp -= dmg;
            window.Game.showFloatingText(`-${dmg} HP`, "red");
            window.Game.triggerAnim('game-container', 'anim-screen-shake');

            let typeText = multiplier > 1.0 ? "重擊" : "攻擊";
            log += `${enemy.name} 對你使用了 <span class='damage-text'>${typeText}</span>，造成 ${dmg} 點傷害。<br>`;
        } else {
            log += `${enemy.name} 的攻擊被你完全格擋了！<br>`;
        }

        if (window.Player.isDefending) {
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
        window.UISystem.hideCombatButtons(); // 隱藏防禦按鈕
        window.UISystem.updateIntentDisplay(null); // 清除意圖顯示
        window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        window.Game.updateUI();

        // 重置臨時加成
        if (window.GameState.tempBonus) {
            window.GameState.tempBonus = null;
        }
    },

    calculateDrops(enemy) {
        let drops = [];

        if (enemy.isTrueForm && CONFIG.lootData["真實之心"]) {
            drops.push({ ...CONFIG.lootData["真實之心"], name: "真實之心", type: "loot" });
            return drops;
        }

        // 天使的幸運：普通掉落率提升至 100%
        let normalDropRate = (window.Player.buff && window.Player.buff.id === 'angel_fortune') ? 1.0 : 0.7;

        // 應用臨時加成 (危險路徑)
        if (window.GameState.tempBonus && window.GameState.tempBonus.drop) {
            normalDropRate *= window.GameState.tempBonus.drop;
        }

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

        // 應用臨時加成 (危險路徑)
        if (window.GameState.tempBonus && window.GameState.tempBonus.gold) {
            gold *= window.GameState.tempBonus.gold;
            log += `<span class='gold-text'>[危險路徑] 金幣加成 x${window.GameState.tempBonus.gold}！</span><br>`;
        }

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

            // 應用符文加成 (貪婪之手)
            if (window.Player.unlockedRunes && window.Player.unlockedRunes.includes('passive_gold')) {
                const bonus = CONFIG.runes.passive_gold.effect.val; // 0.5
                gold = Math.floor(gold * (1 + bonus));
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

        // 區域效果 (墓地: 恐懼)
        const biome = window.Game.getCurrentBiome();
        if (biome && biome.effect && biome.effect.type === 'fear') {
            fleeRate += biome.effect.fleeMod; // fleeMod 是 -0.2
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
            window.UISystem.hideCombatButtons(); // 隱藏防禦按鈕
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
                window.UISystem.setCombatButtons("戰鬥", "combatRound", fleeText, "flee", "playerDefend");
                window.Game.updateUI();
            }
        }
    },

    /**
     * 顯示敵人血條
     */
    showEnemyHealthBar(enemy) {
        // 修改：將血條插入到 event-visual-container 中，實現水平排列
        const visualContainer = document.getElementById('event-visual-container');

        // 如果找不到容器 (舊版兼容)，則退回到 event-display
        const targetContainer = visualContainer || document.getElementById('event-display');

        // 檢查是否已存在敵人血條容器
        let container = document.getElementById('enemy-health-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'enemy-health-container';
            // 設定寬度，因為現在是並排顯示
            container.style.width = "50%";
            container.innerHTML = `
                <div id="enemy-health-label"></div>
                <div class="health-bar-container">
                    <div class="health-bar" id="enemy-health-bar" style="width: 100%;"></div>
                </div>
            `;
            targetContainer.appendChild(container);
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

        healthLabel.innerHTML = `${enemy.name}: ${Math.max(0, enemy.hp)} / ${enemy.maxHp}`;
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

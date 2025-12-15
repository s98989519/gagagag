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
    triggerCombat(isForcedBoss, checkTrueForm, forceTier = null, forceMonsterName = null) {
        window.GameState.phase = "combat";

        let baseMonster;
        let tier = "normal";
        let canFlee = true;

        if (forceMonsterName) {
            baseMonster = CONFIG.monsters.find(m => m.name === forceMonsterName);
            if (!baseMonster) {
                console.error("Monster not found:", forceMonsterName);
                baseMonster = this.getWeightedMonster();
            }
            tier = forceTier ? forceTier : "normal";
            if (isForcedBoss) tier = "boss";
        } else if (isForcedBoss) {
            baseMonster = CONFIG.monsters[9];
            tier = "boss";
            canFlee = false;
        } else {
            baseMonster = this.getWeightedMonster();
            tier = forceTier ? forceTier : this.determineMonsterTier();
        }

        const enemy = this.createEnemy(baseMonster, tier, checkTrueForm);
        window.GameState.currentEnemy = enemy;

        // [Fix] 戰鬥開始(狀態確立)後強制存檔，防止進度丟失
        // 移動到這裡是因為需要 currentEnemy 已經生成，這樣 loadGame 才能正確恢復戰鬥 UI
        if (window.Game && typeof window.Game.saveGame === 'function') {
            window.Game.saveGame();
        }

        // [New] 真實之冠效果 Check
        const hasCrown = (window.Player.equipment.accessories || []).some(a => a && a.id === 'acc_truth');
        if (hasCrown) {
            enemy.atk = Math.floor(enemy.atk * 0.5);
            enemy.def = Math.floor(enemy.def * 0.5);
            enemy.maxHp = Math.floor(enemy.maxHp * 0.8); // 稍微削弱血量
            enemy.hp = enemy.maxHp;
            window.UISystem.showToast("👑 真實之冠發動：敵人恐懼了！(攻防減半)", "warning");
        }

        this.renderCombatStart(enemy);
        const fleeRate = this.getFleeRate();
        const fleeText = `逃跑 (${Math.round(fleeRate * 100)}%)`;


        // 使用新的戰鬥按鈕設置
        window.UISystem.setCombatButtons("戰鬥", "combatRound", fleeText, "flee", "playerDefend");

        // 色慾: 重置首擊 Flag
        window.GameState.firstHit = true;

        // 更新 UI 以顯示初始 Debuff (如哈比威脅)
        window.Game.updateUI();
    },

    /**
     * 直接與指定敵人物件開始戰鬥
     */
    startCombatWithEnemy(enemy) {
        window.GameState.phase = "combat";
        window.GameState.currentEnemy = enemy;

        window.GameState.currentEnemy = enemy;

        // [New] 哈比特殊機制檢查 (針對事件手動觸發戰鬥的情況)
        // 先重置
        window.GameState.harpyThreat = false;
        if (enemy.name && (enemy.name.includes("哈比") || enemy.name.includes("Harpy"))) {
            window.GameState.harpyThreat = true;
        }

        // [New] 真實之冠效果 Check
        const hasCrown = (window.Player.equipment.accessories || []).some(a => a && a.id === 'acc_truth');
        if (hasCrown) {
            enemy.atk = Math.floor(enemy.atk * 0.5);
            enemy.def = Math.floor(enemy.def * 0.5);
            enemy.maxHp = Math.floor(enemy.maxHp * 0.8);
            enemy.hp = enemy.maxHp;
            window.UISystem.showToast("👑 真實之冠發動：敵人恐懼了！(攻防減半)", "warning");
        }

        this.renderCombatStart(enemy);
        const fleeRate = this.getFleeRate();
        const fleeText = `逃跑 (${Math.round(fleeRate * 100)}%)`;

        window.UISystem.setCombatButtons("戰鬥", "combatRound", fleeText, "flee", "playerDefend");

        // 色慾: 重置首擊 Flag
        window.GameState.firstHit = true;

        // [New] 魔神之壁 (Demon Wall) 初始充能
        if (window.Player.equipment.shield && window.Player.equipment.shield.id === 's_demon_wall') {
            window.GameState.demonWallCharges = 10;
        } else {
            window.GameState.demonWallCharges = 0;
        }

        // 更新 UI 以顯示初始 Debuff
        window.Game.updateUI();
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
            // [MOD] 特殊Boss例外處理 (哥布林族長 & 史萊姆之王)
            if (baseMonster.name === "哥布林族長" || baseMonster.name === "史萊姆之王") {
                // 不進行 tier 膨脹 (也不進行 depth 膨脹，需在上面重置)
                hpMul = 1; // 重置所有倍率
                atkMul = 1;
                // Name prefix removal if desired, otherwise keep "首領"
                namePrefix += "首領 ";
            } else {
                hpMul *= 3;
                atkMul *= 2;
                namePrefix += "首領 ";
                penetration = 0.25;
            }
        }

        // 怪物詞綴系統 (1000層後 或 精英怪低機率)
        let prefix = null;
        let suffix = null;
        let extraDropRate = 0;

        // 條件：深度 > 1000 或 (深度 > 50 且 精英怪 且 20%機率)
        const canHaveAffix = (depth > 1000) || (depth > 50 && tier === 'elite' && Math.random() < 0.2);

        // 清除哈比威脅 Debuff (每次戰鬥開始重置)
        window.GameState.harpyThreat = false;



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
            prefix: prefix,
            suffix: suffix,
            extraDropRate: extraDropRate,
            plunderCount: 0, // [New] 掠奪計數
            penetration: penetration, // 新增穿透屬性
            evasion: 0, // [New] 新增閃避屬性
            image: baseMonster.images ? baseMonster.images[tier] : null // 新增：圖片路徑
        };

        // [New] 應用 "Agile" (靈活的) 閃避加成
        if (prefix && prefix.effect === 'evasion') {
            enemy.evasion += prefix.val;
        }

        // [New] 哈比特殊機制：來自空中的威脅
        if (enemy.name.includes("哈比")) {
            window.GameState.harpyThreat = true;
        }

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

        const intentHtml = window.UISystem.getIntentHtml(enemy);

        window.Game.renderEvent(
            `${intentHtml} ⚔️ 遭遇 ${enemy.name}`,
            `敵方下次攻擊 將會造成 : ${this.calculateNextDamage(enemy)}`,
            "準備戰鬥！",
            enemy.image || enemy.icon // 優先使用圖片
        );

        // 顯示敵人血條
        this.showEnemyHealthBar(enemy);
    },

    /**
     * 生成怪物意圖
     */
    generateEnemyIntent(enemy) {
        const rand = Math.random();

        // [New] 哈比特殊技能邏輯
        if (enemy.name.includes("貪婪的哈比") || enemy.name.includes("哈比")) {
            // [New] 檢查是否滿足逃跑條件 (搶夠 5 次 + 1 回合預告)
            if (enemy.plunderCount >= 5) {
                if (!enemy.wantsToFlee) {
                    // 第一次滿足條件：發出預告
                    enemy.nextAction = { type: 'prepare_flee', val: 0 };
                    enemy.wantsToFlee = true;
                    return;
                } else {
                    // 已發出預告：執行逃跑
                    enemy.nextAction = { type: 'flee', val: 0 };
                    return;
                }
            }

            // 30% 風暴之翼 (Buff Evasion), 40% 掠奪一空 (Steal), 30% 普通攻擊
            if (Math.random() < 0.3) {
                enemy.nextAction = { type: 'skill', name: 'WingStorm', val: 1.2 };
                return;
            } else if (Math.random() < 0.7) {
                enemy.nextAction = { type: 'skill', name: 'Plunder', val: 0.8 };
                return;
            }
        }

        // [New] 哈比行動限制：不使用重擊和防禦
        if (enemy.name.includes("哈比")) {
            // 只會使用攻擊
            enemy.nextAction = { type: 'attack', val: 1.0 };
            return;
        }

        // [New] 哥布林族長 AI
        if (enemy.name.includes("哥布林族長")) {
            const playerGold = window.Player.gold || 0;

            // 初始化狀態
            if (typeof enemy.goblinState === 'undefined') {
                enemy.goblinState = 0;
                enemy.skill1Cooldown = 0; // 劇毒塗藥
                enemy.skill2Cooldown = 0; // 覬覦財富
                enemy.poisonCoatingStacks = 0; // 劇毒塗藥層數
                enemy.baseMaxHp = enemy.maxHp; // 記錄基礎最大血量
                enemy.lastGold = playerGold; // 記錄上一次金幣

                // 初始血量加成 (每 10 金幣 +0.1%)
                const bonusPercent = Math.floor(playerGold / 10) * 0.1;
                const bonusHp = Math.floor(enemy.baseMaxHp * (bonusPercent / 100));
                enemy.maxHp += bonusHp;
                enemy.hp += bonusHp;
            }

            // --- 被動：金幣收藏家 ---
            // 檢查金幣變化
            const goldDiff = enemy.lastGold - playerGold;

            if (goldDiff > 0) {
                // 金幣減少：扣除對應的血量加成 (最大生命不變)
                // 損失的加成量 = 基礎血量 * (減少的金幣 / 10 * 0.1%)
                const lossPercent = Math.floor(goldDiff / 10) * 0.1;
                const hpLoss = Math.floor(enemy.baseMaxHp * (lossPercent / 100));

                if (hpLoss > 0) {
                    enemy.hp -= hpLoss;
                    window.Game.showFloatingText(`-${hpLoss}`, "red");
                    // 顯示特殊訊息
                    window.Game.showFloatingText("?!", "orange");
                    window.UISystem.showToast("哥布林族長專注於金幣，沒注意到威脅！", "warning");
                }
            } else if (goldDiff < 0) {
                // 金幣增加：增加最大生命與當前生命
                const gainGold = -goldDiff;
                const gainPercent = Math.floor(gainGold / 10) * 0.1;
                const hpGain = Math.floor(enemy.baseMaxHp * (gainPercent / 100));

                if (hpGain > 0) {
                    enemy.maxHp += hpGain;
                    enemy.hp += hpGain;
                    window.Game.showFloatingText(`+${hpGain} HP`, "green");
                }
            }

            // 更新金幣記錄
            enemy.lastGold = playerGold;

            // 減少冷卻
            if (enemy.skill1Cooldown > 0) enemy.skill1Cooldown--;
            if (enemy.skill2Cooldown > 0) enemy.skill2Cooldown--;

            // 技能邏輯
            // 優先級：覬覦財富 (Skill 2) > 劇毒塗藥 (Skill 1) > 普攻

            // 技能 2: 覬覦財富 (CD 5)
            // 機率 30% 施放 (7:3)
            if (enemy.skill2Cooldown === 0 && Math.random() < 0.3) {
                // 只有當玩家有金幣時才值得偷，或者強制發動造成傷害
                enemy.nextAction = { type: 'skill', name: 'CovetWealth', val: 0 };
                enemy.skill2Cooldown = 5;
                return;
            }

            // 技能 1: 劇毒塗藥 (CD 6)
            // 機率 30% 施放
            if (enemy.skill1Cooldown === 0 && Math.random() < 0.3) {
                enemy.nextAction = { type: 'skill', name: 'PoisonCoating', val: 0 };
                enemy.skill1Cooldown = 6;
                return;
            }
        }

        // [New] 史萊姆之王 AI
        if (enemy.name.includes("史萊姆之王")) {
            // 初始化
            if (typeof enemy.slimeState === 'undefined') {
                enemy.slimeState = 0; // 0:Idle, 1:Prep1, 2:Prep2
                enemy.skill1Cooldown = 0; // 黏液噴灑 (CD 6)
                enemy.skill2Cooldown = 0; // 爆炸分裂 (CD 6)
            }

            // 減少冷卻
            if (enemy.skill1Cooldown > 0) enemy.skill1Cooldown--;
            if (enemy.skill2Cooldown > 0) enemy.skill2Cooldown--;

            // 正在準備分裂中?
            if (enemy.slimeState > 0) {
                if (enemy.slimeState === 2) {
                    // 準備完成，發動！
                    enemy.nextAction = { type: 'skill', name: 'ExplosiveSplit', val: 0 };
                    enemy.slimeState = 0;
                    return;
                }
                // 還在準備 (第 1 回合準備)
                enemy.slimeState++;
                enemy.nextAction = { type: 'prepare', val: 0 };
                enemy.prepareState = enemy.prepareState || { reduction: 0 };
                return;
            }

            // 技能選擇邏輯
            // 優先：爆炸分裂 (CD 6)
            // 機率 30% 施放
            if (enemy.skill2Cooldown === 0 && Math.random() < 0.3) {
                // 開始準備
                enemy.slimeState = 1;
                enemy.skill2Cooldown = 6;
                enemy.nextAction = { type: 'prepare', val: 0 };
                // 初始化減傷狀態
                enemy.prepareState = { reduction: 0, baseDmgPercent: 0.08 };
                return;
            }

            // 次要：黏液噴灑 (CD 6)
            // 機率 30% 施放
            if (enemy.skill1Cooldown === 0 && Math.random() < 0.3) {
                enemy.nextAction = { type: 'skill', name: 'SlimeSpray', val: 0 };
                enemy.skill1Cooldown = 6;
                return;
            }

            // 普攻
            enemy.nextAction = { type: 'attack', val: 1.0 };
            return;
        }

        // 簡單邏輯：70% 攻擊，20% 重擊，10% 防禦
        if (rand < 0.7) {
            enemy.nextAction = { type: 'attack', val: 1.0 }; // 普通攻擊
        } else if (rand < 0.9) {
            enemy.nextAction = { type: 'heavy', val: 2.0 }; // 重擊 (2倍傷害)
        } else {
            enemy.nextAction = { type: 'defend', val: 0.5 }; // 防禦 (減傷)
        }
    },

    /**
     * 更新 Buff 回合數
     */
    tickBuffs() {
        if (window.Player.extraBuffs) {
            let logHtml = "";
            window.Player.extraBuffs.forEach(b => {
                // [Fix] 無限回合 Buff 不扣減
                if (b.turns === '∞') return;

                if (b.newThisTurn) {
                    b.newThisTurn = false;
                } else {
                    b.turns--;

                    // [New] 處理 "劇毒塗藥" (哥布林族長)
                    if (b.id === 'goblin_poison_coating') {
                        // 80% 機率施加中毒
                        if (Math.random() < 0.8) {
                            const existingPoison = window.Player.extraBuffs.find(p => p.id === 'goblin_poison');
                            if (existingPoison) {
                                existingPoison.turns += 2; // 疊加回合
                                logHtml += `<span class="debuff-text">☠️ [劇毒塗藥] 毒性發作！中毒回合增加！</span><br>`;
                            } else {
                                window.Player.extraBuffs.push({
                                    id: 'goblin_poison',
                                    name: '劇毒',
                                    icon: '☠️',
                                    desc: '每回合扣 8 HP',
                                    turns: 2,
                                    newThisTurn: true,
                                    type: 'debuff',
                                    val: 8
                                });
                                logHtml += `<span class="debuff-text">☠️ [劇毒塗藥] 讓你中毒了！</span><br>`;
                            }
                        }
                    }

                    // [New] 處理 "劇毒" (哥布林族長)
                    if (b.id === 'goblin_poison' && window.Player.hp > 0) {
                        // 扣血
                        window.Player.hp -= 8;
                        window.Game.showFloatingText("-8 HP", "purple");
                        logHtml += `<span style="color:purple;">☠️ [劇毒] 毒素侵蝕，造成 8 點傷害。</span><br>`;

                        // 30% 機率施加虛弱
                        if (Math.random() < 0.3) {
                            const existingWeak = window.Player.extraBuffs.find(w => w.id === 'goblin_weakness');
                            if (existingWeak) {
                                existingWeak.turns = 1; // 刷新
                                logHtml += `<span class="debuff-text">📉 [劇毒] 引發了虛弱！</span><br>`;
                            } else {
                                window.Player.extraBuffs.push({
                                    id: 'goblin_weakness',
                                    name: '虛弱',
                                    icon: '📉',
                                    desc: '攻擊力降低 30%',
                                    turns: 1,
                                    newThisTurn: true,
                                    type: 'debuff',
                                    val: 0.3
                                });
                                logHtml += `<span class="debuff-text">📉 [劇毒] 讓你感到虛弱！(攻擊力 -30%)</span><br>`;
                            }
                        }
                    }

                    // [New] 史萊姆黏黏效果
                    if (b.id === 'slime_sticky' && window.Player.hp > 0) {
                        // [MOD] 黏黏的: 每回合扣 10 HP，30% 機率無法行動
                        const stickyDmg = 10;
                        window.Player.hp -= stickyDmg;
                        window.Game.showFloatingText(`-${stickyDmg}`, "green"); // 毒素顏色? 還是綠色因為是 Slime?

                        if (Math.random() < 0.3) {
                            window.Player.skipTurn = true;
                            logHtml += `<span style="color:orange;">💧 [黏黏的] 被黏液困住了！(無法行動)</span><br>`;
                        }
                    }
                }
            });
            // 移除過期 (保留 > 0 或 '∞')
            window.Player.extraBuffs = window.Player.extraBuffs.filter(b => b.turns > 0 || b.turns === '∞');

            // [Fix] Buff 狀態變更 (如移除) 後，必須重新計算屬性
            window.Game.recalcStats();
        }
    },

    /**
     * [New] 應用 Buff 治療效果（在tickBuffs之前調用）
     * @returns {string} logHtml - 治療日誌
     */
    applyBuffHealing() {
        let logHtml = "";
        if (window.Player.extraBuffs) {
            const peaceBuff = window.Player.extraBuffs.find(b => b.id === 'peace_of_mind');
            if (peaceBuff && window.Player.hp < window.Player.maxHp) {
                const healAmount = Math.floor(window.Player.maxHp * (peaceBuff.healPercent || 0.05));
                window.Player.hp = Math.min(window.Player.maxHp, window.Player.hp + healAmount);
                window.Game.showFloatingText(`+${healAmount} HP 💧`, "#4fc3f7");
                logHtml += `<span style="color:#4fc3f7">💧 安心效果：回復 ${healAmount} HP</span><br>`;
            }
        }
        return logHtml;
    },

    /**
     * [New] 處理哥布林族長被動：金幣收藏家
     */
    // [Removed] updateGoblinKingStats (Logic moved to generateEnemyIntent)

    // 重新實作 combatRound
    combatRound() {
        if (window.GameState.phase !== "combat") return;


        const enemy = window.GameState.currentEnemy;
        let logHtml = "";

        // [New] 神之代行者特殊能力：審判之眼
        if (enemy.isGod && window.Player.hp > 1) {
            window.Player.hp = 1;
            window.Game.showFloatingText("HP=1", "red");
            logHtml += `<span style="color:red; font-weight:bold;">👁️ [審判之眼] 你的生命值被強制歸一！</span><br>`;
            window.Game.triggerAnim('game-container', 'anim-screen-shake');
        }

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

            // [New] 黏黏的：20% 機率無法行動
            let stuck = false;
            if (window.Player.extraBuffs) {
                const sticky = window.Player.extraBuffs.find(b => b.id === 'slime_sticky');
                if (sticky && Math.random() < 0.2) {
                    stuck = true;
                    logHtml += `<span style="color:green;">💧 你被黏液困住，無法動彈！</span><br>`;
                }
            }

            if (!stuck) {
                const playerAttack = this.executePlayerAttack(enemy);
                logHtml += playerAttack.log;
                if (playerAttack.enemyDead) {
                    this.tickBuffs(); // 擊殺也要消耗回合
                    this.combatWin();
                    return;
                }
                if (playerAttack.isFrozen) enemyFrozen = true;
            }
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

                    // [Fix] 若敵人逃跑 (Phase變為 event_end)，停止後續邏輯
                    if (window.GameState.phase !== 'combat') {
                        // 確保按鈕不會被覆蓋
                        return;
                    }
                }
            }
        }

        // 4. 更新 Buff 狀態 (回合結束)
        // [New] 安心buff效果（泉水事件）- 在扣回合前觸發治療
        logHtml += this.applyBuffHealing(); // 治療效果（扣回合前）

        // 4. 更新 Buff 狀態 (回合結束)
        this.tickBuffs();

        // 5. 生成下回合意圖
        this.generateEnemyIntent(enemy);

        const intentHtml = window.UISystem.getIntentHtml(enemy);

        // 5. 結算與渲染
        window.Game.renderEvent(
            `${intentHtml} ⚔️ 戰鬥中 - ${enemy.name}`,
            `敵方下次攻擊 將會造成 : ${this.calculateNextDamage(enemy)}`,
            logHtml,
            enemy.image || enemy.icon
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
            this.tickBuffs(); // 擊殺消耗回合
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
        logHtml += this.applyBuffHealing();
        this.tickBuffs();
        this.generateEnemyIntent(enemy);

        const intentHtml = window.UISystem.getIntentHtml(enemy);

        window.Game.renderEvent(
            `${intentHtml} ⚔️ 技能發動 - ${enemy.name}`,
            `敵方下次攻擊 將會造成 : ${this.calculateNextDamage(enemy)}`,
            logHtml,
            enemy.image || enemy.icon
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
     * [Fix] 更新戰鬥日誌 (用於異步操作 Append)
     */
    updateLog(html) {
        const desc = document.getElementById('event-desc');
        if (desc) {
            desc.innerHTML += html;
            const display = document.getElementById('event-display');
            if (display) display.scrollTop = display.scrollHeight;
        }
    },

    /**
     * 玩家終結技 (消耗 8 SP)
     */
    playerUltimate() {
        if (window.GameState.phase !== "combat") return;

        const player = window.Player; // Defined earlier for check

        // 檢查職業等級 (預設 LV1) - Moved up for cost calc
        const classId = player.class === 'monkey' ? 'ape' : player.class;
        const skillLv = (player.skillLevels && player.skillLevels[classId]) ? player.skillLevels[classId] : 1;

        // [FIX] 所有職業 SP Cost Reduction (Lv5: -1, Lv6: -2)
        let spCost = 8;
        if (skillLv >= 6) spCost = 6;
        else if (skillLv >= 5) spCost = 7;

        if (player.sp < spCost) {
            window.UISystem.showToast(`SP 不足！需要 ${spCost} SP`, "error");
            return;
        }

        const enemy = window.GameState.currentEnemy;
        let logHtml = "";

        player.sp -= spCost; // Dynamic Consumption
        let ultDmg = 0;

        // [DEBUG] 調試日誌 - SP 消耗
        console.log(`[DEBUG] Cultist Ultimate - Class: ${player.class}, SkillLv: ${skillLv}, SP Cost: ${spCost}`);
        console.log(`[DEBUG] skillLevels object:`, player.skillLevels);
        console.log(`[DEBUG] classId: ${classId}`);
        logHtml += `<span style="color:#888; font-size:0.8em;">[技能等級 Lv.${skillLv}，消耗 ${spCost} SP]</span><br>`;

        let isStun = false; // [Fix] Initialize isStun

        // 1. 基礎傷害計算 (引入 Buff 加成)
        let baseAtk = window.Game.getAtk();

        // [Fix] 檢查 Buff 加成 (惡魔狂怒 +50%)
        // 攻擊力加成已在 getAtk() 中處理，這裡只處理扣血副作用

        const applyRagePenalty = () => {
            const selfDmg = Math.floor(player.hp * 0.05);
            player.hp = Math.max(1, player.hp - selfDmg);
            logHtml += `<span style="color:red; font-size:0.8em;">(惡魔狂怒扣除 ${selfDmg} HP)</span><br>`;
        };

        if (player.buff && player.buff.id === 'demon_rage') {
            applyRagePenalty();
        }
        if (player.extraBuffs) {
            player.extraBuffs.forEach(b => {
                if (b.id === 'demon_rage') applyRagePenalty();
            });
        }

        // 2. 暴擊判定
        let critRate = window.Game.getCrit() / 100;

        // 檢查神話裝備 [命運之輪] (暴擊轉倍率)
        let fateMultiplier = 1.0;
        if (player.equipment.accessory && player.equipment.accessory.id === 'acc_wheel') {
            const critIn20 = Math.floor((critRate * 100) / 20);
            fateMultiplier = 1 + (critIn20 * 1.0);
            critRate = 0; // 暴擊率歸零
        }

        const isCrit = Math.random() < critRate;
        const critMult = isCrit ? 2.0 : 1.0;

        const baseDmgCalc = (mult) => Math.floor(baseAtk * mult * critMult * fateMultiplier);

        if (player.class === 'knight') {
            // 聖光斬 Scale: 1.5, 1.7, 2.0, 2.3, 2.5, 3.0
            const dmgMap = { 1: 1.5, 2: 1.7, 3: 2.0, 4: 2.3, 5: 2.5, 6: 3.0 };
            const healMap = { 1: 0.10, 2: 0.12, 3: 0.14, 4: 0.18, 5: 0.20, 6: 0.25 };

            ultDmg = baseDmgCalc(dmgMap[skillLv] || 1.5);
            const heal = Math.floor(player.maxHp * (healMap[skillLv] || 0.10));
            player.hp = Math.min(player.maxHp, player.hp + heal);
            logHtml += `✨ [聖光斬 Lv.${skillLv}] 聖光照耀！恢復 ${heal} HP 並造成重創！<br>`;

        } else if (player.class === 'thief') {
            // 暗影一擊 New Logic
            const dmgMap = { 1: 1.5, 2: 1.7, 3: 2.0, 4: 2.3, 5: 2.5, 6: 3.0 };
            const evaMap = { 1: 10, 2: 15, 3: 18, 4: 18, 5: 20, 6: 20 };
            const turnMap = { 1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4 };

            // Crit Rate Buff Setup
            const critRateMap = { 3: 40, 4: 50, 5: 60, 6: 60 };
            const critTurnMap = { 3: 2, 4: 2, 5: 3, 6: 3 };

            ultDmg = baseDmgCalc(dmgMap[skillLv] || 1.5);
            logHtml += `🗡️ [暗影一擊 Lv.${skillLv}] 潛伏於陰影中的致命一擊！<br>`;

            // Calculate Evasion Bonus
            let evasionBonus = evaMap[skillLv] || 10;
            let stackOnCrit = false;
            let startDesc = `閃避率 +${evasionBonus}%`;

            // Lv6 Special: Enable Stacking Evasion (Always)
            if (skillLv >= 6) {
                stackOnCrit = true;
                startDesc = `閃避率 +${evasionBonus}% (暴擊疊加)`;
            }

            // If Ultimate Crits, apply first stack immediately
            if (skillLv >= 6 && isCrit) {
                evasionBonus += 15;
                logHtml += `<span style="color:#69f0ae; font-weight:bold;">⚡ 暴擊觸發！殘影進化！(及時獲得+15%閃避)</span><br>`;
            }

            if (!player.extraBuffs) player.extraBuffs = [];

            // [Fix] 檢查是否存在舊的殘影 Buff
            let existingEvasionBuff = player.extraBuffs.find(b => b.id === 'thief_evasion');
            let turnsToAdd = turnMap[skillLv] || 3;

            if (existingEvasionBuff) {
                // 延長持續時間
                existingEvasionBuff.turns += turnsToAdd;

                // 如果觸發暴擊 (LV6+)，疊加閃避值
                if (skillLv >= 6 && isCrit) {
                    existingEvasionBuff.evasion += 15;
                    // 更新描述
                    existingEvasionBuff.desc = `閃避率 +${existingEvasionBuff.evasion}% (暴擊疊加)`;
                    logHtml += `<span style="color:#69f0ae; font-weight:bold;">⚡ 暴擊觸發！殘影進化！(+15%閃避)</span><br>`;
                }

                logHtml += `<span style="color:#69f0ae;">💨 殘影持續時間延長！(剩餘 ${existingEvasionBuff.turns} 回合)</span><br>`;

                // [Self-Correction] 確保 StackOnCrit 標記被啟用 (如果是從低等級升上來的情況?)
                if (stackOnCrit) {
                    existingEvasionBuff.stackOnCrit = true;
                    existingEvasionBuff.stackVal = 15;
                }

            } else {
                // Apply New Evasion Buff
                player.extraBuffs.push({
                    id: 'thief_evasion',
                    name: '殘影',
                    evasion: evasionBonus,
                    icon: '💨',
                    desc: startDesc,
                    turns: turnsToAdd,
                    newThisTurn: true,
                    stackOnCrit: stackOnCrit,
                    stackVal: 15
                });
                logHtml += `<span style="color:#69f0ae;">💨 獲得殘影 (+${evasionBonus}% 閃避${stackOnCrit ? '，可疊加' : ''})</span><br>`;
            }

            // Apply Crit Rate Buff (Lv3+)
            if (skillLv >= 3) {
                const critVal = critRateMap[skillLv] || 40;
                const cTurns = critTurnMap[skillLv] || 2;

                // [Fix] 檢查舊的預謀 Buff
                let existingCritBuff = player.extraBuffs.find(b => b.id === 'thief_crit_rate');

                if (existingCritBuff) {
                    existingCritBuff.turns += cTurns;
                    // 更新暴擊率數值 (取較高者? 或者直接覆蓋?) 
                    // 用戶只說延長時間，但若這次技能等級更高，數值應該更新?
                    // 假設覆蓋數值為當前技能等級的數值
                    existingCritBuff.crit = critVal;
                    existingCritBuff.desc = `暴擊率 +${critVal}%`;
                    logHtml += `<span style="color:#ffeb3b;">🎯 預謀持續時間延長！(剩餘 ${existingCritBuff.turns} 回合)</span><br>`;
                } else {
                    player.extraBuffs.push({
                        id: 'thief_crit_rate',
                        name: '預謀',
                        crit: critVal,
                        icon: '🎯',
                        desc: `暴擊率 +${critVal}%`,
                        turns: cTurns,
                        newThisTurn: true
                    });
                    logHtml += `<span style="color:#ffeb3b;">🎯 獲得預謀 (+${critVal}% 暴擊率)</span><br>`;
                }
            }

        } else if (player.class === 'merchant') {
            // 金錢力量
            const dmgMap = { 1: 1.5, 2: 1.7, 3: 2.2, 4: 2.5, 5: 2.7, 6: 3.0 };
            const goldCostMap = { 1: 0.08, 2: 0.05, 3: 0.03, 4: 0.00, 5: 0.00, 6: 0.00 }; // Lv4+ no gold cost mention in CSV, assumes 0 or kept?
            // CSV Lv4: "250% 傷害 + 18% 持有金幣額外傷害" (No warning about cost). Assuming 0 cost.
            const goldDmgMap = { 1: 0.10, 2: 0.12, 3: 0.15, 4: 0.18, 5: 0.20, 6: 0.25 };

            let basePart = (baseAtk * (dmgMap[skillLv] || 1.5));
            let extraPart = player.gold * (goldDmgMap[skillLv] || 0.10);
            let rawDmg = basePart + extraPart;
            ultDmg = Math.floor(rawDmg * critMult * fateMultiplier);

            const costRate = goldCostMap[skillLv] !== undefined ? goldCostMap[skillLv] : 0;
            const cost = Math.floor(player.gold * costRate);
            if (cost > 0) {
                player.gold -= cost;
                logHtml += `💰 [金錢力量 Lv.${skillLv}] 花費 ${cost} G，造成鉅額傷害！<br>`;
            } else {
                logHtml += `💰 [金錢力量 Lv.${skillLv}] 揮金如土的一擊！<br>`;
            }

        } else if (player.class === 'cultist') {
            // 邪神降臨: Lv1/2 Random, Lv3+ Select
            // Scale: 1.5, 1.7, 2.0, 2.3, 2.5, 3.0
            const dmgMap = { 1: 1.5, 2: 1.7, 3: 2.0, 4: 2.3, 5: 2.5, 6: 3.0 };
            ultDmg = baseDmgCalc(dmgMap[skillLv] || 1.5);

            // Damage is applied first
            enemy.hp -= ultDmg;
            window.Game.showFloatingText(ultDmg, "#e91e63");
            window.Game.triggerAnim('game-container', 'anim-screen-shake');
            logHtml += `😈 [邪神降臨 Lv.${skillLv}] 召喚邪神之力！造成 <span style="color:#e91e63; font-size:1.2em;">${ultDmg}</span> 傷害！<br>`;

            // [Fix] 立即更新 UI (血條 & SP扣除後狀態)，避免玩家以為沒傷害或按鈕沒反應
            this.updateEnemyHealthBar(enemy);
            window.Game.updateUI();

            // [Modified] 移除這裡的死亡判定，改為讓玩家先選完 Buff 再結算
            // 原因：玩家希望"先打出傷害，再選擇(即使打死也要選)"，且避免流程中斷導致報錯

            // Buff Handling
            if (skillLv < 3) {
                // Lv1/2: Random (No UI)
                const isEnhanced = false;
                const turnMap = { 1: 3, 2: 4 };
                const turns = turnMap[skillLv] || 3;

                this.applyRandomDemonBuff(turns, isEnhanced, logHtml);

                // Check death after random buff
                if (enemy.hp <= 0) {
                    this.tickBuffs();
                    this.combatWin();
                    return;
                }

            } else {
                // Lv3+: Selectable (Show UI)
                const isEnhanced = (skillLv >= 4);
                const pickCount = (skillLv >= 6) ? 2 : 1;
                const turns = 4;

                this.updateLog(logHtml);

                // Call UI (Even if enemy holds 0 HP)
                window.UISystem.showDemonBuffSelection(skillLv, isEnhanced, pickCount, turns, (selectedBuffs) => {
                    // Callback when done
                    selectedBuffs.forEach(b => {
                        window.Player.extraBuffs.push(b);
                        this.updateLog(`<span style="color:#9c27b0;">✨ (自選) 獲得賜福: ${b.name} (${b.turns}回合)</span><br>`);
                    });

                    // [Check Death Here]
                    if (enemy.hp <= 0) {
                        this.tickBuffs();
                        this.combatWin();
                        return;
                    }

                    // Resume Turn Logic
                    this.endPlayerUltimateTurn(enemy, logHtml, isStun);
                });
                return; // Stop flow, wait for callback
            }

        } else if (player.class === 'scarecrow') {
            const dmgMap = { 1: 2.0, 2: 2.2, 3: 2.5, 4: 2.8, 5: 3.0, 6: 3.5 };
            const stunRateMap = { 1: 0.5, 2: 0.6, 3: 0.7, 4: 0.8, 5: 0.9, 6: 1.0 };
            const healRateMap = { 3: 0.10, 4: 0.20, 5: 0.30, 6: 0.50 };

            ultDmg = baseDmgCalc(dmgMap[skillLv] || 2.0);

            if (Math.random() < (stunRateMap[skillLv] || 0.5)) {
                isStun = true;
                logHtml += `🌾 [恐懼收割 Lv.${skillLv}] 成功恐懼了敵人！(暈眩)<br>`;

                // Heal on stun (Lv3+)
                if (skillLv >= 3) {
                    const healRate = healRateMap[skillLv] || 0.1;
                    const lostHp = player.maxHp - player.hp;
                    const heal = Math.floor(lostHp * healRate);
                    if (heal > 0) {
                        player.hp += heal;
                        logHtml += `<span style="color:#4caf50;">💚 吸收恐懼，回復 ${heal} 點生命！</span><br>`;
                    }
                }
            } else {
                logHtml += `🌾 [恐懼收割 Lv.${skillLv}] 造成傷害，但沒能恐懼敵人。<br>`;
            }

        } else if (player.class === 'ape' || player.class === 'monkey') {
            const dmgMap = { 1: 1.5, 2: 1.7, 3: 2.0, 4: 2.2, 5: 2.5, 6: 3.5 };
            const defMap = { 1: 10, 2: 15, 3: 20, 4: 25, 5: 30, 6: 35 };
            const turnMap = { 1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4 };

            ultDmg = baseDmgCalc(dmgMap[skillLv] || 1.5);
            // Lv6 Bonus Dmg if Def > 100
            if (skillLv >= 6) {
                const currentDef = window.Game.getDef(); // Use current def
                if (currentDef > 100) {
                    ultDmg += baseDmgCalc(1.0); // Extra 100%
                    logHtml += `🦍 <span style="color:#ff5722;">防禦超越極限！追加 100% 傷害！</span><br>`;
                }
            }

            logHtml += `🦍 [金剛重擊 Lv.${skillLv}] 原始的憤怒！<br>`;
            if (!player.extraBuffs) player.extraBuffs = [];
            player.extraBuffs.push({
                id: 'ape_defense',
                name: '金剛',
                def: defMap[skillLv] || 10,
                icon: '🦍',
                desc: `防禦力 +${defMap[skillLv]}`,
                turns: turnMap[skillLv] || 3,
                newThisTurn: true
            });
            logHtml += `<span style="color:#795548;">🛡️ 獲得金剛體魄 (+${defMap[skillLv]}防禦)</span><br>`;
        } else {
            ultDmg = Math.floor(baseAtk * 3 * critMult * fateMultiplier);
        }

        if (isCrit) logHtml += `<span style="color:#ffeb3b; font-weight:bold;">✨ 暴擊！！！</span><br>`;

        // Cultist (Lv3+) returns early, so if we are here, it's normal flow.
        enemy.hp -= ultDmg;
        window.Game.showFloatingText(ultDmg, "#e91e63");
        window.Game.triggerAnim('game-container', 'anim-screen-shake');
        logHtml += `終結技對 ${enemy.name} 造成 <span style="color:#e91e63; font-size:1.2em;">${ultDmg}</span> 點傷害！<br>`;

        if (enemy.hp <= 0) {
            this.tickBuffs();
            this.combatWin();
            return;
        }

        this.endPlayerUltimateTurn(enemy, logHtml, isStun);
    },

    /**
     * [New] Helper to finish turn (extracted for Cultist callback)
     */
    endPlayerUltimateTurn(enemy, logHtml, isStun) {
        // 4. 敵人回合
        if (isStun) {
            logHtml += `<span style="color:#ff9800;">🌀 敵人因為恐懼而無法動彈！(暈眩)</span><br>`;
        } else {
            const action = enemy.nextAction || { type: 'attack', val: 1.0 };
            if (action.type === 'defend') {
                logHtml += `🛡️ ${enemy.name} 採取了防禦姿態！<br>`;
            } else {
                const monsterAttack = this.executeMonsterAttack(enemy, action.val);
                logHtml += monsterAttack.log;
            }
        }

        // 5. 更新 Buff
        logHtml += this.applyBuffHealing();
        this.tickBuffs();
        this.generateEnemyIntent(enemy);
        const intentHtml = window.UISystem.getIntentHtml(enemy);
        window.Game.recalcStats();

        window.Game.renderEvent(
            `${intentHtml} 🔥 終結技爆發 - ${enemy.name}`,
            `敵方下次攻擊 將會造成 : ${this.calculateNextDamage(enemy)}`,
            logHtml,
            enemy.image || enemy.icon
        );
        this.updateEnemyHealthBar(enemy);

        // [Fix] 重置按鈕狀態 (確保 SP 不足時按鈕變灰，並更新逃跑率)
        const fleeRate = this.getFleeRate();
        const fleeText = `逃跑 (${Math.round(fleeRate * 100)}%)`;
        window.UISystem.setCombatButtons("戰鬥", "combatRound", fleeText, "flee", "playerDefend");

        window.Game.updateUI();
    },

    /**
     * [New] Random Demon Buff Helper
     */
    applyRandomDemonBuff(turns, isEnhanced, logHtmlRef) { // logHtmlRef is string, pass by val? No.
        // Can't mod string. Just push to extraBuffs.
        const buffs = window.CONFIG.buffs;
        let demonBuffs = Object.values(buffs).filter(b => b.type === 'demon');
        if (isEnhanced) {
            // If enhanced logic exists in future
        }

        if (demonBuffs.length > 0) {
            const buff = demonBuffs[Math.floor(Math.random() * demonBuffs.length)];
            const extraBuff = { ...buff, turns: turns, isExtra: true, newThisTurn: true };
            window.Player.extraBuffs.push(extraBuff);
            // Workaround: Use this.updateLog() if possible or just assume UI renders.
        }
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
        // [New] 確保戰鬥後刷新相關狀態
        // Evasion reset logic (mostly handled elsewhere but good to be safe if we add persistent evasion later).
        // For now, verify tickBuffs handles it.
        // If enemy evasion is a temporary buff, tickBuffs should handle its decrement/removal.
        // If it's a persistent state, it should be reset at the start/end of combat or round.
        // For now, no explicit enemy evasion reset is needed here as it's handled by buff system.
        window.Game.updateUI();

        logHtml += `<span class="block-text">🛡️ 你採取了防禦姿態！</span><br>`;
        logHtml += `<span class="buff-text">下回合攻擊力將提升 20%！</span><br>`;

        window.Game.triggerAnim('event-icon', 'anim-guard'); // 假設有這個動畫，或者用其他
        AudioSystem.playSFX('equip'); // 暫用裝備音效代替防禦音效

        // 2. 怪物回合 (根據意圖行動)
        const action = enemy.nextAction || { type: 'attack', val: 1.0 };

        if (action.type === 'defend') {
            logHtml += `🛡️ ${enemy.name} 也採取了防禦姿態！<br>`;
            logHtml += `<span style="color:#aaa;">雙方對峙，無事發生。</span><br>`;
        } else {
            // 怪物攻擊 (傷害減半由 executeMonsterAttack 處理)
            const monsterAttack = this.executeMonsterAttack(enemy, action.val);
            logHtml += monsterAttack.log;

            // [Fix] 若敵人逃跑 (Phase變為 event_end)，停止後續邏輯
            if (window.GameState.phase !== 'combat') {
                return;
            }
        }

        // 3. 消耗 Buff 回合
        logHtml += this.applyBuffHealing();
        this.tickBuffs();

        // [Fix] 必須刷新怪物下回合意圖，否則會卡在同一個動作
        this.generateEnemyIntent(enemy);

        // 3. 渲染結果
        const intentHtml = window.UISystem.getIntentHtml(enemy);

        window.Game.renderEvent(
            `${intentHtml} 🛡️ 防禦中 - ${enemy.name}`,
            `敵方下次攻擊 將會造成 : ${this.calculateNextDamage(enemy)}`,
            logHtml,
            enemy.image || enemy.icon
        );
        this.updateEnemyHealthBar(enemy);

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

        // --- [New] 檢查敵人閃避 (Evasion Check) ---
        // 敵人閃避率 (Evasion) + Buff 修正
        let enemyEvasion = enemy.evasion || 0;
        // 如果 enemy 有 Buff 提升閃避 (例如 Harpy Wing Storm)
        if (enemy.buffs && enemy.buffs['evasion_boost']) {
            enemyEvasion += 0.2;
        }

        if (Math.random() < enemyEvasion) {
            log += `<span class="evasion-text">💨 ${enemy.name} 閃避了你的攻擊！(Miss)</span><br>`;
            window.Game.showFloatingText("Miss", "#aaa");
            return { log, enemyDead: false };
        }

        // [Modified] 統一檢查 Buff 與 ExtraBuffs
        const hasBuff = (id) => {
            if (player.buff && player.buff.id === id) return true;
            if (player.extraBuffs && player.extraBuffs.some(b => b.id === id)) return true;
            return false;
        };

        // [FIX] 使用 getCrit() 獲取正確的爆擊率（包含 demon_enhance_plus 等邏輯）
        pCritRate = window.Game.getCrit() / 100; // getCrit() 返回百分比數值，需轉換為小數

        if (hasBuff('demon_wealth') || hasBuff('demon_wealth_plus')) {
            const gain = hasBuff('demon_wealth_plus') ? 100 : 5;
            player.gold += gain;
            window.Game.showFloatingText(`+${gain} G`, "gold");
            log += `<span class='demon-text'>[惡魔財富]</span> 獲得 ${gain} G<br>`;
        }

        // Destruction (Normal: 10%, 90% HP cost; Plus: 20%, 50% HP cost)
        const hasDestruction = hasBuff('demon_destruction');
        const hasDestructionPlus = hasBuff('demon_destruction_plus');

        if ((hasDestruction || hasDestructionPlus) && (enemy.tier !== 'boss' && !enemy.isGod && !enemy.isOldOne)) {
            const chance = hasDestructionPlus ? 0.66 : 0.1;
            if (Math.random() < chance) {
                enemy.hp = 0;
                let painRate = hasDestructionPlus ? 0.2 : 0.9;
                let pain = Math.floor(player.hp * painRate);
                player.hp = Math.max(1, player.hp - pain);
                window.Game.showFloatingText(`-${pain} HP`, "darkred");
                log += `<span class='demon-text'>[惡魔破壞${hasDestructionPlus ? ' (強)' : ''}]</span> 觸發秒殺！自身扣除 ${pain} HP。<br>`;
                return { log, enemyDead: true };
            }
        }

        // 惡魔的狂怒：攻擊力 +50% (攻擊加成見 getAtk)
        // Normal: 扣除 5% HP | Enhanced: 回復 5% HP
        if (hasBuff('demon_rage')) {
            let selfDmg = Math.max(1, Math.floor(player.hp * 0.05));
            player.hp -= selfDmg;
            window.Game.showFloatingText(`-${selfDmg} HP`, "darkred");
            log += `<span class='demon-text'>[惡魔狂怒]</span> 狂暴代價：扣除 ${selfDmg} HP<br>`;
        }
        if (hasBuff('demon_rage_plus')) {
            let heal = Math.floor(player.hp * 0.05);
            player.hp = Math.min(player.maxHp, player.hp + heal);
            window.Game.showFloatingText(`+${heal} HP`, "green");
            log += `<span class='demon-text'>[惡魔狂怒 (強)]</span> 噬血回復 ${heal} HP<br>`;
        }

        // 應用詞綴加成 (Game.modifiers)
        if (window.Game.modifiers && window.Game.modifiers.crit) {
            pCritRate += window.Game.modifiers.crit;
        }

        // --- [New] 命運之輪 (Wheel of Fortune) 處理 ---
        // 暴擊率歸0轉化為傷害倍率 (每 20% 暴率提升 1 倍傷害)
        const hasWheel = (player.equipment.accessories || []).some(acc => acc && acc.id === 'acc_wheel');
        if (hasWheel) {
            const wheelMult = 1.0 + Math.floor(pCritRate / 0.2); // 基礎 1.0 + 每20%多1倍
            pCritRate = 0; // 強制歸零
            pDmg = Math.floor(pDmg * wheelMult);
            log += `<span class='mythic-text'>[命運之輪]</span> 暴擊轉化！傷害 x${wheelMult}<br>`;
        }

        // 應用區域效果 (墓地: 恐懼)
        const biome = window.Game.getCurrentBiome();
        if (biome && biome.effect && biome.effect.type === 'fear') {
            pCritRate += (biome.effect.critMod / 100); // critMod 是 -10
        }

        // 飾品加成 (色慾: 首擊必暴)
        if (window.GameState.firstHit) {
            const hasLust = (player.equipment.accessories || []).some(acc => acc && acc.id === 'acc_lust');
            if (hasLust) {
                pCritRate = 1.0;
                log += `<span class='sin-text'>[色慾]</span> 首擊必定暴擊！<br>`;
            }
            window.GameState.firstHit = false;
        }

        let pCrit = Math.random() < pCritRate;
        if (pCrit) {
            pDmg *= 2;

            // --- [New] 盜賊 LV6 殘影疊加 ---
            if (window.Player.extraBuffs) {
                window.Player.extraBuffs.forEach(b => {
                    if (b.id === 'thief_evasion' && b.stackOnCrit) {
                        b.evasion += (b.stackVal || 15);
                        b.desc = `閃避率 +${b.evasion}% (暴擊疊加)`;
                        log += `<span style="color:#69f0ae;">💨 [殘影] 隨暴擊增強！閃避率提升至 ${b.evasion}%</span><br>`;
                    }
                });
            }
        }

        // --- [NEW] 七宗罪：暴怒 (Wrath) ---
        // 10% 機率造成兩次傷害 (這裡直接 x2 顯示)
        const hasWrath = (player.equipment.accessories || []).some(acc => acc && acc.id === 'acc_wrath');
        if (hasWrath && Math.random() < 0.1) {
            pDmg *= 2;
            log += `<span class='sin-text'>[暴怒]</span> 怒火攻心！傷害翻倍！<br>`;
        }

        // --- [New] 混沌魔方 / 超越魔方 (Random Multiplier) ---
        let randomMult = 1.0;
        let chaosLog = "";
        const hasChaos = (player.equipment.accessories || []).some(acc => acc && acc.id === 'acc_chaos');
        const hasTranscendence = (player.equipment.accessories || []).some(acc => acc && acc.id === 'acc_transcendence');

        if (hasChaos) {
            const roll = 0.5 + Math.random() * 2.5; // 0.5 ~ 3.0
            randomMult *= roll;
            chaosLog += `<span class='mythic-text'>[混沌]</span> x${roll.toFixed(1)} `;
        }
        if (hasTranscendence) {
            const roll = 1.0 + Math.random() * 4.0; // 1.0 ~ 5.0
            randomMult *= roll;
            chaosLog += `<span class='mythic-text'>[超越]</span> x${roll.toFixed(1)} `;
        }
        if (hasChaos || hasTranscendence) {
            pDmg = Math.floor(pDmg * randomMult);
            log += `${chaosLog}<br>`;
        }

        // --- [New] 諸神黃昏 (Ragnarok) 一擊必殺 ---
        if (player.equipment.weapon && player.equipment.weapon.id === 'w_ragnarok') {
            // 對 Boss 無效 (但舊日支配者例外？描述說對支配者與神無效，所以 God 和 OldOne 免疫)
            if (!enemy.isGod && !enemy.isOldOne && Math.random() < 0.05) {
                pDmg = enemy.hp + 99999;
                log += `<span class='mythic-text'>☄️ [諸神黃昏]</span> 觸發一擊必殺！<br>`;
            }
        }

        // 飾品加成 (Wyvern: 首領傷害)
        if (enemy.tier === 'boss' || enemy.isTrueForm) {
            let bossBonus = 0;
            (window.Player.equipment.accessories || []).forEach(acc => {
                if (!acc) return;
                if (acc.id === 'acc_wyv_1') bossBonus += 0.05;
                if (acc.id === 'acc_wyv_2') bossBonus += 0.08;
                if (acc.id === 'acc_wyv_3') bossBonus += 0.20;
            });
            if (bossBonus > 0) {
                pDmg = Math.floor(pDmg * (1 + bossBonus));
            }
        }

        enemy.hp -= pDmg;
        window.Game.triggerAnim('event-icon', 'anim-damage');
        window.Game.showFloatingText(pDmg, pCrit ? "red" : "white");
        AudioSystem.playSFX('attack');  // 攻擊音效

        log += `你對 ${enemy.name} 造成 ${pCrit ? "<span class='crit-text'>爆擊 " : ""}${pDmg}${pCrit ? "</span>" : ""} 點傷害。<br>`;

        // [New] 哥布林族長被攻擊 -> 掉錢 (金幣收藏家：受到攻擊時掉落 10-20G)
        // 舊邏輯：直接掉錢；新邏輯：已整合在 generateEnemyIntent 的狀態更新中 (當玩家金幣增加時 Boss HP 回復)
        // 但這裡攻擊並不會增加玩家金幣，除非我們讓攻擊掉錢？
        // 原始 markdown 沒有說被攻擊要掉錢。只說 "金幣收藏家" 被動會根據金幣變化調整血量。
        // 但如果我保留這個 "被打掉錢" 機制，會讓玩家金幣增加 -> Boss HP 增加。
        // 用戶文件中沒提到被打會掉錢。是否要移除？
        // 用戶提供的 combat.js 範例沒有 "updateGoblinKingStats" 和掉錢邏輯。
        // 所以我應該移除這段。


        // [New] 史萊姆之王干擾機制
        // 修正：只有在 "準備狀態" (slimeState > 0) 且有 prepareState 時才觸發
        if (enemy.name.includes("史萊姆之王") && enemy.slimeState > 0 && enemy.prepareState) {
            enemy.prepareState.reduction = (enemy.prepareState.reduction || 0) + 0.015; // 每次攻擊減少 1.5% 倍率
            log += `<span style="color:#2196f3;">💧 你干擾了史萊姆的分裂準備！(傷害降低 1.5%)</span><br>`;
        }

        // --- [New] 末世之鎧 (Apocalypse) ---
        // [吞噬生命] 攻擊時 1% 機率永久增加 100 點基礎生命"
        if (player.equipment.armor && player.equipment.armor.id === 'a_apocalypse') {
            if (Math.random() < 0.01) {
                player.baseHpBonus = (player.baseHpBonus || 0) + 100;
                log += `<span class='mythic-text'>🛡️ [末世之鎧]</span> 吞噬生命！永久生命 +100<br>`;
                window.Game.savePersistentData(); // 立即保存防止丟失
            }
        }

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
        const applyRageSelfDmg = () => {
            let selfDmg = Math.max(1, Math.floor(player.hp * 0.05));
            player.hp -= selfDmg;
            window.Game.showFloatingText(`-${selfDmg} HP`, "darkred");
            log += `<span class='demon-text'>[惡魔狂怒]</span> 狂暴代價：扣除 ${selfDmg} HP<br>`;
        };

        if (player.buff && player.buff.id === 'demon_rage') {
            applyRageSelfDmg();
        }
        if (player.extraBuffs) {
            player.extraBuffs.forEach(b => {
                if (b.id === 'demon_rage') applyRageSelfDmg();
            });
        }

        // 飾品加成 (暴食: 攻擊回血 10%)
        const hasGluttony = (player.equipment.accessories || []).some(acc => acc && acc.id === 'acc_gluttony');
        if (hasGluttony) {
            const heal = Math.floor(player.maxHp * 0.1);
            player.hp = Math.min(player.maxHp, player.hp + heal);
            window.Game.showFloatingText(`+${heal}`, "#69f0ae");
            log += `<span class='sin-text'>[暴食]</span> 吞噬生命！恢復 ${heal} HP<br>`;
        }

        // 飾品加成 (嫉妒: 10% 機率完全恢復)
        const hasEnvy = (player.equipment.accessories || []).some(acc => acc && acc.id === 'acc_envy');
        if (hasEnvy && Math.random() < 0.1) {
            const heal = player.maxHp - player.hp;
            if (heal > 0) {
                player.hp = player.maxHp;
                window.Game.showFloatingText("FULL", "gold");
                log += `<span class='sin-text'>[嫉妒]</span> 瘋狂的嫉妒心！生命值完全恢復！<br>`;
            }
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

        // [New] 史萊姆之王預覽
        if (enemy.name.includes("史萊姆之王")) {
            if (enemy.nextAction.type === 'prepare') {
                return "⚠️ 準備中...";
            }
            if (enemy.nextAction.name === 'ExplosiveSplit') {
                // 預估傷害：CurrentHP * (5% - reduction)
                let percent = 0.05;
                if (enemy.prepareState && enemy.prepareState.reduction) {
                    percent = Math.max(0.01, percent - enemy.prepareState.reduction);
                }
                // [Fix] 用戶要求：基於 Boss 當前 HP
                const splitDmg = Math.floor(enemy.hp * percent);
                return `${splitDmg} (爆炸)`;
            }
        }

        return dmg;
    },

    executeMonsterAttack(enemy, multiplier = 1.0) {
        let log = "";
        const player = window.Player;

        // --- [New] 紅布 (Red Cloth) 牛頭人免疫 ---
        const isBull = enemy.name.includes("牛頭");
        const hasRedCloth = (player.equipment.accessories || []).some(acc => acc && acc.id === 'acc_red_cloth');
        if (isBull && hasRedCloth) {
            window.Game.showFloatingText("MISS", "orange");
            return { log: `<span class='mythic-text'>[紅布]</span> 完美閃避了牛頭人的攻擊！<br>` };
        }

        // --- [New] 虛空行者斗篷 (Voidwalker) 絕對迴避 ---
        if (player.equipment.armor && player.equipment.armor.id === 'a_voidwalker') {
            if (Math.random() < 0.1) {
                window.Game.showFloatingText("MISS", "#00bcd4");
                window.Game.triggerAnim('game-container', 'anim-lunge'); // 借用動畫
                return { log: `<span class='mythic-text'>[虛空行者]</span> 你的身影隱入虛空，躲過了攻擊。<br>` };
            }
        }

        // --- [New] 魔神之壁 (Demon Wall) 絕對防禦 ---
        if (window.GameState.demonWallCharges > 0) {
            // 史萊姆爆炸不可防禦? 假設可防禦
            window.GameState.demonWallCharges--;
            window.Game.showFloatingText("BLOCK", "#795548");
            AudioSystem.playSFX('equip'); // 金屬音效
            return { log: `<span class='mythic-text'>[魔神之壁]</span> 絕對防禦擋下了攻擊 (剩餘 ${window.GameState.demonWallCharges} 層)<br>` };
        }

        // [New] 史萊姆之王 準備階段無動作
        if (enemy.nextAction && enemy.nextAction.type === 'prepare') {
            log += `<span style="color:orange; font-weight:bold;">⚠️ ${enemy.name} 正在積蓄力量...</span><br>`;
            return { log };
        }

        // --- [New] 哈比特殊技能效果 ---
        if (enemy.nextAction && enemy.nextAction.type === 'prepare_flee') {
            // 逃跑預告
            log += `<span class="damage-text" style="color:orange; font-weight:bold;">💨 ${enemy.name} 看著滿滿的錢袋，準備要逃跑了！!</span><br>`;
            return { log };
        }

        if (enemy.nextAction && enemy.nextAction.type === 'flee') {
            // 執行逃跑
            window.Game.showFloatingText("Bye!", "#aaa");
            // 結束戰鬥 (特殊結束：哈比逃跑)
            window.GameState.phase = "event_end";
            window.CombatSystem.hideEnemyHealthBar();
            window.Game.renderEvent(
                "💨 哈比飛走了",
                "哈比搶夠了錢，心滿意足地飛走了...",
                `你只能眼睜睜看著她帶著你的金幣離開。<br>(損失 ${window.GameState.stolenGold || 0} G)`,
                "🦅"
            );
            window.Game.setButtons("繼續", "nextEvent", "無", null, true);
            // 清除被偷金幣記錄 (因為沒拿回來)
            window.GameState.stolenGold = 0;
            return { log: "哈比逃跑了！", enemyDead: false };
        }

        if (enemy.nextAction && enemy.nextAction.type === 'skill') {
            if (enemy.nextAction.name === 'WingStorm') {
                // 風暴之翼: 提升閃避
                if (!enemy.buffs) enemy.buffs = {};
                enemy.buffs['evasion_boost'] = true; // 簡單標記，這裡不做計時，假設是持續性或透過其他方式清除
                // 若要計時，需引入 enemy buff 系統，這裡簡化為永久或持續一回合
                // 修正：依照設計 "提升閃避 20% 持續 3 回合"
                // 由於缺乏敵方 Buff 系統，這裡簡化為：
                // 1. 如果已有 evasion，則疊加 (不疊加也行)
                log += `<span class="skill-text">🌪️ ${enemy.name} 使用了「風暴之翼」！閃避率提升了！</span><br>`;
                // 我們在 evasion check 那邊已經寫了：if (enemy.buffs['evasion_boost']) evasion += 0.2
            } else if (enemy.nextAction.name === 'Plunder') {
                // 掠奪一空: 擴充偷竊 (金幣/道具)
                const stolenLog = this.stealPlayerItem();
                if (stolenLog) {
                    // 增加掠奪計數
                    enemy.plunderCount = (enemy.plunderCount || 0) + 1;
                    log += `<span class="skill-text">💰 ${enemy.name} 使用了「掠奪一空」！(第 ${enemy.plunderCount} 次)<br>${stolenLog}</span><br>`;
                } else {
                    log += `<span class="skill-text">💰 ${enemy.name} 試圖掠奪，但你已經一無所有了！</span><br>`;
                }
            } else if (enemy.nextAction.name === 'PoisonCoating') {
                // 哥布林族長: 劇毒塗藥 (改為給玩家 Debuff)
                if (!window.Player.extraBuffs) window.Player.extraBuffs = [];
                const existingCoating = window.Player.extraBuffs.find(b => b.id === 'goblin_poison_coating');
                if (existingCoating) {
                    existingCoating.turns = 3;
                    log += `<span class="debuff-text">🧪 [劇毒塗藥] 效果刷新！(持續 3 回合)</span><br>`;
                } else {
                    window.Player.extraBuffs.push({
                        id: 'goblin_poison_coating',
                        name: '劇毒塗藥',
                        icon: '🧪',
                        desc: '每回合 80% 機率中毒',
                        turns: 3,
                        newThisTurn: true,
                        type: 'debuff'
                    });
                    log += `<span class="debuff-text">🧪 你被施加了「劇毒塗藥」！(每回合 80% 機率中毒)</span><br>`;
                }
            } else if (enemy.nextAction.name === 'CovetWealth') {
                // 哥布林族長: 覬覦財富
                // 1. 偷取 15% 當前金幣
                const playerGold = window.Player.gold || 0;
                let stolen = Math.floor(playerGold * 0.15);
                if (stolen > playerGold) stolen = playerGold;

                // 2. 造成傷害 = 10 + (偷取金額 / 2)
                let dmg = 10 + Math.floor(stolen / 2);
                if (dmg < 1) dmg = 1;

                window.Player.gold -= stolen;
                window.Player.hp -= dmg;
                window.GameState.stolenGold = (window.GameState.stolenGold || 0) + stolen;

                window.Game.showFloatingText(`-${dmg}`, "red");
                window.Game.showFloatingText(`-${stolen} G`, "gold");

                // 3. [New] 因為BOSS專心於金幣，所以受到 "被偷取的金幣量" 的傷害
                enemy.hp = Math.max(0, enemy.hp - stolen);
                window.Game.showFloatingText(`-${stolen}`, "red");
                window.Game.triggerAnim('game-container', 'anim-screen-shake');

                log += `<span class="skill-text" style="color:gold;">💰 ${enemy.name} 覬覦你的財富！偷走 ${stolen} G 並造成 ${dmg} 點傷害！<br>但它因分心而受到了 ${stolen} 點傷害！</span><br>`;
                return { log };

            } else if (enemy.nextAction.name === 'SlimeSpray') {
                // [New] 史萊姆噴灑 (CD 6)
                // 1. 造成 10 點傷害
                const dmg = 10;
                window.Player.hp -= dmg;
                window.Game.showFloatingText(`-${dmg}`, "red");

                // 2. 施加「黏黏的」 Debuff (持續 5 回合)
                // 每回合扣除 10 HP，30% 機率使玩家「被困住」
                if (!window.Player.extraBuffs) window.Player.extraBuffs = [];
                window.Player.extraBuffs.push({
                    id: 'slime_sticky',
                    name: '黏黏的',
                    icon: '💧',
                    desc: '每回合 -10 HP，30% 機率無法行動',
                    turns: 5,
                    newThisTurn: true
                });

                // 被動：每次施放技能回復 100 HP
                enemy.hp = Math.min(enemy.maxHp, enemy.hp + 100);
                window.Game.showFloatingText(`+100 HP`, "green");

                log += `<span class="skill-text">💧 ${enemy.name} 噴灑黏液！造成 ${dmg} 傷害並施加黏著！(被動回復 100 HP)</span><br>`;

            } else if (enemy.nextAction.name === 'ExplosiveSplit') {
                // [New] 史萊姆爆炸分裂 (CD 6)
                // 傷害：Boss 當前 HP 的 8%
                let percent = 0.08;
                if (enemy.prepareState && enemy.prepareState.reduction) {
                    percent = Math.max(0.0, percent - enemy.prepareState.reduction);
                }
                const dmg = Math.floor(enemy.hp * percent);
                window.Player.hp -= dmg;
                window.Game.showFloatingText(`-${dmg}`, "red");

                // 被動：每次施放技能回復 100 HP
                enemy.hp = Math.min(enemy.maxHp, enemy.hp + 100);
                window.Game.showFloatingText(`+100 HP`, "green");

                log += `<span class="skill-text" style="color:red; font-size:1.2em;">💥 ${enemy.name} 爆炸分裂！造成 ${dmg} 點鉅額傷害！(被動回復 100 HP)</span><br>`;
            }
        }

        // 根據意圖倍率調整傷害
        let dmg = Math.floor(enemy.atk * multiplier);

        // --- [New] 檢查玩家閃避 (Player Evasion Check) ---
        let playerEvasion = window.Game.getEvasion();

        if (Math.random() * 100 < playerEvasion) {
            window.Game.showFloatingText("Miss", "#aaa");
            return { log: `💨 你閃避了 ${enemy.name} 的攻擊！<br>` };
        }

        // --- [New] 敵人爆擊率檢查 (demon_enhance / demon_enhance_plus) ---
        let enemyCritRate = 0.05; // 基礎 5%
        const hasBuff = (id) => {
            if (player.buff && player.buff.id === id) return true;
            if (player.extraBuffs && player.extraBuffs.some(b => b.id === id)) return true;
            return false;
        };

        if (hasBuff('demon_enhance')) {
            enemyCritRate = 0.5; // 惡魔的強化: 雙方爆擊率固定 50%
        } else if (hasBuff('demon_enhance_plus')) {
            enemyCritRate += 0.4; // 強化版: +40%
        }

        if (Math.random() < enemyCritRate) {
            dmg *= 2;
            log += `<span class='damage-text'>💥 ${enemy.name} 爆擊了！</span><br>`;
        }

        // --- [New] 虛空之鏡 (Void Mirror) 視線折射 ---
        // 免疫暴擊 (重擊倍率強制歸 1.0)
        if (window.Player.equipment.shield && window.Player.equipment.shield.id === 'shield_void') {
            if (multiplier > 1.0) {
                dmg = Math.floor(enemy.atk * 1.0); // Reset to normal dmg
                // log += `<span class='mythic-text'>[虛空之鏡]</span> 折射了重擊！<br>`; // Optional log
            }
        }

        // --- [NEW] 七宗罪：傲慢 (Pride) ---
        // 攻擊力已翻倍，但受到的傷害 +50%
        const hasPride = (window.Player.equipment.accessories || []).some(acc => acc && acc.id === 'acc_pride');
        if (hasPride) {
            dmg = Math.floor(dmg * 1.5);
            // log += `<span class='sin-text'>[傲慢]</span> 代價：傷害增加<br>`; // 戰鬥資訊太擠，暫不顯示
        }

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

        // 飾品加成 (Skeleton: 減傷)
        // acc_skel_1: 5% (不含暴擊 - 這裡假設所有傷害都減)
        // acc_skel_2: 10%
        // acc_skel_3: 15% (含暴擊 - 這裡統一處理)
        let dmgReduction = 0;
        (window.Player.equipment.accessories || []).forEach(acc => {
            if (!acc) return;
            if (acc.id === 'acc_skel_1') dmgReduction += 0.05;
            if (acc.id === 'acc_skel_2') dmgReduction += 0.10;
            if (acc.id === 'acc_skel_3') dmgReduction += 0.15;
        });
        if (dmgReduction > 0) {
            dmg = Math.floor(dmg * (1 - dmgReduction));
        }

        const minDmg = 1;
        dmg = Math.max(minDmg, dmg);

        window.Game.triggerAnim('event-icon', 'anim-lunge');

        if (dmg > 0) {
            window.Player.hp -= dmg;
            window.Game.showFloatingText(`-${dmg} HP`, "red");
            window.Game.triggerAnim('game-container', 'anim-screen-shake');

            let typeText = multiplier > 1.0 ? "重擊" : "攻擊";
            // 虛空之鏡: 重擊已被無效化，顯示為普通攻擊
            if (window.Player.equipment.shield && window.Player.equipment.shield.id === 'shield_void' && multiplier > 1.0) {
                typeText = "攻擊 (重擊無效)";
            }
            log += `${enemy.name} 對你使用了 <span class='damage-text'>${typeText}</span>，造成 ${dmg} 點傷害。<br>`;

            // --- [New] 虛空之鏡 (Void Mirror) 傷害反彈 ---
            if (window.Player.equipment.shield && window.Player.equipment.shield.id === 'shield_void') {
                const reflectDmg = Math.floor(dmg * 0.5);
                if (reflectDmg > 0) {
                    enemy.hp -= reflectDmg;
                    window.Game.showFloatingText(`Reflect ${reflectDmg}`, "#00bcd4");
                    window.Game.triggerAnim('event-icon', 'anim-damage');
                    log += `<span class='mythic-text'>[虛空之鏡]</span> 反彈了 ${reflectDmg} 點傷害！<br>`;
                }
            }
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


        // [New] 弒神者特殊處理
        if (enemy.isGod) {
            const hourglass = { ...CONFIG.specialItems.hourglass };
            window.ItemSystem.addItemToInventory(hourglass);

            // [NEW] 莉莉絲戀愛成就判定
            let extraText = "";
            let winTitle = "🏆 弒神者";

            if (window.Player.lilithBlessing && !window.Player.lilithSacrificed) {
                // 獲得戀愛成就 (莉莉絲生存)
                window.Player.lilithBlessing = false; // 移除狀態，但成就已達成
                extraText += "<br><span style='color:#ff00ff; font-weight:bold;'>💗 莉莉絲的愛：她微笑著留在了你身邊。</span>";
                winTitle = "💗 救贖者";
            } else if (window.Player.lilithSacrificed) {
                // 獲得勝利成就 (莉莉絲犧牲)
                extraText += "<br><span style='color:#ff0000; font-weight:bold;'>💔 魅魔的勝利：她化作光芒消散了...</span>";
            }

            window.Game.renderEvent(winTitle, "你擊敗了神之代行者！",
                `獲得了傳說中的神器：<span class='rarity-mythic'>輪迴沙漏</span>${extraText}<br>這似乎能讓你掌控時間...`,
                "⏳");

            window.Game.checkAchievements();
            window.UISystem.hideCombatButtons();
            window.Game.setButtons("繼續", "nextEvent", "無", null, true);
            window.Game.updateUI();

            // 重置臨時加成
            if (window.GameState.tempBonus) {
                window.GameState.tempBonus = null;
            }
            return;
        }



        // [New] 舊日支配者特殊處理
        if (enemy.isOldOne) {
            const unspeakable = { name: "不可名狀之物", type: "material", rarity: "mythic", price: 99999, icon: "👾", desc: "來自舊日支配者的殘骸，散發著令人瘋狂的氣息。" };
            window.ItemSystem.addItemToInventory(unspeakable);
            window.Game.renderEvent("👑 弒神者", "你擊敗了舊日支配者！", "甚至連恐懼本身也對你感到恐懼...<br>獲得：<span class='rarity-mythic'>不可名狀之物</span>", "🐙");
            window.Game.checkAchievements();
            window.UISystem.hideCombatButtons();
            window.Game.setButtons("繼續", "nextEvent", "無", null, true);
            window.Game.updateUI();
            // 重置臨時加成
            if (window.GameState.tempBonus) window.GameState.tempBonus = null;
            return;
        }

        // [MOD] 檢查是否為強制 BOSS 層 (500, 1000, 1500...)
        // 如果是，戰鬥勝利後將按鈕導向中間層 (結算 -> 撤離點)
        let isExtractionBoss = false;
        if (enemy.tier === 'boss' && !window.Player.inInferno) {
            const d = window.Player.depth;
            // 檢查是否是 500 層或 1000+ 的每 500 層，或是新 Boss 層 (50, 100)
            if (d === 50 || d === 100 || d === 500 || (d >= 1000 && (d - 1000) % 500 === 0)) {
                isExtractionBoss = true;
            }
        }

        // --- [New] 擊殺怪物獲得 EP (含層數加成) ---
        // [MOD] 煉獄模式移除 EP 獲取 (使用者要求)
        let totalEp = 0;
        let depthBonus = 0;

        if (!window.Player.inInferno) {
            let baseEp = 1;
            if (enemy.tier === 'elite') baseEp = 3;
            if (enemy.tier === 'boss') baseEp = 10;

            // 層數加成：每 50 層額外 +1 EP
            depthBonus = Math.floor(window.Player.depth / 50);
            totalEp = baseEp + depthBonus;

            // [Refactor] EP 暫存機制 (當局累計)
            // 只有撤離時獲得 100%，死亡/放棄獲得 50%
            window.Player.epGainedThisRun = (window.Player.epGainedThisRun || 0) + totalEp;

            // EP 獲得浮動文字 (黃色)
            let epText = `+${totalEp} EP`;
            if (depthBonus > 0) {
                epText += ` (加成 +${depthBonus})`;
            }
            window.Game.showFloatingText(epText, "#ffeb3b");
        }


        const drops = this.calculateDrops(enemy);
        const dropText = this.processDrops(enemy, drops);

        const winTitle = enemy.isTrueForm ? "👑 弒神者" : "🏆 戰鬥勝利";
        const winMsg = enemy.isTrueForm ? "你擊敗了魔王真身，傳說將永遠流傳！" : "你擊敗了敵人！";

        // --- [New] 擊殺成長型裝備 ---
        let growthLog = "";

        // 牛頭人戰斧: [嗜血成長] 擊殺敵人時 1% 機率永久提升 3% 基礎暴擊率
        // 注意：目前 js/game.js 中 getCrit 需要讀取 mythicCritBonus
        if (window.Player.equipment.weapon && window.Player.equipment.weapon.id === 'w_minotaur') {
            if (Math.random() < 0.01) {
                window.Player.mythicCritBonus = (window.Player.mythicCritBonus || 0) + 3;
                growthLog += `<br><span class='mythic-text'>🪓 [牛頭人戰斧]</span> 嗜血成長！永久暴擊率 +3%`;
                window.Game.savePersistentData();
            }
        }

        // 虛空破滅劍: [靈魂吞噬] 擊殺敵人時 10% 機率永久增加 100 點基礎攻擊力
        if (window.Player.equipment.weapon && window.Player.equipment.weapon.id === 'w_void_breaker') {
            if (Math.random() < 0.10) {
                window.Player.baseAtkBonus = (window.Player.baseAtkBonus || 0) + 100;
                growthLog += `<br><span class='mythic-text'>🌌 [虛空破滅劍]</span> 靈魂吞噬！永久攻擊 +100`;
                window.Game.savePersistentData();
            }
        }

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

        // [Fix] 將 EP 獲得顯示在結算面板 (移至掉落物上方)
        let epLog = `<br><span style="color:#ffeb3b; font-weight:bold;">✨ 獲得 ${totalEp} EP</span>`;
        if (depthBonus > 0) epLog += `<span style="font-size:0.8em; color:#aaa;"> (含層數加成 +${depthBonus})</span>`;

        // 調整顯示順序: EP -> 掉落物/金幣 -> 其他
        window.Game.renderEvent(winTitle, winMsg, epLog + (dropText || "沒有掉落任何物品。") + regenLog + growthLog, "🎉");
        document.getElementById('event-icon').className = "monster-icon";

        window.Game.checkAchievements();
        window.UISystem.hideCombatButtons(); // 隱藏防禦按鈕

        // 設置按鈕
        if (isExtractionBoss) {
            // [NEW] Boss 勝利後 -> 進入撤離點事件 (中途頁面)
            // 先顯示 "繼續"，點擊後進入 "handleBossVictoryExtraction"
            window.Game.setButtons("繼續", "handleBossVictoryExtraction", "無", null, true);
        } else {
            // 一般勝利 -> 下一事件
            window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        }

        window.Game.updateUI();

        // 重置臨時加成
        if (window.GameState.tempBonus) {
            window.GameState.tempBonus = null;
        }
    },

    /**
     * [New] 處理 Boss 勝利後的撤離點流程
     */
    handleBossVictoryExtraction() {
        window.Game.renderEvent(
            "📍 安全撤離點",
            "你在 Boss 的巢穴後方發現了一條隱密的通道...",
            "這裡看起來很安全。你可以選擇帶著戰利品榮耀回歸，或者繼續深入險境。",
            "🚁"
        );
        // 按鈕：撤離 (觸發確認框)、繼續冒險 (下一層)
        window.Game.setButtons("撤離", "triggerExtraction", "繼續冒險", "nextEvent", true);
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

        // 應用臨時加成 (危險路徑 / 幸運護符)
        if (window.GameState.tempBonus && window.GameState.tempBonus.drop) {
            normalDropRate += window.GameState.tempBonus.drop; // 改為加法 (+20%)
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
        if (window.GameState.tempBonus && window.GameState.tempBonus.drop) {
            specialDropRate += window.GameState.tempBonus.drop;
        }
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
        // [Fix] 哥布林族長與史萊姆之王使用固定金幣，不套用階級倍率
        const fixedBosses = ["哥布林族長", "史萊姆之王"];
        if (!fixedBosses.some(name => enemy.name.includes(name))) {
            if (enemy.tier === "elite") gold *= 2;
            if (enemy.tier === "boss") gold *= 5;
        }

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
            const baseGold = gold; // 記錄基礎金幣

            // 應用詞綴加成 (Greed: 之貪婪)
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

            // [New] 補償哈比偷走的錢 (如果戰鬥勝利，則歸還)
            if (window.GameState.stolenGold > 0) {
                gold += window.GameState.stolenGold;
                log += `<span class='gold-text'>奪回了被偷走的 ${window.GameState.stolenGold} G！</span><br>`;
                window.GameState.stolenGold = 0;
            }

            // 飾品加成 (Goblin: 金幣)
            let goldBonus = 0;
            (window.Player.equipment.accessories || []).forEach(acc => {
                if (!acc) return;
                if (acc.id === 'acc_gob_1') goldBonus += 0.05;
                if (acc.id === 'acc_gob_2') goldBonus += 0.10;
                if (acc.id === 'acc_gob_3') goldBonus += 0.20;
            });
            if (goldBonus > 0) {
                gold = Math.floor(gold * (1 + goldBonus));
            }

            // 應用符文加成 (貪婪之手)
            if (window.Player.unlockedRunes && window.Player.unlockedRunes.includes('passive_gold')) {
                const bonus = CONFIG.runes.passive_gold.effect.val; // 0.5
                gold = Math.floor(gold * (1 + bonus));
            }

            // 飾品加成 (貪婪: 金幣 +100%)
            const hasGreed = (window.Player.equipment.accessories || []).some(acc => acc && acc.id === 'acc_greed');
            if (hasGreed) {
                gold *= 2;
                log += `<span class='sin-text'>[貪婪]</span> 金幣獲取翻倍！<br>`;
            }

            window.Player.gold += gold;

            // 計算加成金幣
            const bonusGold = gold - baseGold;

            // 顯示浮動文字和日誌
            if (bonusGold > 0) {
                window.Game.showFloatingText(`+${gold} G (+${bonusGold})`, "gold");
                log += `<p><span class="gold-text">獲得 ${gold} 金幣 <span style="color:#ffd700; font-size:0.9em;">(+${bonusGold} 加成)</span></span></p>`;
            } else {
                window.Game.showFloatingText(`+${gold} G`, "gold");
                log += `<p><span class="gold-text">獲得 ${gold} 金幣</span></p>`;
            }

            AudioSystem.playSFX('coin');  // 獲得金幣音效
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
            if (player.buff.id === 'angel_wings') fleeRate += 0.15;
        }

        // Check Wager (Normal or Plus) in Buff or ExtraBuffs
        const hasWager = (player.buff && player.buff.id === 'demon_wager') ||
            (player.extraBuffs && player.extraBuffs.some(b => b.id === 'demon_wager'));
        const hasWagerPlus = (player.buff && player.buff.id === 'demon_wager_plus') ||
            (player.extraBuffs && player.extraBuffs.some(b => b.id === 'demon_wager_plus'));

        if (hasWager || hasWagerPlus) {
            fleeRate = 0.8; // Both grant 80% Flee Rate
        }

        // 應用詞綴加成 (Game.modifiers.flee)
        if (window.Game.modifiers && window.Game.modifiers.flee) {
            fleeRate += window.Game.modifiers.flee;
        }

        // 飾品加成 (Ghost: 逃跑率)
        (window.Player.equipment.accessories || []).forEach(acc => {
            if (!acc) return;
            if (acc.id === 'acc_ghost_1') fleeRate += 0.02;
            if (acc.id === 'acc_ghost_2') fleeRate += 0.05;
            if (acc.id === 'acc_ghost_3') fleeRate += 0.10;
        });

        // 區域效果 (墓地: 恐懼)
        const biome = window.Game.getCurrentBiome();
        if (biome && biome.effect && biome.effect.type === 'fear') {
            fleeRate += biome.effect.fleeMod; // fleeMod 是 -0.2
        }

        // [New] 哈比威脅 (逃跑率 -40%)
        if (window.GameState.harpyThreat) {
            fleeRate -= 0.40;
        }

        return Math.min(1.0, Math.max(0, fleeRate));
    },

    flee() {
        const player = window.Player;

        // 惡魔賭約：先檢查死亡風險 (Normal Only)
        // Enhanced: 10% chance to gain +10 Atk
        const hasWager = (player.buff && player.buff.id === 'demon_wager') || (player.extraBuffs && player.extraBuffs.some(b => b.id === 'demon_wager'));
        const hasWagerPlus = (player.extraBuffs && player.extraBuffs.some(b => b.id === 'demon_wager_plus'));

        if (hasWager) {
            if (Math.random() < 0.01) {
                player.hp = 0;
                window.Game.playerDie("死於惡魔賭約");
                return;
            }
        }
        if (hasWagerPlus) {
            if (Math.random() < 0.10) {
                player.baseAtkBonus = (player.baseAtkBonus || 0) + 10;
                window.Game.showFloatingText("+10 Atk", "gold");
                window.Game.log(`<span class='demon-text'>[惡魔賭約 (強)]</span> 贏得賭局！永久攻擊力 +10`);
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

            // [FIX] 逃跑成功也消耗回合數
            this.tickBuffs();

            window.Game.renderEvent("🏃 逃跑成功", "你成功逃離了戰鬥！", "深呼吸，繼續前進。", "💨");
            document.getElementById('event-icon').className = "monster-icon";
            window.UISystem.hideCombatButtons(); // 隱藏防禦按鈕
            window.Game.setButtons("繼續", "nextEvent", "無", null, true);
        } else {
            AudioSystem.playSFX('damage');  // 逃跑失敗受傷音效
            let dmg = enemy.atk;

            // 計算防禦減傷 (最低傷害機制)
            // 計算防禦減傷 (最低傷害機制)
            const def = window.Game.getDef();
            const minDmg = Math.max(1, Math.floor(enemy.atk * 0.1));
            dmg = Math.max(minDmg, dmg - def);

            // --- [NEW] 七宗罪：怠惰 (Sloth) ---
            // 逃跑失敗時受到的傷害減少 50%
            const hasSloth = (window.Player.equipment.accessories || []).some(acc => acc && acc.id === 'acc_sloth');
            if (hasSloth) {
                dmg = Math.floor(dmg * 0.5);
                window.Game.showFloatingText("Sloth", "#90a4ae");
            }

            window.Game.triggerAnim('event-icon', 'anim-lunge');

            if (dmg > 0) {
                player.hp -= dmg;
                window.Game.showFloatingText(`-${dmg} HP`, "red");
                window.Game.triggerAnim('game-container', 'anim-screen-shake');

                let msg = `受到 <span class='damage-text'>${dmg} 點傷害</span>。`;

                // [Modified] Check demon_wealth (Normal/Plus)
                const hasWealth = hasBuff('demon_wealth');
                const hasWealthPlus = hasBuff('demon_wealth_plus');

                if ((hasWealth || hasWealthPlus) && player.gold >= 5) {
                    player.gold -= 5; // Penalty remains 5G
                    window.Game.showFloatingText("-5 G", "red");
                    log += `<br><span class='demon-text'>[惡魔財富]</span> 損失 5 G`;
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

                // [New] 哈比逃跑失敗懲罰：偷竊
                if (window.GameState.harpyThreat) {
                    const stolenLog = this.stealPlayerItem();
                    if (stolenLog) {
                        window.Game.log(`<span style="color:orange; font-weight:bold;">${enemy.name} 趁你逃跑失敗時偷走了東西！</span>`);
                        window.Game.log(stolenLog);
                    }
                }

                this.tickBuffs(); // 逃跑失敗消耗回合
                const fleeRate = this.getFleeRate();
                const fleeText = `逃跑 (${Math.round(fleeRate * 100)}%)`;
                window.UISystem.setCombatButtons("戰鬥", "combatRound", fleeText, "flee", "playerDefend");
                window.Game.updateUI();
            }
        }
    },

    /**
     * [New] 偷取玩家物品 (金幣/消耗品/素材/未裝備)
     */
    stealPlayerItem() {
        const player = window.Player;
        const validTargets = [];

        // 1. 金幣
        if (player.gold > 0) validTargets.push('gold');
        // 2. 消耗品
        if (player.inventory.consumable.length > 0) validTargets.push('consumable');
        // 3. 素材
        if (player.inventory.material.length > 0) validTargets.push('material');
        // 4. 未裝備裝備 (武器/防具/盾牌)
        if (player.inventory.equipment.length > 0) validTargets.push('equipment');
        // 5. 未裝備飾品
        if (player.inventory.accessories && player.inventory.accessories.length > 0) validTargets.push('accessory');

        if (validTargets.length === 0) return null;

        const targetType = validTargets[Math.floor(Math.random() * validTargets.length)];
        let log = "";

        // 確保 stolenItems 初始化
        if (!window.GameState.stolenItems) window.GameState.stolenItems = [];

        if (targetType === 'gold') {
            const stealAmount = Math.floor(50 + Math.random() * 50); // 50-100 G
            const actualSteal = Math.min(player.gold, stealAmount);
            player.gold -= actualSteal;
            window.GameState.stolenGold = (window.GameState.stolenGold || 0) + actualSteal; // 舊有邏輯保留 (顯示用)

            // 記錄到物品陣列以便統一歸還
            // 這裡我們直接記錄 type: 'gold', val: amount
            // 但為了與物品統一，我們暫時只用 stolenGold 處理金幣歸還
            // 或者我們可以把 gold 也放入 stolenItems 統一處理?
            // 為了相容現有代碼，金幣繼續用 stolenGold，此處僅處理物品

            window.Game.showFloatingText(`-${actualSteal} G`, "yellow");
            log = `被搶走了 <span class="gold-text">${actualSteal} G</span>`;

        } else if (targetType === 'consumable' || targetType === 'material') {
            const list = player.inventory[targetType];
            const index = Math.floor(Math.random() * list.length);
            const item = list[index];

            // 移除一個
            // 如果是有數量的? 目前系統 material 是物件陣列，沒有 distinct count property (除非是堆疊邏輯)
            // 假設 inventory 是 [...items]，每個 item 是獨立物件
            // 檢查 Game 邏輯，inventory.material push 是一整包物件
            // 所以 splice 1 即可

            const stolenItem = list.splice(index, 1)[0];
            window.GameState.stolenItems.push({ type: targetType, item: stolenItem });

            window.Game.showFloatingText(`Loss: ${stolenItem.name}`, "orange");
            log = `被搶走了 <span class="rarity-${stolenItem.rarity || 'common'}">${stolenItem.name}</span>`;

        } else if (targetType === 'equipment') {
            const list = player.inventory.equipment;
            const index = Math.floor(Math.random() * list.length);
            const item = list.splice(index, 1)[0];
            window.GameState.stolenItems.push({ type: 'equipment', item: item });

            window.Game.showFloatingText(`Loss: ${item.name}`, "orange");
            log = `被搶走了 <span class="rarity-${item.rarity || 'common'}">${item.name}</span>`;

        } else if (targetType === 'accessory') {
            const list = player.inventory.accessories;
            const index = Math.floor(Math.random() * list.length);
            const item = list.splice(index, 1)[0];
            window.GameState.stolenItems.push({ type: 'accessory', item: item });

            window.Game.showFloatingText(`Loss: ${item.name}`, "orange");
            log = `被搶走了 <span class="rarity-${item.rarity || 'common'}">${item.name}</span>`;
        }

        return log;
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

        // [New] 插入 Boss 資訊按鈕 (移至血條上方外部)
        // 1. 清理舊按鈕
        const existingBtn = document.getElementById('boss-info-btn');
        if (existingBtn) existingBtn.remove();

        // 2. 獲取容器
        const healthContainer = document.getElementById('enemy-health-container');

        if (healthContainer && (enemy.tier === "boss" || enemy.isTrueForm)) {
            // 確保容器相對定位
            healthContainer.style.position = 'relative';

            const btn = document.createElement('button');
            btn.id = 'boss-info-btn';
            btn.className = 'boss-info-btn';
            btn.innerHTML = 'ℹ️ 首領資訊';
            btn.onclick = (e) => {
                e.stopPropagation(); // 防止點擊穿透
                window.UISystem.showBossInfo();
            };

            // Absolute positioning above the health bar
            btn.style.position = 'absolute';
            btn.style.top = '-35px'; // Move up
            btn.style.right = '0';   // Align right
            btn.style.zIndex = '100';

            healthContainer.appendChild(btn);
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

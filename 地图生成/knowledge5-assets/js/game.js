// 11. 游戏主流程
async function processPlayerResponse(data) {
    if (!data) return;
    
    // 标记是否有血量变化（用于统一显示血量状态）
    let hasHpChange = false;
    
    // 处理玩家HP变化
    if (typeof data.player_hp_change === 'number' && data.player_hp_change !== 0) {
        gameState.playerHP = Math.max(0, Math.min(100, gameState.playerHP + data.player_hp_change));
        hasHpChange = true;
        if (data.player_hp_change < 0) {
            appendLog(`[DAMAGE] 你受到了 ${Math.abs(data.player_hp_change)} 点伤害！`, 'system', 'color: #ff6666;');
        } else {
            appendLog(`[HEAL] 你恢复了 ${data.player_hp_change} 点生命！`, 'system', 'color: #66ff66;');
        }
    }
    
    // 处理对Boss的伤害 - Boss LLM已停用
    // if (typeof data.damage_to_boss === 'number' && data.damage_to_boss > 0) {
    //     bossAgent.takeDamage(data.damage_to_boss);
    //     hasHpChange = true;
    //     appendLog(`[ATTACK] 你对 Phantom 造成了 ${data.damage_to_boss} 点伤害！`, 'system', 'color: #00ffcc;');
    // }
    
    // 如果LLM返回了血量变化信息，统一显示血量状态
    if (hasHpChange) {
        // Boss LLM已停用，只显示玩家HP
        // const hpLog = `<span style="color:#00ffcc">你的HP: ${gameState.playerHP}</span> vs <span style="color:#ff3366">Phantom HP: ${bossAgent.hp}</span>`;
        const hpLog = `<span style="color:#00ffcc">你的HP: ${gameState.playerHP}</span>`;
        appendLog(`[BATTLE STATUS] ${hpLog}`, 'system', 'border: 1px solid #333; padding: 5px;');
    }
    
    // 处理玩家主动发起战斗 - Boss LLM已停用
    // if (data.combat_initiated) {
    //     gameState.inCombat = true;
    //     bossAgent.state = 'engaging';
    // }

    // 执行图操作
    if (data.graph_ops) data.graph_ops.forEach(op => executeOp(op));
    
    // 初始化地图时同步线索分配
    if (data.init_map) {
        syncAssignedCluesFromLocationGraph();
    }

    // 【新增】初始化时只分配初始NPC，动态NPC后续根据剧情触发
    if (gameState.turnNumber === 0 && GRAPH_STORE.location.nodes.get().length > 1) {
        console.log("[INIT] Map generated, assigning initial NPCs...");
        assignInitialNPCs(gameState.currentStage);
    }

    // 更新玩家位置
    if (data.current_location_id) {
        gameState.currentLocationId = data.current_location_id;
        
        // 位置变化时更新可购买物品UI
        if (typeof updateShopInventoryUI === 'function') {
            updateShopInventoryUI();
        }
    }

    // 【迷雾侦探模式】处理线索揭示
    if (data.clue_reveals && data.clue_reveals.length > 0) {
        console.log(`[CLUE REVEAL] Processing ${data.clue_reveals.length} clue reveals:`, data.clue_reveals);
        data.clue_reveals.forEach(reveal => {
            const node = ClueManager.findNodeById(gameState.currentClueTrees, reveal.id);
            if (!node) {
                console.warn(`[CLUE REVEAL] Unknown clue ID: ${reveal.id}`);
                return;
            }
            
            const oldStatus = node.status;
            
            // 【安全检查】阻止 unknown 状态的物品被揭示为 found
            // 只有非 unknown 状态的线索才能被升级为 found
            if (oldStatus === 'unknown' && reveal.new_status === 'found') {
                console.warn(`[CLUE REVEAL BLOCKED] 尝试将 unknown 状态的 ${reveal.id} 直接变为 found，已阻止！`);
                // 降级为 rumored
                reveal.new_status = 'rumored';
                console.log(`[CLUE REVEAL] 已将 ${reveal.id} 的目标状态降级为 rumored`);
            }
            
            // 【安全检查】阻止直接获得有子节点的父级物品（除非所有子节点都已完成）
            if (node.children && node.children.length > 0 && oldStatus === 'unknown') {
                const allChildrenComplete = node.children.every(
                    child => child.status === 'found' || child.status === 'verified'
                );
                if (!allChildrenComplete) {
                    console.warn(`[CLUE REVEAL BLOCKED] 父节点 ${reveal.id} 的子节点未全部完成，无法揭示！`);
                    return; // 跳过这个揭示
                }
            }
            
            console.log(`[CLUE REVEAL] Updating clue ${reveal.id} from ${oldStatus} to ${reveal.new_status}`);
            
            // 更新状态
            const updates = ClueManager.updateStatus(gameState.currentClueTrees, reveal.id, reveal.new_status);
            console.log(`[CLUE REVEAL] Status updated. Node status is now: ${node.status}`);
            
            // 更新所有节点的hintable状态（因为子节点状态改变可能影响父节点）
            ClueManager.updateHintableStatus(gameState.currentClueTrees);
            
            // 记录发现
            ClueManager.recordDiscovery(reveal.id, reveal.reveal_method, gameState.currentLocationId);

            // 更新地点节点的线索元数据（仅针对已存在地点）
            if (reveal.location_type === 'existing' && reveal.target_location_id) {
                let holderType = 'environment';
                let holderId = null;
                // 从语义线索LLM的结果中获取npc_interaction
                if (reveal.reveal_method === 'npc_dialog' && data._semanticClueResult?.npc_interaction?.npc_id) {
                    holderType = 'npc';
                    holderId = data._semanticClueResult.npc_interaction.npc_id;
                }
                updateLocationClueMeta(reveal.target_location_id, reveal.id, holderType, holderId);
            }
            
            // 添加到本轮已提及列表（避免重复）
            if (!gameState.conversationMemory.mentionedClues.includes(reveal.id)) {
                gameState.conversationMemory.mentionedClues.push(reveal.id);
            }
            
            // 显示发现消息（根据状态类型）
            const methodText = {
                'npc_dialog': '从对话中得知',
                'search': '搜索发现',
                'observation': '观察到',
                'deduction': '推断出'
            }[reveal.reveal_method] || '发现';
            
            if (reveal.new_status === 'rumored') {
                // 传闻状态，不显示日志
            } else if (reveal.new_status === 'hinted') {
                // 线索状态，不显示日志
            } else if (reveal.new_status === 'found') {
                // 添加到物品列表
                if (typeof InventoryManager !== 'undefined') {
                    InventoryManager.addItem({
                        id: node.id,
                        name: node.name,
                        desc: node.desc,
                        type: 'clue',
                        source: 'clue',
                        turn: gameState.turnNumber
                    });
                }
            }
            
            // 检查是否有父节点被自动解锁
            updates.forEach(update => {
                // 父节点从 unknown 变为 rumored（所有子线索已找到，可以尝试整合）
                if (update.newStatus === 'rumored' && update.node.id !== reveal.id && update.node.children && update.node.children.length > 0) {
                    // 线索整合可用，不显示日志
                }
                
                // 父节点变为 verified（玩家成功整合并验证）
                if (update.newStatus === 'verified' && update.node.id !== reveal.id) {
                    // 添加到物品列表
                    if (typeof InventoryManager !== 'undefined') {
                        InventoryManager.addItem({
                            id: update.node.id,
                            name: update.node.name,
                            desc: update.node.desc || '',
                            type: 'clue',
                            source: 'clue_verified',
                            turn: gameState.turnNumber
                        });
                    }
                }
            });
        });
        
        updateKeypointUI();
    }
    

    // 显示获得的随机物品
    if (data.loot_obtained) {
        appendLog(`[LOOT] 获得物品: ${data.loot_obtained}`, 'system', 'color: #d2a8ff;');
    }
    
    // 显示支线任务
    if (data.side_quest_event) {
        appendLog(`[SIDE QUEST] 触发支线: ${data.side_quest_event}`, 'system', 'color: #ffcc00; border: 1px dashed #ffcc00;');
    }

    // 显示主要叙事
    appendLog(data.narrative, 'ai');
    
    // 处理购买系统结果（如果有）
    if (data._purchaseSystemResult && data._purchaseSystemResult.has_purchase_intent) {
        console.log("[PURCHASE SYSTEM] 购买系统结果已传递给叙事生成LLM");
        // 购买系统的结果已经通过叙事生成LLM处理，这里只记录日志
        // 实际的购买操作会在玩家明确表示购买时处理（通过后续的输入）
        
        // 更新可购买物品UI
        if (typeof updateShopInventoryUI === 'function') {
            updateShopInventoryUI();
        }
    }
    
    // 如果有遭遇描述
    if (data.encounter_description) {
        appendLog(`[ENCOUNTER] ${data.encounter_description}`, 'system', 'color: #ff3366;');
    }

    // 更新高亮
    highlightNodes();
    
    // 更新玩家状态UI（包括信用点）
    if (typeof updatePlayerStatusUI === 'function') {
        updatePlayerStatusUI();
    }

    // 检查关卡完成
    if (data.stage_complete) {
        await handleStageClear();
        return { stageCleared: true };
    }

    // 检查游戏结束
    if (data.game_over || gameState.playerHP <= 0) {
        gameState.isGameOver = true;
        const endMsg = data.ending_type === 'VICTORY' ? "任务完成 // 完美潜入" : "任务失败 // 信号丢失";
        appendLog(endMsg, 'stage-clear');
        toggleInputs(false);
        return { gameOver: true };
    }
    
    // 添加到最近事件
    gameState.recentEvents.push(`Turn ${gameState.turnNumber}: Player action completed`);

    console.log(gameState.investigation.npcInteractions)
    logCurrentMapGraph();
    return { success: true };
}

function syncAssignedCluesFromLocationGraph() {
    const nodes = GRAPH_STORE.location.nodes.get();
    const assignedClues = {};
    const validClueIds = new Set();
    gameState.currentClueTrees.forEach(root => {
        const stack = [root];
        while (stack.length) {
            const node = stack.pop();
            if (!node) continue;
            validClueIds.add(node.id);
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => stack.push(child));
            }
        }
    });
    
    nodes.forEach(node => {
        const rawClueIds = Object.keys(node.clue_map || {});
        if (node.clue_id && !rawClueIds.includes(node.clue_id)) {
            rawClueIds.push(node.clue_id);
        }
        const clueIds = rawClueIds.filter(id => validClueIds.has(id));
        if (rawClueIds.length !== clueIds.length) {
            const invalidIds = rawClueIds.filter(id => !validClueIds.has(id));
            console.warn(`[INIT MAP] Unknown clue id in graph: ${invalidIds.join(', ')}`);
            // 清理无效线索
            const updatedClueMap = {};
            clueIds.forEach(id => { updatedClueMap[id] = (node.clue_map || {})[id] || 'noNPC'; });
            GRAPH_STORE.location.nodes.update({
                id: node.id,
                clue_map: updatedClueMap,
                clue_id: clueIds[0] || null,
                has_clue: clueIds.length > 0
            });
        }
        if (clueIds.length === 0) return;
        if (clueIds.length > 1) {
            console.warn(`[INIT MAP] Node ${node.id} has multiple clues, only first will be used`, clueIds);
        }
        const clueId = clueIds[0];
        const clueNode = ClueManager.findNodeById(gameState.currentClueTrees, clueId);
        if (!clueNode) {
            console.warn(`[INIT MAP] Unknown clue id in graph: ${clueId}`);
        }
        assignedClues[clueId] = {
            id: clueId,
            assigned_location_id: node.id,
            assigned_turn: gameState.turnNumber,
            assigned_rationale: "init_map"
        };
    });
    
    gameState.worldGen.assignedClues = {
        ...(gameState.worldGen.assignedClues || {}),
        ...assignedClues
    };
    
    // 更新 hintable 状态
    ClueManager.updateHintableStatus(gameState.currentClueTrees);
}

// Boss LLM已停用，此函数已注释
async function resolveConflicts(playerResult, bossDecision) {
    // const sameLocation = bossAgent.isAtSameLocation(gameState.currentLocationId);
    
    // if (sameLocation && !gameState.inCombat) {
    //     // 触发遭遇
    //     gameState.inCombat = true;
    //     bossAgent.state = 'engaging';
    // }
    
    // 处理战斗状态（不再单独显示血量，血量状态由LLM返回时显示）
    if (gameState.inCombat) {
        // 屏幕震动效果
        document.body.style.transform = `translate(${Math.random()*4-2}px, ${Math.random()*4-2}px)`;
        setTimeout(() => document.body.style.transform = "none", 100);
        
        // 检查战斗结束条件
        if (gameState.playerHP <= 0) {
            gameState.isGameOver = true;
            appendLog(">> CRITICAL FAILURE: 生命体征归零。", 'system', 'color:red; font-weight:bold;');
        }
        
        // Boss LLM已停用
        // if (bossAgent.hp <= 0) {
        //     gameState.inCombat = false;
        //     bossAgent.state = 'retreating';
        //     appendLog(">> TARGET NEUTRALIZED. Phantom 被击败！", 'system', 'color:#00ffcc; font-weight:bold;');
        //     
        //     // Boss掉落物品
        //     if (bossAgent.heldKeypoints.length > 0) {
        //         const droppedKpId = bossAgent.heldKeypoints[0];
        //         bossAgent.dropKeypoint(droppedKpId);
        //         const kp = ClueManager.findNodeById(gameState.currentClueTrees, droppedKpId);
        //         if (kp) {
        //             // 将Boss持有的物品转为玩家发现
        //             kp.status = 'found';
        //             ClueManager.recordDiscovery(kp.id, 'combat_loot', gameState.currentLocationId);
        //             executeOp({ domain: 'inventory', op: 'add_node', id: kp.id, label: kp.name, desc: kp.desc, color: '#00ffcc' });
        //             executeOp({ domain: 'inventory', op: 'add_edge', from: 'player_node', to: kp.id });
        //             updateKeypointUI();
        //             appendLog(`[LOOT] 你从 Phantom 身上夺回了 <b>${kp.name}</b>！`, 'system', 'color: #00ffcc;');
        //         }
        //     }
        // }
    }
    
    // 检查玩家是否逃离战斗 - Boss LLM已停用
    // if (!sameLocation && gameState.inCombat) {
    //     gameState.inCombat = false;
    //     bossAgent.state = 'hunting';
    //     appendLog(`[DISENGAGE] 你成功脱离了战斗区域。`, 'system');
    // }
}

async function handleStageClear() {
    toggleInputs(false);
    appendLog(`>> STAGE ${gameState.currentStage} COMPLETE. UPLOADING DATA...`, 'stage-clear');

    if (gameState.currentStage >= gameState.maxStages) {
        gameState.isGameOver = true;
        appendLog("所有阶段任务完成！恭喜通关。", 'stage-clear');
        return;
    }

    setTimeout(async () => {
        gameState.currentStage++;
        gameState.inCombat = false;
        gameState.turnNumber = 0;
        gameState.recentEvents = [];
        initStage(gameState.currentStage);

        const stageConfig = STAGE_CONFIG[gameState.currentStage];
        const prompt = `玩家完成了上一关。现在进入 Stage ${gameState.currentStage}: ${stageConfig.name}。
        请重置 Location 图(除了玩家节点)，生成新的地图结构(公司广场风格)。
        重置 Inventory 图(保留上一关的关键道具)。
        Boss 出现在新位置 ${stageConfig.boss_start}。
        描述新环境。`;

        conversationHistory = [];
        
        const loading = document.getElementById('scan-effect');
        if (loading) {
            loading.classList.add('scanning');
        }
        
        try {
            const result = await callMainLLM(prompt, false);
            await processPlayerResponse(result);
            
            // Boss LLM已停用
            // appendLog(`[SYSTEM] 新的敌人 "Phantom" 已部署至 ${bossAgent.locationId}`, 'system', 'color: #ff3366;');
        } finally {
            if (loading) {
                loading.classList.remove('scanning');
            }
            toggleInputs(true);
        }
    }, 2000);
}

function initStage(stageNum) {
    // 更新阶段显示（如果元素存在）
    const stageDisplay = document.getElementById('stage-display');
    if (stageDisplay) {
        stageDisplay.innerText = `STAGE ${stageNum}`;
    }
    
    const config = STAGE_CONFIG[stageNum];

    // 深拷贝线索树
    gameState.currentClueTrees = JSON.parse(JSON.stringify(config.keypoint_trees));
    
    // 初始化所有节点的hintable状态
    ClueManager.updateHintableStatus(gameState.currentClueTrees);
    
    // 重置侦探进度系统
    gameState.investigation = {
        knownClues: [],
        clueDiscoveryLog: [],
        npcInteractions: {},
    };
    
    // 重置对话记忆
    gameState.conversationMemory = {
        mentionedClues: [],
        askedTopics: [],
        lastNpcTalked: null,
        llmDialogueHistory: [],
    };

    gameState.worldGen = {
        lastPlan: null,
        planHistory: [],
        assignedClues: {},
        spawnedNpcs: {}
    };
    
    // 重置语义判定记录
    gameState.semanticCheck = {
        lastResult: null,
        history: []
    };
    
    // 初始化/重置 BossAgent - 已注释
    // bossAgent.reset({ startLocation: config.boss_start });
    
    // 根据关卡调整Boss性格（可选）- 已注释
    // if (stageNum === 2) {
    //     // 第二关Boss更具攻击性
    //     bossAgent.personality.aggressiveness = 0.8;
    //     bossAgent.personality.greed = 0.9;
    // }

    // 更新目标显示（如果元素存在）
    const objectiveDisplay = document.getElementById('objective-display');
    if (objectiveDisplay) {
        objectiveDisplay.innerText = `目标: 整合 ${config.required_count} 个核心线索`;
    }
    
    updateKeypointUI();
}

// ========== 混合模式游戏循环 ==========
async function handleInput() {
    if (gameState.isGameOver) return;
    const input = document.getElementById('player-input');
    const userAction = input.value.trim();
    if (!userAction) return;

    appendLog(userAction, 'user');
    input.value = '';
    toggleInputs(false);
    
    // 显示加载状态（如果元素存在）
    const loading = document.getElementById('scan-effect');
    if (loading) {
        loading.classList.add('scanning');
    }
    
    // 增加回合计数
    gameState.turnNumber++;
    
    // 判断是否需要并行调用 - Boss LLM已停用，始终为true
    // const canParallel = !gameState.inCombat && 
    //                    !bossAgent.isAtSameLocation(gameState.currentLocationId);
    const canParallel = true; // Boss LLM已停用
    
    let playerResult, bossDecision;
    
    try {
        if (canParallel) {
            // ===== 场景1：双方分离，可并行调用 =====
            console.log("[GAME LOOP] Parallel mode - Player and Boss acting simultaneously");
            // 暂时停用 Boss LLM，保留玩家行动
            playerResult = await callMainLLM(userAction);
            
            // 先处理玩家行动结果
            const playerStatus = await processPlayerResponse(playerResult);
            if (playerStatus?.stageCleared || playerStatus?.gameOver) {
                if (loading) {
                    loading.classList.remove('scanning');
                }
                return;
            }
            
            // 暂时停用 Boss LLM，不处理 Boss 决策
            
        } else {
            // ===== 场景2：战斗中或同位置，必须串行 =====
            console.log("[GAME LOOP] Serial mode - Interaction required");
            
            // 1. 先处理玩家行动
            playerResult = await callMainLLM(userAction);
            const playerStatus = await processPlayerResponse(playerResult);
            
            if (playerStatus?.stageCleared || playerStatus?.gameOver) {
                if (loading) {
                    loading.classList.remove('scanning');
                }
                return;
            }
            
            // 2. 暂时停用 Boss LLM，不处理 Boss 决策
        }
        
        // 处理冲突（如遭遇、战斗结算等）- Boss LLM已停用
        // await resolveConflicts(playerResult, bossDecision);
        
        // 检查关卡完成条件
        checkStageCompletion();
        
    } catch (error) {
        console.error("[GAME LOOP Error]:", error);
        appendLog(`系统错误: ${error.message}`, 'system');
    } finally {
        if (loading) {
            loading.classList.remove('scanning');
        }
        // 清空本轮对话记忆（避免下一轮重复检查）
        gameState.conversationMemory.mentionedClues = [];
        if (!gameState.isGameOver) toggleInputs(true);
    }
}

// 检查关卡完成条件
function checkStageCompletion() {
    const stageConfig = STAGE_CONFIG[gameState.currentStage];
    const verifiedRoots = ClueManager.getVerifiedRootCount(gameState.currentClueTrees);

    if (verifiedRoots >= stageConfig.required_count) {
        // 核心数据解析完成，不显示日志
        // 触发 LLM 描述通关场景并返回 stage_complete: true
        callMainLLM("我已经收集到了足够的证据，准备进入下一阶段").then(processPlayerResponse);
    }
}

// 生成唯一的剧本ID
function generateScriptId() {
    // 格式：script_YYYYMMDD_HHMMSS_随机字符串
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `script_${dateStr}_${timeStr}_${randomStr}`;
}

async function startGame() {
    // 生成唯一的剧本ID（每次初始化时生成）
    gameState.scriptId = generateScriptId();
    console.log(`[START GAME] 剧本ID: ${gameState.scriptId}`);
    
    // 如果历史管理器已初始化，设置剧本ID
    if (typeof window !== 'undefined' && window.llmHistoryManager) {
        window.llmHistoryManager.setScriptId(gameState.scriptId);
    }
    
    // 重置游戏状态
    gameState.isGameOver = false;
    gameState.currentStage = 1;
    gameState.playerHP = 100;
    gameState.inCombat = false;
    gameState.turnNumber = 0;
    gameState.recentEvents = [];
    gameState.currentClueTrees = [];
    
    // 重置侦探进度系统
    gameState.investigation = {
        knownClues: [],
        clueDiscoveryLog: [],
        npcInteractions: {},
        clueHintCounts: {},
        locationExplorationCounts: {},
    };
    
    // 重置对话记忆
    gameState.conversationMemory = {
        mentionedClues: [],
        askedTopics: [],
        lastNpcTalked: null,
    };

    gameState.worldGen = {
        lastPlan: null,
        planHistory: [],
        assignedClues: {},
        spawnedNpcs: {}
    };
    
    // 重置语义判定记录
    gameState.semanticCheck = {
        lastResult: null,
        history: []
    };
    
    // 重置后果裁决记录
    gameState.consequenceJudge = {
        lastResult: null,
        history: [],
        warnings: [],
        actionSummary: null
    };
    
    // 初始化玩家状态（如果未初始化）
    if (!gameState.playerStatus) {
        gameState.playerStatus = {
            physical: ['健康'],
            social: ['普通'],
            money: 1000,
            history: []
        };
    }
    
    // 清空物品列表
    if (typeof InventoryManager !== 'undefined') {
        InventoryManager.clear();
    } else {
        gameState.playerInventory = [];
    }
    
    // ==========================================
    // 加载物品CSV数据到ItemFilterLLM
    // ==========================================
    console.log('[START GAME] 开始加载物品CSV数据...');
    try {
        // 读取CSV文件
        const csvResponse = await fetch('static/表/物品表.csv');
        if (!csvResponse.ok) {
            throw new Error(`CSV文件加载失败: ${csvResponse.status} ${csvResponse.statusText}`);
        }
        const csvText = await csvResponse.text();
        
        // 检查PapaParse是否已加载
        if (typeof Papa === 'undefined') {
            throw new Error('PapaParse库未加载，请检查HTML文件是否引入了PapaParse');
        }
        
        // 使用PapaParse解析CSV
        const parseResult = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            encoding: 'UTF-8'
        });
        
        // 检查解析错误
        if (parseResult.errors && parseResult.errors.length > 0) {
            console.warn('[START GAME] CSV解析警告:', parseResult.errors);
        }
        
        // 检查数据是否有效
        if (parseResult.data && parseResult.data.length > 0) {
            // 创建ItemFilterLLM实例并加载数据
            if (typeof ItemFilterLLM !== 'undefined') {
                window.itemFilterLLMInstance = new ItemFilterLLM();
                window.itemFilterLLMInstance.processCSVData(parseResult.data);
                const itemCount = window.itemFilterLLMInstance.getAllItems().length;
                const tagCount = window.itemFilterLLMInstance.getUniqueTags().size;
                console.log(`[START GAME] ✅ 物品CSV数据加载成功: ${itemCount} 个物品, ${tagCount} 种标签`);
                
                // 可选：在日志中显示加载成功信息
                if (typeof appendLog === 'function') {
                    appendLog(`[系统] 物品数据库已加载: ${itemCount} 个物品`, 'system', 'color: #00ffcc;');
                }
            } else {
                console.warn('[START GAME] ItemFilterLLM类未定义，跳过CSV加载');
            }
        } else {
            throw new Error('CSV文件为空或格式错误');
        }
    } catch (error) {
        console.error('[START GAME] CSV加载失败:', error);
        // 不阻止游戏启动，只是购买系统无法使用
        if (typeof appendLog === 'function') {
            appendLog(`[警告] 物品数据加载失败: ${error.message}，购买系统可能无法使用`, 'system', 'color: #ffaa00;');
        }
    }
    
    conversationHistory = [];

    // 确保图已初始化
    if (!GRAPH_STORE.location || !GRAPH_STORE.location.nodes) {
        console.log('[START GAME] 图未初始化，正在初始化...');
        initAllGraphs();
    }

    // 再次检查初始化是否成功
    if (!GRAPH_STORE.location || !GRAPH_STORE.location.nodes) {
        console.error('[START GAME] 图初始化失败，无法继续');
        appendLog('错误: 图初始化失败，请刷新页面重试', 'system');
        return;
    }

    // 清空图数据
    Object.values(GRAPH_STORE).forEach(g => {
        if(g && g.nodes && typeof g.nodes.clear === 'function') {
            try {
                g.nodes.clear();
            } catch(e) {
                console.warn('[START GAME] 清空节点失败:', e);
            }
        }
        if(g && g.edges && typeof g.edges.clear === 'function') {
            try {
                g.edges.clear();
            } catch(e) {
                console.warn('[START GAME] 清空边失败:', e);
            }
        }
    });

    // 确保inventory图已初始化后再添加节点
    if (GRAPH_STORE.inventory && GRAPH_STORE.inventory.nodes && typeof GRAPH_STORE.inventory.nodes.add === 'function') {
        try {
            GRAPH_STORE.inventory.nodes.add({id: 'player_node', label: 'Player', color: '#fff', shape: 'diamond'});
        } catch(e) {
            console.warn('[START GAME] 添加player_node失败:', e);
        }
    } else {
        console.warn('[START GAME] inventory图未初始化，跳过添加player_node');
    }

    // 更新聊天历史（如果元素存在）
    const chatHistory = document.getElementById('chat-history');
    if (chatHistory) {
        chatHistory.innerHTML = '<div class="log-item new">>> 连接神经网... 载入 Rival 模块...<br><span style="font-size:9px; opacity:0.5;">' + new Date().toLocaleTimeString('zh-CN', { hour12: false }) + '</span></div>';
    }
    toggleInputs(false);

    // 初始化关卡（包括Boss）
    initStage(1);
    
    // 初始化时更新玩家状态UI（包括信用点）
    if (typeof updatePlayerStatusUI === 'function') {
        updatePlayerStatusUI();
    }

    // 显示加载状态（如果元素存在）
    const loading = document.getElementById('scan-effect');
    if (loading) {
        loading.classList.add('scanning');
    }

    try {
        // 调用初始化LLM生成完整地图与线索分布
        const result = await callInitMapLLM();
        await processPlayerResponse(result);
        
        // Boss LLM已停用
        // appendLog(`[SYSTEM] Boss "Phantom" 已进入区域，位置: ${bossAgent.locationId}`, 'system', 'color: #ff3366;');
        
    } catch (error) {
        console.error("[START GAME Error]:", error);
        appendLog(`初始化错误: ${error.message}`, 'system');
    } finally {
        if (loading) {
            loading.classList.remove('scanning');
        }
        toggleInputs(true);
    }
}


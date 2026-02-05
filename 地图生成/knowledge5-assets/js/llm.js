// 8.5. 购买意图判断LLM - 判断玩家是否有购买意图并选择NPC
async function callPurchaseIntentLLM(userAction) {
    // 获取location图结构（包含地点和NPC信息）
    const existingLocations = GRAPH_STORE.location.nodes.get()
        .filter(n => n.id !== 'player_node')
        .map(n => ({
            id: n.id,
            label: n.label,
            desc: n.title || '',
            npcs: n.npcs || [],
            is_visible: n.is_visible !== false
        }));
    
    // 获取所有NPC信息（包括stage配置中的NPC信息）
    const stageInfo = STAGE_CONFIG[gameState.currentStage];
    const stageNpcIndex = stageInfo.npcs
        ? Object.fromEntries(stageInfo.npcs.map(npc => [npc.id, npc]))
        : {};
    
    // 构建完整的NPC列表（包含location图中的NPC和stage配置中的NPC信息）
    const allNPCs = [];
    existingLocations.forEach(location => {
        location.npcs.forEach(npc => {
            if (!npc.id) return;
            const stageNpcInfo = stageNpcIndex[npc.id] || {};
            allNPCs.push({
                id: npc.id,
                name: npc.name || stageNpcInfo.name || npc.id,
                occupation: npc.occupation || stageNpcInfo.occupation || '',
                personality: npc.personality || stageNpcInfo.personality || '',
                desc: npc.desc || stageNpcInfo.desc || '',
                location_id: location.id,
                location_label: location.label
            });
        });
    });
    
    // 获取对话历史
    const dialogueHistory = (gameState.conversationMemory.llmDialogueHistory || []).slice(-10);
    
    // 构建提示词
    const prompt = `
==============================================================
                【购买意图判断任务】
==============================================================

【玩家输入】: "${userAction}"

【玩家当前位置】: ${gameState.currentLocationId}

==============================================================
                【Location图结构 - 包含所有地点和NPC信息】
==============================================================

${JSON.stringify({
    current_location: gameState.currentLocationId,
    locations: existingLocations.map(loc => ({
        id: loc.id,
        label: loc.label,
        desc: loc.desc,
        is_visible: loc.is_visible,
        npcs: loc.npcs.map(npc => {
            const stageNpcInfo = stageNpcIndex[npc.id] || {};
            return {
                id: npc.id,
                name: npc.name || stageNpcInfo.name || npc.id,
                occupation: npc.occupation || stageNpcInfo.occupation || '',
                personality: npc.personality || stageNpcInfo.personality || '',
                desc: npc.desc || stageNpcInfo.desc || ''
            };
        })
    }))
}, null, 2)}

==============================================================
                【所有NPC列表 - 用于NPC选择】
==============================================================

${allNPCs.length > 0 ? allNPCs.map(npc => 
    `- ${npc.id} (${npc.name}): 位置=${npc.location_id} (${npc.location_label}), 职业=${npc.occupation || '未知'}, 性格=${npc.personality || '未知'}`
).join('\n') : '当前无NPC'}

==============================================================
                【对话历史 - 最近10条】
==============================================================

${dialogueHistory.length > 0 ? dialogueHistory.map(entry => `- ${entry}`).join('\n') : '无对话历史'}

==============================================================
                【判断指令】
==============================================================

请根据以上信息，判断：
1. 玩家是否有购买/交易意图？
2. 如果有，玩家想和哪个NPC进行交易？

输出格式（严格JSON）：
{
  "thinking": {
    "step1_input_analysis": "【输入分析】玩家输入内容分析",
    "step2_purchase_intent": "【购买意图判断】是否有购买意图？",
    "step3_location_analysis": "【位置分析】分析location图和NPC分布",
    "step4_npc_selection": "【NPC选择】选择哪个NPC作为交易对象？",
    "step5_validation": "【验证】验证结果的正确性"
  },
  "has_purchase_intent": true/false,
  "target_npc_id": "NPC ID 或 null",
  "target_npc_name": "NPC 名称 或 null",
  "reason": "判断理由说明"
}

【重要规则】:
- 如果 has_purchase_intent 为 true，target_npc_id 必须不为 null（除非当前位置无NPC）
- target_npc_id 必须来自上方NPC列表中的ID
- 如果玩家明确指定了NPC名称，必须选择匹配的NPC
- 如果玩家未指定NPC，选择当前位置的第一个NPC（如果存在）
`;

    console.log("[PURCHASE INTENT LLM] Input:", prompt);
    if (window.logLlmConsoleInput) {
        window.logLlmConsoleInput('purchase-intent', 'user', prompt);
    }
    
    try {
        const response = await fetch(API_CONFIG.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_CONFIG.key}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [
                    { role: "system", content: PURCHASE_INTENT_SYSTEM_PROMPT },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3,
                response_format: { type: "json_object" }
            })
        });
        
        if (!response.ok) throw new Error("Purchase Intent LLM API Error");
        const data = await response.json();
        const rawOutput = data.choices[0].message.content;
        let content = rawOutput;
        
        console.log("[PURCHASE INTENT LLM] Raw Output:", content);
        if (window.logLlmConsole) {
            window.logLlmConsole('purchase-intent', 'output', content);
        }
        
        let result;
        try {
            result = parseLlmJsonResponse(content);
        } catch (parseError) {
            console.error("[PURCHASE INTENT LLM] JSON Parse Error:", parseError.message);
            // 返回安全的默认值
            return {
                thinking: { error: "JSON解析失败" },
                has_purchase_intent: false,
                target_npc_id: null,
                target_npc_name: null,
                reason: "JSON解析失败，默认无购买意图",
                raw_output: rawOutput
            };
        }
        
        // 确保必要字段存在
        result.has_purchase_intent = Boolean(result.has_purchase_intent);
        result.target_npc_id = result.target_npc_id || null;
        result.target_npc_name = result.target_npc_name || null;
        result.reason = result.reason || "无理由说明";
        result.raw_output = rawOutput;
        
        // 验证target_npc_id是否存在于NPC列表中
        if (result.has_purchase_intent && result.target_npc_id) {
            const npcExists = allNPCs.some(npc => npc.id === result.target_npc_id);
            if (!npcExists) {
                console.warn(`[PURCHASE INTENT LLM] target_npc_id ${result.target_npc_id} 不存在于NPC列表中，重置为null`);
                result.target_npc_id = null;
                result.target_npc_name = null;
                result.reason = `NPC ${result.target_npc_id} 不存在，已重置`;
            } else {
                // 更新target_npc_name为实际NPC名称
                const npc = allNPCs.find(n => n.id === result.target_npc_id);
                if (npc) {
                    result.target_npc_name = npc.name;
                }
            }
        }
        
        console.log(`[PURCHASE INTENT LLM] Result: hasPurchaseIntent=${result.has_purchase_intent}, targetNpcId=${result.target_npc_id}, reason=${result.reason}`);
        
        return result;
    } catch (e) {
        console.error("[PURCHASE INTENT LLM Error]:", e);
        if (window.logLlmConsole) {
            window.logLlmConsole('purchase-intent', 'output', `ERROR: ${e.message}`);
        }
        // 出错时返回安全的默认值
        return {
            thinking: { error: e.message },
            has_purchase_intent: false,
            target_npc_id: null,
            target_npc_name: null,
            reason: `错误: ${e.message}`,
            raw_output: null
        };
    }
}

// 9. 语义线索裁决LLM（思维链模式）- 完整线索判断系统
// visibilityResult: 位置可见性裁决结果（由 WorldGen LLM 提供）
async function callSemanticClueLLM(userAction, visibilityResult = null) {
    // 获取语义LLM专用上下文
    const semanticContext = getSemanticClueContext(userAction);
    const instruction = getSemanticClueInstruction();
    
    // 构建位置可见性裁决信息块
    const visibilityInfo = visibilityResult ? `
==============================================================
            【VISIBILITY_DECISION - 位置可见性裁决结果】
            （由位置可见性裁决LLM提供，请参考此信息）
==============================================================

【是否有新位置揭示】: ${visibilityResult.should_reveal_any ? '是' : '否'}

${visibilityResult.visibility_updates && visibilityResult.visibility_updates.length > 0 ? 
`【新揭示的位置节点】:
${visibilityResult.visibility_updates.map(u => 
    `- ${u.node_id}: ${u.narrative_hint || '无描述'} (${u.reveal_type})`
).join('\n')}` : '【无新揭示的位置节点】'}


【位置可见性裁决思考过程】:
${visibilityResult.thinking ? JSON.stringify(visibilityResult.thinking, null, 2) : '无'}

==============================================================
` : '';
    
    const prompt = `${semanticContext}

${visibilityInfo}
${instruction}`;

    console.log("[SEMANTIC CLUE LLM] Input:", prompt);
    if (window.logLlmConsoleInput) {
        window.logLlmConsoleInput('semantic', 'user', prompt);
    }
    
    try {
        const response = await fetch(API_CONFIG.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_CONFIG.key}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [
                    { role: "system", content: SEMANTIC_CLUE_SYSTEM_PROMPT },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3,  // 低温度确保一致性和逻辑严谨
                response_format: { type: "json_object" }
            })
        });
        
        if (!response.ok) throw new Error("Semantic Clue LLM API Error");
        const data = await response.json();
        const rawOutput = data.choices[0].message.content;
        let content = rawOutput;
        
        console.log("[SEMANTIC CLUE LLM] Raw Output:", content);
        if (window.logLlmConsole) {
            window.logLlmConsole('semantic', 'output', content);
        }
        
        let result;
        try {
            // 使用统一的JSON解析函数
            result = parseLlmJsonResponse(content);
        } catch (parseError) {
            console.error("[SEMANTIC CLUE LLM] JSON Parse Error:", parseError.message);
            // 返回安全的默认值
            return {
                thinking: { error: "JSON解析失败" },
                should_reveal: false,
                most_relevant_clue: null,
                clue_reveals: [],
                state_updates: [],
                npc_interaction: { npc_id: null, response_type: "idle_chat" },
                player_location: gameState.currentLocationId,
                raw_output: rawOutput
            };
        }
        
        // 确保必要字段存在
        result.should_reveal = Boolean(result.should_reveal);
        result.should_hint = Boolean(result.should_hint || false);
        result.should_upgrade = Boolean(result.should_upgrade || false);
        result.most_relevant_clue = result.most_relevant_clue || null;
        result.hint_target_clue = result.hint_target_clue || null;
        result.clue_reveals = result.clue_reveals || [];
        result.state_updates = result.state_updates || [];
        result.clue_hint_counts = result.clue_hint_counts || {};
        result.location_exploration_counts = result.location_exploration_counts || {};
        result.npc_interaction = result.npc_interaction || { npc_id: null, response_type: "idle_chat" };
        result.player_location = result.player_location || gameState.currentLocationId;
        result.raw_output = rawOutput;
        
        // 执行状态更新（更新 keypoint_tree）
        if (result.state_updates && Array.isArray(result.state_updates)) {
            result.state_updates.forEach(update => {
                const node = ClueManager.findNodeById(gameState.currentClueTrees, update.id);
                if (node && update.new_status && update.new_status !== node.status) {
                    const oldStatus = node.status;
                    node.status = update.new_status;
                    console.log(`[SEMANTIC] Clue ${update.id} status: ${oldStatus} -> ${update.new_status}`);
                }
            });
            
            // 更新所有节点的 hintable 状态
            ClueManager.updateHintableStatus(gameState.currentClueTrees);
        }
        
        // 更新线索暗示次数
        if (result.clue_hint_counts && typeof result.clue_hint_counts === 'object') {
            Object.keys(result.clue_hint_counts).forEach(clueId => {
                const count = parseInt(result.clue_hint_counts[clueId]) || 0;
                if (!gameState.investigation.clueHintCounts) {
                    gameState.investigation.clueHintCounts = {};
                }
                gameState.investigation.clueHintCounts[clueId] = count;
                console.log(`[SEMANTIC] Clue ${clueId} hint count: ${count}`);
            });
        }
        
        // 更新地点探索次数
        if (result.location_exploration_counts && typeof result.location_exploration_counts === 'object') {
            Object.keys(result.location_exploration_counts).forEach(locationId => {
                const count = parseInt(result.location_exploration_counts[locationId]) || 0;
                if (!gameState.investigation.locationExplorationCounts) {
                    gameState.investigation.locationExplorationCounts = {};
                }
                gameState.investigation.locationExplorationCounts[locationId] = count;
                console.log(`[SEMANTIC] Location ${locationId} exploration count: ${count}`);
            });
            
            // 如果进行了线索暗示，清零当前地点的探索次数
            if (result.should_hint && result.clue_reveals && result.clue_reveals.length > 0) {
                const currentLocation = result.player_location || gameState.currentLocationId;
                if (gameState.investigation.locationExplorationCounts[currentLocation] !== undefined) {
                    gameState.investigation.locationExplorationCounts[currentLocation] = 0;
                    console.log(`[SEMANTIC] Cleared exploration count for location ${currentLocation} after hint`);
                }
            }
        }
        
        // 更新玩家位置（必须验证目标位置是 is_visible=true）
        if (result.player_location && result.player_location !== gameState.currentLocationId) {
            const targetNode = GRAPH_STORE.location.nodes.get(result.player_location);
            if (targetNode && targetNode.is_visible !== false) {
                console.log(`[SEMANTIC] Player location: ${gameState.currentLocationId} -> ${result.player_location}`);
                gameState.currentLocationId = result.player_location;
            } else {
                console.warn(`[SEMANTIC] 拒绝移动到隐藏位置: ${result.player_location} (is_visible=false)`);
                // 保持当前位置不变
                result.player_location = gameState.currentLocationId;
            }
        }
        
        // 存储语义判定结果
        const semanticResult = {
            turn: gameState.turnNumber,
            action: userAction,
            thinking: result.thinking,
            should_reveal: result.should_reveal,
            most_relevant_clue: result.most_relevant_clue,
            clue_reveals: result.clue_reveals,
            npc_interaction: result.npc_interaction,
            player_location: result.player_location,
            raw_output: rawOutput,
            timestamp: Date.now()
        };
        gameState.semanticCheck.lastResult = semanticResult;
        gameState.semanticCheck.history.push(semanticResult);
        
        // 限制历史长度
        if (gameState.semanticCheck.history.length > 50) {
            gameState.semanticCheck.history = gameState.semanticCheck.history.slice(-50);
        }
        
        console.log(`[SEMANTIC CLUE LLM] Result: ShouldReveal=${result.should_reveal}, MostRelevant=${result.most_relevant_clue}, Clues=${result.clue_reveals.length}, Location=${result.player_location}`);
        console.log("[SEMANTIC CLUE LLM] Thinking:", JSON.stringify(result.thinking, null, 2));
        
        return result;
    } catch (e) {
        console.error("[SEMANTIC CLUE LLM Error]:", e);
        if (window.logLlmConsole) {
            window.logLlmConsole('semantic', 'output', `ERROR: ${e.message}`);
        }
        // 出错时返回安全的默认值
        return {
            thinking: { error: e.message },
            should_reveal: false,
            most_relevant_clue: null,
            clue_reveals: [],
            state_updates: [],
            npc_interaction: { npc_id: null, response_type: "idle_chat" },
            player_location: gameState.currentLocationId,
            raw_output: null
        };
    }
}

// 旧函数兼容（已弃用，保留以防其他地方调用）
async function evaluateActionRelevance(userAction) {
    console.warn("[DEPRECATED] evaluateActionRelevance is deprecated, use callSemanticClueLLM instead");
    const result = await callSemanticClueLLM(userAction);
    return {
        score: result.score,
        reason: result.reason,
        related_clues: result.related_clues,
        raw_output: result.raw_output
    };
}

function getAllCluesForMapInit(trees) {
    const clues = [];
    function traverse(node, depth, parentId) {
        clues.push({
            id: node.id,
            name: node.name,
            desc: node.desc || '',
            location_hint: node.location_hint || '',
            prerequisites: node.prerequisites || [],
            depth: depth,
            parent_id: parentId || null
        });
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => traverse(child, depth + 1, node.id));
        }
    }
    trees.forEach(root => traverse(root, 0, null));
    return clues;
}

// [已弃用] 线索发现概率计算
// 此函数已不再使用，线索判断逻辑已完全移至语义裁决LLM (callSemanticClueLLM)
// 保留此函数仅用于向后兼容
function calculateClueDiscoveryChance(relevanceScore) {
    console.warn("[DEPRECATED] calculateClueDiscoveryChance is no longer used. Clue decisions are made by Semantic Clue LLM.");
    if (relevanceScore >= 90) return 100;
    if (relevanceScore >= 70) return 95;
    if (relevanceScore >= 40) return 65;
    if (relevanceScore >= 20) return 65;
    return 65;
}

async function callInitMapLLM() {
    const stageInfo = STAGE_CONFIG[gameState.currentStage];
    const allClues = getAllCluesForMapInit(gameState.currentClueTrees);
    const allClueIds = new Set(allClues.map(c => c.id));
    const entryClues = (stageInfo.entry_clues || []).filter(id => allClueIds.has(id));
    const initInstruction = getInitMapInstruction();
    
    const clueListText = allClues.length > 0
        ? allClues.map(c => `- ${c.id}: ${c.name} | ${c.desc} | hint:${c.location_hint || '无'} | prereq:${c.prerequisites.length ? c.prerequisites.join(',') : '无'}`).join('\n')
        : '无';
    
    const prompt = `你是赛博朋克世界的地图与NPC初始化生成器。需要一次性生成完整的 location_graph，包括地点、NPC和线索分配。

【关卡】: ${gameState.currentStage} - ${stageInfo.name}
【入口线索(优先放在起点或近邻)】: ${entryClues.length ? entryClues.join(', ') : '无'}

【线索总表（每条线索必须被分配到一个且仅一个地点；NPC的knows只能从此列表选择）】:
${clueListText}

==============================================================
                    【地点生成规则】
==============================================================
1. 必须创建起点节点 id=loc_start，且 is_visible=true
2. 每个地点最多放置一个线索（clue_id 最多一个）
3. 每条线索必须被分配到某个地点
4. 禁止输出线索总表之外的 clue_id
5. 地点数量 >= 线索数量（允许无线索地点）
6. 初始时：起点及其直接相邻地点 is_visible=true，其余地点 is_visible=false
7. 【新增】玩家最先接触到的线索（线索树最子节点/入口线索）必须分配在首次可见地点（is_visible=true）
7. 所有地点必须形成连通图（从 loc_start 可达所有其他地点）
==============================================================
                    【NPC生成规则 - 核心要求】
==============================================================
1. **每个地点必须生成0-6个NPC**：
   - 主要地点: 3-6个NPC
   - 次要地点: 2-4个NPC
   - 隐蔽地点: 0-1个NPC

2. **NPC线索分配规则**：
   - 每个NPC的knows数组最多包含1个线索ID
   - 约60-70%的NPC不携带任何线索（knows为空数组[]）
   - 多个NPC可以知道同一条线索（交叉验证）
   - 只有NPC身份与线索相关时才分配


4. **NPC格式**：
   - id: "npc_{地点缩写}_{序号}"，如 "npc_bar_01"
   - name: 赛博朋克风格中文名
   - knows: [] 或 ["单个线索ID"]
   - occupation: 符合地点的职业
   - personality: 性格特点
   - is_main_npc: false（普通NPC）或 true（主要NPC）
   - specialty: 仅当is_main_npc=true时填写特长描述
   - background_story: 仅当is_main_npc=true时填写背景故事（100-200字）

5. **主要NPC与普通NPC区分**：
   - 主要NPC（is_main_npc=true）：通常是地点中的关键角色（如酒吧老板、黑客、线人），必须有详细的specialty和background_story
   - 普通NPC（is_main_npc=false）：氛围型NPC，不需要填写specialty和background_story

6. **NPC分配示例**：
   酒吧(6人): 酒保(knows:["线索A"]), 醉汉x2(knows:[]), 黑客(knows:["线索B"]), 舞女(knows:[]), 保镖(knows:[])
   小巷(3人): 流浪汉(knows:[]), 线人(knows:["线索A"]), 瘾君子(knows:[])

==============================================================
                    【输出格式】
==============================================================
${initInstruction}`;
    
    if (window.logLlmConsoleInput) {
        window.logLlmConsoleInput('main', 'user', prompt);
    }
    
    try {
        const response = await fetch(API_CONFIG.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_CONFIG.key}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.6,
                response_format: { type: "json_object" }
            })
        });
        
        if (!response.ok) throw new Error("Init Map API Error");
        const data = await response.json();
        const rawContent = data.choices[0].message.content;
        
        console.log("[INIT MAP LLM Response]:", rawContent);
        if (window.logLlmConsole) {
            window.logLlmConsole('main', 'output', rawContent);
        }
        
        // 使用统一的JSON解析函数
        const result = parseLlmJsonResponse(rawContent);
        if (!result.current_location_id) {
            result.current_location_id = 'loc_start';
        }
        if (!Array.isArray(result.graph_ops)) {
            result.graph_ops = [];
        }
        if (!result.narrative) {
            result.narrative = "初始化完成。你站在昏暗的入口处，霓虹在雨幕中闪烁。";
        }
        result.init_map = true;
        return result;
    } catch (error) {
        console.error("[INIT MAP Error]:", error);
        if (window.logLlmConsole) {
            window.logLlmConsole('main', 'output', `ERROR: ${error.message}`);
        }
        appendLog(`System Error: ${error.message}`, 'system');
        return null;
    }
}

async function callMainLLM(userAction, isInit = false) {
    if (isInit) {
        console.warn("[MAIN LLM] isInit 已弃用，改用 callInitMapLLM()");
        return callInitMapLLM();
    }
    if (!userAction) {
        console.warn("[MAIN LLM] userAction 为空，已跳过");
        return null;
    }
    
    const instruction = getJsonInstruction();
    const worldGenGraphOps = [];
    
    // Boss状态信息（已注释 - Boss LLM功能已停用）
    // const bossStatusInfo = `
    // [BOSS STATUS - READ ONLY, 由独立系统控制]
    // - Boss Location: ${bossAgent.locationId}
    // - Boss HP: ${bossAgent.hp}
    // - Boss State: ${bossAgent.state}
    // - Same Location as Player: ${bossAgent.isAtSameLocation(gameState.currentLocationId)}
    // - In Combat: ${gameState.inCombat}
    // `;
    const bossStatusInfo = `[BOSS STATUS - 已停用]`;

    // ==========================================
    // 【重构】并行双路径调用流程：
    // 路径1（串行）：位置可见性裁决 LLM → 语义线索裁决 LLM
    // 路径2（并行）：购买意图判断 LLM → 购买系统（如有意图）
    // 最后：主叙事生成 LLM（接收两条路径的结果）
    // ==========================================
    
    let semanticClueResult = null;
    let worldGenPlan = null;
    let purchaseSystemResult = null;
    let context = null;
    
    // ==========================================
    // 【阶段1】并行执行两条路径
    // ==========================================
    console.log("[FLOW] === 阶段1: 并行执行两条路径 ===");
    
    // 路径1：位置可见性裁决 LLM → 语义线索裁决 LLM（串行）
    const path1Promise = (async () => {
        console.log("[FLOW] === 路径1: 位置可见性裁决 ===");
        const contextForWorldGen = getWorldGenContext();
        const worldGenResult = await callWorldGenLLM(userAction, contextForWorldGen, bossStatusInfo);
        console.log("[FLOW] 位置可见性裁决完成:", worldGenResult ? 
            `揭示${worldGenResult.visibility_updates?.length || 0}个节点` : '无裁决结果');
        
        console.log("[FLOW] === 路径1: 语义线索裁决 ===");
        const semanticResult = await callSemanticClueLLM(userAction, worldGenResult);
        console.log("[FLOW] 语义线索裁决完成:", semanticResult ? 
            `揭示${semanticResult.clue_reveals?.length || 0}条线索` : '无裁决结果');
        
        return { worldGenPlan: worldGenResult, semanticClueResult: semanticResult };
    })();
    
    // 路径2：购买意图判断 LLM → 购买系统（如有意图）
    const path2Promise = (async () => {
        console.log("[FLOW] === 路径2: 购买意图判断 ===");
        
        // 调用购买意图判断LLM
        const purchaseIntentResult = await callPurchaseIntentLLM(userAction);
        console.log("[FLOW] 购买意图判断完成:", purchaseIntentResult ? 
            `hasPurchaseIntent=${purchaseIntentResult.has_purchase_intent}, targetNpcId=${purchaseIntentResult.target_npc_id}` : '无判断结果');
        
        // 如果判断有购买意图，继续执行购买流程
        if (purchaseIntentResult && purchaseIntentResult.has_purchase_intent && purchaseIntentResult.target_npc_id) {
            console.log("[FLOW] === 路径2: 购买系统商品生成 ===");
            
            try {
                // 从判断LLM的结果中获取NPC信息
                const targetNpcId = purchaseIntentResult.target_npc_id;
                
                // 从location图中获取NPC信息
                const stageInfo = STAGE_CONFIG[gameState.currentStage];
                const stageNpcIndex = stageInfo.npcs ? Object.fromEntries(stageInfo.npcs.map(npc => [npc.id, npc])) : {};
                
                // 查找NPC所在的location节点
                let npcInfo = null;
                let npcLocationNode = null;
                
                for (const locationNode of GRAPH_STORE.location.nodes.get()) {
                    const npcs = locationNode.npcs || [];
                    const npc = npcs.find(n => n.id === targetNpcId);
                    if (npc) {
                        npcLocationNode = locationNode;
                        const stageNpcInfo = stageNpcIndex[npc.id] || {};
                        npcInfo = {
                            id: npc.id,
                            name: npc.name || stageNpcInfo.name || purchaseIntentResult.target_npc_name || npc.id,
                            occupation: npc.occupation || stageNpcInfo.occupation || '',
                            personality: npc.personality || stageNpcInfo.personality || '',
                            desc: npc.desc || stageNpcInfo.desc || ''
                        };
                        break;
                    }
                }
                
                // 如果找不到NPC，使用判断LLM返回的NPC名称创建基本信息
                if (!npcInfo) {
                    console.warn(`[PURCHASE SYSTEM] 无法在location图中找到NPC ${targetNpcId}，使用判断LLM返回的信息`);
                    npcInfo = {
                        id: targetNpcId,
                        name: purchaseIntentResult.target_npc_name || targetNpcId,
                        occupation: '',
                        personality: '',
                        desc: ''
                    };
                }
                
                // 检查ItemFilterLLM是否已初始化并加载了数据
                const itemFilter = (typeof window !== 'undefined' && window.itemFilterLLMInstance) 
                    ? window.itemFilterLLMInstance 
                    : (typeof ItemFilterLLM !== 'undefined' ? new ItemFilterLLM() : null);
                
                if (itemFilter && itemFilter.getAllItems && itemFilter.getAllItems().length > 0) {
                    // 调用物品过滤LLM
                    const queryLogic = await itemFilter.fetchQueryLogic(userAction, npcInfo);
                    const filteredItems = itemFilter.executeFilter(queryLogic);
                    
                    // 获取玩家状态
                    const playerStatus = {
                        money: gameState.playerStatus.money || 0,
                        physical: gameState.playerStatus.physical || ['健康'],
                        social: gameState.playerStatus.social || ['普通']
                    };
                    
                    // 获取对话历史
                    const dialogueHistory = (gameState.conversationMemory.llmDialogueHistory || []).slice(-5).map(entry => {
                        const parts = entry.split(':');
                        if (parts.length >= 2) {
                            return {
                                role: parts[0].trim().toLowerCase() === 'user' ? 'user' : 'assistant',
                                content: parts.slice(1).join(':').trim()
                            };
                        }
                        return { role: 'assistant', content: entry };
                    });
                    
                    // 调用商人定价LLM
                    const pricingResult = await itemFilter.callMerchantLLM(filteredItems, npcInfo, playerStatus, dialogueHistory);
                    
                    const purchaseResult = {
                        has_purchase_intent: true,
                        npc_info: npcInfo,
                        filtered_items: filteredItems.slice(0, 20).map(item => ({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            weight: item.weight,
                            desc: item.desc,
                            tags: item.tags
                        })),
                        pricing_result: pricingResult,
                        query_logic: queryLogic,
                        purchase_intent_result: purchaseIntentResult  // 保存购买意图判断结果
                    };
                    
                    // 持久化保存NPC可购买物品到gameState
                    if (purchaseResult && purchaseResult.pricing_result && purchaseResult.pricing_result.items) {
                        const npcId = npcInfo.id;
                        gameState.npcShopInventory[npcId] = {
                            npc_info: npcInfo,
                            items: purchaseResult.pricing_result.items.map(item => ({
                                item_id: item.item_id,
                                item_name: item.item_name,
                                base_price: item.base_price,
                                final_price: item.final_price,
                                price_modifier: item.price_modifier,
                                should_sell: item.should_sell,
                                sell_reason: item.sell_reason
                            })),
                            last_updated: Date.now(),
                            turn: gameState.turnNumber
                        };
                        console.log(`[PURCHASE SYSTEM] 已保存NPC ${npcId} 的可购买物品列表 (${gameState.npcShopInventory[npcId].items.length}个物品)`);
                    }
                    
                    console.log("[FLOW] 购买系统完成:", purchaseResult ? 
                        `找到${purchaseResult.filtered_items.length}个物品，${pricingResult.items?.length || 0}个已定价` : '无结果');
                    
                    return purchaseResult;
                } else {
                    console.warn("[FLOW] ItemFilterLLM未初始化或未加载数据，跳过购买系统");
                    if (itemFilter && itemFilter.getAllItems && itemFilter.getAllItems().length === 0) {
                        console.warn("[FLOW] ItemFilterLLM实例存在但物品列表为空，请先加载CSV数据");
                    }
                    return null;
                }
            } catch (error) {
                console.error("[FLOW] 购买系统调用失败:", error);
                // 不影响主流程，返回null
                return null;
            }
        } else {
            console.log("[FLOW] 购买意图判断LLM判定无购买意图，跳过购买系统");
            return null;
        }
    })();
    
    // 等待两条路径都完成
    const [path1Result, path2Result] = await Promise.all([path1Promise, path2Promise]);
    
    // 提取路径1的结果
    worldGenPlan = path1Result.worldGenPlan;
    semanticClueResult = path1Result.semanticClueResult;
    
    // 提取路径2的结果
    purchaseSystemResult = path2Result;
    
    // 1. 处理位置可见性更新（Visibility Arbiter Decision）
    // 注意：实际的 GRAPH_STORE 更新已在 worldgen-llm.js 的 callWorldGenLLM 中完成
    // 这里只记录历史和日志
    if (worldGenPlan && worldGenPlan.should_reveal_any && worldGenPlan.visibility_updates) {
        worldGenPlan.visibility_updates.forEach(update => {
            if (update.node_id && update.new_visibility === true) {
                console.log(`[VISIBILITY] Node revealed: ${update.node_id} (${update.reveal_type})`);
                // 为叙事提供提示
                if (update.narrative_hint) {
                    worldGenGraphOps.push({
                        domain: "location",
                        op: "update_visibility",
                        id: update.node_id,
                        narrative_hint: update.narrative_hint,
                        reveal_type: update.reveal_type
                    });
                }
            }
        });
    }
    
    // 2. 记录裁决历史
    if (worldGenPlan) {
        gameState.worldGen.lastPlan = worldGenPlan;
        gameState.worldGen.planHistory.push({ 
            turn: gameState.turnNumber, 
            plan: worldGenPlan 
        });
        if (gameState.worldGen.planHistory.length > 50) {
            gameState.worldGen.planHistory = gameState.worldGen.planHistory.slice(-50);
        }
    }
    
    // ==========================================
    // 【阶段2】主叙事生成 LLM
    // 综合路径1（位置可见性+语义线索）和路径2（购买系统）的结果生成叙事
    // ==========================================
    console.log("[FLOW] === 阶段2: 主叙事生成（合并两条路径结果）===");
    
    // 语义裁决完成后，生成主LLM的context
    context = getGameContext(userAction);
    
    // 构建位置可见性决策信息块（传递给主LLM）
    const visibilityDecision = worldGenPlan ? {
        should_reveal_any: worldGenPlan.should_reveal_any,
        visibility_updates: worldGenPlan.visibility_updates || [],
        entry_blocked: worldGenPlan.entry_blocked || [],
        thinking_summary: worldGenPlan.thinking ? 
            (worldGenPlan.thinking.step4_reveal_decision || "无") : "无"
    } : null;
    
    // 构建线索决策信息块（传递给主LLM）
    const clueRevealDecision = {
        should_reveal: semanticClueResult.should_reveal,
        clue_reveals: semanticClueResult.clue_reveals,
        npc_interaction: semanticClueResult.npc_interaction,
        most_relevant_clue: semanticClueResult.most_relevant_clue,
        thinking_summary: semanticClueResult.thinking ? 
            (semanticClueResult.thinking.step4_reveal_decision || "无") : "无"
    };
    
    const userContent = `[Context] ${context}
${bossStatusInfo}

[Player Action] ${userAction}

==============================================================
            【VISIBILITY_DECISION - 位置可见性裁决结果】
            （由位置可见性裁决LLM提供，请根据此信息描述场景变化）
==============================================================
${visibilityDecision ? JSON.stringify(visibilityDecision, null, 2) : '无位置变化'}

${visibilityDecision && visibilityDecision.visibility_updates && visibilityDecision.visibility_updates.length > 0 ? 
`【新发现的位置】- 请在叙事中自然描述这些新发现：
${visibilityDecision.visibility_updates.map(u => 
    `- ${u.node_id}: ${u.narrative_hint || '新发现的区域'} (发现方式: ${u.reveal_type})`
).join('\n')}` : ''}

${visibilityDecision && visibilityDecision.entry_blocked && visibilityDecision.entry_blocked.length > 0 ? 
`【进入受阻的位置】- 玩家不能从当前路线进入，请在叙事中自然描述受阻情况并暗示其他方法：
${visibilityDecision.entry_blocked.map(b => 
    `- ${b.node_id}: ${b.blocked_reason}
     提示信息: ${b.hint_message}`
).join('\n\n')}` : ''}

==============================================================
                【CLUE_REVEAL_DECISION - 语义裁决结果】
                （由语义裁决LLM提供，你必须原样使用）
==============================================================
${JSON.stringify(clueRevealDecision, null, 2)}

${purchaseSystemResult ? `
==============================================================
            【PURCHASE_SYSTEM_DECISION - 购买系统结果】
            （由购买系统LLM提供，如果包含购买相关信息，请用小说化语句描述）
==============================================================
${JSON.stringify({
    has_purchase_intent: purchaseSystemResult.has_purchase_intent,
    npc_info: purchaseSystemResult.npc_info,
    available_items: purchaseSystemResult.pricing_result.items || [],
    item_count: purchaseSystemResult.filtered_items.length
}, null, 2)}

【购买系统叙事规则 - 严格遵守】：
1. **如果包含购买相关信息，必须用小说化的语句描述，禁止使用列表或表格形式**
2. **NPC展示商品**：用生动的场景描写NPC展示商品的过程，如"老板从柜台下取出一个布满灰尘的金属盒，打开后露出里面的物品..."
3. **商品描述**：用感官描写和氛围渲染来描述商品，如"那把枪的枪管上刻着磨损的编号，握把处有使用过的痕迹..."
4. **价格描述**：用对话或内心独白的方式提及价格，如"老板报出一个数字，你皱了皱眉"或"价格标签在霓虹灯下闪烁"
5. **购买决策**：如果玩家明确表示购买，用动作描写完成交易，如"你从口袋里掏出信用点卡，在终端上划过..."
6. **禁止直接列出商品清单**：不要写成"商品列表：1. xxx 2. xxx"，而是用叙事的方式逐一介绍
7. **保持赛博朋克风格**：使用冷硬的科技术语和异质感描写，符合Nitroplus风格
` : ''}

==============================================================
                【叙事生成指令】
==============================================================

**你的唯一任务是生成叙事文本。位置可见性和线索决策已由前置LLM完成。**

1. **位置发现叙事规则**：
   - 如果有 visibility_updates，在叙事中自然描述玩家发现新区域
   - 根据 reveal_type 控制发现描述风格：
     * "exploration" → 玩家主动探索发现
     * "npc_hint" → NPC告知玩家某处的存在
     * "clue_discovery" → 通过线索推断出的位置
     * "forced_entry" → 玩家强行进入发现

2. **线索叙事规则**：
   - 如果 should_reveal=true，将 clue_reveals 中每个线索的 narrative_hook 自然融入叙事
   - 根据 new_status 控制叙事风格：
     * "rumored" → 只写违和感/异常，不提线索名称
     * "hinted" → 写物理特征/轮廓，不下结论
     * "found" → 完整描述，可明确指出
   - 如果 should_reveal=false 或 clue_reveals 为空 → 禁止提及任何线索

3. **NPC对话规则**：
   - 检查 npc_interaction.response_type
   - "idle_chat" → NPC只能闲聊
   - "gossip" → 模糊的八卦
   - "clue_reveal" → 根据 clue_reveals 生成透露信息的对话

4. **禁止修改决策结果**：
   - 你输出的 clue_reveals 必须与上方决策完全一致
   - 不要添加、删除或修改任何线索或位置发现

[Combat Logic Request]:
1. Check Inventory. If player unarmed vs Boss, Player HP drops significantly.
2. Update HP changes. If boss_hp <= 0, combat ends.

[CURRENT GRAPH NODES]: ${GRAPH_STORE.location.nodes.get().map(n=>n.label).join(', ')}.
[BOSS ENCOUNTER]: 如果玩家与Boss在同一位置，描述遭遇场景。

[Narrative Guide]:
1. **Atmosphere**: 赛博朋克氛围（雨、霓虹、衰败）
2. **NPC Personality**: 每个NPC有独特的说话方式
3. **Mystery**: 保持神秘感

${instruction}`;

    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...conversationHistory,
        { role: "user", content: userContent }
    ];
    
    if (window.logLlmConsoleInput) {
        window.logLlmConsoleInput('main', 'system', SYSTEM_PROMPT);
        window.logLlmConsoleInput('main', 'user', userContent);
    }
    console.log("[MAIN LLM] Input:", userContent);
    
    try {
        const response = await fetch(API_CONFIG.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_CONFIG.key}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: messages,
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) throw new Error("Main LLM API Error");
        const data = await response.json();
        const rawContent = data.choices[0].message.content;

        console.log("[MAIN LLM Response]:", rawContent);
        if (window.logLlmConsole) {
            window.logLlmConsole('main', 'output', rawContent);
        }

        // 使用统一的JSON解析函数
        const result = parseLlmJsonResponse(rawContent);
        
        // 【重要】确保 clue_reveals 使用语义LLM的决策，而不是主LLM自己生成的
        result.clue_reveals = semanticClueResult.clue_reveals || [];
        
        // 合并 WorldGen 生成的 graph_ops
        if (worldGenGraphOps.length > 0) {
            result.graph_ops = (result.graph_ops || []).concat(worldGenGraphOps);
        }
        
        // 更新对话历史
        const historyEntry = `User: ${userAction}\nLLM: ${result.narrative || ''}`;
        const history = gameState.conversationMemory.llmDialogueHistory || [];
        history.push(historyEntry);
        if (history.length > 20) {
            gameState.conversationMemory.llmDialogueHistory = history.slice(-20);
        } else {
            gameState.conversationMemory.llmDialogueHistory = history;
        }
        
        // 处理 graph_ops 中的 NPC 注册
        if (result.graph_ops) {
           result.graph_ops.forEach(op => {
               if (op.domain === 'location' && op.op === 'add_node') {
                   if (op.npcs && Array.isArray(op.npcs)) {
                       op.npcs.forEach(npc => {
                           if (npc.id) {
                               if (!gameState.worldGen.spawnedNpcs) gameState.worldGen.spawnedNpcs = {};
                               gameState.worldGen.spawnedNpcs[npc.id] = {
                                   npc_id: npc.id,
                                   name: npc.name || npc.id,
                                   desc: npc.desc || '',
                                   spawn_narrative: npc.spawn_narrative || '',
                                   location_id: op.id,
                                   spawn_turn: gameState.turnNumber,
                                   spawn_phase: ClueManager ? ClueManager.getInvestigationPhase().name : "dynamic",
                                   is_main_npc: npc.is_main_npc !== undefined ? Boolean(npc.is_main_npc) : false,
                                   specialty: (npc.is_main_npc === true && npc.specialty) ? npc.specialty : null,
                                   background_story: (npc.is_main_npc === true && npc.background_story) ? npc.background_story : null,
                                   occupation: npc.occupation || '',
                                   personality: npc.personality || '',
                                   knows: npc.knows || []
                               };
                               console.log(`[GRAPH_OPS] Registered NPC: ${npc.name} (${npc.id}) at ${op.id}`);
                           }
                       });
                   } else if (op.npc_ids && Array.isArray(op.npc_ids)) {
                        op.npc_ids.forEach((id, idx) => {
                           if (id) {
                               if (!gameState.worldGen.spawnedNpcs) gameState.worldGen.spawnedNpcs = {};
                                gameState.worldGen.spawnedNpcs[id] = {
                                   npc_id: id,
                                   name: (op.npc_names && op.npc_names[idx]) || id,
                                   desc: (op.npc_descs && op.npc_descs[idx]) || '',
                                   location_id: op.id,
                                   spawn_turn: gameState.turnNumber,
                                   spawn_phase: ClueManager ? ClueManager.getInvestigationPhase().name : "dynamic"
                                };
                                console.log(`[GRAPH_OPS] Registered NPC (Legacy): ${id} at ${op.id}`);
                           }
                        });
                   }
               }
           });
        }

        // 更新会话历史
        conversationHistory.push({ role: "user", content: userAction });
        conversationHistory.push({ role: "assistant", content: JSON.stringify({ narrative: result.narrative }) });
        if (conversationHistory.length > 10) {
            conversationHistory = [conversationHistory[0], ...conversationHistory.slice(-9)];
        }

        // 添加语义裁决结果到返回值（供调试和日志使用）
        result._semanticClueResult = semanticClueResult;
        
        // 添加购买系统结果到返回值（供调试和日志使用）
        if (purchaseSystemResult) {
            result._purchaseSystemResult = purchaseSystemResult;
        }

        // ==========================================
        // 【阶段4 & 5】并行执行：动态位置提取 LLM + 后果裁决 LLM
        // 从对话历史中识别新位置并添加到地图 | 判断行为后果、游戏状态和玩家状态更新
        // ==========================================
        console.log("[FLOW] === 阶段4&5: 动态位置提取 + 后果裁决（并行）===");
        
        const parallelPromises = [];
        
        // 动态位置提取 LLM（如果narrative存在）
        if (result.narrative && result.narrative.trim().length > 0) {
            parallelPromises.push(
                callDynamicLocationLLM(result.narrative, userAction)
                    .then(dynamicLocationResult => {
                        console.log("[FLOW] 动态位置提取完成:", dynamicLocationResult ? 
                            `创建${dynamicLocationResult.new_locations?.length || 0}个新位置节点` : '无新位置');
                        
                        // 将动态位置提取结果添加到返回值（供调试使用）
                        result._dynamicLocationResult = dynamicLocationResult;
                        
                        // 如果创建了新位置，更新地图显示
                        if (dynamicLocationResult && dynamicLocationResult.new_locations && dynamicLocationResult.new_locations.length > 0) {
                            // 触发地图更新（如果highlightNodes函数存在）
                            if (typeof highlightNodes === 'function') {
                                highlightNodes();
                            }
                        }
                        return dynamicLocationResult;
                    })
                    .catch(e => {
                        console.error("[FLOW] 动态位置提取失败:", e);
                        // 不影响主流程，返回空结果
                        return { new_locations: [] };
                    })
            );
        } else {
            console.log("[FLOW] 跳过动态位置提取：narrative为空");
        }
        
        // 后果裁决 LLM
        parallelPromises.push(
            callConsequenceJudgeLLM(userAction, result, gameState)
                .then(consequenceResult => {
                    console.log("[FLOW] 后果裁决完成:", consequenceResult ? 
                        `类型=${consequenceResult.consequence_type}, 游戏结束=${consequenceResult.game_over}, 警告=${consequenceResult.warning ? '是' : '否'}` : '无裁决结果');
                    
                    // 应用后果裁决结果
                    if (consequenceResult && consequenceResult.game_over) {
                        result.game_over = true;
                        result.ending_type = consequenceResult.ending_type;
                        gameState.isGameOver = true;
                    }
                    
                    // 添加后果分析到返回值
                    if (consequenceResult) {
                        result.consequence_analysis = consequenceResult.consequence_analysis;
                        result._consequenceJudgeResult = consequenceResult;
                        
                        // 如果发出警告，已经在callConsequenceJudgeLLM中显示，这里只记录
                        if (consequenceResult.warning) {
                            console.log(`[CONSEQUENCE JUDGE] 警告已发出: ${consequenceResult.warning}`);
                        }
                    }
                    return consequenceResult;
                })
                .catch(e => {
                    console.error("[FLOW] 后果裁决失败:", e);
                    // 不影响主流程，返回null
                    return null;
                })
        );
        
        // 等待所有并行任务完成
        await Promise.all(parallelPromises);

        return result;
    } catch (error) {
        console.error("[MAIN LLM Error]:", error);
        if (window.logLlmConsole) {
            window.logLlmConsole('main', 'output', `ERROR: ${error.message}`);
        }
        appendLog(`System Error: ${error.message}`, 'system');
        return null;
    }
}


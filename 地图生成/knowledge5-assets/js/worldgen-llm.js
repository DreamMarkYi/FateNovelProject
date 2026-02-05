// 统一的JSON解析函数 - 仅去除markdown代码块，不处理中文标点
// 所有LLM输出都应该使用response_format: { type: "json_object" }，确保输出标准JSON
function parseLlmJsonResponse(rawContent) {
    if (!rawContent || typeof rawContent !== 'string') {
        throw new Error('JSON内容为空或无效');
    }
    
    // 仅去除markdown代码块标记
    let cleaned = rawContent
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
    
    // 尝试提取JSON对象（如果内容包含其他文本）
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        cleaned = jsonMatch[0];
    }
    
    // 直接解析，如果失败则抛出错误
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("[JSON解析失败] 错误信息:", e.message);
        throw new Error(`JSON解析失败: ${e.message}`);
    }
}

// ========== 位置可见性裁决上下文生成 ==========
function getVisibilityArbiterContext() {
    const stageInfo = STAGE_CONFIG[gameState.currentStage];
    
    // 获取所有位置节点（包含完整信息）
    const allLocationNodes = GRAPH_STORE.location.nodes.get()
        .filter(n => n.id !== 'player_node')
        .map(n => ({
            id: n.id,
            label: n.label,
            desc: n.title || '',
            npcs: n.npcs || [],
            has_clue: Boolean(n.has_clue),
            clue_map: n.clue_map || {},
            is_visible: n.is_visible !== false,
            unlock_conditions: n.unlock_conditions || null
        }));
    
    // 分离可见和隐藏节点
    const visibleNodes = allLocationNodes.filter(n => n.is_visible);
    const hiddenNodes = allLocationNodes.filter(n => !n.is_visible);
    
    // 获取所有边（连接关系）
    const allEdges = GRAPH_STORE.location.edges.get().map(e => ({
        from: e.from,
        to: e.to,
        label: e.label || 'connected'
    }));
    
    // 找出当前位置的相邻节点
    const currentLocationId = gameState.currentLocationId;
    const adjacentNodeIds = new Set();
    allEdges.forEach(edge => {
        if (edge.from === currentLocationId) {
            adjacentNodeIds.add(edge.to);
        }
        if (edge.to === currentLocationId) {
            adjacentNodeIds.add(edge.from);
        }
    });
    
    // 相邻的隐藏节点（可能被揭示的候选）
    const adjacentHiddenNodes = hiddenNodes.filter(n => adjacentNodeIds.has(n.id));
    
    // 对话历史
    const llmDialogueHistory = gameState.conversationMemory.llmDialogueHistory || [];
    
    // 线索状态摘要
    const knownClues = ClueManager.getAllKnownClues(gameState.currentClueTrees);
    const foundClues = ClueManager.getAllFoundClues(gameState.currentClueTrees);
    
    // NPC信息
    const spawnedNpcRegistry = gameState.worldGen.spawnedNpcs || {};
    const spawnedNpcList = Object.values(spawnedNpcRegistry);
    
    // 获取玩家状态
    const playerStatus = PlayerStatusManager ? PlayerStatusManager.getStatusDescription() : '状态未知';
    const playerPhysicalStatus = gameState.playerStatus?.physical || ['健康'];
    const playerSocialStatus = gameState.playerStatus?.social || ['普通'];
    
    // 获取玩家物品列表
    const playerInventory = gameState.playerInventory || [];
    const inventoryItemNames = playerInventory.map(item => item.name || item.id).join(', ') || '无';
    
    const context = `
==============================================================
                【位置可见性裁决上下文】
==============================================================

[PLAYER CURRENT LOCATION]: ${currentLocationId}
[Turn Number]: ${gameState.turnNumber}
[Player Status]: ${playerStatus}
[Player Physical Status]: ${playerPhysicalStatus.join(', ')}
[Player Social Status]: ${playerSocialStatus.join(', ')}
[Player Inventory]: ${inventoryItemNames}

==============================================================
                【完整位置图谱 LOCATION GRAPH】
==============================================================

【所有位置节点（含隐藏）】:
${JSON.stringify(allLocationNodes, null, 2)}

【连接关系 EDGES】:
${allEdges.map(e => `- ${e.from} <--> ${e.to} [${e.label}]`).join('\n')}

==============================================================
                【可见性状态分析】
==============================================================

【当前可见的位置节点】:
${visibleNodes.length > 0 ? visibleNodes.map(n => 
    `- ✅ ${n.id} (${n.label}): ${n.desc || '无描述'}`
).join('\n') : '无'}

【当前隐藏的位置节点】:
${hiddenNodes.length > 0 ? hiddenNodes.map(n => 
    `- 🔒 ${n.id} (${n.label}): ${n.desc || '无描述'}
    解锁条件: ${n.unlock_conditions || '无特殊条件，探索即可发现'}`
).join('\n') : '无隐藏节点'}

【当前位置的相邻隐藏节点（可揭示候选）】:
${adjacentHiddenNodes.length > 0 ? adjacentHiddenNodes.map(n => 
    `- 🎯 ${n.id} (${n.label}): ${n.desc || '无描述'}
    解锁条件: ${n.unlock_conditions || '探索即可发现'}`
).join('\n') : '当前位置没有相邻的隐藏节点'}

==============================================================
                【线索状态摘要】
==============================================================

[已知线索数量]: ${knownClues.length}
[已找到证据数量]: ${foundClues.length}

${knownClues.length > 0 ? 
`【已知线索列表】:
${knownClues.map(c => `- ${c.name} [${c.status}]`).join('\n')}` 
: '玩家尚未发现任何线索'}

==============================================================
                【NPC 状态】
==============================================================

【已生成的NPC】:
${spawnedNpcList.length > 0 ? spawnedNpcList.map(npc => 
    `- ${npc.name} (${npc.npc_id}) at ${npc.location_id}`
).join('\n') : '无'}

==============================================================
                【对话历史 - 最近10条】
==============================================================
${llmDialogueHistory.slice(-10).length > 0 ? 
llmDialogueHistory.slice(-10).map(entry => `- ${entry}`).join('\n') 
: '无对话历史'}

==============================================================
                【裁决历史 VISIBILITY DECISION HISTORY - 最近10条】
==============================================================
${(gameState.worldGen.visibilityHistory || []).slice(-10).map(h => 
    `- Turn ${h.turn}: ${h.revealed_nodes.join(', ') || '无揭示'} (${h.reason})`
).join('\n') || '无历史记录'}
`;
    return context;
}

// ========== 位置可见性裁决 LLM（核心函数）==========
async function callWorldGenLLM(userAction, context, bossStatusInfo) {
    // 获取位置可见性专用上下文
    const visibilityContext = getVisibilityArbiterContext();
    
    const prompt = `
[SYSTEM ROLE]
你是"迷雾揭示者"——位置可见性裁决系统。根据玩家行为决定哪些隐藏位置应该变为可见。

${visibilityContext}

[PLAYER ACTION]: "${userAction}"

==============================================================
                    【裁决规则提醒】
==============================================================

1. **探索行为判定**：
   - "四处看看/走走/搜索/找路" → 可以揭示相邻隐藏节点
   - "对话/查看/使用物品" → 通常不揭示新位置
   - "去XXX/前往XXX" → 如果目标是可见节点则移动，如果是隐藏节点则尝试揭示



${getWorldGenInstruction()}
`;

    if (window.logLlmConsoleInput) {
        window.logLlmConsoleInput('worldgen', 'system', WORLD_GEN_SYSTEM_PROMPT);
        window.logLlmConsoleInput('worldgen', 'user', prompt);
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
                    { role: "system", content: WORLD_GEN_SYSTEM_PROMPT },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) throw new Error("Visibility Arbiter LLM API Error");
        const data = await response.json();
        let content = data.choices[0].message.content;

        console.log("[VISIBILITY ARBITER PROMPT]:", prompt);
        console.log("[VISIBILITY ARBITER SYSTEM]:", WORLD_GEN_SYSTEM_PROMPT);
        console.log("[VISIBILITY ARBITER RAW]:", content);
        
        if (window.logLlmConsole) {
            window.logLlmConsole('worldgen', 'output', content);
        }

        // 使用统一的JSON解析函数
        const result = parseLlmJsonResponse(content);

        // 规范化结果
        result.should_reveal_any = Boolean(result.should_reveal_any);
        result.visibility_updates = Array.isArray(result.visibility_updates) ? result.visibility_updates : [];
        result.entry_blocked = Array.isArray(result.entry_blocked) ? result.entry_blocked : [];
        
        // 应用可见性更新到 GRAPH_STORE
        if (result.visibility_updates.length > 0) {
            result.visibility_updates.forEach(update => {
                if (update.node_id && update.new_visibility === true) {
                    const node = GRAPH_STORE.location.nodes.get(update.node_id);
                    if (node) {
                        GRAPH_STORE.location.nodes.update({
                            id: update.node_id,
                            is_visible: true,
                            hidden: false
                        });
                        console.log(`[VISIBILITY] Revealed node: ${update.node_id}`);
                    }
                }
            });
            
            // 记录裁决历史
            if (!gameState.worldGen.visibilityHistory) {
                gameState.worldGen.visibilityHistory = [];
            }
            gameState.worldGen.visibilityHistory.push({
                turn: gameState.turnNumber,
                revealed_nodes: result.visibility_updates.map(u => u.node_id),
                reason: result.thinking?.step4_reveal_decision || userAction
            });
        }

        return result;
    } catch (e) {
        console.error("[Visibility Arbiter LLM Error]:", e);
        if (window.logLlmConsole) {
            window.logLlmConsole('worldgen', 'output', `ERROR: ${e.message}`);
        }
        return {
            should_reveal_any: false,
            visibility_updates: []
        };
    }
}

// ========== 动态位置提取上下文生成 ==========
function getDynamicLocationContext(narrative, userAction) {
    // 获取所有现有位置节点
    const allLocationNodes = GRAPH_STORE.location.nodes.get()
        .filter(n => n.id !== 'player_node')
        .map(n => ({
            id: n.id,
            label: n.label,
            desc: n.title || '',
            is_visible: n.is_visible !== false
        }));
    
    // 获取所有边（连接关系）
    const allEdges = GRAPH_STORE.location.edges.get().map(e => ({
        from: e.from,
        to: e.to,
        label: e.label || 'connected'
    }));
    
    // 对话历史
    const llmDialogueHistory = gameState.conversationMemory.llmDialogueHistory || [];
    
    // 当前位置
    const currentLocationId = gameState.currentLocationId;
    const currentNode = GRAPH_STORE.location.nodes.get(currentLocationId);
    
    const context = `
==============================================================
                【动态位置提取上下文】
==============================================================

[PLAYER CURRENT LOCATION]: ${currentLocationId} (${currentNode?.label || '未知'})
[Turn Number]: ${gameState.turnNumber}

==============================================================
                【现有位置图谱 - 完整列表】
==============================================================

【所有位置节点（用于对比，避免重复创建）】:
${allLocationNodes.length > 0 ? allLocationNodes.map(n => 
    `- ${n.id} (${n.label}): ${n.desc || '无描述'} [${n.is_visible ? '可见' : '隐藏'}]`
).join('\n') : '无位置节点'}

【连接关系 EDGES】:
${allEdges.length > 0 ? allEdges.map(e => 
    `- ${e.from} <--> ${e.to} [${e.label}]`
).join('\n') : '无连接关系'}

==============================================================
                【对话历史 - 最近15条】
==============================================================

${llmDialogueHistory.slice(-15).length > 0 ? 
llmDialogueHistory.slice(-15).map((entry, idx) => 
    `[${idx + 1}] ${entry}`
).join('\n\n') 
: '无对话历史'}

==============================================================
                【当前回合信息】
==============================================================

[玩家行动]: ${userAction}

[主LLM生成的叙事文本]:
${narrative || '无叙事文本'}

==============================================================
                【提取任务】
==============================================================

请分析上述对话历史和叙事文本，识别新出现的位置。
如果某个位置在现有location_graph中不存在，且出现合理，则生成新节点数据。
`;
    return context;
}

// ========== 动态位置提取 LLM（核心函数）==========
async function callDynamicLocationLLM(narrative, userAction) {
    // 如果narrative为空，跳过
    if (!narrative || narrative.trim().length === 0) {
        console.log("[DYNAMIC LOCATION] 跳过：narrative为空");
        return { new_locations: [] };
    }
    
    // 获取动态位置提取专用上下文
    const dynamicContext = getDynamicLocationContext(narrative, userAction);
    
    const prompt = `
${dynamicContext}

==============================================================
                    【提取规则提醒】
==============================================================

1. **仔细对比现有节点**：确保不创建重复位置
2. **合理性验证**：只创建符合剧情和世界观的位置
3. **可见性判断**：根据narrative中的描述决定is_visible
4. **连接关系**：新位置必须连接到至少一个现有位置

${getDynamicLocationInstruction()}
`;

    if (window.logLlmConsoleInput) {
        window.logLlmConsoleInput('dynamic-location', 'system', DYNAMIC_LOCATION_SYSTEM_PROMPT);
        window.logLlmConsoleInput('dynamic-location', 'user', prompt);
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
                    { role: "system", content: DYNAMIC_LOCATION_SYSTEM_PROMPT },
                    { role: "user", content: prompt }
                ],
                temperature: 0.4,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) throw new Error("Dynamic Location LLM API Error");
        const data = await response.json();
        let content = data.choices[0].message.content;

        console.log("[DYNAMIC LOCATION PROMPT]:", prompt);
        console.log("[DYNAMIC LOCATION RAW]:", content);
        
        if (window.logLlmConsole) {
            window.logLlmConsole('dynamic-location', 'output', content);
        }

        // 使用统一的JSON解析函数
        const result = parseLlmJsonResponse(content);

        // 规范化结果
        result.new_locations = Array.isArray(result.new_locations) ? result.new_locations : [];
        
        // 验证并应用新位置到 GRAPH_STORE
        if (result.new_locations.length > 0) {
            const validLocations = [];
            
            result.new_locations.forEach(loc => {
                // 验证必要字段
                if (!loc.node_id || !loc.label) {
                    console.warn(`[DYNAMIC LOCATION] 跳过无效位置：缺少必要字段`, loc);
                    return;
                }
                
                // 检查是否已存在（通过ID或label匹配）
                const existingById = GRAPH_STORE.location.nodes.get(loc.node_id);
                const existingByLabel = GRAPH_STORE.location.nodes.get({
                    filter: n => n.label === loc.label
                });
                
                if (existingById || (existingByLabel && existingByLabel.length > 0)) {
                    console.log(`[DYNAMIC LOCATION] 跳过重复位置：${loc.node_id} (${loc.label})`);
                    return;
                }
                
                // 验证连接关系
                if (!loc.connect_to || !Array.isArray(loc.connect_to) || loc.connect_to.length === 0) {
                    // 如果没有指定连接，默认连接到当前位置
                    loc.connect_to = [gameState.currentLocationId];
                }
                
                // 验证连接的目标节点是否存在
                const validConnections = loc.connect_to.filter(targetId => {
                    const targetNode = GRAPH_STORE.location.nodes.get(targetId);
                    if (!targetNode) {
                        console.warn(`[DYNAMIC LOCATION] 连接目标不存在：${targetId}，将连接到当前位置`);
                        return false;
                    }
                    return true;
                });
                
                // 如果没有有效连接，连接到当前位置
                if (validConnections.length === 0) {
                    validConnections.push(gameState.currentLocationId);
                }
                loc.connect_to = validConnections;
                
                validLocations.push(loc);
            });
            
            // 应用有效的新位置
            validLocations.forEach(loc => {
                // 创建节点
                executeOp({
                    domain: 'location',
                    op: 'add_node',
                    id: loc.node_id,
                    label: loc.label,
                    desc: loc.desc || '',
                    is_visible: loc.is_visible !== false,
                    npcs: [],
                    has_clue: false,
                    clue_map: {}
                });
                
                // 创建连接关系
                loc.connect_to.forEach(targetId => {
                    executeOp({
                        domain: 'location',
                        op: 'add_edge',
                        from: loc.node_id,
                        to: targetId,
                        label: loc.reason || 'connected'
                    });
                });
                
                console.log(`[DYNAMIC LOCATION] 创建新位置节点: ${loc.node_id} (${loc.label}), 连接到: ${loc.connect_to.join(', ')}, visible=${loc.is_visible}`);
            });
            
            // 更新结果
            result.new_locations = validLocations;
            
            // 记录历史
            if (!gameState.worldGen.dynamicLocationHistory) {
                gameState.worldGen.dynamicLocationHistory = [];
            }
            gameState.worldGen.dynamicLocationHistory.push({
                turn: gameState.turnNumber,
                created_nodes: validLocations.map(loc => loc.node_id),
                reason: `从对话中提取: ${userAction}`
            });
        }

        return result;
    } catch (e) {
        console.error("[Dynamic Location LLM Error]:", e);
        if (window.logLlmConsole) {
            window.logLlmConsole('dynamic-location', 'output', `ERROR: ${e.message}`);
        }
        return {
            new_locations: []
        };
    }
}


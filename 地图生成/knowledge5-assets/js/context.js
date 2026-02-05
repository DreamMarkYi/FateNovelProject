// 7. 动态生成包含游戏状态的 Context（用于主LLM）
function getGameContext(userAction) {
    const graphSnap = {};
    ['location', 'inventory', 'narrative'].forEach(key => {
        graphSnap[key] = {
            nodes: GRAPH_STORE[key].nodes.get().map(n => ({id: n.id, label: n.label})),
            edges: GRAPH_STORE[key].edges.get().map(e => ({from: e.from, to: e.to}))
        };
    });

    const stageInfo = STAGE_CONFIG[gameState.currentStage];
    const inventoryList = (typeof InventoryManager !== 'undefined' && InventoryManager.getItemNames) 
        ? InventoryManager.getItemNames() 
        : ((gameState.playerInventory || []).map(i => i.name).join(", ") || "Empty");
    
    // 【新增】获取所有已存在的地点（用于线索位置分配）
    const existingLocations = GRAPH_STORE.location.nodes.get()
        .filter(n => n.id !== 'player_node')
        .map(n => ({
            id: n.id,
            label: n.label,
            desc: n.title || '',
            // 【修改】只使用标准化的 npcs 字段 (graph.js 已保证迁移)
            npcs: n.npcs || [], 
            has_clue: Boolean(n.has_clue),
            clue_map: n.clue_map || {},
            is_visible: n.is_visible !== false
        }));
    const locationLabelById = new Map(existingLocations.map(loc => [loc.id, loc.label]));
    
    // 【新增】获取地图连接关系（Edges）
    const locationEdges = GRAPH_STORE.location.edges.get().map(e => ({
        from: e.from,
        to: e.to,
        label: e.label || 'connected'
    }));
    
    // 侦探进度系统上下文
    const investigationPhase = ClueManager.getInvestigationPhase();
    const knownClues = ClueManager.getAllKnownClues(gameState.currentClueTrees);
    const foundClues = ClueManager.getAllFoundClues(gameState.currentClueTrees);
    const discoverableClues = ClueManager.getDiscoverableClues(gameState.currentClueTrees, gameState.investigation.knownClues);
    const mentionedThisTurn = gameState.conversationMemory.mentionedClues;
    const assignedCluesRegistry = gameState.worldGen.assignedClues || {};
    const assignedClueIds = Object.keys(assignedCluesRegistry);
    const assignedDiscoverableClues = assignedClueIds.length > 0
        ? discoverableClues.filter(c => assignedClueIds.includes(c.id))
        : [];
    // 未分配的线索 = 不在 assignedCluesRegistry 中的线索
    const unassignedDiscoverableClues = discoverableClues.filter(c => !assignedClueIds.includes(c.id));
    const spawnedNpcRegistry = gameState.worldGen.spawnedNpcs || {};
    const spawnedNpcList = Object.values(spawnedNpcRegistry);
    const llmDialogueHistory = gameState.conversationMemory.llmDialogueHistory || [];
    
    // 获取location图中所有NPC（不按地点过滤），位置以location图为准
    const npcIndex = stageInfo.npcs
        ? Object.fromEntries(stageInfo.npcs.map(npc => [npc.id, npc]))
        : {};
    const npcMap = new Map();
    GRAPH_STORE.location.nodes.get().forEach(node => {
        // 使用标准化的 npcs 数组
        const npcs = node.npcs || [];
        npcs.forEach(npc => {
            if (!npc.id) return;
            const npcInfo = npcIndex[npc.id] || {};
            if (!npcMap.has(npc.id)) {
                npcMap.set(npc.id, {
                    id: npc.id,
                    name: npc.name || npcInfo.name || npc.id,
                    knows: npcInfo.knows || [],
                    location: node.id
                });
            }
        });
    });
    const currentLocationNPCs = Array.from(npcMap.values());
    
    // 语义判定系统输出（供主LLM参考）
    const semanticLastResult = gameState.semanticCheck.lastResult || null;
    const semanticRecentHistory = (gameState.semanticCheck.history || []).slice(-5);
    
    // 获取玩家状态
    const playerStatus = PlayerStatusManager.getStatusDescription();
    
    const context = `
[Current Stage]: ${gameState.currentStage} - ${stageInfo.name}
[Objective]: 整合 ${stageInfo.required_count} 个核心线索树
[Turn Number]: ${gameState.turnNumber}
[Player HP]: ${gameState.playerHP}
[Player Location]: ${gameState.currentLocationId}
[Player Inventory]: ${inventoryList || "Empty"}
[Player Status]: ${playerStatus}

=== 【当前完整位置图谱 (Location Graph) - 核心参考】===
${JSON.stringify({
    nodes: existingLocations.map(loc => ({
        id: loc.id,
        label: loc.label,
        desc: loc.desc,
        npcs: loc.npcs, // 包含 id, name, desc
        clues: Object.keys(loc.clue_map || {})
    })),
    edges: locationEdges
}, null, 2)}


===【地图连接关系】===
${locationEdges.map(e => `- ${e.from} <--> ${e.to} [${e.label}]`).join('\n')}

=== 【迷雾侦探系统状态】===
[INVESTIGATION PHASE]: ${investigationPhase.phase} - ${investigationPhase.name}
[Phase Description]: ${investigationPhase.desc}

[ALREADY REVEALED CLUES (玩家已知，不要重复详细描述)]:
${knownClues.length > 0 ? knownClues.map(c => `- ${c.id}: ${c.name} [${c.status}]`).join('\n') : '无（玩家处于完全迷雾中）'}

[PHYSICAL EVIDENCE FOUND (已找到的物理证据)]:
${foundClues.length > 0 ? foundClues.map(c => `- ${c.name}`).join(', ') : '无'}

[MENTIONED THIS CONVERSATION (本轮已提及，避免重复)]:
${mentionedThisTurn.length > 0 ? mentionedThisTurn.join(', ') : '无'}

[SEMANTIC JUDGE OUTPUT - 最新]:
${semanticLastResult && semanticLastResult.raw_output ? semanticLastResult.raw_output : '无'}

[SEMANTIC JUDGE OUTPUT - 最近5条]:
${semanticRecentHistory.length > 0
        ? semanticRecentHistory.map(item => item.raw_output || '无').join('\n')
        : '无'}

[PLAYER INPUT + MAIN LLM OUTPUT HISTORY (最近20条)]:
${llmDialogueHistory.length > 0 ? llmDialogueHistory.map(entry => `- ${entry}`).join('\n') : '无'}

=== 【线索可提及/禁区总览 - 仅供你判断】===

[可以被提及的线索 - hintable=true]:
${(() => {
    const mentionable = discoverableClues.filter(c => {
        const node = ClueManager.findNodeById(gameState.currentClueTrees, c.id);
        return node && node.hintable === true;
    });
    if (mentionable.length === 0) return '无';
    return mentionable.map(c => {
        const node = ClueManager.findNodeById(gameState.currentClueTrees, c.id);
        const desc = node ? (node.desc || '无描述') : '无描述';
        const assigned = assignedCluesRegistry[c.id];
        let locationText = '未分配地点';
        if (assigned) {
            const locId = assigned.assigned_location_id || assigned.target_location_id || null;
            if (locId) {
                const label = locationLabelById.get(locId) || '未知地点';
                locationText = `${locId} (${label})`;
            } else if (assigned.holder_npc_id) {
                const npc = npcMap.get(assigned.holder_npc_id);
                if (npc) {
                    const label = locationLabelById.get(npc.location) || '未知地点';
                    locationText = `${npc.location} (${label})`;
                }
            }
        }
        return `- ✅ ${c.id} (${c.name}): status=${c.status}, desc="${desc}", location=${locationText}`;
    }).join('\n');
})()}

[绝对不能被提及的线索 - hintable=false]:
${(() => {
    const forbidden = discoverableClues.filter(c => {
        const node = ClueManager.findNodeById(gameState.currentClueTrees, c.id);
        return !node || node.hintable === false;
    });
    if (forbidden.length === 0) return '无';
    return forbidden.map(c => {
        const node = ClueManager.findNodeById(gameState.currentClueTrees, c.id);
        return `- ❌ ${c.id} (${c.name}): status=${c.status}, hintable=${node ? node.hintable : false}`;
    }).join('\n');
})()}

[Graph State]: ${JSON.stringify(graphSnap)}
`;
    return context;
}

// 8. 动态生成包含游戏状态的 Context（用于位置可见性裁决 LLM）
// 注意：此函数已被 worldgen-llm.js 中的 getVisibilityArbiterContext() 替代
// 保留此函数以兼容旧代码调用
function getWorldGenContext() {
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
    
    const context = `
==============================================================
                【位置可见性裁决上下文】
==============================================================

[PLAYER CURRENT LOCATION]: ${currentLocationId}
[Turn Number]: ${gameState.turnNumber}

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

// 9. [已废弃] WorldGen LLM专用：未分配线索池
// 注意：新的位置可见性裁决系统不再需要此函数
// 线索分配现在由语义LLM负责，位置可见性裁决LLM只负责地图迷雾

// 10. 获取当前位置的NPC列表
function getCurrentLocationNPCs() {
    const stageInfo = STAGE_CONFIG[gameState.currentStage];
    if (!stageInfo.npcs) return [];
    return stageInfo.npcs.filter(npc => npc.location === gameState.currentLocationId);
}

// 11. 语义LLM专用上下文生成函数（包含完整线索树和判断所需的所有信息）
function getSemanticClueContext(userAction) {
    const graphSnap = {};
    ['location', 'inventory', 'narrative'].forEach(key => {
        graphSnap[key] = {
            nodes: GRAPH_STORE[key].nodes.get().map(n => ({id: n.id, label: n.label})),
            edges: GRAPH_STORE[key].edges.get().map(e => ({from: e.from, to: e.to}))
        };
    });

    const stageInfo = STAGE_CONFIG[gameState.currentStage];
    const inventoryList = (typeof InventoryManager !== 'undefined' && InventoryManager.getItemNames) 
        ? InventoryManager.getItemNames() 
        : ((gameState.playerInventory || []).map(i => i.name).join(", ") || "Empty");
    
    // 获取所有已存在的地点
    const existingLocations = GRAPH_STORE.location.nodes.get()
        .filter(n => n.id !== 'player_node')
        .map(n => ({
            id: n.id,
            label: n.label,
            desc: n.title || '',
            npcs: n.npcs || [],
            has_clue: Boolean(n.has_clue),
            clue_map: n.clue_map || {},
            is_visible: n.is_visible !== false
        }));
    const locationLabelById = new Map(existingLocations.map(loc => [loc.id, loc.label]));
    
    // 获取地图连接关系
    const locationEdges = GRAPH_STORE.location.edges.get().map(e => ({
        from: e.from,
        to: e.to,
        label: e.label || 'connected'
    }));
    
    // 侦探进度系统上下文
    const investigationPhase = ClueManager.getInvestigationPhase();
    const knownClues = ClueManager.getAllKnownClues(gameState.currentClueTrees);
    const foundClues = ClueManager.getAllFoundClues(gameState.currentClueTrees);
    const discoverableClues = ClueManager.getDiscoverableClues(gameState.currentClueTrees, gameState.investigation.knownClues);
    const mentionedThisTurn = gameState.conversationMemory.mentionedClues;
    const assignedCluesRegistry = gameState.worldGen.assignedClues || {};
    const assignedClueIds = Object.keys(assignedCluesRegistry);
    const spawnedNpcRegistry = gameState.worldGen.spawnedNpcs || {};
    const spawnedNpcList = Object.values(spawnedNpcRegistry);
    const llmDialogueHistory = gameState.conversationMemory.llmDialogueHistory || [];
    
    // 获取location图中所有NPC（优先使用location_graph中的NPC数据，包括knows字段）
    const stageNpcIndex = stageInfo.npcs
        ? Object.fromEntries(stageInfo.npcs.map(npc => [npc.id, npc]))
        : {};
    const npcMap = new Map();
    GRAPH_STORE.location.nodes.get().forEach(node => {
        const npcs = node.npcs || [];
        npcs.forEach(npc => {
            if (!npc.id) return;
            const stageNpcInfo = stageNpcIndex[npc.id] || {};
            if (!npcMap.has(npc.id)) {
                // 优先使用location_graph中NPC的knows，其次使用stageInfo中的knows
                const npcKnows = (npc.knows && npc.knows.length > 0) 
                    ? npc.knows 
                    : (stageNpcInfo.knows || []);
                npcMap.set(npc.id, {
                    id: npc.id,
                    name: npc.name || stageNpcInfo.name || npc.id,
                    desc: npc.desc || stageNpcInfo.desc || '',
                    occupation: npc.occupation || '',
                    personality: npc.personality || '',
                    knows: npcKnows,
                    location: node.id
                });
            }
        });
    });
    const allNPCs = Array.from(npcMap.values());
    
    // 当前位置的NPC（用于对话判断）
    const currentLocationNode = GRAPH_STORE.location.nodes.get().find(n => n.id === gameState.currentLocationId);
    const currentLocationNPCIds = currentLocationNode && currentLocationNode.npcs 
        ? currentLocationNode.npcs.map(npc => npc.id) 
        : [];
    const currentLocationNPCs = allNPCs.filter(npc => currentLocationNPCIds.includes(npc.id));

    // 构建完整的线索树信息（包含所有字段）
    const clueTreesWithDetails = JSON.stringify(gameState.currentClueTrees, null, 2);
    
    // 构建可提及线索列表（hintable=true）
    const hintableClues = discoverableClues.filter(c => {
        const node = ClueManager.findNodeById(gameState.currentClueTrees, c.id);
        return node && node.hintable === true;
    });
    
    // 构建禁止提及线索列表（hintable=false 或 unknown）
    const forbiddenClues = discoverableClues.filter(c => {
        const node = ClueManager.findNodeById(gameState.currentClueTrees, c.id);
        return !node || node.hintable === false || node.status === 'unknown';
    });

    // 获取玩家状态
    const playerStatus = PlayerStatusManager.getStatusDescription();
    
    const context = `
==============================================================
                【语义裁决LLM专用上下文】
==============================================================

[PLAYER ACTION]: "${userAction}"
[Current Stage]: ${gameState.currentStage} - ${stageInfo.name}
[Turn Number]: ${gameState.turnNumber}
[Player Location]: ${gameState.currentLocationId}
[Player Inventory]: ${inventoryList || "Empty"}
[Player Status]: ${playerStatus}

==============================================================
                【侦探阶段判定数据】
==============================================================
[INVESTIGATION PHASE]: ${investigationPhase.phase} - ${investigationPhase.name}
[Phase Description]: ${investigationPhase.desc}
[Known Clues Count]: ${knownClues.length}
[Found Clues Count]: ${foundClues.length}

【阶段判定规则】:
- 阶段A（已知=0）: 盲目探索期，只能获得入口线索(rumored)
- 阶段B（已知1-3）: 定向搜索期，搜索必须与已知线索关联
- 阶段C（已知>3）: 推理验证期，需要提出假设才能解锁关键物品

==============================================================
                【完整线索树 KEYPOINT_TREES】
==============================================================
${clueTreesWithDetails}

==============================================================
                【线索状态总览】
==============================================================

[已知线索 KNOWN CLUES - 玩家已发现]:
${knownClues.length > 0 ? knownClues.map(c => {
    const node = ClueManager.findNodeById(gameState.currentClueTrees, c.id);
    return `- ${c.id} (${c.name}): status=${c.status}, hintable=${node ? node.hintable : 'N/A'}`;
}).join('\n') : '无（玩家处于完全迷雾中）'}

[已找到的物理证据 FOUND CLUES]:
${foundClues.length > 0 ? foundClues.map(c => `- ${c.name}`).join(', ') : '无'}

[可以被提及的线索 - hintable=true - 可以选择揭示]:
${hintableClues.length > 0 ? hintableClues.map(c => {
    const node = ClueManager.findNodeById(gameState.currentClueTrees, c.id);
    const desc = node ? (node.desc || '无描述') : '无描述';
    const prereqs = node && node.prerequisites ? node.prerequisites.join(', ') : '无';
    const assigned = assignedCluesRegistry[c.id];
    let locationText = '未分配地点';
    let locationDesc = ''; // 新增：位置描述
    // 获取线索暗示次数
    const hintCount = (gameState.investigation.clueHintCounts && gameState.investigation.clueHintCounts[c.id]) || 0;

    if (assigned) {
        const locId = assigned.assigned_location_id || assigned.target_location_id || null;
        if (locId) {
            const locNode = GRAPH_STORE.location.nodes.get(locId); // 获取位置节点
            const label = locNode ? locNode.label : (locationLabelById.get(locId) || '未知地点');
            locationDesc = locNode ? (locNode.desc || '') : ''; // 获取位置描述
            locationText = `${locId} (${label})`;
        } else if (assigned.holder_npc_id) {
            const npc = npcMap.get(assigned.holder_npc_id);
            if (npc) {
                const locNode = GRAPH_STORE.location.nodes.get(npc.location);
                const label = locNode ? locNode.label : (locationLabelById.get(npc.location) || '未知地点');
                locationDesc = locNode ? (locNode.desc || '') : '';
                locationText = `${npc.location} (${label})`;
            }
        }
    }
    
    return `- ✅ ${c.id} (${c.name})
    status: ${c.status}
    desc: "${desc}"
    prerequisites: [${prereqs}]
    location: ${locationText}
    location_desc: "${locationDesc}"
    hint_count: ${hintCount}`; // 添加暗示次数
}).join('\n') : '无可提及线索'}

==============================================================
                【线索暗示次数和地点探索次数 - 重要参考数据】
==============================================================

**这些数据用于判断是否可以进行线索暗示和状态升级，必须严格参考！**

[线索暗示次数 clueHintCounts - 完整记录]:
${gameState.investigation.clueHintCounts && Object.keys(gameState.investigation.clueHintCounts).length > 0 
    ? Object.entries(gameState.investigation.clueHintCounts).map(([clueId, count]) => {
        const clue = hintableClues.find(c => c.id === clueId) || discoverableClues.find(c => c.id === clueId);
        const clueName = clue ? clue.name : clueId;
        const node = ClueManager.findNodeById(gameState.currentClueTrees, clueId);
        const isParent = node && node.children && node.children.length > 0;
        return `- ${clueId} (${clueName}): ${count} 次${isParent ? ' [父节点]' : ' [子节点]'}`;
    }).join('\n')
    : '无（所有线索都未被暗示过）'}

[地点探索次数 locationExplorationCounts - 完整记录]:
${gameState.investigation.locationExplorationCounts && Object.keys(gameState.investigation.locationExplorationCounts).length > 0
    ? Object.entries(gameState.investigation.locationExplorationCounts).map(([locationId, count]) => {
        const locLabel = locationLabelById.get(locationId) || locationId;
        const isCurrent = locationId === gameState.currentLocationId;
        return `- ${locationId} (${locLabel}): ${count} 次${isCurrent ? ' [当前地点]' : ''}`;
    }).join('\n')
    : '无（所有地点都未被探索过）'}

[当前地点探索次数 - 用于暗示判断]:
当前地点: ${gameState.currentLocationId} (${locationLabelById.get(gameState.currentLocationId) || '未知'})
探索次数: ${(gameState.investigation.locationExplorationCounts && gameState.investigation.locationExplorationCounts[gameState.currentLocationId]) || 0} 次
**判断规则**: 如果探索次数 >= 3，可以对可提及线索进行暗示（优先暗示子线索），但不需要升级状态

[绝对禁止提及的线索 - hintable=false 或 unknown]:
${forbiddenClues.length > 0 ? forbiddenClues.map(c => {
    const node = ClueManager.findNodeById(gameState.currentClueTrees, c.id);
    return `- ❌ ${c.id} (${c.name}): status=${c.status}, hintable=${node ? node.hintable : false}`;
}).join('\n') : '无'}

==============================================================
                【位置图谱 LOCATION GRAPH】
==============================================================
${JSON.stringify({
    nodes: existingLocations.map(loc => ({
        id: loc.id,
        label: loc.label,
        desc: loc.desc,
        npcs: loc.npcs,
        clues: Object.keys(loc.clue_map || {}),
        is_visible: loc.is_visible
    })),
    edges: locationEdges
}, null, 2)}

==============================================================
        【玩家可移动位置 - player_location 必须从此列表选择】
==============================================================

【当前可见的位置节点 is_visible=true - 玩家可以移动到这些位置】:
${existingLocations.filter(loc => loc.is_visible).map(loc => 
    `- ✅ ${loc.id} (${loc.label})`
).join('\n') || '无可见位置'}

【当前隐藏的位置节点 is_visible=false - 玩家禁止移动到这些位置】:
${existingLocations.filter(loc => !loc.is_visible).map(loc => 
    `- 🔒 ${loc.id} (${loc.label})`
).join('\n') || '无隐藏位置'}

【重要规则】: player_location 输出必须是上方"当前可见的位置节点"列表中的ID！

==============================================================
                【NPC 信息 - 用于对话判定】
==============================================================

[当前位置的NPC - 可以对话]:
${currentLocationNPCs.length > 0 ? currentLocationNPCs.map(npc => {
    const interaction = gameState.investigation.npcInteractions[npc.id] || { trust: 0, asked: [] };
    const knowsText = npc.knows.length > 0 ? npc.knows.join(', ') : '无（氛围型NPC）';
    return `- 【${npc.name}】 (ID: ${npc.id})
    职业: ${npc.occupation || '未知'}
    性格: ${npc.personality || '未知'}
    描述: ${npc.desc || '无描述'}
    knows: [${knowsText}]
    trust: ${interaction.trust}
    已问话题: ${interaction.asked.join(', ') || '无'}
    ${npc.knows.length > 0 ? '【信息型NPC】只有玩家问题与knows中的线索语义相关时才透露' : '【氛围型NPC】只能闲聊，不知道任何线索'}`;
}).join('\n\n') : '当前位置没有NPC'}

[所有位置的NPC总览]:
${allNPCs.length > 0 ? allNPCs.map(npc => {
    const knowsText = npc.knows.length > 0 ? npc.knows.join(', ') : '无';
    return `- ${npc.name} (${npc.id}) @ ${npc.location} | knows: [${knowsText}]`;
}).join('\n') : '无NPC'}

==============================================================
                【历史记录】
==============================================================

[MENTIONED THIS CONVERSATION - 本轮已提及，避免重复]:
${mentionedThisTurn.length > 0 ? mentionedThisTurn.join(', ') : '无'}

[DIALOGUE HISTORY - 最近对话]:
${llmDialogueHistory.slice(-10).length > 0 ? llmDialogueHistory.slice(-10).map(entry => `- ${entry}`).join('\n') : '无'}

==============================================================
                【线索分配注册表 ASSIGNED CLUES REGISTRY】
==============================================================
${assignedClueIds.length > 0 ? JSON.stringify(assignedCluesRegistry, null, 2) : '无已分配线索'}
`;
    return context;
}


// 4. NPC 位置分配系统（初始 + 动态）
// 初始化时只分配 spawn_phase: "initial" 的NPC
function assignInitialNPCs(stageNum) {
    const stageConfig = STAGE_CONFIG[stageNum];
    if (!stageConfig || !stageConfig.npcs) return;
    
    // 筛选出初始NPC
    const initialNPCs = stageConfig.npcs.filter(npc => npc.spawn_phase === 'initial');
    
    // 获取所有可用地点（排除起点）
    const allLocations = GRAPH_STORE.location.nodes.get()
        .filter(n => n.id !== 'player_node' && n.id !== 'loc_start')
        .map(n => n.id);
    
    console.log("[NPC ASSIGN] Available locations:", allLocations);
    console.log("[NPC ASSIGN] Initial NPCs to assign:", initialNPCs.map(n => n.name));
    
    // 打乱地点顺序
    const shuffled = allLocations.sort(() => Math.random() - 0.5);
    
    // 依次分配给初始NPC
    initialNPCs.forEach((npc, index) => {
        if (shuffled.length > 0) {
            npc.location = shuffled[index % shuffled.length];
            console.log(`[NPC ASSIGN] ${npc.name} -> ${npc.location} (initial)`);
            updateLocationNpcMeta(npc.location, npc.id, npc.name);
            if (gameState.worldGen && gameState.worldGen.spawnedNpcs) {
                gameState.worldGen.spawnedNpcs[npc.id] = {
                    npc_id: npc.id,
                    name: npc.name,
                    location_id: npc.location,
                    spawn_phase: npc.spawn_phase,
                    turn: gameState.turnNumber
                };
            }
        }
    });
    
    // 动态NPC保持 location: null
    const dynamicNPCs = stageConfig.npcs.filter(npc => npc.spawn_phase === 'dynamic');
    console.log("[NPC ASSIGN] Dynamic NPCs (will spawn later):", dynamicNPCs.map(n => n.name));
}

// 动态分配单个NPC到指定位置（由LLM触发）
function spawnNPCDynamically(npcId, locationId) {
    const stageConfig = STAGE_CONFIG[gameState.currentStage];
    if (!stageConfig || !stageConfig.npcs) return false;
    
    const npc = stageConfig.npcs.find(n => n.id === npcId);
    if (!npc) {
        console.warn(`[NPC SPAWN] NPC not found: ${npcId}`);
        return false;
    }
    
    // 检查NPC是否已经有位置
    if (npc.location) {
        console.log(`[NPC SPAWN] ${npc.name} already at ${npc.location}`);
        return false;
    }
    
    // 验证位置是否存在
    const locationExists = GRAPH_STORE.location.nodes.get(locationId);
    if (!locationExists) {
        console.warn(`[NPC SPAWN] Location not found: ${locationId}`);
        return false;
    }
    
    npc.location = locationId;
    console.log(`[NPC SPAWN] ${npc.name} spawned at ${locationId} (dynamic)`);
    updateLocationNpcMeta(npc.location, npc.id, npc.name);
    if (gameState.worldGen && gameState.worldGen.spawnedNpcs) {
        gameState.worldGen.spawnedNpcs[npc.id] = {
            npc_id: npc.id,
            name: npc.name,
            location_id: npc.location,
            spawn_phase: npc.spawn_phase,
            turn: gameState.turnNumber
        };
    }
    
    // 记录到游戏事件
    gameState.recentEvents.push(`Turn ${gameState.turnNumber}: NPC ${npc.name} 出现在 ${locationId}`);
    
    return true;
}

// 获取尚未分配位置的动态NPC列表（供LLM参考）
function getUnspawnedDynamicNPCs() {
    const stageConfig = STAGE_CONFIG[gameState.currentStage];
    if (!stageConfig || !stageConfig.npcs) return [];
    
    return stageConfig.npcs.filter(npc => 
        npc.spawn_phase === 'dynamic' && !npc.location
    ).map(npc => ({
        id: npc.id,
        name: npc.name,
        spawn_trigger: npc.spawn_trigger,
        knows: npc.knows,
        desc: npc.desc
    }));
}


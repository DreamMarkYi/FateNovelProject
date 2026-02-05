// 8. Boss LLM 通信与处理
function getBossGameContext() {
    // 获取地图拓扑
    const locationNodes = GRAPH_STORE.location.nodes.get().map(n => ({
        id: n.id,
        label: n.label
    }));
    const locationEdges = GRAPH_STORE.location.edges.get().map(e => ({
        from: e.from,
        to: e.to
    }));
    
    // 使用新的树状结构获取可用关键物品（未被发现的线索）
    const discoverableClues = ClueManager.getDiscoverableClues(
        gameState.currentClueTrees, 
        gameState.investigation.knownClues
    );
    const availableKeypoints = discoverableClues
        .filter(c => c.status === 'unknown')
        .map(c => ({ id: c.id, name: c.name, desc: c.desc }));
    
    // Boss持有的物品（需要从bossAgent获取）
    const bossKeypoints = bossAgent.heldKeypoints.map(kpId => {
        const node = ClueManager.findNodeById(gameState.currentClueTrees, kpId);
        return node ? { id: node.id, name: node.name } : { id: kpId, name: 'Unknown' };
    });
    
    return {
        playerLocation: gameState.currentLocationId,
        playerHP: gameState.playerHP,
        inCombat: gameState.inCombat,
        turnNumber: gameState.turnNumber,
        availableKeypoints: availableKeypoints,
        bossKeypoints: bossKeypoints,
        locationGraph: {
            nodes: locationNodes,
            edges: locationEdges
        },
        recentEvents: gameState.recentEvents.slice(-5)
    };
}

async function callBossLLM() {
    const gameContext = getBossGameContext();
    
    // 构建Boss上下文
    const nodesList = gameContext.locationGraph.nodes.map(n => n.id + '(' + n.label + ')').join(', ');
    const edgesList = gameContext.locationGraph.edges.map(e => e.from + ' <-> ' + e.to).join(', ');
    const recentEventsList = gameContext.recentEvents.join('\n') || 'None';
    
    const bossContextStr = `
[BOSS CURRENT STATE]
${JSON.stringify(bossAgent.toContext(), null, 2)}

[GAME WORLD STATE]
- Player Location: ${gameContext.playerLocation}
- Player HP: ${gameContext.playerHP}
- In Combat: ${gameContext.inCombat}
- Turn Number: ${gameContext.turnNumber}
- Same Location as Player: ${bossAgent.isAtSameLocation(gameContext.playerLocation)}

[AVAILABLE KEYPOINTS (未被获取)]
${JSON.stringify(gameContext.availableKeypoints, null, 2)}

[BOSS HELD KEYPOINTS]
${JSON.stringify(gameContext.bossKeypoints, null, 2)}

[MAP TOPOLOGY]
Nodes: ${nodesList}
Edges: ${edgesList}
(你是老练的特工，你会优先检查那些听起来像是藏匿点的节点名称)

[RECENT EVENTS]
${recentEventsList}

[DECISION CONSTRAINTS]
1. 你的首要目标是 Keypoints。如果当前位置名为"仓库"、"机房"等且你未搜索过，请执行 "search"。
2. 不要作弊式追踪玩家。表现出你作为一个独立特工的探索逻辑。
3. 注意你和玩家同样有被迷雾限制，你也需要足够多的信息才能确定玩家位置，因此你的行为更多的也是进行探索
4. 如果与玩家同位置，必须处理遭遇。
`;

    const messages = [
        { role: "system", content: BOSS_SYSTEM_PROMPT },
        ...bossAgent.conversationHistory.slice(-6),
        { role: "user", content: bossContextStr + getBossJsonInstruction() }
    ];
    if (window.logLlmConsoleInput) {
        window.logLlmConsoleInput('boss', 'system', BOSS_SYSTEM_PROMPT);
        window.logLlmConsoleInput('boss', 'user', bossContextStr + getBossJsonInstruction());
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
                messages: messages,
                temperature: 0.8,
                response_format: { type: "json_object" }
            })
        });
        
        if (!response.ok) throw new Error("Boss LLM API Error");
        const data = await response.json();
        const rawContent = data.choices[0].message.content;
        
        console.log("[BOSS LLM Response]:", rawContent);
        if (window.logLlmConsole) {
            window.logLlmConsole('boss', 'output', rawContent);
        }
        
        // 使用统一的JSON解析函数
        const result = parseLlmJsonResponse(rawContent);
        
        // 更新Boss对话历史
        bossAgent.conversationHistory.push({ 
            role: "assistant", 
            content: JSON.stringify({ action: result.decision, state: result.new_state })
        });
        if (bossAgent.conversationHistory.length > 10) {
            bossAgent.conversationHistory = bossAgent.conversationHistory.slice(-8);
        }
        
        return result;
    } catch (error) {
        console.error("[BOSS LLM Error]:", error);
        if (window.logLlmConsole) {
            window.logLlmConsole('boss', 'output', `ERROR: ${error.message}`);
        }
        // 返回默认行为：巡逻
        return {
            decision: {
                action_type: "wait",
                target_location: null,
                target_entity: null,
                reasoning: "系统故障，保持待命"
            },
            new_state: "patrolling",
            damage_dealt: 0,
            damage_taken: 0,
            keypoint_acquired: null,
            action_narrative: "Phantom的信号出现短暂干扰，他暂时停止了行动...",
            stealth_level: 50,
            threat_assessment: "low",
            detected_player: false,
            special_action: null
        };
    }
}

// ========== 处理Boss决策结果 ==========
async function processBossDecision(bossDecision) {
    if (!bossDecision) return;
    
    // 更新Boss状态
    bossAgent.state = bossDecision.new_state || bossAgent.state;
    
    // 处理伤害
    let hasBossHpChange = false;
    if (bossDecision.damage_dealt > 0) {
        gameState.playerHP = Math.max(0, gameState.playerHP - bossDecision.damage_dealt);
        hasBossHpChange = true;
        appendLog(`[DAMAGE] Phantom 对你造成了 ${bossDecision.damage_dealt} 点伤害！`, 'system', 'color: #ff6666;');
    }
    if (bossDecision.damage_taken > 0) {
        bossAgent.takeDamage(bossDecision.damage_taken);
        hasBossHpChange = true;
    }
    
    // 如果Boss决策中包含了血量变化，显示血量状态
    if (hasBossHpChange) {
        const hpLog = `<span style="color:#00ffcc">你的HP: ${gameState.playerHP}</span> vs <span style="color:#ff3366">Phantom HP: ${bossAgent.hp}</span>`;
        appendLog(`[BATTLE STATUS] ${hpLog}`, 'system', 'border: 1px solid #333; padding: 5px;');
    }
    
    // 处理移动
    const decision = bossDecision.decision;
    if (decision.action_type === 'move' && decision.target_location) {
        // 验证目标位置是否存在
        const targetExists = GRAPH_STORE.location.nodes.get(decision.target_location);
        if (targetExists) {
            bossAgent.moveTo(decision.target_location);
        }
    } else if (decision.action_type !== 'move') {
        // 非移动行为，增加停留回合
        bossAgent.turnsAtCurrentLocation++;
    }
    
    // 处理物品获取
    if (bossDecision.keypoint_acquired) {
        const kp = ClueManager.findNodeById(gameState.currentClueTrees, bossDecision.keypoint_acquired);
        if (kp && kp.status === 'unknown') {
            // Boss获取了线索，更新状态并添加到Boss持有列表
            kp.status = 'boss_held';  // 特殊状态：被Boss持有
            bossAgent.acquireKeypoint(bossDecision.keypoint_acquired);
            updateKeypointUI();
            appendLog(`[WARNING] Phantom 获取了某个关键物品！`, 'system', 'color: #ff3366;');
        }
    }
    
    // 显示Boss行动（根据隐蔽程度决定透露多少信息）
    const isPlayerNearby = bossAgent.isAtSameLocation(gameState.currentLocationId);
    const stealthThreshold = isPlayerNearby ? 100 : 70;
    
    if (bossDecision.stealth_level < stealthThreshold || isPlayerNearby) {
        appendLog(`[RIVAL SIGNATURE] ${bossDecision.action_narrative}`, 'boss');
    } else if (bossDecision.stealth_level < 90) {
        appendLog(`[RIVAL SIGNATURE] 你感觉到远处有动静...`, 'boss');
    }
    // 完全隐蔽则不显示
    
    // 更新高亮
    highlightNodes();
    
    // 添加到最近事件
    gameState.recentEvents.push(`Turn ${gameState.turnNumber}: Boss ${decision.action_type} - ${decision.reasoning}`);
    if (gameState.recentEvents.length > 10) gameState.recentEvents.shift();
}


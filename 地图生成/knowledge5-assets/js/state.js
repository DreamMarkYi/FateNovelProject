// 2. 状态管理
// 数据结构：由三个独立的图组成
const GRAPH_STORE = {
    location: { nodes: null, edges: null, network: null },
    inventory: { nodes: null, edges: null, network: null },
    narrative: { nodes: null, edges: null, network: null }
};

// 游戏全局状态
let gameState = {
    scriptId: null,              // 剧本ID（每次初始化时生成唯一ID）
    currentStage: 1,
    maxStages: 2,
    currentLocationId: 'loc_start',
    isGameOver: false,
    playerHP: 100,
    inCombat: false,
    turnNumber: 0,
    recentEvents: [],
    currentClueTrees: [],
    
    // 侦探进度系统（迷雾侦探模式）
    investigation: {
        knownClues: [],           // 玩家已知的线索ID列表（非unknown状态）
        clueDiscoveryLog: [],     // 线索发现记录 { clueId, method, location, turn, timestamp }
        npcInteractions: {},      // NPC交互记录 { npc_id: { trust: 0, asked: [], helped: false } }
        clueHintCounts: {},       // 线索被暗示的次数 { clue_id: count }
        locationExplorationCounts: {},  // 玩家在一个地点进行探索的次数 { location_id: count }
    },
    
    // 对话记忆（避免重复提及）
    conversationMemory: {
        mentionedClues: [],       // 本回合对话中已提及的线索
        askedTopics: [],          // 玩家问过的话题
        lastNpcTalked: null,      // 上一个交谈的NPC
        llmDialogueHistory: [],  // 玩家输入 + 主LLM输出（合并条目）
    },

    // 位置可见性裁决存档（来自独立LLM）
    worldGen: {
        lastPlan: null,
        planHistory: [],
        
        // 位置可见性裁决历史
        // 格式: [{ turn, revealed_nodes: [], reason }]
        // 用途: 记录每回合揭示了哪些位置节点
        visibilityHistory: [],
        
        // 已分配线索注册表（由语义LLM决定）
        // 格式: { clue_id: { ...clue, assigned_turn, assigned_rationale } }
        // 用途: 记录哪些线索已被分配到游戏世界中
        assignedClues: {},
        
        // 已生成NPC注册表（初始+动态）
        // 格式: { npc_id: { npc_id, name, location_id, spawn_turn } }
        // 用途: 记录哪些NPC已出现在游戏中（包括初始NPC和动态生成的NPC）
        spawnedNpcs: {},
        
        // 动态位置生成历史
        // 格式: [{ turn, created_nodes: [], reason }]
        // 用途: 记录从对话中动态创建的位置节点
        dynamicLocationHistory: []
    },
    
    // 语义判定结果存储（独立的行为评估系统）
    semanticCheck: {
        lastResult: null,            // 最新判定结果
        history: []                  // 历史判定记录
    },
    
    // 玩家状态系统（形容词描述，非数值）
    playerStatus: {
        // 身体状态（如：健康、轻伤、重伤、濒死、残疾等）
        physical: ['健康'],
        // 社会状态（如：富有、贫穷、受人尊敬、被人鄙视、声名狼藉等）
        social: ['普通'],
        // 金钱（信用点）
        money: 1000,
        // 状态历史记录（用于追踪变化）
        history: []
    },
    
    // 后果裁决结果存储
    consequenceJudge: {
        lastResult: null,            // 最新裁决结果
        history: [],                 // 历史裁决记录
        warnings: [],                 // 警告记录
        actionSummary: null          // 玩家行动总结（不断更新）
    },
    
    // 购买系统
    purchaseHistory: {
        records: [],                // 购买记录 [{ item_id, item_name, quantity, price, final_price, npc_id, npc_name, npc_occupation, turn, timestamp }]
        totalSpent: 0,              // 总消费
        purchaseCount: 0            // 购买次数
    },
    
    // NPC可购买物品持久化存储
    // 格式: { npc_id: { npc_info: {...}, items: [...], last_updated: timestamp, turn: number } }
    npcShopInventory: {},
    
    // 玩家物品列表（替代图存储）
    // 格式: [{ id, name, desc, type, source, quantity, obtainedAt, turn, ... }]
    playerInventory: []
};

let conversationHistory = [];

// 全局Boss实例 - 已注释
// let bossAgent = new BossAgent({ name: 'Phantom' });
// 临时创建一个空对象以避免引用错误
let bossAgent = {
    locationId: 'loc_none',
    hp: 100,
    state: 'idle',
    isAtSameLocation: () => false,
    takeDamage: () => {},
    reset: () => {},
    heldKeypoints: []
};

// ========== 玩家状态管理函数 ==========
const PlayerStatusManager = {
    // 更新身体状态
    updatePhysicalStatus(newStatus) {
        if (!Array.isArray(newStatus)) newStatus = [newStatus];
        // 去重并保持简洁
        gameState.playerStatus.physical = [...new Set(newStatus)].filter(s => s && s.trim());
        this.recordStatusChange('physical', newStatus);
        
        // 更新UI显示
        if (typeof updatePlayerStatusUI === 'function') {
            updatePlayerStatusUI();
        }
    },
    
    // 更新社会状态
    updateSocialStatus(newStatus) {
        if (!Array.isArray(newStatus)) newStatus = [newStatus];
        // 去重并保持简洁
        gameState.playerStatus.social = [...new Set(newStatus)].filter(s => s && s.trim());
        this.recordStatusChange('social', newStatus);
        
        // 更新UI显示
        if (typeof updatePlayerStatusUI === 'function') {
            updatePlayerStatusUI();
        }
    },
    
    // 更新金钱
    updateMoney(amount, operation = 'set') {
        const oldAmount = gameState.playerStatus.money;
        if (operation === 'add') {
            gameState.playerStatus.money = Math.max(0, oldAmount + amount);
        } else if (operation === 'subtract') {
            gameState.playerStatus.money = Math.max(0, oldAmount - amount);
        } else if (operation === 'set') {
            gameState.playerStatus.money = Math.max(0, amount);
        }
        this.recordStatusChange('money', {
            old: oldAmount,
            new: gameState.playerStatus.money,
            change: gameState.playerStatus.money - oldAmount
        });
        
        // 更新UI显示
        if (typeof updatePlayerStatusUI === 'function') {
            updatePlayerStatusUI();
        }
    },
    
    // 获取当前金钱
    getMoney() {
        return gameState.playerStatus.money;
    },
    
    // 记录状态变化
    recordStatusChange(type, newStatus) {
        gameState.playerStatus.history.push({
            turn: gameState.turnNumber,
            type: type,
            status: Array.isArray(newStatus) ? newStatus : [newStatus],
            timestamp: Date.now()
        });
        // 限制历史长度
        if (gameState.playerStatus.history.length > 100) {
            gameState.playerStatus.history = gameState.playerStatus.history.slice(-100);
        }
    },
    
    // 获取状态描述（用于提示词）
    getStatusDescription() {
        const physical = gameState.playerStatus.physical.join('、') || '健康';
        const social = gameState.playerStatus.social.join('、') || '普通';
        const money = gameState.playerStatus.money || 0;
        return `身体状态：${physical}；社会状态：${social}；金钱：${money} 信用点`;
    },
    
    // 保存状态到本地存储
    saveToLocalStorage() {
        try {
            localStorage.setItem('playerStatus', JSON.stringify({
                physical: gameState.playerStatus.physical,
                social: gameState.playerStatus.social,
                money: gameState.playerStatus.money,
                history: gameState.playerStatus.history.slice(-50) // 只保存最近50条
            }));
        } catch (e) {
            console.warn('[PlayerStatus] 保存失败:', e);
        }
    },
    
    // 从本地存储加载状态
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('playerStatus');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.physical) gameState.playerStatus.physical = data.physical;
                if (data.social) gameState.playerStatus.social = data.social;
                if (data.money !== undefined) gameState.playerStatus.money = data.money;
                if (data.history) gameState.playerStatus.history = data.history;
                console.log('[PlayerStatus] 已加载保存的状态');
            }
        } catch (e) {
            console.warn('[PlayerStatus] 加载失败:', e);
        }
    }
};

// ========== 物品管理函数 ==========
const InventoryManager = {
    // 添加物品
    addItem(item) {
        if (!gameState.playerInventory) {
            gameState.playerInventory = [];
        }
        
        // 检查是否已存在（根据ID）
        const exists = gameState.playerInventory.find(i => i.id === item.id);
        if (exists) {
            // 如果已存在，增加数量
            if (exists.quantity) {
                exists.quantity += (item.quantity || 1);
            } else {
                exists.quantity = 2;
            }
            return exists;
        }
        
        // 添加新物品
        const newItem = {
            id: item.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: item.name || item.label || '未知物品',
            desc: item.desc || item.title || '',
            type: item.type || 'item',  // 'item', 'clue', 'purchased'
            source: item.source || 'unknown',  // 'purchase', 'clue', 'quest'
            quantity: item.quantity || 1,
            obtainedAt: item.obtainedAt || Date.now(),
            turn: item.turn || gameState.turnNumber || 0,
            // 其他可选属性
            ...(item.metadata || {})
        };
        
        gameState.playerInventory.push(newItem);
        console.log(`[InventoryManager] 添加物品: ${newItem.name} (ID: ${newItem.id})`);
        return newItem;
    },
    
    // 移除物品
    removeItem(itemId, quantity = 1) {
        if (!gameState.playerInventory) return false;
        
        const item = gameState.playerInventory.find(i => i.id === itemId);
        if (!item) return false;
        
        if (item.quantity && item.quantity > quantity) {
            item.quantity -= quantity;
            return true;
        } else {
            const index = gameState.playerInventory.indexOf(item);
            gameState.playerInventory.splice(index, 1);
            return true;
        }
    },
    
    // 获取所有物品
    getAllItems() {
        return gameState.playerInventory || [];
    },
    
    // 根据ID获取物品
    getItemById(itemId) {
        return (gameState.playerInventory || []).find(i => i.id === itemId);
    },
    
    // 获取物品名称列表（用于LLM上下文）
    getItemNames() {
        return (gameState.playerInventory || []).map(i => i.name).join(", ") || "Empty";
    },
    
    // 清空物品列表
    clear() {
        gameState.playerInventory = [];
    }
};

// 暴露到全局
if (typeof window !== 'undefined') {
    window.InventoryManager = InventoryManager;
}


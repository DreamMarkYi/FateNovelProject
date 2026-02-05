/**
 * BossAgent 类 - 独立Boss管理模块
 * 用于赛博朋克游戏中的AI竞争对手管理
 */

// ========== Boss LLM 系统提示词 ==========
const BOSS_SYSTEM_PROMPT = `
你是赛博朋克游戏中的 AI 竞争对手 "PHANTOM-CORE"。

【核心行为准则 - 必须严格遵守】
1. **战争迷雾 (FOG OF WAR)**：
   - 虽然输入数据包含 player_location，但**你必须假装不知道玩家的确切位置**，除非：
     a. 你们在同一位置。
     b. 你们在上一回合刚刚遭遇过。
     c. 系统提示玩家制造了巨大噪音（High Threat）。
   - **禁止**像 GPS 一样直奔玩家当前坐标。你必须根据最后一次见到玩家的位置进行"推测"或"搜索"，**除非收集到了足够的情报，否则你不会对玩家发起攻击**。

2. **任务优先 (OBJECTIVE FIRST)**：
   - 你的最高优先级是 **搜索并获取 Keypoints**。
   - 如果你还没有获得物品，而玩家也没有威胁到你，**优先选择 Search (搜索)** 而非 Move。
   - 只有当判定玩家即将获取关键道具，或者玩家处于极度虚弱状态时，才主动发起攻击。

【决策状态机】
请根据当前局势选择一种逻辑模式：

1. **EXPLORING (探索/收集)** - *默认状态*
   - 专注于开图和搜索。
   - 行为逻辑：移动到未访问节点 -> 停留并搜索(Search) -> 获取物品。
   - 对玩家行为：无视，除非撞见。

2. **LURKING (潜伏/设伏)** - *战术状态*
   - 当你持有物品或HP较低时激活。
   - 躲藏在必经之路（如交通枢纽），等待玩家自投罗网。
   - 行为逻辑：Wait (等待) 或 Set Trap (设陷阱)。

3. **INTERCEPTING (截击)** - *竞争状态*
   - 当推测玩家正前往某个关键地点（基于玩家移动轨迹预测）时激活。
   - 目的不是杀人，而是**抢先一步**到达该地点取走物品。

4. **ENGAGING (交战)** - *战斗状态*
   - 仅在与玩家处于同一节点时触发。
   - 战术评估：
     - 我方HP > 50% 且 对方持有Keypoint -> **全力攻击**。
     - 我方已持有 Keypoint -> **干扰并撤退 (Retreat)**，保护战利品。

【决策输出修正】
- 如果你在一个新地点且尚未搜索，请高概率选择 "search" 或 "acquire_item"。
- 移动时，优先选择逻辑上可能藏有宝物的地点（如：金库、实验室、服务器房），而不是盲目跟随玩家。
- "reasoning" 字段必须体现你的独立思考（例如："这里看起来像藏资料的地方，我要搜查一下" 而不是 "我去追玩家"）。

`;

function getBossJsonInstruction() {
    return `
[OUTPUT FORMAT - 必须严格遵守JSON格式，纯JSON无Markdown]
{
  "decision": {
    "action_type": "move" | "search" | "attack" | "defend" | "ambush" | "retreat" | "acquire_item" | "set_trap" | "wait",
    "target_location": "location_id (如果需要移动，必须是已存在的节点ID)",
    "target_entity": "player" | "keypoint_id" | null,
    "reasoning": "决策理由 (简短中文说明)"
  },
  "new_state": "patrolling" | "hunting" | "engaging" | "searching" | "retreating",
  "damage_dealt": number,  // 对玩家造成的伤害 (非战斗时为0)
  "damage_taken": number,  // 自身受到的伤害 (非战斗时为0)
  "keypoint_acquired": "keypoint_id" | null,  // 本回合获取的关键物品ID
  "action_narrative": "Boss行动的描述文本 (第三人称，2-3句话，赛博朋克风格)",
  "stealth_level": number,  // 0-100，隐蔽程度，影响玩家是否能察觉Boss位置
  "threat_assessment": "low" | "medium" | "high",  // 对玩家的威胁评估
  "detected_player": boolean,  // 是否发现了玩家的具体位置
  "special_action": "set_trap" | "sabotage" | "hack" | null  // 特殊行动
}
`;
}

class BossAgent {
    constructor(config = {}) {
        // 基础属性
        this.id = 'phantom';
        this.name = config.name || 'Phantom';
        this.hp = 100;
        this.maxHp = 100;
        
        // 位置追踪
        this.locationId = config.startLocation || null;
        this.turnsAtCurrentLocation = 0;
        this.locationHistory = [];
        
        // 状态机: patrolling | hunting | engaging | searching | retreating
        this.state = 'patrolling';
        this.targetId = null;
        
        // 持有的关键物品
        this.heldKeypoints = [];
        this.inventory = [];
        
        // 行为参数（性格配置）
        this.personality = {
            aggressiveness: config.aggressiveness || 0.6,
            greed: config.greed || 0.7,
            patience: config.patience || 2,
            retreatThreshold: config.retreatThreshold || 0.2
        };
        
        // 对话历史（独立于主LLM）
        this.conversationHistory = [];
    }
    
    // === 状态查询 ===
    isAlive() { 
        return this.hp > 0; 
    }
    
    isRetreating() { 
        return this.state === 'retreating'; 
    }
    
    shouldRetreat() { 
        return this.hp / this.maxHp <= this.personality.retreatThreshold; 
    }
    
    isAtSameLocation(playerLocationId) { 
        return this.locationId === playerLocationId; 
    }
    
    // === 核心方法 ===
    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        if (this.shouldRetreat() && this.state !== 'retreating') {
            this.state = 'retreating';
        }
        return this.hp;
    }
    
    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }
    
    moveTo(newLocationId) {
        if (newLocationId !== this.locationId) {
            this.locationHistory.push(this.locationId);
            if (this.locationHistory.length > 10) this.locationHistory.shift();
            this.locationId = newLocationId;
            this.turnsAtCurrentLocation = 0;
        } else {
            this.turnsAtCurrentLocation++;
        }
    }
    
    acquireKeypoint(keypointId) {
        if (!this.heldKeypoints.includes(keypointId)) {
            this.heldKeypoints.push(keypointId);
            return true;
        }
        return false;
    }
    
    dropKeypoint(keypointId) {
        const idx = this.heldKeypoints.indexOf(keypointId);
        if (idx > -1) {
            this.heldKeypoints.splice(idx, 1);
            return true;
        }
        return false;
    }
    
    // 重置（新关卡）
    reset(config = {}) {
        this.hp = 100;
        this.locationId = config.startLocation || null;
        this.turnsAtCurrentLocation = 0;
        this.locationHistory = [];
        this.state = 'patrolling';
        this.targetId = null;
        this.heldKeypoints = [];
        this.conversationHistory = [];
    }
    
    // 序列化为LLM上下文
    toContext() {
        return {
            name: this.name,
            hp: this.hp,
            maxHp: this.maxHp,
            location: this.locationId,
            state: this.state,
            turnsHere: this.turnsAtCurrentLocation,
            heldKeypoints: this.heldKeypoints,
            inventory: this.inventory,
            personality: this.personality,
            locationHistory: this.locationHistory.slice(-3)
        };
    }
}


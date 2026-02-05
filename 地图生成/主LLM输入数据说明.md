# 主LLM（内容生成）输入数据说明

## 概述
主LLM是游戏的叙事生成器，负责根据前置裁决系统的决策生成沉浸式的游戏叙事文本。

## 输入数据结构

### 1. System Prompt（系统提示词）
**来源**: `prompts.js` 中的 `SYSTEM_PROMPT`

**内容包含**:
- 角色定位：纯叙事生成器，不负责决策
- 叙事风格：硬核侦探风格（Show, Don't Tell）
- 位置发现叙事规则（根据 visibility_updates）
- 线索叙事规则（根据 clue_reveals）
- NPC对话规则
- 战斗系统规则
- 输出格式要求（严格JSON）

### 2. Conversation History（对话历史）
**来源**: `conversationHistory` 数组

**内容**:
- 最近10条对话记录
- 格式：`[{ role: "user", content: "..." }, { role: "assistant", content: "..." }]`

### 3. User Content（用户输入内容）
**来源**: `callMainLLM()` 函数中构建的 `userContent`

#### 3.1 Context（游戏上下文）
**生成函数**: `getGameContext(userAction)` (context.js)

**包含内容**:

##### 基础信息
- `[Current Stage]`: 当前关卡编号和名称
- `[Objective]`: 关卡目标（需要整合的核心线索树数量）
- `[Turn Number]`: 当前回合数
- `[Player HP]`: 玩家生命值
- `[Player Location]`: 玩家当前位置ID
- `[Player Inventory]`: 玩家物品清单

##### 位置图谱（Location Graph）
- **完整位置图谱JSON**:
  ```json
  {
    "nodes": [
      {
        "id": "位置ID",
        "label": "位置名称",
        "desc": "位置描述",
        "npcs": [NPC数组],
        "clues": [线索ID数组]
      }
    ],
    "edges": [连接关系数组]
  }
  ```
- **地图连接关系**: 所有位置之间的连接关系列表

##### 迷雾侦探系统状态
- `[INVESTIGATION PHASE]`: 当前调查阶段（A/B/C）
- `[Phase Description]`: 阶段描述
- `[ALREADY REVEALED CLUES]`: 玩家已知的线索列表（避免重复描述）
- `[PHYSICAL EVIDENCE FOUND]`: 已找到的物理证据
- `[MENTIONED THIS CONVERSATION]`: 本轮已提及的线索（避免重复）

##### 语义判定系统输出
- `[SEMANTIC JUDGE OUTPUT - 最新]`: 最新一次语义判定的原始输出
- `[SEMANTIC JUDGE OUTPUT - 最近5条]`: 最近5次语义判定的输出

##### 对话历史
- `[PLAYER INPUT + MAIN LLM OUTPUT HISTORY]`: 最近20条对话记录

##### 搜索尝试记录
- `[SEARCH ATTEMPTS AT THIS LOCATION]`: 当前位置的搜索次数

##### 线索可提及/禁区总览
- **可以被提及的线索** (hintable=true):
  - 线索ID、名称、状态、描述
  - 分配位置信息
- **绝对不能被提及的线索** (hintable=false):
  - 线索ID、名称、状态、hintable状态

##### Graph State
- 位置图、物品图、叙事图的快照（nodes和edges）

#### 3.2 Boss状态信息
**格式**:
```
[BOSS STATUS - READ ONLY, 由独立系统控制]
- Boss Location: Boss位置ID
- Boss HP: Boss生命值
- Boss State: Boss状态
- Same Location as Player: 是否与玩家在同一位置
- In Combat: 是否在战斗中
```

#### 3.3 Player Action（玩家行动）
- 玩家输入的原始文本

#### 3.4 VISIBILITY_DECISION（位置可见性裁决结果）
**来源**: `callWorldGenLLM()` 的返回值

**包含内容**:
```json
{
  "should_reveal_any": true/false,
  "visibility_updates": [
    {
      "node_id": "位置节点ID",
      "new_visibility": true,
      "reveal_type": "exploration | npc_hint | clue_discovery | forced_entry",
      "narrative_hint": "位置发现描述"
    }
  ],
  "thinking_summary": "思考过程摘要"
}
```

**说明**:
- 由位置可见性裁决LLM提供
- 描述哪些新位置被揭示
- 包含新发现位置的列表和发现方式

#### 3.5 CLUE_REVEAL_DECISION（语义线索裁决结果）
**来源**: `callSemanticClueLLM()` 的返回值

**包含内容**:
```json
{
  "should_reveal": true/false,
  "clue_reveals": [
    {
      "id": "线索ID",
      "new_status": "rumored | hinted | found",
      "narrative_hook": "线索描述文本"
    }
  ],
  "npc_interaction": {
    "npc_id": "NPC的ID 或 null",
    "response_type": "clue_reveal | gossip | idle_chat"
  },
  "most_relevant_clue": "最相关的线索ID",
  "thinking_summary": "思考过程摘要"
}
```

**说明**:
- 由语义线索裁决LLM提供
- 必须原样使用，不能修改
- 包含要揭示的线索列表和NPC交互类型

#### 3.6 叙事生成指令
**包含内容**:
- 位置发现叙事规则（根据 reveal_type）
- 线索叙事规则（根据 new_status）
- NPC对话规则（根据 response_type）
- 禁止修改决策结果的提醒
- 战斗逻辑请求
- 当前图谱节点列表
- Boss遭遇描述要求
- 叙事风格指南（赛博朋克氛围）

#### 3.7 JSON输出格式指令
**来源**: `getJsonInstruction()` (prompts.js)

**输出格式要求**:
```json
{
  "narrative": "剧情文本 (HTML格式)",
  "current_location_id": "玩家当前位置ID",
  "loot_obtained": null,
  "side_quest_event": null,
  "stage_complete": false,
  "game_over": false,
  "ending_type": null,
  "is_punishment": false
}
```

## 完整输入消息结构

```javascript
messages: [
  {
    role: "system",
    content: SYSTEM_PROMPT  // 系统提示词
  },
  ...conversationHistory,  // 对话历史（最多10条）
  {
    role: "user",
    content: userContent  // 包含所有上下文和决策信息
  }
]
```

## 关键数据来源

### 前置LLM调用
1. **位置可见性裁决LLM** (`callWorldGenLLM`)
   - 输入：玩家行动、世界生成上下文、Boss状态
   - 输出：位置可见性决策（visibility_updates）

2. **语义线索裁决LLM** (`callSemanticClueLLM`)
   - 输入：玩家行动、位置可见性结果、语义上下文
   - 输出：线索揭示决策（clue_reveals）

### 状态数据来源
- `gameState`: 游戏状态（位置、HP、回合数等）
- `GRAPH_STORE`: 图谱存储（位置、物品、叙事图）
- `STAGE_CONFIG`: 关卡配置
- `ClueManager`: 线索管理器（线索树、状态等）
- `bossAgent`: Boss代理（位置、HP、状态）

## 注意事项

1. **职责分离**: 主LLM只负责叙事生成，不负责决策
2. **必须遵守**: 必须严格按照 VISIBILITY_DECISION 和 CLUE_REVEAL_DECISION 生成叙事
3. **禁止修改**: 不能添加、删除或修改决策结果
4. **状态一致性**: 输出的 clue_reveals 会被强制替换为语义LLM的决策结果
5. **对话历史**: 会自动更新对话历史，保持连贯性






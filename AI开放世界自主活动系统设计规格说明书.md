# AI开放世界自主活动系统设计规格说明书

## 1. 系统概述与设计目标

本系统旨在构建一个**混合式神经符号游戏引擎（Hybrid Neuro-Symbolic Game Engine）**，用于在主线剧情的“空白期”生成高自由度、逻辑自洽且与世界观严格一致的玩家自主活动。

**核心设计原则：**

1. **主线优先（Canonical Supremacy）：** 所有的生成内容必须是主线剧情的子集或补充，绝不与其冲突。
2. **事件驱动架构（Event-Driven Architecture）：** 世界不是静态等待玩家，而是由玩家行为和世界状态变化动态触发事件。
3. **结构化输出（Structured Generation）：** AI不直接输出对话文本给玩家，而是输出包含逻辑、状态和资产引用的JSON数据，由游戏引擎渲染 1。

------

## 2. 总体系统架构 (System Architecture)

系统采用**云-边-端（Cloud-Edge-Client）**分层架构，以平衡计算成本与响应延迟。

### 2.1 架构拓扑图

代码段

```
graph TD
    subgraph Client [游戏客户端 (Unity/Unreal)]
        Input[玩家行为捕获] --> Trigger[语义触发器]
        Trigger --> |Context JSON| API_Gateway
        Renderer[任务/事件渲染器] <-- |Event JSON| API_Gateway
        LocCache[本地状态缓存]
    end

    subgraph Backend [云端核心系统]
        API_Gateway[API 网关] --> Orchestrator[编排引擎 (LangGraph)]
        
        subgraph Brain [叙事中枢]
            LLM_Gen[生成模型 (Generator Agent)]
            LLM_Critic[审查模型 (Critic/Validator Agent)]
            Logic_Solver[逻辑求解器 (Z3/Python)]
        end
        
        subgraph Memory [知识与状态层]
            KG[(时序知识图谱 - Neo4j/Memgraph)]
            VecDB
            RuleDB[(规则与约束库)]
        end
        
        Orchestrator --> Brain
        Orchestrator --> Memory
    end
```

### 2.2 核心模块定义

1. **语义触发器 (Semantic Triggers - Client Side):**
   - **功能：** 监听游戏内的遥测数据（位置、时间、物品、近期行为）。
   - **逻辑：** 不使用简单的 `if (x > 10)`，而是使用基于标签的模糊匹配。例如，当“玩家处于(危险区) AND 时间是(夜晚) AND 玩家(受伤)”时，打包当前状态发送给后端 3。
2. **编排引擎 (Orchestration Engine - Backend):**
   - **技术选型：** LangGraph 或 Temporal.io。
   - **职责：** 管理生成流程的状态机，协调检索、生成、验证、重试等步骤。
3. **时序知识图谱 (Temporal Knowledge Graph - Memory):**
   - **技术选型：** Memgraph 或 Graphiti (基于 Zep)。
   - **核心特性：** 不同于静态图谱，这里的每条边都有 `valid_from` 和 `valid_to` 属性。
   - **作用：** 确保存储的“事实”随游戏时间线演变。例如 `(:NPC_A)-[:位于]->(:Location_B)` 仅在 `Chapter_2` 有效 4。

------

## 3. 数据层设计 (Data Layer Design)

为了控制生成范围，必须将“世界设定”数字化为机器可读的Schema。

### 3.1 动态事件数据结构 (JSON Schema)

这是AI生成模块必须严格遵守的输出格式，用于驱动游戏引擎生成任务。

JSON

```
{
  "$schema": "http://example.com/schemas/dynamic_event.json",
  "type": "object",
  "properties": {
    "event_id": { "type": "string", "description": "唯一事件ID" },
    "narrative_context": {
      "type": "object",
      "properties": {
        "title": { "type": "string", "description": "任务标题" },
        "summary": { "type": "string", "description": "给玩家的简报" },
        "lore_anchor": { "type": "string", "description": "关联的图谱节点ID，用于一致性检查" }
      }
    },
    "gameplay_directives": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "step_order": { "type": "integer" },
          "action_type": { "enum": },
          "target_entity_id": { "type": "string", "description": "涉及的NPC或物品ID" },
          "location_vector": { 
              "x": "float", "y": "float", "z": "float",
              "radius": "float" 
          },
          "conditions": {
            "required_items": ["item_id"],
            "required_time": "string (e.g., 'NIGHT')"
          }
        }
      }
    },
    "constraints_validation": {
      "forbidden_entities": ["main_plot_critical_npcs"],
      "safety_hash": "string"
    }
  }
}
```

### 3.2 知识图谱本体 (Ontology)

我们需要在图数据库中定义以下节点和关系，以形成“世界围栏” 5：

- **Nodes (节点):** `Agent` (角色), `Location` (地点), `Event` (历史事件), `Faction` (阵营), `Object` (关键物品).
- **Edges (关系):**
  - `(:Agent)-->(:Faction)`
  - `(:Location)-->(:Faction)`
  - `(:Event)-->(:Event)` (时序约束)
  - `(:Agent)-->(:Fact)` (知识权限管理，防止剧透)

------

## 4. 核心工作流设计 (Core Workflows)

### 4.1 “受控生成”流水线 (The Controlled Generation Pipeline)

当一个生成请求到达后端时，系统执行以下五步操作：

1. **上下文锚定 (Context Anchoring):**
   - 利用 **GraphRAG** 技术。根据玩家当前坐标和状态，在知识图谱中检索半径 N 内的实体、当前章节允许公开的历史事件 7。
   - *输出：* 一组相关的三元组 (Triples) 和 文本摘要。
2. **提示词组装 (Prompt Assembly):**
   - 将检索到的上下文填入 **System Prompt**。
   - *关键指令：* "你是一个地牢主宰。你必须使用提供的实体ID。你不能提及 中的内容。"
3. **初始生成 (Draft Generation):**
   - LLM (如 GPT-4o 或 Claude 3.5 Sonnet) 生成初步的 JSON 结构。
4. **逻辑校验与修正 (The Critic Loop):**
   - **Validator Agent:** 解析生成的JSON。
   - **Constraint Check:** 检查 `target_entity_id` 是否在“死亡名单”中？任务地点是否在“未解锁区域”？
   - **Logic Solver:** 如果涉及复杂谜题，使用 Z3 Solver 验证逻辑是否有解。
   - *分支：* 如果校验失败，将错误信息反馈给 LLM 进行“自我修正” (Self-Correction)，最多重试 3 次。
5. **资产实例化 (Asset Instantiation):**
   - 通过校验的 JSON 发回客户端。客户端的任务管理器 (Quest Manager) 根据 `action_type` 和 `location_vector` 动态生成触发器、生成NPC预制体 (Prefab) 并加载对应对话。

### 4.2 动态世界状态同步 (Live World State Sync)

为了保证“有趣”，玩家的行为必须改变世界。

- **写入机制 (Write-Back):** 当玩家完成生成的事件（例如“烧毁了走私者的帐篷”），客户端发送 `WorldStateUpdate` 事件。

- 图谱更新: 后端接收事件，执行 Cypher 查询更新图谱：

  MATCH (n:Location {id: 'Smuggler_Tent'}) SET n.status = 'DESTROYED', n.destroyed_by = 'Player'

- **后续影响:** 下次生成时，GraphRAG 会检索到该地点已毁，LLM 可能会生成“走私者正在寻找纵火者”的复仇事件，而非再次生成“去帐篷交易”的任务。

------

## 5. 安全与一致性护栏 (Guardrails & Consistency)

为了实现“控制在主线剧情范围之内”，我们需要多层防御体系。

### 5.1 NeMo Guardrails 配置

使用 NVIDIA NeMo Guardrails 定义可编程的对话与行为边界 9。

Python

```
# config/rails.co
define flow prevent_spoiler
  user ask about "EndGameBoss"
  bot refuse answer
  bot respond "那个名字在风中消逝了，没人知道它是谁。"

define flow check_location_access
  $current_chapter = execute get_current_chapter()
  $target_location = $context.location
  if $target_location.unlock_chapter > $current_chapter
    bot respond "通往那里的道路被某种力量封印了。"
    stop
```

### 5.2 幻觉拦截器

- **实体一致性检查:** 强制 LLM 只能从 `Available_Entities_List` 中选择角色，禁止虚构新的人名或地名。
- **批评者模型 (Critic Model):** 一个专门微调过的轻量级模型，只负责给生成的内容“挑刺”。例如，检查是否出现了该时代不该有的科技（如在古代背景出现“手机”）。

------

## 6. 趣味性设计策略 (Design for Fun)

仅有逻辑是不够的，系统需引入设计模式以增强趣味性。

1. **程序化侦探谜题 (Procedural Mystery Generation):**
   - 利用图谱的路径查找算法 (Pathfinding)。随机选定一个“凶手”和一个“受害者”，让算法找出两者在图谱中的最短路径（例如：A -> 借钱 -> B -> 仇恨 -> C）。LLM 负责将这条路径“叙事化”为线索链（借条、日记、目击证词），散布在游戏世界中供玩家发现。
2. **节奏控制器 (Pacing Manager):**
   - 避免事件生成的疲劳轰炸。引入“强度曲线”管理。系统维护一个 `Current_Tension_Level` (当前张力值)。
   - 当主线刚结束高潮战斗，系统强制生成 `Relaxation` (休闲) 类事件（如钓鱼、送信）；当玩家长时间无操作，生成 `Conflict` (冲突) 类事件。
3. **涌现式派系互动:**
   - 模拟派系（Factions）的后台运作。即使玩家不参与，图谱中的派系也会根据规则自动争夺据点。玩家的介入只是改变了天平的倾斜度，这让世界感觉是“活”的。

## 7. 推荐技术栈 (Recommended Tech Stack)

| **组件**     | **推荐方案**                  | **理由**                                                     |
| ------------ | ----------------------------- | ------------------------------------------------------------ |
| **游戏引擎** | Unity / Unreal Engine 5       | 均有成熟的 HTTP/WebSocket 集成库，支持动态资产加载。         |
| **LLM 模型** | Llama-3-70B (Server) / GPT-4o | 需要强大的推理能力来处理 JSON 结构和复杂逻辑。               |
| **图数据库** | **Memgraph**                  | 内存原生，速度极快，适合游戏这种低延迟场景 (Real-time read/write) 11。 |
| **编排框架** | **LangGraph**                 | 专门处理带循环、状态记忆的 Agent 工作流，比线性 Chain 更适合游戏逻辑 13。 |
| **护栏工具** | **NeMo Guardrails**           | 企业级护栏，可编程性强，易于集成到 Python 后端。             |



------
/**
 * STAGE_CONFIG 剧本生成器
 * 使用LLM生成符合游戏格式的关卡配置剧本
 */

// API配置获取函数（避免重复声明）
function getApiConfig() {
    // 优先使用主文件的API_CONFIG（如果已定义）
    if (typeof window !== 'undefined' && window.API_CONFIG) {
        return window.API_CONFIG;
    }
    // 否则使用默认配置
    return {
        url: "https://api.mindcraft.com.cn/v1/chat/completions",
        key: "MC-E5B8AB237AAC4EDCBFA26531D6BE0081",
        model: "gemini-3-flash-latest"
    };
}

// ==========================================
// LLM 系统提示词 - 剧本生成器
// ==========================================
const STAGE_GENERATOR_PROMPT = `
你是一个专业的游戏剧本生成器，专门生成"迷雾侦探"风格的关卡配置（STAGE_CONFIG）。

根据用户提供的主题、背景或要求，生成一个完整的STAGE_CONFIG配置对象。

你需要理解游戏设计的核心原则：
1. **逻辑连贯性**：线索之间要有合理的逻辑关系，形成完整的推理链
2. **多样性**：每关至少2-3个关键点树，每个树至少1-2条线索路径
3. **难度梯度**：从简单到困难，先易后难
4. **NPC互动**：确保有初始NPC和动态NPC，提供不同的获取线索方式
5. **发现方式**：每个线索都应有明确的发现条件和位置提示
`;

// ==========================================
// JSON 格式指令函数
// ==========================================
function getStageConfigJsonInstruction() {
    return `
\n\n[SYSTEM INSTRUCTION]
必须严格遵守以下配置结构生成STAGE_CONFIG对象（纯JavaScript对象代码，无Markdown标记）：

【配置结构要求】
STAGE_CONFIG是一个JavaScript对象，每个关卡(stage)包含以下字段：

1. **基础信息**
   - name: 关卡名称（中文）
   - required_count: 完成关卡所需的关键点(keypoint)数量（通常为2）
   - boss_start: Boss起始位置ID（如 "loc_start_perimeter"）
   - entry_clues: 入口线索数组（玩家最初能接触到的传闻ID，如 ["rumor_data_leak", "rumor_gang_activity"]）

2. **NPC配置 (npcs数组)**
   每个NPC对象包含：
   - id: NPC唯一标识符（如 "npc_bartender"）
   - name: NPC名称（中文）
   - location: 初始位置（通常为null，由系统动态分配）
   - knows: 该NPC知道的线索ID数组（如 ["leaf_antenna", "rumor_chip"]）
   - trust_threshold: 信任阈值（0-2，决定NPC何时透露信息）
   - spawn_phase: "initial"（初始在场）或 "dynamic"（动态出现）
   - spawn_trigger: 动态NPC的触发条件描述（当spawn_phase为"dynamic"时需要）
   - desc: NPC描述

3. **关键点树 (keypoint_trees数组)**
   每个关键点是一个树状结构，包含：
   - id: 关键点唯一标识符（如 "kp_chip"）
   - name: 关键点名称（中文）
   - desc: 关键点描述
   - status: "unknown"（固定）
   - discovery_hint: 发现提示（描述如何发现这个关键点）
   - children: 子线索数组（可以是中间线索或叶子线索）

   **中间线索结构**（有children的线索）：
   - id: 线索ID（如 "clue_signal_source"）
   - name: 线索名称
   - desc: 线索描述
   - status: "unknown"
   - discovery_conditions: 发现条件数组（描述如何发现）
   - children: 子线索数组

   **叶子线索结构**（无children的线索）：
   - id: 线索ID（如 "leaf_antenna"）
   - name: 线索名称
   - desc: 线索描述
   - status: "unknown"
   - location_hint: 位置提示
   - search_difficulty: "easy" | "medium" | "hard"
   - prerequisites: 前置条件数组（需要的其他线索ID）
   - children: []（空数组）

【命名规则】
- 关键点ID：以 "kp_" 开头（如 kp_chip, kp_id_card）
- 中间线索ID：以 "clue_" 开头（如 clue_signal_source, clue_decoder）
- 叶子线索ID：以 "leaf_" 开头（如 leaf_antenna, leaf_frequency）
- 传闻ID：以 "rumor_" 开头（如 rumor_data_leak, rumor_gang_activity）
- NPC ID：以 "npc_" 开头（如 npc_bartender, npc_hacker）

【输出格式要求】
只输出有效的JavaScript对象代码，不要包含Markdown代码块标记，不要添加注释。
直接输出符合以下格式的代码：
const STAGE_CONFIG = {
    [stageNumber]: {
        name: "...",
        required_count: 2,
        boss_start: "...",
        entry_clues: [...],
        npcs: [...],
        keypoint_trees: [...]
    }
};

请确保：
- 所有ID都是唯一的
- 使用JavaScript对象语法（字符串用双引号）
- 数组和对象的格式正确
- 所有必需字段都已包含
`;
}

// ==========================================
// 调用LLM生成剧本
// ==========================================
async function generateStageConfig(prompt, stageNumber = 1) {
    const systemPrompt = STAGE_GENERATOR_PROMPT;
    const instruction = getStageConfigJsonInstruction();
    
    const userPromptBase = prompt || `请生成一个赛博朋克风格的关卡剧本，主题是"贫民窟的数据泄露"。
包含以下要素：
- 数据泄露事件
- 加密芯片线索
- 黑客NPC
- 多层线索树结构`;
    
    const userPrompt = userPromptBase + instruction;

    try {
        console.log(`[生成器] 开始生成第 ${stageNumber} 关剧本...`);
        console.log(`[生成器] 用户提示: ${userPrompt}`);

        const apiConfig = getApiConfig();
        const response = await fetch(apiConfig.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiConfig.key}`
            },
            body: JSON.stringify({
                model: apiConfig.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.8,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || data.response || '';

        // 清理可能的Markdown代码块标记
        content = content.replace(/```javascript\n?/g, '').replace(/```js\n?/g, '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        console.log(`[生成器] LLM原始响应:\n${content}\n`);

        // 尝试解析并验证JSON
        try {
            // 提取STAGE_CONFIG对象部分
            const configMatch = content.match(/const\s+STAGE_CONFIG\s*=\s*(\{[\s\S]*});?/);
            if (configMatch) {
                // 提取对象内容并解析
                const configStr = configMatch[1];
                // 将JavaScript对象字符串转换为可执行的代码
                const configObj = eval(`(${configStr})`);
                
                // 验证结构
                if (validateStageConfig(configObj[stageNumber])) {
                    console.log(`[生成器] ✓ 第 ${stageNumber} 关配置验证通过！`);
                    return {
                        success: true,
                        rawContent: content,
                        config: configObj,
                        formattedConfig: formatConfig(configObj[stageNumber])
                    };
                } else {
                    console.warn(`[生成器] ⚠ 配置结构验证失败，但仍返回原始内容`);
                    return {
                        success: false,
                        rawContent: content,
                        config: null,
                        error: '配置验证失败'
                    };
                }
            } else {
                // 如果没有找到STAGE_CONFIG，尝试直接解析JSON
                const jsonMatch = content.match(/\{[\s\S]*}/);
                if (jsonMatch) {
                    const configObj = JSON.parse(jsonMatch[0]);
                    return {
                        success: true,
                        rawContent: content,
                        config: { [stageNumber]: configObj },
                        formattedConfig: formatConfig(configObj)
                    };
                }
            }
        } catch (parseError) {
            console.error(`[生成器] JSON解析错误:`, parseError);
            console.log(`[生成器] 原始内容:`, content);
        }

        // 如果解析失败，返回原始内容
        return {
            success: false,
            rawContent: content,
            config: null,
            error: '无法解析生成的内容'
        };

    } catch (error) {
        console.error(`[生成器] 生成失败:`, error);
        return {
            success: false,
            rawContent: null,
            config: null,
            error: error.message
        };
    }
}

// ==========================================
// 配置验证
// ==========================================
function validateStageConfig(stageConfig) {
    if (!stageConfig) {
        console.error('[验证] stageConfig为空');
        return false;
    }

    const requiredFields = ['name', 'required_count', 'boss_start', 'entry_clues', 'npcs', 'keypoint_trees'];
    for (const field of requiredFields) {
        if (!(field in stageConfig)) {
            console.error(`[验证] 缺少必需字段: ${field}`);
            return false;
        }
    }

    // 验证NPC结构
    if (!Array.isArray(stageConfig.npcs)) {
        console.error('[验证] npcs必须是数组');
        return false;
    }

    for (const npc of stageConfig.npcs) {
        const npcFields = ['id', 'name', 'location', 'knows', 'trust_threshold', 'spawn_phase', 'desc'];
        for (const field of npcFields) {
            if (!(field in npc)) {
                console.error(`[验证] NPC缺少字段: ${field}`);
                return false;
            }
        }
        if (npc.spawn_phase === 'dynamic' && !npc.spawn_trigger) {
            console.error(`[验证] 动态NPC ${npc.id} 缺少spawn_trigger`);
            return false;
        }
    }

    // 验证关键点树结构
    if (!Array.isArray(stageConfig.keypoint_trees)) {
        console.error('[验证] keypoint_trees必须是数组');
        return false;
    }

    // 递归验证线索树
    function validateClueNode(node, path = '') {
        const nodePath = path ? `${path}.${node.id}` : node.id;
        const required = ['id', 'name', 'desc', 'status'];
        
        for (const field of required) {
            if (!(field in node)) {
                console.error(`[验证] 线索节点 ${nodePath} 缺少字段: ${field}`);
                return false;
            }
        }

        if (Array.isArray(node.children) && node.children.length > 0) {
            for (const child of node.children) {
                if (!validateClueNode(child, nodePath)) {
                    return false;
                }
            }
        }

        return true;
    }

    for (const kp of stageConfig.keypoint_trees) {
        if (!validateClueNode(kp)) {
            return false;
        }
    }

    return true;
}

// ==========================================
// 格式化配置为可读字符串
// ==========================================
function formatConfig(stageConfig, indent = 0) {
    const indentStr = '    '.repeat(indent);
    let result = '';
    
    result += `${indentStr}{\n`;
    result += `${indentStr}    name: "${stageConfig.name}",\n`;
    result += `${indentStr}    required_count: ${stageConfig.required_count},\n`;
    result += `${indentStr}    boss_start: "${stageConfig.boss_start}",\n`;
    result += `${indentStr}    entry_clues: ${JSON.stringify(stageConfig.entry_clues)},\n`;
    
    result += `${indentStr}    npcs: [\n`;
    for (const npc of stageConfig.npcs) {
        result += `${indentStr}        {\n`;
        result += `${indentStr}            id: "${npc.id}",\n`;
        result += `${indentStr}            name: "${npc.name}",\n`;
        result += `${indentStr}            location: ${npc.location === null ? 'null' : `"${npc.location}"`},\n`;
        result += `${indentStr}            knows: ${JSON.stringify(npc.knows)},\n`;
        result += `${indentStr}            trust_threshold: ${npc.trust_threshold},\n`;
        result += `${indentStr}            spawn_phase: "${npc.spawn_phase}",\n`;
        if (npc.spawn_trigger) {
            result += `${indentStr}            spawn_trigger: "${npc.spawn_trigger}",\n`;
        }
        result += `${indentStr}            desc: "${npc.desc}"\n`;
        result += `${indentStr}        }${npc !== stageConfig.npcs[stageConfig.npcs.length - 1] ? ',' : ''}\n`;
    }
    result += `${indentStr}    ],\n`;
    
    result += `${indentStr}    keypoint_trees: [\n`;
    for (let i = 0; i < stageConfig.keypoint_trees.length; i++) {
        const kp = stageConfig.keypoint_trees[i];
        result += formatKeypointTree(kp, indent + 2);
        if (i < stageConfig.keypoint_trees.length - 1) {
            result = result.trimEnd() + ',\n';
        }
    }
    result += `${indentStr}    ]\n`;
    result += `${indentStr}}`;
    
    return result;
}

function formatKeypointTree(node, indent = 0) {
    const indentStr = '    '.repeat(indent);
    let result = '';
    
    result += `${indentStr}{\n`;
    result += `${indentStr}    id: "${node.id}",\n`;
    result += `${indentStr}    name: "${node.name}",\n`;
    result += `${indentStr}    desc: "${node.desc}",\n`;
    result += `${indentStr}    status: "${node.status}",\n`;
    if (node.discovery_hint) {
        result += `${indentStr}    discovery_hint: "${node.discovery_hint}",\n`;
    }
    
    if (Array.isArray(node.children) && node.children.length > 0) {
        result += `${indentStr}    ${node.children[0].id.startsWith('clue_') ? 'children' : 'children'}: [\n`;
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            if (child.children && child.children.length > 0) {
                // 中间线索
                result += formatIntermediateClue(child, indent + 2);
            } else {
                // 叶子线索
                result += formatLeafClue(child, indent + 2);
            }
            if (i < node.children.length - 1) {
                result = result.trimEnd() + ',\n';
            }
        }
        result += `${indentStr}    ]\n`;
    } else {
        result += `${indentStr}    children: []\n`;
    }
    
    result += `${indentStr}}`;
    return result;
}

function formatIntermediateClue(clue, indent = 0) {
    const indentStr = '    '.repeat(indent);
    let result = '';
    
    result += `${indentStr}{\n`;
    result += `${indentStr}    id: "${clue.id}",\n`;
    result += `${indentStr}    name: "${clue.name}",\n`;
    result += `${indentStr}    desc: "${clue.desc}",\n`;
    result += `${indentStr}    status: "${clue.status}",\n`;
    if (clue.discovery_conditions) {
        result += `${indentStr}    discovery_conditions: ${JSON.stringify(clue.discovery_conditions)},\n`;
    }
    if (clue.children && clue.children.length > 0) {
        result += `${indentStr}    children: [\n`;
        for (let i = 0; i < clue.children.length; i++) {
            const child = clue.children[i];
            result += formatLeafClue(child, indent + 2);
            if (i < clue.children.length - 1) {
                result = result.trimEnd() + ',\n';
            }
        }
        result += `${indentStr}    ]\n`;
    } else {
        result += `${indentStr}    children: []\n`;
    }
    result += `${indentStr}}`;
    return result;
}

function formatLeafClue(clue, indent = 0) {
    const indentStr = '    '.repeat(indent);
    let result = '';
    
    result += `${indentStr}{\n`;
    result += `${indentStr}    id: "${clue.id}",\n`;
    result += `${indentStr}    name: "${clue.name}",\n`;
    result += `${indentStr}    desc: "${clue.desc}",\n`;
    result += `${indentStr}    status: "${clue.status}",\n`;
    if (clue.location_hint) {
        result += `${indentStr}    location_hint: "${clue.location_hint}",\n`;
    }
    if (clue.search_difficulty) {
        result += `${indentStr}    search_difficulty: "${clue.search_difficulty}",\n`;
    }
    if (clue.prerequisites) {
        result += `${indentStr}    prerequisites: ${JSON.stringify(clue.prerequisites)},\n`;
    }
    result += `${indentStr}    children: []\n`;
    result += `${indentStr}}`;
    return result;
}

// ==========================================
// 导出函数（供其他模块使用）
// ==========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateStageConfig,
        validateStageConfig,
        formatConfig,
        getStageConfigJsonInstruction,
        STAGE_GENERATOR_PROMPT,
        getApiConfig
    };
}

// ==========================================
// 浏览器环境使用示例
// ==========================================
if (typeof window !== 'undefined') {
    window.StageConfigGenerator = {
        generateStageConfig,
        validateStageConfig,
        formatConfig,
        getStageConfigJsonInstruction,
        STAGE_GENERATOR_PROMPT,
        getApiConfig
    };
}


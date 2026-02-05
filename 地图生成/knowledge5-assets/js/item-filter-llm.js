// 物品过滤 LLM 模块
// 使用 AI 将自然语言查询转换为结构化过滤条件

// ================= CONFIGURATION =================
const ITEM_FILTER_CONFIG = {
    API_URL: "https://api.mindcraft.com.cn/v1/chat/completions",
    API_KEY: "MC-E5B8AB237AAC4EDCBFA26531D6BE0081",
    MODEL: "gemini-3-flash-latest"
};

// ================= ItemFilterLLM 类 =================
class ItemFilterLLM {
    constructor(config = {}) {
        this.config = { ...ITEM_FILTER_CONFIG, ...config };
        this.allItems = [];
        this.uniqueTags = new Set();
    }

    /**
     * 处理 CSV 数据并初始化物品列表
     * @param {Array} rawData - CSV 解析后的原始数据
     * @returns {Array} 处理后的物品数组
     */
    processCSVData(rawData) {
        this.uniqueTags.clear();

        this.allItems = rawData.map(row => {
            const tagStr = row['标签 (类型/功能/属性)'] || row['分类'] || row['tags'] || '';

            // 收集所有出现过的Tag，供Prompt使用
            if (tagStr) {
                tagStr.split(/[\s#]+/).forEach(t => {
                    if (t.trim()) this.uniqueTags.add(t.trim());
                });
            }

            return {
                id: row['ID'] || row['id'] || 'unknown',
                name: row['物品名称'] || row['name'] || row['Name'] || '未知物品',
                price: parseFloat((row['价格'] || row['price'] || '0').toString().replace(/[^\d.]/g, '')),
                weight: parseFloat((row['重量'] || row['weight'] || '0').toString()),
                desc: row['描述'] || row['desc'] || row['Description'] || '',
                tags: tagStr
            };
        });

        return this.allItems;
    }

    /**
     * 获取所有物品
     * @returns {Array} 所有物品数组
     */
    getAllItems() {
        return this.allItems;
    }

    /**
     * 获取唯一标签集合
     * @returns {Set} 唯一标签集合
     */
    getUniqueTags() {
        return this.uniqueTags;
    }

    /**
     * 使用 AI 将自然语言查询转换为过滤逻辑
     * @param {string} userQuery - 用户的自然语言查询
     * @param {Object} npcInfo - NPC信息 { id, name, occupation, personality, desc } (可选)
     * @returns {Promise<Object>} 过滤逻辑对象
     */
    async fetchQueryLogic(userQuery, npcInfo = null) {
        if (this.allItems.length === 0) {
            throw new Error("物品列表为空，请先加载数据");
        }

        const maxPrice = Math.max(...this.allItems.map(i => i.price));
        // 将前30个常用标签提供给AI，提高匹配准确度
        const tagsSample = Array.from(this.uniqueTags).slice(0, 30).join(", ");

        const systemPrompt = `你是一个物品过滤系统。`;

        const userPrompt = `
【任务】将玩家的自然语言查询转换为数据库过滤条件，同时考虑NPC的身份和职业。

你是赛博朋克世界的"物品过滤裁决者"——负责将玩家的自然语言查询转换为数据库过滤条件。
你必须使用【思维链】模式进行严谨的逻辑推理，然后输出最终决策。

==============================================================
                    【角色定位与职责边界】
==============================================================

你是游戏的"物品过滤器"，拥有完整的物品数据库视角：
- ✅ 你知道所有物品的属性（价格、重量、标签）
- ✅ 你理解NPC的身份和职业对物品过滤的影响
- ✅ 你将自然语言转换为结构化过滤条件
- ❌ 你不决定物品是否可购买（由商人LLM负责）
- ❌ 你不生成叙事文本

==============================================================
                    【核心铁律 - 违反即系统崩溃】
==============================================================

【铁律0：NPC出售权限判断（最高优先级）】
- 只有商人职业的NPC才能出售物品（如：商人、武器商、黑市商人、商店老板、商人等）
- 如果NPC不是商人职业，则直接返回无物品（price和tags的op和value都为null）
- 判断标准：NPC的职业（occupation）必须包含"商"、"店"、"交易"、"买卖"等与商业相关的关键词
- 如果NPC信息为空或职业不明确，默认允许出售（向后兼容）

【铁律1：只能使用两个字段】
- 只能使用 price 和 tags 两个字段进行过滤
- 严禁使用关键词模糊搜索
- 必须将语义转化为具体的 Tag 匹配或数值比较

【铁律2：NPC身份过滤】
- 正规商人：只能提供合法、正规物品，不能提供违禁品
- 黑市商人：可以提供违禁品、非法物品
- 特殊职业：根据职业特点匹配相关标签

【铁律3：标签匹配规则】
- 违禁品标签（"违禁"、"非法"、"黑市"）→ 只有黑市商人可提供
- 合法物品标签（"合法"、"正规"、"官方"）→ 正规商人可提供
- 根据NPC职业匹配相关标签（武器商→"武器"，医生→"医疗"）

==============================================================
                    【思维链推理框架 Chain of Thought】
==============================================================

推理时要按照思维链框架，一步一步分析：

【STEP 0: NPC出售权限判断 NPC Selling Permission Check】
${npcInfo ? `
首先判断NPC是否有出售物品的权限：
- NPC名称: ${npcInfo.name || '未知'}
- NPC职业: ${npcInfo.occupation || '未知'}
- NPC描述: ${npcInfo.desc || ''}

□ NPC是否是商人类型的职业（如：商人、武器商、黑市商人、商店老板等）？
□ 如果NPC不是商人，则直接返回无物品（price和tags的op和value都为null），跳过后续所有步骤

**关键判断**：
- 如果NPC不是商人职业 → 直接返回：{"filters": {"price": {"op": null, "value": null}, "tags": {"op": null, "value": null}}}
- 如果NPC是商人职业 → 继续执行后续步骤
` : '无NPC信息，默认允许出售，继续执行后续步骤'}

【STEP 1: 查询解析 Query Parsing】
分析玩家查询：
- 玩家想要什么类型的物品？（从给出的标签中选择）
- 玩家有什么价格要求？（价格、属性等）
- 查询中的关键词是什么？

【STEP 2: 语义映射 Semantic Mapping】
将自然语言映射到过滤字段：
- 识别价格相关词汇（"贵"、"便宜"、"最贵"等）→ price字段（使用>或<操作符）
- 识别物品类型词汇（"枪"、"食物"、"药"等）→ tags字段（使用contains操作符）
- 从标签列表 ${tagsSample} 中选择最匹配的标签
- 如果无法提取价格信息，price的op和value都设为null
- 如果无法提取标签信息，tags的op和value都设为null

【STEP 3: NPC身份分析 NPC Identity Analysis】
${npcInfo ? `
分析NPC身份对过滤的影响：
- NPC名称: ${npcInfo.name || '未知'}
- NPC职业: ${npcInfo.occupation || '未知'}
- NPC性格: ${npcInfo.personality || '未知'}
- NPC描述: ${npcInfo.desc || ''}

判断：
□ NPC是正规商人还是黑市商人？
□ NPC的职业与哪些物品标签相关？
□ NPC的性格是否影响物品选择？
` : '无NPC信息，跳过此步骤'}

【STEP 4: 过滤条件生成 Filter Generation】
综合以上分析，生成过滤条件：
- 固定输出两个字段：price 和 tags
- price字段：操作符只能是>或<，如果无法提取价格信息则op和value都为null
- tags字段：操作符固定为contains，如果无法提取标签信息则op和value都为null
- 确定值（price为数字，tags为字符串标签）

【STEP 5: 验证与优化 Validation】
验证过滤条件：
□ 所有字段名是否正确？
□ 所有操作符是否合法？
□ 标签值是否在标签列表中？
□ 数值是否合理？

==============================================================
                    【输出格式 - 严格JSON】
==============================================================

你必须输出以下格式的 JSON，不要任何其他文字或 markdown：

{
  "thinking": {
    "step0_npc_permission_check": "【NPC出售权限判断】NPC是否是商人或类似职业？如果不是商人则直接返回无物品",
    "step1_query_parsing": "【查询解析】玩家想要什么？有什么要求？",
    "step2_semantic_mapping": "【语义映射】将自然语言映射到price和tags字段",
    "step3_npc_analysis": "【NPC分析】NPC身份对过滤的影响",
    "step4_filter_generation": "【过滤生成】生成具体的过滤条件",
    "step5_validation": "【验证】检查过滤条件的正确性"
  },
  "filters": {
    "price": {
      "op": ">" | "<" | null,
      "value": 数字 | null
    },
    "tags": {
      "op": "contains" | null,
      "value": 字符串 | null
    }
  }
}

【CRITICAL: JSON格式要求 - 违反将导致解析失败】
1. **所有属性名必须使用双引号包裹**：正确示例 "field"，错误示例 field 或 'field'
2. **所有属性名必须使用ASCII英文字符**：只能使用 a-z, A-Z, 0-9, _ (下划线) 和 - (连字符)
3. **禁止在属性名中使用中文字符、特殊符号或Unicode字符**
4. **字符串值可以包含中文，但属性名必须是纯英文**
5. **禁止使用单引号包裹属性名或字符串值**
6. **禁止在JSON中使用注释（// 或 /* */）**
7. **禁止在对象或数组末尾使用多余的逗号（trailing comma）**

【字段约束】
- "filters": 固定对象，包含 "price" 和 "tags" 两个属性
- "price": 
  * "op": 必须是 ">"、"<" 或 null（如果提取不到价格信息或NPC不是商人则为null）
  * "value": 必须是数字或 null（如果提取不到价格信息或NPC不是商人则为null）
- "tags":
  * "op": 必须是 "contains" 或 null（如果提取不到标签信息或NPC不是商人则为null）
  * "value": 必须是字符串（来自标签列表：${tagsSample}）或 null（如果提取不到标签信息或NPC不是商人则为null）
- **重要**：如果NPC不是商人职业，price和tags的op和value都必须是null，直接返回无物品
- **重要**：如果无法从查询中提取到价格信息，price的op和value都必须是null
- **重要**：如果无法从查询中提取到标签信息，tags的op和value都必须是null

==============================================================
                    【严格约束清单】
==============================================================

1. thinking 字段必须完整记录6步推理过程（包括STEP 0的NPC出售权限判断）
2. filters 必须是包含price和tags两个属性的对象，不能为空
3. price的op只能是">"、"<"或null，tags的op只能是"contains"或null
4. 如果无法提取价格信息，price的op和value都必须为null
5. 如果无法提取标签信息，tags的op和value都必须为null
6. 标签值必须来自提供的标签列表
7. **所有JSON属性名必须使用ASCII英文字符，禁止中文或特殊字符**

【玩家查询】: ${userQuery}

${npcInfo ? `
【NPC信息】:
- 名称: ${npcInfo.name || '未知'}
- 职业: ${npcInfo.occupation || '未知'}
- 性格: ${npcInfo.personality || '未知'}
- 描述: ${npcInfo.desc || ''}
` : ''}

【可用标签列表】: ${tagsSample}

【最大价格】: ${maxPrice}

现在请按照思维链框架进行推理，输出JSON：
`;

        const response = await fetch(this.config.API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.config.API_KEY}`
            },
            body: JSON.stringify({
                model: this.config.MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.1
            })
        });

        if (!response.ok) {
            throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const rawContent = data.choices[0].message.content;
        
        try {
            // 使用统一的JSON解析函数
            const result = parseLlmJsonResponse(rawContent);
            // 返回过滤逻辑（可能包含thinking字段，但执行过滤时只使用filters）
            return result;
        } catch (parseError) {
            throw new Error(`JSON 解析失败: ${parseError.message}`);
        }
    }

    /**
     * 执行过滤逻辑
     * @param {Object} logic - 过滤逻辑对象
     * @returns {Array} 过滤后的物品数组
     */
    executeFilter(logic) {
        if (!logic.filters || (typeof logic.filters !== 'object')) {
            // 如果 AI 没返回任何 filter，默认显示所有
            return this.allItems;
        }
        
        const filters = logic.filters;
        const priceFilter = filters.price || null;
        const tagsFilter = filters.tags || null;
        
        // 检查是否有有效的过滤条件（op和value都不为null表示有效）
        const hasPriceFilter = priceFilter && priceFilter.op !== null && priceFilter.value !== null;
        const hasTagsFilter = tagsFilter && tagsFilter.op !== null && tagsFilter.value !== null;
        
        // 如果标签和价格两个filter都无效，直接返回全部物品
        if (!hasPriceFilter && !hasTagsFilter) {
            return this.allItems;
        }
        
        const filteredItems = [];
        
        // 遍历所有物品
        for (let i = 0; i < this.allItems.length; i++) {
            const item = this.allItems[i];
            let shouldInclude = true;
            
            // 检查价格过滤条件（如果价格filter有效才判断）
            if (hasPriceFilter) {
                const itemPrice = item.price;
                let priceResult = false;
                
                if (itemPrice === undefined || itemPrice === null) {
                    priceResult = false;
                } else {
                    switch (priceFilter.op) {
                        case '>':
                            priceResult = itemPrice > priceFilter.value;
                            break;
                        case '<':
                            priceResult = itemPrice < priceFilter.value;
                            break;
                        default:
                            priceResult = true;
                    }
                }
                
                // 如果价格条件不满足，跳过该物品
                if (!priceResult) {
                    shouldInclude = false;
                }
            }
            
            // 检查标签过滤条件（如果标签filter有效才判断，且价格条件已满足或未设置）
            if (shouldInclude && hasTagsFilter) {
                const itemTags = item.tags;
                let tagsResult = false;
                
                // tags 是字符串，可能包含多个标签，只要包含指定的标签就算匹配
                if (itemTags !== undefined && itemTags !== null) {
                    tagsResult = String(itemTags).includes(tagsFilter.value);
                    console.log(`[tags] "${String(itemTags)}".includes("${tagsFilter.value}") = ${tagsResult}`);
                } else {
                    tagsResult = false;
                }
                
                // 如果标签条件不满足，跳过该物品
                if (!tagsResult) {
                    shouldInclude = false;
                }
            }
            
            // 如果所有有效的 filter 条件都满足，添加到结果数组
            if (shouldInclude) {
                filteredItems.push(item);
            }
        }
        
        return filteredItems;
    }

    /**
     * 执行完整的搜索流程
     * @param {string} userQuery - 用户的自然语言查询
     * @param {Object} npcInfo - NPC信息 { id, name, occupation, personality, desc } (可选)
     * @returns {Promise<Array>} 过滤后的物品数组
     */
    async search(userQuery, npcInfo = null) {
        if (this.allItems.length === 0) {
            throw new Error("请先加载 CSV 数据！");
        }

        if (!userQuery || !userQuery.trim()) {
            return this.allItems;
        }

        const queryLogic = await this.fetchQueryLogic(userQuery.trim(), npcInfo);
        const filtered = this.executeFilter(queryLogic);
        

        
        return filtered;
    }


    /**
     * 获取物品价格（整合过滤和定价LLM）
     * @param {string} userQuery - 用户的自然语言查询
     * @param {Object} npcInfo - NPC信息 { id, name, occupation, personality, desc }
     * @param {Object} playerStatus - 玩家状态 { money, social, physical }
     * @param {Array} dialogueHistory - 对话历史
     * @returns {Promise<Object>} 包含物品和价格的定价结果
     */
    async getItemPrices(userQuery, npcInfo, playerStatus, dialogueHistory = []) {
        // 先过滤物品（传入NPC信息，让过滤LLM根据NPC身份过滤）
        const filteredItems = await this.search(userQuery, npcInfo);
        
        // 调用商人LLM进行定价
        return await this.callMerchantLLM(filteredItems, npcInfo, playerStatus, dialogueHistory);
    }

    /**
     * 调用商人LLM进行定价
     * @param {Array} filteredItems - 过滤后的物品列表
     * @param {Object} npcInfo - NPC信息
     * @param {Object} playerStatus - 玩家状态
     * @param {Array} dialogueHistory - 对话历史
     * @returns {Promise<Object>} 包含物品和价格的定价结果
     */
    async callMerchantLLM(filteredItems, npcInfo, playerStatus, dialogueHistory) {
        const itemsInfo = filteredItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            weight: item.weight,
            desc: item.desc,
            tags: item.tags
        })).slice(0, 20); // 限制最多20个物品

        // 获取游戏状态信息（用于出售判断）
        const gState = (typeof window !== 'undefined' && window.gameState) ? window.gameState :
                      (typeof gameState !== 'undefined' ? gameState : null);
        
        // 获取玩家状态详情
        const playerPhysicalStatus = gState?.playerStatus?.physical || playerStatus.physical || ['健康'];
        const playerSocialStatus = gState?.playerStatus?.social || playerStatus.social || ['普通'];
        const playerMoney = playerStatus.money || 0;
        
        // 获取线索状态
        const knownClues = gState?.investigation?.knownClues || [];
        const foundClues = gState?.investigation?.clueDiscoveryLog || [];
        const npcInteractions = gState?.investigation?.npcInteractions || {};
        const currentNpcInteraction = npcInfo?.id ? (npcInteractions[npcInfo.id] || { trust: 0, asked: [], helped: false }) : null;
        
        // 获取购买历史
        const purchaseHistory = gState?.purchaseHistory?.records || [];
        const recentPurchases = purchaseHistory.slice(-10); // 最近10次购买
        
        // 获取玩家行动总结（用于判断玩家行为）
        const actionSummary = gState?.consequenceJudge?.actionSummary || null;

        const systemPrompt = `你是一个商人定价和出售判断系统。`;

        const contextPrompt = `
【任务】根据NPC特征、玩家状态、玩家行为和物品信息，为每个物品动态定价，并判断是否应该出售给玩家。

你是赛博朋克世界的"商人定价和出售判断系统"——负责根据NPC特征、玩家状态、玩家行为和物品信息，为每个物品动态定价，并判断是否应该出售给玩家。
你必须使用【思维链】模式进行严谨的逻辑推理，然后输出定价和出售判断结果。

==============================================================
                    【角色定位与职责边界】
==============================================================

你是游戏的"定价和出售判断引擎"，专注于价格计算和出售决策：
- ✅ 你根据NPC身份和性格调整价格
- ✅ 你根据玩家社会状态调整价格
- ✅ 你根据对话历史判断信任度影响价格
- ✅ 你为每个物品计算最终价格
- ✅ 你判断每种物品是否应该出售给玩家（根据玩家名望、状态、行为、线索解锁状态等）
- ❌ 你不决定物品过滤（由物品过滤LLM负责）
- ❌ 你不判断玩家意图（由其他系统负责）
- ❌ 你不生成叙事文本（由主LLM负责）

==============================================================
                    【核心铁律 - 违反即系统崩溃】
==============================================================

【铁律1：必须为所有物品定价和判断】
- 必须为输入的所有物品计算价格
- 必须为每个物品判断是否应该出售
- 不能跳过任何物品
- 每个物品必须有base_price、final_price和should_sell

【铁律2：动态定价规则】
- 富有=折扣（-10%到-20%）
- 贫穷=加价（+10%到+30%）
- 声名狼藉=高价（+20%到+50%）或拒绝
- 根据NPC性格调整（谨慎=稳定价格，大胆=可能折扣）
- 根据对话历史判断信任度（信任度高=折扣）

【铁律3：价格必须合理】
- final_price不能为负数
- final_price不能低于base_price的50%（除非特殊原因）
- final_price不能高于base_price的200%（除非特殊原因）

【铁律4：出售判断规则】
- 违禁品：只有黑市商人可出售，且需要玩家有足够信任度或线索解锁
- 合法物品：正规商人可出售，但声名狼藉的玩家可能被拒绝
- 高级物品：需要玩家达到特定线索解锁状态或名望等级
- 玩家行为：如果玩家之前有不良行为（如偷窃、欺骗），可能被拒绝出售
- NPC信任度：信任度低的玩家可能被拒绝出售敏感物品

==============================================================
                    【思维链推理框架 Chain of Thought】
==============================================================

推理时要按照思维链框架，一步一步分析：

【STEP 1: NPC身份分析 NPC Identity Analysis】
分析NPC特征：
- NPC名称: ${npcInfo.name || '未知'}
- NPC职业: ${npcInfo.occupation || '未知'}
- NPC性格: ${npcInfo.personality || '未知'}
- NPC描述: ${npcInfo.desc || ''}

判断：
□ NPC的职业类型（正规/黑市/特殊）？
□ NPC的性格特点（谨慎/大胆/贪婪/友好）？
□ NPC的性格如何影响定价策略？

【STEP 2: 玩家状态分析 Player Status Analysis】
分析玩家状态：
- 金钱: ${playerStatus.money || 0} 信用点
- 社会状态: ${Array.isArray(playerStatus.social) ? playerStatus.social.join('、') : playerStatus.social || '普通'}

判断：
□ 玩家社会状态如何影响价格调整？
□ 富有/贫穷/声名狼藉对应的价格调整幅度？
□ 玩家是否有足够金钱（影响定价策略）？

【STEP 3: 对话历史分析 Dialogue History Analysis】
分析对话历史：
- 查看最近5条对话记录
- 判断玩家与NPC的信任度
- 判断NPC对玩家的态度

判断：
□ 信任度高=给予折扣
□ 信任度低=正常价格或加价
□ NPC态度友好/敌对如何影响价格？

【STEP 4: 价格调整策略 Price Adjustment Strategy】
综合以上分析，确定价格调整策略：
- 基础调整：根据玩家社会状态
- 性格调整：根据NPC性格
- 信任调整：根据对话历史
- 计算综合调整幅度

【STEP 5: 逐个物品定价 Item-by-Item Pricing】
为每个物品计算价格：
- base_price: 从物品信息中获取基础价格
- 应用价格调整策略
- final_price: 计算最终价格
- price_modifier: 说明价格调整原因

【STEP 6: 出售判断 Sell Decision】
为每个物品判断是否应该出售：
- 分析物品标签（违禁品/合法物品/高级物品）
- 分析玩家社会状态（名望、声誉）
- 分析玩家身体状态（是否适合使用该物品）
- 分析玩家之前的行为（购买历史、对话历史）
- 分析线索解锁状态（某些物品需要特定线索解锁）
- 分析NPC与玩家的信任度
- 综合判断：should_sell = true/false
- sell_reason: 说明出售或拒绝出售的原因

==============================================================
                    【输出格式 - 严格JSON】
==============================================================

你必须输出以下格式的 JSON，不要任何其他文字或 markdown：

{
  "thinking": {
    "step1_npc_analysis": "【NPC分析】NPC身份和性格如何影响定价？",
    "step2_player_analysis": "【玩家分析】玩家状态如何影响价格调整？",
    "step3_dialogue_analysis": "【对话分析】信任度和态度如何影响价格？",
    "step4_price_strategy": "【价格策略】确定综合价格调整策略",
    "step5_item_pricing": "【物品定价】为每个物品计算最终价格",
    "step6_sell_decision": "【出售判断】为每个物品判断是否应该出售"
  },
  "items": [
    {
      "item_id": "物品ID",
      "item_name": "物品名称",
      "base_price": 基础价格,
      "final_price": 最终价格,
      "price_modifier": "价格调整说明（如：因玩家社会地位给予折扣）",
      "should_sell": true/false,
      "sell_reason": "出售或拒绝出售的原因（如：玩家名望不足、需要特定线索解锁等）"
    }
  ]
}

【CRITICAL: JSON格式要求 - 违反将导致解析失败】
1. **所有属性名必须使用双引号包裹**：正确示例 "intent"，错误示例 intent 或 'intent'
2. **所有属性名必须使用ASCII英文字符**：只能使用 a-z, A-Z, 0-9, _ (下划线) 和 - (连字符)
3. **禁止在属性名中使用中文字符、特殊符号或Unicode字符**
4. **字符串值可以包含中文，但属性名必须是纯英文**
5. **禁止使用单引号包裹属性名或字符串值**
6. **禁止在JSON中使用注释（// 或 /* */）**
7. **禁止在对象或数组末尾使用多余的逗号（trailing comma）**

【字段约束】
- "items": 数组，必须包含所有输入物品的定价和出售判断信息
  * 每个物品必须从【可用物品】列表中选择
  * 每个物品对象必须包含：item_id, item_name, base_price, final_price, price_modifier, should_sell, sell_reason
  * base_price: 物品的基础价格（从物品信息中获取）
  * final_price: 计算后的最终价格（必须 >= 0）
  * price_modifier: 字符串，说明价格调整的原因
  * should_sell: 布尔值，true表示应该出售，false表示拒绝出售
  * sell_reason: 字符串，说明出售或拒绝出售的原因

==============================================================
                    【严格约束清单】
==============================================================

1. thinking 字段必须完整记录6步推理过程（包括出售判断）
2. 必须为所有输入物品计算价格和出售判断，不能遗漏
3. final_price 必须合理（不能为负，不能过高或过低）
4. should_sell 必须明确（true或false，不能为null）
5. 所有物品必须从可用物品列表中选择
6. **所有JSON属性名必须使用ASCII英文字符，禁止中文或特殊字符**

【NPC信息】:
- 名称: ${npcInfo.name || '未知'}
- 职业: ${npcInfo.occupation || '未知'}
- 性格: ${npcInfo.personality || '未知'}
- 描述: ${npcInfo.desc || ''}
- 与玩家信任度: ${currentNpcInteraction ? currentNpcInteraction.trust : 0}
- 玩家已问话题: ${currentNpcInteraction ? currentNpcInteraction.asked.join('、') : '无'}

【玩家状态】:
- 金钱: ${playerMoney} 信用点
- 身体状态: ${Array.isArray(playerPhysicalStatus) ? playerPhysicalStatus.join('、') : playerPhysicalStatus || '健康'}
- 社会状态: ${Array.isArray(playerSocialStatus) ? playerSocialStatus.join('、') : playerSocialStatus || '普通'}

【线索解锁状态】:
- 已知线索数量: ${knownClues.length}
- 已知线索列表: ${knownClues.length > 0 ? knownClues.join('、') : '无'}
- 已找到证据数量: ${foundClues.length}

【玩家行为历史】:
- 最近购买记录 (${recentPurchases.length}条): ${recentPurchases.length > 0 ? recentPurchases.map(p => `${p.item_name} (${p.quantity}个, ${p.final_price}信用点)`).join('、') : '无'}
- 玩家行动总结: ${actionSummary || '无（玩家尚未有显著行动）'}

【需要定价和判断的物品】(${itemsInfo.length}个):
${JSON.stringify(itemsInfo, null, 2)}

【对话历史】:
${dialogueHistory.slice(-5).map(d => `${d.role}: ${d.content}`).join('\n') || '无'}

现在请按照思维链框架进行推理，为所有物品计算价格并判断是否应该出售，输出JSON：
`;

        const response = await fetch(this.config.API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.config.API_KEY}`
            },
            body: JSON.stringify({
                model: this.config.MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: contextPrompt }
                ],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const rawContent = data.choices[0].message.content;
        
        try {
            // 使用统一的JSON解析函数
            const result = parseLlmJsonResponse(rawContent);
            
            // 确保每个物品都有 should_sell 和 sell_reason 字段
            if (result.items && Array.isArray(result.items)) {
                result.items.forEach(item => {
                    // 如果AI没有返回 should_sell，默认为 true（向后兼容）
                    if (item.should_sell === undefined || item.should_sell === null) {
                        item.should_sell = true;
                    }
                    // 如果AI没有返回 sell_reason，提供默认说明
                    if (!item.sell_reason) {
                        item.sell_reason = item.should_sell ? '正常出售' : '拒绝出售（原因未说明）';
                    }
                });
            }
            
            // 商人LLM负责定价和出售判断，不执行购买操作
            // 购买操作由调用方根据玩家意图和 should_sell 字段决定
            return result;
        } catch (parseError) {
            throw new Error(`JSON 解析失败: ${parseError.message}`);
        }
    }

    /**
     * 执行购买并更新状态
     * @param {Array} purchaseItems - 购买物品列表
     * @param {Object} npcInfo - NPC信息
     * @param {Object} playerStatus - 玩家状态（引用，会直接修改）
     */
    executePurchase(purchaseItems, npcInfo, playerStatus) {
        // 检查全局状态是否存在
        if (typeof window === 'undefined' || typeof window.gameState === 'undefined') {
            // 尝试直接访问 gameState（如果在同一作用域）
            if (typeof gameState === 'undefined') {
                console.warn('[ItemFilterLLM] gameState 未定义，无法执行购买');
                return;
            }
        }
        const gState = typeof window !== 'undefined' && window.gameState ? window.gameState : gameState;

        let totalCost = 0;
        purchaseItems.forEach(item => {
            const cost = (item.final_price || item.base_price || 0) * (item.quantity || 1);
            totalCost += cost;

            // 记录购买信息
            if (!gState.purchaseHistory) {
                gState.purchaseHistory = { records: [], totalSpent: 0, purchaseCount: 0 };
            }
            gState.purchaseHistory.records.push({
                item_id: item.item_id,
                item_name: item.item_name,
                quantity: item.quantity || 1,
                price: item.base_price || 0,
                final_price: item.final_price || item.base_price || 0,
                npc_id: npcInfo.id || 'unknown',
                npc_name: npcInfo.name || '未知商人',
                npc_occupation: npcInfo.occupation || '',
                turn: gState.turnNumber || 0,
                timestamp: Date.now()
            });

            // 添加到玩家物品列表
            const invMgr = (typeof window !== 'undefined' && window.InventoryManager) ? window.InventoryManager :
                           (typeof InventoryManager !== 'undefined' ? InventoryManager : null);
            
            if (invMgr) {
                invMgr.addItem({
                    id: item.item_id,
                    name: item.item_name,
                    desc: item.desc || '',
                    type: 'purchased',
                    source: 'purchase',
                    quantity: item.quantity || 1,
                    npc_id: npcInfo.id,
                    npc_name: npcInfo.name,
                    price: item.final_price || item.base_price,
                    turn: gState.turnNumber || 0,
                    metadata: {
                        base_price: item.base_price,
                        final_price: item.final_price,
                        price_modifier: item.price_modifier
                    }
                });
            }
        });

        // 更新金钱
        if (playerStatus.money >= totalCost) {
            playerStatus.money -= totalCost;
            const statusMgr = (typeof window !== 'undefined' && window.PlayerStatusManager) ? window.PlayerStatusManager :
                             (typeof PlayerStatusManager !== 'undefined' ? PlayerStatusManager : null);
            if (statusMgr) {
                statusMgr.updateMoney(-totalCost, 'subtract');
            }
            if (gState.purchaseHistory) {
                gState.purchaseHistory.totalSpent += totalCost;
                gState.purchaseHistory.purchaseCount += 1;
            }
        }
    }
}

// 如果是在浏览器环境中，将类暴露到全局
if (typeof window !== 'undefined') {
    window.ItemFilterLLM = ItemFilterLLM;
    window.ITEM_FILTER_CONFIG = ITEM_FILTER_CONFIG;
}

// 如果是在 Node.js 环境中，导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ItemFilterLLM, ITEM_FILTER_CONFIG };
}


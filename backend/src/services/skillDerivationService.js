/**
 * 技能衍生服务 (SkillDerivationService)
 * 负责基于角色设定和基础技能生成衍生技能
 * 使用LLM进行技能生成和条件判定
 */

const config = require('../../config');
const fetch = require('node-fetch');

// 技能类型枚举
const SKILL_TYPES = {
  ATTACK: 'attack',       // 攻击 - 造成伤害
  DEFENSE: 'defense',     // 防御 - 减少受到的伤害
  SEAL: 'seal',           // 封印 - 禁用对方技能
  FIELD: 'field',         // 阵地构成 - 持续性场地效果
  RECOVERY: 'recovery'    // 回复 - 恢复HP/MP
};

// 稀有度枚举
const RARITY = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

class SkillDerivationService {

  /**
   * 调用LLM API
   */
  static async callLLM(systemPrompt, userPrompt, options = {}) {
    const apiKey = config.ai.apiKey;
    const baseUrl = config.ai.baseUrl.replace(/\/+$/, '');
    const modelName = config.ai.modelName;

    if (!apiKey) {
      throw new Error('AI API Key 未配置');
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: options.temperature || 0.8
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `LLM API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * 衍生新技能 - 综合参考角色设定和基础技能
   * @param {Object} baseSkill - 基础技能
   * @param {Object} characterProfile - 角色设定
   * @param {Array} allBaseSkills - 角色所有基础技能（用于参考整体风格）
   * @param {Number} count - 生成数量
   */
  static async deriveSkills(baseSkill, characterProfile, allBaseSkills, count = 3) {
    
    const systemPrompt = `
你是一个Rogue-like游戏的技能设计师，专门为魔术战斗角色设计技能。
你需要基于角色的【完整设定】和【基础技能】，生成符合角色风格的衍生技能。

【核心设计原则】
1. **风格一致性**：
   - 衍生技能必须符合角色的魔术体系（magicStyle）
   - 技能命名风格必须与角色已有技能保持统一
   - 效果描述要符合角色的战斗哲学

2. **能力边界**：
   - 不能超出角色设定的能力范畴
   - 衍生技能是基础技能的"变体"，而非全新能力
   - 参考角色的其他技能，寻找可能的Combo或协同效果

3. **类型约束**：
   - 衍生技能的 type 必须与基础技能相同
   - 可以添加符合角色能力的额外效果

4. **数值规则**：
   - power: 基础值 ±30%，范围 [5, 100]
   - cost: 基础值 ±40%，范围 [1, 50]  
   - accuracy: 基础值 ±15%，范围 [50, 100]
   - 稀有度越高，数值越强但消耗/条件越苛刻

5. **稀有度设计**：
   - common (普通): 基础效果的小变体
   - rare (稀有): 可添加1个符合角色能力的附加效果
   - epic (史诗): 强化版，可能需要特定条件触发
   - legendary (传说): 极致版本，高风险高回报

6. **flavorText 规则（重要）**：
   - flavorText 必须使用**拉丁文**书写
   - 这是魔术发动时的咏唱词/宣言
   - 内容应反映技能的核心概念或效果
   - 拉丁文应语法正确，可使用祈使句或宣告句
   - 示例：
     * 冰系攻击："Glacies aeternum, perfice iudicium!"（永恒之冰，执行审判！）
     * 防御结界："Murus invictus, protege me!"（不败之壁，护佑吾身！）
     * 封印术式："Catena fatalis, liga spiritum!"（命运之链，束缚其灵！）
     * 回复魔术："Fons vitae, redde virtutem!"（生命之泉，归还力量！）

7. **使用条件设计**（重要）：
   根据角色特性设计合理的使用条件，例如：
   - 冰系魔术师：可能需要"场上存在冰属性阵地"
   - 火系魔术师：可能需要"目标被灼烧状态"
   - 封印系：可能需要"上回合成功封印过技能"
   强力技能必须有对应的限制条件！

`;

    // 提取角色的技能命名模式
    const namingPatterns = this.extractNamingPatterns(allBaseSkills);
    
    const userPrompt = `
【角色设定】
* 名称：${characterProfile.name}
* 人物描述：${characterProfile.desc}
* 性格特点：${characterProfile.personality}
* 魔术体系/战斗风格：${characterProfile.magicStyle}

【角色的基础技能库】（用于参考整体风格和可能的协同）
${allBaseSkills.map(s => `- [${s.name}] (${s.type}): ${s.description || s.effect}`).join('\n')}

【技能命名模式分析】
${namingPatterns}

【需要衍生的基础技能】
* ID: ${baseSkill.id}
* 名称: ${baseSkill.name}
* 类型: ${baseSkill.type}
* 威力: ${baseSkill.power || 50}
* 消耗: ${baseSkill.cost || 15}
* 命中: ${baseSkill.accuracy || 85}
* 描述: ${baseSkill.description || baseSkill.effect}
* 现有效果: ${JSON.stringify(baseSkill.effects || [])}

【生成要求】
请生成 ${count} 个衍生技能，包含：
- 至少1个 rare 级别
- 至少1个 epic 级别
- 可选1个 legendary 级别（如果基础技能足够强力）

确保：
1. 所有技能符合"${characterProfile.name}"的魔术体系
2. 命名风格与角色已有技能一致
3. 衍生技能是基础技能的合理延伸，而非凭空创造的新能力
4. 考虑与其他基础技能的协同可能性
5. flavorText 必须是拉丁文


【输出格式 - 极其重要！】
⚠️ 你必须且只能返回一个有效的 JSON 数组，不要输出任何其他内容！
⚠️ 不要使用 markdown 代码块（不要写 \`\`\`json）
⚠️ 不要输出任何解释性文字
⚠️ 直接以 [ 开头，以 ] 结尾

正确的输出示例：
[{"id":"ice_lance_enhanced","name":"氷結断罪・貫通","type":"attack","power":70,"cost":18,"accuracy":88,"description":"强化版冰枪","flavorText":"Glacies acutus!","flavorTextTranslation":"尖锐之冰！","effects":[{"type":"damage","value":70,"duration":0,"target":"enemy"}],"conditions":[],"rarity":"rare","derivedFrom":"ice_lance_1","synergyWith":[]}]

每个技能对象必须包含以下字段：
- id: 唯一标识（英文小写加下划线）
- name: 技能名称
- type: 技能类型（必须与基础技能相同）
- power: 威力数值（5-100）
- cost: 消耗数值（1-50）
- accuracy: 命中率（50-100）
- description: 效果描述
- flavorText: 拉丁文咏唱词
- flavorTextTranslation: 中文翻译
- effects: 效果数组
- conditions: 条件数组
- rarity: 稀有度（rare/epic/legendary）
- derivedFrom: 基础技能id
- synergyWith: 协同技能id数组
`;

    try {
      const response = await this.callLLM(systemPrompt, userPrompt, { temperature: 0.85 });
      return this.parseAndValidateSkills(response, baseSkill);
    } catch (error) {
      console.error(`技能衍生失败 (${baseSkill.name}):`, error);
      return [];
    }
  }

  /**
   * 分析角色技能的命名模式
   */
  static extractNamingPatterns(skills) {
    const patterns = [];
    
    if (!skills || skills.length === 0) {
      return '无现有技能参考，请根据角色设定自由设计';
    }

    // 检测常见的命名结构
    const hasChinesePrefix = skills.some(s => /^[\u4e00-\u9fa5]{2,4}[・·]/.test(s.name));
    const hasJapaneseStyle = skills.some(s => /[\u3040-\u309f\u30a0-\u30ff]/.test(s.name));
    const hasNumbering = skills.some(s => /[一二三四五六七八九十]|[1-9]/.test(s.name));
    
    if (hasChinesePrefix) {
      patterns.push('使用"概念词・具体名"的结构（如"氷結断罪・一之枪"）');
    }
    if (hasJapaneseStyle) {
      patterns.push('混合日语假名增加风格感');
    }
    if (hasNumbering) {
      patterns.push('可能使用序号表示技能等级');
    }
    
    // 提取常见词汇
    const commonWords = this.extractCommonWords(skills.map(s => s.name));
    if (commonWords.length > 0) {
      patterns.push(`常用词汇：${commonWords.join('、')}`);
    }
    
    return patterns.length > 0 ? patterns.join('\n') : '无明显固定模式，可自由发挥但需符合角色气质';
  }

  /**
   * 提取常用词汇
   */
  static extractCommonWords(names) {
    const wordCount = {};
    names.forEach(name => {
      const words = name.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
      words.forEach(w => {
        wordCount[w] = (wordCount[w] || 0) + 1;
      });
    });
    return Object.entries(wordCount)
      .filter(([_, count]) => count >= 2)
      .map(([word]) => word);
  }

  /**
   * 验证并解析生成的技能
   * 增强的错误处理，支持多种LLM返回格式
   */
  static parseAndValidateSkills(response, baseSkill) {
    let skills = [];
    
    try {
      // 1. 清理响应文本
      let cleanResponse = response
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      // 2. 尝试找到 JSON 数组
      let jsonContent = null;
      
      // 方法A: 尝试找到 [ ... ] 数组
      const firstBracket = cleanResponse.indexOf('[');
      const lastBracket = cleanResponse.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        jsonContent = cleanResponse.substring(firstBracket, lastBracket + 1);
      }
      
      // 方法B: 如果没有数组，尝试找到 { ... } 对象
      if (!jsonContent) {
        const firstBrace = cleanResponse.indexOf('{');
        const lastBrace = cleanResponse.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonContent = cleanResponse.substring(firstBrace, lastBrace + 1);
        }
      }
      
      // 3. 如果找不到有效的 JSON 结构，返回空数组
      if (!jsonContent) {
        console.warn('LLM 返回的内容不包含有效的 JSON 结构，尝试解析为纯文本...');
        console.warn('原始响应前200字符:', response.substring(0, 200));
        return [];
      }
      
      // 4. 修复常见的 JSON 格式问题
      jsonContent = jsonContent
        // 修复尾随逗号
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        // 修复单引号
        .replace(/'/g, '"')
        // 修复没有引号的键名
        .replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      
      // 5. 尝试解析 JSON
      const parsed = JSON.parse(jsonContent);
      
      // 6. 处理不同的返回格式
      if (Array.isArray(parsed)) {
        skills = parsed;
      } else if (parsed.skills && Array.isArray(parsed.skills)) {
        skills = parsed.skills;
      } else if (typeof parsed === 'object' && parsed.name) {
        // 单个技能对象
        skills = [parsed];
      } else {
        console.warn('无法识别的 JSON 结构:', typeof parsed);
        return [];
      }
      
    } catch (e) {
      console.error('技能 JSON 解析失败:', e.message);
      console.error('原始响应前500字符:', response.substring(0, 500));
      
      // 最后尝试：使用正则表达式提取技能信息
      try {
        skills = this.extractSkillsFromText(response, baseSkill);
        if (skills.length > 0) {
          console.log(`使用文本提取恢复了 ${skills.length} 个技能`);
        }
      } catch (extractError) {
        console.error('文本提取也失败:', extractError.message);
        return [];
      }
    }

    // 验证并修正每个技能
    return skills.map((skill, index) => {
      if (!skill || typeof skill !== 'object') {
        return null;
      }
      
      // 强制类型一致
      skill.type = baseSkill.type;
      
      // 数值边界检查
      const basePower = baseSkill.power || 50;
      const baseCost = baseSkill.cost || 15;
      const baseAccuracy = baseSkill.accuracy || 85;
      
      skill.power = Math.min(100, Math.max(5, Number(skill.power) || basePower));
      skill.cost = Math.min(50, Math.max(1, Number(skill.cost) || baseCost));
      skill.accuracy = Math.min(100, Math.max(50, Number(skill.accuracy) || baseAccuracy));
      
      // 确保必要字段
      skill.isBase = false;
      skill.derivedFrom = baseSkill.id;
      skill.effects = Array.isArray(skill.effects) ? skill.effects : [];
      skill.conditions = Array.isArray(skill.conditions) ? skill.conditions : [];
      skill.synergyWith = Array.isArray(skill.synergyWith) ? skill.synergyWith : [];
      
      // 生成唯一ID
      if (!skill.id || skill.id === baseSkill.id) {
        skill.id = `${baseSkill.id}_derived_${skill.rarity || 'common'}_${index}_${Date.now()}`;
      }
      
      // 确保有描述
      if (!skill.description) {
        skill.description = skill.effect || baseSkill.description || baseSkill.effect || '衍生技能';
      }
      
      // 确保有名称
      if (!skill.name) {
        skill.name = `${baseSkill.name}・衍生${index + 1}`;
      }
      
      // 设置默认稀有度
      if (!skill.rarity) {
        skill.rarity = index === 0 ? 'rare' : 'epic';
      }
      
      return skill;
    }).filter(skill => skill && skill.name && skill.description);
  }

  /**
   * 从纯文本中提取技能信息（后备方案）
   */
  static extractSkillsFromText(text, baseSkill) {
    const skills = [];
    
    // 尝试匹配技能名称模式（中日文混合的技能名）
    const namePatterns = [
      /[「『【]([^」』】]+)[」』】]/g,  // 匹配引号内的内容
      /技能[：:]\s*(.+?)(?:\n|$)/g,     // 匹配"技能："后的内容
      /名称[：:]\s*(.+?)(?:\n|$)/g      // 匹配"名称："后的内容
    ];
    
    const foundNames = [];
    for (const pattern of namePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1] && match[1].length > 2 && match[1].length < 30) {
          foundNames.push(match[1].trim());
        }
      }
    }
    
    // 去重并创建技能
    const uniqueNames = [...new Set(foundNames)].slice(0, 3);
    
    for (let i = 0; i < uniqueNames.length; i++) {
      skills.push({
        id: `${baseSkill.id}_extracted_${i}_${Date.now()}`,
        name: uniqueNames[i],
        type: baseSkill.type,
        power: Math.round(baseSkill.power * (0.9 + Math.random() * 0.3)),
        cost: Math.round(baseSkill.cost * (0.8 + Math.random() * 0.4)),
        accuracy: Math.round(baseSkill.accuracy * (0.95 + Math.random() * 0.1)),
        description: `${baseSkill.name}的衍生技能`,
        flavorText: '',
        effects: baseSkill.effects || [],
        conditions: [],
        rarity: i === 0 ? 'rare' : 'epic',
        isBase: false,
        derivedFrom: baseSkill.id
      });
    }
    
    return skills;
  }

  /**
   * 批量为角色生成所有衍生技能
   */
  static async generateAllDerivedSkills(characterProfile, derivedPerSkill = 2) {
    const baseSkills = characterProfile.baseSkills || characterProfile.moves || [];
    const allSkills = [];
    
    // 首先添加所有基础技能（转换格式）
    for (const baseSkill of baseSkills) {
      allSkills.push({
        ...baseSkill,
        isBase: true,
        power: baseSkill.power || 50,
        cost: baseSkill.cost || 15,
        accuracy: baseSkill.accuracy || 85,
        effects: baseSkill.effects || [],
        conditions: baseSkill.conditions || [],
        description: baseSkill.description || baseSkill.effect,
        flavorText: baseSkill.flavorText || '',
        rarity: 'common'
      });
    }
    
    // 为每个基础技能生成衍生技能
    for (const baseSkill of baseSkills) {
      try {
        console.log(`  衍生技能: ${baseSkill.name}...`);
        const derived = await this.deriveSkills(
          baseSkill,
          characterProfile,
          baseSkills,
          derivedPerSkill
        );
        allSkills.push(...derived);
        console.log(`    生成了 ${derived.length} 个衍生技能`);
      } catch (error) {
        console.error(`  技能 ${baseSkill.name} 衍生失败:`, error.message);
      }
    }
    
    return allSkills;
  }

  /**
   * 随机选择技能（保证基础技能+部分衍生技能）
   */
  static selectRandomSkills(allSkills, maxCount = 8) {
    const baseSkills = allSkills.filter(s => s.isBase);
    const derivedSkills = allSkills.filter(s => !s.isBase);
    
    // 保留所有基础技能
    const selected = [...baseSkills];
    
    // 随机添加衍生技能
    const remainingSlots = Math.max(0, maxCount - selected.length);
    const shuffled = derivedSkills.sort(() => Math.random() - 0.5);
    selected.push(...shuffled.slice(0, remainingSlots));
    
    return selected;
  }

  /**
   * 快速条件检查（纯代码，不使用LLM）
   */
  static quickConditionCheck(skill, battleState) {
    const { user, enemy, field, turn } = battleState;

    if (!skill.conditions || skill.conditions.length === 0) {
      // 只检查MP
      if (user.mp < (skill.cost || 0)) {
        return { canUse: false, reason: `MP不足（需要${skill.cost}，当前${user.mp}）` };
      }
      return { canUse: true, reason: '' };
    }

    for (const condition of skill.conditions) {
      switch (condition.type) {
        case 'mp_above':
          if (user.mp < condition.value) {
            return { canUse: false, reason: `MP需高于${condition.value}（当前${user.mp}）` };
          }
          break;
        case 'hp_below':
          const hpTarget = condition.target === 'enemy' ? enemy : user;
          const hpPercent = (hpTarget.hp / hpTarget.maxHp) * 100;
          if (hpPercent > condition.value) {
            return { canUse: false, reason: `HP需低于${condition.value}%` };
          }
          break;
        case 'hp_above':
          const hpTarget2 = condition.target === 'enemy' ? enemy : user;
          const hpPercent2 = (hpTarget2.hp / hpTarget2.maxHp) * 100;
          if (hpPercent2 < condition.value) {
            return { canUse: false, reason: `HP需高于${condition.value}%` };
          }
          break;
        case 'field_exists':
          if (!field.activeEffects || !field.activeEffects.some(e => e.type === condition.value)) {
            return { canUse: false, reason: `需要存在${condition.value}类型的场地效果` };
          }
          break;
        case 'cooldown':
          const lastUsed = user.skillCooldowns?.[skill.id] || 0;
          if (turn - lastUsed < condition.value) {
            return { canUse: false, reason: `冷却中（剩余${condition.value - (turn - lastUsed)}回合）` };
          }
          break;
        case 'turn_count':
          if (turn < condition.value) {
            return { canUse: false, reason: `需要第${condition.value}回合后才能使用` };
          }
          break;
        case 'sealed_enemy':
          if (!enemy.sealedSkills || enemy.sealedSkills.length === 0) {
            return { canUse: false, reason: '需要敌人有被封印的技能' };
          }
          break;
      }
    }

    // 检查MP消耗
    if (user.mp < (skill.cost || 0)) {
      return { canUse: false, reason: `MP不足（需要${skill.cost}，当前${user.mp}）` };
    }

    return { canUse: true, reason: '' };
  }

  /**
   * 检查技能是否被封印
   */
  static isSkillSealed(skill, character, turn) {
    if (!character.sealedSkills) return false;
    const sealed = character.sealedSkills.find(s => s.id === skill.id);
    return sealed && sealed.until > turn;
  }
}

module.exports = SkillDerivationService;
module.exports.SKILL_TYPES = SKILL_TYPES;
module.exports.RARITY = RARITY;


/**
 * 战斗描述系统 (NarrativeSystem)
 * 负责生成小说化的战斗文本
 * 接收战斗判定结果，输出奈须蘑菇风格的战斗描写
 * 
 * v2.0: 新增记忆系统，支持剧情连续性和无缝衔接
 */

const config = require('../../config');
const fetch = globalThis.fetch;

// 记忆配置
const MEMORY_CONFIG = {
  MAX_FULL_NARRATIVES: 3,      // 保留完整叙述的回合数
  MAX_SUMMARY_TURNS: 10,       // 保留摘要的回合数
  SUMMARY_MAX_LENGTH: 150      // 每回合摘要的最大长度
};

class NarrativeSystem {

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
        temperature: options.temperature || 0.9
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
   * 生成战斗描述（带记忆系统）
   * @param {Object} battleResult - 战斗判定结果
   * @param {Object} userProfile - 用户角色设定
   * @param {Object} enemyProfile - 敌人角色设定
   * @param {Array} battleHistory - 战斗历史（包含之前的叙述和摘要）
   * @returns {Object} { narrative: 战斗描写文本, summary: 本回合摘要 }
   */
  static async generateNarrative(battleResult, userProfile, enemyProfile, battleHistory = []) {
    
    // 构建记忆上下文
    const memoryContext = this.buildMemoryContext(battleHistory, userProfile.name, enemyProfile.name);
    
    const systemPrompt = `
你是一名《Fate/Stay Night》及《魔法使之夜》风格的战斗小说家（奈须蘑菇风格）。
根据提供的战斗判定数据，生成**纯粹的小说文本**。

【🚫 绝对禁止的内容 - 违反将导致输出无效 🚫】
1. **禁止游戏术语**：不得出现以下词汇：
   - "回合"、"回合结束"、"本回合"、"第X回合"
   - "HP"、"MP"、"伤害值"、"治疗量"、"减少了XX点"
   - "命中率"、"暴击率"、"成功率"
   - "技能发动"、"效果触发"、"冷却"
   - "状态"、"Buff"、"Debuff"
   - 任何游戏化的数值表述

2. **禁止元叙述**：不得出现：
   - "战况分析"、"当前局势"
   - "接下来"、"随后的战斗"等预告式语句
   - 任何总结性的状态报告

3. **禁止人称代词**：只使用角色名"${userProfile.name}"和"${enemyProfile.name}"，禁止"你/我/他/她"

【✅ 正确的写作方式 - 数据转化为文学描写】
- ❌ "造成45点伤害" → ✅ "剑刃划破肩胛，鲜血飞溅而出"
- ❌ "HP降低到30%" → ✅ "身躯摇晃，膝盖几乎跪地，呼吸变得粗重"
- ❌ "防御成功，减免伤害" → ✅ "结界在千钧一发之际展开，魔力火花四溅"
- ❌ "回合结束" → ✅ 用自然的段落收束，描写双方短暂对峙的瞬间
- ❌ "暴击！造成双倍伤害" → ✅ "那一击仿佛撕裂了空间本身，血雾弥漫"
- ❌ "MP不足" → ✅ "魔力回路发出刺耳的悲鸣，身体开始不听使唤"

【🔴 剧情连续性规则 🔴】
1. **承接上文**：开头必须自然承接上一段叙述的结尾
2. **情感连贯**：角色的情绪、体力、战意必须自然发展
3. **细节呼应**：引用之前描写的伤口、环境变化、对话
4. **避免重复**：不要重复相同的动作描写或修辞


【技能类型与描写风格】
- attack：激烈的攻防交锋，魔力碰撞的冲击波
- defense：坚固的防御阵势，屏障的光芒
- seal：诡谲的封印术式，魔力锁链的缠绕
- field：环境剧变，空间被改写的压迫感
- recovery：魔力回流的温暖，伤口愈合的痒感

【必须包含的元素】
- 双方的动作细节（姿态、表情、呼吸、视线）
- 2-4句符合角色性格的**对话**
- 技能咏唱的拉丁文（如果有flavorText）
- 魔力流动与环境变化的描写
- 角色的心理活动和战术思考

【文学技巧】
- 比喻："寒意如刀刃般切入灵魂"
- 通感："那抹蓝光尝起来像是死亡的味道"
- 时间操控："那一瞬间仿佛被无限拉长"
- 留白与悬念


`;

    // 构建效果的叙事化描述（避免游戏术语）
    const userEffectsNarrative = this.convertEffectsToNarrative(battleResult.user.effects, userProfile.name, enemyProfile.name);
    const enemyEffectsNarrative = this.convertEffectsToNarrative(battleResult.enemy.effects, enemyProfile.name, userProfile.name);

    // 获取HP/MP数值（只传数值，让AI自行判断状态）
    const userHpInfo = this.getHpStatusDesc(battleResult.summary.userHp, battleResult.summary.userMaxHp);
    const enemyHpInfo = this.getHpStatusDesc(battleResult.summary.enemyHp, battleResult.summary.enemyMaxHp);
    const userMpInfo = `${battleResult.summary.userMp}/${battleResult.summary.userMaxMp}`;
    const enemyMpInfo = `${battleResult.summary.enemyMp}/${battleResult.summary.enemyMaxMp}`;

    // 场地变化的文学描述
    const fieldNarrative = battleResult.field.changes.length > 0 
      ? battleResult.field.changes.map(f => `${f.fieldType}属性的魔力开始支配这片战场`).join('；')
      : '';

    const userPrompt = `
【角色设定】
◆ ${userProfile.name}
- 性格：${userProfile.personality}
- 魔术风格：${userProfile.magicStyle}
- 生命力：${userHpInfo}
- 魔力：${userMpInfo}

◆ ${enemyProfile.name}
- 性格：${enemyProfile.personality}
- 魔术风格：${enemyProfile.magicStyle}
- 生命力：${enemyHpInfo}
- 魔力：${enemyMpInfo}

${memoryContext}

【本段情节要点】（仅供参考，请转化为文学描写，不要直接提及）
战斗进程：第${battleResult.turn}次交锋
先后顺序：${battleResult.actionOrder?.join('先手，') || '同时'}发动

◆ ${userProfile.name}施展的魔术：
「${battleResult.user.skill.name}」
${battleResult.user.skill.description || battleResult.user.skill.effect}
${battleResult.user.skill.flavorText ? `咏唱词："${battleResult.user.skill.flavorText}"` : ''}
结果：${userEffectsNarrative}

◆ ${enemyProfile.name}施展的魔术：
「${battleResult.enemy.skill.name}」
${battleResult.enemy.skill.description || battleResult.enemy.skill.effect}
${battleResult.enemy.skill.flavorText ? `咏唱词："${battleResult.enemy.skill.flavorText}"` : ''}
结果：${enemyEffectsNarrative}

${fieldNarrative ? `【环境变化】${fieldNarrative}` : ''}

${battleResult.summary.isBattleEnd 
  ? `【情节走向】这是战斗的终结。${battleResult.summary.winner === 'user' ? userProfile.name : enemyProfile.name}获得了最终的胜利。请描写胜者的姿态和败者倒下的场景，不要使用"战斗结束"这样的词语。`
  : ''}

【🔴🔴🔴 最重要的规则：续写衔接 🔴🔴🔴】
${battleHistory.length > 0 
  ? `你的任务是【续写】上一段剧情，不是重新开始！

⚠️ 绝对禁止：
- 重新描写战斗开始的场景
- 重新介绍角色或环境
- 写与上一段无关的新开头

✅ 正确做法：
- 从上一段的【最后一句话】之后继续写
- 第一句话必须直接承接上一段的结尾动作/情绪/场景
- 如同你在写一本小说的下一页

【上一段结尾参考】
请仔细阅读剧情记忆中【最近回合的完整叙述】的最后几句话，你的续写必须从那里开始。`
  : '这是战斗的第一段，请描写双方初次正面交锋的紧张氛围。'}

【禁止游戏术语】
不要出现：回合、HP、MP、伤害值、命中率、技能发动、状态报告等游戏化词语。

【禁止人称代词】
只用角色名"${userProfile.name}"和"${enemyProfile.name}"，禁止"你/我/他/她"。

${battleResult.summary.isBattleEnd ? '' : `【🚫 禁止总结性/结尾性语句 🚫】
战斗还在继续！绝对不要写：
- "这场战斗才刚刚开始"、"战斗仍在继续"等总结句
- "胜负未分"、"鹿死谁手尚未可知"等评论句
- "双方都知道..."、"接下来的战斗..."等预告句
- 任何暗示段落结束或章节结束的语句
- 任何对战局的总结性评价

你只需要描写【正在发生的战斗动作】，写到某个动作或场景的中间就停下，像被截断一样。
下一段会从你停下的地方继续。`}

【输出要求】
- 纯粹的小说文本，500-800字
- 使用 \\n\\n 分隔段落
- ${battleResult.summary.isBattleEnd ? '描写战斗结束的场景' : '结尾停在某个动作或场景的进行中，不要收束'}

⚠️ 直接输出小说内容，${battleHistory.length > 0 ? '第一句话就要承接上一段！' : ''}${battleResult.summary.isBattleEnd ? '' : '最后不要写总结句！'}
`;

    try {
      const narrative = await this.callLLM(systemPrompt, userPrompt, { temperature: 0.92 });
      
      // 生成本回合的摘要（用于记忆系统）
      const summary = this.extractNarrativeSummary(narrative, battleResult, userProfile.name, enemyProfile.name);
      
      return {
        narrative,
        summary
      };
    } catch (error) {
      console.error('战斗描述生成失败:', error);
      const fallback = this.generateFallbackNarrative(battleResult, userProfile, enemyProfile);
      return {
        narrative: fallback,
        summary: this.extractNarrativeSummary(fallback, battleResult, userProfile.name, enemyProfile.name)
      };
    }
  }

  /**
   * 构建记忆上下文 - 将历史战斗转化为LLM可理解的上下文
   */
  static buildMemoryContext(battleHistory, userName, enemyName) {
    if (!battleHistory || battleHistory.length === 0) {
      return '【剧情背景】\n这是战斗的开始，双方第一次正式交锋。';
    }

    let context = '【📖 剧情记忆 - 请确保内容连贯！】\n';
    
    // 1. 早期回合：只保留摘要
    const earlyTurns = battleHistory.slice(0, -MEMORY_CONFIG.MAX_FULL_NARRATIVES);
    if (earlyTurns.length > 0) {
      context += '\n--- 早期回合摘要 ---\n';
      earlyTurns.slice(-MEMORY_CONFIG.MAX_SUMMARY_TURNS).forEach(turn => {
        if (turn.summary) {
          context += `[回合${turn.turn}] ${turn.summary}\n`;
        } else {
          // 如果没有摘要，创建一个简短的
          context += `[回合${turn.turn}] ${turn.userSkillName || turn.userMoveName} vs ${turn.enemySkillName || turn.ai}\n`;
        }
      });
    }

    // 2. 最近几个回合：保留完整叙述
    const recentTurns = battleHistory.slice(-MEMORY_CONFIG.MAX_FULL_NARRATIVES);
    if (recentTurns.length > 0) {
      context += '\n--- 最近回合的完整叙述（请仔细阅读并承接）---\n';
      recentTurns.forEach((turn, index) => {
        context += `\n【回合 ${turn.turn}】\n`;
        context += `技能对决：${turn.userSkillName || turn.userMoveName} vs ${turn.enemySkillName || turn.ai}\n`;
        if (turn.narrative) {
          // 只保留最后一个回合的完整叙述，其他的截取
          if (index === recentTurns.length - 1) {
            context += `叙述：\n${turn.narrative}\n`;
          } else {
            // 截取关键段落
            const paragraphs = turn.narrative.split(/\n\n+/);
            const keyParts = paragraphs.length > 2 
              ? `${paragraphs[0]}\n...\n${paragraphs[paragraphs.length - 1]}`
              : turn.narrative;
            context += `叙述摘要：${keyParts.substring(0, 500)}...\n`;
          }
        }
      });
    }

    // 3. 提取关键剧情线索
    const plotHints = this.extractPlotHints(battleHistory, userName, enemyName);
    if (plotHints) {
      context += `\n--- 重要剧情线索 ---\n${plotHints}\n`;
    }

    return context;
  }

  /**
   * 提取剧情关键线索
   */
  static extractPlotHints(battleHistory, userName, enemyName) {
    const hints = [];
    
    battleHistory.forEach(turn => {
      // 检测暴击事件
      if (turn.userEffects?.some(e => e.isCritical)) {
        hints.push(`回合${turn.turn}: ${userName}打出了暴击`);
      }
      if (turn.enemyEffects?.some(e => e.isCritical)) {
        hints.push(`回合${turn.turn}: ${enemyName}打出了暴击`);
      }
      
      // 检测封印事件
      if (turn.userEffects?.some(e => e.type === 'seal' && e.success)) {
        hints.push(`回合${turn.turn}: ${userName}成功封印了技能`);
      }
      
      // 检测场地效果
      if (turn.fieldChanges?.length > 0) {
        hints.push(`回合${turn.turn}: 场地发生变化 - ${turn.fieldChanges.map(f => f.fieldType).join(', ')}`);
      }
    });

    return hints.slice(-5).join('\n'); // 只保留最近5个关键事件
  }

  /**
   * 从生成的叙述中提取摘要
   */
  static extractNarrativeSummary(narrative, battleResult, userName, enemyName) {
    // 提取关键句子作为摘要
    const sentences = narrative.split(/[。！？\n]+/).filter(s => s.trim().length > 10);
    
    // 优先选择包含角色名的句子
    const keysSentences = sentences.filter(s => 
      s.includes(userName) || s.includes(enemyName)
    );
    
    // 构建摘要
    let summary = '';
    
    // 添加技能信息
    summary += `${userName}使用「${battleResult.user.skill.name}」`;
    
    // 添加效果
    const userDamage = battleResult.user.effects.find(e => e.type === 'damage' && !e.miss);
    if (userDamage) {
      summary += `造成${userDamage.value}伤害${userDamage.isCritical ? '(暴击)' : ''}`;
    }
    
    summary += `，${enemyName}以「${battleResult.enemy.skill.name}」反击`;
    
    const enemyDamage = battleResult.enemy.effects.find(e => e.type === 'damage' && !e.miss);
    if (enemyDamage) {
      summary += `造成${enemyDamage.value}伤害`;
    }
    
    // 添加一个关键叙述句
    if (keysSentences.length > 0) {
      const keySentence = keysSentences[Math.floor(keysSentences.length / 2)];
      if (keySentence.length < 80) {
        summary += `。${keySentence}`;
      }
    }
    
    return summary.substring(0, MEMORY_CONFIG.SUMMARY_MAX_LENGTH);
  }

  /**
   * 格式化效果描述
   */
  static formatEffects(effects, actorName) {
    if (!effects || effects.length === 0) {
      return '- 无特殊效果';
    }

    return effects.map(effect => {
      switch (effect.type) {
        case 'damage':
          if (effect.miss) {
            return `- 攻击未命中`;
          }
          let damageDesc = `- 造成 ${effect.value} 点伤害`;
          if (effect.isCritical) {
            damageDesc += ' [暴击！]';
          }
          if (effect.breakdown?.typeMultiplier > 1) {
            damageDesc += ' [类型克制]';
          } else if (effect.breakdown?.typeMultiplier < 1) {
            damageDesc += ' [类型被克]';
          }
          return damageDesc;
        
        case 'defense':
          return `- 展开防御，获得 ${effect.value} 点防御值，减伤 ${effect.damageReductionPercent}%，持续 ${effect.duration} 回合`;
        
        case 'heal':
          return `- 回复 ${effect.value} 点 ${effect.healType === 'mp' ? 'MP' : 'HP'}`;
        
        case 'seal':
          if (effect.success) {
            return `- 封印成功！封印了技能：${effect.sealedSkills?.join(', ')}，持续 ${effect.duration} 回合`;
          } else {
            return `- 封印失败（成功率 ${effect.sealChance}%，掷骰 ${effect.roll}）`;
          }
        
        case 'field':
          return `- 展开「${effect.fieldType}」属性阵地，持续 ${effect.duration} 回合`;
        
        default:
          return `- ${effect.type}: ${JSON.stringify(effect)}`;
      }
    }).join('\n');
  }

  /**
   * 获取HP状态 - 只返回数值，让AI自行判断状态
   */
  static getHpStatusDesc(hp, maxHp) {
    return `${hp}/${maxHp}`;
  }

  /**
   * 将效果转化为叙事性描述（避免游戏术语）
   */
  static convertEffectsToNarrative(effects, actorName, targetName) {
    if (!effects || effects.length === 0) {
      return '魔术发动，效果不明显';
    }

    const narratives = [];
    
    for (const effect of effects) {
      switch (effect.type) {
        case 'damage':
          if (effect.miss) {
            narratives.push(`攻击落空，${targetName}成功闪避`);
          } else if (effect.isCritical) {
            narratives.push(`命中要害，${targetName}受到重创，身体剧烈摇晃`);
          } else if (effect.value > 40) {
            narratives.push(`强力命中，${targetName}被击退数步，嘴角溢出鲜血`);
          } else if (effect.value > 20) {
            narratives.push(`命中${targetName}，留下了不浅的伤口`);
          } else {
            narratives.push(`擦过${targetName}，造成了轻微的伤害`);
          }
          break;
        
        case 'defense':
          if (effect.value > 30) {
            narratives.push(`展开了强力的防御结界，光芒璀璨`);
          } else {
            narratives.push(`魔力凝聚成防护屏障`);
          }
          break;
        
        case 'heal':
          if (effect.healType === 'mp') {
            narratives.push(`魔力回路重新活跃，精神恢复`);
          } else if (effect.value > 30) {
            narratives.push(`伤口以肉眼可见的速度愈合，气色好转`);
          } else {
            narratives.push(`魔力回流，些许伤势得到缓解`);
          }
          break;
        
        case 'seal':
          if (effect.success) {
            narratives.push(`封印术式成功刻印，${targetName}的部分魔术被封锁`);
          } else {
            narratives.push(`封印术式被${targetName}挣脱`);
          }
          break;
        
        case 'field':
          narratives.push(`${effect.fieldType}属性的魔力开始支配战场`);
          break;
        
        default:
          narratives.push(`魔术效果显现`);
      }
    }
    
    return narratives.join('；');
  }

  /**
   * 生成备用描述（当LLM失败时使用）
   */
  static generateFallbackNarrative(battleResult, userProfile, enemyProfile) {
    const userSkill = battleResult.user.skill;
    const enemySkill = battleResult.enemy.skill;
    const userEffects = battleResult.user.effects;
    const enemyEffects = battleResult.enemy.effects;

    let narrative = `第${battleResult.turn}回合——\n\n`;

    // 用户行动
    narrative += `${userProfile.name}发动了「${userSkill.name}」。`;
    if (userSkill.flavorText) {
      narrative += `\n"${userSkill.flavorText}"\n`;
    }
    
    userEffects.forEach(effect => {
      if (effect.type === 'damage' && !effect.miss) {
        narrative += `攻击命中，造成了${effect.value}点伤害${effect.isCritical ? '（暴击！）' : ''}。`;
      } else if (effect.type === 'damage' && effect.miss) {
        narrative += `然而攻击落空了。`;
      } else if (effect.type === 'defense') {
        narrative += `防御结界展开，获得了${effect.value}点防御值。`;
      } else if (effect.type === 'heal') {
        narrative += `魔力回流，回复了${effect.value}点${effect.healType === 'mp' ? 'MP' : 'HP'}。`;
      }
    });

    narrative += '\n\n';

    // 敌人行动
    narrative += `${enemyProfile.name}以「${enemySkill.name}」回应。`;
    if (enemySkill.flavorText) {
      narrative += `\n"${enemySkill.flavorText}"\n`;
    }
    
    enemyEffects.forEach(effect => {
      if (effect.type === 'damage' && !effect.miss) {
        narrative += `攻击命中，造成了${effect.value}点伤害${effect.isCritical ? '（暴击！）' : ''}。`;
      } else if (effect.type === 'damage' && effect.miss) {
        narrative += `然而攻击被${userProfile.name}闪避了。`;
      }
    });

    narrative += '\n\n';

    // 状态汇总
    narrative += `【当前状态】\n`;
    narrative += `${userProfile.name}: HP ${battleResult.summary.userHp}/${battleResult.summary.userMaxHp}\n`;
    narrative += `${enemyProfile.name}: HP ${battleResult.summary.enemyHp}/${battleResult.summary.enemyMaxHp}\n`;

    if (battleResult.summary.isBattleEnd) {
      const winner = battleResult.summary.winner === 'user' ? userProfile.name : enemyProfile.name;
      narrative += `\n战斗结束，${winner}获得了胜利！`;
    }

    return narrative;
  }

  /**
   * 生成技能发动的简短宣言（可用于UI展示）
   */
  static async generateSkillDeclaration(skill, character) {
    // 如果技能已有flavorText，直接返回
    if (skill.flavorText) {
      return {
        latin: skill.flavorText,
        translation: skill.flavorTextTranslation || ''
      };
    }

    // 否则生成一个简短的宣言
    const systemPrompt = `
你是一个魔术咏唱词设计师。为给定的技能生成一句拉丁文咏唱词。
要求：
1. 简短有力（5-15个拉丁单词）
2. 反映技能的核心效果
3. 符合角色的战斗风格
4. 同时提供中文翻译

输出格式（JSON）：
{"latin": "拉丁文咏唱词", "translation": "中文翻译"}
`;

    const userPrompt = `
角色：${character.name}
战斗风格：${character.magicStyle}
技能名称：${skill.name}
技能类型：${skill.type}
技能效果：${skill.description || skill.effect}
`;

    try {
      const response = await this.callLLM(systemPrompt, userPrompt, { temperature: 0.7 });
      const cleaned = response.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('咏唱词生成失败:', error);
      return {
        latin: 'Actio!',
        translation: '发动！'
      };
    }
  }

  /**
   * 生成战斗结束的总结文本
   */
  static async generateBattleConclusion(battleHistory, winner, loser, userProfile, enemyProfile) {
    const systemPrompt = `
你是一名战斗小说家。根据战斗历史，写一段简短的战斗结束总结。
要求：
1. 100-200字
2. 总结战斗的关键转折点
3. 描写胜者的姿态和败者的状态
4. 不使用人称代词，只用角色名
`;

    const historyDesc = battleHistory.slice(-5).map((turn, i) => 
      `回合${battleHistory.length - 5 + i + 1}: ${turn.userMoveName} vs ${turn.ai}`
    ).join('\n');

    const userPrompt = `
胜者：${winner}
败者：${loser}

最后5回合：
${historyDesc}

${winner}的风格：${winner === userProfile.name ? userProfile.magicStyle : enemyProfile.magicStyle}
`;

    try {
      return await this.callLLM(systemPrompt, userPrompt, { temperature: 0.8 });
    } catch (error) {
      return `${winner}赢得了这场战斗。${loser}倒在了战场上。`;
    }
  }
}

module.exports = NarrativeSystem;


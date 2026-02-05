/**
 * 战斗判定系统 (JudgmentSystem)
 * 负责所有战斗数值计算，不使用LLM，纯代码判定
 * 包括：伤害计算、命中判定、效果判定、状态更新
 */

const { SKILL_TYPES } = require('./skillDerivationService');

class JudgmentSystem {
  
  // ==================== 常量定义 ====================
  
  // 类型克制关系矩阵
  // 键为攻击方类型，值中的键为防御方上回合使用的技能类型
  static TYPE_ADVANTAGE = {
    attack: { 
      attack: 1.0,    // 攻对攻：正常
      defense: 0.6,   // 攻对防：被克制
      seal: 1.2,      // 攻对封：优势
      field: 1.0,     // 攻对阵：正常
      recovery: 1.4   // 攻对回：大优势
    },
    defense: { 
      attack: 1.4,    // 防对攻：大优势
      defense: 1.0,   // 防对防：正常
      seal: 0.7,      // 防对封：被克制
      field: 1.0,     // 防对阵：正常
      recovery: 1.0   // 防对回：正常
    },
    seal: { 
      attack: 0.7,    // 封对攻：被克制
      defense: 1.3,   // 封对防：优势
      seal: 1.0,      // 封对封：正常
      field: 1.5,     // 封对阵：大优势
      recovery: 0.8   // 封对回：轻微劣势
    },
    field: { 
      attack: 1.0,    // 阵对攻：正常
      defense: 1.0,   // 阵对防：正常
      seal: 0.6,      // 阵对封：被克制
      field: 1.0,     // 阵对阵：正常
      recovery: 1.2   // 阵对回：优势
    },
    recovery: { 
      attack: 0.6,    // 回对攻：被克制
      defense: 1.0,   // 回对防：正常
      seal: 1.2,      // 回对封：优势
      field: 0.8,     // 回对阵：轻微劣势
      recovery: 1.0   // 回对回：正常
    }
  };

  // 默认属性值
  static DEFAULT_STATS = {
    maxHp: 100,
    maxMp: 100,
    attack: 50,
    defense: 50,
    magic: 50,
    agility: 50,
    resistance: 50
  };

  // ==================== 命中判定 ====================
  
  /**
   * 判定技能是否命中
   * 命中率 = 基础命中率 × (1 + (攻方敏捷 - 守方敏捷) / 200)
   * @param {Object} skill - 使用的技能
   * @param {Object} attacker - 攻击方状态
   * @param {Object} defender - 防御方状态
   * @returns {Object} 命中结果
   */
  static calculateHit(skill, attacker, defender) {
    const attackerAgi = attacker.stats?.agility || this.DEFAULT_STATS.agility;
    const defenderAgi = defender.stats?.agility || this.DEFAULT_STATS.agility;
    
    const agiDiff = attackerAgi - defenderAgi;
    const baseAccuracy = skill.accuracy || 85;
    const hitChance = baseAccuracy * (1 + agiDiff / 200);
    const finalHitChance = Math.min(100, Math.max(10, hitChance)); // 10%-100%
    
    const roll = Math.random() * 100;
    const isHit = roll < finalHitChance;
    const isCritical = isHit && roll < finalHitChance * 0.1; // 10%暴击率
    
    return {
      isHit,
      isCritical,
      hitChance: Math.floor(finalHitChance),
      roll: Math.floor(roll)
    };
  }

  // ==================== 伤害计算 ====================
  
  /**
   * 计算攻击技能的最终伤害
   * 
   * 公式：
   * 原始伤害 = 技能威力 × (1 + 攻击力/100) × 随机波动(0.9-1.1)
   * 类型修正 = 类型克制系数
   * 防御减免 = 原始伤害 × (防御力 / (防御力 + 100))
   * 最终伤害 = max(1, (原始伤害 × 类型修正) - 防御减免)
   * 暴击时伤害 ×1.5
   * 
   * @param {Object} skill - 使用的技能
   * @param {Object} attacker - 攻击方状态
   * @param {Object} defender - 防御方状态
   * @param {Object} hitResult - 命中判定结果
   * @returns {Object} 伤害结果
   */
  static calculateDamage(skill, attacker, defender, hitResult) {
    if (!hitResult.isHit) {
      return { 
        damage: 0, 
        breakdown: { 
          miss: true,
          reason: '攻击未命中'
        } 
      };
    }

    // 1. 原始伤害
    const randomFactor = 0.9 + Math.random() * 0.2; // 0.9-1.1
    const attackStat = attacker.stats?.attack || this.DEFAULT_STATS.attack;
    const skillPower = skill.power || 50;
    const rawDamage = skillPower * (1 + attackStat / 100) * randomFactor;

    // 2. 类型克制
    const defenderLastType = defender.lastSkill?.type || 'attack';
    const skillType = skill.type || 'attack';
    const typeMultiplier = this.TYPE_ADVANTAGE[skillType]?.[defenderLastType] || 1.0;

    // 3. 防御减免
    const defenseStat = defender.stats?.defense || this.DEFAULT_STATS.defense;
    // 如果防御方有防御缓冲（上回合使用了防御技能）
    const defenseBuffer = defender.defenseBuffer || 0;
    const totalDefense = defenseStat + defenseBuffer;
    const defenseReduction = rawDamage * typeMultiplier * (totalDefense / (totalDefense + 100));

    // 4. 最终伤害
    let finalDamage = Math.max(1, (rawDamage * typeMultiplier) - defenseReduction);

    // 5. 暴击加成
    if (hitResult.isCritical) {
      finalDamage *= 1.5;
    }

    // 6. 场地效果加成
    // 这里可以添加场地效果的影响

    return {
      damage: Math.floor(finalDamage),
      breakdown: {
        rawDamage: Math.floor(rawDamage),
        typeMultiplier: typeMultiplier,
        defenseReduction: Math.floor(defenseReduction),
        isCritical: hitResult.isCritical,
        finalDamage: Math.floor(finalDamage)
      }
    };
  }

  // ==================== 防御技能效果 ====================
  
  /**
   * 计算防御技能效果
   * 防御值 = 技能威力 × (1 + 防御属性/100)
   * @param {Object} skill - 防御技能
   * @param {Object} defender - 使用者状态
   * @returns {Object} 防御效果
   */
  static calculateDefense(skill, defender) {
    const defenseStat = defender.stats?.defense || this.DEFAULT_STATS.defense;
    const skillPower = skill.power || 40;
    const defenseValue = skillPower * (1 + defenseStat / 100);
    
    const effect = skill.effects?.find(e => e.type === 'defense');
    
    return {
      defenseValue: Math.floor(defenseValue),
      duration: effect?.duration || 1,
      damageReductionPercent: Math.min(50, Math.floor(defenseValue / 2)) // 最高减伤50%
    };
  }

  // ==================== 回复技能效果 ====================
  
  /**
   * 计算回复量
   * 回复量 = 技能威力 × (1 + 魔力/100)
   * @param {Object} skill - 回复技能
   * @param {Object} caster - 使用者状态
   * @returns {Object} 回复效果
   */
  static calculateHealing(skill, caster) {
    const magicStat = caster.stats?.magic || this.DEFAULT_STATS.magic;
    const skillPower = skill.power || 30;
    const healAmount = skillPower * (1 + magicStat / 100);
    
    const effect = skill.effects?.find(e => e.type === 'heal');
    const target = effect?.target || 'self';
    
    // 判断是回复HP还是MP
    const healType = effect?.value === 'mp' ? 'mp' : 'hp';
    
    return {
      healAmount: Math.floor(healAmount),
      healType,
      target
    };
  }

  // ==================== 封印技能效果 ====================
  
  /**
   * 计算封印成功率和效果
   * 封印成功率 = 技能威力% × (1 + (施法者魔力 - 目标抗性) / 200)
   * @param {Object} skill - 封印技能
   * @param {Object} caster - 使用者状态
   * @param {Object} target - 目标状态
   * @returns {Object} 封印效果
   */
  static calculateSeal(skill, caster, target) {
    const casterMagic = caster.stats?.magic || this.DEFAULT_STATS.magic;
    const targetResistance = target.stats?.resistance || this.DEFAULT_STATS.resistance;
    
    const magicDiff = casterMagic - targetResistance;
    const skillPower = skill.power || 50;
    const sealChance = skillPower * (1 + magicDiff / 200);
    const finalChance = Math.min(95, Math.max(5, sealChance)); // 5%-95%
    
    const roll = Math.random() * 100;
    const isSealed = roll < finalChance;
    
    const effect = skill.effects?.find(e => e.type === 'seal');
    
    return {
      isSealed,
      sealChance: Math.floor(finalChance),
      roll: Math.floor(roll),
      duration: effect?.duration || 2,
      sealedSkillCount: Math.max(1, Math.ceil(skillPower / 30)) // 封印技能数量：1-3个
    };
  }

  // ==================== 阵地效果 ====================
  
  /**
   * 计算阵地效果
   * @param {Object} skill - 阵地技能
   * @param {Object} caster - 使用者状态
   * @returns {Object} 阵地效果
   */
  static calculateFieldEffect(skill, caster) {
    const effect = skill.effects?.find(e => e.type === 'field');
    const skillPower = skill.power || 40;
    
    return {
      fieldType: effect?.value || 'neutral',
      power: skillPower,
      duration: effect?.duration || 3,
      // 给己方的加成（攻击力/防御力/魔力等）
      bonusToOwner: {
        attack: Math.floor(skillPower * 0.15),
        defense: Math.floor(skillPower * 0.1),
        magic: Math.floor(skillPower * 0.1)
      },
      // 给敌方的减益
      penaltyToEnemy: {
        attack: Math.floor(skillPower * 0.05),
        defense: Math.floor(skillPower * 0.05),
        agility: Math.floor(skillPower * 0.08)
      }
    };
  }

  // ==================== 计算行动优先级 ====================
  
  /**
   * 计算行动优先级，决定谁先行动
   * @param {Object} skill - 使用的技能
   * @param {Object} actor - 行动者状态
   * @returns {Number} 优先级值
   */
  static calculatePriority(skill, actor) {
    const basePriority = actor.stats?.agility || this.DEFAULT_STATS.agility;
    
    // 技能类型影响优先级
    const typePriority = {
      defense: 30,    // 防御优先
      recovery: 20,   // 回复次优先
      seal: 10,       // 封印
      field: 0,       // 阵地
      attack: -10     // 攻击最后
    };
    
    return basePriority + (typePriority[skill.type] || 0) + Math.random() * 10;
  }

  // ==================== 完整回合判定 ====================
  
  /**
   * 执行完整的回合判定
   * @param {Object} userSkill - 用户使用的技能
   * @param {Object} enemySkill - 敌人使用的技能
   * @param {Object} battleState - 当前战斗状态
   * @returns {Object} 回合结果
   */
  static executeTurn(userSkill, enemySkill, battleState) {
    const { user, enemy, field, turn } = battleState;
    
    const result = {
      turn,
      user: { 
        skill: userSkill, 
        effects: [],
        mpCost: userSkill.cost || 0
      },
      enemy: { 
        skill: enemySkill, 
        effects: [],
        mpCost: enemySkill.cost || 0
      },
      field: { changes: [] },
      summary: {}
    };

    // 先手判定
    const userPriority = this.calculatePriority(userSkill, user);
    const enemyPriority = this.calculatePriority(enemySkill, enemy);
    
    const order = userPriority >= enemyPriority 
      ? [{ actor: 'user', skill: userSkill, source: user, target: enemy }, 
         { actor: 'enemy', skill: enemySkill, source: enemy, target: user }]
      : [{ actor: 'enemy', skill: enemySkill, source: enemy, target: user }, 
         { actor: 'user', skill: userSkill, source: user, target: enemy }];

    result.actionOrder = order.map(o => o.actor);

    // 清理过期的防御缓冲
    user.defenseBuffer = 0;
    enemy.defenseBuffer = 0;

    // 按顺序执行技能
    for (const action of order) {
      const { actor, skill, source, target } = action;
      
      // 检查是否已经被击败
      if (source.hp <= 0) continue;

      // 扣除MP
      source.mp = Math.max(0, source.mp - (skill.cost || 0));

      // 记录使用的技能（用于下回合的类型克制判定）
      source.lastSkill = skill;

      // 记录技能冷却
      if (!source.skillCooldowns) source.skillCooldowns = {};
      source.skillCooldowns[skill.id] = turn;

      // 根据技能类型处理
      switch (skill.type) {
        case 'attack':
          this.processAttack(skill, source, target, result[actor]);
          break;

        case 'defense':
          this.processDefense(skill, source, result[actor]);
          break;

        case 'recovery':
          this.processRecovery(skill, source, target, result[actor]);
          break;

        case 'seal':
          this.processSeal(skill, source, target, turn, result[actor]);
          break;

        case 'field':
          this.processField(skill, source, actor, field, turn, result);
          break;

        default:
          // 未知类型按攻击处理
          this.processAttack(skill, source, target, result[actor]);
      }
    }

    // 处理场地持续效果
    this.processFieldEffects(field, user, enemy, turn);

    // 清理过期效果
    this.cleanupExpiredEffects(field, user, enemy, turn);

    // 汇总结果
    result.summary = {
      userHp: Math.max(0, user.hp),
      userMp: Math.max(0, user.mp),
      userMaxHp: user.maxHp || user.stats?.maxHp || this.DEFAULT_STATS.maxHp,
      userMaxMp: user.maxMp || user.stats?.maxMp || this.DEFAULT_STATS.maxMp,
      enemyHp: Math.max(0, enemy.hp),
      enemyMp: Math.max(0, enemy.mp),
      enemyMaxHp: enemy.maxHp || enemy.stats?.maxHp || this.DEFAULT_STATS.maxHp,
      enemyMaxMp: enemy.maxMp || enemy.stats?.maxMp || this.DEFAULT_STATS.maxMp,
      isBattleEnd: user.hp <= 0 || enemy.hp <= 0,
      winner: user.hp <= 0 ? 'enemy' : (enemy.hp <= 0 ? 'user' : null)
    };

    // 更新战斗状态中的HP/MP
    user.hp = result.summary.userHp;
    user.mp = result.summary.userMp;
    enemy.hp = result.summary.enemyHp;
    enemy.mp = result.summary.enemyMp;

    return result;
  }

  // ==================== 技能处理函数 ====================

  static processAttack(skill, attacker, defender, resultObj) {
    const hitResult = this.calculateHit(skill, attacker, defender);
    const damageResult = this.calculateDamage(skill, attacker, defender, hitResult);
    
    defender.hp -= damageResult.damage;
    
    resultObj.effects.push({
      type: 'damage',
      value: damageResult.damage,
      ...hitResult,
      breakdown: damageResult.breakdown
    });
  }

  static processDefense(skill, defender, resultObj) {
    const defResult = this.calculateDefense(skill, defender);
    defender.defenseBuffer = (defender.defenseBuffer || 0) + defResult.defenseValue;
    
    resultObj.effects.push({ 
      type: 'defense', 
      value: defResult.defenseValue,
      duration: defResult.duration,
      damageReductionPercent: defResult.damageReductionPercent
    });
  }

  static processRecovery(skill, caster, target, resultObj) {
    const healResult = this.calculateHealing(skill, caster);
    const healTarget = healResult.target === 'self' ? caster : target;
    
    if (healResult.healType === 'mp') {
      const maxMp = healTarget.maxMp || healTarget.stats?.maxMp || this.DEFAULT_STATS.maxMp;
      healTarget.mp = Math.min(maxMp, (healTarget.mp || 0) + healResult.healAmount);
    } else {
      const maxHp = healTarget.maxHp || healTarget.stats?.maxHp || this.DEFAULT_STATS.maxHp;
      healTarget.hp = Math.min(maxHp, healTarget.hp + healResult.healAmount);
    }
    
    resultObj.effects.push({ 
      type: 'heal', 
      healType: healResult.healType,
      value: healResult.healAmount,
      target: healResult.target
    });
  }

  static processSeal(skill, caster, target, turn, resultObj) {
    const sealResult = this.calculateSeal(skill, caster, target);
    
    if (sealResult.isSealed) {
      if (!target.sealedSkills) target.sealedSkills = [];
      
      // 获取目标可用技能
      const availableSkills = (target.skills || []).filter(s => 
        !target.sealedSkills.some(sealed => sealed.id === s.id && sealed.until > turn)
      );
      
      // 随机封印技能
      const shuffled = availableSkills.sort(() => Math.random() - 0.5);
      const toSeal = shuffled.slice(0, sealResult.sealedSkillCount);
      
      toSeal.forEach(s => {
        target.sealedSkills.push({ 
          id: s.id, 
          name: s.name,
          until: turn + sealResult.duration 
        });
      });
      
      resultObj.effects.push({ 
        type: 'seal', 
        success: true,
        sealedSkills: toSeal.map(s => s.name),
        duration: sealResult.duration,
        sealChance: sealResult.sealChance
      });
    } else {
      resultObj.effects.push({ 
        type: 'seal', 
        success: false,
        sealChance: sealResult.sealChance,
        roll: sealResult.roll
      });
    }
  }

  static processField(skill, caster, actor, field, turn, result) {
    const fieldResult = this.calculateFieldEffect(skill, caster);
    
    if (!field.activeEffects) field.activeEffects = [];
    
    field.activeEffects.push({
      owner: actor,
      type: fieldResult.fieldType,
      power: fieldResult.power,
      bonusToOwner: fieldResult.bonusToOwner,
      penaltyToEnemy: fieldResult.penaltyToEnemy,
      expiresAt: turn + fieldResult.duration
    });
    
    result[actor].effects.push({ 
      type: 'field', 
      fieldType: fieldResult.fieldType,
      duration: fieldResult.duration
    });
    
    result.field.changes.push(fieldResult);
  }

  // ==================== 场地效果处理 ====================

  /**
   * 处理场地持续效果
   */
  static processFieldEffects(field, user, enemy, turn) {
    if (!field.activeEffects) return;
    
    for (const effect of field.activeEffects) {
      if (effect.expiresAt > turn) {
        const owner = effect.owner === 'user' ? user : enemy;
        const opponent = effect.owner === 'user' ? enemy : user;
        
        // 应用加成（临时修改stats）
        if (!owner.fieldBonus) owner.fieldBonus = {};
        if (!opponent.fieldPenalty) opponent.fieldPenalty = {};
        
        // 给己方加成
        if (effect.bonusToOwner) {
          Object.keys(effect.bonusToOwner).forEach(stat => {
            owner.fieldBonus[stat] = (owner.fieldBonus[stat] || 0) + effect.bonusToOwner[stat];
          });
        }
        
        // 给敌方减益
        if (effect.penaltyToEnemy) {
          Object.keys(effect.penaltyToEnemy).forEach(stat => {
            opponent.fieldPenalty[stat] = (opponent.fieldPenalty[stat] || 0) + effect.penaltyToEnemy[stat];
          });
        }
      }
    }
  }

  /**
   * 清理过期效果
   */
  static cleanupExpiredEffects(field, user, enemy, turn) {
    // 清理过期场地效果
    if (field.activeEffects) {
      field.activeEffects = field.activeEffects.filter(e => e.expiresAt > turn);
    }
    
    // 清理过期封印
    if (user.sealedSkills) {
      user.sealedSkills = user.sealedSkills.filter(s => s.until > turn);
    }
    if (enemy.sealedSkills) {
      enemy.sealedSkills = enemy.sealedSkills.filter(s => s.until > turn);
    }
    
    // 清理场地加成/减益（每回合重新计算）
    user.fieldBonus = {};
    user.fieldPenalty = {};
    enemy.fieldBonus = {};
    enemy.fieldPenalty = {};
  }

  // ==================== 工具函数 ====================

  /**
   * 获取角色的有效属性值（考虑场地效果）
   */
  static getEffectiveStat(character, statName) {
    const baseStat = character.stats?.[statName] || this.DEFAULT_STATS[statName] || 50;
    const bonus = character.fieldBonus?.[statName] || 0;
    const penalty = character.fieldPenalty?.[statName] || 0;
    return Math.max(1, baseStat + bonus - penalty);
  }

  /**
   * 初始化角色战斗状态
   */
  static initCharacterBattleState(character) {
    const stats = character.stats || this.DEFAULT_STATS;
    return {
      ...character,
      hp: stats.maxHp || this.DEFAULT_STATS.maxHp,
      mp: stats.maxMp || this.DEFAULT_STATS.maxMp,
      maxHp: stats.maxHp || this.DEFAULT_STATS.maxHp,
      maxMp: stats.maxMp || this.DEFAULT_STATS.maxMp,
      stats: { ...this.DEFAULT_STATS, ...stats },
      sealedSkills: [],
      skillCooldowns: {},
      defenseBuffer: 0,
      lastSkill: null,
      fieldBonus: {},
      fieldPenalty: {}
    };
  }
}

module.exports = JudgmentSystem;


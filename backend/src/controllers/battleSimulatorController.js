/**
 * 战斗模拟器控制器 (重构版)
 * 整合三大子系统：技能衍生系统、战斗判定系统、战斗描述系统
 */

const Character = require('../schemas/unifiedCharacterSchema');
const SkillDerivationService = require('../services/skillDerivationService');
const JudgmentSystem = require('../services/judgmentSystem');
const NarrativeSystem = require('../services/narrativeSystem');

// ==================== 内置角色配置（后备） ====================

const CHARACTER_PROFILES = {
  "HimuroRinne": {
    name: "氷室 凛音 (Himuro Rinne)",
    desc: "私立樱羽学园学生会副会长，操纵冰结律法的冷酷大小姐。",
    imageUrl: "./web-project/public/栩.jpg",
    personality: `
      1. 像冰晶般纯粹而坚硬，在规则与秩序中寻求极致的正确。
      2. 说话言简意赅，如冰棱般锐利，总能一针见血指出逻辑谬误。
      3. 对"失序"和"暧昧"有近乎洁癖的排斥。
      4. 内心深处有极致的脆弱，渴望有人能理解她严苛背后的善意。
    `,
    magicStyle: `
      1. 核心概念：冰结律法 (Frozen Ordinance)。不仅是冰冻，而是将"秩序"具现化，将"混沌"强制凝固。
      2. 擅长使用"极寒之戒"作为媒介，施加无法抗拒的束缚与凝固。
      3. 战斗风格：静态、压倒性、强制力。不进行野蛮的肉搏，而是优雅地降下裁决。
    `,
    stats: {
      maxHp: 100,
      maxMp: 120,
      attack: 45,
      defense: 50,
      magic: 80,
      agility: 55,
      resistance: 60
    },
    baseSkills: [
      { 
        id: "ice_lance_1", 
        name: "氷結断罪・一之枪", 
        type: "attack", 
        power: 65,
        cost: 15,
        accuracy: 85,
        description: "凝聚大气水分形成亚音速射出的高压冰之弹头，追求极致的单点物理贯穿力。",
        flavorText: "Glacies iudicii, perfice!",
        flavorTextTranslation: "审判之冰，贯穿！",
        effects: [{ type: "damage", value: 65, duration: 0, target: "enemy" }],
        conditions: [],
        rarity: "common",
        isBase: true
      },
      { 
        id: "law_rain", 
        name: "法则之雨・冰晶连射", 
        type: "attack",
        power: 40,
        cost: 25,
        accuracy: 75,
        description: "如暴雨般降下数百枚手术刀般的微小冰晶，进行大范围覆盖或单点凌迟。",
        flavorText: "Pluvia legis, descende!",
        flavorTextTranslation: "律法之雨，降临！",
        effects: [
          { type: "damage", value: 40, duration: 0, target: "enemy" },
          { type: "debuff", value: -10, duration: 2, target: "enemy" }
        ],
        conditions: [],
        rarity: "common",
        isBase: true
      },
      { 
        id: "snowflake_shield", 
        name: "秩序之壁・六花之盾", 
        type: "defense",
        power: 50,
        cost: 20,
        accuracy: 100,
        description: "制造三面雪花结晶冰盾。破碎瞬间会爆散成追踪冰片反击攻击者。",
        flavorText: "Murus ordinis, protege!",
        flavorTextTranslation: "秩序之壁，守护！",
        effects: [{ type: "defense", value: 50, duration: 2, target: "self" }],
        conditions: [],
        rarity: "common",
        isBase: true
      },
      { 
        id: "frozen_ordinance", 
        name: "冰結律法・概念冻结", 
        type: "seal",
        power: 60,
        cost: 30,
        accuracy: 70,
        description: "暂时冻结目标某个简单的'概念'（如平衡感），使其思维或行动产生逻辑断层。",
        flavorText: "Conceptus tuus, in aeternum congela!",
        flavorTextTranslation: "汝之概念，永恒冻结！",
        effects: [{ type: "seal", value: 2, duration: 2, target: "enemy" }],
        conditions: [{ type: "mp_above", value: 30, target: "self" }],
        rarity: "rare",
        isBase: true
      },
      { 
        id: "frost_domain", 
        name: "極寒領域・霜之結界", 
        type: "field",
        power: 45,
        cost: 35,
        accuracy: 100,
        description: "展开冰属性结界，己方获得加成，敌方受到减益。",
        flavorText: "Regnum glaciei, expande!",
        flavorTextTranslation: "冰之王国，展开！",
        effects: [{ type: "field", value: "ice", duration: 3, target: "field" }],
        conditions: [{ type: "turn_count", value: 2, target: "self" }],
        rarity: "rare",
        isBase: true
      },
      { 
        id: "ice_meditation", 
        name: "冰心訣・魔力凝聚", 
        type: "recovery",
        power: 30,
        cost: 5,
        accuracy: 100,
        description: "冥想凝聚魔力，回复MP。",
        flavorText: "Fons glaciei, redde virtutem!",
        flavorTextTranslation: "冰之泉源，归还力量！",
        effects: [{ type: "heal", value: "mp", duration: 0, target: "self" }],
        conditions: [],
        rarity: "common",
        isBase: true
      }
    ]
  }
};

// 默认玩家角色
const DEFAULT_USER_PROFILE = {
  name: "燕双鹰eagle·栩 (剧本版)",
  desc: "传说中的因果律恶搞Boss，身穿皮衣墨镜，无视物理法则与逻辑的'半人半鬼'。",
  imageUrl: "./web-project/public/栩_meme.jpg",
  personality: `
    1. 极度自负，无论何时何地都要保持最酷的姿势。
    2. 说话只用反问句和装逼语录。
    3. 拥有绝对的'剧本自信'，坚信敌人伤不到自己分毫。
    4. 极度讨厌别人用枪指着他的头。
  `,
  magicStyle: `
    1. 核心概念：神剧逻辑与降智光环 (Plot Armor & Logic Break)。
    2. 擅长使用'一块大洋'作为暗器。
    3. 战斗风格：站桩输出、无视闪避、各种慢动作特效。
  `,
  stats: {
    maxHp: 100,
    maxMp: 80,
    attack: 70,
    defense: 40,
    magic: 60,
    agility: 65,
    resistance: 45
  },
  baseSkills: [
    { 
      id: "fatal_mistake", 
      name: "致命错误・嘲讽", 
      type: "seal",
      power: 55,
      cost: 10,
      accuracy: 80,
      description: "指着对方的鼻子说：'你犯了一个致命的错误。'使目标全属性大幅下降。",
      flavorText: "Error fatalis tuus!",
      flavorTextTranslation: "汝犯下了致命的错误！",
      effects: [{ type: "debuff", value: -15, duration: 2, target: "enemy" }],
      conditions: [],
      rarity: "common",
      isBase: true
    },
    { 
      id: "philosophical_torture", 
      name: "哲学拷问・听不懂的台词", 
      type: "seal",
      power: 70,
      cost: 20,
      accuracy: 65,
      description: "开始长篇大论，导致敌人陷入长时间的眩晕和自我怀疑。",
      flavorText: "Quomodo vis me facere?",
      flavorTextTranslation: "你想让我怎么做？",
      effects: [{ type: "seal", value: 2, duration: 2, target: "enemy" }],
      conditions: [],
      rarity: "rare",
      isBase: true
    },
    { 
      id: "silver_dollar_strike", 
      name: "一块大洋・物理修正", 
      type: "attack",
      power: 75,
      cost: 15,
      accuracy: 95,
      description: "抛出一块银元，必定命中敌人的要害或切断敌人的武器。",
      flavorText: "Argentum fati, percute!",
      flavorTextTranslation: "命运银币，击中！",
      effects: [{ type: "damage", value: 75, duration: 0, target: "enemy" }],
      conditions: [],
      rarity: "common",
      isBase: true
    },
    { 
      id: "half_man_half_ghost", 
      name: "半人半鬼・无敌帧", 
      type: "defense",
      power: 60,
      cost: 25,
      accuracy: 100,
      description: "宣称自己是'半人半鬼的神枪第一'，进入无敌状态。",
      flavorText: "Semi homo, semi daemon sum!",
      flavorTextTranslation: "吾乃半人半鬼！",
      effects: [{ type: "defense", value: 60, duration: 1, target: "self" }],
      conditions: [{ type: "cooldown", value: 3, target: "self" }],
      rarity: "rare",
      isBase: true
    },
    { 
      id: "brain_structure_scan", 
      name: "让我看看你的脑髓", 
      type: "attack",
      power: 85,
      cost: 30,
      accuracy: 75,
      description: "接近敌人并试图通过物理手段'查看'对方的脑部构造。",
      flavorText: "Ostende mihi cerebrum tuum!",
      flavorTextTranslation: "让我看看你的脑髓！",
      effects: [
        { type: "damage", value: 85, duration: 0, target: "enemy" },
        { type: "debuff", value: -20, duration: 1, target: "enemy" }
      ],
      conditions: [{ type: "hp_below", value: 50, target: "enemy" }],
      rarity: "epic",
      isBase: true
    },
    { 
      id: "plot_armor_heal", 
      name: "主角光环・不死身", 
      type: "recovery",
      power: 40,
      cost: 20,
      accuracy: 100,
      description: "因为主角不能死，所以伤口自动愈合。",
      flavorText: "Protagonista non moritur!",
      flavorTextTranslation: "主角不会死！",
      effects: [{ type: "heal", value: "hp", duration: 0, target: "self" }],
      conditions: [],
      rarity: "common",
      isBase: true
    }
  ]
};

// ==================== 控制器类 ====================

class BattleSimulatorController {

  // ==================== 初始化战斗 ====================
  
  /**
   * 初始化战斗
   * 只加载基础技能，不生成衍生技能（衍生技能在使用技能时按需生成）
   */
  static async initBattle(req, res) {
    try {
      const { enemyId = 'HimuroRinne', userId = 'YanShuangYing_Gag' } = req.query;

      console.log(`\n========== 初始化战斗 ==========`);
      console.log(`敌人ID: ${enemyId}, 用户ID: ${userId}`);

      // 加载敌方角色
      let enemyProfile = await BattleSimulatorController.loadCharacterProfile(enemyId, 'enemy');
      if (!enemyProfile) {
        return res.status(404).json({
          success: false,
          message: '敌方角色不存在'
        });
      }

      // 加载用户角色
      let userProfile = await BattleSimulatorController.loadCharacterProfile(userId, 'player');
      if (!userProfile) {
        console.log(`用户角色 ${userId} 未找到，使用默认配置`);
        userProfile = DEFAULT_USER_PROFILE;
      }

      // 只使用基础技能，不预先生成衍生技能
      // 衍生技能将在每回合使用技能后按需生成
      const userBaseSkills = BattleSimulatorController.prepareBaseSkills(userProfile.baseSkills || []);
      const enemyBaseSkills = BattleSimulatorController.prepareBaseSkills(enemyProfile.baseSkills || []);

      console.log(`\n用户基础技能: ${userBaseSkills.length} 个`);
      console.log(`敌人基础技能: ${enemyBaseSkills.length} 个`);

      // 初始化战斗状态
      const userState = JudgmentSystem.initCharacterBattleState({
        ...userProfile,
        skills: userBaseSkills
      });
      const enemyState = JudgmentSystem.initCharacterBattleState({
        ...enemyProfile,
        skills: enemyBaseSkills
      });

      res.json({
        success: true,
        data: {
          enemyProfile: {
            name: enemyProfile.name,
            desc: enemyProfile.desc,
            imageUrl: enemyProfile.imageUrl,
            personality: enemyProfile.personality,
            magicStyle: enemyProfile.magicStyle,
            stats: enemyProfile.stats
          },
          userProfile: {
            name: userProfile.name,
            desc: userProfile.desc,
            imageUrl: userProfile.imageUrl,
            personality: userProfile.personality,
            magicStyle: userProfile.magicStyle,
            stats: userProfile.stats
          },
          userSkills: userBaseSkills,
          enemySkills: enemyBaseSkills,
          battleState: {
            userHp: userState.hp,
            userMp: userState.mp,
            userMaxHp: userState.maxHp,
            userMaxMp: userState.maxMp,
            enemyHp: enemyState.hp,
            enemyMp: enemyState.mp,
            enemyMaxHp: enemyState.maxHp,
            enemyMaxMp: enemyState.maxMp,
            turn: 0
          }
        }
      });
    } catch (error) {
      console.error('初始化战斗失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 准备基础技能（确保格式正确）
   */
  static prepareBaseSkills(skills) {
    return skills.map(skill => ({
      ...skill,
      isBase: true,
      power: skill.power || 50,
      cost: skill.cost || 15,
      accuracy: skill.accuracy || 85,
      effects: skill.effects || [],
      conditions: skill.conditions || [],
      description: skill.description || skill.effect || '',
      rarity: skill.rarity || 'common'
    }));
  }

  // ==================== 执行战斗回合 ====================
  
  /**
   * 执行战斗回合
   * 并行执行：技能衍生LLM 与 (判定系统 + 描述LLM)
   * 
   * 执行流程：
   * 1. 点击后立即并行启动：
   *    - 技能衍生 LLM（为使用的技能生成1-2个衍生技能）
   *    - 战斗判定（纯代码） → 描述 LLM（需要判定结果）
   * 2. 使用 Promise.all 等待两者完成
   * 3. 返回结果（包含新衍生的技能）
   */
  static async executeTurn(req, res) {
    try {
      const {
        enemyId,
        userId = 'YanShuangYing_Gag',
        selectedSkillId,
        battleState: clientBattleState,
        userSkills,
        enemySkills
      } = req.body;

      // 验证数据
      if (!enemyId || !selectedSkillId) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }

      // 获取角色配置
      let enemyProfile = await BattleSimulatorController.loadCharacterProfile(enemyId, 'enemy');
      if (!enemyProfile) {
        return res.status(404).json({ success: false, message: '敌方角色不存在' });
      }

      let userProfile = await BattleSimulatorController.loadCharacterProfile(userId, 'player');
      if (!userProfile) {
        userProfile = DEFAULT_USER_PROFILE;
      }

      // 重建战斗状态
      const battleState = {
        user: {
          ...userProfile,
          hp: clientBattleState.userHp,
          mp: clientBattleState.userMp,
          maxHp: clientBattleState.userMaxHp || 100,
          maxMp: clientBattleState.userMaxMp || 100,
          stats: userProfile.stats || JudgmentSystem.DEFAULT_STATS,
          skills: userSkills,
          sealedSkills: clientBattleState.userSealedSkills || [],
          skillCooldowns: clientBattleState.userSkillCooldowns || {},
          defenseBuffer: 0,
          lastSkill: clientBattleState.userLastSkill || null
        },
        enemy: {
          ...enemyProfile,
          hp: clientBattleState.enemyHp,
          mp: clientBattleState.enemyMp,
          maxHp: clientBattleState.enemyMaxHp || 100,
          maxMp: clientBattleState.enemyMaxMp || 100,
          stats: enemyProfile.stats || JudgmentSystem.DEFAULT_STATS,
          skills: enemySkills,
          sealedSkills: clientBattleState.enemySealedSkills || [],
          skillCooldowns: clientBattleState.enemySkillCooldowns || {},
          defenseBuffer: 0,
          lastSkill: clientBattleState.enemyLastSkill || null
        },
        field: clientBattleState.field || { activeEffects: [] },
        turn: clientBattleState.turn || 0
      };

      // 获取用户选择的技能
      const userSkill = userSkills.find(s => s.id === selectedSkillId);
      if (!userSkill) {
        return res.status(400).json({ success: false, message: '选中的技能不存在' });
      }

      // 检查技能使用条件
      const conditionCheck = SkillDerivationService.quickConditionCheck(userSkill, battleState);
      if (!conditionCheck.canUse) {
        return res.status(400).json({ success: false, message: conditionCheck.reason });
      }

      // 检查技能是否被封印
      if (SkillDerivationService.isSkillSealed(userSkill, battleState.user, battleState.turn)) {
        return res.status(400).json({ success: false, message: '该技能已被封印' });
      }

      // AI选择技能
      const enemySkill = BattleSimulatorController.selectEnemySkill(battleState);

      // 执行战斗判定（纯代码，立即完成）
      battleState.turn += 1;
      const judgmentResult = JudgmentSystem.executeTurn(userSkill, enemySkill, battleState);

      console.log(`\n回合 ${battleState.turn}:`);
      console.log(`  用户: ${userSkill.name} -> ${JSON.stringify(judgmentResult.user.effects)}`);
      console.log(`  敌人: ${enemySkill.name} -> ${JSON.stringify(judgmentResult.enemy.effects)}`);

      // ==================== 并行执行两个 LLM 任务 ====================
      
      // 任务1：技能衍生 LLM（为用户使用的技能生成衍生，不阻塞）
      const skillDerivationPromise = BattleSimulatorController.deriveSkillsForUsedSkill(
        userSkill, 
        userProfile,
        userSkills
      );

      // 任务2：战斗描述 LLM（需要判定结果，串行依赖）
      // 现在返回 { narrative, summary } 用于记忆系统
      const narrativePromise = (async () => {
        try {
          return await NarrativeSystem.generateNarrative(
            judgmentResult,
            userProfile,
            enemyProfile,
            clientBattleState.history || []
          );
        } catch (narrativeError) {
          console.error('战斗描述生成失败:', narrativeError);
          const fallbackNarrative = NarrativeSystem.generateFallbackNarrative(judgmentResult, userProfile, enemyProfile);
          return {
            narrative: fallbackNarrative,
            summary: `${userSkill.name} vs ${enemySkill.name}`
          };
        }
      })();

      // 并行等待两个任务完成
      const [derivedSkills, narrativeResult] = await Promise.all([
        skillDerivationPromise,
        narrativePromise
      ]);

      // 解构叙述结果（兼容新旧格式）
      const narrative = typeof narrativeResult === 'string' 
        ? narrativeResult 
        : narrativeResult.narrative;
      const narrativeSummary = typeof narrativeResult === 'object' 
        ? narrativeResult.summary 
        : `${userSkill.name} vs ${enemySkill.name}`;

      console.log(`  新衍生技能: ${derivedSkills.length} 个`);
      console.log(`  回合摘要: ${narrativeSummary.substring(0, 50)}...`);

      // 构建返回数据（包含摘要用于前端记忆）
      const turnData = {
        turn: battleState.turn,
        userSkillName: userSkill.name,
        userSkillType: userSkill.type,
        enemySkillName: enemySkill.name,
        enemySkillType: enemySkill.type,
        userEffects: judgmentResult.user.effects,
        enemyEffects: judgmentResult.enemy.effects,
        narrative,
        summary: narrativeSummary, // 新增：用于记忆系统
        actionOrder: judgmentResult.actionOrder,
        fieldChanges: judgmentResult.field.changes // 新增：场地变化记录
      };

      res.json({
        success: true,
        data: {
          turnData,
          // 新衍生的技能（前端需要添加到技能列表）
          newDerivedSkills: derivedSkills,
          battleState: {
            userHp: judgmentResult.summary.userHp,
            userMp: judgmentResult.summary.userMp,
            userMaxHp: judgmentResult.summary.userMaxHp,
            userMaxMp: judgmentResult.summary.userMaxMp,
            enemyHp: judgmentResult.summary.enemyHp,
            enemyMp: judgmentResult.summary.enemyMp,
            enemyMaxHp: judgmentResult.summary.enemyMaxHp,
            enemyMaxMp: judgmentResult.summary.enemyMaxMp,
            turn: battleState.turn,
            field: battleState.field,
            userSealedSkills: battleState.user.sealedSkills,
            enemySealedSkills: battleState.enemy.sealedSkills,
            userSkillCooldowns: battleState.user.skillCooldowns,
            enemySkillCooldowns: battleState.enemy.skillCooldowns,
            userLastSkill: userSkill,
            enemyLastSkill: enemySkill
          },
          isBattleEnd: judgmentResult.summary.isBattleEnd,
          winner: judgmentResult.summary.winner,
          winnerName: judgmentResult.summary.winner === 'user' ? userProfile.name : 
                      judgmentResult.summary.winner === 'enemy' ? enemyProfile.name : null
        }
      });
    } catch (error) {
      console.error('执行战斗回合失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 为使用的技能生成衍生技能
   * 只为基础技能生成衍生，衍生技能不会再衍生
   */
  static async deriveSkillsForUsedSkill(usedSkill, characterProfile, existingSkills) {
    try {
      // 只为基础技能生成衍生
      if (!usedSkill.isBase) {
        console.log(`  跳过衍生：${usedSkill.name} 不是基础技能`);
        return [];
      }

      // 检查是否已经有足够的衍生技能
      const existingDerived = existingSkills.filter(s => s.derivedFrom === usedSkill.id);
      if (existingDerived.length >= 3) {
        console.log(`  跳过衍生：${usedSkill.name} 已有 ${existingDerived.length} 个衍生`);
        return [];
      }

      console.log(`  开始为 ${usedSkill.name} 生成衍生技能...`);
      
      // 生成 1-2 个衍生技能
      const derivedSkills = await SkillDerivationService.deriveSkills(
        usedSkill,
        characterProfile,
        existingSkills,
        2 // 每次生成2个衍生
      );

      // 过滤掉已存在的技能（防止重复）
      const newSkills = derivedSkills.filter(newSkill => 
        !existingSkills.some(existing => 
          existing.id === newSkill.id || existing.name === newSkill.name
        )
      );

      return newSkills;
    } catch (error) {
      console.error(`技能衍生失败 (${usedSkill.name}):`, error);
      return []; // 失败时返回空数组，不影响战斗流程
    }
  }

  // ==================== AI技能选择 ====================
  
  /**
   * AI选择技能的逻辑
   */
  static selectEnemySkill(battleState) {
    const { enemy, user, field, turn } = battleState;
    
    // 获取可用技能（排除封印和冷却，检查MP）
    const availableSkills = (enemy.skills || []).filter(skill => {
      // 检查封印
      if (SkillDerivationService.isSkillSealed(skill, enemy, turn)) {
        return false;
      }
      // 检查条件
      const check = SkillDerivationService.quickConditionCheck(skill, { 
        user: enemy, enemy: user, field, turn 
      });
      return check.canUse;
    });
    
    if (availableSkills.length === 0) {
      // 没有可用技能时使用默认普攻
      return { 
        id: 'basic_attack', 
        name: '普通攻击', 
        type: 'attack', 
        power: 20, 
        cost: 0, 
        accuracy: 90,
        description: '基础的物理攻击',
        effects: [{ type: 'damage', value: 20, duration: 0, target: 'enemy' }]
      };
    }

    // AI策略
    const hpPercent = enemy.hp / enemy.maxHp;
    const mpPercent = enemy.mp / enemy.maxMp;
    
    // HP低时优先回复
    if (hpPercent < 0.3) {
      const healSkill = availableSkills.find(s => s.type === 'recovery');
      if (healSkill && Math.random() < 0.7) return healSkill;
    }
    
    // MP充足时可能使用高消耗技能
    if (mpPercent > 0.6) {
      const powerfulSkills = availableSkills.filter(s => s.power > 60 && s.type === 'attack');
      if (powerfulSkills.length > 0 && Math.random() < 0.5) {
        return powerfulSkills[Math.floor(Math.random() * powerfulSkills.length)];
      }
    }
    
    // HP高时可能布置阵地
    if (hpPercent > 0.7 && turn <= 3) {
      const fieldSkill = availableSkills.find(s => s.type === 'field');
      if (fieldSkill && Math.random() < 0.4) return fieldSkill;
    }
    
    // 对方HP低时优先攻击
    const userHpPercent = user.hp / user.maxHp;
    if (userHpPercent < 0.3) {
      const attackSkills = availableSkills.filter(s => s.type === 'attack');
      if (attackSkills.length > 0) {
        return attackSkills[Math.floor(Math.random() * attackSkills.length)];
      }
    }
    
    // 随机选择
    return availableSkills[Math.floor(Math.random() * availableSkills.length)];
  }

  // ==================== 辅助方法 ====================
  
  /**
   * 加载角色配置
   */
  static async loadCharacterProfile(characterId, defaultType = 'enemy') {
    // 优先从数据库加载
    let profile = await Character.findByCharacterId(characterId);
    
    if (profile) {
      return profile.getBattleProfile();
    }
    
    // 从内存配置加载
    if (CHARACTER_PROFILES[characterId]) {
      return CHARACTER_PROFILES[characterId];
    }
    
    // 检查默认配置
    if (defaultType === 'player' && characterId === 'YanShuangYing_Gag') {
      return DEFAULT_USER_PROFILE;
    }
    
    return null;
  }

  // ==================== 其他API ====================
  
  /**
   * 获取所有可用角色列表
   */
  static async getAvailableCharacters(req, res) {
    try {
      const { type = 'all' } = req.query;
      
      let characters;
      if (type === 'enemy') {
        characters = await Character.findActiveEnemies();
      } else if (type === 'player') {
        characters = await Character.findActivePlayers();
      } else {
        characters = await Character.find({ isActive: true })
          .select('characterId name desc imageUrl characterType difficulty tags stats')
          .sort({ characterType: 1, createdAt: -1 });
      }

      // 添加内存中的角色
      const memoryCharacters = Object.keys(CHARACTER_PROFILES).map(id => ({
        characterId: id,
        name: CHARACTER_PROFILES[id].name,
        desc: CHARACTER_PROFILES[id].desc,
        imageUrl: CHARACTER_PROFILES[id].imageUrl,
        stats: CHARACTER_PROFILES[id].stats,
        characterType: 'enemy',
        difficulty: 'normal',
        source: 'memory'
      }));

      // 合并并去重
      const allCharacters = [...characters.map(c => c.toObject ? c.toObject() : c)];
      memoryCharacters.forEach(mc => {
        if (!allCharacters.some(c => c.characterId === mc.characterId)) {
          allCharacters.push(mc);
        }
      });

      res.json({
        success: true,
        data: allCharacters
      });
    } catch (error) {
      console.error('获取角色列表失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 重置战斗
   */
  static async resetBattle(req, res) {
    try {
      res.json({
        success: true,
        message: '战斗已重置'
      });
    } catch (error) {
      console.error('重置战斗失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 加载敌方角色（自定义）
   */
  static async loadEnemy(req, res) {
    try {
      const data = req.body;

      if (!data.name || !data.desc) {
        return res.status(400).json({
          success: false,
          message: '格式不符合规范，需要包含 name, desc 等字段'
        });
      }

      const newEnemyId = data.id || `CustomEnemy_${Date.now()}`;

      // 处理技能格式
      let baseSkills = [];
      if (data.baseSkills && Array.isArray(data.baseSkills)) {
        baseSkills = data.baseSkills;
      } else if (data.moves && Array.isArray(data.moves)) {
        // 兼容旧格式
        baseSkills = data.moves.map(move => ({
          id: move.id,
          name: move.name,
          type: BattleSimulatorController.inferSkillType(move.type),
          power: 50,
          cost: 15,
          accuracy: 85,
          description: move.effect,
          flavorText: '',
          effects: [],
          conditions: [],
          rarity: 'common',
          isBase: true
        }));
      }

      CHARACTER_PROFILES[newEnemyId] = {
        name: data.name,
        desc: data.desc,
        personality: data.personality || data.desc,
        magicStyle: data.magicStyle || "见招式库",
        imageUrl: data.imageUrl || null,
        stats: data.stats || JudgmentSystem.DEFAULT_STATS,
        baseSkills
      };

      res.json({
        success: true,
        data: {
          enemyId: newEnemyId
        }
      });
    } catch (error) {
      console.error('加载敌方角色失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 加载玩家角色（自定义）
   */
  static async loadUser(req, res) {
    try {
      const data = req.body;

      if (!data.name || !data.desc) {
        return res.status(400).json({
          success: false,
          message: '格式不符合规范，需要包含 name, desc 等字段'
        });
      }

      // 处理技能格式
      let baseSkills = [];
      if (data.baseSkills && Array.isArray(data.baseSkills)) {
        baseSkills = data.baseSkills;
      } else if (data.moves && Array.isArray(data.moves)) {
        baseSkills = data.moves.map(move => ({
          id: move.id,
          name: move.name,
          type: BattleSimulatorController.inferSkillType(move.type),
          power: 50,
          cost: 15,
          accuracy: 85,
          description: move.effect,
          flavorText: '',
          effects: [],
          conditions: [],
          rarity: 'common',
          isBase: true
        }));
      }

      // 更新默认用户配置
      Object.assign(DEFAULT_USER_PROFILE, {
        name: data.name,
        desc: data.desc,
        personality: data.personality || data.desc,
        magicStyle: data.magicStyle || "见招式库",
        imageUrl: data.imageUrl || null,
        stats: data.stats || JudgmentSystem.DEFAULT_STATS,
        baseSkills
      });

      res.json({
        success: true,
        data: {
          skills: baseSkills
        }
      });
    } catch (error) {
      console.error('加载玩家角色失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 推断技能类型
   */
  static inferSkillType(originalType) {
    if (!originalType) return 'attack';
    
    const lowerType = originalType.toLowerCase();
    
    if (lowerType.includes('攻击') || lowerType.includes('attack') || lowerType.includes('贯穿')) {
      return 'attack';
    }
    if (lowerType.includes('防御') || lowerType.includes('defense') || lowerType.includes('护盾')) {
      return 'defense';
    }
    if (lowerType.includes('封印') || lowerType.includes('seal') || lowerType.includes('控制')) {
      return 'seal';
    }
    if (lowerType.includes('阵地') || lowerType.includes('field') || lowerType.includes('结界')) {
      return 'field';
    }
    if (lowerType.includes('回复') || lowerType.includes('recovery') || lowerType.includes('治疗')) {
      return 'recovery';
    }
    
    return 'attack';
  }
}

module.exports = BattleSimulatorController;

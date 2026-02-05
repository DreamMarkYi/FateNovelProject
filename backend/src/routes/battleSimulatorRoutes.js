const express = require('express');
const router = express.Router();
const BattleSimulatorController = require('../controllers/battleSimulatorController');

// 初始化战斗
router.get('/init', BattleSimulatorController.initBattle);

// 获取所有可用角色
router.get('/characters', BattleSimulatorController.getAvailableCharacters);

// 执行战斗回合
router.post('/execute-turn', BattleSimulatorController.executeTurn);

// 重置战斗
router.post('/reset', BattleSimulatorController.resetBattle);

// 加载敌方角色
router.post('/load-enemy', BattleSimulatorController.loadEnemy);

// 加载玩家角色
router.post('/load-user', BattleSimulatorController.loadUser);

module.exports = router;


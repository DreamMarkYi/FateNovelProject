const express = require('express');
const router = express.Router();
const StartChoiceController = require('../../controllers/mongo/startChoiceController');
const { authenticateToken, optionalAuth } = require('../../middleware/auth');

// 公开路由 - 不需要认证
// 检查是否首次访问
router.get('/check-first-visit', StartChoiceController.checkFirstTimeVisitor);

// 初始化访客会话
router.post('/init-session', StartChoiceController.initVisitorSession);

// 统一的完成StartPage接口（两种行为都用这个）
router.post('/complete-start-page', StartChoiceController.completeStartPage);

// 创建新玩家（保留兼容性）
router.post('/create-player', StartChoiceController.createPlayer);

// 需要认证的路由
// 记录用户选择
router.post('/player/:playerId/choice', authenticateToken, StartChoiceController.recordChoice);

// 完成游戏
router.post('/player/:playerId/complete', authenticateToken, StartChoiceController.completeGame);

// 可选认证的路由
// 获取玩家记录
router.get('/player/:playerId', optionalAuth, StartChoiceController.getPlayerRecord);

// 获取统计数据
router.get('/statistics', optionalAuth, StartChoiceController.getStatistics);

// 获取特定场景的选择统计
router.get('/scene/:sceneId/statistics', optionalAuth, StartChoiceController.getChoiceStatistics);

// 需要认证的管理路由
// 获取所有记录（管理用）
router.get('/records', authenticateToken, StartChoiceController.getAllRecords);

// 删除记录（测试用）
router.delete('/player/:playerId', authenticateToken, StartChoiceController.deleteRecord);

module.exports = router;


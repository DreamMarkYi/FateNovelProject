const express = require('express');
const router = express.Router();
const GameSaveController = require('../../controllers/mongo/gameSaveController');
const { authenticateToken, optionalAuth } = require('../../middleware/auth');

// 可选认证的路由 - 允许访客查看，但认证用户获得更多功能
// 获取玩家的所有存档
router.get('/player/:playerId', optionalAuth, GameSaveController.getPlayerSaves);

// 获取最新的自动存档
router.get('/player/:playerId/autosave', optionalAuth, GameSaveController.getLatestAutoSave);

// 获取快速存档
router.get('/player/:playerId/quicksave', optionalAuth, GameSaveController.getQuickSave);

// 获取特定存档
router.get('/player/:playerId/slot/:saveSlot', optionalAuth, GameSaveController.getSaveBySlot);

// 检查场景是否已读
router.get('/player/:playerId/script/:scriptId/scene/:sceneIndex/read', optionalAuth, GameSaveController.checkSceneRead);

// 需要认证的路由 - 必须登录才能操作
// 创建或更新存档
router.put('/player/:playerId/slot/:saveSlot', authenticateToken, GameSaveController.saveGame);

// 快速存档
router.post('/player/:playerId/quicksave', authenticateToken, GameSaveController.quickSave);

// 自动存档
router.post('/player/:playerId/autosave', authenticateToken, GameSaveController.autoSave);

// 更新游戏时长
router.patch('/player/:playerId/slot/:saveSlot/playtime', authenticateToken, GameSaveController.updatePlayTime);

// 删除存档
router.delete('/player/:playerId/slot/:saveSlot', authenticateToken, GameSaveController.deleteSave);

module.exports = router;

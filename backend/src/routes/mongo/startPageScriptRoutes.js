const express = require('express');
const router = express.Router();
const StartPageScriptController = require('../../controllers/mongo/startPageScriptController');

// 获取激活的剧本
router.get('/active', StartPageScriptController.getActiveScript);

// 根据分数计算结局
router.post('/calculate-ending', StartPageScriptController.calculateEnding);

// 获取特定场景
router.get('/scene/:sceneId', StartPageScriptController.getScene);

// 创建或更新剧本（管理用）
router.put('/script', StartPageScriptController.upsertScript);

// 获取所有剧本（管理用）
router.get('/scripts', StartPageScriptController.getAllScripts);

// 删除剧本（管理用）
router.delete('/script/:scriptId', StartPageScriptController.deleteScript);

module.exports = router;


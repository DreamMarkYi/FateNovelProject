const express = require('express');
const router = express.Router();
const NovelScriptController = require('../../controllers/mongo/novelScriptController');

// 获取所有剧本（支持分页和过滤）
router.get('/', NovelScriptController.getAllScripts);

// 根据剧本ID获取完整剧本
router.get('/:scriptId', NovelScriptController.getScriptById);

// 获取剧本的特定场景
router.get('/:scriptId/scene/:sceneIndex', NovelScriptController.getSceneByIndex);

// 获取剧本的场景范围（分段加载）
router.get('/:scriptId/scenes/range', NovelScriptController.getSceneRange);

// 根据标签搜索场景
router.get('/:scriptId/scenes/tag/:tag', NovelScriptController.getScenesByTag);

// 创建新剧本
router.post('/', NovelScriptController.createScript);

// 更新剧本
router.put('/:scriptId', NovelScriptController.updateScript);

// 添加场景到剧本
router.post('/:scriptId/scenes', NovelScriptController.addScene);

// 更新特定场景
router.put('/:scriptId/scene/:sceneIndex', NovelScriptController.updateScene);

// 删除特定场景
router.delete('/:scriptId/scene/:sceneIndex', NovelScriptController.deleteScene);

// 删除剧本
router.delete('/:scriptId', NovelScriptController.deleteScript);

// 切换剧本激活状态
router.patch('/:scriptId/toggle', NovelScriptController.toggleScriptStatus);

module.exports = router;

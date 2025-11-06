const express = require('express');
const router = express.Router();
const SowakaStoryController = require('../../controllers/mongo/sowakaStoryController');

// 获取所有Sowaka故事
router.get('/', SowakaStoryController.getAllSowakaStories);

// 获取激活的Sowaka故事
router.get('/active', SowakaStoryController.getActiveSowakaStories);

// 获取当前显示的Sowaka故事（第一个激活的）
router.get('/current', SowakaStoryController.getCurrentSowakaStory);

// 根据章节名称获取Sowaka故事
router.get('/chapter/:chapterName', SowakaStoryController.getSowakaStoryByChapter);

// 根据章节名称获取序言
router.get('/prefaceContext', SowakaStoryController.getSowakaStoryByChapter);

// 根据ID获取Sowaka故事
router.get('/:id', SowakaStoryController.getCurrentPrefaceContext);

// 创建新的Sowaka故事
router.post('/', SowakaStoryController.createSowakaStory);

// 更新Sowaka故事
router.put('/:id', SowakaStoryController.updateSowakaStory);

// 删除Sowaka故事
router.delete('/:id', SowakaStoryController.deleteSowakaStory);

// 切换故事激活状态
router.patch('/:id/toggle', SowakaStoryController.toggleSowakaStoryStatus);

module.exports = router;


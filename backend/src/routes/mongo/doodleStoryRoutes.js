const express = require('express');
const router = express.Router();
const DoodleStoryController = require('../../controllers/mongo/doodleStoryController');

// 获取所有涂鸦故事
router.get('/', DoodleStoryController.getAllDoodleStories);

// 获取激活的涂鸦故事
router.get('/active', DoodleStoryController.getActiveDoodleStories);

// 根据ID获取涂鸦故事
router.get('/:id', DoodleStoryController.getDoodleStoryById);

// 创建新的涂鸦故事
router.post('/', DoodleStoryController.createDoodleStory);

// 批量创建涂鸦故事
router.post('/batch', DoodleStoryController.createMultipleDoodleStories);

// 更新涂鸦故事
router.put('/:id', DoodleStoryController.updateDoodleStory);

// 删除涂鸦故事
router.delete('/:id', DoodleStoryController.deleteDoodleStory);

// 切换故事激活状态
router.patch('/:id/toggle', DoodleStoryController.toggleDoodleStoryStatus);

module.exports = router;































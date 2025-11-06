const express = require('express');
const router = express.Router();
const StorySectionController = require('../controllers/storySectionController');

// 获取所有故事章节
router.get('/', StorySectionController.getAllStorySections);

// 获取激活的故事章节
router.get('/active', StorySectionController.getActiveStorySections);

// 根据ID获取故事章节
router.get('/:id', StorySectionController.getStorySectionById);

// 创建新故事章节
router.post('/', StorySectionController.createStorySection);

// 更新故事章节
router.put('/:id', StorySectionController.updateStorySection);

// 删除故事章节
router.delete('/:id', StorySectionController.deleteStorySection);

module.exports = router;


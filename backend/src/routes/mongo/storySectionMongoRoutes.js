const express = require('express');
const router = express.Router();
const StorySectionMongoController = require('../../controllers/mongo/storySectionMongoController');

// 获取所有故事章节
router.get('/', StorySectionMongoController.getAllStorySections);

// 获取激活的故事章节
router.get('/active', StorySectionMongoController.getActiveStorySections);

// 根据ID获取故事章节
router.get('/:id', StorySectionMongoController.getStorySectionById);

// 创建新故事章节
router.post('/', StorySectionMongoController.createStorySection);

// 更新故事章节
router.put('/:id', StorySectionMongoController.updateStorySection);

// 删除故事章节
router.delete('/:id', StorySectionMongoController.deleteStorySection);

module.exports = router;


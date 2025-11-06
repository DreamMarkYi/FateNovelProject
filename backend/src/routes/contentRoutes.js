const express = require('express');
const router = express.Router();
const ContentController = require('../controllers/contentController');

// 获取所有内容
router.get('/', ContentController.getAllContents);

// 根据类型获取内容
router.get('/type/:type', ContentController.getContentsByType);

// 根据ID获取内容
router.get('/:id', ContentController.getContentById);

// 创建新内容
router.post('/', ContentController.createContent);

// 更新内容
router.put('/:id', ContentController.updateContent);

// 删除内容
router.delete('/:id', ContentController.deleteContent);

module.exports = router;



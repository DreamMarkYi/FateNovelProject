const express = require('express');
const router = express.Router();
const NovelController = require('../../controllers/mongo/novelController');

// 获取所有小说
router.get('/', NovelController.getAllNovels);

// 获取已发布的小说
router.get('/published', NovelController.getPublishedNovels);

// 根据ID获取小说
router.get('/:id', NovelController.getNovelById);

// 创建新小说
router.post('/', NovelController.createNovel);

// 更新小说
router.put('/:id', NovelController.updateNovel);

// 删除小说
router.delete('/:id', NovelController.deleteNovel);

// 点赞小说
router.post('/:id/like', NovelController.likeNovel);

module.exports = router;


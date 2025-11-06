const express = require('express');
const router = express.Router();
const ChapterController = require('../../controllers/mongo/chapterController');

// 获取小说的所有章节
router.get('/novel/:novelId', ChapterController.getChaptersByNovel);

// 根据章节号获取章节
router.get('/novel/:novelId/number/:chapterNumber', ChapterController.getChapterByNumber);

// 根据ID获取章节
router.get('/:id', ChapterController.getChapterById);

// 创建新章节
router.post('/', ChapterController.createChapter);

// 批量创建章节
router.post('/batch', ChapterController.batchCreateChapters);

// 更新章节
router.put('/:id', ChapterController.updateChapter);

// 删除章节
router.delete('/:id', ChapterController.deleteChapter);

module.exports = router;


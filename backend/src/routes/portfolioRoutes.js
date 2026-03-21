const express = require('express');
const PortfolioController = require('../controllers/portfolioController');

const router = express.Router();

router.get('/config', PortfolioController.getDisplayConfig);
router.get('/novel', PortfolioController.getNovelConfig);
router.post('/novel/access/hash', PortfolioController.generateNovelAccessNameHashes);
router.get('/novel/chapters', PortfolioController.listNovelChapters);
router.post('/novel/chapters/:id/access', PortfolioController.verifyNovelChapterAccess);
router.get('/novel/chapters/:id', PortfolioController.getNovelChapterById);
router.post('/memos/access', PortfolioController.verifyMemoAccess);
router.get('/memos', PortfolioController.listMemos);
router.patch('/memos/:id', PortfolioController.updateMemoDevFlags);
router.post('/memos', PortfolioController.saveMemo);
router.get('/articles', PortfolioController.listArticles);
router.get('/articles/:id', PortfolioController.getArticleById);
router.post('/articles', PortfolioController.saveArticle);
router.post('/novel', PortfolioController.saveNovelConfig);
router.post('/novel/chapters', PortfolioController.saveNovelChapter);

module.exports = router;

const express = require('express');
const PortfolioController = require('../controllers/portfolioController');

const router = express.Router();

router.get('/config', PortfolioController.getDisplayConfig);
router.get('/novel', PortfolioController.getNovelConfig);
router.get('/novel/chapters', PortfolioController.listNovelChapters);
router.get('/novel/chapters/:id', PortfolioController.getNovelChapterById);
router.get('/articles', PortfolioController.listArticles);
router.get('/articles/:id', PortfolioController.getArticleById);
router.post('/articles', PortfolioController.saveArticle);
router.post('/novel', PortfolioController.saveNovelConfig);
router.post('/novel/chapters', PortfolioController.saveNovelChapter);

module.exports = router;

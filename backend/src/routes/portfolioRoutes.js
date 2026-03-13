const express = require('express');
const PortfolioController = require('../controllers/portfolioController');

const router = express.Router();

router.get('/config', PortfolioController.getDisplayConfig);
router.get('/articles', PortfolioController.listArticles);
router.get('/articles/:id', PortfolioController.getArticleById);
router.post('/articles', PortfolioController.saveArticle);

module.exports = router;

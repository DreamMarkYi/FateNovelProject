const express = require('express');
const PortfolioController = require('../controllers/portfolioController');

const router = express.Router();

/** 生产环境默认关闭文章写入，仅保留 GET；需线上保存时设置 PORTFOLIO_ALLOW_ARTICLE_WRITE=true */
function requirePortfolioArticleWrite(req, res, next) {
  const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  const allowFlag = String(process.env.PORTFOLIO_ALLOW_ARTICLE_WRITE || '')
    .trim()
    .toLowerCase();
  const allowWrite = allowFlag === '1' || allowFlag === 'true' || allowFlag === 'yes';
  if (isProd && !allowWrite) {
    return res.status(403).json({
      success: false,
      message:
        '生产环境已禁用通过 API 保存文章。请在本地/开发环境编辑并部署文件，或设置环境变量 PORTFOLIO_ALLOW_ARTICLE_WRITE=true 后重试。',
    });
  }
  next();
}

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
router.post('/articles', requirePortfolioArticleWrite, PortfolioController.saveArticle);
router.post('/novel', PortfolioController.saveNovelConfig);
router.post('/novel/chapters', PortfolioController.saveNovelChapter);

module.exports = router;

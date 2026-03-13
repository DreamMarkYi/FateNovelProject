const fs = require('fs/promises');
const path = require('path');

const DEFAULT_ARTICLE_DIR = path.resolve(__dirname, '../../portfolio-articles');
const DEFAULT_DISPLAY_CONFIG_PATH = path.resolve(
  __dirname,
  '../../portfolio-config/display-config.json'
);

function getArticleDir() {
  const customDir = process.env.PORTFOLIO_ARTICLE_DIR;
  if (!customDir) {
    return DEFAULT_ARTICLE_DIR;
  }
  return path.resolve(customDir);
}

function getDisplayConfigPath() {
  const customPath = process.env.PORTFOLIO_DISPLAY_CONFIG_PATH;
  if (!customPath) {
    return DEFAULT_DISPLAY_CONFIG_PATH;
  }
  return path.resolve(customPath);
}

function normalizeId(rawId) {
  return String(rawId || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5-_ ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function ensureSafeId(id) {
  if (!id || id.includes('/') || id.includes('\\') || id.includes('..')) {
    return null;
  }
  return id;
}

function buildArticlePath(id) {
  const fileName = `${id}.json`;
  return path.join(getArticleDir(), fileName);
}

async function ensureArticleDirExists() {
  await fs.mkdir(getArticleDir(), { recursive: true });
}

function buildSummary(markdown) {
  const plainText = String(markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/[#>*_\-\[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText) {
    return '';
  }
  return plainText.slice(0, 120);
}

function normalizeGalleryImages(rawImages) {
  if (!Array.isArray(rawImages)) {
    return [];
  }

  return rawImages
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function normalizeVisibilityFlag(value, defaultValue = true) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }

  return defaultValue;
}

function normalizeDisplayConfig(rawConfig) {
  const config = rawConfig && typeof rawConfig === 'object' ? rawConfig : {};
  const heroBackgroundImages = Array.isArray(config.heroBackgroundImages)
    ? config.heroBackgroundImages
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    : [];
  const heroScrollSpeedSec = Number(config.heroScrollSpeedSec);

  return {
    heroBackgroundImages,
    heroScrollSpeedSec:
      Number.isFinite(heroScrollSpeedSec) && heroScrollSpeedSec > 0 ? heroScrollSpeedSec : 45,
  };
}

async function readArticleFile(fullPath) {
  const fileContent = await fs.readFile(fullPath, 'utf8');
  const parsed = JSON.parse(fileContent);

  return {
    id: parsed.id,
    title: parsed.title || '未命名文章',
    tags: parsed.tags || '',
    coverImage: parsed.coverImage || '',
    galleryImages: normalizeGalleryImages(parsed.galleryImages),
    markdown: parsed.markdown || '',
    author: parsed.author || 'SYSTEM',
    createdAt: parsed.createdAt || null,
    updatedAt: parsed.updatedAt || null,
    summary: parsed.summary || buildSummary(parsed.markdown || ''),
    showInGallery: normalizeVisibilityFlag(parsed.showInGallery, true),
    showInCatalog: normalizeVisibilityFlag(parsed.showInCatalog, true),
  };
}

class PortfolioController {
  static async getDisplayConfig(req, res) {
    try {
      const configPath = getDisplayConfigPath();
      const fileContent = await fs.readFile(configPath, 'utf8');
      const parsed = JSON.parse(fileContent);

      res.json({
        success: true,
        data: normalizeDisplayConfig(parsed),
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.json({
          success: true,
          data: normalizeDisplayConfig({}),
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async listArticles(req, res) {
    try {
      await ensureArticleDirExists();

      const articleDir = getArticleDir();
      const files = await fs.readdir(articleDir);
      const jsonFiles = files.filter((file) => file.endsWith('.json'));

      const articles = await Promise.all(
        jsonFiles.map(async (file) => {
          const fullPath = path.join(articleDir, file);
          try {
            return await readArticleFile(fullPath);
          } catch (error) {
            console.warn(`[portfolio] 跳过无效文章文件: ${file}`, error.message);
            return null;
          }
        })
      );

      const data = articles
        .filter(Boolean)
        .sort((a, b) => {
          const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return tb - ta;
        });

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getArticleById(req, res) {
    try {
      const safeId = ensureSafeId(req.params.id);
      if (!safeId) {
        return res.status(400).json({
          success: false,
          message: '文章ID不合法',
        });
      }

      const fullPath = buildArticlePath(safeId);
      const article = await readArticleFile(fullPath);

      res.json({
        success: true,
        data: article,
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          message: '文章不存在',
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async saveArticle(req, res) {
    try {
      const { id, title, tags, coverImage, galleryImages, markdown, author, showInGallery, showInCatalog } =
        req.body || {};
      const normalizedId = normalizeId(id || title);
      const safeId = ensureSafeId(normalizedId);

      if (!safeId) {
        return res.status(400).json({
          success: false,
          message: '请提供合法的标题或文章ID',
        });
      }

      if (!title || !String(title).trim()) {
        return res.status(400).json({
          success: false,
          message: '标题不能为空',
        });
      }

      await ensureArticleDirExists();

      const articlePath = buildArticlePath(safeId);
      const nowIso = new Date().toISOString();

      let createdAt = nowIso;
      try {
        const existing = await readArticleFile(articlePath);
        createdAt = existing.createdAt || nowIso;
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      const articleData = {
        id: safeId,
        title: String(title).trim(),
        tags: String(tags || '').trim(),
        coverImage: String(coverImage || '').trim(),
        galleryImages: normalizeGalleryImages(galleryImages),
        markdown: String(markdown || ''),
        author: String(author || 'SYSTEM').trim(),
        summary: buildSummary(markdown),
        showInGallery: normalizeVisibilityFlag(showInGallery, true),
        showInCatalog: normalizeVisibilityFlag(showInCatalog, true),
        createdAt,
        updatedAt: nowIso,
      };

      await fs.writeFile(articlePath, JSON.stringify(articleData, null, 2), 'utf8');

      res.status(201).json({
        success: true,
        message: '文章已保存到文件夹',
        data: articleData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = PortfolioController;

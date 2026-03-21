const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_ARTICLE_DIR = path.resolve(__dirname, '../../portfolio-articles');
const DEFAULT_NOVEL_DIR = path.resolve(__dirname, '../../portfolio-Novel');
const DEFAULT_MEMO_DIR = path.resolve(__dirname, '../../portfolio-memo');
const DEFAULT_DISPLAY_CONFIG_PATH = path.resolve(
  __dirname,
  '../../portfolio-config/display-config.json'
);
const DEFAULT_NOVEL_CONFIG_PATH = path.resolve(
  __dirname,
  '../../portfolio-config/portfolio-novel.json'
);
const NOVEL_ACCESS_NAME_SALT = process.env.PORTFOLIO_NOVEL_ACCESS_NAME_SALT || 'portfolio-novel-name-salt-v1';
const NOVEL_ACCESS_SECRET = process.env.PORTFOLIO_NOVEL_ACCESS_SECRET || 'portfolio-novel-access-secret-v1';
const NOVEL_ACCESS_EXPIRES_MS = 10 * 60 * 1000;
const MEMO_ACCESS_NAME_SALT = process.env.PORTFOLIO_MEMO_ACCESS_NAME_SALT || 'portfolio-memo-name-salt-v1';
const MEMO_ACCESS_SECRET = process.env.PORTFOLIO_MEMO_ACCESS_SECRET || 'portfolio-memo-access-secret-v1';
const MEMO_ACCESS_EXPIRES_MS = 30 * 60 * 1000;

function getArticleDir() {
  const customDir = process.env.PORTFOLIO_ARTICLE_DIR;
  if (!customDir) {
    return DEFAULT_ARTICLE_DIR;
  }
  return path.resolve(customDir);
}

function getNovelDir() {
  const customDir = process.env.PORTFOLIO_NOVEL_DIR;
  if (!customDir) {
    return DEFAULT_NOVEL_DIR;
  }
  return path.resolve(customDir);
}

function getMemoDir() {
  const customDir = process.env.PORTFOLIO_MEMO_DIR;
  if (!customDir) {
    return DEFAULT_MEMO_DIR;
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

function getNovelConfigPath() {
  const customPath = process.env.PORTFOLIO_NOVEL_CONFIG_PATH;
  if (!customPath) {
    return DEFAULT_NOVEL_CONFIG_PATH;
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

function hashNameWithSalt(rawName, salt) {
  return crypto
    .createHash('sha256')
    .update(`${String(salt || '')}:${String(rawName || '').trim()}`)
    .digest('hex');
}

function hashGuardianName(rawName) {
  return hashNameWithSalt(rawName, NOVEL_ACCESS_NAME_SALT);
}

function hashMemoAccessName(rawName) {
  return hashNameWithSalt(rawName, MEMO_ACCESS_NAME_SALT);
}

function splitEnvList(rawValue) {
  return String(rawValue || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isHexDigest(value, expectedLength = 64) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (normalized.length !== expectedLength) {
    return false;
  }
  return /^[0-9a-f]+$/.test(normalized);
}

function isDevelopmentMode() {
  return String(process.env.NODE_ENV || 'development').trim().toLowerCase() === 'development';
}

function parseGuardianNamesFromBody(body = {}) {
  if (Array.isArray(body.names)) {
    return body.names.map((item) => String(item || '').trim()).filter(Boolean);
  }

  if (typeof body.namesText === 'string') {
    return body.namesText
      .split(/\r?\n|,/)
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  return [];
}

function getExpectedGuardianNameHashes() {
  const preHashedList = [
    ...splitEnvList(process.env.PORTFOLIO_NOVEL_ACCESS_NAME_HASHES),
    ...splitEnvList(process.env.PORTFOLIO_NOVEL_ACCESS_NAME_HASH),
  ]
    .map((item) => item.toLowerCase())
    .filter((item) => isHexDigest(item));
  if (preHashedList.length > 0) {
    return preHashedList;
  }

  // 兼容未配置 hash 的开发环境，仍不直接存储明文
  const names = [
    ...splitEnvList(process.env.PORTFOLIO_NOVEL_ACCESS_NAMES),
    ...splitEnvList(process.env.PORTFOLIO_NOVEL_ACCESS_NAME),
  ];
  if (names.length === 0) {
    return [hashGuardianName('Illusion')];
  }
  return names.map((name) => hashGuardianName(name).toLowerCase());
}

function getExpectedMemoAccessNameHashes() {
  const preHashedList = [
    ...splitEnvList(process.env.PORTFOLIO_MEMO_ACCESS_NAME_HASHES),
    ...splitEnvList(process.env.PORTFOLIO_MEMO_ACCESS_NAME_HASH),
  ]
    .map((item) => item.toLowerCase())
    .filter((item) => isHexDigest(item));
  if (preHashedList.length > 0) {
    return preHashedList;
  }

  const names = [
    ...splitEnvList(process.env.PORTFOLIO_MEMO_ACCESS_NAMES),
    ...splitEnvList(process.env.PORTFOLIO_MEMO_ACCESS_NAME),
  ];
  if (names.length === 0) {
    return [hashMemoAccessName('MemoKeeper')];
  }
  return names.map((name) => hashMemoAccessName(name).toLowerCase());
}

function safeEqualHex(a, b) {
  try {
    const leftHex = String(a || '').trim().toLowerCase();
    const rightHex = String(b || '').trim().toLowerCase();
    if (!isHexDigest(leftHex) || !isHexDigest(rightHex)) {
      return false;
    }
    const left = Buffer.from(leftHex, 'hex');
    const right = Buffer.from(rightHex, 'hex');
    if (left.length === 0 || right.length === 0 || left.length !== right.length) {
      return false;
    }
    return crypto.timingSafeEqual(left, right);
  } catch (error) {
    return false;
  }
}

function signNovelAccessPayload(payloadJson) {
  return crypto.createHmac('sha256', NOVEL_ACCESS_SECRET).update(payloadJson).digest('hex');
}

function signMemoAccessPayload(payloadJson) {
  return crypto.createHmac('sha256', MEMO_ACCESS_SECRET).update(payloadJson).digest('hex');
}

function toBase64Url(value) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(paddingLength);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function createNovelAccessToken(chapterId) {
  const payload = {
    chapterId,
    exp: Date.now() + NOVEL_ACCESS_EXPIRES_MS,
  };
  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = toBase64Url(payloadJson);
  const signature = signNovelAccessPayload(payloadJson);
  return `${payloadBase64}.${signature}`;
}

function verifyNovelAccessToken(token, expectedChapterId) {
  const raw = String(token || '');
  const [payloadBase64, signature] = raw.split('.');
  if (!payloadBase64 || !signature) {
    return { valid: false, message: '缺少访问令牌' };
  }

  let payloadJson = '';
  try {
    payloadJson = fromBase64Url(payloadBase64);
  } catch (error) {
    return { valid: false, message: '访问令牌格式无效' };
  }

  const expectedSignature = signNovelAccessPayload(payloadJson);
  if (!safeEqualHex(signature, expectedSignature)) {
    return { valid: false, message: '访问令牌签名无效' };
  }

  let payload = null;
  try {
    payload = JSON.parse(payloadJson);
  } catch (error) {
    return { valid: false, message: '访问令牌内容无效' };
  }

  if (!payload || payload.chapterId !== expectedChapterId) {
    return { valid: false, message: '访问令牌与章节不匹配' };
  }

  if (!Number.isFinite(payload.exp) || payload.exp < Date.now()) {
    return { valid: false, message: '访问令牌已过期' };
  }

  return { valid: true };
}

function createMemoAccessToken() {
  const payload = {
    scope: 'memo:write',
    exp: Date.now() + MEMO_ACCESS_EXPIRES_MS,
  };
  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = toBase64Url(payloadJson);
  const signature = signMemoAccessPayload(payloadJson);
  return `${payloadBase64}.${signature}`;
}

function verifyMemoAccessToken(token) {
  const raw = String(token || '');
  const [payloadBase64, signature] = raw.split('.');
  if (!payloadBase64 || !signature) {
    return { valid: false, message: '缺少便签访问令牌' };
  }

  let payloadJson = '';
  try {
    payloadJson = fromBase64Url(payloadBase64);
  } catch (error) {
    return { valid: false, message: '便签访问令牌格式无效' };
  }

  const expectedSignature = signMemoAccessPayload(payloadJson);
  if (!safeEqualHex(signature, expectedSignature)) {
    return { valid: false, message: '便签访问令牌签名无效' };
  }

  let payload = null;
  try {
    payload = JSON.parse(payloadJson);
  } catch (error) {
    return { valid: false, message: '便签访问令牌内容无效' };
  }

  if (!payload || payload.scope !== 'memo:write') {
    return { valid: false, message: '便签访问令牌作用域无效' };
  }

  if (!Number.isFinite(payload.exp) || payload.exp < Date.now()) {
    return { valid: false, message: '便签访问令牌已过期' };
  }

  return { valid: true };
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

function buildNovelPath(id) {
  const fileName = `${id}.json`;
  return path.join(getNovelDir(), fileName);
}

function buildMemoPath(id) {
  const fileName = `${id}.json`;
  return path.join(getMemoDir(), fileName);
}

async function ensureArticleDirExists() {
  await fs.mkdir(getArticleDir(), { recursive: true });
}

async function ensureNovelDirExists() {
  await fs.mkdir(getNovelDir(), { recursive: true });
}

async function ensureMemoDirExists() {
  await fs.mkdir(getMemoDir(), { recursive: true });
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

function normalizeVolumeNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return Math.min(Math.floor(n), 9999);
}

/** 卷名为空时使用的默认展示文案 */
const DEFAULT_VOLUME_NAME = '第一卷：已发布章节';

function normalizeVolumeNameString(value) {
  const s = String(value ?? '').trim();
  if (!s) {
    return DEFAULT_VOLUME_NAME;
  }
  return s.slice(0, 200);
}

function legacyVolumeNumberToVolumeName(n) {
  const num = normalizeVolumeNumber(n);
  const names = [
    '一',
    '二',
    '三',
    '四',
    '五',
    '六',
    '七',
    '八',
    '九',
    '十',
    '十一',
    '十二',
    '十三',
    '十四',
    '十五',
    '十六',
    '十七',
    '十八',
    '十九',
    '二十',
  ];
  const head = num <= 20 ? `第${names[num - 1]}卷` : `第${num}卷`;
  return `${head}：已发布章节`;
}

function deriveVolumeNameFromParsed(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return DEFAULT_VOLUME_NAME;
  }
  const direct = String(parsed.volumeName || '').trim();
  if (direct) {
    return direct.slice(0, 200);
  }
  if (parsed.volume !== undefined && parsed.volume !== null && parsed.volume !== '') {
    const n = Number(parsed.volume);
    if (Number.isFinite(n) && n >= 1) {
      return legacyVolumeNumberToVolumeName(n);
    }
  }
  return DEFAULT_VOLUME_NAME;
}

function normalizeNovelData(rawData) {
  const data = rawData && typeof rawData === 'object' ? rawData : {};
  const normalizedWordCount = Number(data.wordCount);

  return {
    id: 'portfolio-novel',
    title: String(data.title || '雪坠银链时 ~Imaginary White~').trim(),
    chapter: String(data.chapter || '第一章：雨中的交错').trim(),
    author: String(data.author || "Illusion's DrM").trim(),
    wordCount:
      Number.isFinite(normalizedWordCount) && normalizedWordCount >= 0 ? normalizedWordCount : 3240,
    updateDate: String(data.updateDate || '2026.03.14').trim(),
    coverImage: String(data.coverImage || '').trim(),
    markdown: String(data.markdown || '').trim(),
    volumeName: deriveVolumeNameFromParsed(data),
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

async function readNovelFile(fullPath) {
  const fileContent = await fs.readFile(fullPath, 'utf8');
  const parsed = JSON.parse(fileContent);

  return {
    id: parsed.id,
    title: parsed.title || parsed.chapter || '未命名章节',
    chapter: parsed.chapter || parsed.title || '未命名章节',
    author: parsed.author || 'SYSTEM',
    coverImage: parsed.coverImage || '',
    markdown: parsed.markdown || '',
    tags: parsed.tags || 'Novel',
    summary: parsed.summary || buildSummary(parsed.markdown || ''),
    volumeName: deriveVolumeNameFromParsed(parsed),
    createdAt: parsed.createdAt || null,
    updatedAt: parsed.updatedAt || null,
  };
}

/** 章节目录列表用：不得包含正文或可由正文推导的摘要，避免绕过姓名验证 */
function toNovelChapterListItem(full) {
  if (!full || typeof full !== 'object') {
    return null;
  }
  return {
    id: full.id,
    title: full.title,
    chapter: full.chapter,
    author: full.author,
    coverImage: full.coverImage,
    tags: full.tags,
    volumeName: normalizeVolumeNameString(full.volumeName),
    createdAt: full.createdAt,
    updatedAt: full.updatedAt,
  };
}

async function readMemoFile(fullPath) {
  const fileContent = await fs.readFile(fullPath, 'utf8');
  const parsed = JSON.parse(fileContent);
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
    : [];

  return {
    id: String(parsed.id || ''),
    createdAt: parsed.createdAt || null,
    updatedAt: parsed.updatedAt || null,
    content: String(parsed.content || ''),
    tags,
    pinned: Boolean(parsed.pinned),
  };
}

class PortfolioController {
  static async generateNovelAccessNameHashes(req, res) {
    try {
      if (!isDevelopmentMode()) {
        return res.status(403).json({
          success: false,
          message: '该接口仅在开发模式可用',
        });
      }

      const names = parseGuardianNamesFromBody(req.body || {});
      if (names.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请至少提供一个姓名',
        });
      }

      const uniqueNames = Array.from(new Set(names));
      const hashes = uniqueNames.map((name) => hashGuardianName(name).toLowerCase());

      return res.json({
        success: true,
        data: {
          nameCount: uniqueNames.length,
          names: uniqueNames,
          hashes,
          envLine: `PORTFOLIO_NOVEL_ACCESS_NAME_HASHES=${hashes.join(',')}`,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async verifyNovelChapterAccess(req, res) {
    try {
      const safeId = ensureSafeId(req.params.id);
      if (!safeId) {
        return res.status(400).json({
          success: false,
          message: '章节ID不合法',
        });
      }

      const chapterPath = buildNovelPath(safeId);
      try {
        await fs.access(chapterPath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          return res.status(404).json({
            success: false,
            message: '章节不存在',
          });
        }
        throw error;
      }

      const guardianName = String(
        req.body?.guardianName || req.body?.accessName || req.body?.name || ''
      ).trim();
      if (!guardianName) {
        return res.status(400).json({
          success: false,
          message: '请输入验证姓名',
        });
      }

      const inputHash = hashGuardianName(guardianName).toLowerCase();
      const expectedHashes = getExpectedGuardianNameHashes();
      const matched = expectedHashes.some((expectedHash) => safeEqualHex(inputHash, expectedHash));
      if (!matched) {
        return res.status(403).json({
          success: false,
          message: '姓名验证失败，无法进入阅读页',
        });
      }

      const accessToken = createNovelAccessToken(safeId);
      res.json({
        success: true,
        message: '验证通过',
        data: {
          accessToken,
          expiresInMs: NOVEL_ACCESS_EXPIRES_MS,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async verifyMemoAccess(req, res) {
    try {
      const accessName = String(
        req.body?.accessName || req.body?.guardianName || req.body?.name || ''
      ).trim();
      if (!accessName) {
        return res.status(400).json({
          success: false,
          message: '请输入验证姓名',
        });
      }

      const inputHash = hashMemoAccessName(accessName).toLowerCase();
      const expectedHashes = getExpectedMemoAccessNameHashes();
      const matched = expectedHashes.some((expectedHash) => safeEqualHex(inputHash, expectedHash));
      if (!matched) {
        return res.status(403).json({
          success: false,
          message: '姓名验证失败，无法记录便签',
        });
      }

      const accessToken = createMemoAccessToken();
      return res.json({
        success: true,
        message: '验证通过',
        data: {
          accessToken,
          expiresInMs: MEMO_ACCESS_EXPIRES_MS,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async listMemos(req, res) {
    try {
      await ensureMemoDirExists();

      const memoDir = getMemoDir();
      const files = await fs.readdir(memoDir);
      const jsonFiles = files.filter((file) => file.endsWith('.json'));

      const memos = await Promise.all(
        jsonFiles.map(async (file) => {
          const fullPath = path.join(memoDir, file);
          try {
            return await readMemoFile(fullPath);
          } catch (error) {
            console.warn(`[portfolio] 跳过无效便签文件: ${file}`, error.message);
            return null;
          }
        })
      );

      const data = memos
        .filter(Boolean)
        .sort((a, b) => {
          const pa = a.pinned ? 1 : 0;
          const pb = b.pinned ? 1 : 0;
          if (pa !== pb) {
            return pb - pa;
          }
          const ta = new Date(a.createdAt || 0).getTime();
          const tb = new Date(b.createdAt || 0).getTime();
          return tb - ta;
        });

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 开发环境：更新便签置顶（生产环境拒绝）
   */
  static async updateMemoDevFlags(req, res) {
    try {
      if (!isDevelopmentMode()) {
        return res.status(403).json({
          success: false,
          message: '仅在开发环境下可修改置顶',
        });
      }

      const safeId = ensureSafeId(req.params.id);
      if (!safeId) {
        return res.status(400).json({
          success: false,
          message: '便签 ID 不合法',
        });
      }

      const memoPath = buildMemoPath(safeId);
      let existing;
      try {
        existing = await readMemoFile(memoPath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          return res.status(404).json({
            success: false,
            message: '便签不存在',
          });
        }
        throw error;
      }

      const body = req.body || {};
      const pinned = body.pinned !== undefined ? Boolean(body.pinned) : Boolean(existing.pinned);

      const memoData = {
        ...existing,
        pinned,
        updatedAt: new Date().toISOString(),
      };

      await fs.writeFile(memoPath, JSON.stringify(memoData, null, 2), 'utf8');

      return res.json({
        success: true,
        message: '便签属性已更新',
        data: memoData,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async saveMemo(req, res) {
    try {
      const tokenFromHeader =
        req.headers['x-portfolio-memo-access-token'] ||
        String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      const tokenCheckResult = verifyMemoAccessToken(tokenFromHeader);
      if (!tokenCheckResult.valid) {
        return res.status(403).json({
          success: false,
          message: tokenCheckResult.message,
        });
      }

      const content = String(req.body?.content || '').trim();
      if (!content) {
        return res.status(400).json({
          success: false,
          message: '便签内容不能为空',
        });
      }

      const tags = Array.isArray(req.body?.tags)
        ? req.body.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
        : [];

      await ensureMemoDirExists();

      const nowIso = new Date().toISOString();
      const randomPart = Math.random().toString(36).slice(2, 8);
      const memoId = normalizeId(`memo-${Date.now()}-${randomPart}`) || `memo-${Date.now()}`;
      const memoData = {
        id: memoId,
        content,
        tags,
        pinned: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const memoPath = buildMemoPath(memoId);
      await fs.writeFile(memoPath, JSON.stringify(memoData, null, 2), 'utf8');

      return res.status(201).json({
        success: true,
        message: '便签已保存',
        data: memoData,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getNovelConfig(req, res) {
    try {
      const configPath = getNovelConfigPath();
      const fileContent = await fs.readFile(configPath, 'utf8');
      const parsed = JSON.parse(fileContent);

      res.json({
        success: true,
        data: normalizeNovelData(parsed),
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.json({
          success: true,
          data: normalizeNovelData({}),
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async saveNovelConfig(req, res) {
    try {
      const normalized = normalizeNovelData(req.body || {});
      const configPath = getNovelConfigPath();

      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(configPath, JSON.stringify(normalized, null, 2), 'utf8');

      res.status(201).json({
        success: true,
        message: '小说配置已保存',
        data: normalized,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async listNovelChapters(req, res) {
    try {
      await ensureNovelDirExists();

      const novelDir = getNovelDir();
      const files = await fs.readdir(novelDir);
      const jsonFiles = files.filter((file) => file.endsWith('.json'));

      const chapters = await Promise.all(
        jsonFiles.map(async (file) => {
          const fullPath = path.join(novelDir, file);
          try {
            return await readNovelFile(fullPath);
          } catch (error) {
            console.warn(`[portfolio] 跳过无效小说章节文件: ${file}`, error.message);
            return null;
          }
        })
      );

      const data = chapters
        .filter(Boolean)
        .map((ch) => toNovelChapterListItem(ch))
        .filter(Boolean)
        .sort((a, b) => {
          const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return ta - tb;
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

  static async getNovelChapterById(req, res) {
    try {
      const safeId = ensureSafeId(req.params.id);
      if (!safeId) {
        return res.status(400).json({
          success: false,
          message: '章节ID不合法',
        });
      }

      const tokenFromHeader =
        req.headers['x-novel-access-token'] ||
        String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      const tokenCheckResult = verifyNovelAccessToken(tokenFromHeader, safeId);
      if (!tokenCheckResult.valid) {
        return res.status(403).json({
          success: false,
          message: tokenCheckResult.message,
        });
      }

      const fullPath = buildNovelPath(safeId);
      const chapter = await readNovelFile(fullPath);

      res.json({
        success: true,
        data: chapter,
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          message: '章节不存在',
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async saveNovelChapter(req, res) {
    try {
      const body = req.body || {};
      const { id, title, chapter, coverImage, markdown, author, tags, volumeName, volume } = body;
      const normalizedId = normalizeId(id || chapter || title);
      const safeId = ensureSafeId(normalizedId);

      if (!safeId) {
        return res.status(400).json({
          success: false,
          message: '请提供合法的章节ID或标题',
        });
      }

      const chapterTitle = String(chapter || title || '').trim();
      if (!chapterTitle) {
        return res.status(400).json({
          success: false,
          message: '章节标题不能为空',
        });
      }

      await ensureNovelDirExists();

      const chapterPath = buildNovelPath(safeId);
      const nowIso = new Date().toISOString();

      let createdAt = nowIso;
      let volumeNameFromExisting = DEFAULT_VOLUME_NAME;
      try {
        const existing = await readNovelFile(chapterPath);
        createdAt = existing.createdAt || nowIso;
        volumeNameFromExisting = normalizeVolumeNameString(existing.volumeName);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      let resolvedVolumeName = volumeNameFromExisting;
      if (Object.prototype.hasOwnProperty.call(body, 'volumeName')) {
        resolvedVolumeName = normalizeVolumeNameString(volumeName);
      } else if (volume !== undefined && volume !== null && volume !== '') {
        resolvedVolumeName = legacyVolumeNumberToVolumeName(volume);
      }

      const chapterData = {
        id: safeId,
        title: chapterTitle,
        chapter: chapterTitle,
        author: String(author || 'SYSTEM').trim(),
        tags: String(tags || 'Novel').trim(),
        coverImage: String(coverImage || '').trim(),
        markdown: String(markdown || ''),
        summary: buildSummary(markdown),
        volumeName: resolvedVolumeName,
        createdAt,
        updatedAt: nowIso,
      };

      await fs.writeFile(chapterPath, JSON.stringify(chapterData, null, 2), 'utf8');

      res.status(201).json({
        success: true,
        message: '小说章节已保存到 portfolio-Novel 文件夹',
        data: chapterData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

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

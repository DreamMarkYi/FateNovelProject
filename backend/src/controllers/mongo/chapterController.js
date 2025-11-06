const Chapter = require('../../schemas/chapterSchema');
const Novel = require('../../schemas/novelSchema');

class ChapterController {
  // 获取小说的所有章节
  static async getChaptersByNovel(req, res) {
    try {
      const { novelId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      
      const chapters = await Chapter.find({ novelId })
        .select('-content -__v')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ chapterNumber: 1 });
      
      const count = await Chapter.countDocuments({ novelId });
      
      res.json({
        success: true,
        data: chapters,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 根据ID获取章节详情
  static async getChapterById(req, res) {
    try {
      const { id } = req.params;
      const chapter = await Chapter.findById(id)
        .populate('novelId', 'title author')
        .select('-__v');
      
      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: '章节不存在'
        });
      }
      
      // 增加浏览次数
      chapter.views += 1;
      await chapter.save();
      
      res.json({
        success: true,
        data: chapter
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 根据章节号获取章节
  static async getChapterByNumber(req, res) {
    try {
      const { novelId, chapterNumber } = req.params;
      
      const chapter = await Chapter.findOne({ 
        novelId, 
        chapterNumber: parseInt(chapterNumber) 
      })
        .populate('novelId', 'title author')
        .populate('previousChapter', 'chapterNumber title')
        .populate('nextChapter', 'chapterNumber title')
        .select('-__v');
      
      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: '章节不存在'
        });
      }
      
      // 增加浏览次数
      chapter.views += 1;
      await chapter.save();
      
      res.json({
        success: true,
        data: chapter
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 创建新章节
  static async createChapter(req, res) {
    try {
      const chapterData = req.body;
      
      // 验证小说是否存在
      const novel = await Novel.findById(chapterData.novelId);
      if (!novel) {
        return res.status(404).json({
          success: false,
          message: '小说不存在'
        });
      }
      
      // 计算字数
      if (chapterData.content) {
        chapterData.wordCount = chapterData.content.length;
      }
      
      const chapter = new Chapter(chapterData);
      await chapter.save();
      
      // 更新小说的总章节数
      novel.totalChapters = await Chapter.countDocuments({ novelId: novel._id });
      await novel.save();
      
      res.status(201).json({
        success: true,
        message: '章节创建成功',
        data: chapter
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 更新章节
  static async updateChapter(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // 更新字数
      if (updates.content) {
        updates.wordCount = updates.content.length;
      }
      
      const chapter = await Chapter.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );
      
      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: '章节不存在'
        });
      }
      
      res.json({
        success: true,
        message: '章节更新成功',
        data: chapter
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 删除章节
  static async deleteChapter(req, res) {
    try {
      const { id } = req.params;
      const chapter = await Chapter.findByIdAndDelete(id);
      
      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: '章节不存在'
        });
      }
      
      // 更新小说的总章节数
      const novel = await Novel.findById(chapter.novelId);
      if (novel) {
        novel.totalChapters = await Chapter.countDocuments({ novelId: novel._id });
        await novel.save();
      }
      
      res.json({
        success: true,
        message: '章节删除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 批量创建章节
  static async batchCreateChapters(req, res) {
    try {
      const { novelId, chapters } = req.body;
      
      // 验证小说是否存在
      const novel = await Novel.findById(novelId);
      if (!novel) {
        return res.status(404).json({
          success: false,
          message: '小说不存在'
        });
      }
      
      // 处理章节数据
      const chaptersData = chapters.map(ch => ({
        ...ch,
        novelId,
        wordCount: ch.content ? ch.content.length : 0
      }));
      
      const createdChapters = await Chapter.insertMany(chaptersData);
      
      // 更新小说的总章节数
      novel.totalChapters = await Chapter.countDocuments({ novelId: novel._id });
      await novel.save();
      
      res.status(201).json({
        success: true,
        message: `成功创建${createdChapters.length}个章节`,
        data: createdChapters
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = ChapterController;


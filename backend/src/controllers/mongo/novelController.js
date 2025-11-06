const Novel = require('../../schemas/novelSchema');

class NovelController {
  // 获取所有小说
  static async getAllNovels(req, res) {
    try {
      const { page = 1, limit = 20, category, status, search } = req.query;
      
      const query = {};
      if (category) query.category = category;
      if (status) query.status = status;
      if (search) {
        query.$text = { $search: search };
      }
      
      const novels = await Novel.find(query)
        .select('-__v')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });
      
      const count = await Novel.countDocuments(query);
      
      res.json({
        success: true,
        data: novels,
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

  // 获取已发布的小说
  static async getPublishedNovels(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      
      const novels = await Novel.find({ isPublished: true })
        .select('-__v')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });
      
      const count = await Novel.countDocuments({ isPublished: true });
      
      res.json({
        success: true,
        data: novels,
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

  // 根据ID获取小说
  static async getNovelById(req, res) {
    try {
      const { id } = req.params;
      const novel = await Novel.findById(id).select('-__v');
      
      if (!novel) {
        return res.status(404).json({
          success: false,
          message: '小说不存在'
        });
      }
      
      // 增加浏览次数
      novel.views += 1;
      await novel.save();
      
      res.json({
        success: true,
        data: novel
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 创建新小说
  static async createNovel(req, res) {
    try {
      const novelData = req.body;
      const novel = new Novel(novelData);
      await novel.save();
      
      res.status(201).json({
        success: true,
        message: '小说创建成功',
        data: novel
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 更新小说
  static async updateNovel(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const novel = await Novel.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );
      
      if (!novel) {
        return res.status(404).json({
          success: false,
          message: '小说不存在'
        });
      }
      
      res.json({
        success: true,
        message: '小说更新成功',
        data: novel
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 删除小说
  static async deleteNovel(req, res) {
    try {
      const { id } = req.params;
      const novel = await Novel.findByIdAndDelete(id);
      
      if (!novel) {
        return res.status(404).json({
          success: false,
          message: '小说不存在'
        });
      }
      
      res.json({
        success: true,
        message: '小说删除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 点赞小说
  static async likeNovel(req, res) {
    try {
      const { id } = req.params;
      const novel = await Novel.findById(id);
      
      if (!novel) {
        return res.status(404).json({
          success: false,
          message: '小说不存在'
        });
      }
      
      novel.likes += 1;
      await novel.save();
      
      res.json({
        success: true,
        message: '点赞成功',
        data: { likes: novel.likes }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = NovelController;


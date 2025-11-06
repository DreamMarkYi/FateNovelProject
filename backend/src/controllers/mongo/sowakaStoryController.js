const SowakaStory = require('../../schemas/sowakaStorySchema');

class SowakaStoryController {
  // 获取所有Sowaka故事
  static async getAllSowakaStories(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      
      const stories = await SowakaStory.find({})
        .select('-__v')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ displayOrder: 1, createdAt: -1 });
      
      const count = await SowakaStory.countDocuments({});
      
      res.json({
        success: true,
        data: stories,
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

  // 获取激活的Sowaka故事
  static async getActiveSowakaStories(req, res) {
    try {
      const stories = await SowakaStory.find({ isActive: true })
        .select('-__v')
        .sort({ displayOrder: 1, createdAt: -1 });
      
      res.json({
        success: true,
        data: stories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 获取当前显示的Sowaka故事（第一个激活的）
  static async getCurrentSowakaStory(req, res) {
    try {
      const story = await SowakaStory.findOne({ isActive: true })
        .select('-__v')
        .sort({ displayOrder: 1, createdAt: -1 });
      
      if (!story) {
        return res.status(404).json({
          success: false,
          message: '没有找到激活的故事内容'
        });
      }
      
      res.json({
        success: true,
        data: story
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 根据ID获取Sowaka故事
  static async getSowakaStoryById(req, res) {
    try {
      const { id } = req.params;
      const story = await SowakaStory.findById(id).select('-__v');
      
      if (!story) {
        return res.status(404).json({
          success: false,
          message: '故事内容不存在'
        });
      }
      
      res.json({
        success: true,
        data: story
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 创建新的Sowaka故事
  static async createSowakaStory(req, res) {
    try {
      const storyData = req.body;
      
      // 更新metadata中的lastUpdated
      if (storyData.metadata) {
        storyData.metadata.lastUpdated = new Date();
      } else {
        storyData.metadata = { lastUpdated: new Date() };
      }
      
      const story = new SowakaStory(storyData);
      await story.save();
      
      res.status(201).json({
        success: true,
        message: 'Sowaka故事创建成功',
        data: story
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 更新Sowaka故事
  static async updateSowakaStory(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // 更新metadata中的lastUpdated
      if (updates.metadata) {
        updates.metadata.lastUpdated = new Date();
      } else {
        updates.metadata = { lastUpdated: new Date() };
      }
      
      const story = await SowakaStory.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );
      
      if (!story) {
        return res.status(404).json({
          success: false,
          message: '故事内容不存在'
        });
      }
      
      res.json({
        success: true,
        message: 'Sowaka故事更新成功',
        data: story
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 删除Sowaka故事
  static async deleteSowakaStory(req, res) {
    try {
      const { id } = req.params;
      const story = await SowakaStory.findByIdAndDelete(id);
      
      if (!story) {
        return res.status(404).json({
          success: false,
          message: '故事内容不存在'
        });
      }
      
      res.json({
        success: true,
        message: 'Sowaka故事删除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 切换故事激活状态
  static async toggleSowakaStoryStatus(req, res) {
    try {
      const { id } = req.params;
      const story = await SowakaStory.findById(id);
      
      if (!story) {
        return res.status(404).json({
          success: false,
          message: '故事内容不存在'
        });
      }
      
      story.isActive = !story.isActive;
      story.metadata.lastUpdated = new Date();
      await story.save();
      
      res.json({
        success: true,
        message: `故事状态已${story.isActive ? '激活' : '停用'}`,
        data: { isActive: story.isActive }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = SowakaStoryController;


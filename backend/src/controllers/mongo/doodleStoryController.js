const DoodleStory = require('../../schemas/doodleStorySchema');

class DoodleStoryController {
  // 获取所有涂鸦故事
  static async getAllDoodleStories(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      
      const stories = await DoodleStory.find({})
        .select('-__v')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ displayOrder: 1, createdAt: -1 });
      
      const count = await DoodleStory.countDocuments({});
      
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

  // 获取激活的涂鸦故事
  static async getActiveDoodleStories(req, res) {
    try {
      const stories = await DoodleStory.find({ isActive: true })
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

  // 根据ID获取涂鸦故事
  static async getDoodleStoryById(req, res) {
    try {
      const { id } = req.params;
      const story = await DoodleStory.findById(id).select('-__v');
      
      if (!story) {
        return res.status(404).json({
          success: false,
          message: '涂鸦故事不存在'
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

  // 创建新的涂鸦故事
  static async createDoodleStory(req, res) {
    try {
      const storyData = req.body;
      
      // 如果没有提供 displayOrder，自动设置
      if (storyData.displayOrder === undefined) {
        const maxOrderStory = await DoodleStory.findOne({})
          .sort({ displayOrder: -1 })
          .select('displayOrder');
        
        storyData.displayOrder = maxOrderStory ? maxOrderStory.displayOrder + 1 : 0;
      }
      
      // 更新metadata中的lastUpdated
      if (storyData.metadata) {
        storyData.metadata.lastUpdated = new Date();
      } else {
        storyData.metadata = { lastUpdated: new Date() };
      }
      
      const story = new DoodleStory(storyData);
      await story.save();
      
      res.status(201).json({
        success: true,
        message: '涂鸦故事创建成功',
        data: story
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 批量创建涂鸦故事
  static async createMultipleDoodleStories(req, res) {
    try {
      const storiesData = req.body.stories || req.body; // 支持两种格式
      const storiesArray = Array.isArray(storiesData) ? storiesData : [storiesData];
      
      // 获取当前最大的 displayOrder
      const maxOrderStory = await DoodleStory.findOne({})
        .sort({ displayOrder: -1 })
        .select('displayOrder');
      let nextOrder = maxOrderStory ? maxOrderStory.displayOrder + 1 : 0;
      
      const createdStories = [];
      for (const storyData of storiesArray) {
        if (!storyData.displayOrder) {
          storyData.displayOrder = nextOrder++;
        }
        
        if (storyData.metadata) {
          storyData.metadata.lastUpdated = new Date();
        } else {
          storyData.metadata = { lastUpdated: new Date() };
        }
        
        const story = new DoodleStory(storyData);
        await story.save();
        createdStories.push(story);
      }
      
      res.status(201).json({
        success: true,
        message: `成功创建 ${createdStories.length} 个涂鸦故事`,
        data: createdStories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 更新涂鸦故事
  static async updateDoodleStory(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // 更新metadata中的lastUpdated
      if (updates.metadata) {
        updates.metadata.lastUpdated = new Date();
      } else {
        updates.metadata = { lastUpdated: new Date() };
      }
      
      const story = await DoodleStory.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );
      
      if (!story) {
        return res.status(404).json({
          success: false,
          message: '涂鸦故事不存在'
        });
      }
      
      res.json({
        success: true,
        message: '涂鸦故事更新成功',
        data: story
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 删除涂鸦故事
  static async deleteDoodleStory(req, res) {
    try {
      const { id } = req.params;
      const story = await DoodleStory.findByIdAndDelete(id);
      
      if (!story) {
        return res.status(404).json({
          success: false,
          message: '涂鸦故事不存在'
        });
      }
      
      res.json({
        success: true,
        message: '涂鸦故事删除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 切换故事激活状态
  static async toggleDoodleStoryStatus(req, res) {
    try {
      const { id } = req.params;
      const story = await DoodleStory.findById(id);
      
      if (!story) {
        return res.status(404).json({
          success: false,
          message: '涂鸦故事不存在'
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

module.exports = DoodleStoryController;































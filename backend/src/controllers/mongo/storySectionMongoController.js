const StorySection = require('../../schemas/storySectionSchema');

class StorySectionMongoController {
  // 获取所有故事章节
  static async getAllStorySections(req, res) {
    try {
      const sections = await StorySection.find()
        .select('-__v')
        .sort({ displayOrder: 1, createdAt: -1 });
      
      res.json({
        success: true,
        data: sections
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 获取激活的故事章节
  static async getActiveStorySections(req, res) {
    try {
      const sections = await StorySection.find({ isActive: true })
        .select('-__v')
        .sort({ displayOrder: 1, createdAt: -1 });
      
      res.json({
        success: true,
        data: sections
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 根据ID获取故事章节
  static async getStorySectionById(req, res) {
    try {
      const { id } = req.params;
      const section = await StorySection.findById(id).select('-__v');
      
      if (!section) {
        return res.status(404).json({
          success: false,
          message: '故事章节不存在'
        });
      }
      
      res.json({
        success: true,
        data: section
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 创建新故事章节
  static async createStorySection(req, res) {
    try {
      const sectionData = req.body;
      const section = new StorySection(sectionData);
      await section.save();
      
      res.status(201).json({
        success: true,
        message: '故事章节创建成功',
        data: section
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 更新故事章节
  static async updateStorySection(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const section = await StorySection.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );
      
      if (!section) {
        return res.status(404).json({
          success: false,
          message: '故事章节不存在'
        });
      }
      
      res.json({
        success: true,
        message: '故事章节更新成功',
        data: section
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 删除故事章节
  static async deleteStorySection(req, res) {
    try {
      const { id } = req.params;
      const section = await StorySection.findByIdAndDelete(id);
      
      if (!section) {
        return res.status(404).json({
          success: false,
          message: '故事章节不存在'
        });
      }
      
      res.json({
        success: true,
        message: '故事章节删除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = StorySectionMongoController;


const StorySectionModel = require('../models/storySectionModel');

class StorySectionController {
  // 获取所有故事章节
  static async getAllStorySections(req, res) {
    try {
      const sections = await StorySectionModel.getAllStorySections();
      
      // 将story_text按||分割成段落数组
      const sectionsWithParagraphs = sections.map(section => ({
        ...section,
        paragraphs: section.story_text ? section.story_text.split('||') : []
      }));
      
      res.json({
        success: true,
        data: sectionsWithParagraphs
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
      const sections = await StorySectionModel.getActiveStorySections();
      
      // 将story_text按||分割成段落数组
      const sectionsWithParagraphs = sections.map(section => ({
        ...section,
        paragraphs: section.story_text ? section.story_text.split('||') : []
      }));
      
      res.json({
        success: true,
        data: sectionsWithParagraphs
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
      const section = await StorySectionModel.getStorySectionById(id);
      
      if (!section) {
        return res.status(404).json({
          success: false,
          message: '故事章节不存在'
        });
      }
      
      // 将story_text按||分割成段落数组
      section.paragraphs = section.story_text ? section.story_text.split('||') : [];
      
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
      const { 
        header_title, 
        subtitle, 
        story_text, 
        author_signature, 
        image_url, 
        is_active, 
        display_order 
      } = req.body;
      
      if (!header_title || !subtitle || !story_text) {
        return res.status(400).json({
          success: false,
          message: '标题、副标题和故事内容为必填项'
        });
      }
      
      const id = await StorySectionModel.createStorySection({
        header_title,
        subtitle,
        story_text,
        author_signature: author_signature || '— SOWAKA KYOTO',
        image_url,
        is_active: is_active !== undefined ? is_active : 1,
        display_order: display_order || 0
      });
      
      res.status(201).json({
        success: true,
        message: '故事章节创建成功',
        data: { id }
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
      const { 
        header_title, 
        subtitle, 
        story_text, 
        author_signature, 
        image_url, 
        is_active, 
        display_order 
      } = req.body;
      
      const success = await StorySectionModel.updateStorySection(id, {
        header_title,
        subtitle,
        story_text,
        author_signature,
        image_url,
        is_active,
        display_order
      });
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '故事章节不存在'
        });
      }
      
      res.json({
        success: true,
        message: '故事章节更新成功'
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
      const success = await StorySectionModel.deleteStorySection(id);
      
      if (!success) {
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

module.exports = StorySectionController;


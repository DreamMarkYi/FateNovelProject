const ContentModel = require('../models/contentModel');
const marked = require('marked');

class ContentController {
  // 获取所有内容
  static async getAllContents(req, res) {
    try {
      const contents = await ContentModel.getAllContents();
      
      // 将Markdown转换为HTML
      const contentsWithHtml = contents.map(item => ({
        ...item,
        html_content: marked.parse(item.content)
      }));
      
      res.json({
        success: true,
        data: contentsWithHtml
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 根据ID获取内容
  static async getContentById(req, res) {
    try {
      const { id } = req.params;
      const content = await ContentModel.getContentById(id);
      
      if (!content) {
        return res.status(404).json({
          success: false,
          message: '内容不存在'
        });
      }
      
      // 将Markdown转换为HTML
      content.html_content = marked.parse(content.content);
      
      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 根据类型获取内容
  static async getContentsByType(req, res) {
    try {
      const { type } = req.params;
      const contents = await ContentModel.getContentsByType(type);
      
      // 将Markdown转换为HTML
      const contentsWithHtml = contents.map(item => ({
        ...item,
        html_content: marked.parse(item.content)
      }));
      
      res.json({
        success: true,
        data: contentsWithHtml
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 创建新内容
  static async createContent(req, res) {
    try {
      const { title, content, content_type, author } = req.body;
      
      if (!title || !content || !content_type) {
        return res.status(400).json({
          success: false,
          message: '标题、内容和类型为必填项'
        });
      }
      
      const id = await ContentModel.createContent({
        title,
        content,
        content_type,
        author: author || '匿名'
      });
      
      res.status(201).json({
        success: true,
        message: '内容创建成功',
        data: { id }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 更新内容
  static async updateContent(req, res) {
    try {
      const { id } = req.params;
      const { title, content, content_type, author } = req.body;
      
      const success = await ContentModel.updateContent(id, {
        title,
        content,
        content_type,
        author
      });
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '内容不存在'
        });
      }
      
      res.json({
        success: true,
        message: '内容更新成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 删除内容
  static async deleteContent(req, res) {
    try {
      const { id } = req.params;
      const success = await ContentModel.deleteContent(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '内容不存在'
        });
      }
      
      res.json({
        success: true,
        message: '内容删除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = ContentController;



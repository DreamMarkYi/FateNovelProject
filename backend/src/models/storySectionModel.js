const { pool } = require('../config/database');

class StorySectionModel {
  // 获取所有故事章节
  static async getAllStorySections() {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM story_sections ORDER BY display_order ASC, created_at DESC'
      );
      return rows;
    } catch (error) {
      throw new Error('获取故事章节失败: ' + error.message);
    }
  }

  // 获取激活的故事章节
  static async getActiveStorySections() {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM story_sections WHERE is_active = 1 ORDER BY display_order ASC, created_at DESC'
      );
      return rows;
    } catch (error) {
      throw new Error('获取激活的故事章节失败: ' + error.message);
    }
  }

  // 根据ID获取故事章节
  static async getStorySectionById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM story_sections WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error('获取故事章节失败: ' + error.message);
    }
  }

  // 创建新故事章节
  static async createStorySection(data) {
    try {
      const { 
        header_title, 
        subtitle, 
        story_text, 
        author_signature, 
        image_url, 
        is_active, 
        display_order 
      } = data;
      
      const [result] = await pool.query(
        'INSERT INTO story_sections (header_title, subtitle, story_text, author_signature, image_url, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [header_title, subtitle, story_text, author_signature, image_url, is_active || 1, display_order || 0]
      );
      return result.insertId;
    } catch (error) {
      throw new Error('创建故事章节失败: ' + error.message);
    }
  }

  // 更新故事章节
  static async updateStorySection(id, data) {
    try {
      const { 
        header_title, 
        subtitle, 
        story_text, 
        author_signature, 
        image_url, 
        is_active, 
        display_order 
      } = data;
      
      const [result] = await pool.query(
        'UPDATE story_sections SET header_title = ?, subtitle = ?, story_text = ?, author_signature = ?, image_url = ?, is_active = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [header_title, subtitle, story_text, author_signature, image_url, is_active, display_order, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('更新故事章节失败: ' + error.message);
    }
  }

  // 删除故事章节
  static async deleteStorySection(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM story_sections WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('删除故事章节失败: ' + error.message);
    }
  }
}

module.exports = StorySectionModel;


const { pool } = require('../config/database');

class ContentModel {
  // 获取所有内容
  static async getAllContents() {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM contents ORDER BY created_at DESC'
      );
      return rows;
    } catch (error) {
      throw new Error('获取内容失败: ' + error.message);
    }
  }

  // 根据ID获取内容
  static async getContentById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM contents WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error('获取内容失败: ' + error.message);
    }
  }

  // 根据类型获取内容
  static async getContentsByType(type) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM contents WHERE content_type = ? ORDER BY created_at DESC',
        [type]
      );
      return rows;
    } catch (error) {
      throw new Error('获取内容失败: ' + error.message);
    }
  }

  // 创建新内容
  static async createContent(data) {
    try {
      const { title, content, content_type, author } = data;
      const [result] = await pool.query(
        'INSERT INTO contents (title, content, content_type, author) VALUES (?, ?, ?, ?)',
        [title, content, content_type, author]
      );
      return result.insertId;
    } catch (error) {
      throw new Error('创建内容失败: ' + error.message);
    }
  }

  // 更新内容
  static async updateContent(id, data) {
    try {
      const { title, content, content_type, author } = data;
      const [result] = await pool.query(
        'UPDATE contents SET title = ?, content = ?, content_type = ?, author = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title, content, content_type, author, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('更新内容失败: ' + error.message);
    }
  }

  // 删除内容
  static async deleteContent(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM contents WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('删除内容失败: ' + error.message);
    }
  }
}

module.exports = ContentModel;



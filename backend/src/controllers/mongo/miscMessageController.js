const MiscMessage = require('../../schemas/miscMessageSchema');
const GameSave = require('../../schemas/gameSaveSchema');
const StartChoiceRecord = require('../../schemas/startChoiceRecordSchema');

class MiscMessageController {
  // 获取终端页面右侧消息列表（根据用户身份和解锁条件过滤）
  static async getTerminalMessages(req, res) {
    try {
      const { playerId } = req.query;
      
      if (!playerId) {
        return res.status(400).json({
          success: false,
          message: '缺少 playerId 参数'
        });
      }
      
      // 【安全】从数据库查询用户的真实身份，不信任前端传参
      const userRecord = await StartChoiceRecord.findOne({ playerId });
      const userIdentity = userRecord?.finalResult; // 'day' | 'night' | 'incomplete' | null
      
      // 构建查询条件：只获取激活的消息
      const query = { isActive: true };
      
      // 【安全】根据用户身份过滤可见的消息
      if (userIdentity === 'day') {
        // 昼用户：可以看到 'all' 和 'day' 的消息
        query.visibility = { $in: ['all', 'day'] };
      } else if (userIdentity === 'night') {
        // 夜用户：可以看到 'all' 和 'night' 的消息
        query.visibility = { $in: ['all', 'night'] };
      } else {
        // 未确定身份：只能看到 'all' 的消息
        query.visibility = 'all';
      }
      
      // 获取所有符合条件的消息
      const allMessages = await MiscMessage.find(query)
        .select('date sender messageType direction content unlockConditions displayOrder isRead visibility')
        .sort({ displayOrder: 1, date: -1 });
      
      // 获取玩家的存档数据
      const playerSave = await GameSave.findOne({ playerId });
      
      // 获取已完成的剧本列表
      let completedScripts = [];
      if (playerSave && playerSave.completedScripts) {
        completedScripts = playerSave.completedScripts;
      }
      const completedSet = new Set(completedScripts);
      
      // 过滤消息：只显示已解锁的消息
      const unlockedMessages = allMessages.filter(message => {
        const unlockConditions = message.unlockConditions || [];
        
        // 如果没有解锁条件，直接显示
        if (unlockConditions.length === 0) {
          return true;
        }
        
        // 如果有解锁条件，检查是否所有条件都满足
        return unlockConditions.every(scriptId => completedSet.has(scriptId));
      });
      
      // 格式化日期显示
      const formattedMessages = unlockedMessages.map(message => {
        const messageDate = new Date(message.date);
        const now = new Date();
        const diffMs = now - messageDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        let dateDisplay;
        if (diffMins < 1) {
          dateDisplay = '刚刚';
        } else if (diffMins < 60) {
          dateDisplay = `${diffMins}分钟前`;
        } else if (diffHours < 24) {
          dateDisplay = `${diffHours}小时前`;
        } else if (diffDays === 1) {
          dateDisplay = 'YESTERDAY';
        } else if (diffDays < 7) {
          dateDisplay = `${diffDays}天前`;
        } else {
          // 显示具体时间
          const hours = String(messageDate.getHours()).padStart(2, '0');
          const mins = String(messageDate.getMinutes()).padStart(2, '0');
          dateDisplay = `${hours}:${mins}`;
        }
        
        return {
          id: message._id.toString(),
          date: messageDate.toISOString(),
          dateDisplay: dateDisplay,
          sender: message.sender,
          messageType: message.messageType,
          direction: message.direction,
          content: message.content,
          unlockConditions: message.unlockConditions || [],
          isRead: message.isRead || false,
          visibility: message.visibility || 'all'
        };
      });
      
      res.json({
        success: true,
        data: formattedMessages,
        meta: {
          userIdentity: userIdentity || 'unknown',
          totalMessages: formattedMessages.length,
          unreadCount: formattedMessages.filter(m => !m.isRead).length
        }
      });
    } catch (error) {
      console.error('获取终端消息失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 获取所有消息（管理员用）
  static async getAllMessages(req, res) {
    try {
      const { page = 1, limit = 50, activeOnly = false } = req.query;
      
      const query = activeOnly === 'true' ? { isActive: true } : {};
      
      const messages = await MiscMessage.find(query)
        .select('-__v')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ displayOrder: 1, date: -1 });
      
      const count = await MiscMessage.countDocuments(query);
      
      res.json({
        success: true,
        data: messages,
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

  // 创建新消息
  static async createMessage(req, res) {
    try {
      const messageData = req.body;
      
      const message = new MiscMessage(messageData);
      await message.save();
      
      res.status(201).json({
        success: true,
        message: '消息创建成功',
        data: message
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 更新消息
  static async updateMessage(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // 更新 metadata.updatedAt
      if (!updates.metadata) {
        updates.metadata = {};
      }
      updates.metadata.updatedAt = new Date();
      
      const message = await MiscMessage.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: '消息不存在'
        });
      }
      
      res.json({
        success: true,
        message: '消息更新成功',
        data: message
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 删除消息
  static async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      const message = await MiscMessage.findByIdAndDelete(id);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: '消息不存在'
        });
      }
      
      res.json({
        success: true,
        message: '消息删除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 标记消息为已读
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      
      const message = await MiscMessage.findByIdAndUpdate(
        id,
        { isRead: true, 'metadata.updatedAt': new Date() },
        { new: true }
      );
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: '消息不存在'
        });
      }
      
      res.json({
        success: true,
        message: '消息已标记为已读',
        data: message
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 批量创建消息
  static async batchCreateMessages(req, res) {
    try {
      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          success: false,
          message: '缺少消息数据或数据格式不正确'
        });
      }
      
      const createdMessages = await MiscMessage.insertMany(messages);
      
      res.status(201).json({
        success: true,
        message: `成功创建 ${createdMessages.length} 条消息`,
        data: createdMessages
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = MiscMessageController;


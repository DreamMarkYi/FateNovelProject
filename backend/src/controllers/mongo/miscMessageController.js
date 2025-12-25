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
        .select('date sender messageType direction topic content unlockConditions unlockTopics displayOrder isRead visibility chapterRange')
        .sort({ displayOrder: 1, date: -1 });
      
      // 获取玩家的存档数据
      const playerSave = await GameSave.findOne({ playerId });
      
      // 获取已完成的剧本列表
      let completedScripts = [];
      if (playerSave && playerSave.completedScripts) {
        completedScripts = playerSave.completedScripts;
      }
      const completedSet = new Set(completedScripts);
      
      // 获取玩家的消息接收状态
      const messageReceiveStatus = new Map();
      if (playerSave && playerSave.messageReceiveStatus) {
        playerSave.messageReceiveStatus.forEach((value, key) => {
          messageReceiveStatus.set(key, value);
        });
      }
      
      // 计算当前完成的章节数
      const completedChapterCount = completedScripts.length;
      
      // 综合解锁条件过滤消息
      // 需要同时满足：
      // 1. unlockConditions：完成指定的章节（如果存在）
      // 2. unlockTopics：操作过（接收或拒绝）指定的消息（如果存在）
      // 3. chapterRange：当前完成的章节数在指定范围内（如果存在）
      // 如果多个条件都存在，必须都满足；如果只有一个条件，只需满足那一个；如果都没有，直接显示
      const fullyUnlockedMessages = allMessages.filter(message => {
        const unlockConditions = message.unlockConditions || [];
        const unlockTopics = message.unlockTopics || [];
        const chapterRange = message.chapterRange || {};
        
        // 检查章节范围条件
        let rangeMet = true;
        if (chapterRange.startChapter !== null && chapterRange.startChapter !== undefined) {
          // 如果设置了开始章节，当前完成的章节数必须 >= startChapter
          if (completedChapterCount < chapterRange.startChapter) {
            return false; // 不在范围内，不显示
          }
        }
        if (chapterRange.endChapter !== null && chapterRange.endChapter !== undefined) {
          // 如果设置了结束章节，当前完成的章节数必须 <= endChapter
          if (completedChapterCount > chapterRange.endChapter) {
            return false; // 不在范围内，不显示
          }
        }
        
        // 如果章节范围条件不满足，直接返回 false
        if (!rangeMet) {
          return false;
        }
        
        // 如果所有条件都不存在，直接显示
        if (unlockConditions.length === 0 && unlockTopics.length === 0 && 
            (chapterRange.startChapter === null || chapterRange.startChapter === undefined) &&
            (chapterRange.endChapter === null || chapterRange.endChapter === undefined)) {
          return true;
        }
        
        // 检查章节解锁条件
        let conditionsMet = true;
        if (unlockConditions.length > 0) {
          conditionsMet = unlockConditions.every(scriptId => completedSet.has(scriptId));
        }
        
        // 检查消息链解锁条件（根据 requiredAction 判断操作类型）
        let topicsMet = true;
        if (unlockTopics.length > 0) {
          topicsMet = unlockTopics.every(unlockTopic => {
            // 支持两种格式：字符串（向后兼容）或对象（新格式）
            let topic, requiredAction;
            
            if (typeof unlockTopic === 'string') {
              // 旧格式：字符串，只要操作过就算满足
              topic = unlockTopic;
              requiredAction = 'any';
            } else if (typeof unlockTopic === 'object' && unlockTopic !== null) {
              // 新格式：对象，需要检查操作类型
              topic = unlockTopic.topic;
              requiredAction = unlockTopic.requiredAction || 'any';
            } else {
              // 无效格式，不满足条件
              console.warn('无效的 unlockTopic 格式:', unlockTopic);
              return false;
            }
            
            // 检查消息是否被操作过
            if (!messageReceiveStatus.has(topic)) {
              return false; // 消息未被操作，不满足条件
            }
            
            // 如果 requiredAction 是 'any'，只要操作过就算满足
            if (requiredAction === 'any') {
              return true;
            }
            
            // 检查操作类型是否匹配
            const actualStatus = messageReceiveStatus.get(topic);
            if (requiredAction === 'receive') {
              // 必须接收（true）
              return actualStatus === true;
            } else if (requiredAction === 'reject') {
              // 必须拒绝（false）
              return actualStatus === false;
            }
            
            // 未知的 requiredAction 值，不满足条件
            console.warn('未知的 requiredAction 值:', requiredAction);
            return false;
          });
        }
        
        // 必须同时满足章节条件、消息链条件和章节范围条件（如果存在的话）
        // 注意：章节范围条件已经在上面检查过了，如果不在范围内已经返回 false
        return conditionsMet && topicsMet;
      });
      
      // 根据接收状态过滤消息
      // 如果用户已经对消息进行了操作（接收或不接收），消息就不再显示
      // 只有未操作的消息才显示
      const filteredMessages = fullyUnlockedMessages.filter(message => {
        const topic = message.topic;
        // 如果 messageReceiveStatus Map 中没有这个 topic，说明用户还未操作，显示消息
        // 如果 Map 中有这个 topic（无论值是 true 还是 false），说明用户已操作，不显示消息
        return !messageReceiveStatus.has(topic);
      });
      
      // 格式化日期显示
      const formattedMessages = filteredMessages.map(message => {
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
        
        const messageId = message._id.toString();
        const topic = message.topic;
        // 由于已操作的消息已被过滤，这里的 receiveStatus 应该总是 undefined
        // 但为了兼容性，仍然检查并设置
        const receiveStatus = messageReceiveStatus.get(topic);
        
        return {
          id: messageId,
          date: messageDate.toISOString(),
          dateDisplay: dateDisplay,
          sender: message.sender,
          messageType: message.messageType,
          direction: message.direction,
          topic: topic,
          content: message.content,
          unlockConditions: message.unlockConditions || [],
          unlockTopics: message.unlockTopics || [],
          chapterRange: message.chapterRange || null,
          isRead: message.isRead || false,
          visibility: message.visibility || 'all',
          receiveStatus: receiveStatus !== false // 未操作的消息默认显示为接收状态
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



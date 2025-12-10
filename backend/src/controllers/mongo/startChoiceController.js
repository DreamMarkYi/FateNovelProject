const StartChoiceRecord = require('../../schemas/startChoiceRecordSchema');
const GameSave = require('../../schemas/gameSaveSchema');
const { v4: uuidv4 } = require('uuid');
const { generateToken } = require('../../utils/jwt');

// 获取客户端IP地址
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         req.ip ||
         'unknown';
};

class StartChoiceController {
  // 检查是否首次访问
  static async checkFirstTimeVisitor(req, res) {
    try {
      const ipAddress = getClientIP(req);
      const { playerId } = req.query;
      
      console.log('检查首次访问:', { ipAddress, playerId });
      
      let shouldShowStartPage = true;
      let existingUser = null;
      
      // 如果提供了playerId，优先检查该用户
      if (playerId) {
        existingUser = await StartChoiceRecord.findOne({ playerId });
        
        if (existingUser && existingUser.hasSeenStartPage) {
          // 用户已经完成StartPage，不需要再显示
          shouldShowStartPage = false;
          console.log('✅ 用户已完成StartPage:', {
            playerId,
            playerName: existingUser.playerName,
            hasSeenStartPage: existingUser.hasSeenStartPage
          });
        } else {
          console.log('📝 用户未完成StartPage，需要显示');
        }
      } else {
        // 没有playerId，通过IP检查
        const isFirstTimeByIP = await StartChoiceRecord.isFirstTimeVisitor(ipAddress);
        shouldShowStartPage = isFirstTimeByIP;
        console.log(`🔍 IP首次访问检查: ${isFirstTimeByIP ? '是' : '否'}`);
      }
      
      res.json({
        success: true,
        data: {
          shouldShowStartPage,
          isFirstTime: shouldShowStartPage,
          ipAddress,
          existingUser: existingUser ? {
            playerId: existingUser.playerId,
            playerName: existingUser.playerName,
            hasCustomName: existingUser.hasCustomName,
            hasSeenStartPage: existingUser.hasSeenStartPage
          } : null
        }
      });
    } catch (error) {
      console.error('Check first time visitor error:', error);
      res.status(500).json({
        success: false,
        message: '检查首次访问失败',
        error: error.message
      });
    }
  }
  
  // 初始化访客会话
  static async initVisitorSession(req, res) {
    try {
      const { playerId } = req.body;
      const ipAddress = getClientIP(req);
      const userAgent = req.headers['user-agent'] || 'Unknown';
      
      const finalPlayerId = playerId || uuidv4();
      
      const record = await StartChoiceRecord.initVisitorSession(
        finalPlayerId,
        ipAddress,
        userAgent
      );
      
      // 生成 JWT Token
      const token = generateToken({
        playerId: record.playerId,
        playerName: record.playerName,
        hasCustomName: record.hasCustomName,
        type: 'visitor'
      });
      
      res.json({
        success: true,
        data: {
          playerId: record.playerId,
          playerName: record.playerName,
          hasCustomName: record.hasCustomName,
          hasSeenStartPage: record.hasSeenStartPage,
          recordId: record._id.toString(),
          token  // 返回 JWT Token
        }
      });
    } catch (error) {
      console.error('Init visitor session error:', error);
      res.status(500).json({
        success: false,
        message: '初始化访客会话失败',
        error: error.message
      });
    }
  }
  
  // 统一的完成StartPage方法（两种行为使用同一个API）
  static async completeStartPage(req, res) {
    try {
      const { playerId, playerName, identityChoice } = req.body;
      const ipAddress = getClientIP(req);
      const userAgent = req.headers['user-agent'] || 'Unknown';
      
      if (!playerId) {
        return res.status(400).json({
          success: false,
          message: 'playerId 是必需的'
        });
      }
      
      console.log('完成StartPage:', { playerId, playerName, identityChoice });
      
      // 查找现有记录
      let record = await StartChoiceRecord.findOne({ playerId });
      
      if (!record) {
        // 如果没有记录，创建新的
        record = await StartChoiceRecord.create({
          playerId,
          playerName: playerName || `访客_${playerId.slice(0, 8)}`,
          hasCustomName: !!playerName,
          identityChoice: playerName ? 'named' : 'skipped',
          hasSeenStartPage: true,
          startPageCompletedAt: new Date(),
          finalResult: 'incomplete',
          ipAddress,
          userAgent
        });
      } else {
        // 更新现有记录
        record.playerName = playerName || record.playerName;
        record.hasCustomName = !!playerName;
        record.identityChoice = playerName ? 'named' : 'skipped';
        record.hasSeenStartPage = true;
        record.startPageCompletedAt = new Date();
        await record.save();
      }
      
      // 生成 JWT Token
      const token = generateToken({
        playerId: record.playerId,
        playerName: record.playerName,
        hasCustomName: record.hasCustomName,
        type: record.identityChoice
      });
      
      res.json({
        success: true,
        message: '已完成StartPage',
        data: {
          playerId: record.playerId,
          playerName: record.playerName,
          hasCustomName: record.hasCustomName,
          identityChoice: record.identityChoice,
          recordId: record._id.toString(),
          token  // 返回 JWT Token
        }
      });
    } catch (error) {
      console.error('Complete start page error:', error);
      res.status(500).json({
        success: false,
        message: '完成StartPage失败',
        error: error.message
      });
    }
  }
  
  // 旧的创建玩家方法（保留兼容性）
  static async createPlayer(req, res) {
    try {
      const { playerName, identityChoice, playerId } = req.body;
      const ipAddress = getClientIP(req);
      const userAgent = req.headers['user-agent'] || 'Unknown';
      
      if (!playerName) {
        return res.status(400).json({
          success: false,
          message: '缺少玩家名字'
        });
      }
      
      // 生成唯一的玩家ID（如果没有提供）
      const finalPlayerId = playerId || uuidv4();
      
      // 查找现有记录
      let record = await StartChoiceRecord.findOne({ playerId: finalPlayerId });
      
      if (record) {
        // 更新现有记录
        record.playerName = playerName;
        record.hasCustomName = true;
        record.identityChoice = identityChoice || 'named';
        record.hasSeenStartPage = true;
        record.startPageCompletedAt = new Date();
        record.finalResult = 'incomplete';
        await record.save();
      } else {
        // 创建新记录
        record = await StartChoiceRecord.create({
          playerId: finalPlayerId,
          playerName,
          hasCustomName: true,
          identityChoice: identityChoice || 'named',
          hasSeenStartPage: true,
          startPageCompletedAt: new Date(),
          finalResult: 'incomplete',
          ipAddress,
          userAgent
        });
      }
      
      res.json({
        success: true,
        message: '玩家创建成功',
        data: {
          playerId: record.playerId,
          playerName: record.playerName,
          recordId: record._id.toString()
        }
      });
    } catch (error) {
      console.error('Create player error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // 记录用户选择
  static async recordChoice(req, res) {
    try {
      const { playerId } = req.params;
      const { sceneId, choiceText, score } = req.body;
      
      if (!sceneId || !choiceText || score === undefined) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }
      
      const record = await StartChoiceRecord.findOne({ playerId });
      
      if (!record) {
        return res.status(404).json({
          success: false,
          message: '玩家记录不存在'
        });
      }
      
      // 添加选择
      record.addChoice(sceneId, choiceText, score);
      await record.save();
      
      res.json({
        success: true,
        message: '选择记录成功',
        data: {
          currentScore: record.finalScore,
          choiceCount: record.choices.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // 完成游戏，设置最终结果
  static async completeGame(req, res) {
    try {
      const { playerId } = req.params;
      const { endingId, playTime } = req.body;
      
      if (endingId === undefined) {
        return res.status(400).json({
          success: false,
          message: '缺少结局ID'
        });
      }
      
      const record = await StartChoiceRecord.findOne({ playerId });
      
      if (!record) {
        return res.status(404).json({
          success: false,
          message: '玩家记录不存在'
        });
      }
      
      // 设置最终结果
      record.setFinalResult(endingId);
      
      if (playTime) {
        record.playTime = playTime;
      }
      
      // 获取IP和User Agent
      if (req.ip) {
        record.ipAddress = req.ip;
      }
      if (req.headers['user-agent']) {
        record.userAgent = req.headers['user-agent'];
      }
      
      await record.save();
      
      res.json({
        success: true,
        message: '游戏完成',
        data: {
          finalScore: record.finalScore,
          finalResult: record.finalResult,
          endingId: record.endingId,
          playTime: record.playTime
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // 获取玩家记录
  static async getPlayerRecord(req, res) {
    try {
      const { playerId } = req.params;
      
      const record = await StartChoiceRecord.findOne({ playerId })
        .select('-__v');
      
      if (!record) {
        return res.status(404).json({
          success: false,
          message: '玩家记录不存在'
        });
      }
      
      res.json({
        success: true,
        data: record
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // 获取所有记录（用于管理）
  static async getAllRecords(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        finalResult,
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;
      
      const query = {};
      if (finalResult) {
        query.finalResult = finalResult;
      }
      
      const sort = {};
      sort[sortBy] = order === 'desc' ? -1 : 1;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const records = await StartChoiceRecord.find(query)
        .select('-__v')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await StartChoiceRecord.countDocuments(query);
      
      res.json({
        success: true,
        data: records,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // 获取统计数据
  static async getStatistics(req, res) {
    try {
      const stats = await StartChoiceRecord.getStatistics();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // 获取特定场景的选择统计
  static async getChoiceStatistics(req, res) {
    try {
      const { sceneId } = req.params;
      
      const popularChoices = await StartChoiceRecord.getPopularChoices(parseInt(sceneId));
      
      res.json({
        success: true,
        data: {
          sceneId: parseInt(sceneId),
          choices: popularChoices
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // 删除记录（仅用于测试）
  static async deleteRecord(req, res) {
    try {
      const { playerId } = req.params;
      
      const record = await StartChoiceRecord.findOneAndDelete({ playerId });
      
      if (!record) {
        return res.status(404).json({
          success: false,
          message: '记录不存在'
        });
      }
      
      // 同时删除关联的game_save
      await GameSave.deleteMany({ playerId });
      
      res.json({
        success: true,
        message: '记录删除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = StartChoiceController;


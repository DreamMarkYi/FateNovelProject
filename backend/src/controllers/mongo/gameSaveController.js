const GameSave = require('../../schemas/gameSaveSchema');
const NovelScript = require('../../schemas/novelScriptSchema');

class GameSaveController {
  // 获取玩家的所有存档
  static async getPlayerSaves(req, res) {
    try {
      const { playerId } = req.params;
      const { includeAuto = true, includeQuick = true } = req.query;
      
      // 查找用户存档记录
      const playerSaves = await GameSave.findOne({ playerId }).select('-__v');
      
      if (!playerSaves || playerSaves.saves.size === 0) {
        return res.json({
          success: true,
          data: [],
          count: 0
        });
      }
      
      // 获取所有存档并转换为数组
      let saves = playerSaves.getAllSaves();
      
      // 过滤自动存档和快速存档
      if (includeAuto === 'false') {
        saves = saves.filter(save => !save.isAutoSave);
      }
      if (includeQuick === 'false') {
        saves = saves.filter(save => !save.isQuickSave);
      }
      
      res.json({
        success: true,
        data: saves,
        count: saves.length,
        metadata: playerSaves.metadata
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 获取特定存档
  static async getSaveBySlot(req, res) {
    try {
      const { playerId, saveSlot } = req.params;
      const slot = parseInt(saveSlot);
      
      const playerSaves = await GameSave.findOne({ playerId }).select('-__v');
      
      if (!playerSaves) {
        return res.status(404).json({
          success: false,
          message: '用户存档记录不存在'
        });
      }
      
      const save = playerSaves.getSave(slot);
      
      if (!save) {
        return res.status(404).json({
          success: false,
          message: `存档槽位 ${saveSlot} 不存在`
        });
      }
      
      res.json({
        success: true,
        data: {
          saveSlot: slot,
          ...save.toObject()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 获取最新的自动存档
  static async getLatestAutoSave(req, res) {
    try {
      const { playerId } = req.params;
      
      const playerSaves = await GameSave.findOne({ playerId }).select('-__v');
      
      if (!playerSaves) {
        return res.status(404).json({
          success: false,
          message: '用户存档记录不存在'
        });
      }
      
      const save = playerSaves.getAutoSave();
      
      if (!save || !save.isValid) {
        return res.status(404).json({
          success: false,
          message: '没有找到自动存档'
        });
      }
      
      res.json({
        success: true,
        data: {
          saveSlot: 98,
          ...save.toObject()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 获取快速存档
  static async getQuickSave(req, res) {
    try {
      const { playerId } = req.params;
      
      const playerSaves = await GameSave.findOne({ playerId }).select('-__v');
      
      if (!playerSaves) {
        return res.status(404).json({
          success: false,
          message: '用户存档记录不存在'
        });
      }
      
      const save = playerSaves.getQuickSave();
      
      if (!save || !save.isValid) {
        return res.status(404).json({
          success: false,
          message: '没有找到快速存档'
        });
      }
      
      res.json({
        success: true,
        data: {
          saveSlot: 99,
          ...save.toObject()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 创建或更新存档
  static async saveGame(req, res) {
    try {
      const { playerId, saveSlot } = req.params;
      const slot = parseInt(saveSlot);
      const saveData = req.body;
      
      // 验证剧本是否存在
      const script = await NovelScript.findOne({ 
        scriptId: saveData.scriptId,
        isActive: true 
      });
      
      if (!script) {
        return res.status(400).json({
          success: false,
          message: '剧本不存在或未激活'
        });
      }
      
      // 验证场景索引是否有效
      const scene = script.getSceneByIndex(saveData.currentSceneIndex);
      if (!scene) {
        return res.status(400).json({
          success: false,
          message: '场景索引无效'
        });
      }
      
      // 创建场景快照
      const sceneSnapshot = {
        speaker: scene.speaker || '',
        text: scene.text || scene.title || '',
        bgImage: scene.bgImage || '',
        timestamp: new Date()
      };
      
      // 使用前端传来的进度百分比
      const progressPercentage = saveData.progressPercentage !== undefined 
        ? Math.min(100, Math.max(0, saveData.progressPercentage))
        : 0;
      
      // 查找或创建用户存档记录
      let playerSaves = await GameSave.findOrCreatePlayer(playerId);
      
      // 获取或创建存档槽位数据
      const existingSave = playerSaves.getSave(slot);
      const isNewSave = !existingSave;
      
      // 准备存档数据
      const newSaveData = {
        saveName: saveData.saveName || (existingSave?.saveName) || `存档 ${slot}`,
        description: saveData.description || existingSave?.description || '',
        scriptId: saveData.scriptId,
        scriptName: saveData.scriptName || script.scriptName,
        currentSceneIndex: saveData.currentSceneIndex,
        screenshot: saveData.screenshot || existingSave?.screenshot,
        sceneSnapshot,
        progressPercentage,
        gameVariables: saveData.gameVariables || existingSave?.gameVariables || new Map(),
        choiceHistory: saveData.choiceHistory || existingSave?.choiceHistory || [],
        readScenes: existingSave?.readScenes || [],
        unlockedContent: existingSave?.unlockedContent || { cg: [], achievements: [], endings: [] },
        playTime: saveData.playTime || existingSave?.playTime || 0,
        isAutoSave: false,
        isQuickSave: false,
        isValid: true,
        savedAt: new Date()
      };
      
      // 标记场景为已读
      if (!newSaveData.readScenes.includes(saveData.currentSceneIndex)) {
        newSaveData.readScenes.push(saveData.currentSceneIndex);
      }
      
      // 设置存档到槽位
      playerSaves.setSave(slot, newSaveData);
      
      // 标记为全局已读
      playerSaves.markSceneAsGlobalRead(saveData.currentSceneIndex);
      
      await playerSaves.save();
      
      res.json({
        success: true,
        message: isNewSave ? '存档创建成功' : '存档更新成功',
        data: {
          saveSlot: slot,
          ...newSaveData
        }
      });
    } catch (error) {
      console.error('Save game error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 快速存档（覆盖快速存档槽位）
  static async quickSave(req, res) {
    try {
      const { playerId } = req.params;
      const saveData = req.body;
      const slot = 99; // 快速存档固定槽位
      
      // 验证剧本和场景
      const script = await NovelScript.findOne({ 
        scriptId: saveData.scriptId,
        isActive: true 
      });
      
      if (!script) {
        return res.status(400).json({
          success: false,
          message: '剧本不存在或未激活'
        });
      }
      
      const scene = script.getSceneByIndex(saveData.currentSceneIndex);
      if (!scene) {
        return res.status(400).json({
          success: false,
          message: '场景索引无效'
        });
      }
      
      // 创建场景快照
      const sceneSnapshot = {
        speaker: scene.speaker || '',
        text: scene.text || scene.title || '',
        bgImage: scene.bgImage || '',
        timestamp: new Date()
      };
      
      // 使用前端传来的进度百分比
      const progressPercentage = saveData.progressPercentage !== undefined 
        ? Math.min(100, Math.max(0, saveData.progressPercentage))
        : 0;
      
      // 查找或创建用户存档记录
      let playerSaves = await GameSave.findOrCreatePlayer(playerId);
      
      // 获取现有快速存档
      const existingSave = playerSaves.getQuickSave();
      
      // 准备快速存档数据
      const quickSaveData = {
        saveName: '快速存档',
        description: '快速存档槽位',
        scriptId: saveData.scriptId,
        scriptName: saveData.scriptName || script.scriptName,
        currentSceneIndex: saveData.currentSceneIndex,
        screenshot: saveData.screenshot,
        sceneSnapshot,
        progressPercentage,
        gameVariables: saveData.gameVariables || new Map(),
        choiceHistory: saveData.choiceHistory || [],
        readScenes: existingSave?.readScenes || [],
        unlockedContent: existingSave?.unlockedContent || { cg: [], achievements: [], endings: [] },
        playTime: saveData.playTime || existingSave?.playTime || 0,
        isAutoSave: false,
        isQuickSave: true,
        isValid: true,
        savedAt: new Date()
      };
      
      // 标记场景为已读
      if (!quickSaveData.readScenes.includes(saveData.currentSceneIndex)) {
        quickSaveData.readScenes.push(saveData.currentSceneIndex);
      }
      
      // 设置快速存档
      playerSaves.setSave(slot, quickSaveData);
      playerSaves.markSceneAsGlobalRead(saveData.currentSceneIndex);
      
      await playerSaves.save();
      
      res.json({
        success: true,
        message: '快速存档成功',
        data: {
          saveSlot: slot,
          ...quickSaveData
        }
      });
    } catch (error) {
      console.error('Quick save error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 自动存档
  static async autoSave(req, res) {
    try {
      const { playerId } = req.params;
      const saveData = req.body;
      const slot = 98; // 自动存档固定槽位
      
      // 验证剧本和场景
      const script = await NovelScript.findOne({ 
        scriptId: saveData.scriptId,
        isActive: true 
      });
      
      if (!script) {
        return res.status(400).json({
          success: false,
          message: '剧本不存在或未激活'
        });
      }
      
      const scene = script.getSceneByIndex(saveData.currentSceneIndex);
      if (!scene) {
        return res.status(400).json({
          success: false,
          message: '场景索引无效'
        });
      }
      
      // 创建场景快照
      const sceneSnapshot = {
        speaker: scene.speaker || '',
        text: scene.text || scene.title || '',
        bgImage: scene.bgImage || '',
        timestamp: new Date()
      };
      
      // 使用前端传来的进度百分比
      const progressPercentage = saveData.progressPercentage !== undefined 
        ? Math.min(100, Math.max(0, saveData.progressPercentage))
        : 0;
      
      // 查找或创建用户存档记录
      let playerSaves = await GameSave.findOrCreatePlayer(playerId);
      
      // 获取现有自动存档
      const existingSave = playerSaves.getAutoSave();
      
      // 准备自动存档数据
      const autoSaveData = {
        saveName: '自动存档',
        description: '系统自动存档',
        scriptId: saveData.scriptId,
        scriptName: saveData.scriptName || script.scriptName,
        currentSceneIndex: saveData.currentSceneIndex,
        screenshot: saveData.screenshot,
        sceneSnapshot,
        progressPercentage,
        gameVariables: saveData.gameVariables || new Map(),
        choiceHistory: saveData.choiceHistory || [],
        readScenes: existingSave?.readScenes || [],
        unlockedContent: existingSave?.unlockedContent || { cg: [], achievements: [], endings: [] },
        playTime: saveData.playTime || existingSave?.playTime || 0,
        isAutoSave: true,
        isQuickSave: false,
        isValid: true,
        savedAt: new Date()
      };
      
      // 标记场景为已读
      if (!autoSaveData.readScenes.includes(saveData.currentSceneIndex)) {
        autoSaveData.readScenes.push(saveData.currentSceneIndex);
      }
      
      // 设置自动存档
      playerSaves.setSave(slot, autoSaveData);
      playerSaves.markSceneAsGlobalRead(saveData.currentSceneIndex);
      
      await playerSaves.save();
      
      res.json({
        success: true,
        message: '自动存档成功',
        data: {
          saveSlot: slot,
          ...autoSaveData
        }
      });
    } catch (error) {
      console.error('Auto save error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 删除存档
  static async deleteSave(req, res) {
    try {
      const { playerId, saveSlot } = req.params;
      const slot = parseInt(saveSlot);
      
      const playerSaves = await GameSave.findOne({ playerId });
      
      if (!playerSaves) {
        return res.status(404).json({
          success: false,
          message: '用户存档记录不存在'
        });
      }
      
      const saveExists = playerSaves.getSave(slot);
      
      if (!saveExists) {
        return res.status(404).json({
          success: false,
          message: '存档不存在'
        });
      }
      
      // 删除指定槽位的存档
      playerSaves.deleteSave(slot);
      await playerSaves.save();
      
      res.json({
        success: true,
        message: '存档删除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 检查场景是否已读
  static async checkSceneRead(req, res) {
    try {
      const { playerId, scriptId, sceneIndex } = req.params;
      const index = parseInt(sceneIndex);
      
      const playerSaves = await GameSave.findOne({ playerId });
      
      if (!playerSaves) {
        return res.json({
          success: true,
          data: { isRead: false, isGlobalRead: false }
        });
      }
      
      // 检查全局已读
      const isGlobalRead = playerSaves.isSceneGlobalRead(index);
      
      // 检查特定剧本的存档中是否已读
      let isRead = false;
      const allSaves = playerSaves.getAllSaves();
      
      for (const save of allSaves) {
        if (save.scriptId === scriptId && save.readScenes.includes(index)) {
          isRead = true;
          break;
        }
      }
      
      res.json({
        success: true,
        data: { 
          isRead,
          isGlobalRead 
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 更新游戏时长
  static async updatePlayTime(req, res) {
    try {
      const { playerId, saveSlot } = req.params;
      const slot = parseInt(saveSlot);
      const { additionalTime } = req.body;
      
      const playerSaves = await GameSave.findOne({ playerId });
      
      if (!playerSaves) {
        return res.status(404).json({
          success: false,
          message: '用户存档记录不存在'
        });
      }
      
      const save = playerSaves.getSave(slot);
      
      if (!save) {
        return res.status(404).json({
          success: false,
          message: '存档不存在'
        });
      }
      
      // 更新游戏时长
      save.playTime += parseInt(additionalTime) || 0;
      playerSaves.setSave(slot, save);
      
      await playerSaves.save();
      
      res.json({
        success: true,
        message: '游戏时长更新成功',
        data: { playTime: save.playTime }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = GameSaveController;

const NovelScript = require('../../schemas/novelScriptSchema');
const GameSave = require('../../schemas/gameSaveSchema');

class NovelScriptController {
  // 标记剧本完成并更新解锁状态
  static async markScriptCompleted(req, res) {
    try {
      const { playerId, scriptId } = req.body;
      
      if (!playerId || !scriptId) {
        return res.status(400).json({
          success: false,
          message: '缺少 playerId 或 scriptId 参数'
        });
      }
      
      // 验证剧本是否存在
      const script = await NovelScript.findOne({ scriptId, isActive: true });
      if (!script) {
        return res.status(404).json({
          success: false,
          message: '剧本不存在或未激活'
        });
      }
      
      // 查找或创建玩家存档记录
      let playerSave = await GameSave.findOrCreatePlayer(playerId);
      
      // 标记剧本完成
      const isNewCompletion = playerSave.markScriptCompleted(scriptId);
      
      // 如果是新完成的，计算解锁状态
      let newlyUnlocked = [];
      if (isNewCompletion) {
        // 获取所有激活的剧本
        const allScripts = await NovelScript.find({ isActive: true })
          .select('scriptId unlockConditions')
          .lean();
        
        // 更新解锁列表
        newlyUnlocked = await playerSave.updateUnlockedScripts(allScripts);
      }
      
      // 保存到数据库
      await playerSave.save();
      
      res.json({
        success: true,
        message: isNewCompletion ? '剧本完成状态已更新' : '该剧本已完成过',
        data: {
          scriptId,
          isNewCompletion,
          completedScripts: playerSave.completedScripts,
          unlockedScripts: playerSave.unlockedScripts,
          newlyUnlocked
        }
      });
    } catch (error) {
      console.error('标记剧本完成失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 检查剧本是否已完成
  static async checkScriptCompletion(req, res) {
    try {
      const { playerId, scriptId } = req.query;
      
      if (!playerId || !scriptId) {
        return res.status(400).json({
          success: false,
          message: '缺少 playerId 或 scriptId 参数'
        });
      }
      
      const playerSave = await GameSave.findOne({ playerId });
      
      const isCompleted = playerSave 
        ? playerSave.isScriptCompleted(scriptId)
        : false;
      
      res.json({
        success: true,
        data: {
          scriptId,
          isCompleted,
          completedScripts: playerSave?.completedScripts || []
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 获取章节选择页面的剧本节点列表（带解锁状态判断）
  static async getChapterNodes(req, res) {
    try {
      const { playerId } = req.query;
      
      if (!playerId) {
        return res.status(400).json({
          success: false,
          message: '缺少 playerId 参数'
        });
      }
      
      // 获取所有激活的剧本，只选择需要的字段
      const scripts = await NovelScript.find({ isActive: true })
        .select('scriptId scriptName summary thumbnailImage unlockConditions connectNode position displayOrder')
        .sort({ displayOrder: 1, createdAt: -1 });
      
      // 获取玩家的存档数据
      const playerSave = await GameSave.findOne({ playerId });
      
      // 直接从缓存字段读取已解锁的剧本列表
      let unlockedScripts = [];
      
      if (playerSave && playerSave.unlockedScripts) {
        unlockedScripts = playerSave.unlockedScripts;
      } else if (playerSave) {
        // 如果缓存不存在，立即计算并缓存
        unlockedScripts = await playerSave.updateUnlockedScripts(
          scripts.map(s => ({
            scriptId: s.scriptId,
            unlockConditions: s.unlockConditions
          }))
        );
        await playerSave.save();
      }
      
      // 转换为 Set 以便快速查找
      const unlockedSet = new Set(unlockedScripts);
      
      // 处理每个剧本，标记解锁状态
      const nodes = scripts.map((script) => {
        const unlockConditions = script.unlockConditions || [];
        
        // 如果 unlockConditions 为空，直接设置为已解锁
        // 如果 unlockConditions 有内容，才进行解锁判断
        let isLocked = false;
        if (unlockConditions.length > 0) {
          // 有解锁条件的节点，需要检查是否在解锁列表中
          isLocked = !unlockedSet.has(script.scriptId);
        }
        // 如果 unlockConditions 为空，isLocked 保持为 false（已解锁）
        
        return {
          scriptId: script.scriptId,
          scriptName: script.scriptName,
          summary: script.summary || '',
          thumbnailImage: script.thumbnailImage || '',
          unlockConditions: unlockConditions,
          connectNode: script.connectNode || [],
          position: script.position || { x: 0, y: 0 },
          locked: isLocked
        };
      });
      
      res.json({
        success: true,
        data: nodes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 获取所有剧本
  static async getAllScripts(req, res) {
    try {
      const { page = 1, limit = 20, activeOnly = false } = req.query;
      
      const query = activeOnly === 'true' ? { isActive: true } : {};
      
      const scripts = await NovelScript.find(query)
        .select('-__v')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ displayOrder: 1, createdAt: -1 });
      
      const count = await NovelScript.countDocuments(query);
      
      res.json({
        success: true,
        data: scripts,
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

  // 根据剧本ID获取完整剧本
  static async getScriptById(req, res) {
    try {
      const { scriptId } = req.params;
      const script = await NovelScript.findOne({ scriptId, isActive: true })
        .select('-__v');
      
      if (!script) {
        return res.status(404).json({
          success: false,
          message: `剧本 "${scriptId}" 不存在或未激活`
        });
      }
      
      res.json({
        success: true,
        data: script
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 获取剧本的特定场景
  static async getSceneByIndex(req, res) {
    try {
      const { scriptId, sceneIndex } = req.params;
      const index = parseInt(sceneIndex);
      
      const script = await NovelScript.findOne({ scriptId, isActive: true });
      
      if (!script) {
        return res.status(404).json({
          success: false,
          message: `剧本 "${scriptId}" 不存在或未激活`
        });
      }
      
      const scene = script.getSceneByIndex(index);
      
      if (!scene) {
        return res.status(404).json({
          success: false,
          message: `场景索引 ${index} 不存在`
        });
      }
      
      res.json({
        success: true,
        data: scene
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 获取剧本的场景范围（用于分段加载）
  static async getSceneRange(req, res) {
    try {
      const { scriptId } = req.params;
      const { start = 0, end } = req.query;
      
      const script = await NovelScript.findOne({ scriptId, isActive: true });
      
      if (!script) {
        return res.status(404).json({
          success: false,
          message: `剧本 "${scriptId}" 不存在或未激活`
        });
      }
      
      const startIndex = parseInt(start);
      const endIndex = end ? parseInt(end) : script.scenes.length - 1;
      
      const scenes = script.scenes.filter(scene => 
        scene.index >= startIndex && scene.index <= endIndex
      );
      
      res.json({
        success: true,
        data: {
          scriptId: script.scriptId,
          scriptName: script.scriptName,
          scenes: scenes,
          range: { start: startIndex, end: endIndex },
          total: script.scenes.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 根据标签搜索场景
  static async getScenesByTag(req, res) {
    try {
      const { scriptId, tag } = req.params;
      
      const script = await NovelScript.findOne({ scriptId, isActive: true });
      
      if (!script) {
        return res.status(404).json({
          success: false,
          message: `剧本 "${scriptId}" 不存在或未激活`
        });
      }
      
      const scenes = script.getScenesByTag(tag);
      
      res.json({
        success: true,
        data: {
          scriptId: script.scriptId,
          tag: tag,
          scenes: scenes,
          count: scenes.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 创建新剧本
  static async createScript(req, res) {
    try {
      const scriptData = req.body;
      
      // 检查scriptId是否已存在
      const existing = await NovelScript.findOne({ scriptId: scriptData.scriptId });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `剧本ID "${scriptData.scriptId}" 已存在`
        });
      }
      
      const script = new NovelScript(scriptData);
      await script.save();
      
      res.status(201).json({
        success: true,
        message: '剧本创建成功',
        data: script
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 更新剧本
  static async updateScript(req, res) {
    try {
      const { scriptId } = req.params;
      const updates = req.body;
      
      // 更新metadata中的lastUpdated
      if (!updates.metadata) {
        updates.metadata = {};
      }
      updates.metadata.lastUpdated = new Date();
      
      const script = await NovelScript.findOneAndUpdate(
        { scriptId },
        updates,
        { new: true, runValidators: true }
      );
      
      if (!script) {
        return res.status(404).json({
          success: false,
          message: '剧本不存在'
        });
      }
      
      res.json({
        success: true,
        message: '剧本更新成功',
        data: script
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 添加场景到剧本
  static async addScene(req, res) {
    try {
      const { scriptId } = req.params;
      const sceneData = req.body;
      
      const script = await NovelScript.findOne({ scriptId });
      
      if (!script) {
        return res.status(404).json({
          success: false,
          message: '剧本不存在'
        });
      }
      
      // 如果没有指定index，使用当前最大index + 1
      if (sceneData.index === undefined) {
        const maxIndex = script.scenes.reduce((max, scene) => 
          Math.max(max, scene.index), -1
        );
        sceneData.index = maxIndex + 1;
      }
      
      script.scenes.push(sceneData);
      await script.save();
      
      res.status(201).json({
        success: true,
        message: '场景添加成功',
        data: script
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 更新特定场景
  static async updateScene(req, res) {
    try {
      const { scriptId, sceneIndex } = req.params;
      const updates = req.body;
      const index = parseInt(sceneIndex);
      
      const script = await NovelScript.findOne({ scriptId });
      
      if (!script) {
        return res.status(404).json({
          success: false,
          message: '剧本不存在'
        });
      }
      
      const sceneIdx = script.scenes.findIndex(scene => scene.index === index);
      
      if (sceneIdx === -1) {
        return res.status(404).json({
          success: false,
          message: `场景索引 ${index} 不存在`
        });
      }
      
      // 更新场景
      script.scenes[sceneIdx] = { ...script.scenes[sceneIdx].toObject(), ...updates };
      await script.save();
      
      res.json({
        success: true,
        message: '场景更新成功',
        data: script.scenes[sceneIdx]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 删除特定场景
  static async deleteScene(req, res) {
    try {
      const { scriptId, sceneIndex } = req.params;
      const index = parseInt(sceneIndex);
      
      const script = await NovelScript.findOne({ scriptId });
      
      if (!script) {
        return res.status(404).json({
          success: false,
          message: '剧本不存在'
        });
      }
      
      const originalLength = script.scenes.length;
      script.scenes = script.scenes.filter(scene => scene.index !== index);
      
      if (script.scenes.length === originalLength) {
        return res.status(404).json({
          success: false,
          message: `场景索引 ${index} 不存在`
        });
      }
      
      await script.save();
      
      res.json({
        success: true,
        message: '场景删除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 删除剧本
  static async deleteScript(req, res) {
    try {
      const { scriptId } = req.params;
      const script = await NovelScript.findOneAndDelete({ scriptId });
      
      if (!script) {
        return res.status(404).json({
          success: false,
          message: '剧本不存在'
        });
      }
      
      res.json({
        success: true,
        message: '剧本删除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 切换剧本激活状态
  static async toggleScriptStatus(req, res) {
    try {
      const { scriptId } = req.params;
      const script = await NovelScript.findOne({ scriptId });
      
      if (!script) {
        return res.status(404).json({
          success: false,
          message: '剧本不存在'
        });
      }
      
      script.isActive = !script.isActive;
      script.metadata.lastUpdated = new Date();
      await script.save();
      
      res.json({
        success: true,
        message: `剧本已${script.isActive ? '激活' : '停用'}`,
        data: { isActive: script.isActive }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 批量更新节点位置
  static async updateNodePositions(req, res) {
    try {
      const { nodes } = req.body;
      
      if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
        return res.status(400).json({
          success: false,
          message: '缺少节点数据或数据格式不正确'
        });
      }
      
      const results = {
        successCount: 0,
        errorCount: 0,
        errors: []
      };
      
      // 批量更新每个节点的位置
      for (const node of nodes) {
        try {
          const { id, worldPosition, name, locked, connectNode } = node;
          
          if (!id) {
            results.errorCount++;
            results.errors.push({
              id: 'unknown',
              message: '节点缺少ID'
            });
            continue;
          }
          
          // 准备更新数据
          const updateData = {};
          
          if (worldPosition && typeof worldPosition.x === 'number' && typeof worldPosition.y === 'number') {
            updateData.position = {
              x: worldPosition.x,
              y: worldPosition.y
            };
          }
          
          if (name !== undefined) {
            updateData.scriptName = name;
          }
          
          if (locked !== undefined) {
            updateData.locked = locked;
          }
          
          if (connectNode !== undefined && Array.isArray(connectNode)) {
            updateData.connectNode = connectNode;
          }
          
          // 更新数据库
          const result = await NovelScript.findOneAndUpdate(
            { scriptId: id },
            { $set: updateData },
            { new: true, runValidators: true }
          );
          
          if (result) {
            results.successCount++;
          } else {
            results.errorCount++;
            results.errors.push({
              id,
              message: `未找到剧本ID: ${id}`
            });
          }
        } catch (error) {
          results.errorCount++;
          results.errors.push({
            id: node.id || 'unknown',
            message: error.message
          });
        }
      }
      
      res.json({
        success: true,
        message: `成功更新 ${results.successCount} 个节点${results.errorCount > 0 ? `，${results.errorCount} 个失败` : ''}`,
        data: results
      });
    } catch (error) {
      console.error('批量更新节点位置失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = NovelScriptController;

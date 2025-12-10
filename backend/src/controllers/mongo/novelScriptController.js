const NovelScript = require('../../schemas/novelScriptSchema');

class NovelScriptController {
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
}

module.exports = NovelScriptController;

const StartPageScript = require('../../schemas/startPageScriptSchema');

class StartPageScriptController {
  // 获取激活的剧本
  static async getActiveScript(req, res) {
    try {
      const script = await StartPageScript.getActiveScript();
      
      if (!script) {
        return res.status(404).json({
          success: false,
          message: '未找到激活的剧本'
        });
      }
      
      res.json({
        success: true,
        data: {
          scriptId: script.scriptId,
          version: script.version,
          name: script.name,
          description: script.description,
          scenes: script.scenes,
          updatedAt: script.updatedAt
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // 根据分数计算结局
  static async calculateEnding(req, res) {
    try {
      const { score } = req.body;
      
      if (score === undefined) {
        return res.status(400).json({
          success: false,
          message: '缺少分数参数'
        });
      }
      
      const script = await StartPageScript.getActiveScript();
      
      if (!script) {
        return res.status(404).json({
          success: false,
          message: '未找到激活的剧本'
        });
      }
      
      // 根据分数获取结局
      const ending = script.getEndingByScore(score);
      
      if (!ending) {
        return res.status(404).json({
          success: false,
          message: '未找到匹配的结局'
        });
      }
      
      // 获取结局场景
      const endingScene = script.getSceneById(ending.sceneId);
      
      res.json({
        success: true,
        data: {
          endingId: ending.endingId,
          endingType: ending.type,
          sceneId: ending.sceneId,
          scene: endingScene,
          finalScore: score
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // 获取特定场景
  static async getScene(req, res) {
    try {
      const { sceneId } = req.params;
      
      const script = await StartPageScript.getActiveScript();
      
      if (!script) {
        return res.status(404).json({
          success: false,
          message: '未找到激活的剧本'
        });
      }
      
      const scene = script.getSceneById(parseInt(sceneId));
      
      if (!scene) {
        return res.status(404).json({
          success: false,
          message: '场景不存在'
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
  
  // 创建或更新剧本（管理用）
  static async upsertScript(req, res) {
    try {
      const scriptData = req.body;
      
      // 验证必要字段
      if (!scriptData.scriptId || !scriptData.scenes) {
        return res.status(400).json({
          success: false,
          message: '缺少必要字段'
        });
      }
      
      // 查找现有剧本
      let script = await StartPageScript.findOne({ scriptId: scriptData.scriptId });
      
      if (script) {
        // 更新现有剧本
        Object.assign(script, scriptData);
      } else {
        // 创建新剧本
        script = new StartPageScript(scriptData);
      }
      
      await script.save();
      
      res.json({
        success: true,
        message: script.isNew ? '剧本创建成功' : '剧本更新成功',
        data: script
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // 获取所有剧本（管理用）
  static async getAllScripts(req, res) {
    try {
      const scripts = await StartPageScript.find()
        .select('-__v')
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: scripts,
        count: scripts.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // 删除剧本（管理用）
  static async deleteScript(req, res) {
    try {
      const { scriptId } = req.params;
      
      const script = await StartPageScript.findOneAndDelete({ scriptId });
      
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
}

module.exports = StartPageScriptController;


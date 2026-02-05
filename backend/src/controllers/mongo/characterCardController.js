const Character = require('../../schemas/unifiedCharacterSchema');

class CharacterCardController {
  // 获取所有角色卡片
  static async getAllCards(req, res) {
    try {
      const { unlocked, sortBy = 'index' } = req.query;
      
      const query = { isActive: true };
      if (unlocked !== undefined) {
        query.unlocked = unlocked === 'true';
      }
      
      const characters = await Character.find(query)
        .select('-__v')
        .sort({ [sortBy]: 1 });
      
      // 转换为卡片格式
      const cards = characters.map(char => char.getCardProfile());
      
      res.json({
        success: true,
        data: cards
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 根据ID获取角色卡片
  static async getCardById(req, res) {
    try {
      const { id } = req.params;
      const character = await Character.findById(id).select('-__v');
      
      if (!character) {
        return res.status(404).json({
          success: false,
          message: '角色卡片不存在'
        });
      }
      
      res.json({
        success: true,
        data: character.getCardProfile()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 根据索引获取角色卡片
  static async getCardByIndex(req, res) {
    try {
      const { index } = req.params;
      const character = await Character.findOne({ index: parseInt(index), isActive: true }).select('-__v');
      
      if (!character) {
        return res.status(404).json({
          success: false,
          message: '角色卡片不存在'
        });
      }
      
      res.json({
        success: true,
        data: character.getCardProfile()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 创建新角色卡片
  static async createCard(req, res) {
    try {
      const cardData = req.body;
      
      // 如果没有指定 index，自动分配
      if (cardData.index === undefined) {
        const maxIndex = await Character.findOne().sort({ index: -1 }).select('index');
        cardData.index = maxIndex ? maxIndex.index + 1 : 0;
      }
      
      // 如果没有 characterId，使用 title 或生成一个
      if (!cardData.characterId) {
        cardData.characterId = cardData.title 
          ? cardData.title.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now()
          : 'card_' + Date.now();
      }
      
      // 如果没有 name，使用 title
      if (!cardData.name) {
        cardData.name = cardData.title || '未命名角色';
      }
      
      // 转换卡片格式的 stats 到 displayStats
      if (cardData.stats && !cardData.displayStats) {
        cardData.displayStats = cardData.stats;
      }
      
      // 转换卡片格式的 skills 到 cardSkills
      if (cardData.skills && !cardData.cardSkills) {
        cardData.cardSkills = cardData.skills;
      }
      
      const character = new Character(cardData);
      await character.save();
      
      res.status(201).json({
        success: true,
        message: '角色卡片创建成功',
        data: character.getCardProfile()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 批量创建角色卡片
  static async createCards(req, res) {
    try {
      const { cards } = req.body;
      
      if (!Array.isArray(cards) || cards.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的卡片数组'
        });
      }
      
      // 为每个卡片分配索引和必要字段
      const currentMaxIndex = await Character.findOne().sort({ index: -1 }).select('index');
      let nextIndex = currentMaxIndex ? currentMaxIndex.index + 1 : 0;
      
      const preparedCards = cards.map((cardData, i) => {
        const prepared = { ...cardData };
        
        if (prepared.index === undefined) {
          prepared.index = nextIndex + i;
        }
        
        if (!prepared.characterId) {
          prepared.characterId = prepared.title 
            ? prepared.title.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now() + '_' + i
            : 'card_' + Date.now() + '_' + i;
        }
        
        if (!prepared.name) {
          prepared.name = prepared.title || '未命名角色';
        }
        
        if (prepared.stats && !prepared.displayStats) {
          prepared.displayStats = prepared.stats;
        }
        
        if (prepared.skills && !prepared.cardSkills) {
          prepared.cardSkills = prepared.skills;
        }
        
        return prepared;
      });
      
      const createdCharacters = await Character.insertMany(preparedCards);
      
      res.status(201).json({
        success: true,
        message: `成功创建 ${createdCharacters.length} 张角色卡片`,
        data: createdCharacters.map(char => {
          // insertMany 返回的是普通对象，需要转换
          const charDoc = new Character(char);
          return charDoc.getCardProfile();
        })
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 更新角色卡片
  static async updateCard(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // 更新元数据时间戳
      if (updates.metadata) {
        updates.metadata.updatedAt = new Date();
      } else {
        updates.metadata = { updatedAt: new Date() };
      }
      
      // 转换卡片格式的 stats 到 displayStats
      if (updates.stats && !updates.displayStats) {
        updates.displayStats = updates.stats;
        delete updates.stats;
      }
      
      // 转换卡片格式的 skills 到 cardSkills
      if (updates.skills && !updates.cardSkills) {
        updates.cardSkills = updates.skills;
        delete updates.skills;
      }
      
      const character = await Character.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );
      
      if (!character) {
        return res.status(404).json({
          success: false,
          message: '角色卡片不存在'
        });
      }
      
      res.json({
        success: true,
        message: '角色卡片更新成功',
        data: character.getCardProfile()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 删除角色卡片
  static async deleteCard(req, res) {
    try {
      const { id } = req.params;
      const character = await Character.findByIdAndDelete(id);
      
      if (!character) {
        return res.status(404).json({
          success: false,
          message: '角色卡片不存在'
        });
      }
      
      res.json({
        success: true,
        message: '角色卡片删除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 更新解锁状态
  static async updateUnlockStatus(req, res) {
    try {
      const { id } = req.params;
      const { unlocked } = req.body;
      
      const character = await Character.findByIdAndUpdate(
        id,
        { unlocked: unlocked === true || unlocked === 'true' },
        { new: true }
      );
      
      if (!character) {
        return res.status(404).json({
          success: false,
          message: '角色卡片不存在'
        });
      }
      
      res.json({
        success: true,
        message: '解锁状态更新成功',
        data: character.getCardProfile()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = CharacterCardController;

const CharacterCard = require('../../schemas/characterCardSchema');

class CharacterCardController {
  // 获取所有角色卡片
  static async getAllCards(req, res) {
    try {
      const { unlocked, sortBy = 'index' } = req.query;
      
      const query = {};
      if (unlocked !== undefined) {
        query.unlocked = unlocked === 'true';
      }
      
      const cards = await CharacterCard.find(query)
        .select('-__v')
        .sort({ [sortBy]: 1 });
      
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
      const card = await CharacterCard.findById(id).select('-__v');
      
      if (!card) {
        return res.status(404).json({
          success: false,
          message: '角色卡片不存在'
        });
      }
      
      res.json({
        success: true,
        data: card
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
      const card = await CharacterCard.findOne({ index: parseInt(index) }).select('-__v');
      
      if (!card) {
        return res.status(404).json({
          success: false,
          message: '角色卡片不存在'
        });
      }
      
      res.json({
        success: true,
        data: card
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
        const maxIndex = await CharacterCard.findOne().sort({ index: -1 }).select('index');
        cardData.index = maxIndex ? maxIndex.index + 1 : 0;
      }
      
      const card = new CharacterCard(cardData);
      await card.save();
      
      res.status(201).json({
        success: true,
        message: '角色卡片创建成功',
        data: card
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
      
      // 为每个卡片分配索引（如果没有指定）
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].index === undefined) {
          const maxIndex = await CharacterCard.findOne().sort({ index: -1 }).select('index');
          cards[i].index = maxIndex ? maxIndex.index + 1 + i : i;
        }
      }
      
      const createdCards = await CharacterCard.insertMany(cards);
      
      res.status(201).json({
        success: true,
        message: `成功创建 ${createdCards.length} 张角色卡片`,
        data: createdCards
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
      
      const card = await CharacterCard.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );
      
      if (!card) {
        return res.status(404).json({
          success: false,
          message: '角色卡片不存在'
        });
      }
      
      res.json({
        success: true,
        message: '角色卡片更新成功',
        data: card
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
      const card = await CharacterCard.findByIdAndDelete(id);
      
      if (!card) {
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
      
      const card = await CharacterCard.findByIdAndUpdate(
        id,
        { unlocked: unlocked === true || unlocked === 'true' },
        { new: true }
      );
      
      if (!card) {
        return res.status(404).json({
          success: false,
          message: '角色卡片不存在'
        });
      }
      
      res.json({
        success: true,
        message: '解锁状态更新成功',
        data: card
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




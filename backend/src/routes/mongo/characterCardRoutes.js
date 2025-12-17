const express = require('express');
const router = express.Router();
const CharacterCardController = require('../../controllers/mongo/characterCardController');

// 获取所有角色卡片
router.get('/', CharacterCardController.getAllCards);

// 根据ID获取角色卡片
router.get('/:id', CharacterCardController.getCardById);

// 根据索引获取角色卡片
router.get('/index/:index', CharacterCardController.getCardByIndex);

// 创建新角色卡片
router.post('/', CharacterCardController.createCard);

// 批量创建角色卡片
router.post('/batch', CharacterCardController.createCards);

// 更新角色卡片
router.put('/:id', CharacterCardController.updateCard);

// 删除角色卡片
router.delete('/:id', CharacterCardController.deleteCard);

// 更新解锁状态
router.patch('/:id/unlock', CharacterCardController.updateUnlockStatus);

module.exports = router;




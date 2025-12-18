const express = require('express');
const router = express.Router();
const MiscMessageController = require('../../controllers/mongo/miscMessageController');

// 获取终端页面右侧消息列表（根据用户身份和解锁条件过滤）
router.get('/terminal-messages', MiscMessageController.getTerminalMessages);

// 获取所有消息（管理员用，支持分页）
router.get('/', MiscMessageController.getAllMessages);

// 创建新消息
router.post('/', MiscMessageController.createMessage);

// 批量创建消息
router.post('/batch', MiscMessageController.batchCreateMessages);

// 更新消息
router.put('/:id', MiscMessageController.updateMessage);

// 标记消息为已读
router.patch('/:id/read', MiscMessageController.markAsRead);

// 删除消息
router.delete('/:id', MiscMessageController.deleteMessage);

module.exports = router;


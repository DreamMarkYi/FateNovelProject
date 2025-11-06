const express = require('express');
const router = express.Router();
const RoomController = require('../../controllers/mongo/roomController');

// 获取所有房间
router.get('/', RoomController.getAllRooms);

// 获取可用的房间
router.get('/available', RoomController.getAvailableRooms);

// 根据ID获取房间
router.get('/:id', RoomController.getRoomById);

// 创建新房间
router.post('/', RoomController.createRoom);

// 更新房间
router.put('/:id', RoomController.updateRoom);

// 删除房间
router.delete('/:id', RoomController.deleteRoom);

module.exports = router;


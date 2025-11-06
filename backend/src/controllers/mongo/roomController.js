const Room = require('../../schemas/roomSchema');

class RoomController {
  // 获取所有房间
  static async getAllRooms(req, res) {
    try {
      const rooms = await Room.find()
        .select('-__v')
        .sort({ displayOrder: 1, createdAt: -1 });
      
      res.json({
        success: true,
        data: rooms
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 获取可用的房间
  static async getAvailableRooms(req, res) {
    try {
      const rooms = await Room.find({ isAvailable: true })
        .select('-__v')
        .sort({ displayOrder: 1, createdAt: -1 });
      
      res.json({
        success: true,
        data: rooms
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 根据ID获取房间
  static async getRoomById(req, res) {
    try {
      const { id } = req.params;
      const room = await Room.findById(id).select('-__v');
      
      if (!room) {
        return res.status(404).json({
          success: false,
          message: '房间不存在'
        });
      }
      
      res.json({
        success: true,
        data: room
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 创建新房间
  static async createRoom(req, res) {
    try {
      const roomData = req.body;
      const room = new Room(roomData);
      await room.save();
      
      res.status(201).json({
        success: true,
        message: '房间创建成功',
        data: room
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 更新房间
  static async updateRoom(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const room = await Room.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );
      
      if (!room) {
        return res.status(404).json({
          success: false,
          message: '房间不存在'
        });
      }
      
      res.json({
        success: true,
        message: '房间更新成功',
        data: room
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 删除房间
  static async deleteRoom(req, res) {
    try {
      const { id } = req.params;
      const room = await Room.findByIdAndDelete(id);
      
      if (!room) {
        return res.status(404).json({
          success: false,
          message: '房间不存在'
        });
      }
      
      res.json({
        success: true,
        message: '房间删除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = RoomController;


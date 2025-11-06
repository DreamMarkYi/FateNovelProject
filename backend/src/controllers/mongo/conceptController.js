const Concept = require('../../schemas/conceptSchema');

class ConceptController {
  // 获取所有概念
  static async getAllConcepts(req, res) {
    try {
      const concepts = await Concept.find()
        .select('-__v')
        .sort({ displayOrder: 1, createdAt: -1 });
      
      res.json({
        success: true,
        data: concepts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 获取激活的概念
  static async getActiveConcepts(req, res) {
    try {
      const concepts = await Concept.find({ isActive: true })
        .select('-__v')
        .sort({ displayOrder: 1, createdAt: -1 });
      
      res.json({
        success: true,
        data: concepts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 根据ID获取概念
  static async getConceptById(req, res) {
    try {
      const { id } = req.params;
      const concept = await Concept.findById(id).select('-__v');
      
      if (!concept) {
        return res.status(404).json({
          success: false,
          message: '概念不存在'
        });
      }
      
      res.json({
        success: true,
        data: concept
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 创建新概念
  static async createConcept(req, res) {
    try {
      const conceptData = req.body;
      const concept = new Concept(conceptData);
      await concept.save();
      
      res.status(201).json({
        success: true,
        message: '概念创建成功',
        data: concept
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 更新概念
  static async updateConcept(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const concept = await Concept.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );
      
      if (!concept) {
        return res.status(404).json({
          success: false,
          message: '概念不存在'
        });
      }
      
      res.json({
        success: true,
        message: '概念更新成功',
        data: concept
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 删除概念
  static async deleteConcept(req, res) {
    try {
      const { id } = req.params;
      const concept = await Concept.findByIdAndDelete(id);
      
      if (!concept) {
        return res.status(404).json({
          success: false,
          message: '概念不存在'
        });
      }
      
      res.json({
        success: true,
        message: '概念删除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = ConceptController;


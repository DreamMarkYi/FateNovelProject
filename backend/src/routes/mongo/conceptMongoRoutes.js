const express = require('express');
const router = express.Router();
const ConceptController = require('../../controllers/mongo/conceptController');

// 获取所有概念
router.get('/', ConceptController.getAllConcepts);

// 获取激活的概念
router.get('/active', ConceptController.getActiveConcepts);

// 根据ID获取概念
router.get('/:id', ConceptController.getConceptById);

// 创建新概念
router.post('/', ConceptController.createConcept);

// 更新概念
router.put('/:id', ConceptController.updateConcept);

// 删除概念
router.delete('/:id', ConceptController.deleteConcept);

module.exports = router;


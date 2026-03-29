const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.route('/')
  .get(categoryController.getAllCategories)
  .post(verifyToken, checkRole('Admin', 'Staff'), categoryController.createCategory);

router.route('/:id')
  .get(categoryController.getCategoryById)
  .put(verifyToken, checkRole('Admin', 'Staff'), categoryController.updateCategory)
  .delete(verifyToken, checkRole('Admin', 'Staff'), categoryController.deleteCategory);

module.exports = router;

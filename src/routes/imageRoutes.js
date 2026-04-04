const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Upload ảnh cho sách (cần Admin/Staff)
router.post(
  '/upload',
  verifyToken,
  checkRole('Admin', 'Staff'),
  upload.single('image'),
  imageController.uploadImage
);

// Lấy tất cả ảnh của 1 cuốn sách (public)
router.get('/book/:bookId', imageController.getImagesByBook);

// Xóa ảnh theo ID (cần Admin/Staff)
router.delete('/:id', verifyToken, checkRole('Admin', 'Staff'), imageController.deleteImage);

module.exports = router;

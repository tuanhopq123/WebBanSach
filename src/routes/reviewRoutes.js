const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Xem đánh giá của 1 cuốn sách (public)
router.get('/book/:bookId', reviewController.getReviewsByBook);

// Các route bên dưới cần đăng nhập
router.use(verifyToken);

// Tạo đánh giá
router.post('/', reviewController.createReview);

// Xem đánh giá của tôi
router.get('/my-reviews', reviewController.getMyReviews);

// Sửa/Xóa đánh giá theo ID
router.route('/:id')
  .put(reviewController.updateReview)
  .delete(reviewController.deleteReview);

module.exports = router;

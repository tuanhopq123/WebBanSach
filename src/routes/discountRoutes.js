const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Tất cả routes cần Admin hoặc Staff
router.use(verifyToken);
router.use(checkRole('Admin', 'Staff'));

router.route('/')
  .get(discountController.getAllDiscounts)
  .post(discountController.createDiscount);

router.route('/:id')
  .get(discountController.getDiscountById)
  .put(discountController.updateDiscount)
  .delete(discountController.deleteDiscount);

// Gán/Gỡ discount cho sách
router.post('/:id/apply', discountController.applyToBooks);
router.post('/:id/remove', discountController.removeFromBooks);

module.exports = router;

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.route('/checkout')
  .post(orderController.checkout);

router.route('/my-orders')
  .get(orderController.getMyOrders);

router.route('/:id')
  .get(orderController.getOrderById);

router.route('/:id/status')
  .put(checkRole('Admin', 'Staff'), orderController.updateStatus);

module.exports = router;

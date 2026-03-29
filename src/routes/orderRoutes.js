const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.route('/checkout')
  .post(orderController.checkout);

router.route('/my-orders')
  .get(orderController.getMyOrders);

router.route('/:id')
  .get(orderController.getOrderById);

module.exports = router;

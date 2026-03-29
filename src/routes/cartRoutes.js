const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.route('/')
  .get(cartController.getMyCart)
  .post(cartController.addToCart)
  .delete(cartController.clearCart);

router.route('/update')
  .put(cartController.updateCartItem);

module.exports = router;

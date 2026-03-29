const cartService = require('../services/cartService');

const getMyCart = async (req, res) => {
  try {
    const cart = await cartService.getCartByUserId(req.user._id);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const { bookId, quantity } = req.body;
    const parsedQuantity = parseInt(quantity, 10) || 1;
    const cart = await cartService.addToCart(req.user._id, bookId, parsedQuantity);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { bookId, quantity } = req.body;
    const parsedQuantity = parseInt(quantity, 10);
    const cart = await cartService.updateCartItemQuantity(req.user._id, bookId, parsedQuantity);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await cartService.clearCart(req.user._id);
    res.status(200).json({ success: true, data: cart, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyCart,
  addToCart,
  updateCartItem,
  clearCart
};

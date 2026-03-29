const orderService = require('../services/orderService');

const checkout = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    
    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    const order = await orderService.checkout(req.user._id, shippingAddress, paymentMethod);
    res.status(201).json({ success: true, data: order, message: 'Checkout successful' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await orderService.getMyOrders(req.user._id);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role.name !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

module.exports = {
  checkout,
  getMyOrders,
  getOrderById
};

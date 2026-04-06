const paymentService = require('../services/paymentService');

const cassoWebhook = async (req, res) => {
  try {
    const secureToken = req.headers['secure-token'];
    
    // Kiểm tra tính hợp lệ của Webhook (Casso Header)
    // Cần phải định nghĩa biến CASSO_SECURE_TOKEN trong file .env
    if (!secureToken || secureToken !== process.env.CASSO_SECURE_TOKEN) {
      console.error('Invalid Casso Secure Token:', secureToken);
      // Luôn trả về HTTP 200 để Casso ngừng retry
      return res.status(200).json({ success: false, message: 'Invalid token' });
    }

    const { error, data } = req.body;

    if (error !== 0) {
      // Có lỗi từ phía Casso
      return res.status(200).json({ success: false, message: 'Error from Casso body' });
    }

    // Xử lý lần lượt từng transaction được Casso push về
    if (data && Array.isArray(data)) {
      for (const transaction of data) {
        await paymentService.processCassoWebhook(transaction);
      }
    }

    // Luôn trả về 200 OK cho Casso cho dù thành công hay thất bại logic
    return res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Casso Webhook Processing Error:', error);
    // Vẫn trả về 200 OK để Casso chặn retry loop
    return res.status(200).json({ success: false, message: 'Internal Server Error' });
  }
};

// (exports defined at bottom)

// Simulate a payment for a given order (useful for local testing)
const Order = require('../models/Order.model');

const simulatePayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Ensure the caller owns the order or is admin
    if (order.user.toString() !== req.user._id.toString() && !(req.user.role && req.user.role.name === 'Admin')) {
      return res.status(403).json({ success: false, message: 'Not authorized to simulate payment for this order' });
    }

    // Build a fake transaction payload that mimics Casso webhook transaction
    const tx = {
      description: order.paymentCode,
      amount: order.totalAmount
    };

    const ok = await paymentService.processCassoWebhook(tx);
    if (ok) return res.status(200).json({ success: true, message: 'Payment simulated and processed' });
    return res.status(400).json({ success: false, message: 'Payment simulation failed' });
  } catch (err) {
    console.error('simulatePayment error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// expose simulatePayment together with cassoWebhook
module.exports = {
  cassoWebhook,
  simulatePayment
};

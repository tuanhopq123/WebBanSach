const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route này hứng Webhook từ Casso. Endpoint: POST /api/webhook/casso
router.post('/casso', paymentController.cassoWebhook);

// Simulate payment for local testing: POST /api/payments/simulate
// Body: { orderId: '<orderId>' }
router.post('/simulate', verifyToken, paymentController.simulatePayment);

module.exports = router;

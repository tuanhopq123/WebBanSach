const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Route này hứng Webhook từ Casso. Endpoint: POST /api/webhook/casso
router.post('/casso', paymentController.cassoWebhook);

module.exports = router;

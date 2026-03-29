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

module.exports = {
  cassoWebhook
};

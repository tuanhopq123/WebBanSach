require('dotenv').config();
const express = require('express');
// Express 5 đã hỗ trợ async error handling natively, không cần express-async-errors
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Import routes
const userRoutes = require('./src/routes/userRoutes');
const bookRoutes = require('./src/routes/bookRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const discountRoutes = require('./src/routes/discountRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const logMiddleware = require('./src/middlewares/logMiddleware');
const notificationRoutes = require('./src/routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Middlewares
app.use(express.json()); // Parse JSON requests
app.use(cors()); // Cấu hình CORS
app.use(morgan('dev')); // Logging HTTP requests
app.use(logMiddleware); // Ghi log các action POST/PUT/DELETE/PATCH vào MongoDB

// Serve static files (frontend + uploads)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 2. Connect Database (MongoDB Atlas)
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Kết nối MongoDB (Atlas) thành công!'))
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

// 3. Root route cơ bản
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to WebBanSach API',
    status: 'Running'
  });
});

// 4. API Routes
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhook', paymentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);

// 5. Error Middleware (Phải nằm dưới cùng sau tất cả các routes)
const errorMiddleware = require('./src/middlewares/errorMiddleware');
app.use(errorMiddleware);

// 6. Tích hợp Socket.io với Express App
const http = require('http');
const server = http.createServer(app);

// Khởi tạo Socket quản lý các kết nối
const socketService = require('./src/services/socketService');
socketService.init(server);

// Đổi app.listen() thành server.listen() để cả hai có chung HTTP stack
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT} (Express & Realtime Socket.io)`);
});

module.exports = { app, server };

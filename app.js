require('dotenv').config();
const express = require('express');
require('express-async-errors'); // Phải gọi ngay sau express
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

// Import routes (sẽ thêm sau)
// const userRoutes = require('./src/routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Middlewares
app.use(express.json()); // Parse JSON requests
app.use(cors()); // Cấu hình CORS
app.use(morgan('dev')); // Logging HTTP requests

// 2. Connect Database (MongoDB Atlas)
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('✅ Kêt nối MongoDB (Atlas) thành công!'))
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

// 3. Root route cơ bản
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to WebBanSach API',
    status: 'Running'
  });
});

// 4. API Routes (Ví dụ)
// app.use('/api/users', userRoutes);

// 5. Khởi động Server
const errorMiddleware = require('./src/middlewares/errorMiddleware');

// Middleware hứng lỗi (Phải nằm dươí cùng sau tất cả các routes)
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

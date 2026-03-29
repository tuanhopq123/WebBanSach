const { Server } = require('socket.io');
const Notification = require('../models/Notification.model');

let io;

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('New client connected: ', socket.id);
    socket.on('disconnect', () => {
      console.log('Client disconnected: ', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized');
  }
  return io;
};

const notifyNewOrder = async (userId, orderId, totalAmount) => {
  try {
    // Lưu Notification vào Database
    const message = `Đơn hàng mới #${orderId} trị giá ${totalAmount} đã được tạo thành công!`;
    const notification = await Notification.create({
      user: userId,
      message,
      type: 'Order',
      isRead: false
    });

    // Phát sự kiện realtime
    if (io) {
      io.emit('new_order', notification);
    }

    return notification;
  } catch (error) {
    console.error('Error firing new order notification:', error);
  }
};

const notifyPaymentSuccess = async (userId, paymentCode, totalAmount) => {
  try {
    const message = `Thanh toán thành công đơn hàng mã ${paymentCode}. Đã nhận ${totalAmount} VND qua Casso.`;
    
    const notification = await Notification.create({
      user: userId,
      message,
      type: 'Order',
      isRead: false
    });

    if (io) {
      // Bắn sự kiện "payment_success" kèm JSON object có thể cho riêng user đó hoặc global tuỳ nhu cầu
      io.emit('payment_success', notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error firing payment success notification:', error);
  }
};

module.exports = {
  init,
  getIO,
  notifyNewOrder,
  notifyPaymentSuccess
};

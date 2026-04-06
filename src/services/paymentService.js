const mongoose = require('mongoose');
const Order = require('../models/Order.model');
const OrderItem = require('../models/OrderItem.model');
const Book = require('../models/Book.model');

const processCassoWebhook = async (transaction) => {
  try {
    const { description, amount } = transaction;

    // Regex tìm chuỗi paymentCode định dạng DH[ObjectId]-[15 ký tự chữ và số]
    // Tránh việc case bị thay đổi bởi ngân hàng nên thêm flag 'i'
    const match = description.match(/DH[a-fA-F0-9]{24}-[a-zA-Z0-9]{15}/i);
    
    if (!match) {
      console.log('Không tìm thấy mã paymentCode hợp lệ trong description:', description);
      return false;
    }

    // Lấy paymentCode từ description (không ép case) và tìm order theo paymentCode CASE-INSENSITIVE
    const paymentCode = match[0];

    // Use case-insensitive lookup because paymentCode stored in DB may differ in hex case
    const order = await Order.findOne({ paymentCode: { $regex: `^${paymentCode}$`, $options: 'i' } });
    if (!order) {
      console.log('Không tìm thấy đơn hàng với paymentCode:', paymentCode);
      return false;
    }

    if (order.isPaid) {
      console.log('Đơn hàng đã được thanh toán:', paymentCode);
      return true;
    }

    // Kiểm tra số tiền chuyển phải >= tổng tiền đơn hàng
    if (amount >= order.totalAmount) {
      // Bắt đầu Transaction cho khâu Thanh Toán
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        order.isPaid = true;
        order.status = 'Processing'; // Cập nhật trạng thái
        await order.save({ session });

        // Lấy danh sách item trong đơn hàng này
        const items = await OrderItem.find({ order: order._id }).session(session);

        // Trừ số lượng (stock) trong Model Book ngay lúc tiền về
        for (const item of items) {
          const book = await Book.findById(item.book).session(session);
          if (book) {
            book.stockQuantity -= item.quantity;
            if (book.stockQuantity < 0) book.stockQuantity = 0; // Đảm bảo kho không âm
            await book.save({ session });
          }
        }

        // Hoàn tất Transaction
        await session.commitTransaction();
        console.log(`Đã thanh toán và trừ kho thành công đơn hàng có paymentCode: ${paymentCode}`);
        
        // Phát sự kiện realtime và push db Notification
        const socketService = require('./socketService');
        await socketService.notifyPaymentSuccess(order.user, paymentCode, order.totalAmount);
        
      } catch (txnError) {
        await session.abortTransaction();
        console.error('Lỗi khi Commit DB Transaction Webhook:', txnError);
        return false;
      } finally {
        await session.endSession();
      }

      return true;
    } else {
      console.log(`Số tiền không đủ. Yêu cầu: ${order.totalAmount}, Nhận được: ${amount}`);
      return false;
    }
  } catch (error) {
    console.error('Lỗi khi xử lý transaction:', error);
    return false;
  }
};

module.exports = {
  processCassoWebhook
};

const mongoose = require('mongoose');
const Order = require('../models/Order.model');
const OrderItem = require('../models/OrderItem.model');
const Cart = require('../models/Cart.model');
const Book = require('../models/Book.model');
const socketService = require('./socketService');

const checkout = async (userId, shippingAddress, paymentMethod) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  let orderResult;

  try {
    // 1. Lấy giỏ hàng
    const cart = await Cart.findOne({ user: userId }).populate('items.book').session(session);
    
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // 2. Tính tổng tiền và chuẩn bị danh sách item
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      const book = await Book.findById(item.book._id).session(session);
      
      if (!book) {
        throw new Error(`Book with id ${item.book._id} not found`);
      }
      
      if (book.stockQuantity < item.quantity) {
        throw new Error(`Not enough stock for book: ${book.title}`);
      }

      // KHÔNG trừ tồn kho ở đây. Tồn kho sẽ được gộp trừ ở Webhook Casso sau khi thanh toán thành công.
      
      totalAmount += book.price * item.quantity;

      orderItemsData.push({
        book: book._id,
        quantity: item.quantity,
        priceAtPurchase: book.price
      });
    }

    // 3. Tạo Order
    const crypto = require('crypto');
    const orderId = new mongoose.Types.ObjectId();
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomString = '';
    const randomBytes = crypto.randomBytes(15);
    for (let i = 0; i < 15; i++) {
      randomString += chars[randomBytes[i] % chars.length];
    }
    
    const paymentCode = `DH${orderId.toString()}-${randomString}`;

    const [order] = await Order.create([{
      _id: orderId,
      user: userId,
      totalAmount,
      shippingAddress,
      paymentMethod,
      status: 'Pending',
      isPaid: false,
      paymentCode
    }], { session });

    // 4. Tạo OrderItem mapping
    const orderItemsToInsert = orderItemsData.map(data => ({
      ...data,
      order: order._id
    }));
    await OrderItem.insertMany(orderItemsToInsert, { session });

    // 5. Xóa dữ liệu Cart
    cart.items = [];
    await cart.save({ session });

    orderResult = order.toObject(); // convert to plain object
    const bankId = process.env.BANK_ID || 'MB';
    const accountNo = process.env.BANK_ACCOUNT || '0123456789';
    orderResult.qrCodeUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${totalAmount}&addInfo=${paymentCode}`;

    // Cam kết toàn bộ các thao tác Database
    await session.commitTransaction();
    
    // Phát thông báo Realtime nếu checkout thành công (Bên ngoài scope rủi ro Rollback)
    await socketService.notifyNewOrder(userId, orderResult._id, orderResult.totalAmount);
    
  } catch (error) {
    // Hủy bỏ toàn bộ thao tác nếu xảy ra lỗi ở bất kỳ khâu nào
    await session.abortTransaction();
    throw error;
  } finally {
    // Kết thúc phiên làm việc
    await session.endSession();
  }

  return orderResult;
};

const getMyOrders = async (userId) => {
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
  for (let order of orders) {
    const items = await OrderItem.find({ order: order._id }).populate('book', 'title author price images');
    order.items = items;
  }
  return orders;
};

const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId).populate('user', 'username email');
  if (!order) throw new Error('Order not found');

  const items = await OrderItem.find({ order: orderId }).populate('book', 'title author');
  
  return { ...order.toObject(), items };
};

const updateOrderStatus = async (orderId, status) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');
  order.status = status;
  await order.save();
  return order;
};

module.exports = {
  checkout,
  getMyOrders,
  getOrderById,
  updateOrderStatus
};

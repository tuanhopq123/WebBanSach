const mongoose = require('mongoose');
const Order = require('../models/Order.model');
const OrderItem = require('../models/OrderItem.model');
const Cart = require('../models/Cart.model');
const Book = require('../models/Book.model');
const User = require('../models/User.model'); // THÊM DÒNG NÀY
const Role = require('../models/Role.model'); // THÊM DÒNG NÀY
const Notification = require('../models/Notification.model'); // THÊM DÒNG NÀY
const socketService = require('./socketService');

const checkout = async (userId, shippingAddress, paymentMethod) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  let orderResult;

  try {
    const cart = await Cart.findOne({ user: userId }).populate('items.book').session(session);

    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      const book = await Book.findById(item.book._id).session(session);

      if (!book) throw new Error(`Book with id ${item.book._id} not found`);
      if (book.stockQuantity < item.quantity) throw new Error(`Not enough stock for book: ${book.title}`);

      totalAmount += book.price * item.quantity;

      orderItemsData.push({
        book: book._id,
        quantity: item.quantity,
        priceAtPurchase: book.price
      });
    }

    const crypto = require('crypto');
    const orderId = new mongoose.Types.ObjectId();

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomString = '';
    const randomBytes = crypto.randomBytes(15);
    for (let i = 0; i < 15; i++) randomString += chars[randomBytes[i] % chars.length];

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

    const orderItemsToInsert = orderItemsData.map(data => ({
      ...data,
      order: order._id
    }));
    await OrderItem.insertMany(orderItemsToInsert, { session });

    cart.items = [];
    await cart.save({ session });

    orderResult = order.toObject();
    const bankId = process.env.BANK_ID || 'MB';
    const accountNo = process.env.BANK_ACCOUNT || '0123456789';
    orderResult.qrCodeUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${totalAmount}&addInfo=${paymentCode}`;

    await session.commitTransaction();

    // =============== THÊM LOGIC THÔNG BÁO CHO ADMIN ===============
    try {
      const adminRole = await Role.findOne({ name: 'Admin' });
      if (adminRole) {
        const admins = await User.find({ role: adminRole._id });
        const notifications = admins.map(admin => ({
          user: admin._id,
          title: '📦 Đơn hàng mới',
          message: `Có đơn hàng mới #${orderResult._id.toString().slice(-6)} trị giá ${totalAmount.toLocaleString()}₫.`,
          type: 'NEW_ORDER',
          link: '/admin/orders.html'
        }));
        if (notifications.length > 0) await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.warn("Lỗi tạo thông báo Admin:", notifErr); // Không làm sập luồng mua hàng
    }
    // ==============================================================

    await socketService.notifyNewOrder(userId, orderResult._id, orderResult.totalAmount);

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
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

  // LOGIC MỚI: Tự động đánh dấu đã thu tiền nếu giao COD thành công
  if (status === 'Delivered' && order.paymentMethod === 'COD') {
    order.isPaid = true;
  }

  await order.save();

  try {
    const Notification = require('../models/Notification.model');
    await Notification.create({
      user: order.user,
      title: '🚚 Trạng thái đơn hàng',
      message: `Đơn hàng #${order._id.toString().slice(-6)} của bạn đã được cập nhật thành: ${status}.`,
      type: 'ORDER_UPDATE',
      link: '/my-orders.html'
    });
  } catch (notifErr) {
    console.warn("Lỗi tạo thông báo User:", notifErr);
  }

  return order;
};

const getAllOrders = async () => {
  return await Order.find()
    .populate('user', 'username email')
    .sort({ createdAt: -1 });
};

module.exports = {
  checkout,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders
};
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Số lượng ít nhất là 1']
    },
    priceAtPurchase: {
      type: Number,
      required: true,
      min: [0, 'Giá không thể nhỏ hơn 0']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('OrderItem', orderItemSchema);

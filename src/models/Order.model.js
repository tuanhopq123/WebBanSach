const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Tổng tiền không thể nhỏ hơn 0']
    },
    shippingAddress: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },
    paymentMethod: {
      type: String,
      enum: ['BANK', 'COD'],
      default: 'COD'
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paymentCode: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);

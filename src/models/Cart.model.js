const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // Mỗi user chỉ có 1 giỏ hàng hiện tại
    },
    items: [
      {
        book: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Book',
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Số lượng ít nhất là 1'],
          default: 1
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Cart', cartSchema);

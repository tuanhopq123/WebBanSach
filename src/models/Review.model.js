const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Đánh giá tối thiểu là 1 sao'],
      max: [5, 'Đánh giá tối đa là 5 sao']
    },
    comment: {
      type: String,
      trim: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Mỗi user chỉ được review 1 cuốn sách 1 lần cho mỗi đơn hàng
reviewSchema.index({ user: 1, book: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

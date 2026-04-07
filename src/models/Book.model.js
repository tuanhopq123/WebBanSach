const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Giá không thể nhỏ hơn 0']
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: [0, 'Số lượng tồn không thể nhỏ hơn 0'],
      default: 0
    },
    description: {
      type: String
    },
    author: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    images: [{
      type: String
    }],
    isActive: { // Thêm trường này
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Book', bookSchema);

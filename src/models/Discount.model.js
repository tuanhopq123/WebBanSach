const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    discountPercentage: {
      type: Number,
      min: [0, 'Phần trăm giảm không hợp lệ'],
      max: [100, 'Phần trăm giảm không quá 100%'],
      default: 0
    },
    discountAmount: {
      type: Number,
      min: [0, 'Số tiền giảm không hợp lệ'],
      default: 0
    },
    validFrom: {
      type: Date,
      required: true,
      default: Date.now
    },
    validUntil: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    applicableBooks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    }]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Discount', discountSchema);

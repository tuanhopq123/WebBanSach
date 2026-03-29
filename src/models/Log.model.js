const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Có thể null nếu là log do hệ thống tự sinh
    },
    action: {
      type: String,
      required: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed // Object linh hoạt lưu chi tiết thay đổi
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Log', logSchema);

const Review = require('../models/Review.model');
const Book = require('../models/Book.model');

// Tạo đánh giá cho sách
const createReview = async (userId, data) => {
  const { bookId, rating, comment } = data;

  // Kiểm tra sách tồn tại
  const book = await Book.findById(bookId);
  if (!book) throw new Error('Book not found');

  // Kiểm tra user đã review sách này chưa (unique index: user + book)
  const existing = await Review.findOne({ user: userId, book: bookId });
  if (existing) {
    throw new Error('Bạn đã đánh giá cuốn sách này rồi');
  }

  const review = await Review.create({
    user: userId,
    book: bookId,
    rating,
    comment
  });

  return await Review.findById(review._id)
    .populate('user', 'username email')
    .populate('book', 'title author');
};

// Lấy tất cả đánh giá của 1 cuốn sách
const getReviewsByBook = async (bookId) => {
  const book = await Book.findById(bookId);
  if (!book) throw new Error('Book not found');

  return await Review.find({ book: bookId })
    .populate('user', 'username email')
    .sort({ createdAt: -1 });
};

// Cập nhật đánh giá (chỉ người tạo mới sửa được)
const updateReview = async (reviewId, userId, data) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new Error('Review not found');

  if (review.user.toString() !== userId.toString()) {
    throw new Error('Bạn chỉ có thể sửa đánh giá của mình');
  }

  if (data.rating) review.rating = data.rating;
  if (data.comment !== undefined) review.comment = data.comment;

  await review.save();

  return await Review.findById(reviewId)
    .populate('user', 'username email')
    .populate('book', 'title author');
};

// Xóa đánh giá (người tạo hoặc Admin)
const deleteReview = async (reviewId, userId, userRole) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new Error('Review not found');

  if (review.user.toString() !== userId.toString() && userRole !== 'Admin') {
    throw new Error('Bạn không có quyền xóa đánh giá này');
  }

  await Review.findByIdAndDelete(reviewId);
  return review;
};

// Lấy đánh giá của tôi
const getMyReviews = async (userId) => {
  return await Review.find({ user: userId })
    .populate('book', 'title author price')
    .sort({ createdAt: -1 });
};

module.exports = {
  createReview,
  getReviewsByBook,
  updateReview,
  deleteReview,
  getMyReviews
};

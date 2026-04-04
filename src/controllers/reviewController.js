const reviewService = require('../services/reviewService');

const createReview = async (req, res) => {
  try {
    const review = await reviewService.createReview(req.user._id, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getReviewsByBook = async (req, res) => {
  try {
    const reviews = await reviewService.getReviewsByBook(req.params.bookId);
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const review = await reviewService.updateReview(req.params.id, req.user._id, req.body);
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    await reviewService.deleteReview(req.params.id, req.user._id, req.user.role.name);
    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMyReviews = async (req, res) => {
  try {
    const reviews = await reviewService.getMyReviews(req.user._id);
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReview,
  getReviewsByBook,
  updateReview,
  deleteReview,
  getMyReviews
};

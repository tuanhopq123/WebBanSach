const Book = require('../models/Book.model');
const Review = require('../models/Review.model');

const createBook = async (data) => {
  return await Book.create(data);
};

const getAllBooks = async (queryReq = {}) => {
  const { page = 1, limit = 10, search = '' } = queryReq;
  
  // Ép kiểu
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  
  // Build query tìm kiếm bằng Regex
  const query = {};
  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  // Tính số dòng bỏ qua (Skip)
  const skip = (pageNum - 1) * limitNum;

  // Query dữ liệu
  const data = await Book.find(query)
    .populate('category', 'name description')
    .sort({ createdAt: -1 }) // Sách mới nhất lên đầu
    .skip(skip)
    .limit(limitNum);

  // Đếm tổng số lượng (để phục vụ client tính số trang)
  const total = await Book.countDocuments(query);
  const totalPages = Math.ceil(total / limitNum);

  return {
    data,
    total,
    currentPage: pageNum,
    totalPages
  };
};

const getBookById = async (id) => {
  const book = await Book.findById(id).populate('category', 'name description');
  if (!book) throw new Error('Book not found');

  const reviews = await Review.find({ book: id }).populate('user', 'username email');
  
  return {
    ...book.toObject(),
    reviews
  };
};

const updateBook = async (id, data) => {
  const book = await Book.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('category', 'name description');
  if (!book) throw new Error('Book not found');
  return book;
};

const deleteBook = async (id) => {
  const book = await Book.findByIdAndDelete(id);
  if (!book) throw new Error('Book not found');
  return book;
};

const uploadBookImage = async (id, imageUrl) => {
  const book = await Book.findByIdAndUpdate(
    id,
    { $push: { images: imageUrl } },
    { new: true }
  );
  if (!book) throw new Error('Book not found');
  return book;
};

module.exports = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  uploadBookImage
};

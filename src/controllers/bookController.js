const bookService = require('../services/bookService');

const createBook = async (req, res) => {
  const book = await bookService.createBook(req.body);
  res.status(201).json({ success: true, data: book });
};

const getAllBooks = async (req, res) => {
  // Lấy các params phân trang/tìm kiếm trực tiếp từ req.query
  const result = await bookService.getAllBooks(req.query);
  
  // Object result đã có sẵn data, total, currentPage, totalPages
  res.status(200).json({ success: true, ...result });
};

const getBookById = async (req, res) => {
  const result = await bookService.getBookById(req.params.id);
  res.status(200).json({ success: true, data: result });
};

const updateBook = async (req, res) => {
  const book = await bookService.updateBook(req.params.id, req.body);
  res.status(200).json({ success: true, data: book });
};

const deleteBook = async (req, res) => {
  await bookService.deleteBook(req.params.id);
  res.status(200).json({ success: true, message: 'Book deleted successfully' });
};

const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }

  // Lưu URL file map với thư mục public/uploads
  const imageUrl = `/public/uploads/${req.file.filename}`;
  
  const book = await bookService.uploadBookImage(req.params.id, imageUrl);
  res.status(200).json({ success: true, data: book, message: 'Image uploaded successfully' });
};

module.exports = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  uploadImage
};

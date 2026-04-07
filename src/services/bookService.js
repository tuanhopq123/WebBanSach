const Book = require('../models/Book.model');
const Review = require('../models/Review.model');
const Discount = require('../models/Discount.model');
const fs = require('fs');
const path = require('path');

const createBook = async (data) => {
  return await Book.create(data);
};

// Hàm nội bộ: tính giá giảm cho 1 book
const attachDiscountInfo = async (bookObj) => {
  const now = new Date();
  const discount = await Discount.findOne({
    applicableBooks: bookObj._id,
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now }
  });

  if (discount) {
    let discountedPrice = bookObj.price;

    if (discount.discountPercentage > 0) {
      discountedPrice = bookObj.price * (1 - discount.discountPercentage / 100);
    } else if (discount.discountAmount > 0) {
      discountedPrice = bookObj.price - discount.discountAmount;
    }

    discountedPrice = Math.max(0, Math.round(discountedPrice));

    return {
      ...bookObj,
      discount: {
        code: discount.code,
        discountPercentage: discount.discountPercentage,
        discountAmount: discount.discountAmount,
        validUntil: discount.validUntil
      },
      originalPrice: bookObj.price,
      discountedPrice
    };
  }

  return bookObj;
};

const getAllBooks = async (queryReq = {}) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    category = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    minPrice = '',
    maxPrice = '',
    author = ''
  } = queryReq;
  
  // Ép kiểu
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  
  // Build query tìm kiếm
  const query = {};

  // Tìm kiếm theo title hoặc author
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } }
    ];
  }

  // Lọc theo category (ObjectId)
  if (category) {
    query.category = category;
  }

  // Lọc theo tác giả
  if (author) {
    query.author = { $regex: author, $options: 'i' };
  }

  // Lọc theo khoảng giá
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  // Build sort object
  const allowedSortFields = ['title', 'price', 'createdAt', 'author'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const sortObj = { [sortField]: sortDirection };

  // Tính số dòng bỏ qua (Skip)
  const skip = (pageNum - 1) * limitNum;

  // Query dữ liệu
  const books = await Book.find(query)
    .populate('category', 'name description')
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum);

  // Gắn thông tin giảm giá cho từng sách
  const data = [];
  for (const book of books) {
    const bookObj = book.toObject();
    const bookWithDiscount = await attachDiscountInfo(bookObj);
    data.push(bookWithDiscount);
  }

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
  
  // Gắn thông tin giảm giá
  const bookObj = book.toObject();
  const bookWithDiscount = await attachDiscountInfo(bookObj);

  return {
    ...bookWithDiscount,
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

  // Gỡ book khỏi tất cả discount
  await Discount.updateMany(
    { applicableBooks: id },
    { $pull: { applicableBooks: id } }
  );

  return book;
};

const uploadBookImage = async (id, imageUrl) => {
  const bookToUpdate = await Book.findById(id);
  if (!bookToUpdate) throw new Error('Book not found');

  // Xóa các file ảnh cũ trên server
  if (bookToUpdate.images && bookToUpdate.images.length > 0) {
    bookToUpdate.images.forEach((imgUrl) => {
      const imgPath = path.join(__dirname, '../../', imgUrl);
      if (fs.existsSync(imgPath)) {
        try {
          fs.unlinkSync(imgPath);
        } catch (error) {
          console.error(`Lỗi khi xóa file ảnh: ${imgPath}`, error);
        }
      }
    });
  }

  const book = await Book.findByIdAndUpdate(
    id,
    { $set: { images: [imageUrl] } },
    { new: true }
  );
  
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

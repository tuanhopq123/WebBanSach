const Book = require('../models/Book.model');
const Review = require('../models/Review.model');
const Discount = require('../models/Discount.model');

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
  const books = await Book.find(query)
    .populate('category', 'name description')
    .sort({ createdAt: -1 }) // Sách mới nhất lên đầu
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

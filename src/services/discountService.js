const Discount = require('../models/Discount.model');
const Book = require('../models/Book.model');

// Tạo mã giảm giá mới
const createDiscount = async (data) => {
  const { code, discountPercentage, discountAmount, validFrom, validUntil, applicableBooks } = data;

  // Kiểm tra code đã tồn tại chưa
  const existing = await Discount.findOne({ code: code.toUpperCase() });
  if (existing) {
    throw new Error('Mã giảm giá đã tồn tại');
  }

  // Validate: phải có ít nhất 1 loại giảm giá
  if ((!discountPercentage || discountPercentage === 0) && (!discountAmount || discountAmount === 0)) {
    throw new Error('Phải có discountPercentage hoặc discountAmount lớn hơn 0');
  }

  // Validate: ngày kết thúc phải sau ngày bắt đầu
  if (new Date(validUntil) <= new Date(validFrom || Date.now())) {
    throw new Error('validUntil phải sau validFrom');
  }

  // Validate: kiểm tra các book ID có tồn tại không
  if (applicableBooks && applicableBooks.length > 0) {
    for (const bookId of applicableBooks) {
      const book = await Book.findById(bookId);
      if (!book) throw new Error(`Book với ID ${bookId} không tồn tại`);
    }
  }

  return await Discount.create(data);
};

// Lấy tất cả mã giảm giá
const getAllDiscounts = async () => {
  return await Discount.find()
    .populate('applicableBooks', 'title price author')
    .sort({ createdAt: -1 });
};

// Lấy mã giảm giá theo ID
const getDiscountById = async (id) => {
  const discount = await Discount.findById(id)
    .populate('applicableBooks', 'title price author');
  if (!discount) throw new Error('Discount not found');
  return discount;
};

// Cập nhật mã giảm giá
const updateDiscount = async (id, data) => {
  // Validate ngày nếu có
  if (data.validUntil && data.validFrom) {
    if (new Date(data.validUntil) <= new Date(data.validFrom)) {
      throw new Error('validUntil phải sau validFrom');
    }
  }

  const discount = await Discount.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('applicableBooks', 'title price author');
  if (!discount) throw new Error('Discount not found');
  return discount;
};

// Xóa mã giảm giá
const deleteDiscount = async (id) => {
  const discount = await Discount.findByIdAndDelete(id);
  if (!discount) throw new Error('Discount not found');
  return discount;
};

// Gán discount cho danh sách sách
const applyToBooks = async (discountId, bookIds) => {
  const discount = await Discount.findById(discountId);
  if (!discount) throw new Error('Discount not found');

  // Validate tất cả book ID
  for (const bookId of bookIds) {
    const book = await Book.findById(bookId);
    if (!book) throw new Error(`Book với ID ${bookId} không tồn tại`);
  }

  // Thêm book chưa có vào danh sách
  const currentBooks = discount.applicableBooks.map(id => id.toString());
  const newBooks = bookIds.filter(id => !currentBooks.includes(id.toString()));

  if (newBooks.length > 0) {
    discount.applicableBooks.push(...newBooks);
    await discount.save();
  }

  return await Discount.findById(discountId)
    .populate('applicableBooks', 'title price author');
};

// Gỡ discount khỏi sách
const removeFromBooks = async (discountId, bookIds) => {
  const discount = await Discount.findById(discountId);
  if (!discount) throw new Error('Discount not found');

  discount.applicableBooks = discount.applicableBooks.filter(
    id => !bookIds.includes(id.toString())
  );
  await discount.save();

  return await Discount.findById(discountId)
    .populate('applicableBooks', 'title price author');
};

// Lấy discount đang active cho 1 book (dùng nội bộ)
const getActiveDiscountForBook = async (bookId) => {
  const now = new Date();
  const discount = await Discount.findOne({
    applicableBooks: bookId,
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now }
  });
  return discount;
};

// Tính giá sau giảm (dùng nội bộ)
const calculateDiscountedPrice = (originalPrice, discount) => {
  if (!discount) return null;

  let discountedPrice = originalPrice;

  // Ưu tiên giảm theo phần trăm trước
  if (discount.discountPercentage > 0) {
    discountedPrice = originalPrice * (1 - discount.discountPercentage / 100);
  } else if (discount.discountAmount > 0) {
    discountedPrice = originalPrice - discount.discountAmount;
  }

  // Không cho giá âm
  return Math.max(0, Math.round(discountedPrice));
};

module.exports = {
  createDiscount,
  getAllDiscounts,
  getDiscountById,
  updateDiscount,
  deleteDiscount,
  applyToBooks,
  removeFromBooks,
  getActiveDiscountForBook,
  calculateDiscountedPrice
};

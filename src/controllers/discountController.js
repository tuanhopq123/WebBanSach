const discountService = require('../services/discountService');

const createDiscount = async (req, res) => {
  try {
    const discount = await discountService.createDiscount(req.body);
    res.status(201).json({ success: true, data: discount });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllDiscounts = async (req, res) => {
  try {
    const discounts = await discountService.getAllDiscounts();
    res.status(200).json({ success: true, data: discounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDiscountById = async (req, res) => {
  try {
    const discount = await discountService.getDiscountById(req.params.id);
    res.status(200).json({ success: true, data: discount });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const updateDiscount = async (req, res) => {
  try {
    const discount = await discountService.updateDiscount(req.params.id, req.body);
    res.status(200).json({ success: true, data: discount });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteDiscount = async (req, res) => {
  try {
    await discountService.deleteDiscount(req.params.id);
    res.status(200).json({ success: true, message: 'Discount deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Gán discount cho sách
const applyToBooks = async (req, res) => {
  try {
    const { bookIds } = req.body;
    if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
      return res.status(400).json({ success: false, message: 'bookIds là mảng bắt buộc' });
    }
    const discount = await discountService.applyToBooks(req.params.id, bookIds);
    res.status(200).json({ success: true, data: discount, message: 'Đã gán discount cho sách' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Gỡ discount khỏi sách
const removeFromBooks = async (req, res) => {
  try {
    const { bookIds } = req.body;
    if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
      return res.status(400).json({ success: false, message: 'bookIds là mảng bắt buộc' });
    }
    const discount = await discountService.removeFromBooks(req.params.id, bookIds);
    res.status(200).json({ success: true, data: discount, message: 'Đã gỡ discount khỏi sách' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDiscount,
  getAllDiscounts,
  getDiscountById,
  updateDiscount,
  deleteDiscount,
  applyToBooks,
  removeFromBooks
};

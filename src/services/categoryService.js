const Category = require('../models/Category.model');

const createCategory = async (data) => {
  const { name, description } = data;
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    throw new Error('Category already exists');
  }
  return await Category.create({ name, description });
};

const getAllCategories = async () => {
  return await Category.find();
};

const getCategoryById = async (id) => {
  const category = await Category.findById(id);
  if (!category) throw new Error('Category not found');
  return category;
};

const updateCategory = async (id, data) => {
  const category = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!category) throw new Error('Category not found');
  return category;
};

const deleteCategory = async (id) => {
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new Error('Category not found');
  return category;
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};

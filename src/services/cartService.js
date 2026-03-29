const Cart = require('../models/Cart.model');
const Book = require('../models/Book.model');

const getCartByUserId = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.book');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

const addToCart = async (userId, bookId, quantity) => {
  const book = await Book.findById(bookId);
  if (!book) throw new Error('Book not found');
  if (book.stockQuantity < quantity) throw new Error('Not enough stock');

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(item => item.book.toString() === bookId.toString());

  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity += quantity;
    if (cart.items[existingItemIndex].quantity > book.stockQuantity) {
      throw new Error('Not enough stock for the total quantity requested');
    }
  } else {
    cart.items.push({ book: bookId, quantity });
  }

  await cart.save();
  return await Cart.findById(cart._id).populate('items.book');
};

const updateCartItemQuantity = async (userId, bookId, quantity) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new Error('Cart not found');

  const itemIndex = cart.items.findIndex(item => item.book.toString() === bookId.toString());
  if (itemIndex === -1) throw new Error('Item not found in cart');

  if (quantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    const book = await Book.findById(bookId);
    if (!book) throw new Error('Book not found');
    if (book.stockQuantity < quantity) throw new Error('Not enough stock');
    
    cart.items[itemIndex].quantity = quantity;
  }

  await cart.save();
  return await Cart.findById(cart._id).populate('items.book');
};

const clearCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return cart;
};

module.exports = {
  getCartByUserId,
  addToCart,
  updateCartItemQuantity,
  clearCart
};

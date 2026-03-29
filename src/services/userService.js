const User = require('../models/User.model');
const Role = require('../models/Role.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_key', {
    expiresIn: '30d',
  });
};

const registerUser = async (data) => {
  const { username, email, password } = data;

  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    throw new Error('User already exists');
  }

  let role = await Role.findOne({ name: 'Customer' });
  if (!role) {
    role = await Role.create({ name: 'Customer', description: 'Default role' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    role: role._id
  });

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: role.name,
    token: generateToken(user._id)
  };
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).populate('role');
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role.name,
    token: generateToken(user._id)
  };
};

const getAllUsers = async () => {
  return await User.find().select('-password').populate('role', 'name');
};

const getUserById = async (id) => {
  const user = await User.findById(id).select('-password').populate('role', 'name');
  if (!user) throw new Error('User not found');
  return user;
};

const updateUser = async (id, data) => {
  if (data.password) {
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(data.password, salt);
  }
  const user = await User.findByIdAndUpdate(id, data, { new: true })
    .select('-password').populate('role', 'name');
  if (!user) throw new Error('User not found');
  return user;
};

const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error('User not found');
  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};

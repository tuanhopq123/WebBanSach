require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Role = require('../models/Role.model');

const seedUsers = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công!');

    // 1. Tạo 3 Role: Admin, Staff, Customer (nếu chưa tồn tại)
    const roles = ['Admin', 'Staff', 'Customer'];
    const roleMap = {};

    for (const roleName of roles) {
      let role = await Role.findOne({ name: roleName });
      if (!role) {
        role = await Role.create({ name: roleName, description: `${roleName} role` });
        console.log(`✅ Đã tạo role: ${roleName}`);
      } else {
        console.log(`ℹ️  Role "${roleName}" đã tồn tại.`);
      }
      roleMap[roleName] = role._id;
    }

    // 2. Tạo tài khoản Admin
    const adminData = {
      username: 'admin',
      email: 'admin@webbansach.com',
      password: 'admin123',
      roleName: 'Admin'
    };

    // 3. Tạo tài khoản Staff
    const staffData = {
      username: 'staff',
      email: 'staff@webbansach.com',
      password: 'staff123',
      roleName: 'Staff'
    };

    for (const userData of [adminData, staffData]) {
      const existing = await User.findOne({
        $or: [{ email: userData.email }, { username: userData.username }]
      });

      if (existing) {
        console.log(`ℹ️  User "${userData.username}" đã tồn tại, bỏ qua.`);
        continue;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      await User.create({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: roleMap[userData.roleName]
      });

      console.log(`✅ Đã tạo user: ${userData.username} (${userData.roleName}) — mật khẩu: ${userData.password}`);
    }

    console.log('\n🎉 Seed hoàn tất!');
    console.log('┌──────────┬────────────────────────┬───────────┐');
    console.log('│ Username │ Email                  │ Password  │');
    console.log('├──────────┼────────────────────────┼───────────┤');
    console.log('│ admin    │ admin@webbansach.com   │ admin123  │');
    console.log('│ staff    │ staff@webbansach.com   │ staff123  │');
    console.log('└──────────┴────────────────────────┴───────────┘');

  } catch (error) {
    console.error('❌ Lỗi khi seed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối MongoDB.');
    process.exit(0);
  }
};

seedUsers();

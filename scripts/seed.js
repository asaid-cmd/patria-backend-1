require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../src/config/database');
const User = require('../src/models/User');
const Location = require('../src/models/Location');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Table = require('../src/models/Table');
const Customer = require('../src/models/Customer');
const { ROLES, TABLE_SECTIONS, CUSTOMER_TIER } = require('../src/config/constants');

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seed...');

    // Clear existing data
    await User.deleteMany({});
    await Location.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Table.deleteMany({});
    await Customer.deleteMany({});

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@patria.com',
      password: 'password123',
      role: ROLES.SUPER_ADMIN,
    });
    console.log('✅ Admin user created');

    // Create location
    const location = await Location.create({
      name: 'Main Branch',
      city: 'Cairo',
      phone: '+20123456789',
      email: 'main@patria.com',
      manager: admin._id,
    });
    console.log('✅ Location created');

    // Create categories
    const categories = await Category.insertMany([
      { name: 'Coffee', order: 1, isActive: true },
      { name: 'Pastries', order: 2, isActive: true },
      { name: 'Sandwiches', order: 3, isActive: true },
      { name: 'Desserts', order: 4, isActive: true },
      { name: 'Beverages', order: 5, isActive: true },
    ]);
    console.log('✅ Categories created');

    // Create products
    await Product.insertMany([
      {
        name: 'Espresso',
        sku: 'COFFEE-001',
        price: 25,
        categoryId: categories[0]._id,
        stockQty: 100,
        isActive: true,
      },
      {
        name: 'Cappuccino',
        sku: 'COFFEE-002',
        price: 35,
        categoryId: categories[0]._id,
        stockQty: 100,
        isActive: true,
      },
      {
        name: 'Croissant',
        sku: 'PASTRY-001',
        price: 30,
        categoryId: categories[1]._id,
        stockQty: 50,
        isActive: true,
      },
      {
        name: 'Beef Sandwich',
        sku: 'SAND-001',
        price: 60,
        categoryId: categories[2]._id,
        stockQty: 30,
        isActive: true,
      },
      {
        name: 'Chocolate Cake',
        sku: 'DESS-001',
        price: 45,
        categoryId: categories[3]._id,
        stockQty: 20,
        isActive: true,
      },
    ]);
    console.log('✅ Products created');

    // Create tables
    await Table.insertMany([
      { number: 1, capacity: 2, section: TABLE_SECTIONS.MAIN_HALL, status: 'available', locationId: location._id },
      { number: 2, capacity: 2, section: TABLE_SECTIONS.MAIN_HALL, status: 'available', locationId: location._id },
      { number: 3, capacity: 4, section: TABLE_SECTIONS.MAIN_HALL, status: 'available', locationId: location._id },
      { number: 4, capacity: 4, section: TABLE_SECTIONS.MAIN_HALL, status: 'available', locationId: location._id },
      { number: 1, capacity: 2, section: TABLE_SECTIONS.TERRACE, status: 'available', locationId: location._id },
      { number: 2, capacity: 2, section: TABLE_SECTIONS.TERRACE, status: 'available', locationId: location._id },
      { number: 1, capacity: 6, section: TABLE_SECTIONS.VIP, status: 'available', locationId: location._id },
    ]);
    console.log('✅ Tables created');

    // Create customers
    await Customer.insertMany([
      { name: 'Layla Ibrahim', email: 'layla@example.com', phone: '+201012345678', tier: CUSTOMER_TIER.GOLD, loyaltyPoints: 250 },
      { name: 'Ahmed El-Sayed', email: 'ahmed@example.com', phone: '+201087654321', tier: CUSTOMER_TIER.SILVER, loyaltyPoints: 150 },
      { name: 'Fatima Hassan', email: 'fatima@example.com', phone: '+201123456789', tier: CUSTOMER_TIER.BRONZE, loyaltyPoints: 50 },
    ]);
    console.log('✅ Customers created');

    console.log('✨ Database seeded successfully!');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();

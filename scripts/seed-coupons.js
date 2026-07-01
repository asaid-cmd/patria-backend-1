require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/database');
const Coupon = require('../src/models/Coupon');

const seedCoupons = async () => {
  try {
    await connectDB();
    console.log('Connected to DB...');

    const coupons = [
      {
        code: 'PATRIA20',
        discountType: 'percentage',
        discountValue: 20,
        maxUses: 1000,
        expiryDate: new Date('2027-01-01'),
        isActive: true,
      },
      {
        code: 'PATRIA50',
        discountType: 'fixed',
        discountValue: 50,
        maxUses: 1000,
        expiryDate: new Date('2027-01-01'),
        isActive: true,
      },
    ];

    for (const coupon of coupons) {
      await Coupon.findOneAndUpdate(
        { code: coupon.code },
        coupon,
        { upsert: true, new: true }
      );
      console.log(`✅ Coupon ${coupon.code} created/updated`);
    }

    console.log('Done!');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

seedCoupons();

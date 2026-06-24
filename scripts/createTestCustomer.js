require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('../src/models/Customer');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await Customer.findOne({ phone: '01000000001' });
  if (existing) {
    console.log('Account already exists — updating password...');
    existing.password = '123456';
    await existing.save();
    console.log('Password reset done.');
  } else {
    await Customer.create({
      name:          'Test Customer',
      phone:         '01000000001',
      email:         'test@patria.com',
      password:      '123456',
      phoneVerified: true,
      tier:          'Bronze',
      loyaltyPoints: 0,
      isActive:      true,
    });
    console.log('Test customer created successfully!');
  }

  console.log('\n=== LOGIN CREDENTIALS ===');
  console.log('Phone:    01000000001');
  console.log('Password: 123456');
  console.log('URL:      POST /api/mobile/auth/login');
  console.log('=========================\n');

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });

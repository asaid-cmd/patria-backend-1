const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: String,
  phone: String,
  address: String,
  city: String,
  contactPerson: String,
  contactPersonName: String,
  categories: [{ type: String }],
  paymentTerms: String,
  qualityRating: { type: Number, default: 0, min: 0, max: 5 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);

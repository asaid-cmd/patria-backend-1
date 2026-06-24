const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name:         { type: String, required: true, unique: true },
  description:  String,
  image:        String,
  icon:         String,
  isIngredient: { type: Boolean, default: false },
  order:        { type: Number, default: 0 },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);

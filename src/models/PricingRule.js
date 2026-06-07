const mongoose = require('mongoose');

const priceListItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  price: { type: Number, required: true },
}, { _id: false });

const priceListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  items: [priceListItemSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const pricingRuleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['bulk_discount', 'surcharge', 'loyalty_discount', 'seasonal'],
    default: 'bulk_discount',
  },
  adjustmentType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage',
  },
  value: { type: Number, required: true },
  minQuantity: { type: Number, default: 1 },
  applicableProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isActive: { type: Boolean, default: true },
  startDate: Date,
  endDate: Date,
}, { timestamps: true });

const PricingRule = mongoose.model('PricingRule', pricingRuleSchema);
const PriceList = mongoose.model('PriceList', priceListSchema);

module.exports = { PricingRule, PriceList };

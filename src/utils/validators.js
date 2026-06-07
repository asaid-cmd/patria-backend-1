const Joi = require('joi');

const validators = {
  // Auth
  registerSchema: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),

  loginSchema: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  resetPasswordSchema: Joi.object({
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  }),

  // User
  createUserSchema: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().required(),
    locationId: Joi.string(),
  }),

  updateUserSchema: Joi.object({
    name: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    role: Joi.string(),
    locationId: Joi.string(),
    phone: Joi.string(),
    avatar: Joi.string(),
  }).min(1),

  // Table
  createTableSchema: Joi.object({
    number: Joi.number().required(),
    capacity: Joi.number().required(),
    section: Joi.string().required(),
  }),

  // Reservation
  createReservationSchema: Joi.object({
    customerName: Joi.string().required(),
    phone: Joi.string().required(),
    numberOfPeople: Joi.number().min(1).required(),
    date: Joi.date().required(),
    time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    tableId: Joi.string(),
  }),

  // Product
  createProductSchema: Joi.object({
    name: Joi.string().required(),
    sku: Joi.string(),
    price: Joi.number().required(),
    categoryId: Joi.string().required(),
    lowStockThreshold: Joi.number().default(5),
    stockQty: Joi.number().default(0),
    isActive: Joi.boolean().default(true),
  }),

  // Order
  createOrderSchema: Joi.object({
    type: Joi.string().valid('dine_in', 'takeaway').required(),
    tableId: Joi.string(),
    items: Joi.array().items(Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
      price: Joi.number().required(),
      notes: Joi.string(),
    })).required(),
    notes: Joi.string(),
    locationId: Joi.string(),
  }),

  // Offer
  createOfferSchema: Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
    discountType: Joi.string().valid('percentage', 'fixed').required(),
    discountValue: Joi.number().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    productIds: Joi.array().items(Joi.string()),
  }),

  // Coupon
  createCouponSchema: Joi.object({
    code: Joi.string().uppercase().required(),
    discountType: Joi.string().valid('percentage', 'fixed').required(),
    discountValue: Joi.number().required(),
    maxUses: Joi.number(),
    expiryDate: Joi.date(),
  }),

  // Customer
  updateCustomerSchema: Joi.object({
    tier: Joi.string().valid('bronze', 'silver', 'gold'),
    loyaltyPoints: Joi.number(),
  }),

  // Subscription
  createSubscriptionSchema: Joi.object({
    customerId: Joi.string().required(),
    productId: Joi.string().required(),
    quantity: Joi.number().min(1).required(),
    frequency: Joi.string().valid('weekly', 'bi_weekly', 'monthly').required(),
    nextDeliveryDate: Joi.date().required(),
  }),

  // Transaction
  createTransactionSchema: Joi.object({
    type: Joi.string().valid('income', 'expense', 'salary').required(),
    statement: Joi.string().required(),
    category: Joi.string().required(),
    amount: Joi.number().required(),
    date: Joi.date().required(),
  }),

  // Shift
  openShiftSchema: Joi.object({
    cashierId: Joi.string().required(),
    locationId: Joi.string().required(),
    openingBalance: Joi.number().default(0),
  }),

  closeShiftSchema: Joi.object({
    shiftId: Joi.string().required(),
    closingBalance: Joi.number().required(),
    notes: Joi.string(),
  }),

  // Category
  createCategorySchema: Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
    icon: Joi.string(),
    order: Joi.number().default(0),
  }),

  updateCategorySchema: Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    icon: Joi.string(),
    order: Joi.number(),
    isActive: Joi.boolean(),
  }).min(1),

  // Kitchen
  updateKitchenOrderStatusSchema: Joi.object({
    itemIndex: Joi.number(),
    status: Joi.string().required(),
  }),

  // Location
  createLocationSchema: Joi.object({
    name: Joi.string().required(),
    address: Joi.string(),
    city: Joi.string(),
    phone: Joi.string(),
    email: Joi.string().email(),
    manager: Joi.string(),
  }),

  updateLocationSchema: Joi.object({
    name: Joi.string(),
    address: Joi.string(),
    city: Joi.string(),
    phone: Joi.string(),
    email: Joi.string().email(),
    manager: Joi.string(),
    isActive: Joi.boolean(),
  }).min(1),

  // Supplier
  createSupplierSchema: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email(),
    phone: Joi.string(),
    address: Joi.string(),
    city: Joi.string(),
    contactPerson: Joi.string(),
    contactPersonName: Joi.string(),
    categories: Joi.array().items(Joi.string()),
  }),

  updateSupplierSchema: Joi.object({
    name: Joi.string(),
    email: Joi.string().email(),
    phone: Joi.string(),
    address: Joi.string(),
    city: Joi.string(),
    contactPerson: Joi.string(),
    contactPersonName: Joi.string(),
    categories: Joi.array().items(Joi.string()),
    isActive: Joi.boolean(),
  }).min(1),

  // Location (Delivery Zone)
  createDeliveryZoneSchema: Joi.object({
    name: Joi.string().required(),
    address: Joi.string(),
    city: Joi.string(),
    phone: Joi.string(),
    email: Joi.string().email(),
    manager: Joi.string(),
    deliveryFee: Joi.number().min(0).default(0),
    minOrderAmount: Joi.number().min(0).default(0),
  }),

  updateDeliveryZoneSchema: Joi.object({
    name: Joi.string(),
    address: Joi.string(),
    city: Joi.string(),
    phone: Joi.string(),
    email: Joi.string().email(),
    manager: Joi.string(),
    deliveryFee: Joi.number().min(0),
    minOrderAmount: Joi.number().min(0),
    isActive: Joi.boolean(),
  }).min(1),

  // Review
  createReviewSchema: Joi.object({
    customerId: Joi.string(),
    customerName: Joi.string(),
    customerPhone: Joi.string(),
    orderId: Joi.string(),
    orderType: Joi.string(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string(),
    categories: Joi.array().items(Joi.string()),
  }),

  // Warehouse
  createWarehouseSchema: Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('main', 'sub').default('main'),
    address: Joi.string(),
    manager: Joi.string(),
  }),

  createInternalTransferSchema: Joi.object({
    fromWarehouseId: Joi.string().required(),
    toWarehouseId: Joi.string().required(),
    items: Joi.array().items(Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
    })).min(1).required(),
    notes: Joi.string(),
  }),

  // Purchase Order
  createPurchaseOrderSchema: Joi.object({
    supplierId: Joi.string().required(),
    warehouseId: Joi.string(),
    items: Joi.array().items(Joi.object({
      productId: Joi.string(),
      sku: Joi.string(),
      productName: Joi.string(),
      quantity: Joi.number().min(1).required(),
      unitCost: Joi.number().min(0).required(),
    })).min(1).required(),
    expectedDeliveryDate: Joi.date(),
    notes: Joi.string(),
  }),

  // Pricing Rule
  createPricingRuleSchema: Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('bulk_discount', 'surcharge', 'loyalty_discount', 'seasonal').default('bulk_discount'),
    adjustmentType: Joi.string().valid('percentage', 'fixed').default('percentage'),
    value: Joi.number().required(),
    minQuantity: Joi.number().min(1).default(1),
    applicableProductIds: Joi.array().items(Joi.string()),
    startDate: Joi.date(),
    endDate: Joi.date(),
  }),

  // Production Batch
  createBatchSchema: Joi.object({
    productId: Joi.string(),
    productName: Joi.string().required(),
    roastingDegree: Joi.string().valid('light', 'medium', 'dark').default('medium'),
    weightBefore: Joi.number().min(0),
    weightAfter: Joi.number().min(0),
    date: Joi.date(),
    ingredients: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      quantity: Joi.number().required(),
      unit: Joi.string(),
    })),
    notes: Joi.string(),
  }),

  verifyQualitySchema: Joi.object({
    outputMass: Joi.number().min(0).required(),
    moisturePercent: Joi.number().min(0).max(100),
    agtronIndex: Joi.number(),
    cuppingScore: Joi.number().min(0).max(100),
  }),

  // Driver
  createDriverSchema: Joi.object({
    name: Joi.string().required(),
    whatsappPhone: Joi.string().required(),
    vehicleType: Joi.string().valid('motorcycle', 'car', 'bicycle').default('motorcycle'),
    zones: Joi.array().items(Joi.string()),
    status: Joi.string().valid('active', 'offline').default('active'),
  }),

  // Dispatch
  dispatchSchema: Joi.object({
    driverId: Joi.string().required(),
    orderId: Joi.string().required(),
    zone: Joi.string(),
  }),
};

const validate = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  return { error, value };
};

module.exports = { validators, validate };

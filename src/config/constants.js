module.exports = {
  // User Roles
  ROLES: {
    SUPER_ADMIN: 'superadmin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    CASHIER: 'cashier',
    KITCHEN: 'kitchen',
    STAFF: 'staff',
  },

  // Table Sections
  TABLE_SECTIONS: {
    MAIN_HALL: 'main_hall',
    TERRACE: 'terrace',
    VIP: 'vip',
    COUNTER: 'counter',
  },

  // Table Status
  TABLE_STATUS: {
    AVAILABLE: 'available',
    UNAVAILABLE: 'unavailable',
  },

  // Reservation Status
  RESERVATION_STATUS: {
    ON_HOLD: 'on_hold',
    CONFIRMED: 'confirmed',
    SITTING: 'sitting',
    CANCELLED: 'cancelled',
    ENDED: 'ended',
  },

  // Order Type
  ORDER_TYPE: {
    DINE_IN: 'dine_in',
    TAKEAWAY: 'takeaway',
    DELIVERY: 'Delivery',
  },

  // Order Status
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY: 'ready',
    SERVED: 'served',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  // Delivery Status (driver steps)
  DELIVERY_STATUS: {
    PICKING_UP: 'Picking Up',
    PICKED_UP: 'Picked Up',
    DELIVERING: 'Delivering',
    NEAR_CUSTOMER: 'Near Customer',
    DELIVERED: 'Delivered',
    FAILED: 'Failed',
  },

  // Kitchen Status
  KITCHEN_STATUS: {
    PENDING: 'pending',
    PREPARING: 'preparing',
    READY: 'ready',
    SERVED: 'served',
  },

  // Payment Method
  PAYMENT_METHOD: {
    CASH: 'cash',
    CARD: 'card',
    MIX: 'mix',
    ONLINE: 'Online',
  },

  // Driver Shift Status
  DRIVER_SHIFT_STATUS: {
    ACTIVE: 'active',
    ENDED: 'ended',
  },

  // Discount Type
  DISCOUNT_TYPE: {
    PERCENTAGE: 'percentage',
    FIXED: 'fixed',
  },

  // Customer Tier
  CUSTOMER_TIER: {
    BRONZE: 'bronze',
    SILVER: 'silver',
    GOLD: 'gold',
  },

  // Subscription Frequency
  SUBSCRIPTION_FREQUENCY: {
    WEEKLY: 'weekly',
    BI_WEEKLY: 'bi_weekly',
    MONTHLY: 'monthly',
  },

  // Subscription Status
  SUBSCRIPTION_STATUS: {
    ACTIVE: 'active',
    PAUSED: 'paused',
    CANCELLED: 'cancelled',
  },

  // Payment Status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
  },

  // Transaction Type
  TRANSACTION_TYPE: {
    INCOME: 'income',
    EXPENSE: 'expense',
    SALARY: 'salary',
  },

  // Expense Category
  EXPENSE_CATEGORY: {
    RENT: 'rent',
    UTILITIES: 'utilities',
    SUPPLIES: 'supplies',
    MAINTENANCE: 'maintenance',
    MARKETING: 'marketing',
    OTHER: 'other',
  },

  // Shift Status
  SHIFT_STATUS: {
    OPEN: 'open',
    CLOSED: 'closed',
  },

  // Offer Status
  OFFER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  },

  // Roast Level (Coffee)
  ROAST_LEVEL: {
    LIGHT: 'light',
    MEDIUM: 'medium',
    DARK: 'dark',
  },

  // Grind Type (Coffee)
  GRIND_TYPE: {
    WHOLE_BEAN: 'whole_bean',
    ESPRESSO: 'espresso',
    DRIP: 'drip',
  },

  // Warehouse Type
  WAREHOUSE_TYPE: {
    MAIN: 'main',
    SUB: 'sub',
  },

  // Transfer Status
  TRANSFER_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },

  // Purchase Order Status
  PURCHASE_ORDER_STATUS: {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    RECEIVED: 'received',
    CANCELLED: 'cancelled',
  },

  // Payment Status (Purchase)
  PURCHASE_PAYMENT_STATUS: {
    UNPAID: 'unpaid',
    PARTIAL: 'partial',
    PAID: 'paid',
  },

  // Pricing Rule Type
  PRICING_RULE_TYPE: {
    BULK_DISCOUNT: 'bulk_discount',
    SURCHARGE: 'surcharge',
    LOYALTY_DISCOUNT: 'loyalty_discount',
    SEASONAL: 'seasonal',
  },

  // Production Status
  PRODUCTION_STATUS: {
    IN_PROGRESS: 'in_progress',
    QUALITY_CHECK: 'quality_check',
    COMPLETED: 'completed',
    REJECTED: 'rejected',
  },

  // Equipment Status
  EQUIPMENT_STATUS: {
    OPERATIONAL: 'operational',
    MAINTENANCE: 'maintenance',
    FAULTY: 'faulty',
  },

  // Driver Status
  DRIVER_STATUS: {
    ACTIVE: 'active',
    OFFLINE: 'offline',
    BUSY: 'busy',
  },

  // Vehicle Type
  VEHICLE_TYPE: {
    MOTORCYCLE: 'motorcycle',
    CAR: 'car',
    BICYCLE: 'bicycle',
  },

  // Review Category
  REVIEW_CATEGORY: {
    SERVICE_SPEED: 'Service speed',
    DRIVER_FRIENDLINESS: 'Driver friendliness',
    VALUE_FOR_MONEY: 'Value for money',
    FOOD_QUALITY: 'Food quality',
    PACKAGING: 'Packaging',
  },
};

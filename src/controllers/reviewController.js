const Review = require('../models/Review');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');

exports.getReviews = async (req, res) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const { rating, category, search } = req.query;

    const filter = {};
    if (rating) filter.rating = Number(rating);
    if (category) filter.categories = category;
    if (search) filter.customerName = { $regex: search, $options: 'i' };

    const reviews = await Review.find(filter)
      .populate('orderId', 'type createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(filter);

    const allReviews = await Review.find();
    const avgRating = allReviews.length
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allReviews.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });

    const categoryMap = {};
    allReviews.forEach(r => {
      (r.categories || []).forEach(cat => {
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      });
    });
    const highestRated = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    sendSuccess(res, {
      ...paginatedResult(reviews, total, page, limit),
      stats: {
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: allReviews.length,
        distribution,
        highestRated,
      },
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createReview = async (req, res) => {
  try {
    const { customerId, customerName, customerPhone, orderId, orderType, rating, comment, categories } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return sendError(res, 'Rating must be between 1 and 5', 400);
    }

    const review = await Review.create({
      customerId,
      customerName,
      customerPhone,
      orderId,
      orderType,
      rating,
      comment,
      categories: categories || [],
    });

    sendSuccess(res, { review }, 'Review created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.toggleVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return sendError(res, 'Review not found', 404);

    review.isVisible = !review.isVisible;
    await review.save();
    sendSuccess(res, { review }, 'Visibility updated');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);
    if (!review) return sendError(res, 'Review not found', 404);
    sendSuccess(res, null, 'Review deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

// Mobile: returns { review, isReviewed } (ERB shape)
exports.getReviewByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const review = await Review.findOne({ orderId });
    res.json({ review: review || null, isReviewed: !!review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mobile: accepts both `order` and `orderId`, plus `tags` field
exports.submitCustomerReview = async (req, res) => {
  try {
    // ERB sends `order` field; fallback to `orderId`
    const orderId  = req.body.order || req.body.orderId;
    const { rating, comment, tags } = req.body;

    if (!orderId) return res.status(400).json({ message: 'orderId مطلوب' });
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'التقييم يجب أن يكون بين 1 و 5' });
    }

    const existing = await Review.findOne({ orderId, customerId: req.user.id });
    if (existing) return res.status(409).json({ message: 'لقد قيّمت هذا الطلب مسبقًا' });

    const review = await Review.create({
      customerId: req.user.id,
      orderId,
      rating,
      comment,
      categories: tags || [],
    });

    // Mark order as reviewed
    const Order = require('../models/Order');
    await Order.findByIdAndUpdate(orderId, { isReviewed: true, rating, reviewComment: comment });

    res.status(201).json({ review, message: 'شكرًا على تقييمك' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

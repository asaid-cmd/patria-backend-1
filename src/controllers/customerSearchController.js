const CustomerSearch = require('../models/CustomerSearch');
const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.logSearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return sendError(res, 'query is required', 400);

    await CustomerSearch.create({ customerId: req.user.id, query: query.trim().toLowerCase() });
    sendSuccess(res, null, 'Search logged');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getLastSearch = async (req, res) => {
  try {
    const last = await CustomerSearch.findOne({ customerId: req.user.id }).sort({ createdAt: -1 });
    sendSuccess(res, { query: last ? last.query : null });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getTrending = async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const trending = await CustomerSearch.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$query', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, query: '$_id', count: 1 } },
    ]);
    sendSuccess(res, { trending });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await CustomerSearch.find({ customerId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('query createdAt');
    sendSuccess(res, { history });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.clearHistory = async (req, res) => {
  try {
    await CustomerSearch.deleteMany({ customerId: req.user.id });
    sendSuccess(res, null, 'Search history cleared');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

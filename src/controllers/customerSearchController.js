const CustomerSearch = require('../models/CustomerSearch');

exports.logSearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: 'query is required' });

    await CustomerSearch.create({ customerId: req.user.id, query: query.trim().toLowerCase() });
    res.status(201).json({});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLastSearch = async (req, res) => {
  try {
    const last = await CustomerSearch.findOne({ customerId: req.user.id }).sort({ createdAt: -1 });
    res.json({
      query:      last ? last.query : null,
      searchedAt: last ? last.createdAt : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.json(trending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await CustomerSearch.find({ customerId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('query createdAt');
    // Map createdAt → searchedAt to match ERB response schema
    res.json(history.map(h => ({ query: h.query, searchedAt: h.createdAt })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.clearHistory = async (req, res) => {
  try {
    await CustomerSearch.deleteMany({ customerId: req.user.id });
    res.json({});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

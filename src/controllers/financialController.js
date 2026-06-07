const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { TRANSACTION_TYPE } = require('../config/constants');
const { validators, validate } = require('../utils/validators');

exports.getFinancialOverview = async (req, res) => {
  try {
    const income = await Transaction.aggregate([
      { $match: { type: TRANSACTION_TYPE.INCOME } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const expenses = await Transaction.aggregate([
      { $match: { type: TRANSACTION_TYPE.EXPENSE } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const salaries = await Transaction.aggregate([
      { $match: { type: TRANSACTION_TYPE.SALARY } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalIncome = income[0]?.total || 0;
    const totalExpenses = (expenses[0]?.total || 0) + (salaries[0]?.total || 0);
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome ? ((netProfit / totalIncome) * 100).toFixed(2) : 0;

    sendSuccess(res, {
      totalRevenue: totalIncome,
      totalExpenses,
      netProfit,
      profitMargin: `${profitMargin}%`,
    });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    sendSuccess(res, { transactions });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const { error, value } = validate(validators.createTransactionSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const transaction = await Transaction.create(value);
    sendSuccess(res, { transaction }, 'Transaction created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

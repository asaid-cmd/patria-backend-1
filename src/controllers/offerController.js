const Offer = require('../models/Offer');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPaginationParams, paginatedResult } = require('../utils/pagination');
const { validators, validate } = require('../utils/validators');

exports.getOffers = async (req, res) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const offers = await Offer.find().populate('productIds').skip(skip).limit(limit);
    const total = await Offer.countDocuments();
    sendSuccess(res, paginatedResult(offers, total, page, limit));
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.createOffer = async (req, res) => {
  try {
    const { error, value } = validate(validators.createOfferSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const data = { ...value };
    if (req.file) data.bannerImage = req.file.path;
    const offer = await Offer.create(data);
    sendSuccess(res, { offer }, 'Offer created', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = validate(validators.createOfferSchema, req.body);
    if (error) {
      const messages = error.details.map(e => e.message).join(', ');
      return sendError(res, messages, 400);
    }

    const data = { ...value };
    if (req.file) data.bannerImage = req.file.path;
    const offer = await Offer.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!offer) return sendError(res, 'Offer not found', 404);
    sendSuccess(res, { offer });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.toggleOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findById(id);
    if (!offer) return sendError(res, 'Offer not found', 404);
    offer.status = offer.status === 'active' ? 'inactive' : 'active';
    await offer.save();
    sendSuccess(res, { offer });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    await Offer.findByIdAndDelete(id);
    sendSuccess(res, null, 'Offer deleted');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

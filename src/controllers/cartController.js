const Cart    = require('../models/Cart');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/* Create a stable string key from variant selections + notes.
   Same product with different variants → different fingerprint → separate cart line. */
function itemFingerprint(selectedVariants, notes) {
  const varStr = (selectedVariants || [])
    .map(v => `${v.group || ''}:${v.option || ''}`)
    .sort()
    .join('|');
  return `${varStr}__${(notes || '').trim()}`;
}

/* Sum price adjustments from selected variants. */
function calcVariantAdjustment(selectedVariants) {
  return (selectedVariants || []).reduce((sum, v) => sum + (Number(v.priceAdjustment) || 0), 0);
}

/* ── GET cart ─────────────────────────────────────────────────────────── */
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ customerId: req.user.id })
      .populate('items.productId', 'name price images');
    if (!cart) cart = { items: [], customerId: req.user.id };
    sendSuccess(res, { cart });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ── ADD item ─────────────────────────────────────────────────────────── */
exports.addToCart = async (req, res) => {
  try {
    const {
      productId, quantity = 1,
      customization, selectedVariants, selectedExtras, notes,
    } = req.body;
    if (!productId) return sendError(res, 'productId is required', 400);

    const product = await Product.findById(productId);
    if (!product) return sendError(res, 'Product not found', 404);

    const unitPrice = product.price + calcVariantAdjustment(selectedVariants);
    const fp        = itemFingerprint(selectedVariants, notes);

    let cart = await Cart.findOne({ customerId: req.user.id });
    if (!cart) cart = new Cart({ customerId: req.user.id, items: [] });

    // If same product + same variants + same notes already in cart → increment qty
    const existing = cart.items.find(
      i => i.productId?.toString() === String(productId) && itemFingerprint(i.selectedVariants, i.notes) === fp
    );

    if (existing) {
      existing.quantity += Number(quantity);
    } else {
      cart.items.push({
        productId,
        name:            product.name,
        price:           unitPrice,
        image:           product.images?.[0],
        quantity:        Number(quantity),
        customization,
        selectedVariants,
        selectedExtras,
        notes,
      });
    }

    await cart.save();
    sendSuccess(res, { cart }, 'Item added to cart', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ── UPDATE item ──────────────────────────────────────────────────────── */
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId }  = req.params;
    const { quantity, customization, selectedVariants, notes } = req.body;
    if (quantity !== undefined && quantity < 1) {
      return sendError(res, 'quantity must be >= 1', 400);
    }

    const cart = await Cart.findOne({ customerId: req.user.id });
    if (!cart) return sendError(res, 'Cart not found', 404);

    const item = cart.items.id(itemId);
    if (!item) return sendError(res, 'Cart item not found', 404);

    if (quantity !== undefined)      item.quantity        = Number(quantity);
    if (customization !== undefined) item.customization   = customization;
    if (notes !== undefined)         item.notes           = notes;
    if (selectedVariants !== undefined) {
      item.selectedVariants = selectedVariants;
      // Recalculate price with new variants
      const product = await Product.findById(item.productId).select('price').lean();
      if (product) {
        item.price = product.price + calcVariantAdjustment(selectedVariants);
      }
    }

    await cart.save();
    sendSuccess(res, { cart }, 'Cart item updated');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ── GET single item ─────────────────────────────────────────────────── */
exports.getCartItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customerId: req.user.id })
      .populate('items.productId', 'name price images variantGroups');
    if (!cart) return sendError(res, 'Cart not found', 404);

    const item = cart.items.id(req.params.itemId);
    if (!item) return sendError(res, 'Cart item not found', 404);

    sendSuccess(res, { item });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ── REMOVE item ─────────────────────────────────────────────────────── */
exports.removeCartItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customerId: req.user.id });
    if (!cart) return sendError(res, 'Cart not found', 404);

    cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
    await cart.save();
    sendSuccess(res, { cart }, 'Item removed from cart');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ── CLEAR cart ──────────────────────────────────────────────────────── */
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ customerId: req.user.id }, { items: [] });
    sendSuccess(res, null, 'Cart cleared');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

/* ── CONVERT cart → order items format ──────────────────────────────── */
exports.cartToOrderItems = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customerId: req.user.id })
      .populate('items.productId', 'name price');
    if (!cart || !cart.items.length) return sendSuccess(res, { items: [] });

    const items = cart.items.map(i => ({
      product:         i.productId,
      name:            i.name,
      quantity:        i.quantity,
      price:           i.price,
      customization:   i.customization,
      selectedVariants: i.selectedVariants,
      selectedExtras:  i.selectedExtras,
      notes:           i.notes,
    }));

    sendSuccess(res, { items });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

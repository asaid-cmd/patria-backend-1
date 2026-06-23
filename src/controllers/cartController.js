const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ customerId: req.user.id }).populate('items.productId', 'name price images');
    if (!cart) cart = { items: [], customerId: req.user.id };
    sendSuccess(res, { cart });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, customization, selectedVariants, selectedExtras, notes } = req.body;
    if (!productId) return sendError(res, 'productId is required', 400);

    const product = await Product.findById(productId);
    if (!product) return sendError(res, 'Product not found', 404);

    let cart = await Cart.findOne({ customerId: req.user.id });
    if (!cart) {
      cart = new Cart({ customerId: req.user.id, items: [] });
    }

    cart.items.push({
      productId,
      name: product.name,
      price: product.price,
      image: product.images?.[0],
      quantity,
      customization,
      selectedVariants,
      selectedExtras,
      notes,
    });

    await cart.save();
    sendSuccess(res, { cart }, 'Item added to cart', 201);
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return sendError(res, 'quantity must be >= 1', 400);

    const cart = await Cart.findOne({ customerId: req.user.id });
    if (!cart) return sendError(res, 'Cart not found', 404);

    const item = cart.items.id(itemId);
    if (!item) return sendError(res, 'Cart item not found', 404);

    item.quantity = quantity;
    await cart.save();
    sendSuccess(res, { cart }, 'Cart item updated');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.getCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ customerId: req.user.id });
    if (!cart) return sendError(res, 'Cart not found', 404);

    const item = cart.items.id(itemId);
    if (!item) return sendError(res, 'Cart item not found', 404);

    sendSuccess(res, { item });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ customerId: req.user.id });
    if (!cart) return sendError(res, 'Cart not found', 404);

    cart.items = cart.items.filter(i => i._id.toString() !== itemId);
    await cart.save();
    sendSuccess(res, { cart }, 'Item removed from cart');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ customerId: req.user.id }, { items: [] });
    sendSuccess(res, null, 'Cart cleared');
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

exports.cartToOrderItems = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customerId: req.user.id }).populate('items.productId', 'name price');
    if (!cart || !cart.items.length) return sendSuccess(res, { items: [] });

    const items = cart.items.map(i => ({
      product: i.productId,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      customization: i.customization,
      selectedVariants: i.selectedVariants,
      selectedExtras: i.selectedExtras,
      notes: i.notes,
    }));

    sendSuccess(res, { items });
  } catch (error) {
    sendError(res, error.message, 500, error);
  }
};

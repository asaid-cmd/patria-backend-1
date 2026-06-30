/**
 * Cart Controller
 * Response format matches ERB exactly — flat JSON, no wrapper.
 */

const Cart    = require('../models/Cart');
const Product = require('../models/Product');

/* Create a stable string key from variant selections + notes. */
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

/* Build ERB-compatible product sub-object for cart items. */
function cartProductShape(p) {
  if (!p) return null;
  const obj = p.toObject ? p.toObject() : p;

  const catObj = obj.category || obj.categoryId;
  const catName = typeof catObj === 'string' ? catObj : (catObj?.name || '');
  const inventory = obj.stockQty || obj.inventory || 0;

  return {
    _id:                    obj._id,
    name:                   obj.name,
    price:                  obj.price || 0,
    category:               catName,
    image:                  obj.images?.[0] || obj.image || null,
    totalInventory:         inventory,
    haveCustomizationOption: (obj.variantGroups || []).length > 0,
    id:                     obj._id ? String(obj._id) : '',
  };
}

/* Build ERB-compatible cart shape. */
async function cartShape(customerId) {
  const cart = await Cart.findOne({ customerId })
    .populate('items.productId', 'name price images image category categoryId stockQty inventory variantGroups');

  const items     = cart?.items || [];
  const total     = parseFloat(items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2));
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const mappedItems = items.map(i => ({
    product:          cartProductShape(i.productId),
    quantity:         i.quantity,
    price:            i.price,
    notes:            i.notes || '',
    specialRequests:  i.specialRequests || '',
    selectedVariants: i.selectedVariants || [],
    _id:              i._id,
  }));

  return { items: mappedItems, total, itemCount };
}

/* ── GET cart ─────────────────────────────────────────────────────────── */
exports.getCart = async (req, res) => {
  try {
    res.json(await cartShape(req.user.id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── ADD item ─────────────────────────────────────────────────────────── */
exports.addToCart = async (req, res) => {
  try {
    const {
      productId, quantity = 1,
      customization, selectedVariants, selectedExtras, notes,
    } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId مطلوب' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });

    const unitPrice = product.price + calcVariantAdjustment(selectedVariants);
    const fp        = itemFingerprint(selectedVariants, notes);

    let cart = await Cart.findOne({ customerId: req.user.id });
    if (!cart) cart = new Cart({ customerId: req.user.id, items: [] });

    const existing = cart.items.find(
      i =>
        i.productId?.toString() === String(productId) &&
        itemFingerprint(i.selectedVariants, i.notes) === fp
    );

    if (existing) {
      existing.quantity += Number(quantity);
    } else {
      cart.items.push({
        productId,
        name:             product.name,
        price:            unitPrice,
        image:            product.images?.[0],
        quantity:         Number(quantity),
        customization,
        selectedVariants,
        selectedExtras,
        notes,
      });
    }

    await cart.save();
    res.status(201).json({ ...(await cartShape(req.user.id)), message: 'تمت الإضافة للعربة' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── UPDATE item ──────────────────────────────────────────────────────── */
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity, customization, selectedVariants, notes } = req.body;
    if (quantity !== undefined && quantity < 1) {
      return res.status(400).json({ message: 'الكمية يجب أن تكون 1 أو أكثر' });
    }

    const cart = await Cart.findOne({ customerId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'العربة غير موجودة' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'العنصر غير موجود' });

    if (quantity !== undefined)      item.quantity        = Number(quantity);
    if (customization !== undefined) item.customization   = customization;
    if (notes !== undefined)         item.notes           = notes;
    if (selectedVariants !== undefined) {
      item.selectedVariants = selectedVariants;
      const p = await Product.findById(item.productId).select('price').lean();
      if (p) item.price = p.price + calcVariantAdjustment(selectedVariants);
    }

    await cart.save();
    res.json(await cartShape(req.user.id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── GET single item ─────────────────────────────────────────────────── */
exports.getCartItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customerId: req.user.id })
      .populate('items.productId', 'name price images variantGroups');
    if (!cart) return res.status(404).json({ message: 'العربة غير موجودة' });

    const raw = cart.items.id(req.params.itemId);
    if (!raw) return res.status(404).json({ message: 'العنصر غير موجود' });

    // Return ERB-compatible shape: `product` field (populated), not raw `productId`
    res.json({
      _id:              raw._id,
      product:          raw.productId,
      name:             raw.name,
      quantity:         raw.quantity,
      unitPrice:        raw.unitPrice,
      price:            raw.price,
      image:            raw.image,
      selectedVariants: raw.selectedVariants,
      notes:            raw.notes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── REMOVE item ─────────────────────────────────────────────────────── */
exports.removeCartItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customerId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'العربة غير موجودة' });

    cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
    await cart.save();
    res.json(await cartShape(req.user.id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── CLEAR cart ──────────────────────────────────────────────────────── */
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ customerId: req.user.id }, { items: [] });
    res.json({ items: [], total: 0, itemCount: 0, message: 'تم تفريغ العربة' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── CONVERT cart → order items format ──────────────────────────────── */
exports.cartToOrderItems = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customerId: req.user.id })
      .populate('items.productId', 'name price');
    if (!cart || !cart.items.length) return res.json({ items: [] });

    const items = cart.items.map(i => ({
      product:          i.productId,
      name:             i.name,
      quantity:         i.quantity,
      price:            i.price,
      customization:    i.customization,
      selectedVariants: i.selectedVariants,
      selectedExtras:   i.selectedExtras,
      notes:            i.notes,
    }));

    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

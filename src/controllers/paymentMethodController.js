const PaymentMethod = require('../models/PaymentMethod');

exports.getPaymentMethods = async (req, res) => {
  try {
    const methods = await PaymentMethod.find({ customerId: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    res.json(methods);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addPaymentMethod = async (req, res) => {
  try {
    const { cardType, last4, cardholderName, expiryMonth, expiryYear, isDefault = false } = req.body;
    if (!cardType || !last4 || !cardholderName || !expiryMonth || !expiryYear) {
      return res.status(400).json({ message: 'cardType, last4, cardholderName, expiryMonth, expiryYear مطلوبة' });
    }

    if (isDefault) {
      await PaymentMethod.updateMany({ customerId: req.user.id }, { isDefault: false });
    }

    const method = await PaymentMethod.create({
      customerId: req.user.id,
      cardType, last4, cardholderName, expiryMonth, expiryYear, isDefault,
    });

    res.status(201).json(method);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePaymentMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findOneAndUpdate(
      { _id: req.params.id, customerId: req.user.id },
      req.body,
      { new: true }
    );
    if (!method) return res.status(404).json({ message: 'طريقة الدفع غير موجودة' });
    res.json(method);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePaymentMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findOneAndDelete({ _id: req.params.id, customerId: req.user.id });
    if (!method) return res.status(404).json({ message: 'طريقة الدفع غير موجودة' });
    res.json({ message: 'تم الحذف' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.setDefaultPaymentMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findOne({ _id: req.params.id, customerId: req.user.id });
    if (!method) return res.status(404).json({ message: 'طريقة الدفع غير موجودة' });

    await PaymentMethod.updateMany({ customerId: req.user.id }, { isDefault: false });
    method.isDefault = true;
    await method.save();

    res.json(method);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

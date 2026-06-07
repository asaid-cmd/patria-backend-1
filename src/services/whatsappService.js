const axios = require('axios');

const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    const url = `${process.env.WHATSAPP_API_URL}?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    const response = await axios.post(url, {}, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
};

const sendOrderConfirmation = async (phoneNumber, customerName, orderId) => {
  const message = `Hi ${customerName}, your order #${orderId} has been confirmed. Thank you!`;
  return sendWhatsAppMessage(phoneNumber, message);
};

const sendOfferNotification = async (phoneNumber, offerName) => {
  const message = `Check out our new offer: ${offerName}! Limited time only.`;
  return sendWhatsAppMessage(phoneNumber, message);
};

module.exports = { sendWhatsAppMessage, sendOrderConfirmation, sendOfferNotification };

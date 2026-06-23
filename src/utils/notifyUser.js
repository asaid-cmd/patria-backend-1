const { sendPushNotification }  = require('./fcm');
const UserNotification           = require('../models/UserNotification');
const Customer                   = require('../models/Customer');

/**
 * Save a notification to the customer inbox AND send FCM push.
 *
 * @param {object} opts
 * @param {string}  opts.customerId - Customer._id
 * @param {string}  opts.type       - UserNotification type enum
 * @param {string}  opts.title      - Notification title
 * @param {string}  opts.body       - Notification body
 * @param {object}  [opts.data]     - Deep-link data { screen, orderId, … }
 * @param {string}  [opts.orderId]  - Order ObjectId
 * @param {string}  [opts.orderRef] - Human-readable order number e.g. "1042"
 */
async function notifyUser({ customerId, type, title, body, data = {}, orderId = null, orderRef = null }) {
  if (!customerId) return;

  const saved = await UserNotification.create({
    customerId,
    type,
    title,
    body,
    orderId:  orderId  || null,
    orderRef: orderRef || null,
    data,
  });

  try {
    const customer = await Customer.findById(customerId).select('fcmTokens').lean();
    if (customer?.fcmTokens?.length) {
      await sendPushNotification(customer.fcmTokens, title, body, {
        screen:         data.screen || 'notifications',
        notificationId: String(saved._id),
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [String(k), v == null ? '' : String(v)])
        ),
      });
    }
  } catch (err) {
    console.error('[notifyUser] Push failed:', err.message);
  }

  return saved;
}

module.exports = { notifyUser };

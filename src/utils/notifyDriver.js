const { sendDriverPushNotification } = require('./fcm');
const DriverNotification              = require('../models/DriverNotification');
const Driver                          = require('../models/Driver');

/**
 * Save a notification to the driver inbox AND send FCM push.
 *
 * @param {object} opts
 * @param {string}  opts.driverId  - Driver._id
 * @param {string}  opts.type      - DriverNotification type enum
 * @param {string}  opts.title     - Notification title
 * @param {string}  opts.body      - Notification body
 * @param {object}  [opts.data]    - Deep-link data
 * @param {string}  [opts.orderId] - Order ObjectId
 * @param {string}  [opts.orderRef]- Human-readable order number
 */
async function notifyDriver({ driverId, type, title, body, data = {}, orderId = null, orderRef = null }) {
  if (!driverId) return;

  const saved = await DriverNotification.create({
    driverId,
    type,
    title,
    body,
    orderId:  orderId  || null,
    orderRef: orderRef || null,
    data,
  });

  try {
    const driver = await Driver.findById(driverId).select('fcmTokens').lean();
    if (driver?.fcmTokens?.length) {
      await sendDriverPushNotification(driver.fcmTokens, title, body, {
        screen:         data.screen || 'notifications',
        notificationId: String(saved._id),
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [String(k), v == null ? '' : String(v)])
        ),
      });
    }
  } catch (err) {
    console.error('[notifyDriver] Push failed:', err.message);
  }

  return saved;
}

module.exports = { notifyDriver };

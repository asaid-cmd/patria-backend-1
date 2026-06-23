/**
 * FCM Utility — Firebase Admin SDK (two apps: customer + driver).
 *
 * Customer app:  FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/customer-service-account.json
 * Driver app:    FIREBASE_DRIVER_SERVICE_ACCOUNT_PATH=/path/to/driver-service-account.json
 *
 * If the env var is not set the functions will log a warning and skip (no crash).
 */

const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

const BATCH_SIZE = 500;

const appState = {
  customer: { initialized: false, error: null },
  driver:   { initialized: false, error: null },
};

const SA_FALLBACK = {
  customer: 'config/patria-app-firebase-service-account.json',
  driver:   'config/patria-rider-firebase-service-account.json',
};

function initApp(appName, envVar) {
  if (appState[appName].initialized) return true;
  if (admin.apps.find(a => a?.name === appName)) {
    appState[appName].initialized = true;
    return true;
  }

  const rawPath = process.env[envVar]?.trim() || SA_FALLBACK[appName];
  const resolved = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);

  if (!fs.existsSync(resolved)) {
    appState[appName].error = `Service account not found: ${resolved}`;
    return false;
  }

  try {
    const creds = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(creds) }, appName);
    appState[appName].initialized = true;
    return true;
  } catch (err) {
    appState[appName].error = err.message;
    console.error(`[FCM:${appName}] Init failed:`, err.message);
    return false;
  }
}

async function _sendBatch(appName, tokens, title, body, data = {}) {
  const unique = [...new Set((tokens || []).filter(Boolean))];
  if (!unique.length) return { sent: 0, failed: 0 };

  const app = admin.apps.find(a => a?.name === appName);
  if (!app) {
    console.warn(`[FCM:${appName}] App not initialized.`);
    return { skipped: true, sent: 0, failed: 0 };
  }

  const dataStrings = Object.fromEntries(
    Object.entries(data || {}).map(([k, v]) => [String(k), v == null ? '' : String(v)])
  );

  let successCount = 0;
  let failureCount = 0;
  const dead = [];

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const chunk = unique.slice(i, i + BATCH_SIZE);
    try {
      const resp = await app.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: { title, body },
        data: Object.keys(dataStrings).length ? dataStrings : undefined,
      });
      successCount += resp.successCount;
      failureCount += resp.failureCount;

      resp.responses.forEach((r, idx) => {
        if (!r.success) {
          const code = r.error?.code || '';
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            dead.push(chunk[idx]);
          }
        }
      });
    } catch (err) {
      console.error(`[FCM:${appName}] Batch error:`, err.message);
      failureCount += chunk.length;
    }
  }

  // Prune dead tokens
  if (dead.length) {
    try {
      if (appName === 'customer') {
        const Customer = require('../models/Customer');
        await Customer.updateMany(
          { fcmTokens: { $in: dead } },
          { $pull: { fcmTokens: { $in: dead } } }
        );
      } else {
        const Driver = require('../models/Driver');
        await Driver.updateMany(
          { fcmTokens: { $in: dead } },
          { $pull: { fcmTokens: { $in: dead } } }
        );
      }
    } catch (e) {
      console.error(`[FCM:${appName}] Token prune failed:`, e.message);
    }
  }

  return { sent: successCount, failed: failureCount };
}

async function sendPushNotification(tokens, title, body, data = {}) {
  if (!initApp('customer', 'FIREBASE_SERVICE_ACCOUNT_PATH')) {
    console.warn('[FCM:customer] Not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH.');
    return { skipped: true, sent: 0, failed: 0 };
  }
  return _sendBatch('customer', tokens, title, body, data);
}

async function sendDriverPushNotification(tokens, title, body, data = {}) {
  if (!initApp('driver', 'FIREBASE_DRIVER_SERVICE_ACCOUNT_PATH')) {
    console.warn('[FCM:driver] Not configured. Set FIREBASE_DRIVER_SERVICE_ACCOUNT_PATH.');
    return { skipped: true, sent: 0, failed: 0 };
  }
  return _sendBatch('driver', tokens, title, body, data);
}

module.exports = { sendPushNotification, sendDriverPushNotification };

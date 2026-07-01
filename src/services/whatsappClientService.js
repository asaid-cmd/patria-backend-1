/**
 * WhatsApp Web Client Service
 * Connects via QR scan — no API key needed.
 * GET /api/whatsapp/qr  → returns QR image to scan with phone
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');

let client = null;
let qrDataUrl = null;
let status = 'disconnected'; // disconnected | qr_ready | connected

function getClient() {
  return client;
}

function getStatus() {
  return { status, qrDataUrl };
}

function init() {
  if (client) return; // already initialized

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    puppeteer: {
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    },
  });

  client.on('qr', async (qr) => {
    status = 'qr_ready';
    qrDataUrl = await QRCode.toDataURL(qr);
    console.log('[WhatsApp] QR code ready — visit GET /api/whatsapp/qr');
  });

  client.on('ready', () => {
    status = 'connected';
    qrDataUrl = null;
    console.log('[WhatsApp] Client connected and ready!');
  });

  client.on('disconnected', (reason) => {
    status = 'disconnected';
    qrDataUrl = null;
    client = null;
    console.log('[WhatsApp] Disconnected:', reason);
  });

  client.initialize();
}

async function sendMessage(phone, message) {
  if (!client || status !== 'connected') {
    console.warn('[WhatsApp] Client not connected, skipping message');
    return { success: false, error: 'Client not connected' };
  }

  try {
    // Format phone: remove leading 0, add country code if needed
    let formatted = phone.replace(/\D/g, '');
    if (formatted.startsWith('0')) formatted = '20' + formatted.slice(1);
    if (!formatted.startsWith('20')) formatted = '20' + formatted;

    await client.sendMessage(`${formatted}@c.us`, message);
    return { success: true };
  } catch (err) {
    console.error('[WhatsApp] Send error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { init, getStatus, sendMessage, getClient };

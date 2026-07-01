const express = require('express');
const router  = express.Router();
const wa      = require('../services/whatsappClientService');

/* GET /api/whatsapp/status */
router.get('/status', (req, res) => {
  const { status } = wa.getStatus();
  res.json({ status });
});

/* GET /api/whatsapp/qr — returns QR image as HTML page to scan */
router.get('/qr', (req, res) => {
  const { status, qrDataUrl } = wa.getStatus();

  if (status === 'connected') {
    return res.send('<h2 style="color:green;font-family:sans-serif">✅ WhatsApp متصل وشغال!</h2>');
  }

  if (!qrDataUrl) {
    return res.send(`
      <h2 style="font-family:sans-serif">⏳ جاري تحضير QR Code...</h2>
      <p>Status: <b>${status}</b></p>
      <script>setTimeout(() => location.reload(), 3000)</script>
    `);
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>WhatsApp QR</title></head>
    <body style="text-align:center;font-family:sans-serif;padding:40px">
      <h2>امسح الـ QR Code بالواتساب</h2>
      <p>افتح واتساب → الإعدادات → الأجهزة المرتبطة → ربط جهاز</p>
      <img src="${qrDataUrl}" style="width:300px;height:300px" />
      <p><small>الصفحة بتتحدث تلقائي كل 5 ثواني</small></p>
      <script>setTimeout(() => location.reload(), 5000)</script>
    </body>
    </html>
  `);
});

/* POST /api/whatsapp/init — start the client */
router.post('/init', (req, res) => {
  wa.init();
  res.json({ message: 'WhatsApp client initializing...' });
});

module.exports = router;

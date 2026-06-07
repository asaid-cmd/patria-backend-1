const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

const sendReservationConfirmation = async (customerName, customerEmail, reservationDetails) => {
  const html = `
    <h1>Reservation Confirmation</h1>
    <p>Dear ${customerName},</p>
    <p>Your reservation has been confirmed!</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li>Date: ${reservationDetails.date}</li>
      <li>Time: ${reservationDetails.time}</li>
      <li>Party Size: ${reservationDetails.numberOfPeople}</li>
    </ul>
    <p>Thank you for choosing us!</p>
  `;
  return sendEmail(customerEmail, 'Reservation Confirmation', html);
};

module.exports = { sendEmail, sendReservationConfirmation };

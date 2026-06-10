const { Resend } = require('resend');
const { render } = require('@react-email/render');
require('@babel/preset-react'); // Force Vercel bundler to include this dependency
require('@babel/register')({
  presets: ['@babel/preset-react'],
  extensions: ['.jsx', '.js']
});
const { OrderConfirmation } = require('../routes/emails/OrderConfirmation.jsx');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOrderConfirmation({ to, customerName, orderItems, total, orderId }) {
  const html = await render(
    OrderConfirmation({ customerName, orderItems, total, orderId })
  );

  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to,
    subject: `Order Confirmed #${orderId}`,
    html,
  });

  if (error) console.error('Email send failed:', error);
  return data;
}

module.exports = { sendOrderConfirmation };

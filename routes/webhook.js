// routes/webhook.js

const express = require('express')
const router = express.Router()  // ← app nahi, router!

const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const { sendOrderConfirmation } = require('../lib/email')

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']

  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // TEST CASE 1: Respond with 200 immediately to Stripe
  res.json({ received: true });

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const prisma = req.app.get('prisma')

    // Simulate slow database connection (Test Case 1)
    console.log('⏳ Delaying processing for 5 seconds to simulate slow DB...');
    setTimeout(async () => {
      try {
        // ✅ Idempotency check: agar is session ka order pehle se hai, skip karo
        const existingOrder = await prisma.order.findUnique({
          where: { stripeSessionId: session.id }
        })

        if (existingOrder) {
          console.log('⚠️ Order already exists for session:', session.id, '— skipping')
          return;
        }

        const userId = session.metadata.userId;
        const cart = JSON.parse(session.metadata.cart || '[]');
        
        if (cart.length === 0) return;

        // Build Prisma items data and decrement stock operations
        const orderItemsData = cart.map(item => ({
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price)
        }));

        const transactionOperations = [
          ...cart.map(item => prisma.product.update({
            where: { id: parseInt(item.productId) },
            data: { stock: { decrement: parseInt(item.quantity) } }
          })),
          prisma.order.create({
            data: {
              userId: parseInt(userId),
              total: session.amount_total / 100,
              status: 'PAID',
              stripeSessionId: session.id,
              items: { create: orderItemsData }
            },
            include: { items: { include: { product: true } } }
          })
        ];

        // Execute transaction (atomically decrements stock and creates order)
        const results = await prisma.$transaction(transactionOperations);
        const order = results[results.length - 1]; // The order is the last operation

        console.log('✅ Order created:', order.id, 'for session:', session.id);

        try {
          const orderItems = order.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.price
          }));

          await sendOrderConfirmation({
            to: session.customer_details.email,
            customerName: session.customer_details.name,
            orderItems,
            total: session.amount_total / 100,
            orderId: order.id,
          });
        } catch (emailErr) {
          console.error('Failed to send confirmation email:', emailErr);
        }
      } catch (err) {
        // Unique constraint violation = duplicate (race condition)
        if (err.code === 'P2002') {
          console.log('⚠️ Duplicate order caught by DB constraint for session:', session.id);
        } else {
          console.error('Error processing webhook async:', err);
        }
      }
    }, 5000);
  }
})

module.exports = router  // ← yeh bhi zaroori hai
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const prisma = req.app.get('prisma')

    // ✅ Idempotency check: agar is session ka order pehle se hai, skip karo
    const existingOrder = await prisma.order.findUnique({
      where: { stripeSessionId: session.id }
    })

    if (existingOrder) {
      console.log('⚠️ Order already exists for session:', session.id, '— skipping')
      return res.json({ received: true })
    }

    // Metadata se details lo
    const { userId, productId, quantity, price } = session.metadata

    // Order banao with items (transaction mein)
    try {
      const order = await prisma.order.create({
        data: {
          userId: parseInt(userId),
          total: parseFloat(price) * parseInt(quantity),
          status: 'PAID',
          stripeSessionId: session.id,
          items: {
            create: [
              {
                productId: parseInt(productId),
                quantity: parseInt(quantity),
                price: parseFloat(price),
              }
            ]
          }
        },
        include: { items: true }
      })

      console.log('✅ Order created:', order.id, 'for session:', session.id)

      try {
        const product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
        await sendOrderConfirmation({
          to: session.customer_details.email,
          customerName: session.customer_details.name,
          orderItems: [{ name: product.name, quantity: parseInt(quantity), price: parseFloat(price) }],
          total: session.amount_total / 100,
          orderId: order.id,
        });
      } catch (emailErr) {
        console.error('Failed to send confirmation email:', emailErr);
      }
    } catch (err) {
      // Unique constraint violation = duplicate (race condition)
      if (err.code === 'P2002') {
        console.log('⚠️ Duplicate order caught by DB constraint for session:', session.id)
        return res.json({ received: true })
      }
      throw err
    }
  }

  res.json({ received: true })
})

module.exports = router  // ← yeh bhi zaroori hai
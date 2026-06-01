// routes/checkout.js

const express = require('express')
const router = express.Router()
const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

router.post('/', async (req, res) => {
  try {
    const { productId, quantity } = req.body

    // Product Prisma se lo (req se prisma milega)
    const prisma = req.app.get('prisma')
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    // Stripe Checkout Session banao
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
            },
            unit_amount: Math.round(product.price * 100), // cents mein
          },
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
      metadata: {
        userId: String(req.body.userId || 1),
        productId: String(productId),
        quantity: String(quantity),
        price: String(product.price),
      },
    })

    res.json({ url: session.url })

  } catch (error) {
    console.error('Stripe Error:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
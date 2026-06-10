// routes/checkout.js

const express = require('express')
const router = express.Router()
const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

router.post('/', async (req, res) => {
  try {
    const { items, userId } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    const prisma = req.app.get('prisma');
    const line_items = [];
    const cartData = [];

    // Verify stock and build line items
    for (const item of items) {
      const pId = parseInt(item.id || item.productId);
      const product = await prisma.product.findUnique({ where: { id: pId } });
      
      if (!product) {
        return res.status(404).json({ error: `Product ID ${pId} not found` });
      }
      
      // Test Case 2: Stock validation
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}. Only ${product.stock} left.` });
      }

      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: product.name },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.quantity,
      });

      cartData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
      metadata: {
        userId: String(userId || 1),
        cart: JSON.stringify(cartData)
      },
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ error: error.message });
  }
})

module.exports = router
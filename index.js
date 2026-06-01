// index.js

require('dotenv/config');
const express = require('express')
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// ── Prisma Setup ──────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── Express Setup ─────────────────────────
const app = express()

// Prisma ko app mein set karo
app.set('prisma', prisma)

// ⚠️ WEBHOOK PEHLE — express.json() se PEHLE!
const webhookRoute = require('./routes/webhook')
app.use('/api/webhook', webhookRoute)

// Baad mein yeh dono
app.use(express.json())
app.use(express.static('public'))

// ── Routes ────────────────────────────────
const checkoutRoute = require('./routes/checkout')
app.use('/api/checkout', checkoutRoute)

// Success/Cancel pages
app.get('/success', (req, res) => {
  res.send('<h1>✅ Payment Successful!</h1><a href="/">Back to Store</a>')
})
app.get('/cancel', (req, res) => {
  res.send('<h1>❌ Payment Cancelled</h1><a href="/">Back to Store</a>')
})

// ── Server Start ──────────────────────────
app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000')
})

// ── Functions ─────────────────────────────
async function createOrder(userId, productId, quantity) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.stock < quantity) throw new Error('Insufficient stock');

  const order = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    }),
    prisma.order.create({
      data: {
        userId,
        total: product.price * quantity,
        items: { create: { productId, quantity, price: product.price } },
      },
    }),
  ]);

  console.log('Order created:', order[1].id);
  return order[1];
}

module.exports = { createOrder }
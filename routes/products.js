const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

module.exports = router;

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const electronics = await prisma.category.create({ data: { name: 'Electronics' } });
  await prisma.product.createMany({
    data: [
      { name: 'Wireless Headphones', price: 79.99, stock: 50, categoryId: electronics.id },
      { name: 'USB-C Hub', price: 34.99, stock: 120, categoryId: electronics.id },
    ]
  });
  console.log('Seed complete');
}

main().finally(() => prisma.$disconnect());
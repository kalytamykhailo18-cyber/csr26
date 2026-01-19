import { PrismaClient, PaymentMode, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['error'],
});

async function main() {
  console.log('Starting seed...');

  // ============================================
  // 1. Create Global Settings
  // ============================================
  console.log('Creating settings...');

  const settings = [
    {
      key: 'PRICE_PER_KG',
      value: '0.11',
      description: 'Price per kg of plastic removal in EUR (currently €0.11)',
    },
    {
      key: 'CERTIFICATION_THRESHOLD',
      value: '10',
      description: 'EUR threshold for certification (currently €10)',
    },
    {
      key: 'DEFAULT_MULTIPLIER',
      value: '1',
      description: 'Default impact multiplier for new merchants',
    },
    {
      key: 'MONTHLY_BILLING_MINIMUM',
      value: '10',
      description: 'Minimum EUR for monthly billing charge',
    },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: setting,
    });
  }

  // ============================================
  // 2. Create Admin User
  // ============================================
  console.log('Creating admin user...');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@impactcsr26.it' },
    update: {},
    create: {
      email: 'admin@impactcsr26.it',
      firstName: 'Admin',
      lastName: 'CSR26',
      role: UserRole.ADMIN,
    },
  });

  console.log(`Admin user created: ${adminUser.id}`);

  // ============================================
  // 3. Create Sample Merchants
  // ============================================
  console.log('Creating sample merchants...');

  const conad = await prisma.merchant.upsert({
    where: { email: 'merchant@conad.it' },
    update: {},
    create: {
      name: 'Conad',
      email: 'merchant@conad.it',
      multiplier: 2,
      monthlyBilling: true,
    },
  });

  const altromercato = await prisma.merchant.upsert({
    where: { email: 'merchant@altromercato.it' },
    update: {},
    create: {
      name: 'Altromercato',
      email: 'merchant@altromercato.it',
      multiplier: 5,
      monthlyBilling: true,
    },
  });

  console.log(`Merchants created: ${conad.id}, ${altromercato.id}`);

  // ============================================
  // 4. Create Sample SKUs for all 6 cases
  // ============================================
  console.log('Creating sample SKUs...');

  // Case A: CLAIM - Merchant Prepaid (Supermarket Products)
  await prisma.sku.upsert({
    where: { code: 'LOT-CONAD-01' },
    update: {},
    create: {
      code: 'LOT-CONAD-01',
      name: 'Conad Deli Product - Prepaid',
      description: 'Supermarket product with prepaid plastic credits',
      paymentMode: PaymentMode.CLAIM,
      price: 0,
      weightGrams: 17,
      multiplier: 2,
      paymentRequired: false,
      validationRequired: false,
      merchantId: conad.id,
    },
  });

  // Case B: CLAIM - Merchant Funded Accumulation
  await prisma.sku.upsert({
    where: { code: 'FUNDED-01' },
    update: {},
    create: {
      code: 'FUNDED-01',
      name: 'Merchant Funded Allocation',
      description: 'Merchant pays on behalf of customer',
      paymentMode: PaymentMode.CLAIM,
      price: 5,
      paymentRequired: false,
      validationRequired: false,
      merchantId: conad.id,
    },
  });

  // Case C: PAY - Customer Pays (Checkout Suggestion)
  await prisma.sku.upsert({
    where: { code: 'PASTA-ARTISAN-01' },
    update: {},
    create: {
      code: 'PASTA-ARTISAN-01',
      name: 'Artisan Pasta - Customer Pay',
      description: 'Small shop product - customer pays environmental fee',
      paymentMode: PaymentMode.PAY,
      price: 0, // Amount selected by customer
      paymentRequired: true,
      validationRequired: false,
    },
  });

  // Case D: GIFT_CARD - Physical Card with Secret Code
  await prisma.sku.upsert({
    where: { code: 'GC-25EUR' },
    update: {},
    create: {
      code: 'GC-25EUR',
      name: 'Gift Card €25',
      description: 'Physical gift card worth €25',
      paymentMode: PaymentMode.GIFT_CARD,
      price: 25,
      paymentRequired: false,
      validationRequired: true,
    },
  });

  await prisma.sku.upsert({
    where: { code: 'GC-10EUR' },
    update: {},
    create: {
      code: 'GC-10EUR',
      name: 'Gift Card €10',
      description: 'Physical gift card worth €10',
      paymentMode: PaymentMode.GIFT_CARD,
      price: 10,
      paymentRequired: false,
      validationRequired: true,
    },
  });

  await prisma.sku.upsert({
    where: { code: 'GC-5EUR' },
    update: {},
    create: {
      code: 'GC-5EUR',
      name: 'Gift Card €5',
      description: 'Physical gift card worth €5',
      paymentMode: PaymentMode.GIFT_CARD,
      price: 5,
      paymentRequired: false,
      validationRequired: true,
    },
  });

  // Case E: ALLOCATION - E-commerce Integration (Post-Checkout)
  await prisma.sku.upsert({
    where: { code: 'ALLOC-ECOM-01' },
    update: {},
    create: {
      code: 'ALLOC-ECOM-01',
      name: 'E-commerce Allocation',
      description: 'Post-checkout allocation from partner e-commerce',
      paymentMode: PaymentMode.ALLOCATION,
      price: 0, // Amount comes from URL parameter
      paymentRequired: false,
      validationRequired: false,
      merchantId: altromercato.id,
    },
  });

  // ============================================
  // 5. Create Sample Gift Codes for testing
  // ============================================
  console.log('Creating sample gift codes...');

  const giftCodes = [
    { code: 'TEST-GC25-001', skuCode: 'GC-25EUR' },
    { code: 'TEST-GC25-002', skuCode: 'GC-25EUR' },
    { code: 'TEST-GC10-001', skuCode: 'GC-10EUR' },
    { code: 'TEST-GC10-002', skuCode: 'GC-10EUR' },
    { code: 'TEST-GC05-001', skuCode: 'GC-5EUR' },
    { code: 'TEST-GC05-002', skuCode: 'GC-5EUR' },
  ];

  for (const gc of giftCodes) {
    await prisma.giftCode.upsert({
      where: { code: gc.code },
      update: {},
      create: gc,
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

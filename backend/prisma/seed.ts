import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database...');

  // Create sample user
  const user = await prisma.user.upsert({
    where: { email: 'demo@finsync.com' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'demo@finsync.com',
      monthlyIncome: 5000,
    },
  });

  console.log('Created user:', user.email);

  // Create sample monthly income
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  await prisma.monthlyIncome.upsert({
    where: {
      userId_month: {
        userId: user.id,
        month: currentMonth,
      },
    },
    update: {},
    create: {
      userId: user.id,
      month: currentMonth,
      amount: 5000,
    },
  });

  console.log('Created monthly income for:', currentMonth);

  // Create sample commitments
  const commitments = [
    {
      userId: user.id,
      type: 'static',
      title: 'Rent',
      category: 'Housing',
      amount: 1200,
      recurring: true,
      shared: false,
      startDate: new Date(),
    },
    {
      userId: user.id,
      type: 'static',
      title: 'Car Payment',
      category: 'Transportation',
      amount: 350,
      recurring: true,
      shared: false,
      startDate: new Date(),
    },
    {
      userId: user.id,
      type: 'dynamic',
      title: 'Groceries',
      category: 'Food',
      amount: 400,
      recurring: true,
      shared: false,
      startDate: new Date(),
    },
    {
      userId: user.id,
      type: 'static',
      title: 'Phone Bill',
      category: 'Utilities',
      amount: 80,
      recurring: true,
      shared: false,
      startDate: new Date(),
    },
    {
      userId: user.id,
      type: 'dynamic',
      title: 'Entertainment',
      category: 'Entertainment',
      amount: 200,
      recurring: false,
      shared: false,
      startDate: new Date(),
    },
  ];

  for (const commitment of commitments) {
    const created = await prisma.commitment.upsert({
      where: {
        userId_title_category: {
          userId: commitment.userId,
          title: commitment.title,
          category: commitment.category,
        },
      },
      update: {},
      create: commitment,
    });
    console.log('Created commitment:', created.title);
  }

  console.log('Seeding completed!');
}

seed()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
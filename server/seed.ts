import { db } from './db';
import { users, commitments } from '@shared/schema';

async function seed() {
  console.log('Seeding database...');
  
  // Create a demo user
  const [user] = await db.insert(users).values({
    username: 'demo',
    password: 'password123',
    monthlyIncome: '5000.00'
  }).returning();

  console.log('Created user:', user);

  // Create demo commitments
  const demoCommitments = [
    {
      userId: user.id,
      title: 'Rent',
      amount: '1200.00',
      type: 'static' as const,
      category: 'Housing',
      isPaid: true,
      isShared: false,
    },
    {
      userId: user.id,
      title: 'Groceries',
      amount: '400.00',
      type: 'dynamic' as const,
      category: 'Food',
      isPaid: false,
      isShared: true,
      sharedWith: ['user2', 'user3']
    },
    {
      userId: user.id,
      title: 'Phone Bill',
      amount: '80.00',
      type: 'static' as const,
      category: 'Utilities',
      isPaid: false,
      isShared: false,
    }
  ];

  for (const commitment of demoCommitments) {
    const [created] = await db.insert(commitments).values(commitment).returning();
    console.log('Created commitment:', created);
  }

  console.log('Database seeding completed!');
}

seed().catch(console.error);
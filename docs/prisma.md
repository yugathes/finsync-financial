# Prisma ORM Documentation

This project has been migrated from Drizzle ORM to Prisma ORM for better type safety, tooling, and ecosystem support.

## Setup

### Installation
Prisma is already installed as a dependency:
```bash
npm install prisma @prisma/client
```

### Environment Variables
Add the following to your `.env` file:
```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

### Generate Prisma Client
```bash
npm run db:generate
```

### Database Operations
```bash
# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Schema

The database schema is defined in `prisma/schema.prisma` with the following models:

### User
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `password`: String (Optional)
- `monthlyIncome`: Decimal (Optional, defaults to 0)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### MonthlyIncome
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key to User)
- `month`: String (e.g., '2025-07')
- `amount`: Decimal
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Commitment
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key to User)
- `type`: String ('static' | 'dynamic')
- `title`: String
- `category`: String
- `amount`: Decimal
- `recurring`: Boolean (defaults to false)
- `shared`: Boolean (defaults to false)
- `groupId`: UUID (Optional)
- `startDate`: Date (Optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### CommitmentPayment
- `id`: UUID (Primary Key)
- `commitmentId`: UUID (Foreign Key to Commitment)
- `month`: String (e.g., '2025-07')
- `paidBy`: UUID (Foreign Key to User)
- `amountPaid`: Decimal
- `paidAt`: DateTime
- `createdAt`: DateTime

## Common Queries

### Users
```typescript
// Find user by ID
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// Create user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: 'hashedPassword'
  }
});

// Update user
const user = await prisma.user.update({
  where: { id: userId },
  data: { monthlyIncome: '5000' }
});
```

### Commitments
```typescript
// Get user's commitments
const commitments = await prisma.commitment.findMany({
  where: { userId: userId },
  orderBy: { createdAt: 'desc' }
});

// Get commitments with payments for a specific month
const commitments = await prisma.commitment.findMany({
  where: { userId: userId },
  include: {
    payments: {
      where: { month: '2025-07' }
    }
  }
});

// Create commitment
const commitment = await prisma.commitment.create({
  data: {
    userId: userId,
    type: 'static',
    title: 'Rent',
    category: 'Housing',
    amount: '1200',
    recurring: true
  }
});
```

### Payments
```typescript
// Mark commitment as paid
const payment = await prisma.commitmentPayment.create({
  data: {
    commitmentId: commitmentId,
    month: '2025-07',
    paidBy: userId,
    amountPaid: '1200'
  }
});

// Get payments for a month
const payments = await prisma.commitmentPayment.findMany({
  where: {
    paidBy: userId,
    month: '2025-07'
  }
});
```

## Best Practices

### Type Safety
- Use TypeScript types from `lib/types.ts`
- Always handle potential null values from database queries
- Use proper decimal handling for financial amounts

### Error Handling
```typescript
try {
  const user = await prisma.user.create({ data: userData });
  return user;
} catch (error) {
  console.error('Database error:', error);
  throw new Error('Failed to create user');
}
```

### Transactions
For operations that involve multiple models:
```typescript
const result = await prisma.$transaction(async (prisma) => {
  const commitment = await prisma.commitment.create({ data: commitmentData });
  const payment = await prisma.commitmentPayment.create({ data: paymentData });
  return { commitment, payment };
});
```

### Relations
Always use proper relation handling:
```typescript
// Include related data
const userWithCommitments = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    commitments: true,
    monthlyIncomes: true
  }
});
```

## Migration Notes

- All Drizzle ORM code has been replaced with Prisma equivalents
- Database schema remains identical
- API endpoints maintain the same interface
- Type definitions have been updated for Prisma compatibility
- Error handling patterns follow Prisma conventions

## Troubleshooting

### Generate Client Issues
If you can't generate the Prisma client due to network restrictions:
1. Ensure DATABASE_URL is properly configured
2. Check network connectivity to Prisma binaries
3. Use `npx prisma generate --help` for options

### Database Connection
Ensure your DATABASE_URL follows the correct PostgreSQL format:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### Type Errors
If you encounter type errors:
1. Run `npm run db:generate` to regenerate types
2. Restart your TypeScript server
3. Check that imports are correct in `lib/types.ts`
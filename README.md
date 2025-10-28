# FinSync Financial

A comprehensive financial management application built with React, Express, and Prisma ORM.

## 🔧 Recent Migration: Drizzle → Prisma ORM

This project has been **successfully migrated** from Drizzle ORM to Prisma ORM for enhanced type safety, better tooling, and improved developer experience.

### Migration Status ✅
- **Code Migration**: Complete
- **Database Schema**: Preserved
- **API Compatibility**: Maintained
- **Type Safety**: Enhanced
- **Documentation**: Updated

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation
```bash
npm install
```

### Environment Setup
Copy the example environment file and configure your database:
```bash
cp .env.example .env
```

Update `.env` with your database URL:
```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

### Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📊 Database Schema

The application uses the following main entities:

- **Users**: User accounts and authentication
- **Monthly Income**: Income tracking by month
- **Commitments**: Financial commitments and expenses
- **Commitment Payments**: Payment tracking for commitments

See `prisma/schema.prisma` for the complete schema definition.

## 🛠 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run client` - Start Vite client only
- `npm run check` - TypeScript type checking

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Build & Deploy
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm start` - Start production server

### Testing
- `npm run test:e2e` - Run E2E tests
- `npm run test:e2e:ui` - Run tests in UI mode
- `npm run test:e2e:headed` - Run tests with visible browser
- `npm run test:e2e:debug` - Run tests in debug mode
- `npm run test:e2e:report` - View test report
- `npm run test:e2e:codegen` - Record new tests

## 📁 Project Structure

```
├── client/                 # React frontend
├── server/                 # Express backend
│   ├── commitment/        # Commitment management
│   ├── income/           # Income tracking
│   ├── payment/          # Payment processing
│   ├── user/             # User management
│   ├── db.ts             # Database connection
│   └── storage.ts        # Data access layer
├── tests/                 # E2E test suite
│   ├── e2e/              # Test specifications
│   │   ├── auth.spec.ts
│   │   ├── dashboard.spec.ts
│   │   ├── commitments.spec.ts
│   │   ├── shared-commitments.spec.ts
│   │   └── import-records.spec.ts
│   └── utils/            # Test helpers
│       ├── loginHelper.ts
│       ├── createCommitmentHelper.ts
│       └── dbHelper.ts
├── lib/                   # Shared utilities
│   ├── prisma.ts         # Prisma client
│   └── types.ts          # TypeScript types
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema
└── docs/                 # Documentation
    ├── prisma.md         # Prisma ORM guide
    └── testing.md        # E2E testing guide
```

## 🔍 API Endpoints

### Users
- `POST /api/user/sync` - Sync user data

### Income
- `GET /api/income/:userId/:month` - Get monthly income
- `POST /api/income` - Set monthly income
- `PUT /api/income/:userId/:month` - Update monthly income

### Commitments
- `GET /api/commitments/:userId` - Get user commitments
- `GET /api/commitments/:userId/:month` - Get commitments for month
- `POST /api/commitments` - Create commitment
- `PUT /api/commitments/:id` - Update commitment
- `DELETE /api/commitments/:id` - Delete commitment

### Payments
- `POST /api/payments/:id/paid` - Mark commitment as paid
- `DELETE /api/payments/:id/:month` - Mark commitment as unpaid
- `GET /api/payments/:userId/:month` - Get payments for month

## 📚 Documentation

- [Prisma ORM Guide](./docs/prisma.md) - Complete guide to using Prisma in this project
- [E2E Testing Guide](./docs/testing.md) - Comprehensive testing documentation
- [Test Suite README](./tests/README.md) - Quick reference for E2E tests

## 🧪 Testing

The project includes a comprehensive E2E test suite using Playwright + TypeScript.

### Quick Start
```bash
# Install test dependencies
npm install
npx playwright install chromium

# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests with visible browser
npm run test:e2e:headed

# View test report
npm run test:e2e:report
```

### Test Coverage
✅ Authentication flows (register, login, logout, protected routes)  
✅ Dashboard functionality with real-time updates  
✅ Commitment CRUD operations with deletion support  
✅ Shared commitments and group management  
✅ Historical data import (CSV/JSON)  
✅ Database verification for all operations  
✅ Dashboard recalculation after changes  

### Documentation
- [Complete Testing Guide](./docs/testing.md) - Comprehensive E2E testing documentation
- [Test Suite README](./tests/README.md) - Quick reference for running tests
- [GitHub Actions Workflow](./.github/workflows/e2e.yml) - CI/CD configuration

### CI/CD Integration
E2E tests automatically run on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

## 🔧 Migration Notes

### From Drizzle to Prisma
The migration from Drizzle ORM to Prisma ORM was completed with:
- Zero breaking changes to the API
- Preserved database schema
- Enhanced type safety
- Improved development tooling

Legacy Drizzle files have been backed up:
- `drizzle.config.ts.backup`
- `db/schema.drizzle.ts.backup`

### Validation
Run the migration validation script:
```bash
./validate-migration.sh
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## 📄 License

MIT License

## 🆘 Troubleshooting

### Prisma Client Generation
If you encounter issues generating the Prisma client:
```bash
npm run db:generate
```

### Database Connection
Ensure your `DATABASE_URL` is correctly formatted:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### Build Issues
Clean and reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

For more detailed troubleshooting, see [docs/prisma.md](./docs/prisma.md#troubleshooting).
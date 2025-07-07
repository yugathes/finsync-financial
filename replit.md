# FinSync - Financial Commitment Tracker

## Project Overview
FinSync is a comprehensive financial commitment tracking application that helps users manage their monthly expenses, commitments, and financial goals. The app provides a clean, modern interface for tracking both static and dynamic financial commitments.

## Architecture
- **Frontend**: React with TypeScript, Tailwind CSS, Shadcn/UI components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with custom design system
- **Development**: Vite for build tooling and hot reload

## Key Features
- User management with monthly income tracking
- Financial commitment management (static/dynamic)
- Shared commitment support
- Real-time balance calculations
- Professional financial UI with gradients and shadows
- Responsive design for mobile and desktop

## Database Schema
### Users Table
- id (primary key)
- username (unique)
- password
- monthlyIncome (decimal)
- createdAt, updatedAt (timestamps)

### Commitments Table
- id (primary key)
- userId (foreign key)
- title
- amount (decimal)
- type (static/dynamic)
- category
- isPaid (boolean)
- isShared (boolean)
- sharedWith (array of user IDs)
- dueDate (optional)
- createdAt, updatedAt (timestamps)

## API Endpoints
- **Users**: POST /api/users, GET /api/users/:id, PUT /api/users/:id/income
- **Commitments**: GET /api/commitments/user/:userId, POST /api/commitments, PUT /api/commitments/:id, DELETE /api/commitments/:id, PUT /api/commitments/:id/toggle

## Recent Changes
- **2025-07-06**: Successfully migrated from Lovable to Replit
- **2025-07-06**: Added PostgreSQL database integration
- **2025-07-06**: Created comprehensive API for financial data management
- **2025-07-06**: Fixed UI styling issues with custom Tailwind classes
- **2025-07-06**: Implemented database seeding for testing

## User Preferences
- Professional, clean UI design
- Focus on financial data security
- Responsive design for all devices

## Development Notes
- Uses Drizzle ORM for type-safe database operations
- Environment variables managed through Replit secrets
- Development server runs on port 5000
- Database migrations handled via `npm run db:push`
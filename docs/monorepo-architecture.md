# FinSync Financial - Monorepo Architecture

## Project Structure

```
finsync-financial/
├── client/                    # React + Vite frontend
│   ├── src/                  # Frontend source code
│   ├── public/               # Static assets
│   ├── Dockerfile            # Production frontend container
│   ├── Dockerfile.dev        # Development frontend container
│   └── package.json          # Frontend dependencies
├── server/                   # Node.js + Express backend
│   ├── commitment/           # Commitment management routes
│   ├── dashboard/            # Dashboard routes
│   ├── income/               # Income management routes
│   ├── payment/              # Payment management routes
│   ├── user/                 # User management routes
│   ├── utils/                # Shared utilities
│   ├── __tests__/            # Backend tests
│   ├── prisma/               # Database schema & migrations
│   ├── lib/                  # Shared libraries
│   ├── Dockerfile            # Production backend container
│   └── package.json          # Backend dependencies
├── docker/                   # Docker configurations
│   ├── nginx.conf            # Nginx configuration for frontend
│   └── postgres/             # PostgreSQL initialization
├── docs/                     # Project documentation
└── docker-compose.yml        # Multi-service orchestration
```

## Development Workflow

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (or use Docker version)

### Setup

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment files
   cp .env.example .env
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   
   # Update database URLs and secrets
   ```

3. **Database Setup**
   ```bash
   # Start PostgreSQL with Docker
   docker-compose up database -d
   
   # Or use local PostgreSQL and update DATABASE_URL
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   ```

### Development

#### Option 1: Local Development
```bash
# Start both frontend and backend
npm run dev

# Or start separately
npm run dev:backend  # Backend on port 3000
npm run dev:frontend # Frontend on port 5173
```

#### Option 2: Docker Development
```bash
# Start all services including database
npm run docker:up:dev

# Or start specific services
docker-compose --profile dev up frontend-dev backend database
```

### Production

#### Local Build
```bash
npm run build
npm run docker:build
npm run docker:up
```

#### Production Deployment
```bash
docker-compose up -d
```

## API Documentation

- **Swagger UI**: http://localhost:3000/api/docs
- **API Spec**: http://localhost:3000/api/docs/spec

## Architecture Changes

### Before (Vite-Integrated Backend)
- Single server (port 5000) serving both API and static files
- Vite middleware integrated into Express for development
- Mixed concerns between frontend serving and API logic

### After (Monorepo with Separated Concerns)
- **Frontend**: Dedicated React + Vite application (port 5173/80)
- **Backend**: Pure Express.js API server (port 3000)
- **Database**: Containerized PostgreSQL with proper initialization
- **Reverse Proxy**: Nginx handles frontend and API routing in production

### Benefits
1. **Clear Separation**: Frontend and backend are completely independent
2. **Scalability**: Each service can be scaled independently
3. **Development Experience**: Hot reload for both services
4. **Production Ready**: Proper containerization with health checks
5. **Testing**: Dedicated test environment with test database
6. **Documentation**: Auto-generated API documentation
7. **Security**: Proper CORS, helmet, and environment separation

## Environment Configuration

### Development
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Database: localhost:5432
- API Docs: http://localhost:3000/api/docs

### Production
- All services behind Nginx on port 80
- API available at /api/* paths
- Health checks and restart policies configured

## Testing

### Backend Tests
```bash
npm run test:backend        # Run all backend tests
npm run test:backend --watch # Watch mode
npm run test:coverage       # Coverage report
```

### Frontend Tests
Frontend testing framework can be added based on team preference (Jest, Vitest, etc.)

## Database Management

```bash
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema changes
npm run db:migrate    # Create and run migrations
npm run db:studio     # Open Prisma Studio
```

## Monitoring and Logging

- **Backend**: Winston logger with configurable levels
- **Database**: Health checks and connection monitoring
- **Docker**: Health checks for all services
- **Nginx**: Access and error logs
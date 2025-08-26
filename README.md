# FinSync Financial - Monorepo

A modern financial management application built with a separated monorepo architecture featuring React frontend, Express.js backend, and PostgreSQL database.

## 🏗️ Architecture

This project has been refactored from a Vite-integrated backend to a clean monorepo structure:

- **Frontend**: React + TypeScript + Vite (port 5173)
- **Backend**: Express.js + TypeScript + Prisma ORM (port 3000)  
- **Database**: PostgreSQL (containerized)
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest for backend
- **Containerization**: Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (recommended)
- PostgreSQL (if not using Docker)

### Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd finsync-financial
   npm install
   ```

2. **Environment configuration**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit environment files with your configuration
   ```

3. **Start with Docker (Recommended)**
   ```bash
   # Development with hot reload
   npm run docker:up:dev
   
   # Production
   npm run docker:up
   ```

4. **Or start locally**
   ```bash
   # Start database
   docker-compose up database -d
   
   # Generate Prisma client and run migrations
   npm run db:generate
   npm run db:migrate
   
   # Start both frontend and backend
   npm run dev
   ```

## 📁 Project Structure

```
finsync-financial/
├── frontend/                 # React frontend application
│   ├── src/                 # Source code
│   ├── public/              # Static assets
│   ├── Dockerfile           # Production container
│   └── package.json
├── backend/                 # Express.js backend API
│   ├── commitment/          # Commitment routes & services
│   ├── dashboard/           # Dashboard routes & services
│   ├── income/              # Income routes & services
│   ├── payment/             # Payment routes & services
│   ├── user/                # User routes & services
│   ├── utils/               # Utilities (logger, swagger)
│   ├── __tests__/           # Test suites
│   ├── prisma/              # Database schema & migrations
│   ├── Dockerfile           # Production container
│   └── package.json
├── docker/                  # Docker configurations
├── docs/                    # Documentation
└── docker-compose.yml       # Multi-service orchestration
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev                  # Start both frontend & backend
npm run dev:frontend         # Start frontend only
npm run dev:backend          # Start backend only

# Build
npm run build               # Build both applications
npm run build:frontend      # Build frontend only
npm run build:backend       # Build backend only

# Testing
npm run test                # Run backend tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Generate coverage report

# Database
npm run db:generate         # Generate Prisma client
npm run db:migrate          # Run database migrations
npm run db:push            # Push schema changes
npm run db:studio          # Open Prisma Studio

# Docker
npm run docker:up          # Start production containers
npm run docker:up:dev      # Start development containers
npm run docker:down        # Stop containers
npm run docker:build       # Build containers
```

### Development URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Database**: localhost:5432 (when using Docker)

## 🧪 Testing

Backend testing is set up with Jest and Supertest:

```bash
npm run test:backend        # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

Test files are located in `backend/__tests__/` directory.

## 📚 API Documentation

Interactive API documentation is available at:
- **Development**: http://localhost:3000/api/docs
- **Production**: http://your-domain.com/api/docs

The API specification follows OpenAPI 3.0 standards with Swagger UI.

## 🐳 Docker Deployment

### Development
```bash
docker-compose --profile dev up
```

### Production
```bash
docker-compose up -d
```

### Services
- **frontend**: Nginx serving React app (port 80)
- **backend**: Express.js API server (port 3000)
- **database**: PostgreSQL with initialization scripts
- **frontend-dev**: Vite dev server (development profile only)

## 🔧 Configuration

### Environment Variables

#### Root `.env`
```env
NODE_ENV=development
DATABASE_NAME=finsync
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
```

#### Backend `.env`
```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finsync
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=debug
```

#### Frontend `.env`
```env
VITE_API_URL=http://localhost:3000
```

## 🔄 Migration from Previous Architecture

This project has been migrated from a Vite-integrated backend to a clean monorepo:

### Before
- Single server handling both API and static file serving
- Vite middleware integrated into Express
- Mixed development/production concerns

### After  
- Separated frontend (React + Vite) and backend (Express.js)
- Independent scaling and deployment
- Clear development/production boundaries
- Proper containerization with Docker

## 📖 Documentation

- [Monorepo Architecture](./docs/monorepo-architecture.md)
- [Original Architecture](./docs/architecture.md) 
- [Prisma ORM Guide](./docs/prisma.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
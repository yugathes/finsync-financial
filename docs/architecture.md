# Project Architecture: Monorepo Backend & Frontend Integration

> **Note**: This project has been refactored to a monorepo structure with separated frontend and backend services. See [monorepo-architecture.md](./monorepo-architecture.md) for the new architecture.

## Entry Points

- **Backend entry point:** `server/index.ts`
  - Pure Express.js API server running on port 3000
  - No longer integrates with Vite for development or production
- **Frontend entry point:** `client/index.html` (served by Vite during development)
  - Dedicated React application served by Vite dev server on port 5173
  - Built and served by Nginx in production

## How the Backend and Frontend Run Together

### Development
- **Frontend:**
  - Run with `npm run dev:frontend` (which runs `vite`)
  - Vite serves the React app from `client/` on port 5173
  - Proxies API requests to backend on port 3000
- **Backend:**
  - Run with `npm run dev:backend` (which runs `tsx index.ts`)
  - Express API is served from `server/index.ts` on port 3000
  - Independent from frontend, no Vite integration

**During development, frontend and backend run as completely separate processes.**
- The frontend makes API requests to the backend via proxy configuration
- CORS is properly configured in Express for cross-origin requests

### Production
- **Frontend**: Built static files served by Nginx on port 80
- **Backend**: Express API server running on port 3000
- **Nginx**: Reverse proxy routes `/api/*` to backend, serves static files for all other routes

## How They Connect
- **Frontend** (React, Vite) makes HTTP requests to backend API endpoints (e.g., `/api/users`, `/api/dashboard`, etc.)
- **Backend** (Express) serves only API endpoints, no static file serving
- **Production**: Nginx handles routing between frontend and backend services

## Database Architecture
- **PostgreSQL**: Containerized database with proper initialization
- **Prisma ORM**: Type-safe database operations
- **Migrations**: Versioned database schema changes
- **Test Database**: Separate database for testing isolation

## Summary
- **Development:** Two independent servers with proxy for API calls
- **Production:** Nginx serves frontend and proxies API to backend
- **Database:** Containerized PostgreSQL with Prisma ORM
- **Entry points:** `server/index.ts` (API), `client/index.html` (UI)
- **Documentation:** API docs available at `/api/docs`

---

For detailed setup and deployment instructions, see [monorepo-architecture.md](./monorepo-architecture.md).

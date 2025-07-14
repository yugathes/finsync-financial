# Project Architecture: Backend & Frontend Integration

## Entry Points

- **Backend entry point:** `server/index.ts`
  - This file starts the Express server and registers all API routes.
- **Frontend entry point:** `client/index.html` (served by Vite during development)

## How the Backend and Frontend Run Together

### Development
- **Frontend:**
  - Run with `npm run client` (which runs `vite`).
  - Vite serves the React app from `client/` on its own dev server (default: port 5173).
- **Backend:**
  - Run with `npm run dev` (which runs `tsx watch ... server/index.ts`).
  - Express API is served from `server/index.ts` (default: port 3000 or as configured).
  - The backend watches only the `server/` directory for changes and restarts automatically.

**During development, frontend and backend run as separate processes.**
- The frontend makes API requests to the backend (e.g., `/api/...` endpoints) using the backend's port.
- You may need to configure CORS in Express for local development.

### Production
- Run `npm run build` to build both frontend and backend.
- The backend (Express) serves the static frontend files (from Vite's build output, usually `dist/`).
- The same Express server handles both API requests and static file serving, so everything runs on a single port.

## How They Connect
- **Frontend** (React, Vite) makes HTTP requests (usually via `fetch` or `axios`) to the backend API endpoints (e.g., `/api/users`, `/api/dashboard`, etc.).
- **Backend** (Express) handles these API requests and also serves the built frontend files in production.

## Summary
- **Development:** Two servers (Vite for frontend, Express for backend), connected via HTTP API calls.
- **Production:** One server (Express) serves both API and static frontend files.
- **Entry points:** `server/index.ts` (backend), `client/index.html` (frontend).

---

For more details, see the scripts in `package.json` and the structure of the `server/` and `client/` folders.

# FinSync - Financial Commitment Tracker

## Overview

FinSync is a modern financial commitment tracking application built with React, TypeScript, and Node.js. It helps users manage their monthly financial commitments, track expenses, and maintain budget awareness through an intuitive web interface.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with custom styling
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks with TanStack Query for server state
- **Routing**: React Router for client-side navigation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: In-memory storage with planned database migration

### Design System
- **Theme**: Custom "FinSync" financial app theme with blue primary colors
- **Component Library**: Shadcn/ui components with financial-specific variants
- **Typography**: Modern typography with clear hierarchy
- **Icons**: Lucide React icons for consistency

## Key Components

### Frontend Components
- **Dashboard**: Main financial overview with balance cards and commitment lists
- **Commitment Management**: Form-based commitment creation and editing
- **Balance Tracking**: Real-time income vs. commitment calculations
- **Responsive Design**: Mobile-first approach with floating action buttons

### Backend Components
- **Storage Interface**: Abstracted storage layer supporting both memory and database backends
- **Express Server**: RESTful API structure with error handling middleware
- **Database Schema**: User management with extensible commitment tracking
- **Development Tools**: Hot reload and runtime error overlay for development

### Database Schema
- **Users Table**: Basic user authentication with username/password
- **Extensible Design**: Schema ready for commitment, category, and sharing features

## Data Flow

1. **User Interface**: React components manage local state and user interactions
2. **API Layer**: Express routes handle HTTP requests and business logic
3. **Storage Layer**: Abstracted storage interface allows switching between memory and database
4. **Database**: PostgreSQL stores persistent user and commitment data
5. **Real-time Updates**: TanStack Query manages server state synchronization

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **express**: Web application framework
- **@radix-ui/***: Accessible UI component primitives

### Development Dependencies
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for Node.js
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-***: Replit-specific development tools

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Neon Database with connection pooling
- **Environment Variables**: DATABASE_URL for database connection

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: ESBuild bundles Node.js server code
- **Deployment**: Single-command deployment with `npm run build` and `npm start`

### Build Process
1. Frontend assets compiled to `dist/public`
2. Backend compiled to `dist/index.js`
3. Database migrations applied via `drizzle-kit push`

## Changelog

```
Changelog:
- July 06, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
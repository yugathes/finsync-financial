# Deployment Guide

This guide covers deployment strategies for the FinSync Financial monorepo application.

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL (if not using Docker)

## Environment Configuration

### Root Environment (`.env`)
```env
NODE_ENV=production
DATABASE_NAME=finsync
DATABASE_USER=postgres
DATABASE_PASSWORD=secure_password_here
LOG_LEVEL=info
```

### Backend Environment (`backend/.env`)
```env
PORT=3000
DATABASE_URL=postgresql://postgres:secure_password_here@database:5432/finsync
FRONTEND_URL=https://your-domain.com
LOG_LEVEL=info
SESSION_SECRET=very_secure_session_secret_here
```

### Frontend Environment (`frontend/.env`)
```env
VITE_API_URL=https://your-domain.com
```

## Deployment Options

### 1. Docker Compose (Recommended)

#### Production Deployment
```bash
# Clone the repository
git clone https://github.com/your-username/finsync-financial.git
cd finsync-financial

# Set up environment variables
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit environment files with your production values
nano .env
nano backend/.env
nano frontend/.env

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

#### Development with Docker
```bash
# Start development environment with hot reload
docker-compose --profile dev up

# Or start specific services
docker-compose up database -d
docker-compose --profile dev up frontend-dev backend
```

### 2. Manual Deployment

#### Backend Deployment
```bash
cd backend

# Install dependencies
npm ci --only=production

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Build the application
npm run build

# Start the production server
npm start
```

#### Frontend Deployment
```bash
cd frontend

# Install dependencies
npm ci --only=production

# Build the application
npm run build

# Serve with a static file server (nginx, apache, etc.)
# Build output is in the 'dist' directory
```

### 3. Cloud Deployment

#### AWS Deployment
```bash
# Use AWS ECS with the provided Dockerfiles
# Or deploy to AWS Elastic Beanstalk with Docker

# Upload docker-compose.yml to Elastic Beanstalk
# Configure environment variables in EB console
```

#### Heroku Deployment
```bash
# Install Heroku CLI
# Create separate apps for frontend and backend

# Backend
heroku create finsync-api
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set NODE_ENV=production
git subtree push --prefix backend heroku main

# Frontend
heroku create finsync-app
heroku buildpacks:set heroku/nodejs
heroku config:set VITE_API_URL=https://finsync-api.herokuapp.com
git subtree push --prefix frontend heroku main
```

#### DigitalOcean App Platform
```bash
# Use the provided .do/app.yaml configuration
# Deploy via DigitalOcean App Platform console
```

## Database Setup

### Initial Setup
```bash
# Run migrations
npm run db:migrate --workspace=backend

# Seed sample data (optional)
npm run db:seed --workspace=backend
```

### Backup and Restore
```bash
# Backup
docker-compose exec database pg_dump -U postgres finsync > backup.sql

# Restore
docker-compose exec -T database psql -U postgres finsync < backup.sql
```

## SSL/TLS Configuration

### Let's Encrypt with Nginx
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    root /var/www/finsync/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring and Logging

### Health Checks
```bash
# Backend health check
curl https://your-domain.com/api/health

# Database health check
docker-compose exec database pg_isready -U postgres
```

### Log Management
```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rotate logs
docker-compose logs --since 1h backend > backend-$(date +%Y%m%d).log
```

### Performance Monitoring
- Set up application monitoring (e.g., New Relic, DataDog)
- Configure error tracking (e.g., Sentry)
- Monitor database performance

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use strong passwords and secrets
- Rotate secrets regularly

### Database Security
- Use strong database passwords
- Limit database access to application only
- Enable database connection encryption
- Regular security updates

### Application Security
- Keep dependencies updated
- Use HTTPS in production
- Implement rate limiting
- Regular security audits

## Scaling Considerations

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  backend:
    deploy:
      replicas: 3
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
```

### Database Scaling
- Read replicas for read-heavy workloads
- Connection pooling (PgBouncer)
- Database partitioning for large datasets

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database is running
docker-compose ps database

# Check database logs
docker-compose logs database

# Test connection
docker-compose exec backend npm run db:studio
```

#### Build Failures
```bash
# Clear Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew
```

### Rollback Strategy
```bash
# Rollback to previous version
git checkout previous-tag
docker-compose down
docker-compose up -d

# Database rollback
# Restore from backup if needed
```

## Performance Optimization

### Frontend Optimization
- Enable gzip compression in Nginx
- Use CDN for static assets
- Implement browser caching
- Code splitting and lazy loading

### Backend Optimization
- Database query optimization
- Implement caching (Redis)
- Use connection pooling
- Optimize Docker images

### Database Optimization
- Add proper indexes
- Query optimization
- Regular VACUUM and ANALYZE
- Monitor slow queries

## Maintenance

### Regular Tasks
- Security updates
- Database maintenance
- Log rotation
- Certificate renewal
- Backup verification

### Monitoring Checklist
- [ ] Application health checks
- [ ] Database performance
- [ ] SSL certificate expiration
- [ ] Disk space usage
- [ ] Error rates and logs
- [ ] Response times
- [ ] User activity metrics
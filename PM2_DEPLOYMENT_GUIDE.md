# PM2 Deployment Guide

## 🚀 Quick Start

### Local Development with PM2
```bash
# Install PM2 globally (one-time setup)
npm install -g pm2

# Deploy locally
./scripts/deploy.sh development
```

### Production Deployment
```bash
# Deploy to production
./scripts/deploy.sh production
```

## 📋 Commands Reference

### Basic PM2 Commands
```bash
# Start application
pm2 start ecosystem.config.js

# Start with specific environment
pm2 start ecosystem.config.js --env production

# View all processes
pm2 list

# Monitor dashboard
pm2 monit

# View logs
pm2 logs finsync-financial

# Restart application
pm2 restart finsync-financial

# Graceful reload (zero downtime)
pm2 reload finsync-financial

# Stop application
pm2 stop finsync-financial

# Delete application from PM2
pm2 delete finsync-financial
```

### Package.json Scripts
```bash
# Development
yarn dev                    # Start with nodemon (hot reload)

# Building
yarn build                  # Build for development
yarn build:staging          # Build for staging
yarn build:production       # Build for production

# PM2 Management
yarn pm2:start             # Start with PM2 (development)
yarn pm2:start:staging     # Start with PM2 (staging)
yarn pm2:start:production  # Start with PM2 (production)
yarn pm2:stop              # Stop PM2 process
yarn pm2:restart           # Restart PM2 process
yarn pm2:reload            # Graceful reload
yarn pm2:logs              # View logs
yarn pm2:monit             # Monitor dashboard

# Full Deployment
yarn deploy:local          # Build and deploy locally
yarn deploy:staging        # Build and deploy to staging
yarn deploy:production     # Build and deploy to production
```

## 🔧 Configuration

### Environment Files
- `.env` - Development environment
- `.env.staging` - Staging environment (create if needed)
- `.env.production` - Production environment

### PM2 Configuration (`ecosystem.config.js`)
- **Clustering**: Uses all available CPU cores
- **Auto-restart**: Automatically restarts on crashes
- **Memory limit**: Restarts if memory exceeds 1GB
- **Health checks**: HTTP health check on `/api/health`
- **Logging**: Structured logging to `./logs/`

## 📊 Monitoring

### Health Checks
```bash
# Check application health
curl http://localhost:5000/api/health

# Check static files health
curl http://localhost:5000/health/static
```

### PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# Process information
pm2 show finsync-financial

# Memory and CPU usage
pm2 list
```

### Log Management
```bash
# View all logs
pm2 logs

# View specific app logs
pm2 logs finsync-financial

# Flush logs
pm2 flush

# Log rotation (setup once)
pm2 install pm2-logrotate
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find process using port 5000
   lsof -i :5000
   
   # Kill process
   kill -9 <PID>
   ```

2. **Application won't start**
   ```bash
   # Check logs for errors
   pm2 logs finsync-financial --lines 50
   
   # Check if build exists
   ls -la dist/
   ```

3. **Database connection issues**
   ```bash
   # Test database connection
   yarn prisma db push
   
   # Generate Prisma client
   yarn prisma:generate
   ```

4. **Memory issues**
   ```bash
   # Check memory usage
   pm2 monit
   
   # Restart if needed
   pm2 restart finsync-financial
   ```

### Performance Optimization

1. **Enable clustering** (already configured)
2. **Set memory limits** (already configured)
3. **Configure log rotation**
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:compress true
   ```

## 🔒 Production Best Practices

1. **Environment Variables**
   - Never commit `.env.production` to git
   - Use secrets management for sensitive data
   - Rotate keys regularly

2. **Security**
   - Run PM2 as non-root user
   - Use reverse proxy (nginx) in front of Node.js
   - Enable HTTPS
   - Set up firewall rules

3. **Monitoring**
   - Set up external monitoring (Uptime Robot, DataDog)
   - Configure alerts for crashes
   - Monitor database performance

4. **Backup**
   - Regular database backups
   - Code deployment backups
   - PM2 configuration backups

## 🚀 Server Setup (Production)

### Initial Server Setup
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Yarn
npm install -g yarn

# Create application user
sudo useradd -m -s /bin/bash deploy
sudo mkdir -p /var/www
sudo chown deploy:deploy /var/www
```

### Application Deployment
```bash
# Clone repository
git clone <repository-url> /var/www/finsync-financial
cd /var/www/finsync-financial

# Install dependencies
yarn install

# Setup environment
cp .env.production.example .env.production
# Edit .env.production with your values

# Deploy
./scripts/deploy.sh production

# Setup PM2 to start on boot
pm2 startup
pm2 save
```

## 📈 Scaling

### Horizontal Scaling
- Use PM2 cluster mode (already configured)
- Add load balancer (nginx)
- Multiple server instances

### Vertical Scaling
- Increase server resources
- Adjust PM2 instance count
- Optimize database connections

### Database Scaling
- Connection pooling (already configured)
- Read replicas
- Database optimization
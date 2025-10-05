#!/bin/bash

# FinSync Financial - PM2 Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environment: development|staging|production

set -e  # Exit on any error

ENVIRONMENT=${1:-development}
PROJECT_NAME="finsync-financial"

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Please install PM2 globally:"
    echo "npm install -g pm2"
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if the app is already running
if pm2 list | grep -q "$PROJECT_NAME"; then
    print_warning "Application is already running. Stopping it first..."
    pm2 stop $PROJECT_NAME
    pm2 delete $PROJECT_NAME
fi

# Install dependencies
print_status "Installing dependencies..."
yarn install

# Generate Prisma client
print_status "Generating Prisma client..."
yarn prisma:generate

# Build the application
case $ENVIRONMENT in
    "production")
        print_status "Building for production..."
        yarn build:production
        ;;
    "staging")
        print_status "Building for staging..."
        yarn build:staging
        ;;
    *)
        print_status "Building for development..."
        yarn build
        ;;
esac

# Start the application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env $ENVIRONMENT

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script (run only once per server)
if [ "$ENVIRONMENT" = "production" ]; then
    print_status "Setting up PM2 startup script..."
    pm2 startup
fi

print_status "✅ Deployment completed successfully!"
print_status "🔍 You can monitor the application with: pm2 monit"
print_status "📊 View logs with: pm2 logs $PROJECT_NAME"
print_status "🔄 Restart with: pm2 restart $PROJECT_NAME"

echo
echo "📋 Quick Commands:"
echo "  pm2 list                 - List all processes"
echo "  pm2 logs $PROJECT_NAME   - View logs"
echo "  pm2 monit                - Monitor dashboard"
echo "  pm2 restart $PROJECT_NAME - Restart app"
echo "  pm2 stop $PROJECT_NAME    - Stop app"
echo "  pm2 delete $PROJECT_NAME  - Delete app"
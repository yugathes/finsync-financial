module.exports = {
  apps: [
    {
      name: 'finsync-financial',
      script: './dist/index.js',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      max_memory_restart: '1G',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      listen_timeout: 8000,
      health_check_http: {
        url: 'http://localhost:5000/api/health',
        interval: 30000,
        timeout: 5000,
      },
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm Z',
    },
  ],
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/finsync-financial.git',
      path: '/var/www/finsync-financial',
      'pre-deploy-local': '',
      'post-deploy':
        'yarn install && yarn build:production && yarn prisma:deploy && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': '',
    },
    staging: {
      user: 'deploy',
      host: 'staging-server.com',
      ref: 'origin/staging',
      repo: 'git@github.com:your-username/finsync-financial.git',
      path: '/var/www/finsync-financial-staging',
      'post-deploy':
        'yarn install && yarn build:staging && yarn prisma:deploy && pm2 reload ecosystem.config.cjs --env staging',
    },
  },
};

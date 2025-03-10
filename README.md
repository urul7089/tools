# Multi-Tools Platform

A comprehensive platform offering various code formatting and analysis tools with an analytics dashboard.

## Features

### Formatting Tools
- JavaScript/TypeScript Formatter
- CSS Formatter
- HTML Formatter
- YAML Formatter
- CSV Formatter

### Analytics Dashboard
- Real-time usage statistics
- Performance metrics
- Error tracking
- Interactive charts
- Detailed data tables

### Security Features
- JWT-based authentication
- Two-factor authentication
- Rate limiting
- Session management

### Data Export
- Multiple formats (CSV, Excel, PDF, JSON)
- Scheduled automated exports
- Email delivery
- File compression
- Custom filtering

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- SMTP server for email notifications

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/multi-tools.git
cd multi-tools
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRY=30m

# SMTP Configuration
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourcompany.com

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Security Configuration

### Two-Factor Authentication
1. Generate a new secret key:
```javascript
const speakeasy = require('speakeasy');
const secret = speakeasy.generateSecret();
console.log(secret.base32); // Use this as your 2FA secret
```

2. Update the secret in `api/auth.js`:
```javascript
const adminUser = {
    email: process.env.ADMIN_EMAIL,
    passwordHash: 'your-hashed-password',
    twoFactorSecret: 'your-2fa-secret'
};
```

### Rate Limiting
Configure rate limits in `api/auth.js`:
```javascript
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 attempts
});
```

## Analytics Dashboard

### Accessing the Dashboard
1. Navigate to `/admin/login.html`
2. Login with admin credentials
3. Use 2FA if enabled

### Scheduled Exports
1. Click "Export" in the dashboard
2. Select "Schedule Export"
3. Configure:
   - Export format
   - Frequency
   - Time
   - Email recipients
   - Compression options

## API Endpoints

### Authentication
- POST `/api/auth/login` - Login
- POST `/api/auth/verify-2fa` - Verify 2FA
- POST `/api/auth/refresh` - Refresh token
- POST `/api/auth/logout` - Logout

### Analytics
- GET `/api/analytics/summary` - Get summary
- GET `/api/analytics/tool/:toolId` - Get tool stats
- GET `/api/analytics/performance` - Get performance
- GET `/api/analytics/errors` - Get error stats
- POST `/api/analytics/export` - Export data
- POST `/api/analytics/schedule-export` - Schedule export

## Monitoring and Maintenance

### Health Checks
Monitor system health using the following endpoints:

1. Basic Health Check:
```bash
curl http://localhost:3000/health
```

2. Detailed System Status:
```bash
curl http://localhost:3000/health/status
```

3. Prometheus Metrics:
```bash
curl http://localhost:3000/health/metrics
```

### System Metrics
The health check endpoints provide:
- System resource usage (CPU, Memory)
- Service status (Database, SMTP, Cache)
- Process information
- Performance metrics
- Warning indicators

### Prometheus Integration
Add the following to your Prometheus configuration:
```yaml
scrape_configs:
  - job_name: 'multi-tools'
    metrics_path: '/health/metrics'
    static_configs:
      - targets: ['localhost:3000']
```

### Grafana Dashboard
Import the provided Grafana dashboard for visualization:
1. Navigate to Grafana
2. Import Dashboard
3. Use dashboard ID: `12345` (example)

### Log Files
Monitor application logs:
```bash
tail -f logs/app.log
```

### Database Backups
If using a database, schedule regular backups:
```bash
0 0 * * * /path/to/backup-script.sh
```

### Error Notifications
Configure error notifications in `api/analytics.js`:
```javascript
// Implement error notification system
console.error('Export failed:', error);
// Send notification to admin
```

## Troubleshooting

### Common Issues

1. Authentication Failures
   - Check JWT secret
   - Verify 2FA configuration
   - Check rate limits

2. Export Issues
   - Verify SMTP settings
   - Check file permissions
   - Monitor disk space

3. Performance Issues
   - Check server resources
   - Monitor API response times
   - Review rate limiting settings

## Production Deployment

### Using PM2
1. Install PM2:
```bash
npm install -g pm2
```

2. Start application:
```bash
pm2 start server.js --name multi-tools
```

3. Configure auto-restart:
```bash
pm2 startup
pm2 save
```

### Using Docker
1. Build image:
```bash
docker build -t multi-tools .
```

2. Run container:
```bash
docker run -d -p 3000:3000 --env-file .env multi-tools
```

## Support and Updates

For support:
- Email: support@yourcompany.com
- GitHub Issues: [Create an issue](https://github.com/your-username/multi-tools/issues)

## License

MIT License - See LICENSE file for details 
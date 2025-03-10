const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Performance monitoring
const responseTimeThreshold = 1000; // 1 second
const errorNotificationThreshold = 5; // Notify after 5 errors in timeWindow
const errorTimeWindow = 5 * 60 * 1000; // 5 minutes
let recentErrors = [];

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Request logging and monitoring middleware
app.use((req, res, next) => {
    const start = Date.now();

    // Log request
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Track response time and log completion
    res.on('finish', () => {
        const duration = Date.now() - start;
        const log = `${new Date().toISOString()} - ${req.method} ${req.url} ${res.statusCode} ${duration}ms`;
        
        // Log to console
        console.log(log);
        
        // Log to file
        require('fs').appendFile(
            path.join(__dirname, 'logs', 'access.log'),
            log + '\n',
            err => err && console.error('Failed to write to access log:', err)
        );

        // Performance monitoring
        if (duration > responseTimeThreshold) {
            const alert = `High response time detected: ${duration}ms for ${req.method} ${req.url}`;
            console.warn(alert);
            notifyAdmin('Performance Alert', alert);
        }
    });

    next();
});

// Error tracking middleware
app.use((err, req, res, next) => {
    const errorTime = Date.now();
    const errorLog = {
        timestamp: new Date().toISOString(),
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
        body: req.body,
        headers: req.headers,
        user: req.user
    };

    // Log error
    console.error('Error:', errorLog);
    
    // Log to file
    require('fs').appendFile(
        path.join(__dirname, 'logs', 'error.log'),
        JSON.stringify(errorLog) + '\n',
        err => err && console.error('Failed to write to error log:', err)
    );

    // Track recent errors
    recentErrors.push(errorTime);
    recentErrors = recentErrors.filter(time => time > Date.now() - errorTimeWindow);

    // Check error threshold
    if (recentErrors.length >= errorNotificationThreshold) {
        const alert = `High error rate detected: ${recentErrors.length} errors in the last 5 minutes`;
        console.warn(alert);
        notifyAdmin('Error Rate Alert', alert);
        recentErrors = []; // Reset after notification
    }

    // Send error response
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Admin notification function
function notifyAdmin(subject, message) {
    // Implement your notification system here (email, Slack, etc.)
    console.log(`ADMIN NOTIFICATION - ${subject}: ${message}`);
    
    // Example: Send email if SMTP is configured
    if (process.env.SMTP_HOST) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: process.env.ADMIN_EMAIL,
            subject: `[Multi-Tools Alert] ${subject}`,
            text: message
        }).catch(err => console.error('Failed to send admin notification:', err));
    }
}

// Routes
app.use('/api/auth', require('./api/auth'));
app.use('/api/analytics', require('./api/analytics'));
app.use('/health', require('./api/health'));

// Admin routes
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', req.params[0]));
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    
    // Log startup
    const startupLog = `${new Date().toISOString()} - Server started on port ${PORT}\n`;
    fs.appendFile(path.join(logsDir, 'server.log'), startupLog, err => {
        if (err) console.error('Failed to write startup log:', err);
    });
}); 
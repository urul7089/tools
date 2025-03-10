const express = require('express');
const router = express.Router();
const os = require('os');

// Track active requests and errors
const metrics = {
    activeRequests: 0,
    totalRequests: 0,
    errors: {
        count: 0,
        byType: {},
        byEndpoint: {}
    },
    responseTimes: {
        sum: 0,
        count: 0,
        avg: 0,
        byEndpoint: {}
    }
};

// Request tracking middleware
router.use((req, res, next) => {
    metrics.activeRequests++;
    metrics.totalRequests++;
    
    const start = Date.now();
    
    res.on('finish', () => {
        metrics.activeRequests--;
        const duration = Date.now() - start;
        
        // Track response times
        metrics.responseTimes.sum += duration;
        metrics.responseTimes.count++;
        metrics.responseTimes.avg = metrics.responseTimes.sum / metrics.responseTimes.count;
        
        // Track by endpoint
        const endpoint = `${req.method} ${req.route?.path || req.path}`;
        metrics.responseTimes.byEndpoint[endpoint] = metrics.responseTimes.byEndpoint[endpoint] || { sum: 0, count: 0, avg: 0 };
        metrics.responseTimes.byEndpoint[endpoint].sum += duration;
        metrics.responseTimes.byEndpoint[endpoint].count++;
        metrics.responseTimes.byEndpoint[endpoint].avg = 
            metrics.responseTimes.byEndpoint[endpoint].sum / metrics.responseTimes.byEndpoint[endpoint].count;
        
        // Track errors
        if (res.statusCode >= 400) {
            metrics.errors.count++;
            metrics.errors.byEndpoint[endpoint] = (metrics.errors.byEndpoint[endpoint] || 0) + 1;
        }
    });
    
    next();
});

// Basic health check
router.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        activeRequests: metrics.activeRequests,
        uptime: process.uptime()
    });
});

// Detailed system status
router.get('/status', async (req, res) => {
    try {
        const systemInfo = {
            status: 'operational',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            traffic: {
                activeRequests: metrics.activeRequests,
                totalRequests: metrics.totalRequests,
                avgResponseTime: metrics.responseTimes.avg.toFixed(2) + 'ms',
                errorRate: ((metrics.errors.count / metrics.totalRequests) * 100).toFixed(2) + '%'
            },
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem(),
                    usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
                },
                cpu: {
                    cores: os.cpus().length,
                    model: os.cpus()[0].model,
                    loadAvg: os.loadavg()
                }
            },
            process: {
                pid: process.pid,
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
            },
            services: {
                database: await checkDatabaseConnection(),
                smtp: await checkSMTPConnection(),
                cache: await checkCacheStatus()
            }
        };

        // Add warnings
        systemInfo.warnings = [];
        
        if (parseFloat(systemInfo.system.memory.usagePercent) > 90) {
            systemInfo.warnings.push('High memory usage detected');
        }
        
        if (systemInfo.system.cpu.loadAvg[0] > systemInfo.system.cpu.cores) {
            systemInfo.warnings.push('High CPU load detected');
        }
        
        if (metrics.responseTimes.avg > 1000) {
            systemInfo.warnings.push('High average response time detected');
        }
        
        if ((metrics.errors.count / metrics.totalRequests) > 0.05) {
            systemInfo.warnings.push('High error rate detected');
        }

        res.json(systemInfo);
    } catch (error) {
        console.error('Health check error:', error);
        metrics.errors.count++;
        metrics.errors.byType[error.name] = (metrics.errors.byType[error.name] || 0) + 1;
        
        res.status(500).json({
            status: 'error',
            error: 'Failed to get system status'
        });
    }
});

// Service checks
async function checkDatabaseConnection() {
    try {
        // Implement your database connection check here
        return { status: 'connected', latency: '20ms' };
    } catch (error) {
        return { status: 'error', error: error.message };
    }
}

async function checkSMTPConnection() {
    try {
        // Implement your SMTP connection check here
        return { status: 'connected', latency: '150ms' };
    } catch (error) {
        return { status: 'error', error: error.message };
    }
}

async function checkCacheStatus() {
    try {
        // Implement your cache status check here
        return { status: 'operational', size: '24MB' };
    } catch (error) {
        return { status: 'error', error: error.message };
    }
}

// Metrics endpoint for Prometheus
router.get('/metrics', (req, res) => {
    const prometheusMetrics = [
        '# HELP process_memory_usage Memory usage in bytes',
        '# TYPE process_memory_usage gauge',
        `process_memory_usage ${process.memoryUsage().heapUsed}`,
        
        '# HELP system_memory_usage System memory usage in bytes',
        '# TYPE system_memory_usage gauge',
        `system_memory_usage ${os.totalmem() - os.freemem()}`,
        
        '# HELP cpu_load System load average (1m)',
        '# TYPE cpu_load gauge',
        `cpu_load ${os.loadavg()[0]}`,
        
        '# HELP active_requests Current number of active requests',
        '# TYPE active_requests gauge',
        `active_requests ${metrics.activeRequests}`,
        
        '# HELP total_requests Total number of requests handled',
        '# TYPE total_requests counter',
        `total_requests ${metrics.totalRequests}`,
        
        '# HELP error_rate Error rate as a percentage',
        '# TYPE error_rate gauge',
        `error_rate ${(metrics.errors.count / metrics.totalRequests) * 100}`,
        
        '# HELP response_time_ms Average response time in milliseconds',
        '# TYPE response_time_ms gauge',
        `response_time_ms ${metrics.responseTimes.avg}`
    ].join('\n');

    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
});

// Detailed metrics endpoint
router.get('/metrics/detailed', (req, res) => {
    res.json({
        requests: {
            active: metrics.activeRequests,
            total: metrics.totalRequests
        },
        errors: {
            total: metrics.errors.count,
            byType: metrics.errors.byType,
            byEndpoint: metrics.errors.byEndpoint
        },
        performance: {
            avgResponseTime: metrics.responseTimes.avg,
            byEndpoint: metrics.responseTimes.byEndpoint
        }
    });
});

module.exports = router; 
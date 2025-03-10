// Analytics API Module
const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');
const { Parser } = require('json2csv');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const archiver = require('archiver');

// Middleware to protect all analytics routes
router.use(verifyToken);

// In-memory cache for analytics data
let analyticsCache = {
    lastUpdate: null,
    data: null
};

// In-memory storage for scheduled exports (in production, use a database)
const scheduledExports = new Map();

// Email transporter (configure with your SMTP settings)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Get aggregated analytics data
router.get('/summary', async (req, res) => {
    try {
        const timeRange = req.query.timeRange || '30d';
        const data = await getAnalyticsSummary(timeRange);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics summary' });
    }
});

// Get tool-specific analytics
router.get('/tool/:toolId', async (req, res) => {
    try {
        const { toolId } = req.params;
        const timeRange = req.query.timeRange || '30d';
        const data = await getToolAnalytics(toolId, timeRange);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tool analytics' });
    }
});

// Get performance metrics
router.get('/performance', async (req, res) => {
    try {
        const timeRange = req.query.timeRange || '30d';
        const data = await getPerformanceMetrics(timeRange);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
});

// Get error tracking data
router.get('/errors', async (req, res) => {
    try {
        const timeRange = req.query.timeRange || '30d';
        const data = await getErrorMetrics(timeRange);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch error metrics' });
    }
});

// Export endpoint
router.post('/export', async (req, res) => {
    try {
        const { format, timeRange, toolFilter, metricFilter } = req.body;

        // Fetch analytics data based on filters
        const data = await getAnalyticsData(timeRange, toolFilter, metricFilter);

        switch (format) {
            case 'csv':
                return exportCSV(res, data);
            case 'excel':
                return exportExcel(res, data);
            case 'pdf':
                return exportPDF(res, data);
            case 'json':
                return res.json(data);
            default:
                return res.status(400).json({ error: 'Unsupported export format' });
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// Schedule export endpoint
router.post('/schedule-export', verifyToken, async (req, res) => {
    try {
        const {
            format,
            frequency,
            time,
            emails,
            compress,
            timeRange,
            toolFilter,
            metricFilter
        } = req.body;

        // Validate inputs
        if (!format || !frequency || !time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Parse time
        const [hours, minutes] = time.split(':').map(Number);

        // Create cron expression based on frequency
        let cronExpression;
        switch (frequency) {
            case 'daily':
                cronExpression = `${minutes} ${hours} * * *`;
                break;
            case 'weekly':
                cronExpression = `${minutes} ${hours} * * 1`; // Monday
                break;
            case 'monthly':
                cronExpression = `${minutes} ${hours} 1 * *`; // 1st of month
                break;
            default:
                return res.status(400).json({ error: 'Invalid frequency' });
        }

        // Create unique ID for this schedule
        const scheduleId = Date.now().toString();

        // Create the cron job
        const job = cron.schedule(cronExpression, async () => {
            try {
                // Generate the export
                const data = await getAnalyticsData(timeRange, toolFilter, metricFilter);
                const exportResult = await generateExport(format, data, compress);

                // Send email if recipients specified
                if (emails && emails.length > 0) {
                    await sendExportEmail(emails, exportResult, format, compress);
                }

            } catch (error) {
                console.error('Scheduled export failed:', error);
                // Implement error notification system here
            }
        });

        // Store the scheduled job
        scheduledExports.set(scheduleId, {
            job,
            config: {
                format,
                frequency,
                time,
                emails,
                compress,
                timeRange,
                toolFilter,
                metricFilter
            }
        });

        res.json({
            message: 'Export scheduled successfully',
            scheduleId
        });

    } catch (error) {
        console.error('Schedule export error:', error);
        res.status(500).json({ error: 'Failed to schedule export' });
    }
});

// Helper functions
async function getAnalyticsSummary(timeRange) {
    // This would typically fetch data from your analytics database
    // For now, returning mock data
    return {
        totalUsers: 24892,
        totalOperations: 156743,
        totalDownloads: 45321,
        errorRate: 0.42,
        trends: {
            users: 12.5,
            operations: 8.3,
            downloads: 15.7,
            errorRate: -5.2
        }
    };
}

async function getToolAnalytics(toolId, timeRange) {
    // Mock data for tool-specific analytics
    const toolData = {
        javascript: {
            usage: 45231,
            processingTime: 245,
            errorRate: 0.3,
            performance: 'good'
        },
        typescript: {
            usage: 32456,
            processingTime: 312,
            errorRate: 0.5,
            performance: 'good'
        },
        // Add data for other tools...
    };

    return toolData[toolId] || null;
}

async function getPerformanceMetrics(timeRange) {
    return {
        averageProcessingTimes: {
            javascript: 245,
            typescript: 312,
            css: 189,
            html: 278,
            yaml: 156,
            csv: 134
        },
        trends: {
            daily: [-2, 5, -1, 3, 2, 1],
            weekly: [10, -5, 8, -2, 15, -8]
        }
    };
}

async function getErrorMetrics(timeRange) {
    return {
        errorRates: {
            javascript: 0.3,
            typescript: 0.5,
            css: 0.2,
            html: 0.4,
            yaml: 0.3,
            csv: 0.2
        },
        commonErrors: [
            { type: 'syntax', count: 156 },
            { type: 'validation', count: 89 },
            { type: 'processing', count: 45 }
        ],
        trends: {
            monthly: [0.8, 0.6, 0.5, 0.4, 0.4, 0.3]
        }
    };
}

// Helper function to get analytics data
async function getAnalyticsData(timeRange, toolFilter, metricFilter) {
    // This would typically fetch from your database
    // Mock data for demonstration
    return {
        summary: {
            totalUsers: 24892,
            totalOperations: 156743,
            totalDownloads: 45321,
            errorRate: 0.42
        },
        tools: [
            {
                name: 'JavaScript Formatter',
                usage: 45231,
                processingTime: 245,
                errorRate: 0.3,
                performance: 'Good'
            },
            {
                name: 'TypeScript Formatter',
                usage: 32456,
                processingTime: 312,
                errorRate: 0.5,
                performance: 'Good'
            },
            // ... other tools
        ],
        timeSeriesData: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            usage: [12000, 19000, 15000, 25000, 22000, 30000],
            errors: [0.8, 0.6, 0.5, 0.4, 0.4, 0.3]
        }
    };
}

// CSV Export
function exportCSV(res, data) {
    try {
        const fields = ['name', 'usage', 'processingTime', 'errorRate', 'performance'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data.tools);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics_export.csv');
        return res.send(csv);
    } catch (error) {
        throw new Error('CSV export failed: ' + error.message);
    }
}

// Excel Export
async function exportExcel(res, data) {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Analytics Data');

        // Add summary section
        worksheet.addRow(['Summary Statistics']);
        worksheet.addRow(['Total Users', data.summary.totalUsers]);
        worksheet.addRow(['Total Operations', data.summary.totalOperations]);
        worksheet.addRow(['Total Downloads', data.summary.totalDownloads]);
        worksheet.addRow(['Error Rate', `${data.summary.errorRate}%`]);
        worksheet.addRow([]);

        // Add tools data
        worksheet.addRow(['Tool Statistics']);
        worksheet.addRow(['Tool Name', 'Usage', 'Avg Processing Time (ms)', 'Error Rate (%)', 'Performance']);
        data.tools.forEach(tool => {
            worksheet.addRow([
                tool.name,
                tool.usage,
                tool.processingTime,
                tool.errorRate,
                tool.performance
            ]);
        });

        // Add time series data
        worksheet.addRow([]);
        worksheet.addRow(['Monthly Usage']);
        worksheet.addRow(['Month', ...data.timeSeriesData.labels]);
        worksheet.addRow(['Usage', ...data.timeSeriesData.usage]);
        worksheet.addRow(['Error Rate (%)', ...data.timeSeriesData.errors]);

        // Style the worksheet
        worksheet.getColumn(1).width = 20;
        worksheet.getColumn(2).width = 15;
        worksheet.getColumn(3).width = 25;
        worksheet.getColumn(4).width = 15;
        worksheet.getColumn(5).width = 15;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics_export.xlsx');
        
        return workbook.xlsx.write(res);
    } catch (error) {
        throw new Error('Excel export failed: ' + error.message);
    }
}

// PDF Export
async function exportPDF(res, data) {
    try {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics_export.pdf');
        doc.pipe(res);

        // Add title
        doc.fontSize(20).text('Analytics Report', { align: 'center' });
        doc.moveDown();

        // Add summary section
        doc.fontSize(16).text('Summary Statistics');
        doc.moveDown(0.5);
        const summaryTable = {
            headers: ['Metric', 'Value'],
            rows: [
                ['Total Users', data.summary.totalUsers.toString()],
                ['Total Operations', data.summary.totalOperations.toString()],
                ['Total Downloads', data.summary.totalDownloads.toString()],
                ['Error Rate', `${data.summary.errorRate}%`]
            ]
        };
        await doc.table(summaryTable, { width: 500 });
        doc.moveDown();

        // Add tools data
        doc.fontSize(16).text('Tool Statistics');
        doc.moveDown(0.5);
        const toolsTable = {
            headers: ['Tool Name', 'Usage', 'Processing Time', 'Error Rate', 'Performance'],
            rows: data.tools.map(tool => [
                tool.name,
                tool.usage.toString(),
                `${tool.processingTime}ms`,
                `${tool.errorRate}%`,
                tool.performance
            ])
        };
        await doc.table(toolsTable, { width: 500 });

        doc.end();
    } catch (error) {
        throw new Error('PDF export failed: ' + error.message);
    }
}

// Helper function to generate export file
async function generateExport(format, data, compress) {
    let result;
    let filename = `analytics_export_${new Date().toISOString().split('T')[0]}`;
    let contentType;

    switch (format) {
        case 'csv':
            result = await generateCSV(data);
            filename += '.csv';
            contentType = 'text/csv';
            break;
        case 'excel':
            result = await generateExcel(data);
            filename += '.xlsx';
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            break;
        case 'pdf':
            result = await generatePDF(data);
            filename += '.pdf';
            contentType = 'application/pdf';
            break;
        case 'json':
            result = Buffer.from(JSON.stringify(data, null, 2));
            filename += '.json';
            contentType = 'application/json';
            break;
        default:
            throw new Error('Unsupported format');
    }

    if (compress) {
        const archive = archiver('zip');
        archive.append(result, { name: filename });
        await archive.finalize();
        filename = filename + '.zip';
        contentType = 'application/zip';
        result = archive;
    }

    return {
        data: result,
        filename,
        contentType
    };
}

// Helper function to send export email
async function sendExportEmail(recipients, exportResult, format, compress) {
    const attachmentFilename = exportResult.filename;
    
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: recipients.join(','),
        subject: 'Analytics Export',
        text: 'Please find attached the scheduled analytics export.',
        attachments: [{
            filename: attachmentFilename,
            content: exportResult.data,
            contentType: exportResult.contentType
        }]
    };

    await transporter.sendMail(mailOptions);
}

module.exports = router; 
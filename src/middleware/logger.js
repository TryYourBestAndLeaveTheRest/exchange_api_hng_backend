const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a write stream for file logging (append mode)
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '';
  }
  const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
    (res._startAt[1] - req._startAt[1]) * 1e-6;
  return ms.toFixed(3);
});

// Custom format for console (colored and concise)
const consoleFormat = ':method :url :status :response-time ms - :res[content-length]';

// Custom format for file (detailed)
const fileFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Database logging function
async function logToDatabase(req, res) {
  try {
    // Only log certain endpoints or status codes if needed
    const method = req.method;
    const url = req.originalUrl || req.url;
    const status = res.statusCode;
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip || req.connection.remoteAddress;
    const responseTime = res.get('X-Response-Time') || null;

    // Create logs table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS request_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        method VARCHAR(10) NOT NULL,
        url TEXT NOT NULL,
        status_code INT NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        response_time_ms DECIMAL(10, 3),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at),
        INDEX idx_status_code (status_code),
        INDEX idx_method (method)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Insert log entry
    await db.query(
      `INSERT INTO request_logs (method, url, status_code, ip_address, user_agent, response_time_ms)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [method, url, status, ip, userAgent, responseTime]
    );
  } catch (error) {
    // Don't let logging errors crash the app
    console.error('Error logging to database:', error.message);
  }
}

// Middleware to capture response time
// function captureResponseTime(req, res, next) {
//   const start = Date.now();
  
//   res.on('finish', () => {
//     const duration = Date.now() - start;
//     res.setHeader('X-Response-Time', duration.toFixed(3));
//   });
  
//   next();
// }

// Middleware for database logging
function databaseLogger(req, res, next) {
  res.on('finish', () => {
    // Log to database asynchronously (don't await)
    logToDatabase(req, res).catch(err => {
      console.error('Database logging error:', err.message);
    });
  });
  next();
}

// Console logger (with colors based on status code)
const consoleLogger = morgan(consoleFormat, {
  skip: (req, res) => {
    // Skip logging for static assets or health checks if needed
    return req.url === '/favicon.ico';
  },
  stream: {
    write: (message) => {
      // Color code based on status (morgan already includes status in message)
      const statusMatch = message.match(/\s(\d{3})\s/);
      if (statusMatch) {
        const status = parseInt(statusMatch[1]);
        if (status >= 500) {
          console.error('\x1b[31m%s\x1b[0m', message.trim()); // Red for 5xx
        } else if (status >= 400) {
          console.warn('\x1b[33m%s\x1b[0m', message.trim()); // Yellow for 4xx
        } else if (status >= 300) {
          console.log('\x1b[36m%s\x1b[0m', message.trim()); // Cyan for 3xx
        } else if (status >= 200) {
          console.log('\x1b[32m%s\x1b[0m', message.trim()); // Green for 2xx
        } else {
          console.log(message.trim());
        }
      } else {
        console.log(message.trim());
      }
    }
  }
});

// File logger (append to access.log)
const fileLogger = morgan(fileFormat, {
  stream: accessLogStream
});

module.exports = {
  consoleLogger,
  fileLogger,
  databaseLogger,
//   captureResponseTime
};

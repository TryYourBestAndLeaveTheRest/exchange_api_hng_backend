require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const db = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { consoleLogger, fileLogger, databaseLogger } = require('./middleware/logger');

// Import routes
const countryRoutes = require('./routes/countryRoutes');
const statusRoutes = require('./routes/statusRoutes');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (must be before routes)
// app.use(captureResponseTime);    // Capture response time
app.use(consoleLogger);           // Log to console with colors
app.use(fileLogger);              // Log to file (access.log)
app.use(databaseLogger);          // Log to database (request_logs table)

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Countries Exchange API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      refresh: 'POST /countries/refresh',
      getAllCountries: 'GET /countries',
      getCountry: 'GET /countries/:name',
      deleteCountry: 'DELETE /countries/:name',
      status: 'GET /status',
      image: 'GET /countries/image'
    }
  });
});

// Routes
app.use('/countries', countryRoutes);
app.use('/status', statusRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await db.testConnection();
    
    if (!dbConnected) {
      console.error('Failed to connect to database. Please check your configuration.');
      process.exit(1);
    }

    // Start listening
    app.listen(config.server.port, () => {
      console.log(`🚀 Server running on port ${config.server.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;

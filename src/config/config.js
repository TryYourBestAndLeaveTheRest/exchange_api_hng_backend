require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'countries_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  api: {
    countriesUrl: process.env.COUNTRIES_API_URL || 'https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies',
    exchangeRateUrl: process.env.EXCHANGE_RATE_API_URL || 'https://open.er-api.com/v6/latest/USD',
    timeout: 30000 // 30 seconds
  },
  cache: {
    dir: process.env.CACHE_DIR || './cache'
  }
};

module.exports = config;

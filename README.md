# Countries Exchange API

A RESTful API that fetches country data from external APIs, calculates estimated GDP using exchange rates, stores it in a MySQL database, and provides CRUD operations with filtering and sorting capabilities.

## 🎯 Features

- 🌍 Fetch country data from [RestCountries API](https://restcountries.com)
- 💱 Get real-time exchange rates from [ExchangeRate API](https://open.er-api.com)
- 📊 Calculate estimated GDP: `population × random(1000-2000) ÷ exchange_rate`
- 🗄️ MySQL database with connection pooling
- 🔄 Smart upsert logic (update existing, insert new)
- 🎨 Auto-generated summary image with top 5 countries
- 🔍 Filter by region and currency
- 📈 Sort by GDP, population, or name
- ✅ Input validation and comprehensive error handling

---

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ and npm
- MySQL 5.7+

### Setup in 5 Minutes

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MySQL password

# 3. Initialize database
npm run init-db

# 4. Start server
npm run dev

# 5. Refresh country data (takes 10-30 seconds)
curl -X POST http://localhost:3000/countries/refresh

# 6. Test it!
curl "http://localhost:3000/countries?region=Africa&sort=gdp_desc"
```

✅ **Done!** Your API is running on `http://localhost:3000`

---

## 📚 API Endpoints

### Base URL: `http://localhost:3000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check and API info |
| POST | `/countries/refresh` | Fetch and cache all country data |
| GET | `/countries` | Get all countries (with filters) |
| GET | `/countries/:name` | Get specific country by name |
| DELETE | `/countries/:name` | Delete a country record |
| GET | `/status` | Show total countries and last refresh time |
| GET | `/countries/image` | Serve generated summary image |

---

## 📖 Detailed API Documentation

### 1. POST /countries/refresh

Fetches country data and exchange rates from external APIs, calculates GDP, and stores in database. Also generates a summary image.

**Response:**
```json
{
  "message": "Countries refreshed successfully",
  "total_countries": 250,
  "last_refreshed_at": "2025-10-26T12:00:00.000Z"
}
```

**Behavior:**
- Fetches data from RestCountries API and ExchangeRate API
- For countries with currencies: calculates `estimated_gdp = population × random(1000-2000) ÷ exchange_rate`
- For countries without currencies: sets `currency_code = null`, `exchange_rate = null`, `estimated_gdp = 0`
- Updates existing countries or inserts new ones (case-insensitive)
- Generates summary image with top 5 countries by GDP

**Error (503):**
```json
{
  "error": "External data source unavailable",
  "details": "Could not fetch data from Countries API"
}
```

---

### 2. GET /countries

Get all countries with optional filtering and sorting.

**Query Parameters:**
- `region` - Filter by region: `Africa`, `Europe`, `Asia`, `Americas`, `Oceania`
- `currency` - Filter by currency code: `NGN`, `USD`, `EUR`, `GBP`, etc.
- `sort` - Sort results: `gdp_desc`, `gdp_asc`, `population_desc`, `population_asc`, `name_asc`, `name_desc`

**Examples:**
```bash
GET /countries                                    # All countries
GET /countries?region=Africa                      # African countries
GET /countries?currency=USD                       # USD countries
GET /countries?sort=gdp_desc                      # Sorted by GDP
GET /countries?region=Africa&sort=gdp_desc        # Combined filters
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Nigeria",
    "capital": "Abuja",
    "region": "Africa",
    "population": 206139589,
    "currency_code": "NGN",
    "exchange_rate": 1600.23,
    "estimated_gdp": 25767448125.2,
    "flag_url": "https://flagcdn.com/ng.svg",
    "last_refreshed_at": "2025-10-26T12:00:00.000Z",
    "created_at": "2025-10-26T10:00:00.000Z"
  }
]
```

---

### 3. GET /countries/:name

Get a single country by name (case-insensitive).

**Examples:**
```bash
GET /countries/Nigeria
GET /countries/nigeria        # Case-insensitive
```

**Response:** Single country object (same structure as above)

**Error (404):**
```json
{
  "error": "Country not found"
}
```

---

### 4. DELETE /countries/:name

Delete a country record.

**Response:**
```json
{
  "message": "Country deleted successfully",
  "country": { ... }
}
```

---

### 5. GET /status

Get system status and statistics.

**Response:**
```json
{
  "total_countries": 250,
  "last_refreshed_at": "2025-10-26T12:00:00.000Z"
}
```

---

### 6. GET /countries/image

Returns the auto-generated PNG summary image showing:
- Total number of countries
- Top 5 countries by estimated GDP
- Last refresh timestamp

**Response:** PNG image file

**Error (404):**
```json
{
  "error": "Summary image not found"
}
```

---

## 🧪 Testing Examples

### Using cURL

```bash
# Health check
curl http://localhost:3000/

# Refresh data
curl -X POST http://localhost:3000/countries/refresh

# Get all countries in Africa sorted by GDP
curl "http://localhost:3000/countries?region=Africa&sort=gdp_desc"

# Get specific country
curl http://localhost:3000/countries/Nigeria

# Delete country
curl -X DELETE http://localhost:3000/countries/Nigeria

# Get status
curl http://localhost:3000/status

# Download summary image
curl http://localhost:3000/countries/image --output summary.png
```

### Using JavaScript/Fetch

```javascript
const BASE_URL = 'http://localhost:3000';

// Refresh countries
await fetch(`${BASE_URL}/countries/refresh`, { method: 'POST' });

// Get African countries sorted by GDP
const response = await fetch(`${BASE_URL}/countries?region=Africa&sort=gdp_desc`);
const countries = await response.json();

// Get specific country
const nigeria = await fetch(`${BASE_URL}/countries/Nigeria`).then(r => r.json());

// Get status
const status = await fetch(`${BASE_URL}/status`).then(r => r.json());
```

---

## 📁 Project Structure

```
exchangeApi/
├── src/
│   ├── config/
│   │   ├── config.js           # Application configuration
│   │   ├── database.js         # Database connection pool
│   │   └── initDatabase.js     # Database initialization script
│   ├── controllers/
│   │   └── countryController.js # Request handlers
│   ├── middleware/
│   │   ├── errorHandler.js     # Error handling middleware
│   │   └── validation.js       # Validation middleware
│   ├── models/
│   │   └── countryModel.js     # Database operations
│   ├── routes/
│   │   ├── countryRoutes.js    # Country endpoints
│   │   └── statusRoutes.js     # Status endpoint
│   ├── services/
│   │   ├── externalApiService.js # External API calls
│   │   └── imageService.js     # Image generation
│   └── server.js               # Application entry point
├── cache/                       # Generated images (auto-created)
├── .env                         # Environment variables (create from .env.example)
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore file
├── package.json                 # Project dependencies
└── README.md                    # This file
```

---

## 🏗️ Architecture

### MVC Pattern + Service Layer

```
Client Request
    ↓
Routes (src/routes/)
    ↓
Controllers (src/controllers/)
    ↓
Services (src/services/) ←→ External APIs
    ↓
Models (src/models/)
    ↓
Database (MySQL)
```

### Key Components

- **Server**: Express.js application with middleware
- **Routes**: API endpoint definitions
- **Controllers**: Business logic and request/response handling
- **Services**: External API integration and complex operations
- **Models**: Database operations (CRUD)
- **Middleware**: Validation, error handling, logging

---

## 🗄️ Database Schema

### countries table
```sql
id                  INT (Primary Key, Auto Increment)
name                VARCHAR(255) (Unique, Not Null)
capital             VARCHAR(255)
region              VARCHAR(100)
population          BIGINT (Not Null)
currency_code       VARCHAR(10)
exchange_rate       DECIMAL(20, 6)
estimated_gdp       DECIMAL(30, 2)
flag_url            TEXT
last_refreshed_at   DATETIME
created_at          DATETIME

Indexes: name, region, currency_code
```

### metadata table
```sql
id          INT (Primary Key, Auto Increment)
key_name    VARCHAR(100) (Unique, Not Null)
value       TEXT
updated_at  DATETIME
```

---

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=countries_db
DB_PORT=3306

# External APIs
COUNTRIES_API_URL=https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies
EXCHANGE_RATE_API_URL=https://open.er-api.com/v6/latest/USD

# Cache
CACHE_DIR=./cache
```

---

## 🚨 Error Handling

Consistent JSON error responses:

| Code | Message | Description |
|------|---------|-------------|
| 400 | Validation failed | Invalid input data |
| 404 | Not found | Resource doesn't exist |
| 500 | Internal server error | Server error |
| 503 | Service unavailable | External API failed |

**Example Error Response:**
```json
{
  "error": "Validation failed",
  "details": {
    "currency_code": "is required"
  }
}
```

---

## 🔧 Validation Rules

- `name` - Required, string
- `population` - Required, non-negative number
- `currency_code` - Optional (can be null)

**Currency Handling:**
1. Multiple currencies → store first currency only
2. No currencies → set `currency_code = null`, `exchange_rate = null`, `estimated_gdp = 0`
3. Currency not in exchange rates → set `exchange_rate = null`, `estimated_gdp = null`
4. All countries stored regardless of currency availability

---

## 🚀 Deployment

### Using PM2 (Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start src/server.js --name countries-api

# Auto-restart on server reboot
pm2 startup
pm2 save

# Monitor
pm2 monit
pm2 logs countries-api
```

### Using Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t countries-api .
docker run -p 3000:3000 --env-file .env countries-api
```

### Environment Setup for Production

```env
NODE_ENV=production
PORT=3000
# Use production database credentials
DB_HOST=your-production-db-host
DB_PASSWORD=strong-production-password
```

---

## 🔐 Security Best Practices

- ✅ Environment variables for sensitive data
- ✅ Parameterized SQL queries (SQL injection prevention)
- ✅ Input validation on all endpoints
- ✅ Error messages don't expose sensitive info
- ✅ CORS configuration
- ✅ Connection pooling

**Optional Enhancements:**
```bash
# Add security headers
npm install helmet
# Add rate limiting
npm install express-rate-limit
```

---

## 🐛 Troubleshooting

### Database Connection Error
**Problem:** `❌ Database connection failed`

**Solution:**
- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `.env`
- Test: `mysql -u root -p`

### Port Already in Use
**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
- Change `PORT` in `.env`
- Or kill process: `lsof -ti:3000 | xargs kill`

### External API Timeout
**Problem:** `External data source unavailable`

**Solution:**
- Check internet connection
- External APIs might be temporarily down
- Try again later

### No Data Returned
**Problem:** Empty array from `/countries`

**Solution:**
- Run `POST /countries/refresh` first
- Check: `SELECT COUNT(*) FROM countries;`

### Image Not Found
**Problem:** `Summary image not found`

**Solution:**
- Run `POST /countries/refresh` first
- Check if `cache/` directory exists
- Verify canvas library is installed

---

## 📊 Performance Notes

- **Refresh Operation**: 10-30 seconds (depends on network)
- **Database**: Connection pooling (10 connections)
- **API Timeout**: 30 seconds for external APIs
- **Query Performance**: Indexed fields for fast filtering
- **Image Generation**: ~1 second

---

## 🛠️ Development Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server (auto-reload)
npm run init-db    # Initialize database
```

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | 4.18.2 | Web framework |
| mysql2 | 3.6.5 | MySQL client |
| axios | 1.6.2 | HTTP client |
| canvas | 2.11.2 | Image generation |
| dotenv | 16.3.1 | Environment config |
| cors | 2.8.5 | CORS middleware |

---

## 📝 License

ISC

---

## 🙏 Acknowledgments

- [RestCountries API](https://restcountries.com) - Country data
- [ExchangeRate API](https://open.er-api.com) - Exchange rates

---

## 📧 Support

For issues:
1. Check logs: `pm2 logs countries-api` (if using PM2)
2. Verify database connection
3. Check external API availability
4. Review error messages

---

**Made with ❤️ using Node.js and Express**

**Happy Coding! 🚀**

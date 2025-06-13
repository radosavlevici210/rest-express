
# REST Express API

A production-ready REST API built with Express.js featuring comprehensive CRUD operations, security middleware, rate limiting, and more.

## 🚀 Features

- **Full CRUD Operations** - Create, Read, Update, Delete items
- **Advanced Filtering** - Search and filter by category
- **Pagination** - Efficient data loading with pagination
- **Bulk Operations** - Delete multiple items at once
- **Security** - Helmet.js, CORS, rate limiting
- **Performance** - Compression middleware
- **Error Handling** - Comprehensive error responses
- **Input Validation** - Data validation and sanitization
- **Health Monitoring** - Health check and stats endpoints

## 📡 API Endpoints

### Core Endpoints
- `GET /` - API documentation
- `GET /health` - Health check
- `GET /api/stats` - API statistics

### Items Management
- `GET /api/items` - Get all items (with filtering, search, pagination)
- `POST /api/items` - Create new item
- `GET /api/items/:id` - Get item by ID
- `PUT /api/items/:id` - Update item by ID
- `DELETE /api/items/:id` - Delete item by ID
- `DELETE /api/items` - Bulk delete items

### Categories
- `GET /api/categories` - Get all available categories

## 🔧 Query Parameters

### GET /api/items
- `category` - Filter by category
- `search` - Search in name and description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

Example: `/api/items?category=Work&search=meeting&page=1&limit=5`

## 📝 Request/Response Format

### Create/Update Item
```json
{
  "name": "Item name",
  "description": "Optional description",
  "category": "Work",
  "completed": false,
  "priority": "high"
}
```

### Response Format
```json
{
  "success": true,
  "data": { /* item data */ },
  "message": "Operation successful"
}
```

## 🛡️ Security Features

- **Helmet.js** - Security headers
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **CORS** - Configured for production domains
- **Input Validation** - Comprehensive data validation
- **Error Handling** - Safe error responses

## 🚀 Deployment

This API is optimized for deployment on Replit:

1. **Port Configuration** - Uses 0.0.0.0:5000 for proper external access
2. **Environment Detection** - Automatic production/development configuration
3. **Graceful Shutdown** - Handles SIGTERM and SIGINT signals
4. **Health Monitoring** - Built-in health check endpoint

## 📊 Available Categories

- General
- Work
- Personal
- Shopping

## 🔍 Example Usage

```bash
# Get all items
curl https://your-repl.replit.app/api/items

# Create new item
curl -X POST https://your-repl.replit.app/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"New Task","category":"Work","priority":"high"}'

# Search items
curl "https://your-repl.replit.app/api/items?search=meeting&category=Work"

# Get health status
curl https://your-repl.replit.app/health
```

Made with ❤️ for production deployment on Replit!

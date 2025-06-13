const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://*.replit.app', 'https://*.replit.dev'] 
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));

// Serve static files
app.use(express.static('public'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// In-memory data store with enhanced structure
let items = [];
let nextId = 1;
let categories = ['General', 'Work', 'Personal', 'Shopping'];

// Utility functions
const validateItem = (data) => {
  const errors = [];
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }
  if (data.name && data.name.length > 100) {
    errors.push('Name must be less than 100 characters');
  }
  if (data.category && !categories.includes(data.category)) {
    errors.push(`Category must be one of: ${categories.join(', ')}`);
  }
  return errors;
};

const findItemById = (id) => items.find(item => item.id === parseInt(id));

// Root endpoint with API documentation
app.get('/', (req, res) => {
  const apiDocs = {
    message: '✅ REST Express API is running',
    version: '2.0.0',
    endpoints: {
      'GET /': 'API documentation',
      'GET /health': 'Health check',
      'GET /api/items': 'Get all items (supports ?category=, ?search=, ?page=, ?limit=)',
      'POST /api/items': 'Create new item',
      'GET /api/items/:id': 'Get item by ID',
      'PUT /api/items/:id': 'Update item by ID',
      'DELETE /api/items/:id': 'Delete item by ID',
      'GET /api/categories': 'Get all categories',
      'GET /api/stats': 'Get API statistics',
      'GET /api/docs': 'OpenAPI documentation'
    },
    documentation: 'Send requests to /api/* endpoints or visit the web interface'
  };
  res.json(apiDocs);
});

// OpenAPI documentation endpoint
app.get('/api/docs', (req, res) => {
  try {
    const fs = require('fs');
    const docs = JSON.parse(fs.readFileSync('api-docs.json', 'utf8'));
    res.json(docs);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Documentation not available',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Get all categories
app.get('/api/categories', (req, res) => {
  res.json({
    success: true,
    data: categories,
    count: categories.length
  });
});

// Get API statistics
app.get('/api/stats', (req, res) => {
  const stats = {
    totalItems: items.length,
    categoryCounts: categories.reduce((acc, cat) => {
      acc[cat] = items.filter(item => item.category === cat).length;
      return acc;
    }, {}),
    lastUpdated: items.length > 0 ? Math.max(...items.map(item => new Date(item.updatedAt).getTime())) : null
  };
  res.json({
    success: true,
    data: stats
  });
});

// Get all items with filtering, searching, and pagination
app.get('/api/items', (req, res) => {
  try {
    let filteredItems = [...items];
    
    // Category filtering
    if (req.query.category) {
      filteredItems = filteredItems.filter(item => 
        item.category === req.query.category
      );
    }
    
    // Search functionality
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      filteredItems = filteredItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        (item.description && item.description.toLowerCase().includes(searchTerm))
      );
    }
    
    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedItems = filteredItems.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedItems,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredItems.length / limit),
        totalItems: filteredItems.length,
        limit: limit,
        hasNext: endIndex < filteredItems.length,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Create new item
app.post('/api/items', (req, res) => {
  try {
    const validationErrors = validateItem(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    const now = new Date().toISOString();
    const item = {
      id: nextId++,
      name: req.body.name.trim(),
      description: req.body.description?.trim() || null,
      category: req.body.category || 'General',
      completed: req.body.completed || false,
      priority: req.body.priority || 'medium',
      createdAt: now,
      updatedAt: now
    };
    
    items.push(item);
    
    res.status(201).json({
      success: true,
      data: item,
      message: 'Item created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get item by ID
app.get('/api/items/:id', (req, res) => {
  try {
    const item = findItemById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
        message: `Item with ID ${req.params.id} does not exist`
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Update item by ID
app.put('/api/items/:id', (req, res) => {
  try {
    const item = findItemById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
        message: `Item with ID ${req.params.id} does not exist`
      });
    }

    // Validate only provided fields
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.completed !== undefined) updateData.completed = req.body.completed;
    if (req.body.priority !== undefined) updateData.priority = req.body.priority;

    const validationErrors = validateItem({ ...item, ...updateData });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Update item
    Object.assign(item, updateData, { updatedAt: new Date().toISOString() });
    
    res.json({
      success: true,
      data: item,
      message: 'Item updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Delete item by ID
app.delete('/api/items/:id', (req, res) => {
  try {
    const index = items.findIndex(item => item.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
        message: `Item with ID ${req.params.id} does not exist`
      });
    }
    
    const deletedItem = items.splice(index, 1)[0];
    
    res.json({
      success: true,
      data: deletedItem,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Bulk operations
app.delete('/api/items', (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        error: 'IDs must be provided as an array'
      });
    }
    
    const deletedItems = [];
    const notFoundIds = [];
    
    ids.forEach(id => {
      const index = items.findIndex(item => item.id === parseInt(id));
      if (index !== -1) {
        deletedItems.push(items.splice(index, 1)[0]);
      } else {
        notFoundIds.push(id);
      }
    });
    
    res.json({
      success: true,
      data: {
        deleted: deletedItems,
        notFound: notFoundIds,
        deletedCount: deletedItems.length
      },
      message: `${deletedItems.length} items deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Health check: http://0.0.0.0:${PORT}/health`);
});

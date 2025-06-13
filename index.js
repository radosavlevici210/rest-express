const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting in production
app.set('trust proxy', 1);

// Security middleware with production policies - Relaxed for global access
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "*"],
      styleSrc: ["'self'", "'unsafe-inline'", "*"],
      scriptSrc: ["'self'", "'unsafe-inline'", "*"],
      imgSrc: ["'self'", "data:", "https:", "*"],
      connectSrc: ["'self'", "*"],
      fontSrc: ["'self'", "*"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "*"],
      frameSrc: ["'self'", "*"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.use(compression());

// Rate limiting - More generous limits for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for production use
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', limiter);

// CORS configuration - Allow all origins for production API
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID', 'X-Requested-With']
}));

// Serve static files
app.use(express.static('public'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// User Management and Copyright Protection
const ROOT_USERS = ['radosavlevici210', 'admin'];
const PROTECTED_ENDPOINTS = ['/api/admin', '/api/users', '/api/system'];

// Copyright and access control middleware
app.use((req, res, next) => {
  // Add copyright header to all responses
  res.setHeader('X-Copyright', 'Copyright © 2025 Ervin Remus Radosavlevici. All Rights Reserved.');
  res.setHeader('X-License', 'Proprietary Software - Unauthorized use prohibited');
  res.setHeader('X-Owner', 'radosavlevici210');

  // Check for protected endpoint access
  const isProtectedEndpoint = PROTECTED_ENDPOINTS.some(endpoint => 
    req.path.startsWith(endpoint)
  );

  if (isProtectedEndpoint) {
    const userHeader = req.get('X-User-ID') || req.get('Authorization');
    const isRootUser = ROOT_USERS.includes(userHeader);

    if (!isRootUser) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied',
        message: 'Root user privileges required for this endpoint',
        copyright: 'Copyright © 2025 Ervin Remus Radosavlevici'
      });
    }
  }

  next();
});

// Production logging and monitoring middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const userAgent = req.get('User-Agent')?.substring(0, 50) || 'Unknown';
  const userID = req.get('X-User-ID') || 'Anonymous';

  // Enhanced logging with user identification
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip} - User: ${userID} - UA: ${userAgent}`);

  // Response time tracking
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - User: ${userID}`);
  });

  next();
});

// Production health and monitoring
let serverStats = {
  startTime: new Date().toISOString(),
  requests: 0,
  errors: 0,
  lastError: null
};

app.use((req, res, next) => {
  serverStats.requests++;
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
    copyright: 'Copyright © 2025 Ervin Remus Radosavlevici. All Rights Reserved.',
    owner: 'radosavlevici210',
    license: 'Proprietary Software',
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
      'GET /api/docs': 'OpenAPI documentation',
      'GET /api/users': 'User management (Root only)',
      'GET /api/copyright': 'Copyright information'
    },
    documentation: 'Send requests to /api/* endpoints or visit the web interface',
    notice: 'Unauthorized use of this API is prohibited and may result in legal action'
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

// Production health check endpoint
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    version: '2.0.0',
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
    },
    stats: {
      totalRequests: serverStats.requests,
      totalErrors: serverStats.errors,
      startTime: serverStats.startTime,
      lastError: serverStats.lastError
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid
    }
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

// Copyright information endpoint
app.get('/api/copyright', (req, res) => {
  res.json({
    success: true,
    copyright: {
      notice: 'Copyright © 2025 Ervin Remus Radosavlevici. All Rights Reserved.',
      owner: 'Ervin Remus Radosavlevici',
      github: 'radosavlevici210',
      license: 'Proprietary Software with MIT base license',
      repository: 'rest-express-api-production',
      created: '2025',
      terms: {
        personalUse: 'Permitted for non-commercial personal projects',
        commercialUse: 'Requires written authorization from copyright holder',
        redistribution: 'Prohibited without explicit permission',
        reverseEngineering: 'Strictly prohibited'
      },
      contact: {
        licensing: 'Contact @radosavlevici210 for licensing inquiries',
        violations: 'Report copyright violations to repository owner',
        support: 'Technical support available for licensed users'
      }
    }
  });
});

// User management endpoint (Root access only)
app.get('/api/users', (req, res) => {
  const userID = req.get('X-User-ID') || req.get('Authorization');

  if (!ROOT_USERS.includes(userID)) {
    return res.status(403).json({
      success: false,
      error: 'Root access required',
      message: 'This endpoint requires root user privileges'
    });
  }

  res.json({
    success: true,
    data: {
      rootUsers: ROOT_USERS,
      currentUser: userID,
      accessLevel: 'Administrator',
      permissions: [
        'User management',
        'System configuration',
        'Production deployment',
        'Security policies',
        'Copyright enforcement'
      ],
      system: {
        totalUsers: 1,
        activeUsers: 1,
        lastLogin: new Date().toISOString(),
        securityLevel: 'Maximum'
      }
    }
  });
});

// System admin endpoint (Root access only)
app.get('/api/admin/system', (req, res) => {
  const userID = req.get('X-User-ID') || req.get('Authorization');

  if (!ROOT_USERS.includes(userID)) {
    return res.status(403).json({
      success: false,
      error: 'Administrator access required'
    });
  }

  res.json({
    success: true,
    data: {
      system: {
        owner: 'Ervin Remus Radosavlevici',
        repository: 'radosavlevici210/rest-express-api-production',
        environment: process.env.NODE_ENV || 'production',
        uptime: process.uptime(),
        copyright: 'Protected by international copyright law'
      },
      security: {
        rateLimiting: 'Active',
        corsPolicy: 'Enforced',
        securityHeaders: 'Enabled',
        accessControl: 'Root user verification active'
      }
    }
  });
});

// Get API statistics with production metrics
app.get('/api/stats', (req, res) => {
  const stats = {
    totalItems: items.length,
    categoryCounts: categories.reduce((acc, cat) => {
      acc[cat] = items.filter(item => item.category === cat).length;
      return acc;
    }, {}),
    lastUpdated: items.length > 0 ? Math.max(...items.map(item => new Date(item.updatedAt).getTime())) : null,
    server: {
      uptime: process.uptime(),
      requests: serverStats.requests,
      errors: serverStats.errors,
      version: '2.0.0'
    }
  };
  res.json({
    success: true,
    data: stats
  });
});

// Production monitoring endpoint
app.get('/api/monitor', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    success: true,
    data: {
      server: {
        status: 'operational',
        uptime: process.uptime(),
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024)
        },
        cpu: process.cpuUsage(),
        version: process.version,
        environment: process.env.NODE_ENV || 'production'
      },
      api: {
        totalRequests: serverStats.requests,
        totalErrors: serverStats.errors,
        totalItems: items.length,
        lastError: serverStats.lastError
      }
    }
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

// Production error handling middleware
app.use((err, req, res, next) => {
  serverStats.errors++;
  serverStats.lastError = {
    message: err.message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.path}:`, err.message);
  console.error(err.stack); // Always log stack trace for debugging

  res.status(err.status || 500).json({
    success: false,
    error: 'Internal server error',
    message: err.message, // Always show error message
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown',
    stack: err.stack // Include stack trace for debugging
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
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`📡 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🌍 API ready for global access`);
  console.log(`📋 Documentation: http://0.0.0.0:${PORT}/`);
  console.log(`🔧 Monitoring: http://0.0.0.0:${PORT}/api/monitor`);
});
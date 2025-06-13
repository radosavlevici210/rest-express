
# API Client Examples

This document provides examples of how to interact with the REST Express API using different programming languages and tools.

## cURL Examples

### Get all items
```bash
curl -X GET "https://your-repl.replit.app/api/items"
```

### Get items with filtering and pagination
```bash
curl -X GET "https://your-repl.replit.app/api/items?category=Work&search=meeting&page=1&limit=5"
```

### Create a new item
```bash
curl -X POST "https://your-repl.replit.app/api/items" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Important Meeting",
    "description": "Weekly team standup",
    "category": "Work",
    "priority": "high"
  }'
```

### Update an item
```bash
curl -X PUT "https://your-repl.replit.app/api/items/1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Meeting",
    "completed": true
  }'
```

### Delete an item
```bash
curl -X DELETE "https://your-repl.replit.app/api/items/1"
```

### Bulk delete items
```bash
curl -X DELETE "https://your-repl.replit.app/api/items" \
  -H "Content-Type: application/json" \
  -d '{"ids": [1, 2, 3]}'
```

## JavaScript (Fetch API)

```javascript
const API_BASE = 'https://your-repl.replit.app/api';

// Get all items
async function getAllItems() {
  const response = await fetch(`${API_BASE}/items`);
  const data = await response.json();
  return data;
}

// Create new item
async function createItem(itemData) {
  const response = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(itemData)
  });
  const data = await response.json();
  return data;
}

// Update item
async function updateItem(id, updateData) {
  const response = await fetch(`${API_BASE}/items/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });
  const data = await response.json();
  return data;
}

// Delete item
async function deleteItem(id) {
  const response = await fetch(`${API_BASE}/items/${id}`, {
    method: 'DELETE'
  });
  const data = await response.json();
  return data;
}

// Search items
async function searchItems(query, category = null, page = 1) {
  const params = new URLSearchParams({
    search: query,
    page: page
  });
  
  if (category) {
    params.append('category', category);
  }
  
  const response = await fetch(`${API_BASE}/items?${params}`);
  const data = await response.json();
  return data;
}
```

## Python (requests library)

```python
import requests
import json

API_BASE = 'https://your-repl.replit.app/api'

class APIClient:
    def __init__(self, base_url=API_BASE):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
    
    def get_items(self, category=None, search=None, page=1, limit=10):
        """Get all items with optional filtering"""
        params = {'page': page, 'limit': limit}
        if category:
            params['category'] = category
        if search:
            params['search'] = search
        
        response = self.session.get(f'{self.base_url}/items', params=params)
        return response.json()
    
    def create_item(self, name, description=None, category='General', priority='medium'):
        """Create a new item"""
        data = {
            'name': name,
            'category': category,
            'priority': priority
        }
        if description:
            data['description'] = description
        
        response = self.session.post(f'{self.base_url}/items', json=data)
        return response.json()
    
    def get_item(self, item_id):
        """Get a specific item by ID"""
        response = self.session.get(f'{self.base_url}/items/{item_id}')
        return response.json()
    
    def update_item(self, item_id, **kwargs):
        """Update an item"""
        response = self.session.put(f'{self.base_url}/items/{item_id}', json=kwargs)
        return response.json()
    
    def delete_item(self, item_id):
        """Delete an item"""
        response = self.session.delete(f'{self.base_url}/items/{item_id}')
        return response.json()
    
    def get_categories(self):
        """Get all available categories"""
        response = self.session.get(f'{self.base_url}/categories')
        return response.json()
    
    def get_stats(self):
        """Get API statistics"""
        response = self.session.get(f'{self.base_url}/stats')
        return response.json()

# Usage example
if __name__ == '__main__':
    client = APIClient()
    
    # Create a new item
    result = client.create_item(
        name='Python API Test',
        description='Testing the API from Python',
        category='Work',
        priority='high'
    )
    print('Created item:', result)
    
    # Get all items
    items = client.get_items()
    print('All items:', items)
    
    # Search for items
    search_results = client.get_items(search='Python', category='Work')
    print('Search results:', search_results)
```

## Node.js (axios)

```javascript
const axios = require('axios');

class APIClient {
    constructor(baseURL = 'https://your-repl.replit.app/api') {
        this.client = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async getItems(options = {}) {
        const { category, search, page = 1, limit = 10 } = options;
        const params = { page, limit };
        
        if (category) params.category = category;
        if (search) params.search = search;
        
        const response = await this.client.get('/items', { params });
        return response.data;
    }

    async createItem(itemData) {
        const response = await this.client.post('/items', itemData);
        return response.data;
    }

    async getItem(id) {
        const response = await this.client.get(`/items/${id}`);
        return response.data;
    }

    async updateItem(id, updateData) {
        const response = await this.client.put(`/items/${id}`, updateData);
        return response.data;
    }

    async deleteItem(id) {
        const response = await this.client.delete(`/items/${id}`);
        return response.data;
    }

    async bulkDelete(ids) {
        const response = await this.client.delete('/items', { data: { ids } });
        return response.data;
    }

    async getCategories() {
        const response = await this.client.get('/categories');
        return response.data;
    }

    async getStats() {
        const response = await this.client.get('/stats');
        return response.data;
    }
}

module.exports = APIClient;

// Usage example
async function example() {
    const api = new APIClient();
    
    try {
        // Create a new item
        const newItem = await api.createItem({
            name: 'Node.js Test Item',
            description: 'Testing from Node.js',
            category: 'Work',
            priority: 'medium'
        });
        console.log('Created:', newItem);

        // Get all items
        const items = await api.getItems();
        console.log('Items:', items);

        // Update the item
        const updated = await api.updateItem(newItem.data.id, {
            completed: true
        });
        console.log('Updated:', updated);

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

// example();
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "details": ["Additional error details if applicable"]
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting:
- **Limit**: 100 requests per 15 minutes per IP
- **Scope**: Applied to `/api/*` endpoints only
- **Headers**: Check `X-RateLimit-*` headers in responses

## Best Practices

1. **Always check response status** before processing data
2. **Implement proper error handling** for network and API errors
3. **Use pagination** for large datasets
4. **Cache categories** as they rarely change
5. **Respect rate limits** and implement backoff strategies
6. **Use search and filtering** to reduce data transfer
7. **Handle validation errors** gracefully in your UI

## WebSocket Support

Currently, the API uses traditional REST endpoints. For real-time updates, consider polling the `/api/stats` endpoint or implementing webhooks in future versions.

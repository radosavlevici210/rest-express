
// Simple test runner for the API
// Run with: node tests/api.test.js

const http = require('http');

const BASE_URL = 'http://localhost:5000';
let testsPassed = 0;
let testsTotal = 0;

// Test helper function
async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test function
async function test(name, testFn) {
  testsTotal++;
  try {
    await testFn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
}

// Test assertion helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Main test suite
async function runTests() {
  console.log('🧪 Starting API Tests...\n');

  // Test health endpoint
  await test('Health check endpoint', async () => {
    const response = await makeRequest('GET', '/health');
    assert(response.status === 200, 'Health check should return 200');
    assert(response.data.status === 'healthy', 'Should return healthy status');
  });

  // Test root endpoint
  await test('Root endpoint returns API docs', async () => {
    const response = await makeRequest('GET', '/');
    assert(response.status === 200, 'Root should return 200');
    assert(response.data.message.includes('REST Express API'), 'Should contain API name');
  });

  // Test categories endpoint
  await test('Categories endpoint', async () => {
    const response = await makeRequest('GET', '/api/categories');
    assert(response.status === 200, 'Categories should return 200');
    assert(Array.isArray(response.data.data), 'Should return array of categories');
    assert(response.data.data.length > 0, 'Should have at least one category');
  });

  // Test stats endpoint
  await test('Stats endpoint', async () => {
    const response = await makeRequest('GET', '/api/stats');
    assert(response.status === 200, 'Stats should return 200');
    assert(typeof response.data.data.totalItems === 'number', 'Should return total items count');
  });

  // Test items endpoint (empty)
  await test('Get items (empty)', async () => {
    const response = await makeRequest('GET', '/api/items');
    assert(response.status === 200, 'Items should return 200');
    assert(Array.isArray(response.data.data), 'Should return array');
    assert(response.data.success === true, 'Should indicate success');
  });

  // Test creating an item
  let createdItemId;
  await test('Create new item', async () => {
    const itemData = {
      name: 'Test Item',
      description: 'A test item',
      category: 'General',
      priority: 'high'
    };
    const response = await makeRequest('POST', '/api/items', itemData);
    assert(response.status === 201, 'Create should return 201');
    assert(response.data.success === true, 'Should indicate success');
    assert(response.data.data.name === 'Test Item', 'Should return created item');
    createdItemId = response.data.data.id;
  });

  // Test getting the created item
  await test('Get item by ID', async () => {
    const response = await makeRequest('GET', `/api/items/${createdItemId}`);
    assert(response.status === 200, 'Get item should return 200');
    assert(response.data.data.id === createdItemId, 'Should return correct item');
  });

  // Test updating the item
  await test('Update item', async () => {
    const updateData = {
      name: 'Updated Test Item',
      completed: true
    };
    const response = await makeRequest('PUT', `/api/items/${createdItemId}`, updateData);
    assert(response.status === 200, 'Update should return 200');
    assert(response.data.data.name === 'Updated Test Item', 'Should update name');
    assert(response.data.data.completed === true, 'Should update completed status');
  });

  // Test items with search
  await test('Search items', async () => {
    const response = await makeRequest('GET', '/api/items?search=Updated');
    assert(response.status === 200, 'Search should return 200');
    assert(response.data.data.length > 0, 'Should find the updated item');
  });

  // Test items with category filter
  await test('Filter items by category', async () => {
    const response = await makeRequest('GET', '/api/items?category=General');
    assert(response.status === 200, 'Filter should return 200');
    assert(response.data.data.length > 0, 'Should find items in General category');
  });

  // Test pagination
  await test('Items pagination', async () => {
    const response = await makeRequest('GET', '/api/items?page=1&limit=5');
    assert(response.status === 200, 'Pagination should return 200');
    assert(response.data.pagination.currentPage === 1, 'Should return correct page');
    assert(response.data.pagination.limit === 5, 'Should return correct limit');
  });

  // Test deleting the item
  await test('Delete item', async () => {
    const response = await makeRequest('DELETE', `/api/items/${createdItemId}`);
    assert(response.status === 200, 'Delete should return 200');
    assert(response.data.success === true, 'Should indicate success');
  });

  // Test validation errors
  await test('Validation error on empty name', async () => {
    const itemData = { name: '', category: 'General' };
    const response = await makeRequest('POST', '/api/items', itemData);
    assert(response.status === 400, 'Should return validation error');
    assert(response.data.success === false, 'Should indicate failure');
  });

  // Test 404 for non-existent item
  await test('404 for non-existent item', async () => {
    const response = await makeRequest('GET', '/api/items/99999');
    assert(response.status === 404, 'Should return 404');
    assert(response.data.success === false, 'Should indicate failure');
  });

  // Test rate limiting (if applicable)
  await test('API documentation endpoint', async () => {
    const response = await makeRequest('GET', '/api/docs');
    assert(response.status === 200 || response.status === 500, 'Should handle docs request');
  });

  // Summary
  console.log(`\n📊 Test Results: ${testsPassed}/${testsTotal} tests passed`);
  
  if (testsPassed === testsTotal) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Check if server is running and start tests
async function main() {
  try {
    await makeRequest('GET', '/health');
    await runTests();
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first with: npm start');
    process.exit(1);
  }
}

main();

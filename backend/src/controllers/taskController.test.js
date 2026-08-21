// ==========================================
// Backend Unit Test: Task Controller
// ==========================================
// This test file runs within the native Node.js test runner environment (Node 18+).
// It verifies that the task controllers correctly format and return database data,
// handle invalid input schemas, and manage errors appropriately.
//
// By using native Node.js testing libraries (node:test, node:assert), we keep the
// dependencies lightweight and run test execution extremely fast.

const assert = require('node:assert');
const test = require('node:test');
const db = require('../databse'); // Import database module to mock its query method
const { getTasks, getTaskById } = require('./taskController');

// ----------------------------------------------------
// Test Suite: getTasks Controller
// ----------------------------------------------------
test('getTasks controller - returns all tasks mapped to camelCase', async (t) => {
  // Mock data representing database rows in snake_case format
  const mockDbRows = [
    {
      id: 'd3b07384-d113-49cd-a5d6-8ee3c2e176df',
      title: 'Setup CI Pipeline',
      description: 'Define workflow triggers and actions',
      status: 'in-progress',
      created_at: new Date('2026-08-20T00:00:00Z'),
      updated_at: new Date('2026-08-20T01:00:00Z')
    }
  ];

  // Store the original db.query method to restore it after the test
  const originalQuery = db.query;
  
  // Mock db.query to resolve instantly without connecting to a real Postgres instance
  db.query = async (text, params) => {
    return { rows: mockDbRows };
  };

  // Ensure the mock is reverted after this test case completes
  t.after(() => {
    db.query = originalQuery;
  });

  // Track if response methods were called
  let jsonCalled = false;
  let responsePayload = null;

  // Mock Express request (req) and response (res) objects
  const req = { query: {} };
  const res = {
    json: (data) => {
      jsonCalled = true;
      responsePayload = data;
      return res;
    }
  };
  const next = (err) => {
    assert.fail(`Controller called next() error handler unexpectedly: ${err.message}`);
  };

  // Execute the controller action
  await getTasks(req, res, next);

  // Assertions: verify the database data is converted correctly to camelCase
  assert.strictEqual(jsonCalled, true, 'res.json() must be called');
  assert.strictEqual(responsePayload.length, 1, 'Should return exactly 1 task');
  
  const task = responsePayload[0];
  assert.strictEqual(task.id, 'd3b07384-d113-49cd-a5d6-8ee3c2e176df');
  assert.strictEqual(task.title, 'Setup CI Pipeline');
  assert.strictEqual(task.createdAt instanceof Date || typeof task.createdAt === 'string', true);
  assert.strictEqual(task.createdAt.toString(), mockDbRows[0].created_at.toString());
});

// ----------------------------------------------------
// Test Suite: getTaskById Controller
// ----------------------------------------------------
test('getTaskById controller - rejects invalid UUID format', async (t) => {
  const req = { params: { id: 'invalid-uuid-format-123' } };
  let statusCalledWith = null;
  let jsonCalled = false;
  let responsePayload = null;

  const res = {
    status: (code) => {
      statusCalledWith = code;
      return res;
    },
    json: (data) => {
      jsonCalled = true;
      responsePayload = data;
      return res;
    }
  };
  const next = () => {
    assert.fail('Controller called next() error handler unexpectedly');
  };

  // Run controller with invalid ID
  await getTaskById(req, res, next);

  // Assertions: verify the client is met with a 400 Bad Request
  assert.strictEqual(statusCalledWith, 400, 'HTTP status code must be 400');
  assert.strictEqual(jsonCalled, true, 'res.json() must be called');
  assert.strictEqual(responsePayload.error, 'Invalid task ID format');
});

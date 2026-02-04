import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SERVER = join(ROOT, 'server');

describe('search and filter in todos route', () => {
  const routePath = join(SERVER, 'src', 'routes', 'todos.ts');
  let content;

  it('route file exists', () => {
    assert.ok(existsSync(routePath));
    content = readFileSync(routePath, 'utf-8');
  });

  it('supports ?search query parameter with case-insensitive matching', () => {
    assert.ok(
      content.includes('req.query.search'),
      'GET handler should read search query parameter'
    );
    assert.ok(
      content.includes('ILIKE'),
      'search should use ILIKE for case-insensitive matching'
    );
  });

  it('supports ?status=active filter', () => {
    assert.ok(
      content.includes("req.query.status === 'active'"),
      'GET handler should check for status=active'
    );
  });

  it('supports ?status=completed filter', () => {
    assert.ok(
      content.includes("req.query.status === 'completed'"),
      'GET handler should check for status=completed'
    );
  });

  it('supports ?priority filter for high, medium, low', () => {
    assert.ok(
      content.includes('req.query.priority'),
      'GET handler should read priority query parameter'
    );
    assert.ok(
      content.includes("'high'") && content.includes("'medium'") && content.includes("'low'"),
      'should validate against high, medium, low values'
    );
  });

  it('uses parameterized queries to prevent SQL injection', () => {
    assert.ok(
      content.includes('$1') && content.includes('params'),
      'should use parameterized queries with numbered placeholders'
    );
  });

  it('combines multiple filters with AND clauses', () => {
    assert.ok(
      content.includes("join(' AND ')") || content.includes('.join('),
      'should join conditions with AND'
    );
  });
});

describe('search and filter tests in server', () => {
  const testPath = join(SERVER, 'src', 'routes', 'todos.test.ts');
  let content;

  it('test file exists', () => {
    assert.ok(existsSync(testPath));
    content = readFileSync(testPath, 'utf-8');
  });

  it('has tests for search filter', () => {
    assert.ok(
      content.includes('search'),
      'should have tests for search functionality'
    );
  });

  it('has tests for status filter', () => {
    assert.ok(
      content.includes('status=active') || content.includes('status=completed'),
      'should have tests for status filter'
    );
  });

  it('has tests for priority filter', () => {
    assert.ok(
      content.includes('priority=high') || content.includes('priority='),
      'should have tests for priority filter'
    );
  });

  it('has tests for combined filters', () => {
    assert.ok(
      content.includes('combines') || (content.includes('search') && content.includes('status') && content.includes('priority')),
      'should have tests for combined filters'
    );
  });
});

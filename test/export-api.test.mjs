import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SERVER = join(ROOT, 'server');

describe('export route file', () => {
  const routePath = join(SERVER, 'src', 'routes', 'export.ts');
  let content;

  it('exists', () => {
    assert.ok(existsSync(routePath), 'server/src/routes/export.ts should exist');
    content = readFileSync(routePath, 'utf-8');
  });

  it('exports a Router', () => {
    assert.ok(
      content.includes("import { Router"),
      'export route should import Router from express'
    );
    assert.ok(
      content.includes('export default router'),
      'export route should export the router as default'
    );
  });

  it('defines GET /json handler', () => {
    assert.ok(
      content.includes("router.get('/json'"),
      'should have a GET /json handler for JSON export'
    );
  });

  it('defines GET /csv handler', () => {
    assert.ok(
      content.includes("router.get('/csv'"),
      'should have a GET /csv handler for CSV export'
    );
  });

  it('JSON handler queries both todos and subtasks', () => {
    assert.ok(
      content.includes('FROM todos') && content.includes('FROM subtasks'),
      'JSON handler should query both todos and subtasks tables'
    );
  });

  it('CSV handler uses LEFT JOIN for todos and subtasks', () => {
    assert.ok(
      content.includes('LEFT JOIN subtasks'),
      'CSV handler should use LEFT JOIN to combine todos and subtasks'
    );
  });

  it('CSV handler includes due_date and priority in query', () => {
    assert.ok(
      content.includes('due_date') && content.includes('priority'),
      'CSV handler should select due_date and priority fields'
    );
  });

  it('CSV handler sets Content-Type to text/csv', () => {
    assert.ok(
      content.includes("'text/csv'"),
      'CSV handler should set Content-Type to text/csv'
    );
  });

  it('CSV handler sets Content-Disposition for file download', () => {
    assert.ok(
      content.includes('todos-export.csv'),
      'CSV handler should set filename to todos-export.csv'
    );
  });

  it('CSV handler escapes quotes in titles', () => {
    assert.ok(
      content.includes('""'),
      'CSV handler should escape double quotes by doubling them'
    );
  });

  it('handles errors with 500 status', () => {
    assert.ok(
      content.includes("'Failed to export todos'"),
      'JSON handler should return error message on failure'
    );
    assert.ok(
      content.includes("'Failed to export todos as CSV'"),
      'CSV handler should return error message on failure'
    );
  });
});

describe('export route is mounted in app', () => {
  const appPath = join(SERVER, 'src', 'app.ts');
  let content;

  it('app.ts exists', () => {
    assert.ok(existsSync(appPath));
    content = readFileSync(appPath, 'utf-8');
  });

  it('imports export router', () => {
    assert.ok(
      content.includes("from './routes/export'"),
      'app.ts should import the export router'
    );
  });

  it('mounts export router under /api/export', () => {
    assert.ok(
      content.includes("'/api/export'"),
      'export router should be mounted at /api/export'
    );
  });
});

describe('export route test file', () => {
  const testPath = join(SERVER, 'src', 'routes', 'export.test.ts');
  let content;

  it('exists', () => {
    assert.ok(existsSync(testPath), 'export.test.ts should exist');
    content = readFileSync(testPath, 'utf-8');
  });

  it('tests GET /api/export/json endpoint', () => {
    assert.ok(
      content.includes("describe('GET /api/export/json'"),
      'should have tests for JSON export endpoint'
    );
  });

  it('tests GET /api/export/csv endpoint', () => {
    assert.ok(
      content.includes("describe('GET /api/export/csv'"),
      'should have tests for CSV export endpoint'
    );
  });

  it('uses supertest for HTTP assertions', () => {
    assert.ok(
      content.includes("import request from 'supertest'"),
      'should use supertest for HTTP testing'
    );
  });

  it('mocks the database', () => {
    assert.ok(
      content.includes("jest.mock('../db'"),
      'should mock the database module'
    );
  });

  it('tests CSV content-type header', () => {
    assert.ok(
      content.includes('content-type'),
      'should verify CSV content-type header'
    );
  });

  it('tests CSV content-disposition header', () => {
    assert.ok(
      content.includes('content-disposition'),
      'should verify CSV content-disposition header'
    );
  });
});

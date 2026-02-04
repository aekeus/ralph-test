import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SERVER = join(ROOT, 'server');

describe('subtasks route file', () => {
  const routePath = join(SERVER, 'src', 'routes', 'subtasks.ts');
  let content;

  it('exists', () => {
    assert.ok(existsSync(routePath), 'server/src/routes/subtasks.ts should exist');
    content = readFileSync(routePath, 'utf-8');
  });

  it('exports a Router', () => {
    assert.ok(
      content.includes("import { Router"),
      'subtasks route should import Router from express'
    );
    assert.ok(
      content.includes('export default router'),
      'subtasks route should export the router as default'
    );
  });

  it('uses mergeParams to access parent todoId', () => {
    assert.ok(
      content.includes('mergeParams: true'),
      'subtasks router should use mergeParams to access :todoId'
    );
  });

  it('defines GET handler for listing subtasks', () => {
    assert.ok(
      content.includes("router.get('/'"),
      'should have a GET / handler to list subtasks'
    );
  });

  it('defines POST handler for creating subtasks', () => {
    assert.ok(
      content.includes("router.post('/'"),
      'should have a POST / handler to create subtasks'
    );
  });

  it('defines PUT handler for updating subtasks', () => {
    assert.ok(
      content.includes("router.put('/:id'"),
      'should have a PUT /:id handler to update subtasks'
    );
  });

  it('defines DELETE handler for deleting subtasks', () => {
    assert.ok(
      content.includes("router.delete('/:id'"),
      'should have a DELETE /:id handler to delete subtasks'
    );
  });

  it('validates title on creation', () => {
    assert.ok(
      content.includes("'Title is required'"),
      'POST handler should validate that title is required'
    );
  });

  it('checks that parent todo exists', () => {
    assert.ok(
      content.includes("'Todo not found'"),
      'should return 404 when parent todo does not exist'
    );
  });

  it('returns 404 for missing subtask on update and delete', () => {
    assert.ok(
      content.includes("'Subtask not found'"),
      'should return 404 when subtask is not found'
    );
  });

  it('queries the subtasks table', () => {
    assert.ok(
      content.includes('FROM subtasks') || content.includes('INTO subtasks'),
      'should query the subtasks table'
    );
  });
});

describe('subtasks route is mounted in app', () => {
  const appPath = join(SERVER, 'src', 'app.ts');
  let content;

  it('app.ts exists', () => {
    assert.ok(existsSync(appPath));
    content = readFileSync(appPath, 'utf-8');
  });

  it('imports subtasks router', () => {
    assert.ok(
      content.includes("from './routes/subtasks'"),
      'app.ts should import the subtasks router'
    );
  });

  it('mounts subtasks router under /api/todos/:todoId/subtasks', () => {
    assert.ok(
      content.includes("/api/todos/:todoId/subtasks"),
      'subtasks router should be mounted at /api/todos/:todoId/subtasks'
    );
  });
});

describe('subtasks database schema', () => {
  const schemaPath = join(SERVER, 'src', 'schema.sql');
  let content;

  it('schema.sql exists', () => {
    assert.ok(existsSync(schemaPath));
    content = readFileSync(schemaPath, 'utf-8');
  });

  it('defines subtasks table', () => {
    assert.ok(
      content.includes('CREATE TABLE IF NOT EXISTS subtasks'),
      'schema should define subtasks table'
    );
  });

  it('has todo_id foreign key with cascade delete', () => {
    assert.ok(
      content.includes('REFERENCES todos(id) ON DELETE CASCADE'),
      'subtasks should have a foreign key to todos with cascade delete'
    );
  });

  it('has title column', () => {
    assert.ok(
      content.includes('title VARCHAR(255) NOT NULL'),
      'subtasks should have a non-null title column'
    );
  });

  it('has completed column with default false', () => {
    const subtasksSection = content.slice(content.indexOf('CREATE TABLE IF NOT EXISTS subtasks'));
    assert.ok(
      subtasksSection.includes('completed BOOLEAN DEFAULT false'),
      'subtasks should have a completed column defaulting to false'
    );
  });
});

describe('subtasks route test file', () => {
  const testPath = join(SERVER, 'src', 'routes', 'subtasks.test.ts');
  let content;

  it('exists', () => {
    assert.ok(existsSync(testPath), 'subtasks.test.ts should exist');
    content = readFileSync(testPath, 'utf-8');
  });

  it('tests GET endpoint', () => {
    assert.ok(
      content.includes("describe('GET /api/todos/:todoId/subtasks'"),
      'should have tests for GET subtasks endpoint'
    );
  });

  it('tests POST endpoint', () => {
    assert.ok(
      content.includes("describe('POST /api/todos/:todoId/subtasks'"),
      'should have tests for POST subtasks endpoint'
    );
  });

  it('tests PUT endpoint', () => {
    assert.ok(
      content.includes("describe('PUT /api/todos/:todoId/subtasks/:id'"),
      'should have tests for PUT subtasks endpoint'
    );
  });

  it('tests DELETE endpoint', () => {
    assert.ok(
      content.includes("describe('DELETE /api/todos/:todoId/subtasks/:id'"),
      'should have tests for DELETE subtasks endpoint'
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
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SERVER = join(ROOT, 'server');
const CLIENT = join(ROOT, 'client');

describe('priority column in schema', () => {
  const schemaPath = join(SERVER, 'src', 'schema.sql');
  let content;

  it('schema.sql exists', () => {
    assert.ok(existsSync(schemaPath));
    content = readFileSync(schemaPath, 'utf-8');
  });

  it('todos table has priority VARCHAR(10) DEFAULT medium column', () => {
    assert.ok(
      content.includes("priority VARCHAR(10) DEFAULT 'medium'"),
      'schema should define priority VARCHAR(10) DEFAULT medium column in todos table'
    );
  });

  it('has ALTER TABLE to add priority for existing databases', () => {
    assert.ok(
      content.includes('ALTER TABLE todos ADD COLUMN IF NOT EXISTS priority'),
      'schema should include ALTER TABLE to add priority column'
    );
  });
});

describe('priority in todos route', () => {
  const routePath = join(SERVER, 'src', 'routes', 'todos.ts');
  let content;

  it('route file exists', () => {
    assert.ok(existsSync(routePath));
    content = readFileSync(routePath, 'utf-8');
  });

  it('POST handler accepts priority', () => {
    assert.ok(
      content.includes('priority') && content.includes('INSERT INTO todos (title, due_date, priority)'),
      'POST handler should accept and insert priority'
    );
  });

  it('PUT handler accepts priority', () => {
    assert.ok(
      content.includes("priority !== undefined"),
      'PUT handler should support partial update of priority'
    );
  });

  it('GET handler supports ?sort=priority query parameter', () => {
    assert.ok(
      content.includes("req.query.sort === 'priority'"),
      'GET handler should check for sort=priority query parameter'
    );
  });

  it('sorts by priority high first, then medium, then low', () => {
    assert.ok(
      content.includes("WHEN 'high' THEN 1"),
      'should order high priority first'
    );
    assert.ok(
      content.includes("WHEN 'medium' THEN 2"),
      'should order medium priority second'
    );
    assert.ok(
      content.includes("WHEN 'low' THEN 3"),
      'should order low priority third'
    );
  });
});

describe('priority in client Todo type', () => {
  const typesPath = join(CLIENT, 'src', 'types.ts');
  let content;

  it('types.ts exists', () => {
    assert.ok(existsSync(typesPath));
    content = readFileSync(typesPath, 'utf-8');
  });

  it('Todo interface includes priority field', () => {
    assert.ok(
      content.includes('priority'),
      'Todo interface should include priority field'
    );
  });

  it('priority uses union type for low, medium, high', () => {
    assert.ok(
      content.includes("'low'") && content.includes("'medium'") && content.includes("'high'"),
      'priority should be typed as low | medium | high'
    );
  });
});

describe('priority sort order verification', () => {
  const routePath = join(SERVER, 'src', 'routes', 'todos.ts');
  let content;

  it('route file exists', () => {
    assert.ok(existsSync(routePath));
    content = readFileSync(routePath, 'utf-8');
  });

  it('CASE expression orders high=1, medium=2, low=3 for correct sort', () => {
    // Extract the CASE expression and verify the ordering
    const caseMatch = content.match(/CASE priority(.*?)END/s);
    assert.ok(caseMatch, 'should have a CASE priority expression');

    const caseExpr = caseMatch[0];
    const highPos = caseExpr.indexOf("'high'");
    const mediumPos = caseExpr.indexOf("'medium'");
    const lowPos = caseExpr.indexOf("'low'");

    assert.ok(highPos < mediumPos, 'high should come before medium in CASE');
    assert.ok(mediumPos < lowPos, 'medium should come before low in CASE');

    // Verify the numeric ordering values
    assert.ok(caseExpr.includes("'high' THEN 1"), 'high should map to 1');
    assert.ok(caseExpr.includes("'medium' THEN 2"), 'medium should map to 2');
    assert.ok(caseExpr.includes("'low' THEN 3"), 'low should map to 3');
  });
});

describe('priority in server route tests', () => {
  const testPath = join(SERVER, 'src', 'routes', 'todos.test.ts');
  let content;

  it('test file exists', () => {
    assert.ok(existsSync(testPath));
    content = readFileSync(testPath, 'utf-8');
  });

  it('POST test uses updated INSERT query with priority', () => {
    assert.ok(
      content.includes('INSERT INTO todos (title, due_date, priority)'),
      'POST test should verify the updated INSERT query includes priority'
    );
  });

  it('PUT test uses updated UPDATE query with priority', () => {
    assert.ok(
      content.includes('priority = $4'),
      'PUT test should verify the updated UPDATE query includes priority'
    );
  });
});

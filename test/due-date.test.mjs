import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SERVER = join(ROOT, 'server');
const CLIENT = join(ROOT, 'client');

describe('due_date column in schema', () => {
  const schemaPath = join(SERVER, 'src', 'schema.sql');
  let content;

  it('schema.sql exists', () => {
    assert.ok(existsSync(schemaPath));
    content = readFileSync(schemaPath, 'utf-8');
  });

  it('todos table has due_date DATE column', () => {
    assert.ok(
      content.includes('due_date DATE'),
      'schema should define due_date DATE column in todos table'
    );
  });

  it('has ALTER TABLE to add due_date for existing databases', () => {
    assert.ok(
      content.includes('ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_date'),
      'schema should include ALTER TABLE to add due_date column'
    );
  });
});

describe('due_date in todos route', () => {
  const routePath = join(SERVER, 'src', 'routes', 'todos.ts');
  let content;

  it('route file exists', () => {
    assert.ok(existsSync(routePath));
    content = readFileSync(routePath, 'utf-8');
  });

  it('POST handler accepts due_date', () => {
    assert.ok(
      content.includes('due_date') && content.includes('INSERT INTO todos (title, due_date'),
      'POST handler should accept and insert due_date'
    );
  });

  it('PUT handler accepts due_date', () => {
    assert.ok(
      content.includes("due_date !== undefined"),
      'PUT handler should support partial update of due_date'
    );
  });

  it('GET handler supports ?sort=due_date query parameter', () => {
    assert.ok(
      content.includes("req.query.sort === 'due_date'"),
      'GET handler should check for sort=due_date query parameter'
    );
  });

  it('sorts by due_date ASC NULLS LAST when sort=due_date', () => {
    assert.ok(
      content.includes('ORDER BY due_date ASC NULLS LAST'),
      'should order by due_date ascending with nulls last'
    );
  });
});

describe('due_date in client Todo type', () => {
  const typesPath = join(CLIENT, 'src', 'types.ts');
  let content;

  it('types.ts exists', () => {
    assert.ok(existsSync(typesPath));
    content = readFileSync(typesPath, 'utf-8');
  });

  it('Todo interface includes due_date field', () => {
    assert.ok(
      content.includes('due_date'),
      'Todo interface should include due_date field'
    );
  });

  it('due_date is nullable (string | null)', () => {
    assert.ok(
      content.includes('string | null'),
      'due_date should be typed as string | null'
    );
  });
});

describe('due_date in server route tests', () => {
  const testPath = join(SERVER, 'src', 'routes', 'todos.test.ts');
  let content;

  it('test file exists', () => {
    assert.ok(existsSync(testPath));
    content = readFileSync(testPath, 'utf-8');
  });

  it('POST test uses updated INSERT query with due_date', () => {
    assert.ok(
      content.includes('INSERT INTO todos (title, due_date'),
      'POST test should verify the updated INSERT query includes due_date'
    );
  });

  it('PUT test uses updated UPDATE query with due_date', () => {
    assert.ok(
      content.includes('due_date = $3'),
      'PUT test should verify the updated UPDATE query includes due_date'
    );
  });
});

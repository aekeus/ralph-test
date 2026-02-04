import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

describe('dev scripts', () => {
  let pkg;

  it('root package.json exists', () => {
    const path = join(ROOT, 'package.json');
    assert.ok(existsSync(path));
    pkg = JSON.parse(readFileSync(path, 'utf-8'));
  });

  it('has dev:server script that runs server dev via workspace', () => {
    assert.ok(pkg.scripts['dev:server'], 'dev:server script should be defined');
    assert.ok(
      pkg.scripts['dev:server'].includes('server'),
      'dev:server should reference the server workspace'
    );
  });

  it('has dev:client script that runs client dev via workspace', () => {
    assert.ok(pkg.scripts['dev:client'], 'dev:client script should be defined');
    assert.ok(
      pkg.scripts['dev:client'].includes('client'),
      'dev:client should reference the client workspace'
    );
  });

  it('has dev script that runs both concurrently', () => {
    assert.ok(pkg.scripts.dev, 'dev script should be defined');
    assert.ok(
      pkg.scripts.dev.includes('concurrently'),
      'dev script should use concurrently'
    );
    assert.ok(
      pkg.scripts.dev.includes('dev:server'),
      'dev script should reference dev:server'
    );
    assert.ok(
      pkg.scripts.dev.includes('dev:client'),
      'dev script should reference dev:client'
    );
  });

  it('has concurrently as a devDependency', () => {
    assert.ok(
      pkg.devDependencies && pkg.devDependencies.concurrently,
      'concurrently should be listed as a devDependency'
    );
  });

  it('concurrently binary is available', () => {
    const binPath = join(ROOT, 'node_modules', '.bin', 'concurrently');
    assert.ok(existsSync(binPath), 'concurrently binary should exist in node_modules/.bin');
  });
});

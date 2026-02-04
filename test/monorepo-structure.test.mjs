import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

describe('monorepo structure', () => {
  it('has server/ directory', () => {
    assert.ok(existsSync(join(ROOT, 'server')));
  });

  it('has client/ directory', () => {
    assert.ok(existsSync(join(ROOT, 'client')));
  });

  it('has server/src/ directory', () => {
    assert.ok(existsSync(join(ROOT, 'server', 'src')));
  });

  it('has client/src/ directory', () => {
    assert.ok(existsSync(join(ROOT, 'client', 'src')));
  });
});

describe('root package.json', () => {
  let pkg;

  it('exists', () => {
    const path = join(ROOT, 'package.json');
    assert.ok(existsSync(path));
    pkg = JSON.parse(readFileSync(path, 'utf-8'));
  });

  it('is private', () => {
    assert.strictEqual(pkg.private, true);
  });

  it('defines workspaces with server and client', () => {
    assert.ok(Array.isArray(pkg.workspaces));
    assert.ok(pkg.workspaces.includes('server'));
    assert.ok(pkg.workspaces.includes('client'));
  });
});

describe('server package.json', () => {
  let pkg;

  it('exists', () => {
    const path = join(ROOT, 'server', 'package.json');
    assert.ok(existsSync(path));
    pkg = JSON.parse(readFileSync(path, 'utf-8'));
  });

  it('has name "server"', () => {
    assert.strictEqual(pkg.name, 'server');
  });
});

describe('client package.json', () => {
  let pkg;

  it('exists', () => {
    const path = join(ROOT, 'client', 'package.json');
    assert.ok(existsSync(path));
    pkg = JSON.parse(readFileSync(path, 'utf-8'));
  });

  it('has name "client"', () => {
    assert.strictEqual(pkg.name, 'client');
  });
});

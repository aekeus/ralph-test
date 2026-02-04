import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const CLIENT = join(ROOT, 'client');

describe('client Vite + React + TypeScript setup', () => {
  let pkg;

  it('has client/package.json', () => {
    const path = join(CLIENT, 'package.json');
    assert.ok(existsSync(path));
    pkg = JSON.parse(readFileSync(path, 'utf-8'));
  });

  it('has name "client"', () => {
    assert.strictEqual(pkg.name, 'client');
  });

  it('has type "module"', () => {
    assert.strictEqual(pkg.type, 'module');
  });

  it('has react dependency', () => {
    assert.ok(pkg.dependencies.react, 'react should be a dependency');
  });

  it('has react-dom dependency', () => {
    assert.ok(pkg.dependencies['react-dom'], 'react-dom should be a dependency');
  });

  it('has axios dependency', () => {
    assert.ok(pkg.dependencies.axios, 'axios should be a dependency');
  });

  it('has @vitejs/plugin-react devDependency', () => {
    assert.ok(
      pkg.devDependencies['@vitejs/plugin-react'],
      '@vitejs/plugin-react should be a devDependency'
    );
  });

  it('has typescript devDependency', () => {
    assert.ok(
      pkg.devDependencies.typescript,
      'typescript should be a devDependency'
    );
  });

  it('has vite devDependency', () => {
    assert.ok(
      pkg.devDependencies.vite,
      'vite should be a devDependency'
    );
  });

  it('has dev script using vite', () => {
    assert.ok(pkg.scripts.dev, 'dev script should exist');
    assert.ok(pkg.scripts.dev.includes('vite'), 'dev script should use vite');
  });

  it('has build script', () => {
    assert.ok(pkg.scripts.build, 'build script should exist');
  });
});

describe('client project files', () => {
  it('has index.html', () => {
    assert.ok(existsSync(join(CLIENT, 'index.html')));
  });

  it('has vite.config.ts', () => {
    assert.ok(existsSync(join(CLIENT, 'vite.config.ts')));
  });

  it('has tsconfig.json', () => {
    assert.ok(existsSync(join(CLIENT, 'tsconfig.json')));
  });

  it('has src/App.tsx', () => {
    assert.ok(existsSync(join(CLIENT, 'src', 'App.tsx')));
  });

  it('has src/main.tsx', () => {
    assert.ok(existsSync(join(CLIENT, 'src', 'main.tsx')));
  });

  it('vite.config.ts uses react plugin', () => {
    const config = readFileSync(join(CLIENT, 'vite.config.ts'), 'utf-8');
    assert.ok(
      config.includes('@vitejs/plugin-react'),
      'vite.config.ts should import @vitejs/plugin-react'
    );
  });
});

describe('client TypeScript configuration', () => {
  it('has tsconfig.app.json with JSX support', () => {
    const path = join(CLIENT, 'tsconfig.app.json');
    assert.ok(existsSync(path));
    const content = readFileSync(path, 'utf-8');
    assert.ok(
      content.includes('"jsx"'),
      'tsconfig.app.json should have jsx option set'
    );
  });
});

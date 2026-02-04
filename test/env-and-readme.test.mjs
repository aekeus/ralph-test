import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

describe('server/.env.example', () => {
  const envPath = join(ROOT, 'server', '.env.example');
  let content;

  it('exists', () => {
    assert.ok(existsSync(envPath), 'server/.env.example should exist');
    content = readFileSync(envPath, 'utf-8');
  });

  it('contains DATABASE_URL', () => {
    assert.ok(
      content.includes('DATABASE_URL='),
      '.env.example should contain DATABASE_URL'
    );
  });

  it('contains PORT', () => {
    assert.ok(
      content.includes('PORT='),
      '.env.example should contain PORT'
    );
  });

  it('DATABASE_URL has a postgresql connection string', () => {
    const match = content.match(/DATABASE_URL=(.+)/);
    assert.ok(match, 'DATABASE_URL should have a value');
    assert.ok(
      match[1].startsWith('postgresql://'),
      'DATABASE_URL should be a postgresql connection string'
    );
  });
});

describe('root README.md', () => {
  const readmePath = join(ROOT, 'README.md');
  let content;

  it('exists', () => {
    assert.ok(existsSync(readmePath), 'README.md should exist');
    content = readFileSync(readmePath, 'utf-8');
  });

  it('has a project title', () => {
    assert.ok(content.startsWith('#'), 'README should start with a heading');
  });

  it('mentions npm install', () => {
    assert.ok(
      content.includes('npm install'),
      'README should include npm install instruction'
    );
  });

  it('mentions database setup', () => {
    assert.ok(
      content.includes('createdb') || content.includes('CREATE DATABASE') || content.includes('database'),
      'README should mention database setup'
    );
  });

  it('references .env.example', () => {
    assert.ok(
      content.includes('.env.example'),
      'README should reference .env.example'
    );
  });

  it('mentions running the server', () => {
    assert.ok(
      content.includes('dev') && content.includes('server'),
      'README should include instructions for running the server'
    );
  });

  it('mentions running the client', () => {
    assert.ok(
      content.includes('dev') && content.includes('client'),
      'README should include instructions for running the client'
    );
  });

  it('mentions testing', () => {
    assert.ok(
      content.includes('npm test') || content.includes('test'),
      'README should include testing instructions'
    );
  });
});

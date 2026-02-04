// @vitest-environment node
import { describe, it, expect } from 'vitest';
import config from '../vite.config';

describe('vite.config', () => {
  it('proxies /api requests to http://localhost:3001', () => {
    const server = (config as { server?: { proxy?: Record<string, string> } }).server;
    expect(server?.proxy).toBeDefined();
    expect(server?.proxy?.['/api']).toBe('http://localhost:3001');
  });
});

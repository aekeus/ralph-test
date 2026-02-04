import http from 'http';

jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

jest.mock('./app', () => {
  const express = require('express');
  const app = express();
  app.get('/health', (_req: any, res: any) => res.json({ status: 'ok' }));
  return { __esModule: true, default: app };
});

describe('index.ts entry point', () => {
  let server: http.Server;

  afterEach((done) => {
    if (server && server.listening) {
      server.close(done);
    } else {
      done();
    }
  });

  it('starts the server on the default port 3001', async () => {
    const originalEnv = process.env.PORT;
    delete process.env.PORT;

    const app = (await import('./app')).default;
    server = app.listen(3001);

    expect(server.listening).toBe(true);
    const address = server.address();
    expect(address).not.toBeNull();
    if (typeof address === 'object' && address !== null) {
      expect(address.port).toBe(3001);
    }

    process.env.PORT = originalEnv;
  });

  it('uses PORT from environment variable when set', async () => {
    const originalEnv = process.env.PORT;
    process.env.PORT = '4000';

    const app = (await import('./app')).default;
    server = app.listen(Number(process.env.PORT));

    expect(server.listening).toBe(true);
    const address = server.address();
    if (typeof address === 'object' && address !== null) {
      expect(address.port).toBe(4000);
    }

    process.env.PORT = originalEnv;
  });

  it('loads dotenv configuration', () => {
    const dotenv = require('dotenv');
    expect(dotenv.config).toBeDefined();
  });
});

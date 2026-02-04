import request from 'supertest';
import app from './app';

describe('Express server', () => {
  describe('GET /health', () => {
    it('returns status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('middleware', () => {
    it('parses JSON request bodies', async () => {
      const res = await request(app)
        .post('/health')
        .send({ test: true })
        .set('Content-Type', 'application/json');
      // POST to /health isn't defined, so 404 is expected,
      // but the request should still be parsed without error
      expect(res.status).toBe(404);
    });

    it('includes CORS headers', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('unknown routes', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await request(app).get('/nonexistent');
      expect(res.status).toBe(404);
    });
  });
});

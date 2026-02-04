import request from 'supertest';
import app from '../app';
import pool from '../db';

jest.mock('../db', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

const mockQuery = pool.query as jest.Mock;

afterEach(() => {
  mockQuery.mockReset();
});

describe('GET /api/tags', () => {
  it('returns all tags', async () => {
    const tags = [
      { id: 1, name: 'work', color: '#6366f1' },
      { id: 2, name: 'personal', color: '#22c55e' },
    ];
    mockQuery.mockResolvedValue({ rows: tags });

    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(tags);
    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM tags ORDER BY name ASC');
  });

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch tags' });
  });
});

describe('POST /api/tags', () => {
  it('creates a new tag with default color', async () => {
    const newTag = { id: 1, name: 'urgent', color: '#6366f1' };
    mockQuery.mockResolvedValue({ rows: [newTag] });

    const res = await request(app)
      .post('/api/tags')
      .send({ name: 'urgent' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(newTag);
    expect(mockQuery).toHaveBeenCalledWith(
      'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *',
      ['urgent', '#6366f1']
    );
  });

  it('creates a new tag with custom color', async () => {
    const newTag = { id: 1, name: 'work', color: '#ef4444' };
    mockQuery.mockResolvedValue({ rows: [newTag] });

    const res = await request(app)
      .post('/api/tags')
      .send({ name: 'work', color: '#ef4444' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(newTag);
    expect(mockQuery).toHaveBeenCalledWith(
      'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *',
      ['work', '#ef4444']
    );
  });

  it('trims whitespace from name', async () => {
    const newTag = { id: 1, name: 'trimmed', color: '#6366f1' };
    mockQuery.mockResolvedValue({ rows: [newTag] });

    await request(app)
      .post('/api/tags')
      .send({ name: '  trimmed  ' });

    expect(mockQuery).toHaveBeenCalledWith(
      'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *',
      ['trimmed', '#6366f1']
    );
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/tags')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Name is required' });
  });

  it('returns 400 when name is empty string', async () => {
    const res = await request(app)
      .post('/api/tags')
      .send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Name is required' });
  });

  it('returns 400 when name is not a string', async () => {
    const res = await request(app)
      .post('/api/tags')
      .send({ name: 123 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Name is required' });
  });

  it('returns 409 when tag already exists (unique constraint)', async () => {
    mockQuery.mockRejectedValue({ code: '23505' });

    const res = await request(app)
      .post('/api/tags')
      .send({ name: 'duplicate' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Tag already exists' });
  });

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/tags')
      .send({ name: 'test' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to create tag' });
  });
});

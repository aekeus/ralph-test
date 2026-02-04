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

describe('POST /api/todos/:todoId/tags', () => {
  it('adds a tag to a todo and returns all tags', async () => {
    const tags = [
      { id: 1, name: 'work', color: '#6366f1' },
    ];
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // todo exists
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // tag exists
      .mockResolvedValueOnce({ rows: [] }) // insert
      .mockResolvedValueOnce({ rows: tags }); // fetch tags

    const res = await request(app)
      .post('/api/todos/1/tags')
      .send({ tag_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(tags);
  });

  it('returns 400 when tag_id is missing', async () => {
    const res = await request(app)
      .post('/api/todos/1/tags')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'tag_id is required and must be a number' });
  });

  it('returns 400 when tag_id is not a number', async () => {
    const res = await request(app)
      .post('/api/todos/1/tags')
      .send({ tag_id: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'tag_id is required and must be a number' });
  });

  it('returns 404 when todo not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // todo not found

    const res = await request(app)
      .post('/api/todos/999/tags')
      .send({ tag_id: 1 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Todo not found' });
  });

  it('returns 404 when tag not found', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // todo exists
      .mockResolvedValueOnce({ rows: [] }); // tag not found

    const res = await request(app)
      .post('/api/todos/1/tags')
      .send({ tag_id: 999 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Tag not found' });
  });

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/todos/1/tags')
      .send({ tag_id: 1 });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to add tag to todo' });
  });
});

describe('DELETE /api/todos/:todoId/tags/:tagId', () => {
  it('removes a tag from a todo', async () => {
    mockQuery.mockResolvedValue({ rows: [{ todo_id: 1, tag_id: 1 }] });

    const res = await request(app).delete('/api/todos/1/tags/1');

    expect(res.status).toBe(204);
    expect(mockQuery).toHaveBeenCalledWith(
      'DELETE FROM todo_tags WHERE todo_id = $1 AND tag_id = $2 RETURNING *',
      ['1', '1']
    );
  });

  it('returns 404 when tag not associated with todo', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const res = await request(app).delete('/api/todos/1/tags/999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Tag not associated with this todo' });
  });

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const res = await request(app).delete('/api/todos/1/tags/1');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to remove tag from todo' });
  });
});

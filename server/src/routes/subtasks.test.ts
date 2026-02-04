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

describe('GET /api/todos/:todoId/subtasks', () => {
  it('returns all subtasks for a todo', async () => {
    const subtasks = [
      { id: 1, todo_id: 1, title: 'Subtask 1', completed: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
      { id: 2, todo_id: 1, title: 'Subtask 2', completed: true, created_at: '2024-01-02', updated_at: '2024-01-02' },
    ];
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // todo exists
      .mockResolvedValueOnce({ rows: subtasks });

    const res = await request(app).get('/api/todos/1/subtasks');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(subtasks);
  });

  it('returns 404 when todo not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/todos/999/subtasks');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Todo not found' });
  });

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/todos/1/subtasks');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch subtasks' });
  });
});

describe('POST /api/todos/:todoId/subtasks', () => {
  it('creates a new subtask', async () => {
    const newSubtask = { id: 1, todo_id: 1, title: 'New subtask', completed: false };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // todo exists
      .mockResolvedValueOnce({ rows: [newSubtask] });

    const res = await request(app)
      .post('/api/todos/1/subtasks')
      .send({ title: 'New subtask' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(newSubtask);
  });

  it('trims whitespace from title', async () => {
    const newSubtask = { id: 1, todo_id: 1, title: 'Trimmed', completed: false };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [newSubtask] });

    await request(app)
      .post('/api/todos/1/subtasks')
      .send({ title: '  Trimmed  ' });

    expect(mockQuery).toHaveBeenLastCalledWith(
      'INSERT INTO subtasks (todo_id, title) VALUES ($1, $2) RETURNING *',
      ['1', 'Trimmed']
    );
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/todos/1/subtasks')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Title is required' });
  });

  it('returns 400 when title is empty string', async () => {
    const res = await request(app)
      .post('/api/todos/1/subtasks')
      .send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Title is required' });
  });

  it('returns 400 when title is not a string', async () => {
    const res = await request(app)
      .post('/api/todos/1/subtasks')
      .send({ title: 123 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Title is required' });
  });

  it('returns 404 when todo not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/todos/999/subtasks')
      .send({ title: 'Test' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Todo not found' });
  });

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/todos/1/subtasks')
      .send({ title: 'Test' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to create subtask' });
  });
});

describe('PUT /api/todos/:todoId/subtasks/:id', () => {
  const existingSubtask = { id: 1, todo_id: 1, title: 'Old title', completed: false };

  it('updates a subtask', async () => {
    const updatedSubtask = { id: 1, todo_id: 1, title: 'Updated title', completed: true };
    mockQuery
      .mockResolvedValueOnce({ rows: [existingSubtask] })
      .mockResolvedValueOnce({ rows: [updatedSubtask] });

    const res = await request(app)
      .put('/api/todos/1/subtasks/1')
      .send({ title: 'Updated title', completed: true });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedSubtask);
  });

  it('allows partial update with only title', async () => {
    const updatedSubtask = { id: 1, todo_id: 1, title: 'New title', completed: false };
    mockQuery
      .mockResolvedValueOnce({ rows: [existingSubtask] })
      .mockResolvedValueOnce({ rows: [updatedSubtask] });

    const res = await request(app)
      .put('/api/todos/1/subtasks/1')
      .send({ title: 'New title' });

    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenLastCalledWith(
      'UPDATE subtasks SET title = $1, completed = $2, updated_at = NOW() WHERE id = $3 AND todo_id = $4 RETURNING *',
      ['New title', false, '1', '1']
    );
  });

  it('allows partial update with only completed', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [existingSubtask] })
      .mockResolvedValueOnce({ rows: [{ ...existingSubtask, completed: true }] });

    const res = await request(app)
      .put('/api/todos/1/subtasks/1')
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenLastCalledWith(
      'UPDATE subtasks SET title = $1, completed = $2, updated_at = NOW() WHERE id = $3 AND todo_id = $4 RETURNING *',
      ['Old title', true, '1', '1']
    );
  });

  it('returns 404 when subtask not found', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const res = await request(app)
      .put('/api/todos/1/subtasks/999')
      .send({ title: 'Updated' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Subtask not found' });
  });

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .put('/api/todos/1/subtasks/1')
      .send({ title: 'Test' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to update subtask' });
  });
});

describe('DELETE /api/todos/:todoId/subtasks/:id', () => {
  it('deletes a subtask', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1 }] });

    const res = await request(app).delete('/api/todos/1/subtasks/1');

    expect(res.status).toBe(204);
    expect(mockQuery).toHaveBeenCalledWith(
      'DELETE FROM subtasks WHERE id = $1 AND todo_id = $2 RETURNING *',
      ['1', '1']
    );
  });

  it('returns 404 when subtask not found', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const res = await request(app).delete('/api/todos/1/subtasks/999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Subtask not found' });
  });

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const res = await request(app).delete('/api/todos/1/subtasks/1');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to delete subtask' });
  });
});

import request from 'supertest';
import app from '../app';
import pool from '../db';

const mockClientQueryFn = jest.fn();
const mockClientReleaseFn = jest.fn();

jest.mock('../db', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

const mockQuery = pool.query as jest.Mock;
const mockConnect = (pool as any).connect as jest.Mock;

beforeEach(() => {
  mockConnect.mockResolvedValue({
    query: mockClientQueryFn,
    release: mockClientReleaseFn,
  });
});

afterEach(() => {
  mockQuery.mockReset();
  mockConnect.mockReset();
  mockClientQueryFn.mockReset();
  mockClientReleaseFn.mockReset();
});

describe('GET /api/todos', () => {
  it('returns all todos', async () => {
    const todos = [
      { id: 1, title: 'Test todo', completed: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
      { id: 2, title: 'Another todo', completed: true, created_at: '2024-01-02', updated_at: '2024-01-02' },
    ];
    mockQuery.mockResolvedValue({ rows: todos });

    const res = await request(app).get('/api/todos');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(todos);
    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM todos  ORDER BY position ASC NULLS LAST, created_at DESC', []);
  });

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/todos');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch todos' });
  });
});

describe('GET /api/todos - search and filters', () => {
  it('filters by search text (case-insensitive)', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await request(app).get('/api/todos?search=grocery');

    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT * FROM todos WHERE title ILIKE $1 ORDER BY position ASC NULLS LAST, created_at DESC',
      ['%grocery%']
    );
  });

  it('filters by status=active', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await request(app).get('/api/todos?status=active');

    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT * FROM todos WHERE completed = $1 ORDER BY position ASC NULLS LAST, created_at DESC',
      [false]
    );
  });

  it('filters by status=completed', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await request(app).get('/api/todos?status=completed');

    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT * FROM todos WHERE completed = $1 ORDER BY position ASC NULLS LAST, created_at DESC',
      [true]
    );
  });

  it('filters by priority', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await request(app).get('/api/todos?priority=high');

    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT * FROM todos WHERE priority = $1 ORDER BY position ASC NULLS LAST, created_at DESC',
      ['high']
    );
  });

  it('ignores invalid priority values', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await request(app).get('/api/todos?priority=urgent');

    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT * FROM todos  ORDER BY position ASC NULLS LAST, created_at DESC',
      []
    );
  });

  it('combines search and status filters', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await request(app).get('/api/todos?search=buy&status=active');

    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT * FROM todos WHERE title ILIKE $1 AND completed = $2 ORDER BY position ASC NULLS LAST, created_at DESC',
      ['%buy%', false]
    );
  });

  it('combines search, status, and priority filters', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await request(app).get('/api/todos?search=task&status=active&priority=high');

    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT * FROM todos WHERE title ILIKE $1 AND completed = $2 AND priority = $3 ORDER BY position ASC NULLS LAST, created_at DESC',
      ['%task%', false, 'high']
    );
  });

  it('combines filters with sort', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await request(app).get('/api/todos?status=completed&sort=priority');

    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT * FROM todos WHERE completed = $1 ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END",
      [true]
    );
  });
});

describe('GET /api/todos/:id', () => {
  it('returns a single todo', async () => {
    const todo = { id: 1, title: 'Test todo', completed: false };
    mockQuery.mockResolvedValue({ rows: [todo] });

    const res = await request(app).get('/api/todos/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(todo);
    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM todos WHERE id = $1', ['1']);
  });

  it('returns 404 when todo not found', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const res = await request(app).get('/api/todos/999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Todo not found' });
  });

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/todos/1');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch todo' });
  });
});

describe('POST /api/todos', () => {
  it('creates a new todo', async () => {
    const newTodo = { id: 1, title: 'New todo', completed: false };
    mockQuery.mockResolvedValue({ rows: [newTodo] });

    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'New todo' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(newTodo);
    expect(mockQuery).toHaveBeenCalledWith(
      'INSERT INTO todos (title, due_date, priority) VALUES ($1, $2, $3) RETURNING *',
      ['New todo', null, 'medium']
    );
  });

  it('trims whitespace from title', async () => {
    const newTodo = { id: 1, title: 'Trimmed', completed: false };
    mockQuery.mockResolvedValue({ rows: [newTodo] });

    await request(app)
      .post('/api/todos')
      .send({ title: '  Trimmed  ' });

    expect(mockQuery).toHaveBeenCalledWith(
      'INSERT INTO todos (title, due_date, priority) VALUES ($1, $2, $3) RETURNING *',
      ['Trimmed', null, 'medium']
    );
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Title is required' });
  });

  it('returns 400 when title is empty string', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Title is required' });
  });

  it('returns 400 when title is not a string', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 123 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Title is required' });
  });

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'Test' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to create todo' });
  });
});

describe('PUT /api/todos/:id', () => {
  const existingTodo = { id: 1, title: 'Old title', completed: false };

  it('updates a todo', async () => {
    const updatedTodo = { id: 1, title: 'Updated title', completed: true };
    mockQuery
      .mockResolvedValueOnce({ rows: [existingTodo] })
      .mockResolvedValueOnce({ rows: [updatedTodo] });

    const res = await request(app)
      .put('/api/todos/1')
      .send({ title: 'Updated title', completed: true });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedTodo);
  });

  it('allows partial update with only title', async () => {
    const updatedTodo = { id: 1, title: 'New title', completed: false };
    mockQuery
      .mockResolvedValueOnce({ rows: [existingTodo] })
      .mockResolvedValueOnce({ rows: [updatedTodo] });

    const res = await request(app)
      .put('/api/todos/1')
      .send({ title: 'New title' });

    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenLastCalledWith(
      'UPDATE todos SET title = $1, completed = $2, due_date = $3, priority = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      ['New title', false, undefined, undefined, '1']
    );
  });

  it('allows partial update with only completed', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [existingTodo] })
      .mockResolvedValueOnce({ rows: [{ ...existingTodo, completed: true }] });

    const res = await request(app)
      .put('/api/todos/1')
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenLastCalledWith(
      'UPDATE todos SET title = $1, completed = $2, due_date = $3, priority = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      ['Old title', true, undefined, undefined, '1']
    );
  });

  it('returns 404 when todo not found', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const res = await request(app)
      .put('/api/todos/999')
      .send({ title: 'Updated' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Todo not found' });
  });

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .put('/api/todos/1')
      .send({ title: 'Test' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to update todo' });
  });
});

describe('DELETE /api/todos/:id', () => {
  it('deletes a todo', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1 }] });

    const res = await request(app).delete('/api/todos/1');

    expect(res.status).toBe(204);
    expect(mockQuery).toHaveBeenCalledWith('DELETE FROM todos WHERE id = $1 RETURNING *', ['1']);
  });

  it('returns 404 when todo not found', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const res = await request(app).delete('/api/todos/999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Todo not found' });
  });

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const res = await request(app).delete('/api/todos/1');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to delete todo' });
  });
});

describe('PUT /api/todos/reorder', () => {
  it('updates positions for all provided todos in a transaction', async () => {
    const orders = [
      { id: 1, position: 0 },
      { id: 2, position: 1 },
      { id: 3, position: 2 },
    ];

    const res = await request(app)
      .put('/api/todos/reorder')
      .send({ orders });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockClientQueryFn).toHaveBeenCalledWith('BEGIN');
    expect(mockClientQueryFn).toHaveBeenCalledWith(
      'UPDATE todos SET position = $1, updated_at = NOW() WHERE id = $2',
      [0, 1]
    );
    expect(mockClientQueryFn).toHaveBeenCalledWith(
      'UPDATE todos SET position = $1, updated_at = NOW() WHERE id = $2',
      [1, 2]
    );
    expect(mockClientQueryFn).toHaveBeenCalledWith(
      'UPDATE todos SET position = $1, updated_at = NOW() WHERE id = $2',
      [2, 3]
    );
    expect(mockClientQueryFn).toHaveBeenCalledWith('COMMIT');
    expect(mockClientReleaseFn).toHaveBeenCalled();
  });

  it('returns 400 when orders is not an array', async () => {
    const res = await request(app)
      .put('/api/todos/reorder')
      .send({ orders: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'orders must be a non-empty array of {id, position}' });
  });

  it('returns 400 when orders is empty', async () => {
    const res = await request(app)
      .put('/api/todos/reorder')
      .send({ orders: [] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'orders must be a non-empty array of {id, position}' });
  });

  it('returns 400 when items have invalid types', async () => {
    const res = await request(app)
      .put('/api/todos/reorder')
      .send({ orders: [{ id: 'abc', position: 0 }] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Each item must have numeric id and position' });
  });

  it('rolls back transaction on database error', async () => {
    mockClientQueryFn.mockImplementation((sql: string) => {
      if (sql === 'BEGIN') return Promise.resolve();
      if (sql.startsWith('UPDATE')) return Promise.reject(new Error('DB error'));
      return Promise.resolve();
    });

    const res = await request(app)
      .put('/api/todos/reorder')
      .send({ orders: [{ id: 1, position: 0 }] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to reorder todos' });
    expect(mockClientQueryFn).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClientReleaseFn).toHaveBeenCalled();
  });
});

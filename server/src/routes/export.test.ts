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

describe('GET /api/export/json', () => {
  it('returns all todos with their subtasks', async () => {
    const todos = [
      { id: 1, title: 'Todo 1', completed: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
      { id: 2, title: 'Todo 2', completed: true, created_at: '2024-01-02', updated_at: '2024-01-02' },
    ];
    const subtasks = [
      { id: 1, todo_id: 1, title: 'Subtask 1', completed: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
      { id: 2, todo_id: 1, title: 'Subtask 2', completed: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
      { id: 3, todo_id: 2, title: 'Subtask 3', completed: false, created_at: '2024-01-02', updated_at: '2024-01-02' },
    ];
    mockQuery
      .mockResolvedValueOnce({ rows: todos })
      .mockResolvedValueOnce({ rows: subtasks });

    const res = await request(app).get('/api/export/json');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { ...todos[0], subtasks: [subtasks[0], subtasks[1]] },
      { ...todos[1], subtasks: [subtasks[2]] },
    ]);
  });

  it('returns todos with empty subtasks array when no subtasks exist', async () => {
    const todos = [
      { id: 1, title: 'Todo 1', completed: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
    ];
    mockQuery
      .mockResolvedValueOnce({ rows: todos })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/export/json');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ ...todos[0], subtasks: [] }]);
  });

  it('returns empty array when no todos exist', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/export/json');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/export/json');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to export todos' });
  });
});

describe('GET /api/export/csv', () => {
  it('returns CSV with todos and subtasks', async () => {
    const rows = [
      { todo_id: 1, todo_title: 'Todo 1', todo_completed: false, subtask_id: 1, subtask_title: 'Subtask 1', subtask_completed: false },
      { todo_id: 1, todo_title: 'Todo 1', todo_completed: false, subtask_id: 2, subtask_title: 'Subtask 2', subtask_completed: true },
      { todo_id: 2, todo_title: 'Todo 2', todo_completed: true, subtask_id: null, subtask_title: null, subtask_completed: null },
    ];
    mockQuery.mockResolvedValue({ rows });

    const res = await request(app).get('/api/export/csv');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toBe('attachment; filename="todos-export.csv"');

    const lines = res.text.split('\n');
    expect(lines[0]).toBe('todo_id,todo_title,todo_completed,subtask_id,subtask_title,subtask_completed');
    expect(lines[1]).toBe('1,"Todo 1",false,1,"Subtask 1",false');
    expect(lines[2]).toBe('1,"Todo 1",false,2,"Subtask 2",true');
    expect(lines[3]).toBe('2,"Todo 2",true,,,');
  });

  it('handles titles with commas and quotes in CSV', async () => {
    const rows = [
      { todo_id: 1, todo_title: 'Todo, with "quotes"', todo_completed: false, subtask_id: 1, subtask_title: 'Sub "task"', subtask_completed: false },
    ];
    mockQuery.mockResolvedValue({ rows });

    const res = await request(app).get('/api/export/csv');

    const lines = res.text.split('\n');
    expect(lines[1]).toBe('1,"Todo, with ""quotes""",false,1,"Sub ""task""",false');
  });

  it('returns only header when no todos exist', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const res = await request(app).get('/api/export/csv');

    expect(res.status).toBe(200);
    expect(res.text).toBe('todo_id,todo_title,todo_completed,subtask_id,subtask_title,subtask_completed');
  });

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/export/csv');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to export todos as CSV' });
  });
});

import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

router.get('/json', async (_req: Request, res: Response) => {
  try {
    const todosResult = await pool.query('SELECT * FROM todos ORDER BY id ASC');
    const subtasksResult = await pool.query('SELECT * FROM subtasks ORDER BY id ASC');

    const todos = todosResult.rows.map((todo) => ({
      ...todo,
      subtasks: subtasksResult.rows.filter((s) => s.todo_id === todo.id),
    }));

    res.json(todos);
  } catch {
    res.status(500).json({ error: 'Failed to export todos' });
  }
});

router.get('/csv', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
        t.id AS todo_id,
        t.title AS todo_title,
        t.completed AS todo_completed,
        s.id AS subtask_id,
        s.title AS subtask_title,
        s.completed AS subtask_completed
      FROM todos t
      LEFT JOIN subtasks s ON s.todo_id = t.id
      ORDER BY t.id ASC, s.id ASC`
    );

    const header = 'todo_id,todo_title,todo_completed,subtask_id,subtask_title,subtask_completed';
    const rows = result.rows.map((row) => {
      const todoTitle = `"${String(row.todo_title).replace(/"/g, '""')}"`;
      const subtaskTitle = row.subtask_id != null
        ? `"${String(row.subtask_title).replace(/"/g, '""')}"`
        : '';
      return [
        row.todo_id,
        todoTitle,
        row.todo_completed,
        row.subtask_id ?? '',
        subtaskTitle,
        row.subtask_completed ?? '',
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="todos-export.csv"');
    res.send(csv);
  } catch {
    res.status(500).json({ error: 'Failed to export todos as CSV' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// GET /api/todos
router.get('/', async (req: Request, res: Response) => {
  try {
    let orderClause = 'ORDER BY created_at DESC';
    if (req.query.sort === 'due_date') {
      orderClause = 'ORDER BY due_date ASC NULLS LAST';
    } else if (req.query.sort === 'priority') {
      orderClause = "ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END";
    }
    const result = await pool.query(`SELECT * FROM todos ${orderClause}`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// GET /api/todos/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

// POST /api/todos
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, due_date, priority } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const result = await pool.query(
      'INSERT INTO todos (title, due_date, priority) VALUES ($1, $2, $3) RETURNING *',
      [title.trim(), due_date || null, priority || 'medium']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// PUT /api/todos/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, completed, due_date, priority } = req.body;

    const existing = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const updatedTitle = title !== undefined ? title : existing.rows[0].title;
    const updatedCompleted = completed !== undefined ? completed : existing.rows[0].completed;
    const updatedDueDate = due_date !== undefined ? (due_date || null) : existing.rows[0].due_date;
    const updatedPriority = priority !== undefined ? priority : existing.rows[0].priority;

    const result = await pool.query(
      'UPDATE todos SET title = $1, completed = $2, due_date = $3, priority = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [updatedTitle, updatedCompleted, updatedDueDate, updatedPriority, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE /api/todos/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

export default router;

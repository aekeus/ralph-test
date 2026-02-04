import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router({ mergeParams: true });

// GET /api/todos/:todoId/subtasks
router.get('/', async (req: Request, res: Response) => {
  try {
    const { todoId } = req.params;
    const todoCheck = await pool.query('SELECT id FROM todos WHERE id = $1', [todoId]);
    if (todoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    const result = await pool.query(
      'SELECT * FROM subtasks WHERE todo_id = $1 ORDER BY created_at ASC',
      [todoId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subtasks' });
  }
});

// POST /api/todos/:todoId/subtasks
router.post('/', async (req: Request, res: Response) => {
  try {
    const { todoId } = req.params;
    const { title } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const todoCheck = await pool.query('SELECT id FROM todos WHERE id = $1', [todoId]);
    if (todoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const result = await pool.query(
      'INSERT INTO subtasks (todo_id, title) VALUES ($1, $2) RETURNING *',
      [todoId, title.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create subtask' });
  }
});

// PUT /api/todos/:todoId/subtasks/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { todoId, id } = req.params;
    const { title, completed } = req.body;

    const existing = await pool.query(
      'SELECT * FROM subtasks WHERE id = $1 AND todo_id = $2',
      [id, todoId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    const updatedTitle = title !== undefined ? title : existing.rows[0].title;
    const updatedCompleted = completed !== undefined ? completed : existing.rows[0].completed;

    const result = await pool.query(
      'UPDATE subtasks SET title = $1, completed = $2, updated_at = NOW() WHERE id = $3 AND todo_id = $4 RETURNING *',
      [updatedTitle, updatedCompleted, id, todoId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update subtask' });
  }
});

// DELETE /api/todos/:todoId/subtasks/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { todoId, id } = req.params;
    const result = await pool.query(
      'DELETE FROM subtasks WHERE id = $1 AND todo_id = $2 RETURNING *',
      [id, todoId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subtask not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete subtask' });
  }
});

export default router;

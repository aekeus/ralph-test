import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router({ mergeParams: true });

// POST /api/todos/:todoId/tags - add a tag to a todo
router.post('/', async (req: Request, res: Response) => {
  try {
    const { todoId } = req.params;
    const { tag_id } = req.body;

    if (!tag_id || typeof tag_id !== 'number') {
      return res.status(400).json({ error: 'tag_id is required and must be a number' });
    }

    const todoCheck = await pool.query('SELECT id FROM todos WHERE id = $1', [todoId]);
    if (todoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const tagCheck = await pool.query('SELECT id FROM tags WHERE id = $1', [tag_id]);
    if (tagCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await pool.query(
      'INSERT INTO todo_tags (todo_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [todoId, tag_id]
    );

    const tags = await pool.query(
      'SELECT t.* FROM tags t JOIN todo_tags tt ON t.id = tt.tag_id WHERE tt.todo_id = $1 ORDER BY t.name ASC',
      [todoId]
    );

    res.status(201).json(tags.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add tag to todo' });
  }
});

// DELETE /api/todos/:todoId/tags/:tagId - remove a tag from a todo
router.delete('/:tagId', async (req: Request, res: Response) => {
  try {
    const { todoId, tagId } = req.params;

    const result = await pool.query(
      'DELETE FROM todo_tags WHERE todo_id = $1 AND tag_id = $2 RETURNING *',
      [todoId, tagId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not associated with this todo' });
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove tag from todo' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// GET /api/tags - list all tags
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM tags ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// POST /api/tags - create a tag
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (name.trim().length > 50) {
      return res.status(400).json({ error: 'Name must be 50 characters or less' });
    }
    const result = await pool.query(
      'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *',
      [name.trim(), color || '#6366f1']
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'Tag already exists' });
    }
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

export default router;

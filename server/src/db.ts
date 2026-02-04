import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/ralph_todos',
});

export default pool;

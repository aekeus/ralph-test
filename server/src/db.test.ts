import pool from './db';

describe('Database schema', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('connects to the ralph_todos database', async () => {
    const result = await pool.query('SELECT current_database()');
    expect(result.rows[0].current_database).toBe('ralph_todos');
  });

  it('has a todos table', async () => {
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'todos'
    `);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].table_name).toBe('todos');
  });

  describe('todos table columns', () => {
    let columns: Array<{ column_name: string; data_type: string; is_nullable: string; column_default: string | null }>;

    beforeAll(async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'todos'
        ORDER BY ordinal_position
      `);
      columns = result.rows;
    });

    it('has the correct number of columns', () => {
      expect(columns).toHaveLength(5);
    });

    it('has id column as SERIAL PRIMARY KEY', async () => {
      const idCol = columns.find(c => c.column_name === 'id');
      expect(idCol).toBeDefined();
      expect(idCol!.data_type).toBe('integer');
      expect(idCol!.is_nullable).toBe('NO');
      expect(idCol!.column_default).toContain('nextval');

      const pkResult = await pool.query(`
        SELECT constraint_type FROM information_schema.table_constraints
        WHERE table_name = 'todos' AND constraint_type = 'PRIMARY KEY'
      `);
      expect(pkResult.rows).toHaveLength(1);
    });

    it('has title column as VARCHAR(255) NOT NULL', () => {
      const titleCol = columns.find(c => c.column_name === 'title');
      expect(titleCol).toBeDefined();
      expect(titleCol!.data_type).toBe('character varying');
      expect(titleCol!.is_nullable).toBe('NO');
    });

    it('has completed column as BOOLEAN DEFAULT false', () => {
      const completedCol = columns.find(c => c.column_name === 'completed');
      expect(completedCol).toBeDefined();
      expect(completedCol!.data_type).toBe('boolean');
      expect(completedCol!.column_default).toBe('false');
    });

    it('has created_at column as TIMESTAMP DEFAULT NOW()', () => {
      const createdCol = columns.find(c => c.column_name === 'created_at');
      expect(createdCol).toBeDefined();
      expect(createdCol!.data_type).toBe('timestamp without time zone');
      expect(createdCol!.column_default).toContain('now');
    });

    it('has updated_at column as TIMESTAMP DEFAULT NOW()', () => {
      const updatedCol = columns.find(c => c.column_name === 'updated_at');
      expect(updatedCol).toBeDefined();
      expect(updatedCol!.data_type).toBe('timestamp without time zone');
      expect(updatedCol!.column_default).toContain('now');
    });
  });

  it('has a subtasks table', async () => {
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'subtasks'
    `);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].table_name).toBe('subtasks');
  });

  describe('subtasks table columns', () => {
    let columns: Array<{ column_name: string; data_type: string; is_nullable: string; column_default: string | null }>;

    beforeAll(async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'subtasks'
        ORDER BY ordinal_position
      `);
      columns = result.rows;
    });

    it('has the correct number of columns', () => {
      expect(columns).toHaveLength(6);
    });

    it('has id column as SERIAL PRIMARY KEY', async () => {
      const idCol = columns.find(c => c.column_name === 'id');
      expect(idCol).toBeDefined();
      expect(idCol!.data_type).toBe('integer');
      expect(idCol!.is_nullable).toBe('NO');
      expect(idCol!.column_default).toContain('nextval');

      const pkResult = await pool.query(`
        SELECT constraint_type FROM information_schema.table_constraints
        WHERE table_name = 'subtasks' AND constraint_type = 'PRIMARY KEY'
      `);
      expect(pkResult.rows).toHaveLength(1);
    });

    it('has todo_id column as INTEGER REFERENCES todos(id)', async () => {
      const todoIdCol = columns.find(c => c.column_name === 'todo_id');
      expect(todoIdCol).toBeDefined();
      expect(todoIdCol!.data_type).toBe('integer');

      const fkResult = await pool.query(`
        SELECT constraint_type FROM information_schema.table_constraints
        WHERE table_name = 'subtasks' AND constraint_type = 'FOREIGN KEY'
      `);
      expect(fkResult.rows.length).toBeGreaterThanOrEqual(1);
    });

    it('has title column as VARCHAR(255) NOT NULL', () => {
      const titleCol = columns.find(c => c.column_name === 'title');
      expect(titleCol).toBeDefined();
      expect(titleCol!.data_type).toBe('character varying');
      expect(titleCol!.is_nullable).toBe('NO');
    });

    it('has completed column as BOOLEAN DEFAULT false', () => {
      const completedCol = columns.find(c => c.column_name === 'completed');
      expect(completedCol).toBeDefined();
      expect(completedCol!.data_type).toBe('boolean');
      expect(completedCol!.column_default).toBe('false');
    });

    it('has created_at column as TIMESTAMP DEFAULT NOW()', () => {
      const createdCol = columns.find(c => c.column_name === 'created_at');
      expect(createdCol).toBeDefined();
      expect(createdCol!.data_type).toBe('timestamp without time zone');
      expect(createdCol!.column_default).toContain('now');
    });

    it('has updated_at column as TIMESTAMP DEFAULT NOW()', () => {
      const updatedCol = columns.find(c => c.column_name === 'updated_at');
      expect(updatedCol).toBeDefined();
      expect(updatedCol!.data_type).toBe('timestamp without time zone');
      expect(updatedCol!.column_default).toContain('now');
    });
  });

  describe('subtasks table operations', () => {
    let todoId: number;
    let subtaskId: number;

    beforeAll(async () => {
      const result = await pool.query(
        'INSERT INTO todos (title) VALUES ($1) RETURNING *',
        ['Parent todo for subtasks']
      );
      todoId = result.rows[0].id;
    });

    afterAll(async () => {
      await pool.query('DELETE FROM subtasks');
      await pool.query('DELETE FROM todos');
    });

    it('can insert a subtask', async () => {
      const result = await pool.query(
        'INSERT INTO subtasks (todo_id, title) VALUES ($1, $2) RETURNING *',
        [todoId, 'Test subtask']
      );
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].title).toBe('Test subtask');
      expect(result.rows[0].todo_id).toBe(todoId);
      expect(result.rows[0].completed).toBe(false);
      expect(result.rows[0].created_at).toBeInstanceOf(Date);
      expect(result.rows[0].updated_at).toBeInstanceOf(Date);
      subtaskId = result.rows[0].id;
    });

    it('can query a subtask by id', async () => {
      const result = await pool.query('SELECT * FROM subtasks WHERE id = $1', [subtaskId]);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].title).toBe('Test subtask');
    });

    it('can update a subtask', async () => {
      const result = await pool.query(
        'UPDATE subtasks SET completed = true, updated_at = NOW() WHERE id = $1 RETURNING *',
        [subtaskId]
      );
      expect(result.rows[0].completed).toBe(true);
    });

    it('cascades delete when parent todo is deleted', async () => {
      // Create a separate todo and subtask for this test
      const todo = await pool.query(
        'INSERT INTO todos (title) VALUES ($1) RETURNING *',
        ['Cascade test todo']
      );
      await pool.query(
        'INSERT INTO subtasks (todo_id, title) VALUES ($1, $2) RETURNING *',
        [todo.rows[0].id, 'Cascade test subtask']
      );
      await pool.query('DELETE FROM todos WHERE id = $1', [todo.rows[0].id]);
      const result = await pool.query(
        'SELECT * FROM subtasks WHERE todo_id = $1',
        [todo.rows[0].id]
      );
      expect(result.rows).toHaveLength(0);
    });

    it('can delete a subtask', async () => {
      const result = await pool.query('DELETE FROM subtasks WHERE id = $1 RETURNING *', [subtaskId]);
      expect(result.rows).toHaveLength(1);
    });

    it('rejects insert without title', async () => {
      await expect(
        pool.query('INSERT INTO subtasks (todo_id, title) VALUES ($1, $2)', [todoId, null])
      ).rejects.toThrow();
    });
  });

  describe('todos table operations', () => {
    let insertedId: number;

    afterAll(async () => {
      await pool.query('DELETE FROM todos');
    });

    it('can insert a todo', async () => {
      const result = await pool.query(
        'INSERT INTO todos (title) VALUES ($1) RETURNING *',
        ['Test todo']
      );
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].title).toBe('Test todo');
      expect(result.rows[0].completed).toBe(false);
      expect(result.rows[0].created_at).toBeInstanceOf(Date);
      expect(result.rows[0].updated_at).toBeInstanceOf(Date);
      insertedId = result.rows[0].id;
    });

    it('can query a todo by id', async () => {
      const result = await pool.query('SELECT * FROM todos WHERE id = $1', [insertedId]);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].title).toBe('Test todo');
    });

    it('can update a todo', async () => {
      const result = await pool.query(
        'UPDATE todos SET completed = true, updated_at = NOW() WHERE id = $1 RETURNING *',
        [insertedId]
      );
      expect(result.rows[0].completed).toBe(true);
    });

    it('can delete a todo', async () => {
      const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [insertedId]);
      expect(result.rows).toHaveLength(1);
    });

    it('rejects insert without title', async () => {
      await expect(
        pool.query('INSERT INTO todos (title) VALUES ($1)', [null])
      ).rejects.toThrow();
    });
  });
});

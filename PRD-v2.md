# Todo App v2 — Subtasks, Delete, and Export

Building on the existing Express + React + PostgreSQL todo app.

## Tasks

- [x] Add a `subtasks` table in PostgreSQL: id SERIAL PRIMARY KEY, todo_id INTEGER REFERENCES todos(id) ON DELETE CASCADE, title VARCHAR(255) NOT NULL, completed BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
- [x] Add REST API routes for subtasks in `server/src/routes/subtasks.ts`: GET /api/todos/:todoId/subtasks, POST /api/todos/:todoId/subtasks, PUT /api/todos/:todoId/subtasks/:id, DELETE /api/todos/:todoId/subtasks/:id. Mount in `server/src/index.ts`
- [x] Add a SubtaskList component in `client/src/` that displays subtasks under each todo item, with ability to add, toggle, and delete subtasks inline
- [x] Add a DELETE /api/todos/:id endpoint (if not already robust) that cascades to subtasks, and add a confirmation dialog in the React UI before deleting a todo
- [x] Add export API routes in `server/src/routes/export.ts`: GET /api/export/json (returns all todos with their subtasks as JSON), GET /api/export/csv (returns all todos and subtasks as a downloadable CSV file with columns: todo_id, todo_title, todo_completed, subtask_id, subtask_title, subtask_completed)
- [x] Add Export buttons in the React UI (top of the page): "Export JSON" and "Export CSV" buttons that trigger file downloads from the export API endpoints
- [x] Add tests for the new subtask and export API endpoints in `test/`

# Todo App — Express + React + PostgreSQL

Monorepo with `server/` and `client/` directories.

## Tasks

- [ ] Initialize monorepo structure with `server/` and `client/` directories, add root `package.json` with workspaces
- [ ] Set up Express server in `server/` with TypeScript, add `tsconfig.json`, install dependencies (express, pg, cors, dotenv, typescript, ts-node, @types/express, @types/cors, @types/pg)
- [ ] Create PostgreSQL database `ralph_todos` and add schema: `todos` table with columns (id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, completed BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())
- [ ] Implement REST API routes in `server/src/routes/todos.ts`: GET /api/todos, GET /api/todos/:id, POST /api/todos, PUT /api/todos/:id, DELETE /api/todos/:id
- [ ] Create `server/src/index.ts` entry point with Express app, CORS config, JSON body parser, mount todo routes, listen on port 3001
- [ ] Create React app in `client/` using Vite + TypeScript (`npm create vite@latest client -- --template react-ts`), install axios
- [ ] Build Todo UI components in `client/src/`: TodoList, TodoItem, AddTodo — with state management to fetch, add, toggle, and delete todos via the API
- [ ] Add proxy config in `client/vite.config.ts` to forward `/api` requests to `http://localhost:3001`
- [ ] Add `server/.env.example` with DATABASE_URL and PORT, add a root `README.md` with setup instructions
- [ ] Add npm scripts to root `package.json`: `dev:server`, `dev:client`, `dev` (runs both concurrently)

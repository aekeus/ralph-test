import express from 'express';
import cors from 'cors';
import todosRouter from './routes/todos';
import subtasksRouter from './routes/subtasks';
import exportRouter from './routes/export';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/todos', todosRouter);
app.use('/api/todos/:todoId/subtasks', subtasksRouter);
app.use('/api/export', exportRouter);

export default app;

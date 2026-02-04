import express from 'express';
import cors from 'cors';
import todosRouter from './routes/todos';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/todos', todosRouter);

export default app;

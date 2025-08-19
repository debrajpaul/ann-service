import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';

import datasetsRouter from './routes/datasets.js';
import trainRouter from './routes/train.js';
import predictRouter from './routes/predict.js';
import runsRouter from './routes/runs.js';

const publicDir = path.resolve('public');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/public', express.static(publicDir));

app.use('/api/datasets', datasetsRouter);
app.use('/api/train', trainRouter);
app.use('/api/predict', predictRouter);
app.use('/api/runs', runsRouter);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/dashboard', (_req, res) => {
  res.sendFile(path.join(publicDir, 'dashboard.html'));
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Centralized error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status =
    typeof (err as { status?: number }).status === 'number' &&
    (err as { status: number }).status >= 400 &&
    (err as { status: number }).status < 500
      ? (err as { status: number }).status
      : 500;
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  if (status === 500) {
    // Log server errors for debugging
    console.error(err);
  }
  res.status(status).json({ error: message });
});

export default app;

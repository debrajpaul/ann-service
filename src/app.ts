import express from 'express';
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

export default app;

import { Router } from 'express';
import { getDb } from '../db';
import { getLastRun } from '../services/model';

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/latest', async (_req: any, res: any) => {
  if (process.env.TEST) {
    const run = getLastRun();
    if (!run) {
      return res.status(404).json({ error: 'No runs' });
    }
    return res.json(run);
  }
  const runs = await getDb()
    .collection('runs')
    .find()
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();
  if (runs.length === 0) {
    return res.status(404).json({ error: 'No runs' });
  }
  const run = runs[0];
  res.json(run);
});

export default router;

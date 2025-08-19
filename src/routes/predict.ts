import { Router } from 'express';
import { predict, getLastRun } from '../services/model';
import { getDb } from '../db';

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/', async (req: any, res: any) => {
  try {
    const { input } = req.body;
    if (!Array.isArray(input) || !input.every((n: unknown) => typeof n === 'number')) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    // validate window size
    let expected = input.length;
    if (process.env.TEST) {
      const run = getLastRun();
      if (!run) {
        return res.status(400).json({ error: 'No trained model' });
      }
      expected = run.windowSize;
    } else {
      const runs = await getDb()
        .collection('runs')
        .find()
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();
      if (runs.length === 0) {
        return res.status(400).json({ error: 'No trained model' });
      }
      const run = runs[0] as { windowSize: number };
      expected = run.windowSize;
    }
    if (input.length !== expected) {
      return res.status(400).json({ error: `Input length must be ${expected}` });
    }
    const value = await predict(input);
    res.json({ prediction: value });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;

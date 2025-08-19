import { Router } from 'express';
import { getDataset } from '../services/dataset';
import { trainModel } from '../services/model';

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/', async (req: any, res: any) => {
  try {
    const { windowSize = 5, epochs = 50 } = req.body;
    const data = getDataset();
    if (data.length === 0) {
      return res.status(400).json({ error: 'Dataset is empty' });
    }
    const result = await trainModel(data, windowSize, epochs);
    res.json({ metrics: result.metrics, windowSize: result.windowSize });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;

import { Router } from 'express';
import { setDataset, generateSine, generateDuffing, getDataset } from '../services/dataset';

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/upload', (req: any, res: any) => {
  const { data } = req.body;
  if (!Array.isArray(data) || !data.every((n: unknown) => typeof n === 'number')) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  setDataset(data);
  res.json({ length: data.length, data });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/generate', (req: any, res: any) => {
  const type = (req.query.type as string) || 'sine';
  const points = parseInt((req.query.points as string) || '100', 10);
  let data: number[];
  if (type === 'duffing') {
    data = generateDuffing(points);
  } else {
    data = generateSine(points);
  }
  setDataset(data);
  res.json({ length: data.length, data, type });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/', (_req: any, res: any) => {
  res.json({ data: getDataset() });
});

export default router;

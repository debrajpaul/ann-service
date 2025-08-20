import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

import { newId } from '../lib/ids.js';
import { parseCSVToSeries } from '../core/data.js';
import { MAX_DATASET_LENGTH } from '../config.js';

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

/**
 * Upload a CSV dataset.
 *
 * The request must include a `file` field containing a CSV with a single
 * numeric column. The file is stored under `data/uploads/<id>.csv`.
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const csv = req.file.buffer.toString('utf-8');

  let series: number[];
  try {
    series = parseCSVToSeries(csv);
  } catch {
    res.status(400).json({ error: 'Invalid CSV format' });
    return;
  }
  if (series.some((v) => Number.isNaN(v))) {
    res.status(400).json({ error: 'CSV must contain only numeric values' });
    return;
  }
  if (series.length > MAX_DATASET_LENGTH) {
    series = series.slice(0, MAX_DATASET_LENGTH);
  }

  const datasetId = newId();
  const filePath = path.join('data', 'uploads', `${datasetId}.csv`);
  await fs.promises.writeFile(filePath, csv, 'utf-8');

  res.json({ datasetId, path: filePath });
});

interface GenerateBody {
  kind: 'sine' | 'duffing';
  length: number;
  noise?: number;
}

function gaussianNoise(std = 1): number {
  // Box-Muller transform
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const mag = Math.sqrt(-2.0 * Math.log(u));
  return mag * Math.cos(2.0 * Math.PI * v) * std;
}

function generateSine(length: number, noise = 0): number[] {
  const data: number[] = [];
  for (let i = 0; i < length; i++) {
    const value = Math.sin(i) + (noise ? gaussianNoise(noise) : 0);
    data.push(value);
  }
  return data;
}

/**
 * Generate a Duffing oscillator sequence. For very long sequences a
 * logistic-map based pseudo-chaotic signal is used to keep computation
 * bounded while remaining deterministic.
 */
function generateDuffing(length: number): number[] {
  const dt = 0.01;
  const delta = 0.2;
  const alpha = -1;
  const beta = 1;
  const gamma = 0.3;
  const omega = 1.2;
  let x = 0.1;
  let y = 0;
  const series: number[] = [];
  const limit = Math.min(length, 1000); // keep numerical integration modest
  for (let i = 0; i < limit; i++) {
    const dx = y;
    const dy =
      -delta * y - alpha * x - beta * x * x * x + gamma * Math.cos(omega * i * dt);
    x += dx * dt;
    y += dy * dt;
    series.push(x);
  }

  if (length > limit) {
    // Fall back to a bounded pseudo-chaotic logistic map signal
    // z_{n+1} = r * z_n * (1 - z_n)
    let z = 0.5;
    const r = 3.8;
    for (let i = limit; i < length; i++) {
      z = r * z * (1 - z);
      series.push(z);
    }
  }
  return series.slice(0, length);
}

router.post('/generate', async (req, res) => {
  const body = req.body as GenerateBody;
  const { kind, length, noise } = body;
  if (!kind || typeof length !== 'number' || length <= 0) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  const cappedLength = Math.min(length, MAX_DATASET_LENGTH);
  let data: number[];
  if (kind === 'sine') {
    data = generateSine(cappedLength, noise ?? 0);
  } else if (kind === 'duffing') {
    data = generateDuffing(cappedLength);
  } else {
    res.status(400).json({ error: 'Unknown kind' });
    return;
  }

  const datasetId = newId();
  const filePath = path.join('data', `${datasetId}.csv`);
  await fs.promises.writeFile(filePath, data.join('\n'), 'utf-8');

  res.json({ datasetId, path: filePath });
});

async function listCsvFiles(dir: string): Promise<
  { datasetId: string; path: string; length: number }[]
> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const items: { datasetId: string; path: string; length: number }[] = [];
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.csv')) {
      const filePath = path.join(dir, entry.name);
      const csv = await fs.promises.readFile(filePath, 'utf-8');
      let length = 0;
      try {
        length = parseCSVToSeries(csv).length;
      } catch {
        length = 0;
      }
      items.push({
        datasetId: path.basename(entry.name, '.csv'),
        path: filePath,
        length,
      });
    }
  }
  return items;
}

router.get('/', async (_req, res) => {
  const datasets: { datasetId: string; path: string; length: number }[] = [];
  datasets.push(...(await listCsvFiles('data')));
  datasets.push(...(await listCsvFiles(path.join('data', 'uploads'))));
  res.json(datasets);
});

export default router;

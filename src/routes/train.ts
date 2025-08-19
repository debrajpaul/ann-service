import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

import { parseCSVToSeries, trainValTestSplit } from '../core/data.js';
import { trainModel, saveModel } from '../core/model.js';
import { computeAllMetrics } from '../core/metrics.js';
import { createRun, updateRun } from '../core/runs.js';

const router = Router();

// Schema for validating training requests
const TrainSchema = z.object({
  datasetPath: z.string(),
  window: z.number().int().min(1).max(100).optional().default(5),
  epochs: z.number().int().min(1).max(1000).optional().default(50),
  ratios: z
    .object({
      train: z.number().min(0).max(1).optional(),
      val: z.number().min(0).max(1).optional(),
    })
    .partial()
    .optional()
    .default({}),
});

router.post('/', async (req, res) => {
  const parsed = TrainSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { datasetPath, window, epochs, ratios } = parsed.data;

  let csv: string;
  try {
    csv = await fs.promises.readFile(datasetPath, 'utf-8');
  } catch {
    res.status(400).json({ error: 'Dataset not found' });
    return;
  }

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

  if (window >= series.length) {
    res.status(400).json({ error: 'Window too large for dataset' });
    return;
  }

  const totalSamples = series.length - window;
  const split = trainValTestSplit(totalSamples, ratios);
  const counts = { train: split.nTrain, val: split.nVal, test: split.nTest };

  const trainResult = await trainModel(series, window, epochs, ratios);
  const metrics = computeAllMetrics(
    trainResult.yTrueTest,
    trainResult.yPredTest,
  );

  const run = await createRun({
    window,
    epochs,
    ratios,
    datasetName: path.basename(datasetPath),
  });

  await saveModel(trainResult.model, run.id);
  await updateRun(run.id, {
    metrics,
    modelPath: `models/${run.id}`,
  });
  trainResult.model.dispose();

  res.json({
    runId: run.id,
    metrics,
    counts,
    indexes: trainResult.indexes,
  });
});

export default router;

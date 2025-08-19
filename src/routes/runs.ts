import { Router } from 'express';

import { listRuns, getRun } from '../core/runs.js';

const router = Router();

// Get latest 20 runs with basic info
router.get('/', async (_req, res) => {
  const runs = await listRuns();
  const latest = runs.slice(0, 20).map((r) => {
    const metrics = r.metrics as { rms?: number } | null;
    return {
      id: r.id,
      createdAt: r.createdAt,
      datasetName: r.datasetName,
      rms: metrics?.rms ?? null,
    };
  });
  res.json(latest);
});

// Get full run info
router.get('/:id', async (req, res) => {
  const run = await getRun(req.params.id);
  if (!run) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }
  res.json(run);
});

// Get only metrics for a run
router.get('/:id/metrics', async (req, res) => {
  const run = await getRun(req.params.id);
  if (!run) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }
  if (!run.metrics) {
    res.status(404).json({ error: 'Metrics not found' });
    return;
  }
  res.json(run.metrics);
});

export default router;

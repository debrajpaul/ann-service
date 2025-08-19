import { Router } from 'express';
import * as tf from '@tensorflow/tfjs-node';
import { z } from 'zod';

import { loadModel } from '../core/model.js';
import { getRun } from '../core/runs.js';

const router = Router();

// Schema for validating prediction requests
const PredictSchema = z.object({
  runId: z.string(),
  context: z.array(z.number()),
});

router.post('/', async (req, res) => {
  const parsed = PredictSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { runId, context } = parsed.data;

  const run = await getRun(runId);
  if (!run) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }

  if (context.length !== run.window) {
    res.status(400).json({ error: `Context length must be ${run.window}` });
    return;
  }

  let model;
  try {
    model = await loadModel(runId);
  } catch {
    res.status(404).json({ error: 'Model not found' });
    return;
  }

  const input = tf.tensor2d([context]);
  const output = model.predict(input) as tf.Tensor;
  const [next] = Array.from(await output.data());

  tf.dispose([input, output]);
  model.dispose();

  res.json({ next });
});

export default router;

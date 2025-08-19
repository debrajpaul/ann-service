import fs from 'fs';
import { createRun, getRun, updateRun, listRuns } from './runs';

describe('runs', () => {
  beforeEach(async () => {
    await fs.promises.rm('runs', { recursive: true, force: true });
  });

  it('creates and retrieves a run', async () => {
    const run = await createRun({
      window: 3,
      epochs: 5,
      ratios: { train: 0.6, val: 0.2 },
      datasetName: 'test.csv',
    });
    const loaded = await getRun(run.id);
    expect(loaded).toEqual(run);
  });

  it('updates a run with new data', async () => {
    const run = await createRun({
      window: 3,
      epochs: 5,
      ratios: { train: 0.6 },
      datasetName: 'test.csv',
    });
    const updated = await updateRun(run.id, {
      metrics: { rms: 1 },
      modelPath: 'models/path',
    });
    expect(updated.metrics).toEqual({ rms: 1 });
    expect(updated.modelPath).toBe('models/path');
  });

  it('lists runs sorted by creation date desc', async () => {
    const run1 = await createRun({
      window: 3,
      epochs: 5,
      ratios: {},
      datasetName: 'a',
    });
    await new Promise((r) => setTimeout(r, 5));
    const run2 = await createRun({
      window: 3,
      epochs: 5,
      ratios: {},
      datasetName: 'b',
    });
    const runs = await listRuns();
    expect(runs.map((r) => r.id)).toEqual([run2.id, run1.id]);
  });
});


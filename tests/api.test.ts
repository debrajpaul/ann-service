import fs from 'fs';
import request from 'supertest';
import * as tf from '@tensorflow/tfjs-node';

// Store models in memory to avoid filesystem save/load issues during tests
const models: Record<string, tf.LayersModel> = {};
jest.mock('../src/core/model.ts', () => {
  const actual = jest.requireActual('../src/core/model.ts');
  return {
    ...actual,
    saveModel: async (model: tf.LayersModel, runId: string) => {
      // Clone the model so the original can be disposed by the route
      const cloned = (model as any).clone ? (model as any).clone() : model;
      models[runId] = cloned;
    },
    loadModel: async (runId: string) => models[runId],
  };
});

import app from '../src/app';

// Training can take a few seconds even with small settings
jest.setTimeout(15000);

describe('api endpoints', () => {
  beforeEach(async () => {
    // Reset filesystem directories expected by the service
    for (const dir of ['data', 'data/uploads', 'runs', 'models']) {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
    await fs.promises.mkdir('data/uploads', { recursive: true });
    await fs.promises.mkdir('runs', { recursive: true });
    await fs.promises.mkdir('models', { recursive: true });
  });

  it('generates, trains, retrieves run, and predicts', async () => {
    // Generate a deterministic sine dataset
    const genRes = await request(app)
      .post('/api/datasets/generate')
      .send({ kind: 'sine', length: 80 });
    expect(genRes.status).toBe(200);
    const datasetPath = genRes.body.path as string;

    // Train a small model for speed
    const trainRes = await request(app)
      .post('/api/train')
      .send({ datasetPath, window: 5, epochs: 5 });
    expect(trainRes.status).toBe(200);
    expect(typeof trainRes.body.runId).toBe('string');
    expect(trainRes.body.metrics).toBeDefined();
    const runId = trainRes.body.runId as string;

    // Retrieve the run and ensure predictions arrays exist
    const runRes = await request(app).get(`/api/runs/${runId}`);
    expect(runRes.status).toBe(200);
    expect(Array.isArray(runRes.body.yTrueTest)).toBe(true);
    expect(Array.isArray(runRes.body.yPredTest)).toBe(true);
    expect(runRes.body.yTrueTest.length).toBe(runRes.body.yPredTest.length);

    // Prepare last test window for prediction
    const csv = await fs.promises.readFile(datasetPath, 'utf-8');
    const series = csv.trim().split(/\r?\n/).map(Number);
    const { endTest } = trainRes.body.indexes as { startTest: number; endTest: number };
    const context = series.slice(endTest - 1, endTest - 1 + 5);

    const predRes = await request(app)
      .post('/api/predict')
      .send({ runId, context });
    expect(predRes.status).toBe(200);
    expect(typeof predRes.body.next).toBe('number');
  });
});

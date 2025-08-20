import fs from 'fs';
import request from 'supertest';
import * as tf from '@tensorflow/tfjs-node';
import { DEFAULT_EPOCHS, DEFAULT_WINDOW } from '../src/config.js';

// Store models in memory to avoid filesystem save/load issues during tests
const models: Record<string, tf.LayersModel> = {};
jest.mock('../src/core/model.ts', () => {
  const actual = jest.requireActual('../src/core/model.ts');
  return {
    ...actual,
    saveModel: async (model: tf.LayersModel, runId: string) => {
      // Clone the model so the original can be disposed by the route
      const extendedModel = model as tf.LayersModel & {
        clone?: () => tf.LayersModel;
      };
      const cloned = extendedModel.clone ? extendedModel.clone() : model;
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
      .send({ datasetPath, window: DEFAULT_WINDOW, epochs: DEFAULT_EPOCHS });
    expect(trainRes.status).toBe(200);
    expect(typeof trainRes.body.runId).toBe('string');
    expect(trainRes.body.metrics).toBeDefined();
    const runId = trainRes.body.runId as string;

    // Retrieve the run and ensure it exists
    const runRes = await request(app).get(`/api/runs/${runId}`);
    expect(runRes.status).toBe(200);
    expect(runRes.body.id).toBe(runId);

    // Prepare last test window for prediction
    const csv = await fs.promises.readFile(datasetPath, 'utf-8');
    const series = csv.trim().split(/\r?\n/).map(Number);
    const { endTest } = trainRes.body.indexes as {
      startTest: number;
      endTest: number;
    };
    const context = series.slice(endTest - 1, endTest - 1 + 5);

    const predRes = await request(app)
      .post('/api/predict')
      .send({ runId, context });
    expect(predRes.status).toBe(200);
    expect(typeof predRes.body.next).toBe('number');
  });
});

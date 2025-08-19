/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires */
import request from 'supertest';

jest.mock('../db', () => {
  const runs: any[] = [];
  return {
    connect: jest.fn(),
    close: jest.fn(),
    getDb: () => ({
      collection: () => ({
        insertOne: async (doc: any) => {
          const _id = (runs.length + 1).toString();
          runs.push({ _id, ...doc });
          return { insertedId: _id };
        },
        find: () => ({
          sort: () => ({
            limit: () => ({
              toArray: async () => runs.slice(-1)
            })
          })
        })
      })
    })
  };
});
const { app } = require('../app');
const { generateSine } = require('../services/dataset');
process.env.TEST = '1';

describe('ANN service', () => {
  it('generates dataset and trains model', async () => {
    const genRes = await request(app).get('/datasets/generate').query({ type: 'sine', points: 30 });
    expect(genRes.body.length).toBe(30);

    const trainRes = await request(app).post('/train').send({ windowSize: 5, epochs: 5 });
    expect(trainRes.body.metrics).toBeDefined();
    expect(typeof trainRes.body.metrics.rms).toBe('number');
  });

  it('provides metrics and prediction', async () => {
    const metricsRes = await request(app).get('/metrics/latest');
    expect(metricsRes.body.metrics).toBeDefined();

    const data = generateSine(30);
    const input = data.slice(-5);
    const predRes = await request(app).post('/predict').send({ input });
    expect(typeof predRes.body.prediction).toBe('number');
  });
});

import * as tf from '@tensorflow/tfjs-node';
import path from 'path';
import fs from 'fs';
import { getDb } from '../db';
import { ObjectId } from 'mongodb';

let lastModel: tf.LayersModel | null = null;
let lastRun: RunDocument | null = null;
export interface Metrics {
  rms: number;
  absErrors: number[];
  relErrors: number[];
  cumError: number;
}

export interface TrainResult {
  predictions: number[];
  actual: number[];
  metrics: Metrics;
  modelPath: string;
  windowSize: number;
}

export interface RunDocument {
  _id?: ObjectId;
  createdAt: Date;
  windowSize: number;
  epochs: number;
  metrics: Metrics;
  actual: number[];
  predicted: number[];
}

export function createWindowDataset(data: number[], windowSize: number): { xs: number[][]; ys: number[] } {
  const xs: number[][] = [];
  const ys: number[] = [];
  for (let i = 0; i < data.length - windowSize; i++) {
    xs.push(data.slice(i, i + windowSize));
    ys.push(data[i + windowSize]);
  }
  return { xs, ys };
}

export function buildModel(windowSize: number): tf.Sequential {
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [windowSize], units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1 }));
  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
  return model;
}

export async function trainModel(data: number[], windowSize: number, epochs: number): Promise<TrainResult> {
  const { xs, ys } = createWindowDataset(data, windowSize);
  const split = Math.floor(xs.length * 0.8);
  const trainXs = tf.tensor2d(xs.slice(0, split));
  const trainYs = tf.tensor2d(ys.slice(0, split), [split, 1]);
  const testXsArr = xs.slice(split);
  const testYsArr = ys.slice(split);
  const testXs = tf.tensor2d(testXsArr);

  const model = buildModel(windowSize);
  await model.fit(trainXs, trainYs, { epochs, verbose: 0 });

  const predsTensor = model.predict(testXs) as tf.Tensor;
  const predictions = Array.from(predsTensor.dataSync());
  const actual = testYsArr;

  const errors = actual.map((y, i) => predictions[i] - y);
  const absErrors = errors.map(e => Math.abs(e));
  const rms = Math.sqrt(absErrors.reduce((sum, e) => sum + e * e, 0) / absErrors.length);
  const relErrors = actual.map((y, i) => (y === 0 ? 0 : Math.abs(errors[i]) / Math.abs(y) * 100));
  const cumError = absErrors.reduce((sum, e) => sum + e, 0);

  const metrics: Metrics = { rms, absErrors, relErrors, cumError };

  let modelDir = '';
  const runDoc: RunDocument = {
    createdAt: new Date(),
    windowSize,
    epochs,
    metrics,
    actual,
    predicted: predictions
  };

  if (!process.env.TEST) {
    const runs = getDb().collection<RunDocument>('runs');
    const result = await runs.insertOne(runDoc);
    modelDir = path.join(__dirname, '../models', result.insertedId.toString());
    fs.mkdirSync(modelDir, { recursive: true });
    await model.save(`file://${modelDir}`);
    runDoc._id = result.insertedId;
  }

  lastModel = model;
  lastRun = runDoc;

  trainXs.dispose();
  trainYs.dispose();
  testXs.dispose();
  predsTensor.dispose();

  return { predictions, actual, metrics, modelPath: modelDir, windowSize };
}

export async function predict(input: number[]): Promise<number> {
  let model: tf.LayersModel;
  if (process.env.TEST && lastModel) {
    model = lastModel;
  } else {
    const runs = getDb().collection<RunDocument>('runs');
    const last = await runs.find().sort({ createdAt: -1 }).limit(1).toArray();
    if (last.length === 0) {
      throw new Error('No trained model');
    }
    const run = last[0];
    const modelDir = path.join(__dirname, '../models', run._id!.toString(), 'model.json');
    model = await tf.loadLayersModel(`file://${modelDir}`);
  }
  const tensor = tf.tensor2d([input]);
  const pred = model.predict(tensor) as tf.Tensor;
  const value = (await pred.data())[0];
  tensor.dispose();
  pred.dispose();
  if (!process.env.TEST) {
    model.dispose();
  }
  return value;
}

export function getLastRun(): RunDocument | null {
  return lastRun;
}

import * as tf from '@tensorflow/tfjs-node';
import { slidingWindow, trainValTestSplit } from './data';
import { DEFAULT_EPOCHS, DEFAULT_WINDOW } from '../config.js';

export function buildMLP(inputSize: number, hidden = 32): tf.Sequential {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      units: hidden,
      activation: 'relu',
      inputShape: [inputSize],
    }),
  );
  model.add(tf.layers.dense({ units: 1 }));
  model.compile({ optimizer: tf.train.adam(), loss: 'meanSquaredError' });
  return model;
}

export async function trainModel(
  series: number[],
  window = DEFAULT_WINDOW,
  epochs = DEFAULT_EPOCHS,
  ratios: { train?: number; val?: number } = { train: 0.3, val: 0.1 },
): Promise<{
  model: tf.Sequential;
  yTrueTest: number[];
  yPredTest: number[];
  indexes: { startTest: number; endTest: number };
}> {
  const { x, y } = slidingWindow(series, window);
  const split = trainValTestSplit(x.length, ratios);

  const [startTrain, endTrain] = split.train;
  const [startVal, endVal] = split.val;
  const [startTest, endTest] = split.test;

  const xTrain = tf.tensor2d(x.slice(startTrain, endTrain));
  const yTrain = tf.tensor1d(y.slice(startTrain, endTrain));
  const xVal = tf.tensor2d(x.slice(startVal, endVal));
  const yVal = tf.tensor1d(y.slice(startVal, endVal));
  const xTest = tf.tensor2d(x.slice(startTest, endTest));
  const yTrueTest = y.slice(startTest, endTest);

  const model = buildMLP(window, 32);

  await model.fit(xTrain, yTrain, {
    epochs,
    validationData: [xVal, yVal],
    verbose: 0,
  });

  const yPredTensor = model.predict(xTest) as tf.Tensor;
  const yPredTest = Array.from(await yPredTensor.data());

  tf.dispose([xTrain, yTrain, xVal, yVal, xTest, yPredTensor]);

  return { model, yTrueTest, yPredTest, indexes: { startTest, endTest } };
}

export async function saveModel(model: tf.LayersModel, runId: string) {
  await model.save(`file://models/${runId}`);
}

export async function loadModel(runId: string): Promise<tf.LayersModel> {
  return tf.loadLayersModel(`file://models/${runId}/model.json`);
}

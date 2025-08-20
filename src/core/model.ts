import * as tf from '@tensorflow/tfjs-node';
import { slidingWindow, slidingWindowMatrix, trainValTestSplit } from './data';
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
  seriesOrFeatures: number[] | number[][],
  window = DEFAULT_WINDOW,
  epochs = DEFAULT_EPOCHS,
  ratios: { train?: number; val?: number } = { train: 0.3, val: 0.1 },
  target?: number[],
): Promise<{
  model: tf.Sequential;
  yTrueTest: number[];
  yPredTest: number[];
  indexes: { startTest: number; endTest: number };
}> {
  let x: number[][];
  let y: number[];
  let inputSize: number;

  if (Array.isArray(seriesOrFeatures[0])) {
    if (!target) {
      throw new Error('Target series required for multivariate training');
    }
    const features = seriesOrFeatures as number[][];
    const sw = slidingWindowMatrix(features, target, window);
    x = sw.x;
    y = sw.y;
    inputSize = features[0].length * window;
  } else {
    const series = seriesOrFeatures as number[];
    const sw = slidingWindow(series, window);
    x = sw.x;
    y = sw.y;
    inputSize = window;
  }

  const split = trainValTestSplit(x.length, ratios);

  const [startTrain, endTrain] = split.train;
  const [startVal, endVal] = split.val;
  const [startTest, endTest] = split.test;

  const xTrain = tf.tensor2d(x.slice(startTrain, endTrain));
  const yTrain = tf.tensor1d(y.slice(startTrain, endTrain));
  const xValArr = x.slice(startVal, endVal);
  const yValArr = y.slice(startVal, endVal);
  const xVal = xValArr.length ? tf.tensor2d(xValArr) : null;
  const yVal = yValArr.length ? tf.tensor1d(yValArr) : null;
  const xTest = tf.tensor2d(x.slice(startTest, endTest));
  const yTrueTest = y.slice(startTest, endTest);

  const model = buildMLP(inputSize, 32);

  const fitOptions: tf.ModelFitArgs = {
    epochs,
    verbose: 0,
  };
  if (xVal && yVal) {
    fitOptions.validationData = [xVal, yVal];
  }
  await model.fit(xTrain, yTrain, fitOptions);

  const yPredTensor = model.predict(xTest) as tf.Tensor;
  const yPredTest = Array.from(await yPredTensor.data());

  const tensors: tf.Tensor[] = [xTrain, yTrain, xTest, yPredTensor];
  if (xVal && yVal) tensors.push(xVal, yVal);
  tf.dispose(tensors);

  return { model, yTrueTest, yPredTest, indexes: { startTest, endTest } };
}

export async function saveModel(model: tf.LayersModel, runId: string) {
  await model.save(`file://models/${runId}`);
}

export async function loadModel(runId: string): Promise<tf.LayersModel> {
  return tf.loadLayersModel(`file://models/${runId}/model.json`);
}

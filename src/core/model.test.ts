import { buildMLP, trainModel } from './model';
import { DEFAULT_EPOCHS } from '../config.js';

describe('buildMLP', () => {
  it('creates a model with two layers', () => {
    const model = buildMLP(3);
    expect(model.layers).toHaveLength(2);
    model.dispose();
  });
});

describe('trainModel', () => {
  it('trains and returns predictions', async () => {
    const series = Array.from({ length: 10 }, (_, i) => i + 1);
    const result = await trainModel(series, 3, DEFAULT_EPOCHS, {
      train: 0.5,
      val: 0.2,
    });
    expect(result.yPredTest.length).toBe(result.yTrueTest.length);
    expect(result.indexes.endTest - result.indexes.startTest).toBe(
      result.yTrueTest.length,
    );
    result.model.dispose();
  });

  it('supports multivariate feature training', async () => {
    const X = [
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
      [4, 5, 6],
      [5, 6, 7],
      [6, 7, 8],
    ];
    const y = [10, 11, 12, 13, 14, 15];
    const result = await trainModel(
      X,
      2,
      DEFAULT_EPOCHS,
      { train: 0.5, val: 0.2 },
      y,
    );
    expect(result.yPredTest.length).toBe(result.yTrueTest.length);
    expect(result.indexes.endTest - result.indexes.startTest).toBe(
      result.yTrueTest.length,
    );
    result.model.dispose();
  });
});

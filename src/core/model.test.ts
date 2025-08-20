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
});

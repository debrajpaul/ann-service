import fs from 'fs';
import {
  parseCSVToSeries,
  parseCSVToMatrix,
  slidingWindow,
  slidingWindowMatrix,
  trainValTestSplit,
  fitMinMax,
} from './data';

describe('parseCSVToSeries', () => {
  it('parses newline separated values', () => {
    const csv = '1\n2\n3\n';
    expect(parseCSVToSeries(csv)).toEqual([1, 2, 3]);
  });
});

describe('parseCSVToMatrix', () => {
  it('parses multi-column CSV into matrix and target', () => {
    const csv = fs.readFileSync('tests/example-multivariate.csv', 'utf-8');
    expect(parseCSVToMatrix(csv)).toEqual({
      X: [
        [1, 2, 3],
        [2, 3, 4],
        [3, 4, 5],
        [4, 5, 6],
        [5, 6, 7],
      ],
      y: [10, 11, 12, 13, 14],
    });
  });
});

describe('slidingWindow', () => {
  it('creates windowed samples', () => {
    const series = [1, 2, 3, 4, 5];
    const { x, y } = slidingWindow(series, 3);
    expect(x).toEqual([
      [1, 2, 3],
      [2, 3, 4],
    ]);
    expect(y).toEqual([4, 5]);
  });
});

describe('slidingWindowMatrix', () => {
  it('creates windowed samples for feature matrix', () => {
    const X = [
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8],
    ];
    const y = [10, 11, 12, 13];
    const { x, y: out } = slidingWindowMatrix(X, y, 2);
    expect(x).toEqual([
      [1, 2, 3, 4],
      [3, 4, 5, 6],
    ]);
    expect(out).toEqual([12, 13]);
  });
});

describe('trainValTestSplit', () => {
  it('computes splits with custom ratios', () => {
    const split = trainValTestSplit(100, { train: 0.6, val: 0.2 });
    expect(split).toEqual({
      nTrain: 60,
      nVal: 20,
      nTest: 20,
      train: [0, 60],
      val: [60, 80],
      test: [80, 100],
    });
  });

  it('uses default ratios', () => {
    const { nTrain, nVal, nTest } = trainValTestSplit(100);
    expect({ nTrain, nVal, nTest }).toEqual({
      nTrain: 30,
      nVal: 10,
      nTest: 60,
    });
  });
});

describe('fitMinMax', () => {
  it('normalizes and denormalizes values', () => {
    const scaler = fitMinMax([10, 20, 30]);
    expect(scaler.min).toBe(10);
    expect(scaler.max).toBe(30);
    expect(scaler.transform(10)).toBeCloseTo(0);
    expect(scaler.transform(30)).toBeCloseTo(1);

    const batch = [10, 20, 30];
    const normalized = scaler.transformBatch(batch);
    expect(normalized).toEqual([0, 0.5, 1]);
    const denorm = scaler.inverseBatch(normalized);
    expect(denorm).toEqual(batch);
  });
});

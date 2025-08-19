import { slidingWindow, trainValTestSplit } from '../src/core/data';

describe('slidingWindow', () => {
  it('returns correct number of samples and boundaries', () => {
    const series = [1, 2, 3, 4, 5];
    const window = 2;
    const { x, y } = slidingWindow(series, window);

    // total number of samples should be length - window
    expect(x).toHaveLength(series.length - window);
    expect(y).toHaveLength(series.length - window);

    // each window should have the correct size
    expect(x.every((w) => w.length === window)).toBe(true);

    // boundary windows
    expect(x[0]).toEqual([1, 2]);
    expect(x[x.length - 1]).toEqual([3, 4]);
    expect(y).toEqual([3, 4, 5]);
  });

  it('returns empty arrays when window exceeds or equals series length', () => {
    const series = [1, 2, 3];
    expect(slidingWindow(series, 3)).toEqual({ x: [], y: [] });
    expect(slidingWindow(series, 4)).toEqual({ x: [], y: [] });
  });
});

describe('trainValTestSplit', () => {
  it('computes split sizes and ranges', () => {
    const split = trainValTestSplit(10, { train: 0.5, val: 0.3 });
    expect(split).toEqual({
      nTrain: 5,
      nVal: 3,
      nTest: 2,
      train: [0, 5],
      val: [5, 8],
      test: [8, 10],
    });
  });

  it('uses default ratios when none provided', () => {
    const split = trainValTestSplit(10);
    expect(split.nTrain + split.nVal + split.nTest).toBe(10);
    expect(split.train[0]).toBe(0);
    expect(split.train[1]).toBe(split.nTrain);
    expect(split.val[0]).toBe(split.nTrain);
    expect(split.val[1]).toBe(split.nTrain + split.nVal);
    expect(split.test[0]).toBe(split.nTrain + split.nVal);
    expect(split.test[1]).toBe(10);
  });
});

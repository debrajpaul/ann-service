import { rms, absoluteErrors, relativeErrorsPct, cumulativeError } from '../src/core/metrics';

describe('metrics sanity checks', () => {
  it('computes rms correctly for tiny arrays', () => {
    const yTrue = [1, 2, 3];
    const yPred = [2, 1, 3];
    const expected = Math.sqrt((1 ** 2 + 1 ** 2 + 0 ** 2) / yTrue.length);
    expect(rms(yTrue, yPred)).toBeCloseTo(expected);
  });

  it('computes absolute errors', () => {
    const yTrue = [1, 2, 3];
    const yPred = [2, 1, 3];
    expect(absoluteErrors(yTrue, yPred)).toEqual([1, 1, 0]);
  });

  it('computes relative error percent and handles zero target', () => {
    const yTrue = [0, 2];
    const yPred = [1, 1];
    const result = relativeErrorsPct(yTrue, yPred);
    expect(result[0]).toBeCloseTo(1e11);
    expect(result[1]).toBeCloseTo(50);
  });

  it('computes cumulative error', () => {
    const yTrue = [1, 2, 3];
    const yPred = [2, 1, 3];
    const expected = ((2 - 1) + (1 - 2) + (3 - 3)) / yTrue.length;
    expect(cumulativeError(yTrue, yPred)).toBeCloseTo(expected);
  });
});

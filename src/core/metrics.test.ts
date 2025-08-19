import {
  rms,
  absoluteErrors,
  relativeErrorsPct,
  cumulativeError,
  computeAllMetrics,
} from './metrics';

describe('rms', () => {
  it('computes root mean square error', () => {
    const yTrue = [1, 2, 3];
    const yPred = [2, 2, 4];
    const expected = Math.sqrt((1 ** 2 + 0 ** 2 + 1 ** 2) / 3);
    expect(rms(yTrue, yPred)).toBeCloseTo(expected);
  });
});

describe('absoluteErrors', () => {
  it('returns absolute errors for each element', () => {
    const yTrue = [1, 2, 3];
    const yPred = [2, 2, 4];
    expect(absoluteErrors(yTrue, yPred)).toEqual([1, 0, 1]);
  });
});

describe('relativeErrorsPct', () => {
  it('computes relative percentage errors and handles zero truth with epsilon', () => {
    const yTrue = [0, 2];
    const yPred = [1, 1];
    const result = relativeErrorsPct(yTrue, yPred);
    expect(result[0]).toBeCloseTo(1e11);
    expect(result[1]).toBeCloseTo(50);
  });
});

describe('cumulativeError', () => {
  it('computes mean signed error', () => {
    const yTrue = [1, 2, 3];
    const yPred = [2, 2, 4];
    expect(cumulativeError(yTrue, yPred)).toBeCloseTo(2 / 3);
  });
});

describe('computeAllMetrics', () => {
  it('returns all metrics in a single object', () => {
    const yTrue = [1, 2, 3];
    const yPred = [2, 2, 4];
    const metrics = computeAllMetrics(yTrue, yPred);
    expect(metrics.rms).toBeCloseTo(rms(yTrue, yPred));
    expect(metrics.abs).toEqual(absoluteErrors(yTrue, yPred));
    expect(metrics.relPct).toEqual(relativeErrorsPct(yTrue, yPred));
    expect(metrics.cumulative).toBeCloseTo(cumulativeError(yTrue, yPred));
  });
});

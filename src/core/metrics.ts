const EPSILON = 1e-9;

function rms(yTrue: number[], yPred: number[]): number {
  const n = yTrue.length;
  let sumSq = 0;
  for (let i = 0; i < n; i++) {
    const diff = yTrue[i] - yPred[i];
    sumSq += diff * diff;
  }
  return Math.sqrt(sumSq / n);
}

function absoluteErrors(yTrue: number[], yPred: number[]): number[] {
  return yTrue.map((v, i) => Math.abs(v - yPred[i]));
}

function relativeErrorsPct(yTrue: number[], yPred: number[]): number[] {
  return yTrue.map((v, i) => {
    const denom = Math.abs(v) || EPSILON;
    return (Math.abs(v - yPred[i]) / denom) * 100;
  });
}

function cumulativeError(yTrue: number[], yPred: number[]): number {
  const n = yTrue.length;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += yPred[i] - yTrue[i];
  }
  return sum / n;
}

export function computeAllMetrics(yTrue: number[], yPred: number[]) {
  return {
    rms: rms(yTrue, yPred),
    abs: absoluteErrors(yTrue, yPred),
    relPct: relativeErrorsPct(yTrue, yPred),
    cumulative: cumulativeError(yTrue, yPred),
  };
}

export { rms, absoluteErrors, relativeErrorsPct, cumulativeError };

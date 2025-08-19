import { parse } from 'csv-parse/sync';

/**
 * Parse a CSV string into a numeric series.
 *
 * The CSV is expected to contain a single column of numeric values. Values may
 * be separated by commas or new lines. Empty lines are ignored.
 *
 * @param csv - Raw CSV string.
 * @returns Array of numeric values parsed from the CSV.
 */
export function parseCSVToSeries(csv: string): number[] {
  const records: string[][] = parse(csv, {
    columns: false,
    skip_empty_lines: true,
    trim: true,
  });
  return records.flat().map((v) => Number(v));
}

/**
 * Create sliding window samples from a numeric series.
 *
 * For a given window size `w` and series `[v0, v1, ... vn]`, this function
 * returns pairs `x[i] = [v_i, ..., v_{i+w-1}]` and the corresponding next value
 * `y[i] = v_{i+w}`. The number of samples is `series.length - window`.
 *
 * @param series - Input numeric series.
 * @param window - Size of each window.
 * @returns Object containing windowed inputs `x` and target outputs `y`.
 */
export function slidingWindow(
  series: number[],
  window: number,
): { x: number[][]; y: number[] } {
  const x: number[][] = [];
  const y: number[] = [];
  for (let i = 0; i + window < series.length; i++) {
    x.push(series.slice(i, i + window));
    y.push(series[i + window]);
  }
  return { x, y };
}

interface SplitResult {
  nTrain: number;
  nVal: number;
  nTest: number;
  train: [number, number];
  val: [number, number];
  test: [number, number];
}

/**
 * Calculate train/validation/test split sizes and index ranges.
 *
 * Splits are computed using floor for train and validation sizes; the test set
 * receives the remaining items. Index ranges are returned as `[start, end)`
 * half-open intervals suitable for array slicing.
 *
 * @param n - Total number of items.
 * @param ratios - Ratios for train and validation portions. Test ratio is
 *   implied as the remainder.
 * @returns Split sizes and index ranges.
 */
export function trainValTestSplit(
  n: number,
  ratios: { train?: number; val?: number } = { train: 0.3, val: 0.1 },
): SplitResult {
  const trainRatio = ratios.train ?? 0.3;
  const valRatio = ratios.val ?? 0.1;
  const nTrain = Math.floor(n * trainRatio);
  const nVal = Math.floor(n * valRatio);
  const nTest = n - nTrain - nVal;
  return {
    nTrain,
    nVal,
    nTest,
    train: [0, nTrain],
    val: [nTrain, nTrain + nVal],
    test: [nTrain + nVal, n],
  };
}

export interface MinMaxScaler {
  min: number;
  max: number;
  transform(v: number): number;
  inverse(v: number): number;
  transformBatch(values: number[]): number[];
  inverseBatch(values: number[]): number[];
}

/**
 * Fit a min-max scaler on the provided series.
 *
 * The resulting transformer scales values to the [0, 1] range. For constant
 * series where `min === max`, the transform outputs `0` and the inverse returns
 * the constant value.
 *
 * @param series - Input numeric series.
 * @returns An object with scaling parameters and helper functions for
 *   transforming single values or arrays.
 */
export function fitMinMax(series: number[]): MinMaxScaler {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1; // avoid division by zero

  const transform = (v: number): number => (v - min) / range;
  const inverse = (v: number): number => v * range + min;
  const transformBatch = (values: number[]): number[] => values.map(transform);
  const inverseBatch = (values: number[]): number[] => values.map(inverse);

  return { min, max, transform, inverse, transformBatch, inverseBatch };
}

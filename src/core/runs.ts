import path from 'path';
import { randomUUID } from 'crypto';
import { writeJSON, readJSON, listJSON } from '../lib/fsx';

export interface RunMeta {
  window: number;
  epochs: number;
  ratios: { train?: number; val?: number };
  datasetName: string;
  metrics?: unknown;
  modelPath?: string;
}

export interface Run
  extends Omit<RunMeta, 'metrics' | 'modelPath'> {
  id: string;
  createdAt: string;
  metrics: unknown | null;
  modelPath: string | null;
}

export async function createRun(meta: RunMeta): Promise<Run> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const run: Run = {
    id,
    createdAt,
    window: meta.window,
    epochs: meta.epochs,
    ratios: meta.ratios,
    datasetName: meta.datasetName,
    metrics: meta.metrics ?? null,
    modelPath: meta.modelPath ?? null,
  };
  await writeJSON(path.join('runs', `${id}.json`), run);
  return run;
}

export async function updateRun(
  runId: string,
  patch: Partial<RunMeta>,
): Promise<Run> {
  const filePath = path.join('runs', `${runId}.json`);
  const run = await readJSON<Run>(filePath);
  const updated: Run = { ...run, ...patch };
  await writeJSON(filePath, updated);
  return updated;
}

export async function getRun(runId: string): Promise<Run | undefined> {
  try {
    return await readJSON<Run>(path.join('runs', `${runId}.json`));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw err;
  }
}

export async function listRuns(): Promise<Run[]> {
  const runs = await listJSON<Run>('runs');
  return runs.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}


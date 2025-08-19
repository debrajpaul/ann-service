import fs from 'fs';
import path from 'path';

const dirs = ['data', path.join('data', 'uploads'), 'models', 'runs'];
for (const dir of dirs) {
  fs.mkdirSync(dir, { recursive: true });
}

export async function writeJSON<T>(filePath: string, obj: T): Promise<void> {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify(obj, null, 2), 'utf-8');
}

export async function readJSON<T>(filePath: string): Promise<T> {
  const data = await fs.promises.readFile(filePath, 'utf-8');
  return JSON.parse(data) as T;
}

export async function listJSON<T>(dir: string): Promise<T[]> {
  const files = await fs.promises.readdir(dir);
  const results: T[] = [];
  for (const file of files) {
    if (file.endsWith('.json')) {
      const item = await readJSON<T>(path.join(dir, file));
      results.push(item);
    }
  }
  return results;
}

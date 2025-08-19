export let currentDataset: number[] = [];

export function setDataset(data: number[]): void {
  currentDataset = data;
}

export function getDataset(): number[] {
  return currentDataset;
}

export function generateSine(points: number): number[] {
  return Array.from({ length: points }, (_, i) => Math.sin(i * 0.1));
}

// Simple Duffing map implementation
export function generateDuffing(points: number): number[] {
  const a = -2.75;
  const b = 0.2;
  let x = 0.1;
  let y = 0;
  const res: number[] = [];
  for (let i = 0; i < points; i++) {
    const xNew = y;
    const yNew = -b * x + a * y - y * y * y;
    x = xNew;
    y = yNew;
    res.push(x);
  }
  return res;
}

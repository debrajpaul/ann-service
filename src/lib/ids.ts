import { randomBytes } from 'crypto';

export function newId(): string {
  const time = Date.now().toString(36);
  const random = randomBytes(8).toString('hex');
  return `c${time}${random}`;
}

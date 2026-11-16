import * as crypto from 'crypto';

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%^&*';

export function generateTemporaryPassword(length = 12): string {
  const all = UPPER + LOWER + DIGITS + SYMBOLS;
  const pick = (set: string) => set[crypto.randomInt(0, set.length)];

  const required = [
    pick(UPPER),
    pick(LOWER),
    pick(DIGITS),
    pick(SYMBOLS),
  ];

  while (required.length < length) {
    required.push(pick(all));
  }

  for (let i = required.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [required[i], required[j]] = [required[j], required[i]];
  }

  return required.join('');
}
export function resolveTempPassword(password?: string | null): string {
  return password?.trim() || Math.random().toString(36).slice(-8) + 'A1!';
}


import { createHash, randomBytes } from 'node:crypto';

const ACTIVATION_EXPIRY_HOURS = 24*7;

export function generateTempAccessKey(): {
  rawAccessKey: string;
  hashedAccessKey: string;
  expiresAt: Date;
} {
  const rawAccessKey = randomBytes(32).toString('hex');

  const hashedAccessKey = hashTempAccessKey(rawAccessKey);

  const expiresAt = calculateTempAccessExpiry(
    ACTIVATION_EXPIRY_HOURS,
  );

  return {
    rawAccessKey,
    hashedAccessKey,
    expiresAt,
  };
}

export function hashTempAccessKey(token: string): string {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}

export function calculateTempAccessExpiry(
  hours: number,
): Date {
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new Error('Expiry hours must be greater than zero');
  }

  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function calculateTempAccessExpiryForResetPassword(
  hours: number,
): Date {
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new Error('Expiry hours must be greater than zero');
  }

  return new Date(Date.now() + hours * 60 * 60 * 1000);
}



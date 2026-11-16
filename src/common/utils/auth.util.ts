
export function parseTtlToMs(ttl: string): number {
  const match = ttl.match(/^(\d+)\s*(s|m|h|d)$/i);

  if (!match) {
    throw new Error(`Invalid JWT_REFRESH_TTL: ${ttl}`);
  }

  const value = Number(match[1]);
  const units: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return value * units[match[2].toLowerCase()];
}
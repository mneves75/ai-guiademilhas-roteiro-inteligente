import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

describe('Auth Invariants', () => {
  it('does not use useSearchParams() anywhere under app/(auth)', () => {
    const root = process.cwd();
    const authDir = path.join(root, 'app', '(auth)');
    const files = walkFiles(authDir).filter((f) => /\.(ts|tsx)$/.test(f));

    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      if (src.includes('useSearchParams(')) offenders.push(path.relative(root, file));
    }

    expect(offenders).toEqual([]);
  });
});

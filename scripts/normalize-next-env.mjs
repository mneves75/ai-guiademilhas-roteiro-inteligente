import { promises as fs } from 'node:fs';

const FILE = 'next-env.d.ts';
const CANONICAL = 'import "./.next/types/routes.d.ts";';

async function main() {
  let text;
  try {
    text = await fs.readFile(FILE, 'utf8');
  } catch {
    return;
  }

  const next = text.replace(
    // Next may rewrite this import based on `distDir` (e.g. `.next-playwright/dist/types/...`).
    // Keep it canonical so running E2E/dev/typegen in different distDirs doesn't churn `next-env.d.ts`.
    /^import\s+"\.\/\.(?:next|next-[^/]+)(?:\/dist)?\/types\/routes\.d\.ts";\s*$/m,
    CANONICAL
  );

  if (next !== text) {
    await fs.writeFile(FILE, next, 'utf8');
  }
}

await main();

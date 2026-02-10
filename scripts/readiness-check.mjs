import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const repoRoot = process.cwd();
const defaultGuidelines = path.join(
  os.homedir(),
  'dev',
  'guidelines-ref',
  'tools',
  'readiness-check.ts'
);
const toolPath = process.env.GUIDELINES_REF_READINESS ?? defaultGuidelines;

const result = spawnSync('bun', [toolPath, '--format=md', '--app=.'], {
  cwd: repoRoot,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repoRoot = process.cwd();
const defaultLowercaseGuidelines = path.join(
  os.homedir(),
  'dev',
  'guidelines-ref',
  'tools',
  'readiness-check.ts'
);
const defaultUppercaseGuidelines = path.join(
  os.homedir(),
  'dev',
  'GUIDELINES-REF',
  'tools',
  'readiness-check.ts'
);

const discoveredDefaultPath = fs.existsSync(defaultLowercaseGuidelines)
  ? defaultLowercaseGuidelines
  : defaultUppercaseGuidelines;

const toolPath = process.env.GUIDELINES_REF_READINESS ?? discoveredDefaultPath;

const result = spawnSync('bun', [toolPath, '--format=md', '--app=.'], {
  cwd: repoRoot,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);

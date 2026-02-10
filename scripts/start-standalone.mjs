import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function syncDir({ src, dest }) {
  if (!(await pathExists(src))) return;

  // Ensure we don't accidentally serve stale assets between builds.
  await fs.rm(dest, { recursive: true, force: true });
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.cp(src, dest, { recursive: true });
}

async function main() {
  const repoRoot = process.cwd();
  // Keep `pnpm start` consistent with `pnpm build` when using a custom distDir.
  // Note: in "output: standalone", Next's server.js runs from `<distDir>/standalone` and expects
  // `distDir` paths to be resolvable *relative to that directory* (see embedded nextConfig.distDir).
  const distDir = process.env.NEXT_DIST_DIR ?? '.next';
  const nextDir = path.join(repoRoot, distDir);
  const standaloneDir = path.join(nextDir, 'standalone');

  const serverEntry = path.join(standaloneDir, 'server.js');
  if (!(await pathExists(serverEntry))) {
    // Keep this actionable and deterministic (E2E depends on `pnpm start`).
    throw new Error(`Missing ${distDir}/standalone/server.js. Run \`pnpm build\` first.`);
  }

  await syncDir({
    src: path.join(repoRoot, 'public'),
    dest: path.join(standaloneDir, 'public'),
  });

  // Default distDir: Next expects `./.next/static` relative to standaloneDir.
  if (distDir === '.next') {
    await syncDir({
      src: path.join(nextDir, 'static'),
      dest: path.join(standaloneDir, '.next', 'static'),
    });
  } else {
    // Custom distDir: Next embeds `distDir: "./<distDir>"` in server.js.
    // Ensure that path exists inside the standalone directory by linking it back to `nextDir`.
    const linkPath = path.join(standaloneDir, distDir);
    const linkParent = path.dirname(linkPath);
    await fs.mkdir(linkParent, { recursive: true });
    await fs.rm(linkPath, { recursive: true, force: true });
    const target = path.relative(linkParent, nextDir) || '.';
    await fs.symlink(target, linkPath, 'dir');
  }

  const childEnv = { ...process.env };
  // Give filesystem readers (e.g. MDX blog posts) a stable "project root" regardless of cwd.
  childEnv.APP_ROOT_DIR ||= repoRoot;

  const child = spawn(process.execPath, ['server.js', ...process.argv.slice(2)], {
    cwd: standaloneDir,
    env: childEnv,
    stdio: 'inherit',
  });

  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });

  child.on('error', (err) => {
    console.error(err);
    process.exit(1);
  });
}

await main();

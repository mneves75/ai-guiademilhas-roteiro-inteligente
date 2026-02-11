import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';

function runSync(cmd, args, env) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function getPlaywrightArgsFromEnv() {
  const extraArgs = [];

  // Keep CI fast by allowing `PW_PROJECT=chromium` without changing the config file.
  if (process.env.PW_PROJECT) {
    extraArgs.push(`--project=${process.env.PW_PROJECT}`);
  }

  return extraArgs;
}

async function waitForHealthy(url, { timeoutMs } = { timeoutMs: 240_000 }) {
  const start = Date.now();
  // Poll aggressively so local runs start fast; keep the overall timeout generous.
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.ok) return;
    } catch {
      // Ignore and retry.
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to allocate a free port'));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
  });
}

function computeWebServerEnv(baseURL) {
  const { port } = new URL(baseURL);
  const serverPort = port || '3000';

  const dbProvider = process.env.DB_PROVIDER ?? 'sqlite';
  const sqlitePathRaw = process.env.SQLITE_PATH ?? '.next-playwright/e2e.db';
  const sqlitePath = path.isAbsolute(sqlitePathRaw)
    ? sqlitePathRaw
    : path.join(process.cwd(), sqlitePathRaw);

  const env = { ...(process.env ?? {}) };
  delete env.NO_COLOR;

  env.PLAYWRIGHT_E2E = '1';
  env.PORT = serverPort;
  env.DB_PROVIDER = dbProvider;

  // Production start requires a canonical origin for Better Auth.
  env.NEXT_PUBLIC_APP_URL ||= baseURL;
  env.BETTER_AUTH_BASE_URL ||= env.BETTER_AUTH_URL || baseURL;
  env.BETTER_AUTH_URL ||= env.BETTER_AUTH_BASE_URL;
  env.BETTER_AUTH_SECRET ||= 'e2e-secret-please-override-this-in-prod-32chars';

  // Keep E2E output isolated from any concurrently running `pnpm dev` build.
  env.NEXT_DIST_DIR ||= path.join('.next-playwright', 'dist');

  if (dbProvider === 'sqlite') {
    env.SQLITE_PATH = sqlitePath;
  }

  return { env, baseURL, dbProvider };
}

async function runExternally({ fullMatrix }) {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${await getFreePort()}`;

  const { env, dbProvider } = computeWebServerEnv(baseURL);
  const healthURL = `${baseURL.replace(/\/$/, '')}/health`;

  // Make the run deterministic and keep disk/memory pressure down by wiping E2E build artifacts.
  // This also prevents a slow creep of old distDirs (we've seen `.next-playwright/dev` and `dist-*`).
  rmSync('.next-playwright', { recursive: true, force: true });
  mkdirSync('.next-playwright', { recursive: true });

  if (dbProvider === 'sqlite') {
    runSync('pnpm', ['db:push:sqlite'], env);
    runSync('pnpm', ['db:seed'], env);
  } else if (dbProvider === 'postgres') {
    if (!env.DATABASE_URL) {
      throw new Error(
        'PW_FULL external E2E requires DATABASE_URL when DB_PROVIDER=postgres. ' +
          'Either set DATABASE_URL, or omit DB_PROVIDER to use sqlite by default.'
      );
    }
    runSync('pnpm', ['db:push:pg'], env);
    runSync('pnpm', ['db:seed'], env);
  } else {
    throw new Error(
      `Playwright E2E does not support DB_PROVIDER=${dbProvider}. Use sqlite or postgres.`
    );
  }

  // Build before Playwright spins up multiple browser engines. This reduces peak memory usage vs.
  // running the build inside Playwright's webServer process when PW_FULL=1.
  runSync('pnpm', ['build'], env);

  // Spawn the standalone server directly to avoid pnpm printing noisy ELIFECYCLE logs on shutdown.
  const server = spawn('node', ['scripts/start-standalone.mjs'], {
    env,
    stdio: 'inherit',
    detached: true,
  });
  const serverExit = new Promise((_, reject) => {
    server.once('exit', (code, signal) => {
      reject(
        new Error(
          `E2E server exited before becoming healthy (code=${code ?? 'null'} signal=${
            signal ?? 'null'
          }).`
        )
      );
    });
  });

  const stop = () => {
    if (server.killed) return;
    // Prefer killing the full process group so `pnpm start` children don't leak.
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      server.kill('SIGTERM');
    }
  };

  try {
    await Promise.race([waitForHealthy(healthURL, { timeoutMs: 240_000 }), serverExit]);

    const testEnv = { ...(process.env ?? {}) };
    delete testEnv.NO_COLOR;
    testEnv.PW_EXTERNAL = '1';
    testEnv.PLAYWRIGHT_BASE_URL = baseURL;
    testEnv.PLAYWRIGHT_E2E = '1';
    testEnv.DB_PROVIDER = dbProvider;
    if (env.SQLITE_PATH) testEnv.SQLITE_PATH = env.SQLITE_PATH;
    if (env.DATABASE_URL) testEnv.DATABASE_URL = env.DATABASE_URL;

    if (fullMatrix) {
      // Keep `PW_FULL=1` so the config enables the full browser matrix.
      testEnv.PW_FULL = '1';
    }

    runSync('pnpm', ['exec', 'playwright', 'test', ...getPlaywrightArgsFromEnv()], testEnv);
  } finally {
    stop();
  }
}

async function main() {
  // Run the app server externally so we can:
  // - use a free ephemeral port (no leaked :3100 listeners),
  // - wipe distDir deterministically,
  // - guarantee cleanup (kill the process group).
  const fullMatrix = process.env.PW_FULL === '1';
  await runExternally({ fullMatrix });
  runSync('node', ['scripts/normalize-next-env.mjs'], process.env);
}

await main();

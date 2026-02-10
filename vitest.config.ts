import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.tsx'],
    include: ['src/**/*.vitest.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*', '**/types/**'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // Next.js provides special handling for `server-only`, but Vitest/Vite will execute it directly.
      // Stub it out so server-only modules remain unit-testable.
      'server-only': resolve(__dirname, './src/test/stubs/server-only.ts'),
    },
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    include: ['test/db/**/*.db-spec.ts', 'test/api/**/*.e2e-spec.ts'],
  },
});

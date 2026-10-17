import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60_000,
    hookTimeout: 60_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/app.ts',
        'src/discord/client.ts',
        'src/discord/events/index.ts',
        'src/discord/events/ready.ts',
      ],
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
        'src/core/**': { lines: 90, functions: 90, statements: 90, branches: 85 },
      },
    },
  },
});

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Three test projects, all run by `npm test`:
 *
 * - unit         src/**\/*.test.ts        Pure logic (rules math, parsers, converters). Node env;
 *                                          a file that needs `window` opts in with a
 *                                          `// @vitest-environment jsdom` docblock.
 * - components   src/**\/*.test.tsx       React Testing Library in jsdom.
 * - integration  tests/integration/**     Real route handlers + real MongoDB (in-memory server,
 *                                          or MONGODB_TEST_URI) - see tests/integration/setup.ts.
 *
 * Run one with `npm run test:unit`, `test:components` or `test:integration`.
 */

const srcDir = fileURLToPath(new URL("./src", import.meta.url));
const serverOnlyStub = fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url));

const shared = {
  // tsconfig says `jsx: preserve` (Next compiles JSX itself) - tests need it compiled.
  esbuild: { jsx: "automatic" as const },
  resolve: {
    // "@/..." mirrors tsconfig's paths; `import "server-only"` throws outside a React Server Components bundle.
    alias: { "@": srcDir, "server-only": serverOnlyStub },
  },
};

export default defineConfig({
  test: {
    // Keep random dice/uuid tests from leaking mocks into each other.
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/data/**", "src/**/*.test.{ts,tsx}", "src/**/loading.tsx"],
      reporter: ["text-summary", "html"],
    },
    projects: [
      {
        ...shared,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        ...shared,
        test: {
          name: "components",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./tests/setup/components.ts"],
        },
      },
      {
        ...shared,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["./tests/integration/globalSetup.ts"],
          setupFiles: ["./tests/integration/setup.ts"],
          // First run may download a MongoDB binary (~70 MB, cached afterwards).
          hookTimeout: 120_000,
          testTimeout: 20_000,
        },
      },
    ],
  },
});

import type { TestProject } from "vitest/node";

/**
 * Starts one MongoDB for the whole integration run and hands its URI to the
 * test workers (read back in ./setup.ts via `inject("mongoUri")`).
 *
 * - Default: an in-memory `mongod` from mongodb-memory-server. The first run
 *   downloads the binary (~70 MB) into node_modules/.cache; later runs are
 *   offline and start in about a second.
 * - Set MONGODB_TEST_URI to use a server you already run instead (e.g.
 *   `MONGODB_TEST_URI=mongodb://127.0.0.1:27017`). Every test file gets its
 *   own throwaway database (`cs_test_*`), which is dropped afterwards, so it
 *   never touches the app's real `characterSheet` database.
 */
export default async function setup(project: TestProject) {
  const external = process.env.MONGODB_TEST_URI;
  if (external) {
    project.provide("mongoUri", external);
    return;
  }

  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const server = await MongoMemoryServer.create();
  project.provide("mongoUri", server.getUri());

  return async () => {
    await server.stop();
  };
}

declare module "vitest" {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

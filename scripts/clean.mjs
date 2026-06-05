import { rm } from "node:fs/promises";

const targets = ["dist", "dist-server", "tsconfig.app.tsbuildinfo", "tsconfig.server.tsbuildinfo"];

await Promise.all(
  targets.map((target) =>
    rm(target, { recursive: true, force: true }).catch((error) => {
      console.warn(`Could not remove ${target}: ${error.message}`);
    })
  )
);

import { spawn } from "node:child_process";

import type { PrismaInitializerContract } from "../../core/contracts/prisma-initializer.contract.js";

export class PrismaInitializerAdapter implements PrismaInitializerContract {
  async initialize(projectPath: string): Promise<void> {
    console.log("Initializing Prisma...");

    await new Promise<void>((resolve, reject) => {
      const child = spawn("npx", ["prisma", "init"], {
        cwd: projectPath,
        stdio: "inherit",
        shell: true,
      });

      child.on("error", reject);

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(`Prisma initialization failed with code ${code}`));
      });
    });
  }
}

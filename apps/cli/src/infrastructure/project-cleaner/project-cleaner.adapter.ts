import { rm } from "node:fs/promises";
import { join } from "node:path";

import type { ProjectCleanerContract } from "../../core/contracts/project-cleaner.contract.js";

export class ProjectCleanerAdapter implements ProjectCleanerContract {
  async clean(projectPath: string): Promise<void> {
    console.log("[ProjectCleaner] Cleaning:", projectPath);
    const files = [
      "src/app.controller.ts",
      "src/app.service.ts",
      "src/app.controller.spec.ts",
    ];

    for (const file of files) {
      try {
        await rm(join(projectPath, file));
        console.log(`Removed ${file}`);
      } catch {
        // Arquivo inexistente: ignora.
      }
    }
  }
}

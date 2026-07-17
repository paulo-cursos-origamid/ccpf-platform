import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import type { DirectoryCreatorContract } from "../../core/contracts/directory-creator.contract.js";

export class DirectoryCreatorAdapter
  implements DirectoryCreatorContract
{
  async create(
    projectPath: string,
    directories: string[],
  ): Promise<void> {
    for (const directory of directories) {
      await mkdir(join(projectPath, directory), {
        recursive: true,
      });

      console.log(`Created directory: ${directory}`);
    }
  }
}

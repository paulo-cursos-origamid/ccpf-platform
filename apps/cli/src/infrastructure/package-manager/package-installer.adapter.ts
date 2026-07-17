import { spawn } from "node:child_process";

import type { PackageInstallerContract } from "../../core/contracts/package-installer.contract.js";
import type { PackageInstallOptions } from "../../core/models/package-install-options.model.js";

export class PackageInstallerAdapter
  implements PackageInstallerContract
{
  async install(
    options: PackageInstallOptions,
  ): Promise<void> {
    if (options.dependencies.length > 0) {
      await this.execute(
        options.packageManager,
        [
          "install",
          ...options.dependencies,
        ],
        options.projectPath,
      );
    }

    if (options.devDependencies.length > 0) {
      await this.execute(
        options.packageManager,
        [
          "install",
          "-D",
          ...options.devDependencies,
        ],
        options.projectPath,
      );
    }
  }

  private async execute(
    command: string,
    args: string[],
    cwd: string,
  ): Promise<void> {
    console.log(`Executing: ${command} ${args.join(" ")}`);

    await new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, {
        cwd,
        stdio: "inherit",
        shell: true,
      });

      child.on("error", reject);

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(
          new Error(
            `${command} exited with code ${code}`,
          ),
        );
      });
    });
  }
}

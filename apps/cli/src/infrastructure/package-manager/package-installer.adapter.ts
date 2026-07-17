import { spawn } from "node:child_process";
import { platform } from "node:os";

import type { PackageInstallerContract } from "../../core/contracts/package-installer.contract.js";
import type { PackageInstallOptions } from "../../core/models/package-install-options.model.js";

export class PackageInstallerAdapter implements PackageInstallerContract {
  async install(options: PackageInstallOptions): Promise<void> {
    await this.installDependencies(options);

    await this.installDevDependencies(options);
  }

  /**
   * Instala as dependências de produção.
   */
  private async installDependencies(
    options: PackageInstallOptions,
  ): Promise<void> {
    if (options.dependencies.length === 0) {
      return;
    }

    await this.execute(["install", ...options.dependencies], options);
  }

  /**
   * Instala as dependências de desenvolvimento.
   */
  private async installDevDependencies(
    options: PackageInstallOptions,
  ): Promise<void> {
    if (options.devDependencies.length === 0) {
      return;
    }

    await this.execute(
      ["install", "--save-dev", ...options.devDependencies],
      options,
    );
  }

  /**
   * Executa o gerenciador de pacotes.
   */
  private async execute(
    args: string[],
    options: PackageInstallOptions,
  ): Promise<void> {
    const executable =
      platform() === "win32" ? "npm.cmd" : options.packageManager;

    console.log("");
    console.log("====================================");
    console.log("Installing packages");
    console.log("Project:", options.projectPath);
    console.log("Command:", executable);
    console.log("Arguments:", args.join(" "));
    console.log("====================================");
    console.log("");

    await new Promise<void>((resolve, reject) => {
      const child = spawn(executable, args, {
        cwd: options.projectPath,
        stdio: "inherit",
        shell: false,
      });

      child.on("error", reject);

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(`${executable} exited with code ${code}`));
      });
    });
  }
}

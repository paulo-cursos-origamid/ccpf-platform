import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import type { NestCliContract } from "../../core/contracts/nest-cli.contract.js";
import type { BackendBootstrapOptions } from "../../core/models/backend-bootstrap-options.model.js";

export class NestCliAdapter
  implements NestCliContract
{
  async createProject(
    options: BackendBootstrapOptions,
  ): Promise<void> {
    const destination =
      options.destination ??
      process.cwd();

    const cwd = resolve(destination);

    mkdirSync(cwd, {
      recursive: true,
    });

    console.log(
      `Creating backend "${options.projectName}"`,
    );

    console.log(
      `Destination: ${cwd}`,
    );

    console.log(
      `Package manager: ${options.packageManager}`,
    );

    await new Promise<void>(
      (resolvePromise, rejectPromise) => {
        const child = spawn(
          "nest",
          this.buildArguments(options),
          {
            cwd,
            stdio: "inherit",
            shell: true,
          },
        );

        child.on(
          "error",
          rejectPromise,
        );

        child.on(
          "close",
          (code) => {
            if (code === 0) {
              resolvePromise();
              return;
            }

            rejectPromise(
              new Error(
                `Nest CLI exited with code ${code}`,
              ),
            );
          },
        );
      },
    );
  }

  private buildArguments(
    options: BackendBootstrapOptions,
  ): string[] {
    return [
      "new",
      options.projectName,
      "--skip-git",
      "--package-manager",
      options.packageManager,
    ];
  }
}
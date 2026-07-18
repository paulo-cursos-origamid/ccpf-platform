import type { BackendGeneratorOptions } from "../../core/contracts/generators/backend-generator.contract.js";
import type { BackendBootstrapOptions } from "../../core/models/backend-bootstrap-options.model.js";
import type { PackageManager } from "../../core/types/package-manager.type.js";

export class BackendBootstrapBuilder {
  static build(
    options: BackendGeneratorOptions,
    packageManager: PackageManager,
  ): BackendBootstrapOptions {
    return {
      projectName: options.projectName,
      packageManager,

      ...(options.destination && {
        destination: options.destination,
      }),
    };
  }
}

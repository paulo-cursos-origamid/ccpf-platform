import type { PackageInstallOptions } from "../models/package-install-options.model.js";

export interface PackageInstallerContract {
  install(options: PackageInstallOptions): Promise<void>;
}

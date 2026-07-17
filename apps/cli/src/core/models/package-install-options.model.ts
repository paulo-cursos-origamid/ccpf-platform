import type { PackageManager } from "../types/package-manager.type.js";

export interface PackageInstallOptions {
  projectPath: string;
  packageManager: PackageManager;
  dependencies: string[];
  devDependencies: string[];
}

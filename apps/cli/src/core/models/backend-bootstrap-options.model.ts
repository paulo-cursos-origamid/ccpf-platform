import type { PackageManager } from "../types/package-manager.type.js";

export interface BackendBootstrapOptions {
  projectName: string;
  destination?: string;
  packageManager: PackageManager;
}

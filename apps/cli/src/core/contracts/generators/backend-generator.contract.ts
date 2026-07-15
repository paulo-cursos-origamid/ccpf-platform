import type { BackendBootstrapOptions } from "../../models/backend-bootstrap-options.model.js";

export interface BackendGeneratorContract {
  generate(options: BackendGeneratorOptions): Promise<void>;
}

export interface BackendGeneratorOptions {
  projectName: string;
  destination?: string;
}

export interface NestCliContract {
  createProject(
    options: BackendBootstrapOptions,
  ): Promise<void>;
}
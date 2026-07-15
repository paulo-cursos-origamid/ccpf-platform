import type { BackendBootstrapOptions } from "../models/backend-bootstrap-options.model.js";

export interface NestCliContract {
  createProject(options: BackendBootstrapOptions): Promise<void>;
}

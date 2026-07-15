import type {
  BackendGeneratorContract,
  BackendGeneratorOptions,
} from "../../core/contracts/generators/backend-generator.contract.js";

import type { NestCliContract } from "../../core/contracts/nest-cli.contract.js";

import { BackendBootstrapBuilder } from "../builders/backend-bootstrap.builder.js";

export class BackendGenerator implements BackendGeneratorContract {
  constructor(private readonly nestCli: NestCliContract) {}

  async generate(options: BackendGeneratorOptions): Promise<void> {
    const bootstrap = BackendBootstrapBuilder.build(options, "npm");

    await this.nestCli.createProject(bootstrap);
  }
}

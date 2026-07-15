import type {
  BackendGeneratorContract,
  BackendGeneratorOptions,
} from "../../core/contracts/generators/backend-generator.contract.js";

export class BackendGenerator implements BackendGeneratorContract {
  async generate(options: BackendGeneratorOptions): Promise<void> {
    console.log(`Generating backend: ${options.projectName}`);
  }
}

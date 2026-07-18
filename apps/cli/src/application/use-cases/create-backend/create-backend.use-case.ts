import type { BackendGeneratorContract } from "../../../core/contracts/generators/backend-generator.contract.js";

export interface CreateBackendInput {
  projectName: string;
  destination?: string;
}

export class CreateBackendUseCase {
  constructor(private readonly generator: BackendGeneratorContract) {}

  async execute(input: CreateBackendInput): Promise<void> {
    await this.generator.generate({
      projectName: input.projectName,
      ...(input.destination && {
        destination: input.destination,
      }),
    });
  }
}

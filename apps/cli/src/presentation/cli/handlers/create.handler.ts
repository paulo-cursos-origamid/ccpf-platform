import { CreateBackendUseCase } from "../../../application/use-cases/create-backend/create-backend.use-case.js";
import { GenerateArtifactUseCase } from "../../../application/use-cases/generate-artifact/generate-artifact.use-case.js";

import { BackendGeneratorFactory } from "../../../shared/factories/backend-generator.factory.js";

export class CreateHandler {
  async execute(type: string, name: string, path: string): Promise<void> {
    if (type === "backend") {
      const useCase = new CreateBackendUseCase(
        BackendGeneratorFactory.create(),
      );

      await useCase.execute({
        projectName: name,
        destination: path,
      });

      return;
    }

    const useCase = new GenerateArtifactUseCase();

    await useCase.execute({
      artifact: type,
      name,
      path,
    });
  }
}

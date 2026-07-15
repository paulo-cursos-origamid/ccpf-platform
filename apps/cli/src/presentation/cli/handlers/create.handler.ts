import { GenerateArtifactUseCase } from "../../../application/use-cases/generate-artifact/generate-artifact.use-case.js";
import { CreateBackendUseCase } from "../../../application/use-cases/create-backend/create-backend.use-case.js";
import { BackendGenerator } from "../../../application/generators/backend.generator.js";
import { NestCliAdapter } from "../../../infrastructure/nest-cli/nest-cli.adapter.js";

export class CreateHandler {
  async execute(type: string, name: string, path: string): Promise<void> {
    if (type === "backend") {
      const nestCli = new NestCliAdapter();

      const generator = new BackendGenerator(nestCli);

      const useCase = new CreateBackendUseCase(generator);

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

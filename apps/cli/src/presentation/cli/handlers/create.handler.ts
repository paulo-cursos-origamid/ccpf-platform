import { GenerateArtifactUseCase } from "../../../application/use-cases/generate-artifact/generate-artifact.use-case.js";

export class CreateHandler {
  async execute(type: string, name: string, path: string): Promise<void> {
    const useCase = new GenerateArtifactUseCase();

    await useCase.execute({
      artifact: type,
      name,
      path,
    });
  }
}



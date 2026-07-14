import type { GenerateArtifactDto } from "../../dto/generate-artifact.dto.js";

import { BlueprintRepository } from "../../../infrastructure/repositories/blueprint.repository.js";
import { ArtifactGeneratorFactory } from "../../../shared/factories/artifact-generator.factory.js";

export class GenerateArtifactUseCase {
  async execute(dto: GenerateArtifactDto): Promise<void> {
    const repository = new BlueprintRepository();

    const blueprint = await repository.find("nestjs", dto.artifact, dto.path);

    const generator = ArtifactGeneratorFactory.create();

    await generator.generate({
      ...blueprint,

      name: dto.name,

      destination: dto.path,

      files: blueprint.files.map((file) => ({
        ...file,

        destination: file.destination.replace("{{name}}", dto.name),
      })),
    });
  }
}

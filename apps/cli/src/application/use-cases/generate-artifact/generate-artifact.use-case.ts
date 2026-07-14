import type { GenerateArtifactDto } from "../../dto/generate-artifact.dto.js";

import { BlueprintLoaderService } from "../../services/blueprint-loader.service.js";
import { BlueprintComposerService } from "../../services/blueprint-composer.service.js";

import { ArtifactGeneratorFactory } from "../../../shared/factories/artifact-generator.factory.js";

export class GenerateArtifactUseCase {
  async execute(dto: GenerateArtifactDto): Promise<void> {
    const loader = new BlueprintLoaderService();

    const composer = new BlueprintComposerService(loader);

    const blueprint = await loader.load("nestjs", dto.artifact, dto.path);

    const blueprints = await composer.compose(blueprint);

    const generator = ArtifactGeneratorFactory.create();

    for (const blueprint of blueprints) {
      await generator.generate({
        ...blueprint,
        name: dto.name,
      });
    }
  }
}

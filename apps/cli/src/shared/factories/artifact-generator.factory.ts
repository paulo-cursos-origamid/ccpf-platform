import { ArtifactGenerator } from "../../application/generators/artifact.generator.js";
import { BlueprintPathService } from "../../application/services/blueprint-path.service.js";

import { FileSystemAdapter } from "../../infrastructure/filesystem/file-system.adapter.js";
import { LoggerAdapter } from "../../infrastructure/logger/logger.adapter.js";
import { TemplateEngineAdapter } from "../../infrastructure/template-engine/template-engine.adapter.js";

export class ArtifactGeneratorFactory {
  public static create(): ArtifactGenerator {
    const fileSystem = new FileSystemAdapter();
    const templateEngine = new TemplateEngineAdapter();
    const logger = new LoggerAdapter();

    return new ArtifactGenerator(fileSystem, templateEngine, logger, new BlueprintPathService());
  }
}

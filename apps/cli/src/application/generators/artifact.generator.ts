import path from "node:path";

import type { FileSystemContract } from "../../core/contracts/file-system.contract.js";
import type { GeneratorContract } from "../../core/contracts/generator.contract.js";
import type { LoggerContract } from "../../core/contracts/logger.contract.js";
import type { TemplateEngineContract } from "../../core/contracts/template-engine.contract.js";
import type { BlueprintModel } from "../../core/models/blueprint.model.js";

import { BlueprintPathService } from "../services/blueprint-path.service.js";

export class ArtifactGenerator implements GeneratorContract {
  constructor(
    private readonly fileSystem: FileSystemContract,
    private readonly templateEngine: TemplateEngineContract,
    private readonly logger: LoggerContract,
    private readonly blueprintPathService: BlueprintPathService,
  ) {}

  async generate(blueprint: BlueprintModel): Promise<void> {
    this.logger.info(`Generating ${blueprint.type}: ${blueprint.name}`);

    for (const file of blueprint.files) {
      this.logger.info(`Creating file: ${file.destination}`);

      /**
       * 1. Resolver caminho do template
       */
      const templatePath = this.blueprintPathService.resolveTemplate(
        blueprint.platform,
        blueprint.type,
        file.template,
      );

      const templateContent = await this.fileSystem.readFile(templatePath);

      /**
       * 2. Renderizar template
       */
      const generatedContent = this.templateEngine.render(templateContent, {
        name: blueprint.name,
      });

      /**
       * 3. Resolver destino final
       *
       * Exemplo:
       *
       * blueprint.destination
       * ./apps/api
       *
       * +
       *
       * file.destination
       * expenses.module.ts
       *
       * =
       *
       * ./apps/api/expenses.module.ts
       */
      const outputPath = path.join(blueprint.destination, file.destination);

      /**
       * 4. Criar diretório
       */
      const directory = path.dirname(outputPath);

      await this.fileSystem.createDirectory(directory);

      /**
       * 5. Escrever arquivo
       */
      await this.fileSystem.writeFile(outputPath, generatedContent);

      this.logger.success(`Created: ${outputPath}`);
    }

    this.logger.success("Generation completed");
  }
}

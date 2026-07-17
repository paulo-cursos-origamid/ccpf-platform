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

    for (const file of blueprint.files ?? []) {
      /**
       * 1. Resolver caminho do template
       */
      const templatePath = this.blueprintPathService.resolveTemplate(
        blueprint.platform,
        blueprint.type,
        file.template,
      );

      /**
       * 2. Ler template
       */
      const templateContent = await this.fileSystem.readFile(templatePath);

      /**
       * 3. Renderizar conteúdo do template
       */
      const generatedContent = this.templateEngine.render(
        templateContent,
        blueprint.context ?? {
          name: blueprint.name,
        },
      );

      /**
       * 4. Renderizar destino do arquivo
       *
       * Exemplo:
       *
       * application/dto/{{kebabCase name}}.dto.ts
       *
       * =>
       *
       * application/dto/create-user.dto.ts
       */
      const renderedDestination = this.templateEngine.render(
        file.destination,
        blueprint.context ?? {
          name: blueprint.name,
        },
      );

      this.logger.info(`Creating file: ${renderedDestination}`);

      /**
       * 5. Resolver caminho absoluto do arquivo
       */
      const outputPath = path.join(blueprint.destination, renderedDestination);

      /**
       * 6. Criar diretório de destino
       */
      const directory = path.dirname(outputPath);

      await this.fileSystem.createDirectory(directory);

      /**
       * 7. Escrever arquivo
       */
      await this.fileSystem.writeFile(outputPath, generatedContent);

      this.logger.success(`Created: ${outputPath}`);
    }

    this.logger.success("Generation completed");
  }
}

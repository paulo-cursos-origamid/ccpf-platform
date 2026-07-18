import { BackendGenerator } from "../../application/generators/backend.generator.js";
import { BlueprintComposerService } from "../../application/services/blueprint-composer.service.js";
import { BlueprintLoaderService } from "../../application/services/blueprint-loader.service.js";

import { NestCliAdapter } from "../../infrastructure/nest-cli/nest-cli.adapter.js";
import { PackageInstallerAdapter } from "../../infrastructure/package-manager/package-installer.adapter.js";
import { PrismaInitializerAdapter } from "../../infrastructure/prisma/prisma-initializer.adapter.js";
import { ProjectCleanerAdapter } from "../../infrastructure/project-cleaner/project-cleaner.adapter.js";

import { ArtifactGeneratorFactory } from "./artifact-generator.factory.js";

export class BackendGeneratorFactory {
  static create(): BackendGenerator {
    const blueprintLoader = new BlueprintLoaderService();

    const blueprintComposer = new BlueprintComposerService(blueprintLoader);

    return new BackendGenerator(
      new NestCliAdapter(),
      new ProjectCleanerAdapter(),
      new PackageInstallerAdapter(),
      new PrismaInitializerAdapter(),
      blueprintLoader,
      blueprintComposer,
      ArtifactGeneratorFactory.create(),
    );
  }
}

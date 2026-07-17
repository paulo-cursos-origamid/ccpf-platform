import { join } from "node:path";
import type {
  BackendGeneratorContract,
  BackendGeneratorOptions,
} from "../../core/contracts/generators/backend-generator.contract.js";

import type { NestCliContract } from "../../core/contracts/nest-cli.contract.js";
import type { ProjectCleanerContract } from "../../core/contracts/project-cleaner.contract.js";

import { BackendBootstrapBuilder } from "../builders/backend-bootstrap.builder.js";
import type { PackageInstallerContract } from "../../core/contracts/package-installer.contract.js";
import {
  BACKEND_DEPENDENCIES,
  BACKEND_DEV_DEPENDENCIES,
} from "../constants/backend-packages.constant.js";
import type { BlueprintLoaderService } from "../services/blueprint-loader.service.js";
import type { ArtifactGenerator } from "./artifact.generator.js";
import type { PrismaInitializerContract } from "../../core/contracts/prisma-initializer.contract.js";
import type { BlueprintComposerService } from "../services/blueprint-composer.service.js";
export class BackendGenerator implements BackendGeneratorContract {
  constructor(
    private readonly nestCli: NestCliContract,
    private readonly projectCleaner: ProjectCleanerContract,
    private readonly packageInstaller: PackageInstallerContract,
    private readonly prismaInitializer: PrismaInitializerContract,
    private readonly blueprintLoader: BlueprintLoaderService,
    private readonly blueprintComposer: BlueprintComposerService,
    private readonly artifactGenerator: ArtifactGenerator,
  ) {}

  async generate(options: BackendGeneratorOptions): Promise<void> {
    const bootstrap = BackendBootstrapBuilder.build(options, "npm");

    await this.nestCli.createProject(bootstrap);
    const destination = options.destination ?? process.cwd();

    const projectPath = join(destination, options.projectName);

    await this.projectCleaner.clean(projectPath);

    await this.packageInstaller.install({
      projectPath,
      packageManager: "npm",
      dependencies: [...BACKEND_DEPENDENCIES],
      devDependencies: [...BACKEND_DEV_DEPENDENCIES],
    });
    await this.prismaInitializer.initialize(projectPath);

    const blueprint = await this.blueprintLoader.load(
      "nestjs",
      "backend",
      projectPath,
    );

    const composedBlueprints = await this.blueprintComposer.compose(blueprint);

    for (const item of composedBlueprints) {
      item.context = {
        projectName: options.projectName,
      };

      await this.artifactGenerator.generate(item);
    }
  }
}

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { BlueprintValidatorService } from "../../application/services/blueprint-validator.service.js";
import type { BlueprintRepositoryContract } from "../../core/contracts/repositories/blueprint.repository.contract.js";
import type { Blueprint } from "../../core/models/blueprint.type.js";
import type { BlueprintSchemaModel } from "../../core/models/blueprint-schema.model.js";

export class BlueprintRepository implements BlueprintRepositoryContract {
  async find(
    platform: string,
    artifact: string,
    destination: string,
  ): Promise<Blueprint> {
    const blueprintPath = resolve(
      process.cwd(),
      "src",
      "platform",
      platform,
      "blueprints",
      artifact,
      "blueprint.json",
    );

    const content = await readFile(blueprintPath, "utf-8");
    

    const blueprint = JSON.parse(content) as BlueprintSchemaModel;

    const validator = new BlueprintValidatorService();
    validator.validate(blueprint);

    if (blueprint.files) {
      return {
        platform,
        name: artifact,
        type: blueprint.type,
        destination,
        files: blueprint.files.map((file) => ({
          template: file.template,
          destination: file.destination,
        })),
      };
    }

    if (blueprint.children) {
      return {
        platform,
        name: artifact,
        type: blueprint.type,
        destination,
        children: blueprint.children,
      };
    }

    throw new Error(`Invalid blueprint: ${artifact}`);
  }
}

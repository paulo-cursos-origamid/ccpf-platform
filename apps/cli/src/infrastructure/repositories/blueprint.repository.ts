import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { BlueprintValidatorService } from "../../application/services/blueprint-validator.service.js";
import type { BlueprintRepositoryContract } from "../../core/contracts/repositories/blueprint.repository.contract.js";
import type { Blueprint } from "../../core/models/blueprint.type.js";
import type { BlueprintSchemaModel } from "../../core/models/blueprint-schema.model.js";
import type { CompositeBlueprintModel } from "../../core/models/composite-blueprint.model.js";

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

    console.log("Loading blueprint:", blueprintPath);

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
      const compositeBlueprint: CompositeBlueprintModel = {
        platform,
        name: artifact,
        type: "composite",
        destination,
        children: blueprint.children,
      };

      return compositeBlueprint;
    }

    throw new Error(`Invalid blueprint: ${artifact}`);
  }
}

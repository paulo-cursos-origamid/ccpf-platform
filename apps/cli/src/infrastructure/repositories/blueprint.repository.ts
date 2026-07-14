import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { BlueprintRepositoryContract } from "../../core/contracts/repositories/blueprint.repository.contract.js";
import type { BlueprintModel } from "../../core/models/blueprint.model.js";

interface BlueprintFile {
  template: string;
  destination: string;
}

interface BlueprintJson {
  type: string;
  files: BlueprintFile[];
}

export class BlueprintRepository implements BlueprintRepositoryContract {
  async find(
    platform: string,
    artifact: string,
    destination: string,
  ): Promise<BlueprintModel> {
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

    const blueprint = JSON.parse(content) as BlueprintJson;

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
}

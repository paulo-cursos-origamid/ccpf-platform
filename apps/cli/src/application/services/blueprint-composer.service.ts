import type { Blueprint } from "../../core/models/blueprint.type.js";
import type { BlueprintModel } from "../../core/models/blueprint.model.js";
import type { CompositeBlueprintModel } from "../../core/models/composite-blueprint.model.js";

import { BlueprintLoaderService } from "./blueprint-loader.service.js";

export class BlueprintComposerService {
  constructor(private readonly loader: BlueprintLoaderService) {}

  /**
   * Converte um blueprint em uma lista de blueprints simples.
   */
  async compose(blueprint: Blueprint): Promise<BlueprintModel[]> {
    /**
     * Blueprint simples.
     */
    if ("children" in blueprint) {
      return this.composeCompositeBlueprint(blueprint);
    }

    return [blueprint];
  }

  /**
   * Resolve um blueprint composto.
   */
  private async composeCompositeBlueprint(
    blueprint: CompositeBlueprintModel,
  ): Promise<BlueprintModel[]> {
    const blueprints: BlueprintModel[] = [];

    for (const child of blueprint.children) {
      const loadedBlueprint = await this.loader.load(
        blueprint.platform,
        child.blueprint,
        blueprint.destination,
      );

      const composedBlueprints = await this.compose(loadedBlueprint);

      blueprints.push(...composedBlueprints);
    }

    return blueprints;
  }
}

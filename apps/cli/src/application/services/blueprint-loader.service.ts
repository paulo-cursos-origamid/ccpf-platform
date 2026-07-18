import { BlueprintRepository } from "../../infrastructure/repositories/blueprint.repository.js";

import type { Blueprint } from "../../core/models/blueprint.type.js";

export class BlueprintLoaderService {
  constructor(
    private readonly repository = new BlueprintRepository(),
  ) {}

  async load(
    platform: string,
    artifact: string,
    destination: string,
  ): Promise<Blueprint> {
    return this.repository.find(
      platform,
      artifact,
      destination,
    );
  }
}
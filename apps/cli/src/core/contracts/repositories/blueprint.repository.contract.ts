import type { Blueprint } from "../../models/blueprint.type.js";

export interface BlueprintRepositoryContract {
  find(
    platform: string,
    artifact: string,
    destination: string,
  ): Promise<Blueprint>;
}

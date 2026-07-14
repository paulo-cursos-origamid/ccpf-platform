import type { BlueprintModel } from "../../models/blueprint.model.js";

export interface BlueprintRepositoryContract {
  find(
    platform: string,
    artifact: string,
    destination: string,
  ): Promise<BlueprintModel>;
}

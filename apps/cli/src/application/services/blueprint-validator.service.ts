import type { BlueprintSchemaModel } from "../../core/models/blueprint-schema.model.js";

export class BlueprintValidatorService {
  validate(blueprint: BlueprintSchemaModel): void {
    if (!blueprint.$schema) {
      throw new Error("Blueprint schema version is required.");
    }

    if (!blueprint.name) {
      throw new Error("Blueprint name is required.");
    }

    if (!blueprint.platform) {
      throw new Error("Blueprint platform is required.");
    }

    if (!blueprint.type) {
      throw new Error("Blueprint type is required.");
    }

    const hasFiles =
      Array.isArray(blueprint.files) && blueprint.files.length > 0;

    const hasChildren =
      Array.isArray(blueprint.children) && blueprint.children.length > 0;

    /**
     * Um blueprint deve possuir OU files OU children.
     */
    if (!hasFiles && !hasChildren) {
      throw new Error(
        "Blueprint must contain either 'files' or 'children'.",
      );
    }

    /**
     * Não pode possuir ambos.
     */
    if (hasFiles && hasChildren) {
      throw new Error(
        "Blueprint cannot contain both 'files' and 'children'.",
      );
    }
  }
}
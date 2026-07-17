import type { BlueprintSchemaModel } from "../../core/models/blueprint-schema.model.js";

export class BlueprintValidatorService {
  validate(blueprint: BlueprintSchemaModel): void {
    /**
     * Schema obrigatório.
     */
    if (!blueprint.$schema) {
      throw new Error("Blueprint schema version is required.");
    }

    /**
     * Nome obrigatório.
     */
    if (!blueprint.name) {
      throw new Error("Blueprint name is required.");
    }

    /**
     * Plataforma obrigatória.
     */
    if (!blueprint.platform) {
      throw new Error("Blueprint platform is required.");
    }

    /**
     * Tipo obrigatório.
     */
    if (!blueprint.type) {
      throw new Error("Blueprint type is required.");
    }

    /**
     * Verifica tipos de conteúdo suportados.
     */
    const hasFiles =
      Array.isArray(blueprint.files) && blueprint.files.length > 0;

    const hasArtifacts =
      Array.isArray(blueprint.artifacts) && blueprint.artifacts.length > 0;

    const hasChildren =
      Array.isArray(blueprint.children) && blueprint.children.length > 0;

    /**
     * Blueprint precisa possuir algum conteúdo.
     *
     * Pode ser:
     * - files     -> arquivos individuais
     * - artifacts -> artefatos compostos
     * - children  -> blueprint composto
     */
    if (!hasFiles && !hasArtifacts && !hasChildren) {
      throw new Error(
        "Blueprint must contain either 'files', 'artifacts' or 'children'.",
      );
    }

    /**
     * Um blueprint não pode misturar estratégias.
     *
     * Exemplos inválidos:
     *
     * files + children
     * artifacts + children
     * files + artifacts
     */
    const definitions = [hasFiles, hasArtifacts, hasChildren].filter(
      Boolean,
    ).length;

    if (definitions > 1) {
      throw new Error(
        "Blueprint cannot contain multiple artifact definitions.",
      );
    }
  }
}

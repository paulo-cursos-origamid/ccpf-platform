import type { BlueprintChildModel } from "./blueprint-child.model.js";

export interface CompositeBlueprintModel {
  /**
   * Plataforma.
   */
  platform: string;

  /**
   * Nome do blueprint.
   */
  name: string;

  /**
   * Tipo do artefato.
   */
  type: string;

  /**
   * Diretório de geração.
   */
  destination: string;

  /**
   * Blueprints filhos.
   */
  children: BlueprintChildModel[];
}

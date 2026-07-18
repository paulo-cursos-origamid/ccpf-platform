import type { BlueprintChildModel } from "./blueprint-child.model.js";
import type { TemplateContextModel } from "./template-context.model.js";

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
  type: "composite";

  /**
   * Diretório de geração.
   */
  destination: string;

  /**
   * Dados disponíveis para renderização dos templates.
   */
  context?: TemplateContextModel;

  /**
   * Blueprints filhos.
   */
  children: BlueprintChildModel[];
}

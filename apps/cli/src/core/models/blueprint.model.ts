import type { GeneratedFileModel } from "./generated-file.model.js";
import type { TemplateContextModel } from "./template-context.model.js";

export interface BlueprintModel {
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
   * Diretório onde os arquivos serão gerados.
   */
  destination: string;

  /**
 * Dados disponíveis para renderização dos templates.
 */
context?: TemplateContextModel;

  /**
   * Arquivos pertencentes ao blueprint.
   */
  files: GeneratedFileModel[];
}

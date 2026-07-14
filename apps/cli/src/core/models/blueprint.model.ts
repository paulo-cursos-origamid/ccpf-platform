import type { GeneratedFileModel } from "./generated-file.model.js";

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
   * Arquivos pertencentes ao blueprint.
   */
  files: GeneratedFileModel[];
}

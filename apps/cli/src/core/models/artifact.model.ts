export type ArtifactType = "file" | "directory";

export interface ArtifactModel {
  /**
   * Tipo do artefato.
   */
  type: ArtifactType;

  /**
   * Template utilizado para geração de arquivos.
   *
   * Não utilizado para diretórios.
   */
  template?: string;

  /**
   * Caminho de destino do artefato.
   *
   * Pode conter variáveis:
   *
   * src/modules/{{name}}/domain/entities
   */
  destination: string;
}

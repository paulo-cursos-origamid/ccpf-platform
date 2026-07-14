import type { BlueprintChildModel } from "./blueprint-child.model.js";

export interface BlueprintFileSchemaModel {
  /**
   * Caminho relativo do template dentro do blueprint.
   *
   * Exemplo:
   * application/services/service.ts.hbs
   */
  template: string;

  /**
   * Caminho relativo do arquivo que será gerado.
   *
   * Exemplo:
   * application/services/{{name}}.service.ts
   */
  destination: string;
}

export interface BlueprintSchemaModel {
  /**
   * Versão do schema.
   */
  $schema: string;

  /**
   * Nome do blueprint.
   */
  name: string;

  /**
   * Descrição do blueprint.
   */
  description: string;

  /**
   * Plataforma.
   */
  platform: string;

  /**
   * Tipo do artefato.
   */
  type: string;

  /**
   * Variáveis utilizadas pelo blueprint.
   *
   * Exemplo:
   * ["name"]
   */
  variables?: string[];

  /**
   * Arquivos pertencentes ao blueprint.
   *
   * Utilizado por blueprints simples.
   */
  files?: BlueprintFileSchemaModel[];

  /**
   * Blueprints filhos.
   *
   * Utilizado por blueprints compostos.
   */
  children?: BlueprintChildModel[];
}

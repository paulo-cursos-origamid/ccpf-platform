export interface GeneratedFileModel {
  /**
   * Caminho do template dentro do blueprint.
   *
   * Exemplo:
   * application/services/service.ts.hbs
   */
  template: string;

  /**
   * Caminho final relativo ao módulo.
   *
   * Exemplo:
   * application/services/expenses.service.ts
   */
  destination: string;
}
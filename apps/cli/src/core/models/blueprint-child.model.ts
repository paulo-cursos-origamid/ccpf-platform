export interface BlueprintChildModel {
  /**
   * Nome do blueprint filho.
   *
   * Exemplo:
   * module
   */
  blueprint: string;

  /**
   * Variáveis específicas do blueprint filho.
   *
   * Futuramente permitirá:
   *
   * create-user
   * update-user
   * delete-user
   */
  variables?: Record<string, string>;
}

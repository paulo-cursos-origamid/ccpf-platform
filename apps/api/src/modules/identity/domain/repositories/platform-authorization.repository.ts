/**
 * Contrato responsável por consultar as permissões globais
 * atribuídas a um usuário através de suas PlatformRoles.
 *
 * A camada de domínio não conhece Prisma nem detalhes de banco.
 */
export abstract class PlatformAuthorizationRepository {
  /**
   * Verifica se o usuário possui uma determinada permissão
   * através de alguma PlatformRole ativa.
   */
  abstract userHasPermission(
    userId: string,
    permissionCode: string,
  ): Promise<boolean>;

  /**
   * Retorna todas as permissões globais efetivas do usuário.
   *
   * As permissões são derivadas das PlatformRoles ativas vinculadas
   * ao usuário.
   */
  abstract getUserPermissions(userId: string): Promise<string[]>;
}

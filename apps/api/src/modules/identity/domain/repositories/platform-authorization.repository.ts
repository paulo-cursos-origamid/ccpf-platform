/**
 * Contrato responsável por consultar as permissões globais
 * atribuídas a um usuário através de suas PlatformRoles.
 *
 * A camada de domínio não conhece Prisma nem detalhes de banco.
 */
export abstract class PlatformAuthorizationRepository {
  abstract userHasPermission(
    userId: string,
    permissionCode: string,
  ): Promise<boolean>;
}

/**
 * Resolve os usuários da plataforma que possuem determinada permissão.
 *
 * A implementação fica na infraestrutura para evitar que o domínio
 * Notifications dependa diretamente do módulo Identity.
 */
export abstract class NotificationRecipientRepository {
  abstract findUserIdsByPermission(permissionCode: string): Promise<string[]>;
}

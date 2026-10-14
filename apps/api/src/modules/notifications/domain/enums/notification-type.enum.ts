/**
 * Tipos de eventos que podem gerar uma notificação administrativa.
 *
 * Estes valores representam o domínio da aplicação e não dependem
 * diretamente dos enums gerados pelo Prisma.
 */
export enum NotificationType {
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_CHANGED = 'SUBSCRIPTION_CHANGED',
  TENANT_CREATED = 'TENANT_CREATED',
  TENANT_SUSPENDED = 'TENANT_SUSPENDED',
  USER_BLOCKED = 'USER_BLOCKED',
  USER_REMOVED = 'USER_REMOVED',
  SYSTEM = 'SYSTEM',
}

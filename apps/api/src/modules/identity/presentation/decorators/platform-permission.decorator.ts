import { SetMetadata } from '@nestjs/common';

/**
 * Metadata utilizada pelo PlatformPermissionGuard para identificar
 * qual permissão global da plataforma o endpoint exige.
 */
export const PLATFORM_PERMISSION_KEY = 'platform_permission';

export const RequirePlatformPermission = (permission: string) =>
  SetMetadata(PLATFORM_PERMISSION_KEY, permission);

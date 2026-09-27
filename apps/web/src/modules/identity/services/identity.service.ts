import { api } from "@/lib/api/client";

import type { ForgotPasswordDto } from "../types/forgot-password.dto";
import type { LoginDto } from "../types/login.dto";
import type { LoginResponseDto } from "../types/login-response.dto";
import type { RegisterDto } from "../types/register.dto";
import type { ResetPasswordDto } from "../types/reset-password.dto";
import type { VerifyEmailDto } from "../types/verify-email.dto";
import type { User } from "../types/user";

interface RefreshResponse {
  success: boolean;
}

// Centraliza as chamadas HTTP relacionadas à autenticação e identidade.
//
// Os endpoints de Identity não dependem de Tenant, pois o Tenant só é
// conhecido depois que o usuário está autenticado.
class IdentityService {
  // Login acontece antes da seleção do Tenant.
  login(dto: LoginDto) {
    return api.post<LoginResponseDto>("/identity/login", dto, {
      tenantAware: false,
    });
  }

  // Cadastro público.
//
// O endpoint de registro provisiona automaticamente:
// - User
// - Tenant
// - TenantMember como OWNER
// - Subscription em TRIALING
//
// Por ser um fluxo público, não depende de Tenant.
  register(dto: RegisterDto) {
    return api.post<User>("/identity/register", dto, {
      tenantAware: false,
    });
  }

  // Recupera o usuário autenticado sem exigir Tenant.
  me() {
    return api.get<User>("/identity/me", {
      tenantAware: false,
    });
  }

  // Logout encerra a sessão independentemente do Tenant ativo.
  logout() {
    return api.post<void>("/identity/logout", undefined, {
      tenantAware: false,
    });
  }

  // Refresh trabalha exclusivamente com os cookies de autenticação.
  refresh() {
    return api.post<RefreshResponse>("/identity/refresh", undefined, {
      tenantAware: false,
    });
  }

  // Recuperação de senha não depende de Tenant.
  forgotPassword(dto: ForgotPasswordDto) {
    return api.post<void>("/identity/forgot-password", dto, {
      tenantAware: false,
    });
  }

  // Redefinição de senha não depende de Tenant.
  resetPassword(dto: ResetPasswordDto) {
    return api.post<void>("/identity/reset-password", dto, {
      tenantAware: false,
    });
  }

  // Verificação de e-mail também não depende de Tenant.
  verifyEmail(dto: VerifyEmailDto) {
    return api.post<void>("/identity/verify-email", dto, {
      tenantAware: false,
    });
  }
}

export const identityService = new IdentityService();
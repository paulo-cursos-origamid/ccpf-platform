import { api } from "@/lib/api/client";

import type { ForgotPasswordDto } from "../types/forgot-password.dto";
import type { LoginDto } from "../types/login.dto";
import type { LoginResponseDto } from "../types/login-response.dto";
import type { RegisterDto } from "../types/register.dto";
import type { ResetPasswordDto } from "../types/reset-password.dto";
import type { User } from "../types/user";

interface RefreshResponse {
  success: boolean;
}

class IdentityService {
  login(dto: LoginDto) {
    return api.post<LoginResponseDto>("/identity/login", dto);
  }

  register(dto: RegisterDto) {
    return api.post<User>("/identity/users", dto);
  }

  me() {
    return api.get<User>("/identity/me");
  }

  logout() {
    return api.post<void>("/identity/logout");
  }

  refresh() {
    return api.post<RefreshResponse>("/identity/refresh");
  }

  forgotPassword(dto: ForgotPasswordDto) {
    return api.post<void>("/identity/forgot-password", dto);
  }

  resetPassword(dto: ResetPasswordDto) {
    return api.post<void>("/identity/reset-password", dto);
  }
}

export const identityService = new IdentityService();

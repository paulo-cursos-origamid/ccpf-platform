import { api } from "@/lib/api/client";

import type { LoginDto } from "../types/login.dto";
import type { LoginResponseDto } from "../types/login-response.dto";
import type { User } from "../types/user";
import { RegisterDto } from "../types/register.dto";

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
}


export const identityService = new IdentityService();

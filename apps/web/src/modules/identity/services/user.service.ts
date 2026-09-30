import { api } from "@/lib/api/client";

import type { ListUsersQuery, ListUsersResponse } from "../types/user-list";
import type { UpdateUserInput } from "../types/update-user";
import type { CreateUserDto } from "../types/create-user.dto";
import type { User } from "../types/user";

class UserService {
  /**
   * Lista os usuários administrados pelo contexto atual.
   */
  list(query: ListUsersQuery = {}) {
    const params = new URLSearchParams();

    if (query.page !== undefined) {
      params.set("page", String(query.page));
    }

    if (query.limit !== undefined) {
      params.set("limit", String(query.limit));
    }

    if (query.search?.trim()) {
      params.set("search", query.search.trim());
    }

    const queryString = params.toString();

    const path = queryString
      ? `/identity/users?${queryString}`
      : "/identity/users";

    return api.get<ListUsersResponse>(path);
  }

  /**
   * Cria um usuário através do fluxo administrativo.
   *
   * Diferente do cadastro público, este endpoint não deve
   * provisionar automaticamente Tenant, OWNER ou Subscription.
   */
  create(dto: CreateUserDto) {
    return api.post<User>("/identity/users", dto);
  }

  /**
   * Atualiza um usuário existente.
   */
  update(id: string, data: UpdateUserInput) {
    return api.patch<ListUsersResponse["users"][number]>(
      `/identity/users/${id}`,
      data,
    );
  }

  /**
   * Remove/desativa um usuário através do fluxo administrativo.
   */
  delete(id: string) {
    return api.delete<void>(`/identity/users/${id}`);
  }
}

export const userService = new UserService();
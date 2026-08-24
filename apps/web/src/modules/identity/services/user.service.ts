import { api } from "@/lib/api/client";

import type { ListUsersQuery, ListUsersResponse } from "../types/user-list";
import type { UpdateUserInput } from "../types/update-user";

class UserService {
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
  update(id: string, data: UpdateUserInput) {
    return api.patch<ListUsersResponse["users"][number]>(
      `/identity/users/${id}`,
      data,
    );
  }
}

export const userService = new UserService();

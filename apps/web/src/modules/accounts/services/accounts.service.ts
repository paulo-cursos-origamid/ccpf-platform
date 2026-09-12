import { api } from "@/lib/api/client";

import type {
  Account,
  AccountMemberRole,
  AccountType,
} from "../types";

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
}

export interface AddAccountMemberInput {
  userId: string;
  role: AccountMemberRole;
}

interface AddAccountMemberResponse {
  message: string;
}

class AccountsService {
  list() {
    return api.get<Account[]>("/accounts");
  }

  get(id: string) {
    return api.get<Account>(`/accounts/${id}`);
  }

  create(data: CreateAccountInput) {
    return api.post<Account>("/accounts", data);
  }

  addMember(accountId: string, data: AddAccountMemberInput) {
    return api.post<AddAccountMemberResponse>(
      `/accounts/${accountId}/members`,
      data,
    );
  }
}

export const accountsService = new AccountsService();

import { api } from "@/lib/api/client";

import type {
  Account,
  AccountMember,
  AccountMemberRole,
  AccountType,
} from "../types";

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
}
export interface UpdateAccountInput {
  name: string;
  type: AccountType;
}
export interface AddAccountMemberInput {
  userId: string;
  role: AccountMemberRole;
}

export interface UpdateAccountMemberRoleInput {
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
  update(id: string, data: UpdateAccountInput) {
    return api.patch<Account>(`/accounts/${id}`, data);
  }
  listMembers(accountId: string) {
    return api.get<AccountMember[]>(`/accounts/${accountId}/members`);
  }

  listAvailableUsers(accountId: string) {
    return api.get<Array<{ id: string; name: string; email: string }>>(
      `/accounts/${accountId}/available-users`,
    );
  }

  addMember(accountId: string, data: AddAccountMemberInput) {
    return api.post<AddAccountMemberResponse>(
      `/accounts/${accountId}/members`,
      data,
    );
  }

  updateMemberRole(
    accountId: string,
    memberId: string,
    data: UpdateAccountMemberRoleInput,
  ) {
    return api.patch<AddAccountMemberResponse>(
      `/accounts/${accountId}/members/${memberId}`,
      data,
    );
  }

  blockMember(accountId: string, memberId: string) {
    return api.post<AddAccountMemberResponse>(
      `/accounts/${accountId}/members/${memberId}/block`,
    );
  }

  unblockMember(accountId: string, memberId: string) {
    return api.post<AddAccountMemberResponse>(
      `/accounts/${accountId}/members/${memberId}/unblock`,
    );
  }
}

export const accountsService = new AccountsService();

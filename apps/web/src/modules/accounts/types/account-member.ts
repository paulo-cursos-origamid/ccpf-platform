import type { AccountMemberRole } from "./account-member-role";

export interface AccountMember {
  id: string;
  accountId: string;
  userId: string;
  role: AccountMemberRole;
  createdAt: string;
  updatedAt: string;
}

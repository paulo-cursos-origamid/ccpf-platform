import type { AccountMemberRole } from "./account-member-role";
import type { AccountMemberStatus } from "./account-member-status";

export interface AccountMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: AccountMemberRole;
  status: AccountMemberStatus;
  createdAt: string;
  updatedAt: string;
}

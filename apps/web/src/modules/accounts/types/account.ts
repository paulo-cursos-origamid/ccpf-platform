import type { AccountStatus } from "./account-status";
import type { AccountType } from "./account-type";
import type { AccountMemberRole } from "./account-member-role";

export interface Account {
  id: string;
  name: string;
  role: AccountMemberRole;
  type: AccountType;
  currency: string;
  initialBalance: number;
  balance: number;
  status: AccountStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

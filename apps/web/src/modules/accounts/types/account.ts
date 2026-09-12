import type { AccountStatus } from "./account-status";
import type { AccountType } from "./account-type";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  balance: number;
  status: AccountStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

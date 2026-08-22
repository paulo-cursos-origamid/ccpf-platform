import { UserRole } from "./user-list";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

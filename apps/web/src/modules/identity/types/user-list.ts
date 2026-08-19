export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  SUPPORT = "SUPPORT",
}
export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListUsersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListUsersResponse {
  users: UserListItem[];
  pagination: ListUsersPagination;
}

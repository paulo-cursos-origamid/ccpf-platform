import { UserEntity } from '../entities/user.entity';

export interface FindUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface FindUsersResult {
  users: UserEntity[];
  total: number;
}

export abstract class UserRepository {
  abstract create(user: UserEntity): Promise<UserEntity>;

  abstract findByEmail(email: string): Promise<UserEntity | null>;

  abstract findById(id: string): Promise<UserEntity | null>;

  abstract findByVerificationToken(token: string): Promise<UserEntity | null>;

  abstract findByPasswordResetToken(token: string): Promise<UserEntity | null>;

  abstract findMany(options?: FindUsersOptions): Promise<FindUsersResult>;

  abstract update(user: UserEntity): Promise<UserEntity>;

  abstract softDelete(id: string): Promise<void>;
}

import { UserRole } from '../entities/user.entity';

export abstract class TokenProviderContract {
  abstract generateAccessToken(
    userId: string,
    email: string,
    roles: UserRole,
  ): Promise<string>;

  abstract generateRefreshToken(userId: string): Promise<string>;

  abstract verifyRefreshToken(token: string): Promise<{
    sub: string;
  }>;
}

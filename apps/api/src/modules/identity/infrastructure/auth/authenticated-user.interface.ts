import { UserRole } from '../../domain/entities/user.entity';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: UserRole;
}

import { UserRole } from '../../domain/entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

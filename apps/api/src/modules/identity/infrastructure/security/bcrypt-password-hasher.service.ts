import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PasswordHasherContract } from '../../domain/contracts/password-hasher.contract';

@Injectable()
export class BcryptPasswordHasherService implements PasswordHasherContract {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    if (
      typeof password !== 'string' ||
      password.length === 0 ||
      typeof hash !== 'string' ||
      hash.length === 0
    ) {
      return false;
    }

    try {
      return await bcrypt.compare(password, hash);
    } catch {
      // Hash inválido ou incompatível deve resultar em falha de autenticação.
      return false;
    }
  }
}

import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PasswordHasherContract } from '../../domain/contracts/password-hasher.contract';

@Injectable()
export class BcryptPasswordHasherService implements PasswordHasherContract {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

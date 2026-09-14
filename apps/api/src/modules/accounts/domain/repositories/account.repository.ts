import { AccountEntity } from '../entities/account.entity';

export abstract class AccountRepository {
  abstract create(account: AccountEntity): Promise<AccountEntity>;

  abstract findById(id: string): Promise<AccountEntity | null>;

  abstract update(account: AccountEntity): Promise<AccountEntity>;
}

import { AccountMemberEntity } from '../entities/account-member.entity';

export abstract class AccountMemberRepository {
  abstract create(member: AccountMemberEntity): Promise<AccountMemberEntity>;
  abstract update(member: AccountMemberEntity): Promise<AccountMemberEntity>;
  abstract delete(member: AccountMemberEntity): Promise<void>;

  abstract findByAccountIdAndUserId(
    accountId: string,
    userId: string,
  ): Promise<AccountMemberEntity | null>;

  abstract findManyByAccountId(
    accountId: string,
  ): Promise<AccountMemberEntity[]>;

  abstract findManyByUserId(userId: string): Promise<AccountMemberEntity[]>;
}

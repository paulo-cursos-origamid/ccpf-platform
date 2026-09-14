import { AccountMemberRole } from '../../domain/enums/account-member-role.enum';

export class AddAccountMemberDto {
  userId!: string;
  role!: AccountMemberRole;
}

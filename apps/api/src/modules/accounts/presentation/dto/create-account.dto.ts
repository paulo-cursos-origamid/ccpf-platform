import { AccountType } from '../../domain/enums/account-type.enum';

export class CreateAccountDto {
  name!: string;
  type!: AccountType;
  currency!: string;
  initialBalance!: number;
}

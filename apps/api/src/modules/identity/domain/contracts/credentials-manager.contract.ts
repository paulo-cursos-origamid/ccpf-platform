export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export abstract class CredentialsManagerContract {
  abstract changePassword(input: ChangePasswordInput): Promise<void>;
}

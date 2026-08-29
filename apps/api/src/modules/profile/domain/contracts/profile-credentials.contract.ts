export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export abstract class ProfileCredentialsContract {
  abstract changePassword(
    userId: string,
    data: ChangePasswordData,
  ): Promise<void>;
}

export interface PasswordResetNotification {
  email: string;
  token: string;
  resetUrl: string;
}

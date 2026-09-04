import { PasswordResetNotification } from './password-reset-notification.contract';

export abstract class PasswordResetNotifierContract {
  abstract notify(notification: PasswordResetNotification): Promise<void>;
}

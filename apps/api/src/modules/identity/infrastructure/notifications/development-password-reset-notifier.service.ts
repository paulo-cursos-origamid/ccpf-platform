import { Injectable, Logger } from '@nestjs/common';

import { PasswordResetNotifierContract } from '../../domain/contracts/password-reset-notifier.contract';
import { PasswordResetNotification } from '../../domain/contracts/password-reset-notification.contract';

@Injectable()
export class DevelopmentPasswordResetNotifier extends PasswordResetNotifierContract {
  private readonly logger = new Logger(DevelopmentPasswordResetNotifier.name);

  notify(notification: PasswordResetNotification): Promise<void> {
    this.logger.debug(`Password reset URL: ${notification.resetUrl}`);

    return Promise.resolve();
  }
}

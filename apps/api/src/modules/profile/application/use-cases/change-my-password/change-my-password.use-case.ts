import { Injectable } from '@nestjs/common';

import {
  ChangePasswordData,
  ProfileCredentialsContract,
} from '../../../domain/contracts/profile-credentials.contract';

export interface ChangeMyPasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class ChangeMyPasswordUseCase {
  constructor(private readonly credentials: ProfileCredentialsContract) {}

  async execute(input: ChangeMyPasswordInput): Promise<void> {
    const data: ChangePasswordData = {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    };

    await this.credentials.changePassword(input.userId, data);
  }
}

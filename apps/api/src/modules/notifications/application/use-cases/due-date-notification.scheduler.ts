import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { ProcessDueDateNotificationsUseCase } from './process-due-date-notifications.use-case';

@Injectable()
export class DueDateNotificationScheduler {
  private readonly logger = new Logger(DueDateNotificationScheduler.name);
  constructor(
    private readonly processDueDateNotifications: ProcessDueDateNotificationsUseCase,
  ) {}

  @Cron('* * * * *', { timeZone: 'America/Sao_Paulo' })
  async execute(): Promise<void> {
    this.logger.log('Iniciando verificação de vencimentos.');
    try {
      await this.processDueDateNotifications.execute();
      this.logger.log('Verificação de vencimentos concluída.');
    } catch (error) {
      this.logger.error('Falha na verificação de vencimentos.', error instanceof Error ? error.stack : String(error));
    }
  }
}

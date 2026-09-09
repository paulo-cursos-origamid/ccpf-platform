import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import { PasswordResetNotifierContract } from '../../domain/contracts/password-reset-notifier.contract';
import { PasswordResetNotification } from '../../domain/contracts/password-reset-notification.contract';

@Injectable()
export class SmtpPasswordResetNotifier extends PasswordResetNotifierContract {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    super();

    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('SMTP_HOST'),
      port: this.configService.getOrThrow<number>('SMTP_PORT'),
      secure: false,
      auth: this.getAuthentication(),
    });
  }

  async notify(notification: PasswordResetNotification): Promise<void> {
    const from = this.configService.getOrThrow<string>('MAIL_FROM');
    const fromName = this.configService.getOrThrow<string>('MAIL_FROM_NAME');

    await this.transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to: notification.email,
      subject: 'Redefinição de senha - CCPF',
      text: this.buildText(notification),
      html: this.buildHtml(notification),
    });
  }

  private getAuthentication():
    | {
        user: string;
        pass: string;
      }
    | undefined {
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');

    if (!user || !pass) {
      return undefined;
    }

    return {
      user,
      pass,
    };
  }

  private buildText(notification: PasswordResetNotification): string {
    return [
      'Olá!',
      '',
      'Recebemos uma solicitação para redefinir sua senha no CCPF.',
      '',
      `Acesse o link para criar uma nova senha: ${notification.resetUrl}`,
      '',
      'Este link é válido por 1 hora.',
      '',
      'Se você não solicitou esta alteração, ignore este e-mail.',
      '',
      'CCPF - Centro de Controle Pessoal Financeiro',
    ].join('\n');
  }

  private buildHtml(notification: PasswordResetNotification): string {
    return `
      <h2>Redefinição de senha</h2>

      <p>Olá!</p>

      <p>
        Recebemos uma solicitação para redefinir sua senha no CCPF.
      </p>

      <p>
        <a href="${notification.resetUrl}">
          Redefinir minha senha
        </a>
      </p>

      <p>
        Este link é válido por 1 hora.
      </p>

      <p>
        Se você não solicitou esta alteração, ignore este e-mail.
      </p>

      <p>
        CCPF - Centro de Controle Pessoal Financeiro
      </p>
    `;
  }
}

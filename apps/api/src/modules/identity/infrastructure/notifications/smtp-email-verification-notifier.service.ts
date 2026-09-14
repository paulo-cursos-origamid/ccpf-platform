import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import { EmailVerificationNotifierContract } from '../../domain/contracts/email-verification-notifier.contract';

@Injectable()
export class SmtpEmailVerificationNotifier implements EmailVerificationNotifierContract {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('SMTP_HOST'),
      port: this.configService.getOrThrow<number>('SMTP_PORT'),
      secure: false,
      auth: this.getAuthentication(),
    });
  }

  async sendVerificationEmail(input: {
    email: string;
    name: string;
    verificationToken: string;
  }): Promise<void> {
    const from = this.configService.getOrThrow<string>('MAIL_FROM');
    const fromName = this.configService.getOrThrow<string>('MAIL_FROM_NAME');
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

    const verificationUrl = `${frontendUrl}/check-email?token=${encodeURIComponent(input.verificationToken)}`;

    await this.transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to: input.email,
      subject: 'Verifique seu e-mail - CCPF',
      text: this.buildText(input.name, verificationUrl),
      html: this.buildHtml(input.name, verificationUrl),
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

  private buildText(name: string, verificationUrl: string): string {
    return [
      `Olá, ${name}!`,
      '',
      'Sua conta no CCPF foi criada com sucesso.',
      '',
      'Para confirmar seu endereço de e-mail, acesse o link abaixo:',
      '',
      verificationUrl,
      '',
      'Este link é válido por 24 horas.',
      '',
      'Se você não criou esta conta, ignore este e-mail.',
      '',
      'CCPF - Centro de Controle Pessoal Financeiro',
    ].join('\n');
  }

  private buildHtml(name: string, verificationUrl: string): string {
    return `
      <h2>Verifique seu e-mail</h2>

      <p>Olá, ${name}!</p>

      <p>
        Sua conta no CCPF foi criada com sucesso.
      </p>

      <p>
        Para confirmar seu endereço de e-mail, clique no botão abaixo:
      </p>

      <p>
        <a href="${verificationUrl}">
          Verificar meu e-mail
        </a>
      </p>

      <p>
        Este link é válido por 24 horas.
      </p>

      <p>
        Se você não criou esta conta, ignore este e-mail.
      </p>

      <p>
        CCPF - Centro de Controle Pessoal Financeiro
      </p>
    `;
  }
}

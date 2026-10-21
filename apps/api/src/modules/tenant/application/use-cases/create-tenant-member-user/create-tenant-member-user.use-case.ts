import { randomUUID } from 'node:crypto';

import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { EmailVerificationNotifierContract } from '../../../../identity/domain/contracts/email-verification-notifier.contract';
import { PasswordHasherContract } from '../../../../identity/domain/contracts/password-hasher.contract';
import { TenantRole } from '../../../domain/enums/tenant-role.enum';
import { TenantPlanLimitsRepository } from '../../../domain/repositories/tenant-plan-limits.repository';
import { TenantMemberRepository } from '../../../domain/repositories/tenant-member.repository';
import { TenantMemberStatus } from '../../../domain/enums/tenant-member-status.enum';

export interface CreateTenantMemberUserInput {
  tenantId: string;
  userId: string;
  name: string;
  email: string;
  password: string;
  role: Exclude<TenantRole, 'OWNER'>;
}

export interface CreateTenantMemberUserOutput {
  id: string;
  name: string;
  email: string;
  role: Exclude<TenantRole, 'OWNER'>;
  origin: 'TENANT_CREATED';
}

@Injectable()
export class CreateTenantMemberUserUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPlanLimitsRepository: TenantPlanLimitsRepository,
    private readonly tenantMemberRepository: TenantMemberRepository,
    @Inject(PasswordHasherContract)
    private readonly passwordHasher: PasswordHasherContract,
    @Inject(EmailVerificationNotifierContract)
    private readonly emailVerificationNotifier: EmailVerificationNotifierContract,
  ) {}

  async execute(
    input: CreateTenantMemberUserInput,
  ): Promise<CreateTenantMemberUserOutput> {
    const currentMember =
      await this.tenantMemberRepository.findByTenantAndUser(
        input.tenantId,
        input.userId,
      );

    if (
      !currentMember ||
      currentMember.status !== TenantMemberStatus.ACTIVE ||
      (currentMember.role !== TenantRole.OWNER &&
        currentMember.role !== TenantRole.ADMIN) ||
      currentMember.origin === 'TENANT_CREATED'
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para criar usuários neste Tenant.',
      );
    }

    const email = input.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException(
        'Este e-mail já possui cadastro. Selecione o usuário existente.',
      );
    }

    const maxUsers =
      await this.tenantPlanLimitsRepository.findMaxUsersByTenant(
        input.tenantId,
      );

    if (maxUsers === null) {
      throw new ForbiddenException(
        'O Tenant não possui uma assinatura ativa ou em período de teste.',
      );
    }


    const passwordHash = await this.passwordHasher.hash(input.password);
    const verificationToken = randomUUID();
    const verificationTokenExpiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24,
    );

    let created: { id: string; name: string; email: string } | undefined;

    // A contagem e a criação do vínculo precisam participar da mesma
    // transação serializável para evitar ultrapassar o limite por concorrência.
    // Conflitos de serialização do PostgreSQL são repetidos até três vezes.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        created = await this.prisma.$transaction(
          async (tx) => {
            if (maxUsers !== -1) {
              const currentUsers = await tx.tenantMember.count({
                where: {
                  tenantId: input.tenantId,
                  status: { not: 'REMOVED' },
                },
              });

              if (currentUsers >= maxUsers) {
                throw new ForbiddenException(
                  'O limite de usuários do plano foi atingido.',
                );
              }
            }

            const user = await tx.user.create({
              data: {
                name: input.name.trim(),
                email,
                password: passwordHash,
                role: 'USER',
                isActive: true,
                emailVerified: false,
                verificationToken,
                verificationTokenExpiresAt,
              },
              select: { id: true, name: true, email: true },
            });

            await tx.tenantMember.create({
              data: {
                tenantId: input.tenantId,
                userId: user.id,
                role: input.role,
                status: 'ACTIVE',
                origin: 'TENANT_CREATED',
              },
            });

            return user;
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        break;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034'
        ) {
          if (attempt < 2) {
            continue;
          }

          throw new ConflictException(
            'Não foi possível concluir o cadastro devido a uma operação concorrente. Tente novamente.',
          );
        }

        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'Este e-mail já possui cadastro ou o vínculo já existe.',
          );
        }

        throw error;
      }
    }

    if (!created) {
      throw new ConflictException(
        'Não foi possível concluir a criação do usuário. Tente novamente.',
      );
    }

    // A criação já foi confirmada no banco. O envio de e-mail acontece
    // depois do commit, evitando manter uma transação aberta durante SMTP.
    try {
      await this.emailVerificationNotifier.sendVerificationEmail({
        email: created.email,
        name: created.name,
        verificationToken,
      });
    } catch {
      // O cadastro e o vínculo permanecem válidos mesmo se o SMTP falhar.
      // O envio pode ser reenviado pelo fluxo de verificação de e-mail.
    }

    return {
      ...created,
      role: input.role,
      origin: 'TENANT_CREATED',
    };
  }
}

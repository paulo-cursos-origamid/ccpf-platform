import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../identity/infrastructure/auth';
import { JwtAuthGuard } from '../../identity/infrastructure/auth/jwt-auth.guard';
import { RequirePlatformPermission } from '../../identity/presentation/decorators/platform-permission.decorator';
import { PlatformPermissionGuard } from '../../identity/presentation/guards/platform-permission.guard';
import { ReverseTransactionUseCase } from '../application/reverse-transaction.use-case';
import { ReverseTransferUseCase } from '../application/reverse-transfer.use-case';

@ApiTags('Platform Admin - Estornos Financeiros')
@ApiBearerAuth('access-token')
@Controller('platform-admin/financial-reversals/tenants/:tenantId')
@UseGuards(JwtAuthGuard, PlatformPermissionGuard)
@RequirePlatformPermission('FINANCIAL_REVERSALS_MANAGE')
export class FinancialReversalsController {
  constructor(
    private readonly reverseTransaction: ReverseTransactionUseCase,
    private readonly reverseTransfer: ReverseTransferUseCase,
  ) {}

  @Post('transactions/:id')
  @ApiOperation({
    summary: 'Estornar uma transação financeira de um Espaço',
  })
  reverseTransactionOperation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.reverseTransaction.execute({
      id,
      tenantId,
      userId: user.sub,
    });
  }

  @Post('transfers/:id')
  @ApiOperation({
    summary: 'Estornar uma transferência financeira de um Espaço',
  })
  reverseTransferOperation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.reverseTransfer.execute({
      id,
      tenantId,
      userId: user.sub,
    });
  }
}

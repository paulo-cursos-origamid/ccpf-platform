import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import type { AuthenticatedUser } from '../../../identity/infrastructure/auth';
import { CountUnreadNotificationsUseCase } from '../../application/use-cases/count-unread-notifications.use-case';
import { ListNotificationsUseCase } from '../../application/use-cases/list-notifications.use-case';
import { MarkAllNotificationsAsReadUseCase } from '../../application/use-cases/mark-all-notifications-as-read.use-case';
import { MarkNotificationAsReadUseCase } from '../../application/use-cases/mark-notification-as-read.use-case';
import { ListNotificationsQueryDto } from '../dto/list-notifications-query.dto';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

/**
 * API da central de notificações.
 *
 * Todas as operações são limitadas ao usuário autenticado.
 * O destinatário nunca é recebido pelo body/query.
 */
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
    private readonly countUnreadNotificationsUseCase: CountUnreadNotificationsUseCase,
    private readonly markNotificationAsReadUseCase: MarkNotificationAsReadUseCase,
    private readonly markAllNotificationsAsReadUseCase: MarkAllNotificationsAsReadUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista as notificações do usuário autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificações retornadas com paginação.',
  })
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListNotificationsQueryDto,
  ) {
    const user = this.getAuthenticatedUser(request);

    return this.listNotificationsUseCase.execute({
      userId: user.sub,
      page: query.page,
      limit: query.limit,
      unreadOnly: query.unreadOnly,
      type: query.type,
    });
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Retorna a quantidade de notificações não lidas',
  })
  @ApiResponse({
    status: 200,
    description: 'Quantidade de notificações não lidas.',
  })
  async unreadCount(@Req() request: AuthenticatedRequest) {
    const user = this.getAuthenticatedUser(request);

    return this.countUnreadNotificationsUseCase.execute(user.sub);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Marca todas as notificações como lidas',
  })
  @ApiResponse({
    status: 200,
    description: 'Quantidade de notificações atualizadas.',
  })
  async readAll(@Req() request: AuthenticatedRequest) {
    const user = this.getAuthenticatedUser(request);

    return this.markAllNotificationsAsReadUseCase.execute(user.sub);
  }

  @Patch(':notificationId/read')
  @ApiOperation({
    summary: 'Marca uma notificação específica como lida',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificação marcada como lida.',
  })
  @ApiResponse({
    status: 404,
    description: 'Notificação não encontrada.',
  })
  async read(
    @Req() request: AuthenticatedRequest,
    @Param('notificationId') notificationId: string,
  ) {
    const user = this.getAuthenticatedUser(request);

    return this.markNotificationAsReadUseCase.execute(notificationId, user.sub);
  }

  private getAuthenticatedUser(
    request: AuthenticatedRequest,
  ): AuthenticatedUser {
    if (!request.user?.sub) {
      throw new UnauthorizedException();
    }

    return request.user;
  }
}

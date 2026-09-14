import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { GetMyProfileUseCase } from '../../application/use-cases/get-my-profile/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from '../../application/use-cases/update-my-profile/update-my-profile.use-case';
import { ChangeMyPasswordUseCase } from '../../application/use-cases/change-my-password/change-my-password.use-case';

import { UpdateMyProfileDto } from '../dto/update-my-profile.dto';
import { ChangeMyPasswordDto } from '../dto/change-my-password.dto';

import {
  CurrentUser,
  type AuthenticatedUser,
  JwtAuthGuard,
} from '../../../identity/infrastructure/auth';

/**
 * Controller responsável pelos endpoints do perfil
 * do usuário autenticado.
 *
 * A autenticação é aplicada no controller inteiro através
 * do JwtAuthGuard. O Swagger apenas documenta essa exigência;
 * não implementa nenhuma regra de autorização.
 */
@ApiTags('Profile')
@ApiBearerAuth('access-token')
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly getMyProfileUseCase: GetMyProfileUseCase,
    private readonly updateMyProfileUseCase: UpdateMyProfileUseCase,
    private readonly changeMyPasswordUseCase: ChangeMyPasswordUseCase,
  ) {}

  /**
   * Retorna os dados do perfil do usuário autenticado.
   */
  @Get()
  @ApiOperation({
    summary: 'Obter meu perfil',
    description:
      'Retorna os dados do perfil do usuário autenticado através do JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil retornado com sucesso.',
    schema: {
      example: {
        id: 'cuid-user-id',
        name: 'Paulo',
        email: 'paulo@example.com',
        role: 'USER',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso ausente, inválido ou expirado.',
  })
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.getMyProfileUseCase.execute({
      userId: user.sub,
    });
  }

  /**
   * Atualiza os dados básicos do perfil do usuário autenticado.
   */
  @Patch()
  @ApiOperation({
    summary: 'Atualizar meu perfil',
    description:
      'Atualiza nome e/ou e-mail do usuário autenticado. Os campos são opcionais.',
  })
  @ApiBody({
    type: UpdateMyProfileDto,
    examples: {
      updateName: {
        summary: 'Atualizar nome',
        value: {
          name: 'Paulo Silva',
        },
      },
      updateEmail: {
        summary: 'Atualizar e-mail',
        value: {
          email: 'paulo.silva@example.com',
        },
      },
      updateBoth: {
        summary: 'Atualizar nome e e-mail',
        value: {
          name: 'Paulo Silva',
          email: 'paulo.silva@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso.',
    schema: {
      example: {
        id: 'cuid-user-id',
        name: 'Paulo Silva',
        email: 'paulo.silva@example.com',
        role: 'USER',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados enviados são inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso ausente, inválido ou expirado.',
  })
  @ApiResponse({
    status: 409,
    description: 'O e-mail informado já está sendo utilizado.',
  })
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.updateMyProfileUseCase.execute({
      userId: user.sub,
      name: dto.name,
      email: dto.email,
    });
  }

  /**
   * Altera a senha do usuário autenticado.
   */
  @Patch('password')
  @ApiOperation({
    summary: 'Alterar minha senha',
    description:
      'Altera a senha do usuário autenticado mediante confirmação da senha atual.',
  })
  @ApiBody({
    type: ChangeMyPasswordDto,
    examples: {
      changePassword: {
        summary: 'Alterar senha',
        value: {
          currentPassword: 'senha-atual',
          newPassword: 'nova-senha',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso.',
    schema: {
      example: {
        message: 'Password changed successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados enviados são inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou senha atual incorreta.',
  })
  async changeMyPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangeMyPasswordDto,
  ) {
    await this.changeMyPasswordUseCase.execute({
      userId: user.sub,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });

    return {
      message: 'Password changed successfully',
    };
  }
}

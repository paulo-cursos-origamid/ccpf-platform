import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { Request, Response } from 'express';

import { CreateUserUseCase } from '../../application/use-cases/create-user/create-user.use-case';
import { CreatePublicUserUseCase } from '../../application/use-cases/create-public-user/create-public-user.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user/delete-user.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password/forgot-password.use-case';
import { GetProfileUseCase } from '../../application/use-cases/get-profile/get-profile.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users/list-users.use-case';
import { LoginUseCase } from '../../application/use-cases/login/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout/logout.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token/refresh-token.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password/reset-password.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user/update-user.use-case';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email/verify-email.use-case';

import { CurrentUser, type AuthenticatedUser } from '../../infrastructure/auth';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';

import { CreateUserDto } from '../dto/create-user.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { LoginDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';

interface RefreshRequest extends Request {
  cookies: {
    refresh_token?: string;
  };
}

/**
 * Controller responsável pela entrada HTTP dos recursos de identidade.
 *
 * Responsabilidades:
 * - Receber e validar as requisições relacionadas à identidade.
 * - Encaminhar as operações para os respectivos Use Cases.
 * - Aplicar autenticação e autorização através dos Guards.
 * - Configurar cookies de autenticação.
 * - Expor a documentação OpenAPI dos endpoints de Identity.
 *
 * A regra de negócio permanece nos Use Cases e no domínio.
 */
import { RequirePlatformPermission } from '../decorators/platform-permission.decorator';
import { PlatformPermissionGuard } from '../guards/platform-permission.guard';
@ApiTags('Identity')
@Controller('identity')
export class IdentityController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly createPublicUserUseCase: CreatePublicUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  /**
   * Cria um novo usuário.
   */
  @Post('users')
  @ApiOperation({
    summary: 'Criar usuário',
    description:
      'Cria um novo usuário e inicia o processo de verificação de e-mail.',
  })
  @ApiBody({
    type: CreateUserDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso.',
    schema: {
      example: {
        id: 'c8d7f9d7-3d6e-4c0f-9b7f-123456789abc',
        name: 'João da Silva',
        email: 'joao@example.com',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'O e-mail informado já está cadastrado.',
  })
  async create(@Body() dto: CreateUserDto) {
    return this.createUserUseCase.execute({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });
  }

  /**
   * Realiza o cadastro público de um novo cliente SaaS.
   *
   * O fluxo provisiona User, Tenant, OWNER e Subscription TRIALING
   * em uma única transação.
   */
  @Post('register')
  @ApiOperation({
    summary: 'Realizar cadastro público',
    description:
      'Cria o usuário, seu Tenant, o vínculo como OWNER e uma assinatura TRIALING de 14 dias.',
  })
  @ApiBody({
    type: CreateUserDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Cadastro realizado com sucesso.',
    schema: {
      example: {
        id: 'c8d7f9d7-3d6e-4c0f-9b7f-123456789abc',
        name: 'João da Silva',
        email: 'joao@example.com',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'O e-mail informado já está cadastrado.',
  })
  async register(@Body() dto: CreateUserDto) {
    return this.createPublicUserUseCase.execute({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });
  }

  /**
   * Lista usuários com paginação e busca.
   *
   * Acesso restrito a administradores autenticados.
   */
  @Get('users')
  @UseGuards(JwtAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission('USERS_READ')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Listar usuários',
    description:
      'Retorna usuários paginados. O endpoint exige autenticação JWT e a permissão global USERS_READ.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    minimum: 1,
    description: 'Número da página.',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    minimum: 1,
    maximum: 100,
    description: 'Quantidade de registros por página.',
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Termo utilizado para buscar usuários.',
    example: 'joao',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso.',
    schema: {
      example: {
        users: [
          {
            id: 'c8d7f9d7-3d6e-4c0f-9b7f-123456789abc',
            name: 'João da Silva',
            email: 'joao@example.com',
            role: 'USER',
            isActive: true,
            emailVerified: true,
            createdAt: '2026-09-13T20:00:00.000Z',
            updatedAt: '2026-09-13T20:00:00.000Z',
            lastLoginAt: '2026-09-13T21:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário autenticado sem a permissão global USERS_READ.',
  })
  async listUsers(@Query() query: ListUsersQueryDto) {
    return this.listUsersUseCase.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
  }

  /**
   * Solicita a recuperação de senha.
   *
   * A resposta é intencionalmente genérica para não revelar
   * se o endereço de e-mail está cadastrado.
   */
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Solicitar recuperação de senha',
    description:
      'Inicia o fluxo de recuperação de senha. A resposta é genérica para evitar enumeração de usuários.',
  })
  @ApiBody({
    type: ForgotPasswordDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitação processada.',
    schema: {
      example: {
        message:
          'Se o e-mail estiver cadastrado, você receberá instruções para redefinir suasenha.',
      },
    },
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.forgotPasswordUseCase.execute({
      email: dto.email,
    });
  }

  /**
   * Redefine a senha utilizando o token recebido no fluxo de recuperação.
   */
  @Post('reset-password')
  @ApiOperation({
    summary: 'Redefinir senha',
    description:
      'Redefine a senha utilizando um token válido de recuperação de senha.',
  })
  @ApiBody({
    type: ResetPasswordDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Senha redefinida com sucesso.',
    schema: {
      example: {
        message: 'Password reset successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido ou expirado.',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute({
      token: dto.token,
      newPassword: dto.newPassword,
    });
  }

  /**
   * Autentica um usuário.
   *
   * Os tokens de acesso e refresh são armazenados em cookies httpOnly.
   */
  @Post('login')
  @ApiOperation({
    summary: 'Autenticar usuário',
    description:
      'Autentica o usuário e cria os cookies httpOnly access_token e refresh_token.',
  })
  @ApiBody({
    type: LoginDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário autenticado com sucesso.',
    schema: {
      example: {
        user: {
          id: 'c8d7f9d7-3d6e-4c0f-9b7f-123456789abc',
          name: 'João da Silva',
          email: 'joao@example.com',
          role: 'USER',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas ou e-mail ainda não verificado.',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
    });

    response.cookie('access_token', result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    return {
      user: result.user,
    };
  }

  /**
   * Atualiza os dados de um usuário.
   *
   * Acesso restrito a administradores autenticados.
   */
  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission('USERS_UPDATE')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Atualizar usuário',
    description:
      'Atualiza os dados de um usuário. O endpoint exige autenticação JWT e a permissão global USERS_UPDATE.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID do usuário que será atualizado.',
    example: 'c8d7f9d7-3d6e-4c0f-9b7f-123456789abc',
  })
  @ApiBody({
    type: UpdateUserDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado com sucesso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário autenticado sem permissão ADMIN.',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado.',
  })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.updateUserUseCase.execute({
      id,
      name: dto.name,
      email: dto.email,
      role: dto.role,
      isActive: dto.isActive,
    });
  }

  /**
   * Remove logicamente um usuário.
   *
   * Acesso restrito a administradores autenticados.
   */
  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission('USERS_DELETE')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Excluir usuário',
    description:
      'Executa a exclusão lógica de um usuário. O endpoint exige autenticação JWT e a permissão global USERS_DELETE.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID do usuário que será excluído.',
    example: 'c8d7f9d7-3d6e-4c0f-9b7f-123456789abc',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário excluído com sucesso.',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário autenticado sem permissão ADMIN.',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado.',
  })
  async deleteUser(@Param('id') id: string) {
    await this.deleteUserUseCase.execute(id);

    return {
      success: true,
    };
  }

  /**
   * Retorna os dados do usuário autenticado.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Obter usuário autenticado',
    description: 'Retorna os dados do usuário associado ao JWT atual.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados do usuário retornados com sucesso.',
    schema: {
      example: {
        id: 'c8d7f9d7-3d6e-4c0f-9b7f-123456789abc',
        name: 'João da Silva',
        email: 'joao@example.com',
        role: 'USER',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado.',
  })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.getProfileUseCase.execute({
      userId: user.sub,
    });
  }

  /**
   * Verifica o endereço de e-mail utilizando o token enviado
   * durante o cadastro.
   */
  @Post('verify-email')
  @ApiOperation({
    summary: 'Verificar e-mail',
    description:
      'Valida o token de verificação enviado ao usuário durante o cadastro.',
  })
  @ApiBody({
    type: VerifyEmailDto,
  })
  @ApiResponse({
    status: 201,
    description: 'E-mail verificado com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Token de verificação inválido ou expirado.',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.verifyEmailUseCase.execute({
      token: dto.token,
    });
  }

  /**
   * Renova os tokens de autenticação utilizando o refresh_token
   * armazenado em cookie httpOnly.
   */
  @Post('refresh')
  @ApiOperation({
    summary: 'Renovar tokens',
    description:
      'Gera novos tokens utilizando o refresh_token armazenado no cookie httpOnly.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tokens renovados com sucesso.',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token ausente ou inválido.',
  })
  async refresh(
    @Req() req: RefreshRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.refreshTokenUseCase.execute({
      refreshToken,
    });

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 15,
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return {
      success: true,
    };
  }

  /**
   * Encerra a sessão do usuário autenticado.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Encerrar sessão',
    description:
      'Encerra a sessão do usuário autenticado e remove os cookies de autenticação.',
  })
  @ApiResponse({
    status: 201,
    description: 'Sessão encerrada com sucesso.',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.logoutUseCase.execute({
      userId: user.sub,
    });

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return {
      success: true,
    };
  }
}

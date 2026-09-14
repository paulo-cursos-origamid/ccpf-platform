import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Parâmetros de paginação e busca da listagem de usuários.
 */
export class ListUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Número da página.',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Quantidade de usuários por página.',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Termo utilizado para pesquisar usuários.',
    example: 'joao',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

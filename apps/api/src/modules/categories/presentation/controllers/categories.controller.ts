import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';

import {
  CurrentTenant,
  TenantContextGuard,
} from '../../../tenant/presentation';
import type { TenantContext } from '../../../tenant/presentation';

import { JwtAuthGuard } from '../../../identity/infrastructure/auth';
import { SubscriptionAccessGuard } from '../../../billing/presentation/guards/subscription-access.guard';

import { CategoriesService } from '../../application/categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CreateSubCategoryDto } from '../dto/create-subcategory.dto';
import { UpdateSubCategoryDto } from '../dto/update-subcategory.dto';

@ApiTags('Categories')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'X-Tenant-Id',
  description: 'Identificador do Tenant ativo.',
  required: true,
})
@Controller('categories')
@UseGuards(JwtAuthGuard, TenantContextGuard, SubscriptionAccessGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorias do Tenant ativo' })
  list(
    @CurrentTenant() tenant: TenantContext,
    @Query('type') type?: CategoryType,
  ) {
    return this.categoriesService.list(tenant.tenantId, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar categoria' })
  get(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.get(tenant.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar categoria' })
  create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(tenant.tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(tenant.tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir categoria logicamente' })
  delete(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.delete(tenant.tenantId, id);
  }

  @Get(':id/subcategories')
  @ApiOperation({ summary: 'Listar subcategorias' })
  listSubCategories(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.listSubCategories(tenant.tenantId, id);
  }

  @Post(':id/subcategories')
  @ApiOperation({ summary: 'Criar subcategoria' })
  createSubCategory(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSubCategoryDto,
  ) {
    return this.categoriesService.createSubCategory(tenant.tenantId, id, dto);
  }

  @Patch(':id/subcategories/:subCategoryId')
  @ApiOperation({ summary: 'Atualizar subcategoria' })
  updateSubCategory(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('subCategoryId', ParseUUIDPipe) subCategoryId: string,
    @Body() dto: UpdateSubCategoryDto,
  ) {
    return this.categoriesService.updateSubCategory(
      tenant.tenantId,
      id,
      subCategoryId,
      dto,
    );
  }

  @Delete(':id/subcategories/:subCategoryId')
  @ApiOperation({ summary: 'Excluir subcategoria logicamente' })
  deleteSubCategory(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('subCategoryId', ParseUUIDPipe) subCategoryId: string,
  ) {
    return this.categoriesService.deleteSubCategory(
      tenant.tenantId,
      id,
      subCategoryId,
    );
  }
}

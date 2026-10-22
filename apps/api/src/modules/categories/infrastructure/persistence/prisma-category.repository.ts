import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import {
  CategoryData,
  CategoryRepository,
  CategoryWithRelations,
  SubCategoryData,
} from '../../domain/repositories/category.repository';
import { Category, CategoryDomain, CategoryType, SubCategory } from '@prisma/client';

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    tenantId: string,
    type?: CategoryType,
  ): Promise<CategoryWithRelations[]> {
    return this.prisma.category.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(type ? { type } : {}),
      },
      include: {
        children: {
          where: { deletedAt: null },
        },
        subCategories: {
          where: { deletedAt: null },
        },
        domains: true,
      },
      orderBy: [{ name: 'asc' }],
    });
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<CategoryWithRelations | null> {
    return this.prisma.category.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        children: { where: { deletedAt: null } },
        subCategories: { where: { deletedAt: null } },
        domains: true,
      },
    });
  }

  async create(tenantId: string, data: CategoryData): Promise<Category> {
    return this.prisma.category.create({
      data: {
        tenantId,
        name: data.name,
        slug: data.slug,
        type: data.type,
        description: data.description ?? null,
        color: data.color ?? null,
        icon: data.icon ?? null,
        isVehicleCategory: data.isVehicleCategory ?? false,
        isDomesticCategory: data.isDomesticCategory ?? false,
        isHealthCategory: data.isHealthCategory ?? false,
        isTransportCategory: data.isTransportCategory ?? false,
        isInvestmentCategory: data.isInvestmentCategory ?? false,
        isOtherCategory: data.isOtherCategory ?? false,
        parentId: data.parentId ?? null,
        ...(data.domains !== undefined
          ? {
              domains: {
                create: data.domains.map((domain: CategoryDomain) => ({
                  domain,
                })),
              },
            }
          : {}),
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<CategoryData>,
  ): Promise<CategoryWithRelations> {
    const existing = await this.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    await this.prisma.$transaction(async (tx) => {
      const result = await tx.category.updateMany({
        where: { id, tenantId, deletedAt: null },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.slug !== undefined ? { slug: data.slug } : {}),
          ...(data.type !== undefined ? { type: data.type } : {}),
          ...(data.description !== undefined
            ? { description: data.description }
            : {}),
          ...(data.color !== undefined ? { color: data.color } : {}),
          ...(data.icon !== undefined ? { icon: data.icon } : {}),
          ...(data.isVehicleCategory !== undefined
            ? { isVehicleCategory: data.isVehicleCategory }
            : {}),
          ...(data.isDomesticCategory !== undefined ? { isDomesticCategory: data.isDomesticCategory } : {}),
          ...(data.isHealthCategory !== undefined ? { isHealthCategory: data.isHealthCategory } : {}),
          ...(data.isTransportCategory !== undefined ? { isTransportCategory: data.isTransportCategory } : {}),
          ...(data.isInvestmentCategory !== undefined ? { isInvestmentCategory: data.isInvestmentCategory } : {}),
          ...(data.isOtherCategory !== undefined ? { isOtherCategory: data.isOtherCategory } : {}),
          ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
        },
      });

      if (result.count === 0) {
        throw new NotFoundException('Categoria não encontrada.');
      }

      if (data.domains !== undefined) {
        await tx.categoryDomainLink.deleteMany({
          where: { categoryId: id },
        });

        if (data.domains.length > 0) {
          await tx.categoryDomainLink.createMany({
            data: data.domains.map((domain) => ({
              categoryId: id,
              domain,
            })),
          });
        }
      }
    });

    const updated = await this.findById(tenantId, id);

    if (!updated) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    return updated;
  }

  async softDelete(tenantId: string, id: string): Promise<void> {
    const category = await this.findById(tenantId, id);

    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    await this.prisma.$transaction(async (tx) => {
      const [children, subCategories] = await Promise.all([
        tx.category.count({
          where: {
            tenantId,
            parentId: id,
            deletedAt: null,
          },
        }),
        tx.subCategory.count({
          where: {
            categoryId: id,
            deletedAt: null,
          },
        }),
      ]);

      if (children > 0 || subCategories > 0) {
        throw new ConflictException(
          'Não é possível excluir uma categoria que possui categorias filhas ou subcategorias ativas.',
        );
      }

      await tx.category.updateMany({
        where: { id, tenantId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    });
  }

  async listSubCategories(
    tenantId: string,
    categoryId: string,
  ): Promise<SubCategory[]> {
    await this.requireCategory(tenantId, categoryId);

    return this.prisma.subCategory.findMany({
      where: {
        categoryId,
        deletedAt: null,
        category: { tenantId, deletedAt: null },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findSubCategory(
    tenantId: string,
    categoryId: string,
    subCategoryId: string,
  ): Promise<SubCategory | null> {
    const category = await this.findById(tenantId, categoryId);

    if (!category) {
      return null;
    }

    return this.prisma.subCategory.findFirst({
      where: {
        id: subCategoryId,
        categoryId,
        deletedAt: null,
        category: { tenantId, deletedAt: null },
      },
    });
  }

  async createSubCategory(
    tenantId: string,
    categoryId: string,
    data: SubCategoryData,
  ): Promise<SubCategory> {
    await this.requireCategory(tenantId, categoryId);

    return this.prisma.subCategory.create({
      data: {
        categoryId,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        color: data.color ?? null,
        icon: data.icon ?? null,
      },
    });
  }

  async updateSubCategory(
    tenantId: string,
    categoryId: string,
    subCategoryId: string,
    data: Partial<SubCategoryData>,
  ): Promise<SubCategory> {
    const existing = await this.findSubCategory(
      tenantId,
      categoryId,
      subCategoryId,
    );

    if (!existing) {
      throw new NotFoundException('Subcategoria não encontrada.');
    }

    const result = await this.prisma.subCategory.updateMany({
      where: {
        id: subCategoryId,
        categoryId,
        deletedAt: null,
      },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
        ...(data.icon !== undefined ? { icon: data.icon } : {}),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Subcategoria não encontrada.');
    }

    const updated = await this.findSubCategory(
      tenantId,
      categoryId,
      subCategoryId,
    );

    if (!updated) {
      throw new NotFoundException('Subcategoria não encontrada.');
    }

    return updated;
  }

  async softDeleteSubCategory(
    tenantId: string,
    categoryId: string,
    subCategoryId: string,
  ): Promise<void> {
    const existing = await this.findSubCategory(
      tenantId,
      categoryId,
      subCategoryId,
    );

    if (!existing) {
      throw new NotFoundException('Subcategoria não encontrada.');
    }

    const result = await this.prisma.subCategory.updateMany({
      where: {
        id: subCategoryId,
        categoryId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException('Subcategoria não encontrada.');
    }
  }

  private async requireCategory(
    tenantId: string,
    categoryId: string,
  ): Promise<void> {
    const category = await this.findById(tenantId, categoryId);

    if (!category) {
      throw new NotFoundException('Categoria não encontrada neste Tenant.');
    }
  }
}

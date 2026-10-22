import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoryDomain, CategoryType } from '@prisma/client';
import { SubscriptionFeatureAccessService } from '../../billing/application/services/subscription-feature-access.service';
import { PlanFeatureCode } from '../../billing/domain/enums/plan-feature-code.enum';

import {
  CategoryData,
  CategoryRepository,
  SubCategoryData,
} from '../domain/repositories/category.repository';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly repository: CategoryRepository,
    private readonly featureAccess: SubscriptionFeatureAccessService,
  ) {}

  list(tenantId: string, type?: CategoryType) {
    return this.repository.list(tenantId, type);
  }

  async get(tenantId: string, id: string) {
    const category = await this.repository.findById(tenantId, id);

    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    return category;
  }

  async create(tenantId: string, input: CategoryInput) {
    const data = this.normalizeCategory(input, true);
    await this.assertDomainsAvailable(tenantId, data.domains);

    if (data.parentId) {
      const parent = await this.repository.findById(tenantId, data.parentId);

      if (!parent) {
        throw new BadRequestException(
          'A categoria pai não existe neste Tenant ou está excluída.',
        );
      }

      if (parent.type !== data.type) {
        throw new BadRequestException(
          'A categoria pai deve ter o mesmo tipo da categoria filha.',
        );
      }
    }

    return this.repository.create(tenantId, data);
  }

  async update(tenantId: string, id: string, input: Partial<CategoryInput>) {
    const current = await this.get(tenantId, id);
    const data = this.normalizeCategory(input, false);

    const domainByFlag = {
      isDomesticCategory: CategoryDomain.DOMESTIC,
      isHealthCategory: CategoryDomain.HEALTH,
      isTransportCategory: CategoryDomain.TRANSPORT,
      isVehicleCategory: CategoryDomain.VEHICLES,
      isInvestmentCategory: CategoryDomain.INVESTMENTS,
      isOtherCategory: CategoryDomain.OTHER,
    } as const;

    const flagFields = Object.keys(domainByFlag) as Array<
      keyof typeof domainByFlag
    >;

    const hasFlags = flagFields.some((field) => input[field] !== undefined);
    const hasDomains = input.domains !== undefined;

    if (hasFlags || hasDomains) {
      const values = {
        isDomesticCategory: current.isDomesticCategory,
        isHealthCategory: current.isHealthCategory,
        isTransportCategory: current.isTransportCategory,
        isVehicleCategory: current.isVehicleCategory,
        isInvestmentCategory: current.isInvestmentCategory,
        isOtherCategory: current.isOtherCategory,
      };

      if (hasDomains) {
        for (const field of flagFields) {
          values[field] = input.domains!.includes(domainByFlag[field]);
        }
      }

      if (hasFlags) {
        for (const field of flagFields) {
          if (input[field] !== undefined) {
            values[field] = input[field]!;
          }
        }
      }

      for (const field of flagFields) {
        data[field] = values[field];
      }

      // As flags são a representação principal; os vínculos antigos
      // permanecem sincronizados para compatibilidade com código legado.
      data.domains = flagFields
        .filter((field) => values[field])
        .map((field) => domainByFlag[field]);

      await this.assertDomainsAvailable(tenantId, data.domains);
    }

    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new BadRequestException(
          'Uma categoria não pode ser sua própria categoria pai.',
        );
      }

      if (data.parentId !== null) {
        const parent = await this.repository.findById(tenantId, data.parentId);

        if (!parent) {
          throw new BadRequestException(
            'A categoria pai não existe neste Tenant ou está excluída.',
          );
        }

        const resultingType = data.type ?? current.type;

        if (parent.type !== resultingType) {
          throw new BadRequestException(
            'A categoria pai deve ter o mesmo tipo da categoria filha.',
          );
        }

        let ancestorId: string | null = parent.id;
        const visited = new Set<string>();

        while (ancestorId) {
          if (ancestorId === id) {
            throw new BadRequestException(
              'A alteração criaria um ciclo na hierarquia de categorias.',
            );
          }

          if (visited.has(ancestorId)) {
            throw new ConflictException(
              'Foi encontrada uma hierarquia de categorias inconsistente.',
            );
          }

          visited.add(ancestorId);

          const ancestor = await this.repository.findById(tenantId, ancestorId);

          ancestorId = ancestor?.parentId ?? null;
        }
      }
    }

    if (data.type && data.type !== current.type) {
      const currentChildren = (current.children ?? []) as unknown[];
      const currentSubCategories = (current.subCategories ?? []) as unknown[];
      const remainsAttachedToParent =
        Boolean(current.parentId) && data.parentId !== null;

      if (
        remainsAttachedToParent ||
        currentChildren.length > 0 ||
        currentSubCategories.length > 0
      ) {
        throw new ConflictException(
          'Não é possível alterar o tipo de uma categoria vinculada a uma categoria pai, com categorias filhas ou com subcategorias ativas. Desvincule as relações antes de alterar o tipo.',
        );
      }
    }

    return this.repository.update(tenantId, id, data);
  }

  async delete(tenantId: string, id: string) {
    await this.repository.softDelete(tenantId, id);
    return { message: 'Categoria excluída logicamente com sucesso.' };
  }

  async listSubCategories(tenantId: string, categoryId: string) {
    return this.repository.listSubCategories(tenantId, categoryId);
  }

  async createSubCategory(
    tenantId: string,
    categoryId: string,
    input: SubCategoryInput,
  ) {
    return this.repository.createSubCategory(
      tenantId,
      categoryId,
      this.normalizeSubCategory(input, true),
    );
  }

  async updateSubCategory(
    tenantId: string,
    categoryId: string,
    subCategoryId: string,
    input: Partial<SubCategoryInput>,
  ) {
    return this.repository.updateSubCategory(
      tenantId,
      categoryId,
      subCategoryId,
      this.normalizeSubCategory(input, false),
    );
  }

  async deleteSubCategory(
    tenantId: string,
    categoryId: string,
    subCategoryId: string,
  ) {
    await this.repository.softDeleteSubCategory(
      tenantId,
      categoryId,
      subCategoryId,
    );

    return { message: 'Subcategoria excluída logicamente com sucesso.' };
  }

  private async assertDomainsAvailable(
    tenantId: string,
    domains: CategoryDomain[] | undefined,
  ): Promise<void> {
    if (!domains || domains.length === 0) {
      return;
    }

    const featureByDomain: Record<CategoryDomain, PlanFeatureCode> = {
      [CategoryDomain.DOMESTIC]: PlanFeatureCode.DOMESTIC,
      [CategoryDomain.HEALTH]: PlanFeatureCode.HEALTH,
      [CategoryDomain.TRANSPORT]: PlanFeatureCode.TRANSPORT,
      [CategoryDomain.VEHICLES]: PlanFeatureCode.VEHICLES,
      [CategoryDomain.INVESTMENTS]: PlanFeatureCode.INVESTMENTS,
      [CategoryDomain.OTHER]: PlanFeatureCode.OTHER,
    };

    for (const domain of domains) {
      const feature = featureByDomain[domain];
      const allowed = await this.featureAccess.canAccess(tenantId, feature);

      if (!allowed) {
        throw new BadRequestException(
          `O plano deste espaço não permite utilizar o domínio "${domain}".`,
        );
      }
    }
  }

  private normalizeCategory(
    input: Partial<CategoryInput>,
    creating: true,
  ): CategoryData;
  private normalizeCategory(
    input: Partial<CategoryInput>,
    creating: false,
  ): Partial<CategoryData>;
  private normalizeCategory(
    input: Partial<CategoryInput>,
    creating: boolean,
  ): CategoryData | Partial<CategoryData> {
    const data: Partial<CategoryData> = {};

    if (input.name !== undefined) {
      data.name = this.normalizeName(input.name);
      data.slug = this.normalizeSlug(input.slug ?? input.name);
    } else if (input.slug !== undefined) {
      data.slug = this.normalizeSlug(input.slug);
    }

    if (input.type !== undefined) {
      data.type = input.type;
    }

    for (const field of ['description', 'color', 'icon'] as const) {
      if (input[field] !== undefined) {
        data[field] = input[field]?.trim() || null;
      }
    }

    const domainFlagFields = [
      'isVehicleCategory',
      'isDomesticCategory',
      'isHealthCategory',
      'isTransportCategory',
      'isInvestmentCategory',
      'isOtherCategory',
    ] as const;

    for (const field of domainFlagFields) {
      if (input[field] !== undefined) {
        data[field] = input[field];
      }
    }

    if (input.domains !== undefined) {
      data.domains = [...new Set(input.domains)];
    } else if (creating && domainFlagFields.some((field) => input[field] !== undefined)) {
      const domainByFlag = {
        isDomesticCategory: CategoryDomain.DOMESTIC,
        isHealthCategory: CategoryDomain.HEALTH,
        isTransportCategory: CategoryDomain.TRANSPORT,
        isVehicleCategory: CategoryDomain.VEHICLES,
        isInvestmentCategory: CategoryDomain.INVESTMENTS,
        isOtherCategory: CategoryDomain.OTHER,
      } as const;

      data.domains = domainFlagFields
        .filter((field) => input[field] === true)
        .map((field) => domainByFlag[field]);
    }

    if (input.parentId !== undefined) {
      data.parentId = input.parentId?.trim() || null;
    }

    if (creating && (!data.name || !data.slug || !data.type)) {
      throw new BadRequestException(
        'Nome e tipo são obrigatórios para criar uma categoria.',
      );
    }

    return data;
  }

  private normalizeSubCategory(
    input: Partial<SubCategoryInput>,
    creating: true,
  ): SubCategoryData;
  private normalizeSubCategory(
    input: Partial<SubCategoryInput>,
    creating: false,
  ): Partial<SubCategoryData>;
  private normalizeSubCategory(
    input: Partial<SubCategoryInput>,
    creating: boolean,
  ): SubCategoryData | Partial<SubCategoryData> {
    const data: Partial<SubCategoryData> = {};

    if (input.name !== undefined) {
      data.name = this.normalizeName(input.name);
      data.slug = this.normalizeSlug(input.slug ?? input.name);
    } else if (input.slug !== undefined) {
      data.slug = this.normalizeSlug(input.slug);
    }

    for (const field of ['description', 'color', 'icon'] as const) {
      if (input[field] !== undefined) {
        data[field] = input[field]?.trim() || null;
      }
    }

    if (creating && (!data.name || !data.slug)) {
      throw new BadRequestException(
        'Nome é obrigatório para criar uma subcategoria.',
      );
    }

    return data;
  }

  private normalizeName(name: string): string {
    const value = name.trim();

    if (value.length < 2 || value.length > 100) {
      throw new BadRequestException(
        'O nome deve conter entre 2 e 100 caracteres.',
      );
    }

    return value;
  }

  private normalizeSlug(value: string): string {
    const slug = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug || slug.length > 120) {
      throw new BadRequestException('Slug inválido.');
    }

    return slug;
  }
}

export interface CategoryInput {
  name: string;
  slug?: string;
  type: CategoryType;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  isVehicleCategory?: boolean;
  isDomesticCategory?: boolean;
  isHealthCategory?: boolean;
  isTransportCategory?: boolean;
  isInvestmentCategory?: boolean;
  isOtherCategory?: boolean;
  domains?: CategoryDomain[];
  parentId?: string | null;
}

export interface SubCategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
}

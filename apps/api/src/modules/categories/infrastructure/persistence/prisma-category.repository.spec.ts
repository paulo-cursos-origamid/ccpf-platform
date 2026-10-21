import { ConflictException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { PrismaCategoryRepository } from './prisma-category.repository';

describe('PrismaCategoryRepository — isolamento multi-tenant', () => {
  const tenantA = 'tenant-a';
  const tenantB = 'tenant-b';
  const categoryId = 'category-123';
  const subCategoryId = 'subcategory-123';

  let prisma: {
    category: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
      count: jest.Mock;
    };
    subCategory: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  let transaction: {
    category: {
      count: jest.Mock;
      updateMany: jest.Mock;
    };
    subCategory: {
      count: jest.Mock;
    };
  };

  let repository: PrismaCategoryRepository;

  const category = {
    id: categoryId,
    tenantId: tenantA,
    name: 'Alimentação',
    slug: 'alimentacao',
    type: 'EXPENSE',
    description: null,
    color: null,
    icon: null,
    isVehicleCategory: false,
    parentId: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    children: [],
    subCategories: [],
  };

  const subCategory = {
    id: subCategoryId,
    categoryId,
    name: 'Mercado',
    slug: 'mercado',
    description: null,
    color: null,
    icon: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    transaction = {
      category: {
        count: jest.fn().mockResolvedValue(0),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      subCategory: {
        count: jest.fn().mockResolvedValue(0),
      },
    };

    prisma = {
      category: {
        findMany: jest.fn().mockResolvedValue([category]),
        findFirst: jest.fn().mockResolvedValue(category),
        create: jest.fn().mockResolvedValue(category),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        count: jest.fn().mockResolvedValue(0),
      },
      subCategory: {
        findMany: jest.fn().mockResolvedValue([subCategory]),
        findFirst: jest.fn().mockResolvedValue(subCategory),
        create: jest.fn().mockResolvedValue(subCategory),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn(),
    };

    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    repository = new PrismaCategoryRepository(
      prisma as unknown as PrismaService,
    );
  });

  it('lista categorias somente do tenant informado e ignora excluídas', async () => {
    await repository.list(tenantA);

    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: tenantA,
          deletedAt: null,
        },
      }),
    );
  });

  it('consulta categoria usando simultaneamente ID e tenant', async () => {
    await repository.findById(tenantA, categoryId);

    expect(prisma.category.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: categoryId,
          tenantId: tenantA,
          deletedAt: null,
        },
      }),
    );
  });

  it('não atualiza categoria quando ela não pertence ao tenant informado', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    await expect(
      repository.update(tenantB, categoryId, { name: 'Alterada' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.category.updateMany).not.toHaveBeenCalled();
  });

  it('cria categoria associando-a ao tenant informado', async () => {
    await repository.create(tenantA, {
      name: 'Alimentação',
      slug: 'alimentacao',
      type: 'EXPENSE',
    });

    expect(prisma.category.create).toHaveBeenCalledTimes(1);

    const createCall = prisma.category.create.mock.calls[0] as unknown as [
      { data: { tenantId: string; name: string } },
    ];

    expect(createCall[0].data.tenantId).toBe(tenantA);
    expect(createCall[0].data.name).toBe('Alimentação');
  });

  it('não consulta subcategoria quando a categoria não pertence ao tenant', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    const result = await repository.findSubCategory(
      tenantB,
      categoryId,
      subCategoryId,
    );

    expect(result).toBeNull();
    expect(prisma.subCategory.findFirst).not.toHaveBeenCalled();
  });

  it('filtra a subcategoria pela categoria ativa e pelo tenant', async () => {
    await repository.findSubCategory(tenantA, categoryId, subCategoryId);

    expect(prisma.subCategory.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: subCategoryId,
          categoryId,
          deletedAt: null,
          category: { tenantId: tenantA, deletedAt: null },
        },
      }),
    );
  });

  it('não atualiza subcategoria de uma categoria fora do tenant', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    await expect(
      repository.updateSubCategory(tenantB, categoryId, subCategoryId, {
        name: 'Alterada',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.subCategory.updateMany).not.toHaveBeenCalled();
  });

  it('não exclui subcategoria de uma categoria fora do tenant', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    await expect(
      repository.softDeleteSubCategory(tenantB, categoryId, subCategoryId),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.subCategory.updateMany).not.toHaveBeenCalled();
  });

  it('impede exclusão de categoria com subcategorias ativas', async () => {
    transaction.subCategory.count.mockResolvedValue(1);

    await expect(
      repository.softDelete(tenantA, categoryId),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(transaction.category.updateMany).not.toHaveBeenCalled();
  });

  it('impede exclusão de categoria com categorias filhas ativas', async () => {
    transaction.category.count.mockResolvedValue(1);

    await expect(
      repository.softDelete(tenantA, categoryId),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(transaction.category.updateMany).not.toHaveBeenCalled();
  });

  it('aplica tenant e exclusão lógica ao excluir uma categoria', async () => {
    await repository.softDelete(tenantA, categoryId);

    expect(transaction.category.updateMany).toHaveBeenCalledTimes(1);

    const deleteCall = transaction.category.updateMany.mock
      .calls[0] as unknown as [
      {
        where: {
          id: string;
          tenantId: string;
          deletedAt: null;
        };
        data: { deletedAt: Date };
      },
    ];

    expect(deleteCall[0].where).toEqual({
      id: categoryId,
      tenantId: tenantA,
      deletedAt: null,
    });
    expect(deleteCall[0].data.deletedAt).toBeInstanceOf(Date);
  });
});

import { Module } from '@nestjs/common';

import { TenantModule } from '../tenant/tenant.module';
import { BillingModule } from '../billing/billing.module';

import { CategoryRepository } from './domain/repositories/category.repository';
import { PrismaCategoryRepository } from './infrastructure/persistence/prisma-category.repository';
import { CategoriesService } from './application/categories.service';
import { CategoriesController } from './presentation/controllers/categories.controller';

@Module({
  imports: [TenantModule, BillingModule],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    {
      provide: CategoryRepository,
      useClass: PrismaCategoryRepository,
    },
  ],
  exports: [CategoriesService, CategoryRepository],
})
export class CategoriesModule {}

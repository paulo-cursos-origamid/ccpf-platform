import { Module } from '@nestjs/common';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { IdentityModule } from './modules/identity/identity.module';

@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

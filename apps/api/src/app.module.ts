import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { IdentityModule } from './modules/identity/identity.module';
import { ProfileModule } from './modules/profile/profile.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { TenantModule } from './modules/tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    IdentityModule,
    ProfileModule,
    AccountsModule,
    TenantModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

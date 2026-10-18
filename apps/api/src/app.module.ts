import { Module } from '@nestjs/common';
import { ApplicationsModule } from './applications/applications.module.js';
import { CompaniesModule } from './companies/companies.module.js';
import { HealthController } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, CompaniesModule, ApplicationsModule],
  controllers: [HealthController],
})
export class AppModule {}

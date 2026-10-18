import { Module } from '@nestjs/common';
import { ApplicationsModule } from './applications/applications.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CompaniesModule } from './companies/companies.module.js';
import { ContactsModule } from './contacts/contacts.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { HealthController } from './health/health.controller.js';
import { InterviewsModule } from './interviews/interviews.module.js';
import { NotesModule } from './notes/notes.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    CompaniesModule,
    ApplicationsModule,
    ContactsModule,
    InterviewsModule,
    NotesModule,
    DashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

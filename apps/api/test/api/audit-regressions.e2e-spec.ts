import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApplicationStatus } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import { ApplicationsService } from '../../src/applications/applications.service.js';
import { OwnerAuthGuard } from '../../src/auth/owner.guard.js';
import { HttpExceptionFilter } from '../../src/common/http-exception.filter.js';
import { cleanDatabase, prisma } from '../helpers/database.js';

describe('Backend audit regressions', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(OwnerAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  it('does not allow PATCH to bypass transactional status history', async () => {
    const company = await prisma.company.create({
      data: { name: 'Status Patch GmbH' },
    });
    const application = await prisma.application.create({
      data: {
        companyId: company.id,
        jobTitle: 'Engineer',
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/applications/${application.id}`)
      .send({ status: ApplicationStatus.APPLIED });

    expect(response.status).toBe(400);

    const unchanged = await prisma.application.findUniqueOrThrow({
      where: { id: application.id },
    });
    const history = await prisma.statusChange.findMany({
      where: { applicationId: application.id },
    });

    expect(unchanged.status).toBe(ApplicationStatus.WISHLIST);
    expect(history).toHaveLength(0);
  });

  it('returns a domain error for an invalid application company', async () => {
    const response = await request(app.getHttpServer()).post('/applications').send({
      companyId: 'missing-company',
      jobTitle: 'Engineer',
    });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Company not found');
  });

  it('rejects a salary range without currency', async () => {
    const company = await prisma.company.create({
      data: { name: 'Salary GmbH' },
    });

    const response = await request(app.getHttpServer()).post('/applications').send({
      companyId: company.id,
      jobTitle: 'Engineer',
      salaryMin: 50000,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Salary currency is required when a salary range is provided',
    );
  });

  it('rejects a cross-company contact when an interview is updated', async () => {
    const firstCompany = await prisma.company.create({
      data: { name: 'Update First GmbH' },
    });
    const secondCompany = await prisma.company.create({
      data: { name: 'Update Second GmbH' },
    });
    const application = await prisma.application.create({
      data: {
        companyId: firstCompany.id,
        jobTitle: 'Engineer',
      },
    });
    const contact = await prisma.contact.create({
      data: {
        companyId: secondCompany.id,
        name: 'Wrong Contact',
      },
    });
    const interview = await prisma.interview.create({
      data: {
        applicationId: application.id,
        scheduledAt: new Date('2026-11-05T10:00:00.000Z'),
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/interviews/${interview.id}`)
      .send({ contactId: contact.id });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Contact must belong to the application company');
  });

  it('excludes interviews belonging to archived applications from the dashboard', async () => {
    const company = await prisma.company.create({
      data: { name: 'Archived Interview GmbH' },
    });
    const application = await prisma.application.create({
      data: {
        companyId: company.id,
        jobTitle: 'Engineer',
        deletedAt: new Date(),
      },
    });
    await prisma.interview.create({
      data: {
        applicationId: application.id,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const response = await request(app.getHttpServer()).get('/dashboard');

    expect(response.status).toBe(200);
    expect(response.body.upcomingInterviews).toHaveLength(0);
  });

  it('allows only one concurrent status transition', async () => {
    const company = await prisma.company.create({
      data: { name: 'Concurrency GmbH' },
    });
    const application = await prisma.application.create({
      data: {
        companyId: company.id,
        jobTitle: 'Engineer',
      },
    });
    const service = app.get(ApplicationsService);

    const results = await Promise.allSettled([
      service.changeStatus(application.id, { status: ApplicationStatus.APPLIED }),
      service.changeStatus(application.id, { status: ApplicationStatus.SCREENING }),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);

    const history = await prisma.statusChange.findMany({
      where: { applicationId: application.id },
    });

    expect(history).toHaveLength(1);
  });
});

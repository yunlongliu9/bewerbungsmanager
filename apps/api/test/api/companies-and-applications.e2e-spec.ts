import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApplicationStatus } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import { OwnerAuthGuard } from '../../src/auth/owner.guard.js';
import { HttpExceptionFilter } from '../../src/common/http-exception.filter.js';
import { cleanDatabase, prisma } from '../helpers/database.js';

describe('Company and Application API', () => {
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

  it('creates and retrieves a company', async () => {
    const createResponse = await request(app.getHttpServer()).post('/companies').send({
      name: 'Acme GmbH',
      website: 'https://acme.example',
      location: 'Berlin',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      name: 'Acme GmbH',
      location: 'Berlin',
      deletedAt: null,
    });

    const getResponse = await request(app.getHttpServer()).get(
      `/companies/${createResponse.body.id}`,
    );

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.name).toBe('Acme GmbH');
  });

  it('returns a consistent validation error for a company', async () => {
    const response = await request(app.getHttpServer()).post('/companies').send({});

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/companies',
    });
    expect(response.body.message).toEqual(expect.any(Array));
  });

  it('returns not found for a missing company', async () => {
    const response = await request(app.getHttpServer()).get('/companies/missing-id');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Company not found');
  });

  it('archives a company and excludes it from direct lookup', async () => {
    const company = await prisma.company.create({
      data: { name: 'Archive Me GmbH' },
    });

    const archiveResponse = await request(app.getHttpServer()).post(
      `/companies/${company.id}/archive`,
    );

    expect(archiveResponse.status).toBe(201);
    expect(archiveResponse.body.deletedAt).not.toBeNull();

    const getResponse = await request(app.getHttpServer()).get(`/companies/${company.id}`);
    expect(getResponse.status).toBe(404);
  });

  it('creates an application and applies an atomic status transition', async () => {
    const company = await prisma.company.create({
      data: { name: 'Hiring GmbH' },
    });

    const createResponse = await request(app.getHttpServer()).post('/applications').send({
      companyId: company.id,
      jobTitle: 'Software Engineer',
      employmentType: 'FULL_TIME',
      workMode: 'REMOTE',
      priority: 'HIGH',
      salaryMin: 70000,
      salaryMax: 90000,
      salaryCurrency: 'EUR',
      jobDescriptionSnapshot: 'Build the API.',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.status).toBe(ApplicationStatus.WISHLIST);

    const statusResponse = await request(app.getHttpServer())
      .post(`/applications/${createResponse.body.id}/status`)
      .send({
        status: ApplicationStatus.APPLIED,
        note: 'Submitted application.',
      });

    expect(statusResponse.status).toBe(201);
    expect(statusResponse.body.status).toBe(ApplicationStatus.APPLIED);

    const applicationResponse = await request(app.getHttpServer()).get(
      `/applications/${createResponse.body.id}`,
    );

    expect(applicationResponse.body.statusChanges).toHaveLength(1);
    expect(applicationResponse.body.statusChanges[0]).toMatchObject({
      fromStatus: ApplicationStatus.WISHLIST,
      toStatus: ApplicationStatus.APPLIED,
    });
  });

  it('rejects a no-op status transition', async () => {
    const company = await prisma.company.create({
      data: { name: 'Noop GmbH' },
    });
    const application = await prisma.application.create({
      data: {
        companyId: company.id,
        jobTitle: 'Product Manager',
      },
    });

    const response = await request(app.getHttpServer())
      .post(`/applications/${application.id}/status`)
      .send({ status: application.status });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(`Application is already ${application.status}`);
  });

  it('filters and searches applications by status, company, and text', async () => {
    const firstCompany = await prisma.company.create({
      data: { name: 'Search GmbH' },
    });
    const secondCompany = await prisma.company.create({
      data: { name: 'Other GmbH' },
    });

    await prisma.application.create({
      data: {
        companyId: firstCompany.id,
        jobTitle: 'Backend Engineer',
        status: ApplicationStatus.APPLIED,
      },
    });
    await prisma.application.create({
      data: {
        companyId: secondCompany.id,
        jobTitle: 'Designer',
      },
    });

    const response = await request(app.getHttpServer()).get('/applications').query({
      status: ApplicationStatus.APPLIED,
      companyId: firstCompany.id,
      search: 'backend',
      page: 1,
      limit: 10,
    });

    expect(response.status).toBe(200);
    expect(response.body.meta.total).toBe(1);
    expect(response.body.data[0].jobTitle).toBe('Backend Engineer');
  });

  it('returns validation and missing-record errors for applications', async () => {
    const invalidResponse = await request(app.getHttpServer()).post('/applications').send({});

    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body.message).toEqual(expect.any(Array));

    const missingResponse = await request(app.getHttpServer()).get('/applications/missing-id');

    expect(missingResponse.status).toBe(404);
    expect(missingResponse.body.message).toBe('Application not found');
  });
});

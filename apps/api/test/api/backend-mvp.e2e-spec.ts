import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApplicationStatus, InterviewFormat } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import { OwnerAuthGuard } from '../../src/auth/owner.guard.js';
import { HttpExceptionFilter } from '../../src/common/http-exception.filter.js';
import { cleanDatabase, prisma } from '../helpers/database.js';

describe('Backend MVP APIs', () => {
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

  it('manages contacts with company associations', async () => {
    const company = await prisma.company.create({
      data: { name: 'Contact GmbH' },
    });

    const createResponse = await request(app.getHttpServer()).post('/contacts').send({
      companyId: company.id,
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'Recruiter',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      name: 'Jane Doe',
      email: 'jane@example.com',
      companyId: company.id,
    });

    const listResponse = await request(app.getHttpServer()).get('/contacts').query({
      companyId: company.id,
      search: 'jane',
    });

    expect(listResponse.body.meta.total).toBe(1);
    expect(listResponse.body.data[0].company.name).toBe('Contact GmbH');

    const updateResponse = await request(app.getHttpServer())
      .patch(`/contacts/${createResponse.body.id}`)
      .send({ name: 'Jane Smith' });

    expect(updateResponse.body.name).toBe('Jane Smith');

    const deleteResponse = await request(app.getHttpServer()).delete(
      `/contacts/${createResponse.body.id}`,
    );

    expect(deleteResponse.body.deletedAt).not.toBeNull();

    const missingResponse = await request(app.getHttpServer()).get(
      `/contacts/${createResponse.body.id}`,
    );
    expect(missingResponse.status).toBe(404);
  });

  it('validates contacts', async () => {
    const response = await request(app.getHttpServer()).post('/contacts').send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(expect.any(Array));
  });

  it('schedules and cancels interviews', async () => {
    const company = await prisma.company.create({
      data: { name: 'Interview GmbH' },
    });
    const application = await prisma.application.create({
      data: {
        companyId: company.id,
        jobTitle: 'Backend Engineer',
      },
    });
    const contact = await prisma.contact.create({
      data: {
        companyId: company.id,
        name: 'Interviewer',
      },
    });

    const createResponse = await request(app.getHttpServer()).post('/interviews').send({
      applicationId: application.id,
      contactId: contact.id,
      interviewerName: 'Interviewer',
      format: InterviewFormat.VIDEO,
      scheduledAt: '2026-11-05T10:00:00.000Z',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.scheduledAt).toBe('2026-11-05T10:00:00.000Z');

    const cancelResponse = await request(app.getHttpServer()).post(
      `/interviews/${createResponse.body.id}/cancel`,
    );

    expect(cancelResponse.body.deletedAt).not.toBeNull();

    const missingResponse = await request(app.getHttpServer()).get(
      `/interviews/${createResponse.body.id}`,
    );
    expect(missingResponse.status).toBe(404);
  });

  it('rejects an interview contact from another company', async () => {
    const firstCompany = await prisma.company.create({
      data: { name: 'First GmbH' },
    });
    const secondCompany = await prisma.company.create({
      data: { name: 'Second GmbH' },
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

    const response = await request(app.getHttpServer()).post('/interviews').send({
      applicationId: application.id,
      contactId: contact.id,
      scheduledAt: '2026-11-05T10:00:00.000Z',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Contact must belong to the application company');
  });

  it('requires notes to have exactly one parent', async () => {
    const company = await prisma.company.create({
      data: { name: 'Note GmbH' },
    });
    const application = await prisma.application.create({
      data: {
        companyId: company.id,
        jobTitle: 'Engineer',
      },
    });

    const noParentResponse = await request(app.getHttpServer()).post('/notes').send({
      text: 'Orphan note',
    });

    expect(noParentResponse.status).toBe(400);
    expect(noParentResponse.body.message).toBe('A note must reference exactly one parent');

    const twoParentsResponse = await request(app.getHttpServer()).post('/notes').send({
      companyId: company.id,
      applicationId: application.id,
      text: 'Ambiguous note',
    });

    expect(twoParentsResponse.status).toBe(400);
    expect(twoParentsResponse.body.message).toBe('A note must reference exactly one parent');

    const validResponse = await request(app.getHttpServer()).post('/notes').send({
      applicationId: application.id,
      text: 'Follow up next week',
    });

    expect(validResponse.status).toBe(201);
    expect(validResponse.body.applicationId).toBe(application.id);
  });

  it('updates and removes notes', async () => {
    const company = await prisma.company.create({
      data: { name: 'Note Update GmbH' },
    });
    const application = await prisma.application.create({
      data: {
        companyId: company.id,
        jobTitle: 'Engineer',
      },
    });
    const note = await prisma.note.create({
      data: {
        applicationId: application.id,
        text: 'Original note',
      },
    });

    const updateResponse = await request(app.getHttpServer())
      .patch(`/notes/${note.id}`)
      .send({ text: 'Updated note' });

    expect(updateResponse.body.text).toBe('Updated note');

    const deleteResponse = await request(app.getHttpServer()).delete(`/notes/${note.id}`);
    expect(deleteResponse.body.deletedAt).not.toBeNull();

    const missingResponse = await request(app.getHttpServer()).get(`/notes/${note.id}`);
    expect(missingResponse.status).toBe(404);
  });

  it('returns dashboard metrics and follow-ups', async () => {
    const company = await prisma.company.create({
      data: { name: 'Dashboard GmbH' },
    });
    const applied = await prisma.application.create({
      data: {
        companyId: company.id,
        jobTitle: 'Applied Role',
        status: ApplicationStatus.APPLIED,
        nextActionAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    const overdue = await prisma.application.create({
      data: {
        companyId: company.id,
        jobTitle: 'Overdue Role',
        nextActionAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });
    await prisma.application.create({
      data: {
        companyId: company.id,
        jobTitle: 'Accepted Role',
        status: ApplicationStatus.ACCEPTED,
      },
    });
    await prisma.interview.create({
      data: {
        applicationId: applied.id,
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    });

    const response = await request(app.getHttpServer()).get('/dashboard');

    expect(response.status).toBe(200);
    expect(response.body.activeApplicationCount).toBe(2);
    expect(response.body.applicationsByStatus[ApplicationStatus.APPLIED]).toBe(1);
    expect(response.body.applicationsByStatus[ApplicationStatus.WISHLIST]).toBe(1);
    expect(response.body.applicationsByStatus[ApplicationStatus.ACCEPTED]).toBe(1);
    expect(response.body.upcomingInterviews).toHaveLength(1);
    expect(response.body.dueFollowUps).toHaveLength(1);
    expect(response.body.overdueFollowUps).toHaveLength(1);
    expect(response.body.overdueFollowUps[0].id).toBe(overdue.id);
  });
});

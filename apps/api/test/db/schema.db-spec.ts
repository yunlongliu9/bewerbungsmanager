import {
  ApplicationStatus,
  EmploymentType,
  InterviewFormat,
  Priority,
  PrismaClient,
  WorkMode,
} from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const prisma = new PrismaClient();

async function cleanDatabase(): Promise<void> {
  await prisma.note.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.statusChange.deleteMany();
  await prisma.application.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
}

describe('Prisma data layer', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  it('creates related domain records', async () => {
    const company = await prisma.company.create({
      data: {
        name: 'Acme GmbH',
        website: 'https://example.com',
        location: 'Berlin',
      },
    });

    const application = await prisma.application.create({
      data: {
        companyId: company.id,
        jobTitle: 'Software Engineer',
        employmentType: EmploymentType.FULL_TIME,
        workMode: WorkMode.REMOTE,
        priority: Priority.HIGH,
        salaryMin: 70000,
        salaryMax: 90000,
        salaryCurrency: 'EUR',
        deadline: new Date('2026-12-31'),
        nextActionAt: new Date('2026-11-01T09:00:00.000Z'),
        jobDescriptionSnapshot: 'Build and maintain the application.',
      },
    });

    const contact = await prisma.contact.create({
      data: {
        companyId: company.id,
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
    });

    const interview = await prisma.interview.create({
      data: {
        applicationId: application.id,
        contactId: contact.id,
        interviewerName: 'Jane Doe',
        format: InterviewFormat.VIDEO,
        scheduledAt: new Date('2026-11-05T10:00:00.000Z'),
      },
    });

    await prisma.note.create({
      data: {
        applicationId: application.id,
        text: 'Prepare for the technical interview.',
      },
    });

    const loaded = await prisma.application.findUniqueOrThrow({
      where: { id: application.id },
      include: {
        company: true,
        interviews: true,
        notes: true,
      },
    });

    expect(loaded.company.name).toBe('Acme GmbH');
    expect(loaded.interviews).toHaveLength(1);
    expect(loaded.interviews[0]?.id).toBe(interview.id);
    expect(loaded.notes).toHaveLength(1);
  });

  it('updates application status and creates history in one transaction', async () => {
    const company = await prisma.company.create({
      data: { name: 'Transactional GmbH' },
    });

    const application = await prisma.application.create({
      data: {
        companyId: company.id,
        jobTitle: 'Product Manager',
      },
    });

    const result = await prisma.$transaction(async (tx) => {
      const history = await tx.statusChange.create({
        data: {
          applicationId: application.id,
          fromStatus: application.status,
          toStatus: ApplicationStatus.APPLIED,
          note: 'Submitted application.',
        },
      });

      const updated = await tx.application.update({
        where: { id: application.id },
        data: { status: ApplicationStatus.APPLIED },
      });

      return { history, updated };
    });

    const changes = await prisma.statusChange.findMany({
      where: { applicationId: application.id },
    });

    expect(result.updated.status).toBe(ApplicationStatus.APPLIED);
    expect(result.history.toStatus).toBe(ApplicationStatus.APPLIED);
    expect(changes).toHaveLength(1);
    expect(changes[0]?.fromStatus).toBe(ApplicationStatus.WISHLIST);
  });

  it('rejects unsafe company deletion when related records exist', async () => {
    const company = await prisma.company.create({
      data: { name: 'Protected GmbH' },
    });

    await prisma.application.create({
      data: {
        companyId: company.id,
        jobTitle: 'Designer',
      },
    });

    await expect(
      prisma.company.delete({
        where: { id: company.id },
      }),
    ).rejects.toThrow();
  });

  it('requires a note to reference exactly one parent', async () => {
    await expect(
      prisma.note.create({
        data: { text: 'Orphan note' },
      }),
    ).rejects.toThrow();
  });
});

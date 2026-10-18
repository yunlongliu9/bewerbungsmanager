import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateInterviewDto } from './dto/create-interview.dto.js';
import { QueryInterviewsDto } from './dto/query-interviews.dto.js';
import { UpdateInterviewDto } from './dto/update-interview.dto.js';

@Injectable()
export class InterviewsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(data: CreateInterviewDto) {
    const application = await this.ensureApplicationExists(data.applicationId);

    if (data.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: { id: data.contactId, deletedAt: null },
      });

      if (!contact) {
        throw new NotFoundException('Contact not found');
      }

      if (contact.companyId !== application.companyId) {
        throw new BadRequestException('Contact must belong to the application company');
      }
    }

    return this.prisma.interview.create({
      data: {
        applicationId: data.applicationId,
        contactId: data.contactId,
        interviewerName: data.interviewerName,
        format: data.format,
        scheduledAt: new Date(data.scheduledAt),
      },
    });
  }

  async findAll(query: QueryInterviewsDto) {
    const where: Prisma.InterviewWhereInput = {
      deletedAt: null,
      application: { deletedAt: null },
      ...(query.applicationId ? { applicationId: query.applicationId } : {}),
      ...(query.contactId ? { contactId: query.contactId } : {}),
      ...(query.from ? { scheduledAt: { gte: new Date(query.from) } } : {}),
      ...(query.to ? { scheduledAt: { lte: new Date(query.to) } } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.interview.findMany({
        where,
        include: {
          application: { include: { company: true } },
          contact: true,
        },
        orderBy: { scheduledAt: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.interview.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string) {
    const interview = await this.prisma.interview.findFirst({
      where: { id, deletedAt: null, application: { deletedAt: null } },
      include: {
        application: { include: { company: true } },
        contact: true,
      },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    return interview;
  }

  async update(id: string, data: UpdateInterviewDto) {
    const existing = await this.findOne(id);
    const targetApplicationId = data.applicationId ?? existing.applicationId;
    const targetContactId = data.contactId ?? existing.contactId ?? null;

    const application = await this.ensureApplicationExists(targetApplicationId);

    if (targetContactId) {
      const contact = await this.prisma.contact.findFirst({
        where: { id: targetContactId, deletedAt: null },
      });

      if (!contact) {
        throw new NotFoundException('Contact not found');
      }

      if (contact.companyId !== application.companyId) {
        throw new BadRequestException('Contact must belong to the application company');
      }
    }

    return this.prisma.interview.update({
      where: { id },
      data: {
        applicationId: data.applicationId,
        contactId: data.contactId ?? existing.contactId,
        interviewerName: data.interviewerName,
        format: data.format,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      },
    });
  }

  async cancel(id: string) {
    await this.findOne(id);
    return this.prisma.interview.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  remove(id: string) {
    return this.cancel(id);
  }

  private async ensureApplicationExists(applicationId: string) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, deletedAt: null },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }
}

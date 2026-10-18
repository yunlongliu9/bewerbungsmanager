import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChangeStatusDto } from './dto/change-status.dto.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import { QueryApplicationsDto } from './dto/query-applications.dto.js';
import { UpdateApplicationDto } from './dto/update-application.dto.js';

@Injectable()
export class ApplicationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  create(data: CreateApplicationDto) {
    return this.prisma.application.create({
      data: this.toCreateInput(data),
    });
  }

  async findAll(query: QueryApplicationsDto) {
    const where: Prisma.ApplicationWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...(query.search
        ? {
            OR: [
              { jobTitle: { contains: query.search, mode: 'insensitive' } },
              { jobPostingUrl: { contains: query.search, mode: 'insensitive' } },
              { source: { contains: query.search, mode: 'insensitive' } },
              { company: { name: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        include: { company: true },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.application.count({ where }),
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
    const application = await this.prisma.application.findFirst({
      where: { id, deletedAt: null },
      include: {
        company: true,
        statusChanges: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async update(id: string, data: UpdateApplicationDto) {
    await this.findOne(id);
    return this.prisma.application.update({
      where: { id },
      data: this.toUpdateInput(data),
    });
  }

  async archive(id: string) {
    await this.findOne(id);
    return this.prisma.application.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  remove(id: string) {
    return this.archive(id);
  }

  async changeStatus(id: string, data: ChangeStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const application = await tx.application.findFirst({
        where: { id, deletedAt: null },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (application.status === data.status) {
        throw new BadRequestException(`Application is already ${data.status}`);
      }

      const updated = await tx.application.update({
        where: { id },
        data: { status: data.status },
      });

      await tx.statusChange.create({
        data: {
          applicationId: id,
          fromStatus: application.status,
          toStatus: data.status,
          note: data.note,
        },
      });

      return updated;
    });
  }

  private toCreateInput(data: CreateApplicationDto): Prisma.ApplicationUncheckedCreateInput {
    return {
      companyId: data.companyId,
      jobTitle: data.jobTitle,
      jobPostingUrl: data.jobPostingUrl,
      status: data.status,
      appliedAt: data.appliedAt ? new Date(data.appliedAt) : undefined,
      employmentType: data.employmentType,
      workMode: data.workMode,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      nextActionAt: data.nextActionAt ? new Date(data.nextActionAt) : undefined,
      priority: data.priority,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      salaryCurrency: data.salaryCurrency,
      jobDescriptionSnapshot: data.jobDescriptionSnapshot,
      source: data.source,
    };
  }

  private toUpdateInput(data: UpdateApplicationDto): Prisma.ApplicationUpdateInput {
    return {
      company: data.companyId ? { connect: { id: data.companyId } } : undefined,
      jobTitle: data.jobTitle,
      jobPostingUrl: data.jobPostingUrl,
      status: data.status,
      appliedAt: data.appliedAt ? new Date(data.appliedAt) : undefined,
      employmentType: data.employmentType,
      workMode: data.workMode,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      nextActionAt: data.nextActionAt ? new Date(data.nextActionAt) : undefined,
      priority: data.priority,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      salaryCurrency: data.salaryCurrency,
      jobDescriptionSnapshot: data.jobDescriptionSnapshot,
      source: data.source,
    };
  }
}

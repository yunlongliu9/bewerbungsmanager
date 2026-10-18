import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { QueryNotesDto } from './dto/query-notes.dto.js';
import { UpdateNoteDto } from './dto/update-note.dto.js';

@Injectable()
export class NotesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(data: CreateNoteDto) {
    const parentCount = [
      data.companyId,
      data.applicationId,
      data.contactId,
      data.interviewId,
    ].filter(Boolean).length;

    if (parentCount !== 1) {
      throw new BadRequestException('A note must reference exactly one parent');
    }

    await this.ensureParentExists(data);

    return this.prisma.note.create({
      data: {
        companyId: data.companyId,
        applicationId: data.applicationId,
        contactId: data.contactId,
        interviewId: data.interviewId,
        text: data.text,
      },
    });
  }

  async findAll(query: QueryNotesDto) {
    const where: Prisma.NoteWhereInput = {
      deletedAt: null,
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...(query.applicationId ? { applicationId: query.applicationId } : {}),
      ...(query.contactId ? { contactId: query.contactId } : {}),
      ...(query.interviewId ? { interviewId: query.interviewId } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.note.findMany({
        where,
        include: {
          company: true,
          application: true,
          contact: true,
          interview: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.note.count({ where }),
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
    const note = await this.prisma.note.findFirst({
      where: { id, deletedAt: null },
      include: {
        company: true,
        application: true,
        contact: true,
        interview: true,
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  async update(id: string, data: UpdateNoteDto) {
    await this.findOne(id);
    return this.prisma.note.update({
      where: { id },
      data: { text: data.text },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.note.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async ensureParentExists(data: CreateNoteDto): Promise<void> {
    if (data.companyId) {
      const company = await this.prisma.company.findFirst({
        where: { id: data.companyId, deletedAt: null },
      });
      if (!company) {
        throw new NotFoundException('Company not found');
      }
    }

    if (data.applicationId) {
      const application = await this.prisma.application.findFirst({
        where: { id: data.applicationId, deletedAt: null },
      });
      if (!application) {
        throw new NotFoundException('Application not found');
      }
    }

    if (data.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: { id: data.contactId, deletedAt: null },
      });
      if (!contact) {
        throw new NotFoundException('Contact not found');
      }
    }

    if (data.interviewId) {
      const interview = await this.prisma.interview.findFirst({
        where: { id: data.interviewId, deletedAt: null },
      });
      if (!interview) {
        throw new NotFoundException('Interview not found');
      }
    }
  }
}

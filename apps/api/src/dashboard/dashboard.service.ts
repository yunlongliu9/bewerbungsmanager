import { Inject, Injectable } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

const ACTIVE_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.WISHLIST,
  ApplicationStatus.APPLIED,
  ApplicationStatus.SCREENING,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER,
];

@Injectable()
export class DashboardService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const activeWhere = {
      deletedAt: null,
      status: { in: ACTIVE_STATUSES },
    };

    const [
      activeApplicationCount,
      groupedApplications,
      upcomingInterviews,
      recentlyUpdatedApplications,
      dueFollowUps,
      overdueFollowUps,
    ] = await Promise.all([
      this.prisma.application.count({ where: activeWhere }),
      this.prisma.application.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.interview.findMany({
        where: {
          deletedAt: null,
          scheduledAt: { gte: now },
        },
        include: {
          application: { include: { company: true } },
          contact: true,
        },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
      }),
      this.prisma.application.findMany({
        where: { deletedAt: null },
        include: { company: true },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      this.prisma.application.findMany({
        where: {
          deletedAt: null,
          status: { in: ACTIVE_STATUSES },
          nextActionAt: {
            gte: now,
            lte: nextWeek,
          },
        },
        include: { company: true },
        orderBy: { nextActionAt: 'asc' },
        take: 20,
      }),
      this.prisma.application.findMany({
        where: {
          deletedAt: null,
          status: { in: ACTIVE_STATUSES },
          nextActionAt: { lt: now },
        },
        include: { company: true },
        orderBy: { nextActionAt: 'asc' },
        take: 20,
      }),
    ]);

    const applicationsByStatus = Object.fromEntries(
      Object.values(ApplicationStatus).map((status) => [status, 0]),
    );

    for (const group of groupedApplications) {
      applicationsByStatus[group.status] = group._count._all;
    }

    return {
      activeApplicationCount,
      applicationsByStatus,
      upcomingInterviews,
      recentlyUpdatedApplications,
      dueFollowUps,
      overdueFollowUps,
    };
  }
}

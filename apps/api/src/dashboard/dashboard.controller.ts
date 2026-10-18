import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { OwnerAuthGuard } from '../auth/owner.guard.js';
import { DashboardService } from './dashboard.service.js';

@UseGuards(OwnerAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard() {
    return this.dashboardService.getDashboard();
  }
}

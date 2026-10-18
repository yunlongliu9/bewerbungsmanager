import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OwnerAuthGuard } from '../auth/owner.guard.js';
import { validationPipeFor } from '../common/validation-pipes.js';
import { ApplicationsService } from './applications.service.js';
import { ChangeStatusDto } from './dto/change-status.dto.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import { QueryApplicationsDto } from './dto/query-applications.dto.js';
import { UpdateApplicationDto } from './dto/update-application.dto.js';

@UseGuards(OwnerAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(
    @Inject(ApplicationsService) private readonly applicationsService: ApplicationsService,
  ) {}

  @Post()
  create(
    @Body(validationPipeFor(CreateApplicationDto)) createApplicationDto: CreateApplicationDto,
  ) {
    return this.applicationsService.create(createApplicationDto);
  }

  @Get()
  findAll(@Query(validationPipeFor(QueryApplicationsDto)) query: QueryApplicationsDto) {
    return this.applicationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(validationPipeFor(UpdateApplicationDto)) updateApplicationDto: UpdateApplicationDto,
  ) {
    return this.applicationsService.update(id, updateApplicationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.applicationsService.remove(id);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.applicationsService.archive(id);
  }

  @Post(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body(validationPipeFor(ChangeStatusDto)) changeStatusDto: ChangeStatusDto,
  ) {
    return this.applicationsService.changeStatus(id, changeStatusDto);
  }
}

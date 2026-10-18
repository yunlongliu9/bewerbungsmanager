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
import { CompaniesService } from './companies.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { QueryCompaniesDto } from './dto/query-companies.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';

@UseGuards(OwnerAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(@Inject(CompaniesService) private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body(validationPipeFor(CreateCompanyDto)) createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  findAll(@Query(validationPipeFor(QueryCompaniesDto)) query: QueryCompaniesDto) {
    return this.companiesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(validationPipeFor(UpdateCompanyDto)) updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.companiesService.archive(id);
  }
}

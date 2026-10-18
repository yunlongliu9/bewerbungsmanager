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
import { CreateInterviewDto } from './dto/create-interview.dto.js';
import { QueryInterviewsDto } from './dto/query-interviews.dto.js';
import { UpdateInterviewDto } from './dto/update-interview.dto.js';
import { InterviewsService } from './interviews.service.js';

@UseGuards(OwnerAuthGuard)
@Controller('interviews')
export class InterviewsController {
  constructor(@Inject(InterviewsService) private readonly interviewsService: InterviewsService) {}

  @Post()
  create(@Body(validationPipeFor(CreateInterviewDto)) createInterviewDto: CreateInterviewDto) {
    return this.interviewsService.create(createInterviewDto);
  }

  @Get()
  findAll(@Query(validationPipeFor(QueryInterviewsDto)) query: QueryInterviewsDto) {
    return this.interviewsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.interviewsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(validationPipeFor(UpdateInterviewDto)) updateInterviewDto: UpdateInterviewDto,
  ) {
    return this.interviewsService.update(id, updateInterviewDto);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.interviewsService.cancel(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.interviewsService.remove(id);
  }
}

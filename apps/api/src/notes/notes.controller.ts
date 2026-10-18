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
import { CreateNoteDto } from './dto/create-note.dto.js';
import { QueryNotesDto } from './dto/query-notes.dto.js';
import { UpdateNoteDto } from './dto/update-note.dto.js';
import { NotesService } from './notes.service.js';

@UseGuards(OwnerAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(@Inject(NotesService) private readonly notesService: NotesService) {}

  @Post()
  create(@Body(validationPipeFor(CreateNoteDto)) createNoteDto: CreateNoteDto) {
    return this.notesService.create(createNoteDto);
  }

  @Get()
  findAll(@Query(validationPipeFor(QueryNotesDto)) query: QueryNotesDto) {
    return this.notesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(validationPipeFor(UpdateNoteDto)) updateNoteDto: UpdateNoteDto,
  ) {
    return this.notesService.update(id, updateNoteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notesService.remove(id);
  }
}

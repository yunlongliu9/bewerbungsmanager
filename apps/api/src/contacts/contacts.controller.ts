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
import { ContactsService } from './contacts.service.js';
import { CreateContactDto } from './dto/create-contact.dto.js';
import { QueryContactsDto } from './dto/query-contacts.dto.js';
import { UpdateContactDto } from './dto/update-contact.dto.js';

@UseGuards(OwnerAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(@Inject(ContactsService) private readonly contactsService: ContactsService) {}

  @Post()
  create(@Body(validationPipeFor(CreateContactDto)) createContactDto: CreateContactDto) {
    return this.contactsService.create(createContactDto);
  }

  @Get()
  findAll(@Query(validationPipeFor(QueryContactsDto)) query: QueryContactsDto) {
    return this.contactsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(validationPipeFor(UpdateContactDto)) updateContactDto: UpdateContactDto,
  ) {
    return this.contactsService.update(id, updateContactDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }
}

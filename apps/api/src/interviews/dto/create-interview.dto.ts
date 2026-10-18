import { InterviewFormat } from '@prisma/client';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateInterviewDto {
  @IsString()
  @IsNotEmpty()
  applicationId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  contactId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  interviewerName?: string;

  @IsOptional()
  @IsEnum(InterviewFormat)
  format?: InterviewFormat;

  @IsISO8601()
  scheduledAt!: string;
}

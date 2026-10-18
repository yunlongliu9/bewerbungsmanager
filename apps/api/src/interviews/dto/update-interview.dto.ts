import { InterviewFormat } from '@prisma/client';
import { IsEnum, IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateInterviewDto {
  @IsOptional()
  @IsString()
  applicationId?: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  interviewerName?: string;

  @IsOptional()
  @IsEnum(InterviewFormat)
  format?: InterviewFormat;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;
}

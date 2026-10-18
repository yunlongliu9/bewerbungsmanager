import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryNotesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  companyId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  applicationId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  contactId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  interviewId?: string;
}

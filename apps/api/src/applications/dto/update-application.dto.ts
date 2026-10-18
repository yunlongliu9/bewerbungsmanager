import { EmploymentType, Priority, WorkMode } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateApplicationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  companyId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  jobTitle?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(1000)
  jobPostingUrl?: string;

  @IsOptional()
  @IsISO8601()
  appliedAt?: string;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsEnum(WorkMode)
  workMode?: WorkMode;

  @IsOptional()
  @IsISO8601()
  deadline?: string;

  @IsOptional()
  @IsISO8601()
  nextActionAt?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000000)
  salaryMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000000)
  salaryMax?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  salaryCurrency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  jobDescriptionSnapshot?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  source?: string;
}

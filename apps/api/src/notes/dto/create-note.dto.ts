import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateNoteDto {
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

  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  text!: string;
}

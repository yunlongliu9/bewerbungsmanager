import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  text!: string;
}

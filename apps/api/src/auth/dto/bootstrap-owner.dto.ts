import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class BootstrapOwnerDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(200)
  password!: string;
}

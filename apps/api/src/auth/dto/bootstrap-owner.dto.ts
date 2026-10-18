import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class BootstrapOwnerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  username!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsString()
  @MinLength(6)
  @MaxLength(200)
  password!: string;
}

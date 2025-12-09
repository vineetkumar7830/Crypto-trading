import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;


}

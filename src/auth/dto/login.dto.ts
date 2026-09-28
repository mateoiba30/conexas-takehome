import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@conexa.com' })
  @IsNotEmpty({ message: 'email is required' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin1234' })
  @IsNotEmpty({ message: 'password is required' })
  @IsString()
  @MinLength(1)
  password: string;
}

import { IsEmail, IsString, MinLength, Matches, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Luke' })
  @IsNotEmpty({ message: 'name is required' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Skywalker' })
  @IsNotEmpty({ message: 'lastname is required' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastname: string;

  @ApiProperty({ example: 'luke@rebellion.com' })
  @IsNotEmpty({ message: 'email is required' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'TheForce1',
    description: 'Minimum 8 characters, at least one uppercase letter and one number',
  })
  @IsNotEmpty({ message: 'password is required' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'password must contain at least one uppercase letter and one number',
  })
  password: string;
}

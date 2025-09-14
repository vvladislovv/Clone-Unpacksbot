import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Email, username, or phone' })
  @IsString()
  @MinLength(1)
  identifier: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  password: string;
}



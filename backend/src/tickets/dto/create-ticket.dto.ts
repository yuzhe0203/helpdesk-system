import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ example: 'Issue with login' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'I am unable to log in with my credentials...' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(5000)
  description: string;
}
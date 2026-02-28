import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(5000)
  description: string;
}
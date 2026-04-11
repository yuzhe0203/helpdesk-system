import { IsNotEmpty, IsString, } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCommentDto {
    @ApiProperty({ example: 'This is a comment.' })
    @IsNotEmpty()
    @IsString()
    content: string;
}
import { IsOptional, IsInt, Max, Min, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import { TicketStatus } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class ListTicketsDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    @ApiProperty({ example: 1, description: 'The page number for pagination' })
    page?: 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    @ApiProperty({ example: 10, description: 'The number of tickets to return per page (max 100)' })
    limit?: 10;

    @IsOptional()
    @IsEnum(TicketStatus)
    @ApiProperty({ example: 'OPEN', description: 'Filter tickets by status', enum: TicketStatus })
    status?: TicketStatus;
}
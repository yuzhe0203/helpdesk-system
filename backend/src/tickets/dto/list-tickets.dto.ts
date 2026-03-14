import { IsOptional, IsInt, Max, Min, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import { TicketStatus } from "@prisma/client";

export class ListTicketsDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: 10;

    @IsOptional()
    @IsEnum(TicketStatus)
    status?: TicketStatus;
}
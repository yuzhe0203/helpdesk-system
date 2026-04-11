import { IsEnum } from "class-validator";
import { TicketStatus } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateTicketStatusDto {
    @ApiProperty({ example: 'OPEN', description: 'The new status of the ticket', enum: TicketStatus })
    @IsEnum(TicketStatus)
    status: TicketStatus;
}
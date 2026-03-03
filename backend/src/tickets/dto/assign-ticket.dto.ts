import { IsUUID } from "class-validator";

export class AssignTicketDto {
    @IsUUID('4')
    assigneeId: string;
}
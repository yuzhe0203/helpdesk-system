import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketsService } from './tickets.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('tickets')
export class TicketsController {
    constructor(private PrismaService: PrismaService, private ticketsService: TicketsService) {}

    @UseGuards(AccessTokenGuard, RolesGuard)
    @Roles('USER')
    @Post()
    create(
        @Body() createTicketDto: CreateTicketDto,
        @CurrentUser() user: any,
    ) {
        return this.ticketsService.create(createTicketDto, user.userId);
    }

    @UseGuards(AccessTokenGuard)
    @Get()
    findAllForUser(@CurrentUser() user: any) {
        return this.ticketsService.findAllForUser(user.userId, user.role);
    }
}

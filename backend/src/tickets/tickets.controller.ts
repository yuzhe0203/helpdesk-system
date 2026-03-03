import { Body, Controller, Get, Param, Post, UseGuards, ParseUUIDPipe, Patch } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { TicketsService } from './tickets.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Controller('tickets')
export class TicketsController {
  constructor(
    private PrismaService: PrismaService,
    private ticketsService: TicketsService,
  ) {}

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('USER')
  @Post()
  create(@Body() createTicketDto: CreateTicketDto, @CurrentUser() user: any) {
    return this.ticketsService.create(createTicketDto, user.userId);
  }

  @UseGuards(AccessTokenGuard)
  @Get()
  findAllForUser(@CurrentUser() user: any) {
    return this.ticketsService.findAllForUser(user.userId, user.role);
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id')
  getOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @CurrentUser() user: any) {
    return this.ticketsService.findByIdWithScope(id, user.userId, user.role);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @Patch(':id/assign')
  assign(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() assignTicketDto: AssignTicketDto, @CurrentUser() user: any) {
    return this.ticketsService.assign(id, assignTicketDto, { userId: user.userId, role: user.role });
  }
}

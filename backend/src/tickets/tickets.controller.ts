import { Body, Controller, Get, Param, Post, UseGuards, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListTicketsDto } from './dto/list-tickets.dto';
import { TicketsService } from './tickets.service';
import { UserRole } from '@prisma/client';
import { CurrentUserPayload } from 'src/common/types/user.types';


@ApiTags('tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(
    private ticketsService: TicketsService,
  ) {}

  // Create a new ticket
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden — only USER role can create tickets' })
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('USER')
  @Post()
  create(@Body() createTicketDto: CreateTicketDto, @CurrentUser() user: CurrentUserPayload) {
    return this.ticketsService.create(createTicketDto, user.userId);
  }

  // Get all tickets for the current user (or all if admin/agent)
  @ApiOperation({ summary: 'List tickets (filtered by caller role)' })
  @ApiResponse({ status: 200, description: 'Paginated ticket list' })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing token' })
  @UseGuards(AccessTokenGuard)
  @Get()
  getTickets(@Query() query: ListTicketsDto, @CurrentUser() user: CurrentUserPayload) {
    return this.ticketsService.findAllForUser(user.userId, user.role, query);
  }

  // Get a specific ticket by ID with access control
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiResponse({ status: 200, description: 'Ticket with comments and relationships' })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @UseGuards(AccessTokenGuard)
  @Get(':id')
  getOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.ticketsService.findByIdWithScope(id, user.userId, user.role);
  }

  // Assign a ticket
  @ApiOperation({ summary: 'Assign ticket to an agent (ADMIN/AGENT only)' })
  @ApiResponse({ status: 200, description: 'Ticket assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid assignee or ticket is CLOSED' })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN or AGENT role required' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @Patch(':id/assign')
  assign(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, 
    @Body() assignTicketDto: AssignTicketDto, 
    @CurrentUser() user: CurrentUserPayload) {
    return this.ticketsService.assign(id, assignTicketDto, { userId: user.userId, role: user.role });
  }

  // Update ticket status
  @ApiOperation({ summary: 'Update ticket status (ADMIN/AGENT only)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN or AGENT role required' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, 
    @Body() updateTicketStatusDto: UpdateTicketStatusDto,
    @CurrentUser() user: CurrentUserPayload){
    return this.ticketsService.updateStatus(id, updateTicketStatusDto, { userId: user.userId, role: user.role });
  }

  // Create comment
  @ApiOperation({ summary: 'Add a comment to a ticket' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Comment content cannot be empty' })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @UseGuards(AccessTokenGuard)
  @Post(':id/comments')
  addComment(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() CreateCommentDto: CreateCommentDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.ticketsService.createComment(id, CreateCommentDto, user);
  }

  // Get comments for a ticket
  @ApiOperation({ summary: 'Get all comments for a ticket' })
  @ApiResponse({ status: 200, description: 'List of comments ordered by createdAt' })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @UseGuards(AccessTokenGuard)
  @Get(':id/comments')
  getComments(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.ticketsService.getComments(id, user);
  }
}

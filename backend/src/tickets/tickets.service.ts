import { BadRequestException, Injectable, NotFoundException, } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListTicketsDto } from './dto/list-tickets.dto';
import { TicketStatus, UserRole } from '@prisma/client';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import e from 'express';


@Injectable()
export class TicketsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createTicketDto: CreateTicketDto, creatorId: string) {
    return this.prismaService.ticket.create({
      data: {
        title: createTicketDto.title,
        description: createTicketDto.description,
        creatorId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        creatorId: true,
        assigneeId: true,
        createdAt: true,
      },
    });
  }

  async findAllForUser(userId: string, role: UserRole, query: ListTicketsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where : any = {};

    if (role === UserRole.USER) {
      where.creatorId = userId;
    }
    else if (role === UserRole.AGENT) {
      where.assigneeId = userId;
    }
    else if (role === UserRole.ADMIN) {
      // no additional filter
    }

    if (query.status) {
      where.status = query.status;
    }

    const total = await this.prismaService.ticket.count({ where });

    const tickets = await this.prismaService.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        creatorId: true,
        assigneeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      data: tickets,
    }
  }

  async findByIdWithScope(ticketId: string, userId: string, role: UserRole) {
    const where =
      role === UserRole.USER
        ? { id: ticketId, creatorId: userId }
        : { id: ticketId };

    const ticket = await this.prismaService.ticket.findFirst({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        creatorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async assign(
    ticketId: string,
    assignTicketDto: AssignTicketDto,
    actor: { userId: string; role: UserRole },
  ) {
    // Check if the ticket exists
    const ticket = await this.prismaService.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true },
    });

    // If the ticket doesn't exist, throw a 404 error
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // If the ticket is closed, throw a 404 error (to avoid information leakage about the existence of the ticket)
    if (ticket.status === 'CLOSED') {
      throw new BadRequestException('Cannot assign a closed ticket');
    }

    const assignee = await this.prismaService.user.findUnique({
      where: { id: assignTicketDto.assigneeId },
      select: { id: true, role: true },
    });

    if (!assignee) {
      throw new BadRequestException('Assignee not found');
    }

    if (assignee.role !== UserRole.AGENT) {
      throw new BadRequestException('Assignee must be an agent');
    }

    // udate the ticket with the new assignee
    const data: any = {
      assigneeId: assignTicketDto.assigneeId,
    };

    // If the ticket is being assigned for the first time, change the status to IN_PROGRESS
    if (ticket.status === 'OPEN') {
      data.status = 'IN_PROGRESS';
    }

    const updatedTicket = await this.prismaService.ticket.update({
      where: { id: ticketId },
      data,
      select: {
        id: true,
        status: true,
        assigneeId: true,
        creatorId: true,
        updatedAt: true,
      },
    });

    return updatedTicket;
  }

  async updateStatus(
    ticketId: string,
    UpdateTicketStatusDto: UpdateTicketStatusDto,
    currentUser: { userId: string; role: UserRole },
  ) {
    const where =
      currentUser.role === UserRole.ADMIN
        ? { id: ticketId }
        : { id: ticketId, assigneeId: currentUser.userId };

    const ticket = await this.prismaService.ticket.findFirst({
      where,
      select: { id: true, status: true, assigneeId: true },
    });

    // If the ticket doesn't exist or the user doesn't have permission to update it, throw a 404 error
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const current = ticket.status;
    const next = UpdateTicketStatusDto.status;

    if (next === current) {
      throw new BadRequestException(`Ticket is already in status ${current}`);
    }

    const allowed: Record<TicketStatus, TicketStatus[]> = {
      [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS],
      [TicketStatus.IN_PROGRESS]: [TicketStatus.RESOLVED],
      [TicketStatus.RESOLVED]: [TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
      [TicketStatus.CLOSED]: [],
    };

    const ok = allowed[current]?.includes(next) ?? false;
    if (!ok) {
      throw new BadRequestException(
        `Valid status transitions: ${current} -> ${next}`,
      );
    }

    const updatedTicket = await this.prismaService.ticket.update({
      where: { id: ticketId },
      data: { status: next },
      select: {
        id: true,
        status: true,
        assigneeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return updatedTicket;
  }

  private async findAccessibleTicketOrThrow(ticketId: string, currentUser: any) {
    let where: any;

    if (currentUser.role === UserRole.USER) {
      where = { id: ticketId, creatorId: currentUser.userId };
    }
    else if (currentUser.role === UserRole.AGENT) {
      where = { id: ticketId, assigneeId: currentUser.userId };
    }
    else if (currentUser.role === UserRole.ADMIN) {
      where = { id: ticketId };
    }
    else {
      throw new NotFoundException('Ticket not found');
    }

    const ticket = await this.prismaService.ticket.findFirst({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        creatorId: true,
      }
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async createComment( ticketId: string, CreateCommentDto: CreateCommentDto, currentUser: any) {
    await this.findAccessibleTicketOrThrow(ticketId, currentUser);

    if (CreateCommentDto.content.trim() === '') {
      throw new BadRequestException('Comment content cannot be empty');
    }

    const comment = await this.prismaService.comment.create({
      data: {
        ticketId,
        content: CreateCommentDto.content.trim(),
        authorId: currentUser.userId,
      }
    });

    return comment;
  }

  async getComments(ticketId: string, currentUser: any) {
    await this.findAccessibleTicketOrThrow(ticketId, currentUser);

    const comments = await this.prismaService.comment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });

    return comments;
  }
}

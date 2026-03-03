import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { User, UserRole } from '@prisma/client';

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

  async findAllForUser(userId: string, role: UserRole) {
    const where = role === UserRole.USER ? { creatorId: userId } : {};

    return this.prismaService.ticket.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
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

  async assign(ticketId: string, assignTicketDto: AssignTicketDto, actor: { userId: string , role: UserRole }) {
    // Check if the ticket exists
    const ticket = await this.prismaService.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true },
    })

    // If the ticket doesn't exist, throw a 404 error
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // If the ticket is closed, throw a 404 error (to avoid information leakage about the existence of the ticket)
    if(ticket.status === 'CLOSED') {
      throw new BadRequestException('Cannot assign a closed ticket');
    }

    const assignee = await this.prismaService.user.findUnique({
      where: { id: assignTicketDto.assigneeId },
      select: { id: true, role: true },
    });

    if (!assignee) {
      throw new BadRequestException('Assignee not found');
    }

    if(assignee.role !== UserRole.AGENT) {
      throw new BadRequestException('Assignee must be an agent');
    }

    // udate the ticket with the new assignee
    const data: any = {
      assigneeId: assignTicketDto.assigneeId,
    }

    // If the ticket is being assigned for the first time, change the status to IN_PROGRESS
    if(ticket.status === 'OPEN') {
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
      }
    });

    return updatedTicket;
  }
}

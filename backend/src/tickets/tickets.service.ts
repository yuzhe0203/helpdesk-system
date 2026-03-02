import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
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
}

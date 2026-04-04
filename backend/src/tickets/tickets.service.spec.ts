import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload, UserRole } from 'src/common/types/user.types';
import { TicketsService } from './tickets.service';

const mockPrismaService = {
  ticket: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  comment: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

const adminUser: CurrentUserPayload = {
  userId: 'admin-id',
  role: UserRole.ADMIN,
};

const agentUser: CurrentUserPayload = {
  userId: 'agent-id',
  role: UserRole.AGENT,
};

const regularUser: CurrentUserPayload = {
  userId: 'user-id',
  role: UserRole.USER,
};

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    jest.clearAllMocks();
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should call prisma.ticket.create and return the result', async () => {
      const dto = { title: 'Test ticket', description: 'Detailed description' };
      const created = { id: 'ticket-1', ...dto, status: 'OPEN', creatorId: 'user-id' };
      mockPrismaService.ticket.create.mockResolvedValue(created);

      const result = await service.create(dto, 'user-id');

      expect(mockPrismaService.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { title: dto.title, description: dto.description, creatorId: 'user-id' },
        }),
      );
      expect(result).toEqual(created);
    });
  });

  // ─── findAllForUser ──────────────────────────────────────────────────────────

  describe('findAllForUser', () => {
    beforeEach(() => {
      mockPrismaService.ticket.count.mockResolvedValue(0);
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
    });

    it('should filter by creatorId for USER role', async () => {
      await service.findAllForUser('user-id', UserRole.USER, {});

      expect(mockPrismaService.ticket.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ creatorId: 'user-id' }),
        }),
      );
    });

    it('should filter by assigneeId OR unassigned for AGENT role', async () => {
      await service.findAllForUser('agent-id', UserRole.AGENT, {});

      expect(mockPrismaService.ticket.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ assigneeId: 'agent-id' }, { assigneeId: null }],
          }),
        }),
      );
    });

    it('should apply no role-based filter for ADMIN role', async () => {
      await service.findAllForUser('admin-id', UserRole.ADMIN, {});

      expect(mockPrismaService.ticket.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('should include status in where when provided', async () => {
      await service.findAllForUser('admin-id', UserRole.ADMIN, {
        status: TicketStatus.OPEN,
      });

      expect(mockPrismaService.ticket.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: TicketStatus.OPEN }),
        }),
      );
    });

    it('should return paginated structure', async () => {
      mockPrismaService.ticket.count.mockResolvedValue(25);
      mockPrismaService.ticket.findMany.mockResolvedValue([{ id: 't1' }]);

      const result = await service.findAllForUser('admin-id', UserRole.ADMIN, {
        page: 2,
        limit: 10,
      } as any);

      expect(result).toMatchObject({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        data: [{ id: 't1' }],
      });
    });
  });

  // ─── findByIdWithScope ───────────────────────────────────────────────────────

  describe('findByIdWithScope', () => {
    it('should include creatorId in where clause for USER role', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue({ id: 'ticket-1' });

      await service.findByIdWithScope('ticket-1', 'user-id', UserRole.USER);

      expect(mockPrismaService.ticket.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ticket-1', creatorId: 'user-id' },
        }),
      );
    });

    it('should only use id in where clause for ADMIN role', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue({ id: 'ticket-1' });

      await service.findByIdWithScope('ticket-1', 'admin-id', UserRole.ADMIN);

      expect(mockPrismaService.ticket.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ticket-1' },
        }),
      );
    });

    it('should throw NotFoundException if ticket is not found', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);

      await expect(
        service.findByIdWithScope('missing-id', 'user-id', UserRole.USER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── assign ─────────────────────────────────────────────────────────────────

  describe('assign', () => {
    const assignDto = { assigneeId: 'agent-uuid' };
    const actor = { userId: 'admin-id', role: UserRole.ADMIN };

    it('should throw NotFoundException if ticket does not exist', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(null);

      await expect(
        service.assign('missing-ticket', assignDto, actor),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if ticket is CLOSED', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        id: 'ticket-1',
        status: TicketStatus.CLOSED,
        assigneeId: null,
      });

      await expect(
        service.assign('ticket-1', assignDto, actor),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if assignee does not exist', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        id: 'ticket-1',
        status: TicketStatus.OPEN,
        assigneeId: null,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.assign('ticket-1', assignDto, actor),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if assignee is not AGENT role', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        id: 'ticket-1',
        status: TicketStatus.OPEN,
        assigneeId: null,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'agent-uuid',
        role: UserRole.USER,
      });

      await expect(
        service.assign('ticket-1', assignDto, actor),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set status to IN_PROGRESS when assigning an OPEN ticket', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        id: 'ticket-1',
        status: TicketStatus.OPEN,
        assigneeId: null,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'agent-uuid',
        role: UserRole.AGENT,
      });
      const updated = { id: 'ticket-1', status: TicketStatus.IN_PROGRESS, assigneeId: 'agent-uuid' };
      mockPrismaService.ticket.update.mockResolvedValue(updated);

      const result = await service.assign('ticket-1', assignDto, actor);

      expect(mockPrismaService.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assigneeId: 'agent-uuid',
            status: TicketStatus.IN_PROGRESS,
          }),
        }),
      );
      expect(result.status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('should set status to IN_PROGRESS when reassigning to a different agent', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        id: 'ticket-1',
        status: TicketStatus.IN_PROGRESS,
        assigneeId: 'old-agent-id',
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'agent-uuid',
        role: UserRole.AGENT,
      });
      mockPrismaService.ticket.update.mockResolvedValue({
        id: 'ticket-1',
        status: TicketStatus.IN_PROGRESS,
        assigneeId: 'agent-uuid',
      });

      await service.assign('ticket-1', assignDto, actor);

      expect(mockPrismaService.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: TicketStatus.IN_PROGRESS }),
        }),
      );
    });
  });

  // ─── updateStatus ────────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('should throw NotFoundException if ticket is not found', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus(
          'missing',
          { status: TicketStatus.IN_PROGRESS },
          { userId: adminUser.userId, role: adminUser.role },
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if the status is unchanged', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue({
        id: 'ticket-1',
        status: TicketStatus.OPEN,
        assigneeId: null,
      });

      await expect(
        service.updateStatus(
          'ticket-1',
          { status: TicketStatus.OPEN },
          { userId: adminUser.userId, role: adminUser.role },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for an invalid status transition', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue({
        id: 'ticket-1',
        status: TicketStatus.OPEN,
        assigneeId: null,
      });

      await expect(
        service.updateStatus(
          'ticket-1',
          { status: TicketStatus.CLOSED },
          { userId: adminUser.userId, role: adminUser.role },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update status for a valid transition (OPEN → IN_PROGRESS)', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue({
        id: 'ticket-1',
        status: TicketStatus.OPEN,
        assigneeId: 'agent-id',
      });
      const updated = { id: 'ticket-1', status: TicketStatus.IN_PROGRESS };
      mockPrismaService.ticket.update.mockResolvedValue(updated);

      const result = await service.updateStatus(
        'ticket-1',
        { status: TicketStatus.IN_PROGRESS },
        { userId: agentUser.userId, role: agentUser.role },
      );

      expect(mockPrismaService.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: TicketStatus.IN_PROGRESS },
        }),
      );
      expect(result.status).toBe(TicketStatus.IN_PROGRESS);
    });
  });

  // ─── createComment ───────────────────────────────────────────────────────────

  describe('createComment', () => {
    it('should throw BadRequestException if content is empty or whitespace', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue({ id: 'ticket-1' });

      await expect(
        service.createComment('ticket-1', { content: '   ' }, regularUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if the ticket is not accessible', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);

      await expect(
        service.createComment('ticket-1', { content: 'Hello' }, regularUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return the created comment on success', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue({ id: 'ticket-1' });
      const newComment = {
        id: 'comment-1',
        content: 'Hello',
        ticketId: 'ticket-1',
        authorId: regularUser.userId,
        createdAt: new Date(),
        author: { id: regularUser.userId, email: 'user@example.com', role: 'USER' },
      };
      mockPrismaService.comment.create.mockResolvedValue(newComment);

      const result = await service.createComment(
        'ticket-1',
        { content: 'Hello' },
        regularUser,
      );

      expect(mockPrismaService.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            ticketId: 'ticket-1',
            content: 'Hello',
            authorId: regularUser.userId,
          },
        }),
      );
      expect(result).toEqual(newComment);
    });
  });

  // ─── getComments ─────────────────────────────────────────────────────────────

  describe('getComments', () => {
    it('should throw NotFoundException if the ticket is not accessible', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);

      await expect(
        service.getComments('ticket-1', regularUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return the list of comments ordered by createdAt', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue({ id: 'ticket-1' });
      const comments = [{ id: 'c1', content: 'First' }, { id: 'c2', content: 'Second' }];
      mockPrismaService.comment.findMany.mockResolvedValue(comments);

      const result = await service.getComments('ticket-1', regularUser);

      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ticketId: 'ticket-1' },
          orderBy: { createdAt: 'asc' },
        }),
      );
      expect(result).toEqual(comments);
    });
  });
});

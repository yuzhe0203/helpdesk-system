import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { CurrentUserPayload, UserRole } from 'src/common/types/user.types';

const mockTicketsService = {
  create: jest.fn(),
  findAllForUser: jest.fn(),
  findByIdWithScope: jest.fn(),
  assign: jest.fn(),
  updateStatus: jest.fn(),
  createComment: jest.fn(),
  getComments: jest.fn(),
};

const userPayload: CurrentUserPayload = {
  userId: 'user-uuid-1',
  role: UserRole.USER,
};

const adminPayload: CurrentUserPayload = {
  userId: 'admin-uuid-1',
  role: UserRole.ADMIN,
};

describe('TicketsController', () => {
  let controller: TicketsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [{ provide: TicketsService, useValue: mockTicketsService }],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
    jest.clearAllMocks();
  });

  it('should call ticketsService.create with dto and user id', async () => {
    const dto = { title: 'Test', description: 'Description here' };
    mockTicketsService.create.mockResolvedValue({ id: 'ticket-1' });

    await controller.create(dto, userPayload);

    expect(mockTicketsService.create).toHaveBeenCalledWith(dto, userPayload.userId);
  });

  it('should call ticketsService.findAllForUser with query and user info', async () => {
    const query = { page: 1, limit: 10 } as any;
    mockTicketsService.findAllForUser.mockResolvedValue({ data: [], total: 0 });

    await controller.getTickets(query, userPayload);

    expect(mockTicketsService.findAllForUser).toHaveBeenCalledWith(
      userPayload.userId,
      userPayload.role,
      query,
    );
  });

  it('should call ticketsService.findByIdWithScope with id and user info', async () => {
    mockTicketsService.findByIdWithScope.mockResolvedValue({ id: 'ticket-1' });

    await controller.getOne('ticket-uuid-1', userPayload);

    expect(mockTicketsService.findByIdWithScope).toHaveBeenCalledWith(
      'ticket-uuid-1',
      userPayload.userId,
      userPayload.role,
    );
  });

  it('should call ticketsService.assign with id, dto and actor', async () => {
    const dto = { assigneeId: 'agent-uuid' };
    mockTicketsService.assign.mockResolvedValue({ id: 'ticket-1' });

    await controller.assign('ticket-uuid-1', dto, adminPayload);

    expect(mockTicketsService.assign).toHaveBeenCalledWith(
      'ticket-uuid-1',
      dto,
      { userId: adminPayload.userId, role: adminPayload.role },
    );
  });

  it('should call ticketsService.updateStatus with id, dto and actor', async () => {
    const dto = { status: 'IN_PROGRESS' } as any;
    mockTicketsService.updateStatus.mockResolvedValue({ id: 'ticket-1' });

    await controller.updateStatus('ticket-uuid-1', dto, adminPayload);

    expect(mockTicketsService.updateStatus).toHaveBeenCalledWith(
      'ticket-uuid-1',
      dto,
      { userId: adminPayload.userId, role: adminPayload.role },
    );
  });

  it('should call ticketsService.createComment with id, dto and user', async () => {
    const dto = { content: 'A comment' };
    mockTicketsService.createComment.mockResolvedValue({ id: 'c1' });

    await controller.addComment('ticket-uuid-1', dto, userPayload);

    expect(mockTicketsService.createComment).toHaveBeenCalledWith(
      'ticket-uuid-1',
      dto,
      userPayload,
    );
  });

  it('should call ticketsService.getComments with id and user', async () => {
    mockTicketsService.getComments.mockResolvedValue([]);

    await controller.getComments('ticket-uuid-1', userPayload);

    expect(mockTicketsService.getComments).toHaveBeenCalledWith(
      'ticket-uuid-1',
      userPayload,
    );
  });
});

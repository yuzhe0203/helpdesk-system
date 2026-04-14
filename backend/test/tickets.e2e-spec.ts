import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase, createUser } from './helpers/db.helper';
import { UserRole, TicketStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Helper: login and return tokens
// ---------------------------------------------------------------------------
async function loginAs(
  server: any,
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await request(server)
    .post('/auth/login')
    .send({ email, password });
  return res.body;
}

describe('Tickets (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  // ---------------------------------------------------------------------------
  // POST /tickets
  // ---------------------------------------------------------------------------
  describe('POST /tickets', () => {
    it('should create a ticket when called by a USER', async () => {
      await createUser(prisma, 'user@test.com', 'password123', UserRole.USER);
      const { accessToken } = await loginAs(
        app.getHttpServer(),
        'user@test.com',
        'password123',
      );

      const res = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Login issue', description: 'Cannot login to the app' })
        .expect(201);

      expect(res.body).toMatchObject({
        title: 'Login issue',
        status: TicketStatus.OPEN,
      });
      expect(res.body.id).toBeDefined();
    });

    it('should return 403 when called by an AGENT', async () => {
      await createUser(
        prisma,
        'agent@test.com',
        'password123',
        UserRole.AGENT,
      );
      const { accessToken } = await loginAs(
        app.getHttpServer(),
        'agent@test.com',
        'password123',
      );

      await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Login issue', description: 'Cannot login to the app' })
        .expect(403);
    });

    it('should return 403 when called by an ADMIN', async () => {
      await createUser(
        prisma,
        'admin@test.com',
        'password123',
        UserRole.ADMIN,
      );
      const { accessToken } = await loginAs(
        app.getHttpServer(),
        'admin@test.com',
        'password123',
      );

      await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Login issue', description: 'Cannot login to the app' })
        .expect(403);
    });

    it('should return 401 without a token', async () => {
      await request(app.getHttpServer())
        .post('/tickets')
        .send({ title: 'Login issue', description: 'Cannot login to the app' })
        .expect(401);
    });

    it('should return 400 when title is missing', async () => {
      await createUser(prisma, 'user@test.com', 'password123', UserRole.USER);
      const { accessToken } = await loginAs(
        app.getHttpServer(),
        'user@test.com',
        'password123',
      );

      await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ description: 'No title provided' })
        .expect(400);
    });

    it('should return 400 when description is too short', async () => {
      await createUser(prisma, 'user@test.com', 'password123', UserRole.USER);
      const { accessToken } = await loginAs(
        app.getHttpServer(),
        'user@test.com',
        'password123',
      );

      await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Valid title', description: 'Hi' })
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /tickets
  // ---------------------------------------------------------------------------
  describe('GET /tickets', () => {
    it('should return only the tickets created by the current USER', async () => {
      const userA = await createUser(
        prisma,
        'usera@test.com',
        'password123',
        UserRole.USER,
      );
      await createUser(
        prisma,
        'userb@test.com',
        'password123',
        UserRole.USER,
      );

      // Create a ticket for userA via API
      const { accessToken: tokenA } = await loginAs(
        app.getHttpServer(),
        'usera@test.com',
        'password123',
      );
      await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'UserA ticket', description: 'User A description here' });

      // Create a ticket for userB via API
      const { accessToken: tokenB } = await loginAs(
        app.getHttpServer(),
        'userb@test.com',
        'password123',
      );
      await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'UserB ticket', description: 'User B description here' });

      // UserA should only see their own ticket
      const res = await request(app.getHttpServer())
        .get('/tickets')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const tickets = res.body.data ?? res.body;
      expect(Array.isArray(tickets)).toBe(true);
      expect(tickets.every((t: any) => t.creatorId === userA.id)).toBe(true);
    });

    it('should return all tickets for an AGENT', async () => {
      await createUser(
        prisma,
        'usera@test.com',
        'password123',
        UserRole.USER,
      );
      await createUser(
        prisma,
        'userb@test.com',
        'password123',
        UserRole.USER,
      );
      await createUser(
        prisma,
        'agent@test.com',
        'password123',
        UserRole.AGENT,
      );

      const { accessToken: tokenA } = await loginAs(
        app.getHttpServer(),
        'usera@test.com',
        'password123',
      );
      const { accessToken: tokenB } = await loginAs(
        app.getHttpServer(),
        'userb@test.com',
        'password123',
      );
      await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'UserA ticket', description: 'User A description here' });
      await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'UserB ticket', description: 'User B description here' });

      const { accessToken: agentToken } = await loginAs(
        app.getHttpServer(),
        'agent@test.com',
        'password123',
      );

      const res = await request(app.getHttpServer())
        .get('/tickets')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      const tickets = res.body.data ?? res.body;
      expect(tickets.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 401 without a token', async () => {
      await request(app.getHttpServer()).get('/tickets').expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /tickets/:id
  // ---------------------------------------------------------------------------
  describe('GET /tickets/:id', () => {
    it('should return a ticket by ID for its creator', async () => {
      await createUser(prisma, 'user@test.com', 'password123', UserRole.USER);
      const { accessToken } = await loginAs(
        app.getHttpServer(),
        'user@test.com',
        'password123',
      );

      const createRes = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'My ticket', description: 'My ticket description here' });

      const ticketId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .get(`/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(ticketId);
      expect(res.body.title).toBe('My ticket');
    });

    it('should return 401 without a token', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';
      await request(app.getHttpServer())
        .get(`/tickets/${fakeId}`)
        .expect(401);
    });

    it('should return 400 for a non-UUID id', async () => {
      await createUser(prisma, 'user@test.com', 'password123', UserRole.USER);
      const { accessToken } = await loginAs(
        app.getHttpServer(),
        'user@test.com',
        'password123',
      );

      await request(app.getHttpServer())
        .get('/tickets/not-a-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should return 404 for a non-existent ticket', async () => {
      await createUser(prisma, 'user@test.com', 'password123', UserRole.USER);
      const { accessToken } = await loginAs(
        app.getHttpServer(),
        'user@test.com',
        'password123',
      );

      const nonExistentId = '00000000-0000-4000-a000-000000000001';
      await request(app.getHttpServer())
        .get(`/tickets/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /tickets/:id/assign
  // ---------------------------------------------------------------------------
  describe('PATCH /tickets/:id/assign', () => {
    it('should assign a ticket when called by an AGENT', async () => {
      await createUser(prisma, 'user@test.com', 'password123', UserRole.USER);
      const agent = await createUser(
        prisma,
        'agent@test.com',
        'password123',
        UserRole.AGENT,
      );

      const { accessToken: userToken } = await loginAs(
        app.getHttpServer(),
        'user@test.com',
        'password123',
      );
      const { accessToken: agentToken } = await loginAs(
        app.getHttpServer(),
        'agent@test.com',
        'password123',
      );

      const createRes = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Assign me', description: 'Please assign this ticket' });

      const ticketId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .patch(`/tickets/${ticketId}/assign`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ assigneeId: agent.id })
        .expect(200);

      expect(res.body.assigneeId).toBe(agent.id);
    });

    it('should return 403 when called by a USER', async () => {
      const user = await createUser(
        prisma,
        'user@test.com',
        'password123',
        UserRole.USER,
      );
      const { accessToken } = await loginAs(
        app.getHttpServer(),
        'user@test.com',
        'password123',
      );

      const createRes = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Assign me', description: 'Please assign this ticket' });

      const ticketId = createRes.body.id;

      await request(app.getHttpServer())
        .patch(`/tickets/${ticketId}/assign`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ assigneeId: user.id })
        .expect(403);
    });

    it('should return 401 without a token', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';
      const fakeAssigneeId = '00000000-0000-4000-a000-000000000001';
      await request(app.getHttpServer())
        .patch(`/tickets/${fakeId}/assign`)
        .send({ assigneeId: fakeAssigneeId })
        .expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /tickets/:id/status
  // ---------------------------------------------------------------------------
  describe('PATCH /tickets/:id/status', () => {
    it('should update status when called by an AGENT', async () => {
      await createUser(prisma, 'user@test.com', 'password123', UserRole.USER);
      const agent = await createUser(
        prisma,
        'agent@test.com',
        'password123',
        UserRole.AGENT,
      );

      const { accessToken: userToken } = await loginAs(
        app.getHttpServer(),
        'user@test.com',
        'password123',
      );
      const { accessToken: agentToken } = await loginAs(
        app.getHttpServer(),
        'agent@test.com',
        'password123',
      );

      const createRes = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Status ticket',
          description: 'Please update my status',
        });

      const ticketId = createRes.body.id;

      // Assign the ticket to the agent first (AGENT can only update status of assigned tickets)
      // Note: assigning an OPEN ticket automatically transitions it to IN_PROGRESS
      await request(app.getHttpServer())
        .patch(`/tickets/${ticketId}/assign`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ assigneeId: agent.id });

      const res = await request(app.getHttpServer())
        .patch(`/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ status: TicketStatus.RESOLVED })
        .expect(200);

      expect(res.body.status).toBe(TicketStatus.RESOLVED);
    });

    it('should return 400 for invalid status value', async () => {
      await createUser(prisma, 'user@test.com', 'password123', UserRole.USER);
      await createUser(
        prisma,
        'agent@test.com',
        'password123',
        UserRole.AGENT,
      );

      const { accessToken: userToken } = await loginAs(
        app.getHttpServer(),
        'user@test.com',
        'password123',
      );
      const { accessToken: agentToken } = await loginAs(
        app.getHttpServer(),
        'agent@test.com',
        'password123',
      );

      const createRes = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Status ticket', description: 'Bad status test here' });

      const ticketId = createRes.body.id;

      await request(app.getHttpServer())
        .patch(`/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });

    it('should return 403 when called by a USER', async () => {
      await createUser(prisma, 'user@test.com', 'password123', UserRole.USER);
      const { accessToken } = await loginAs(
        app.getHttpServer(),
        'user@test.com',
        'password123',
      );

      const createRes = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Status ticket', description: 'User tries to update' });

      const ticketId = createRes.body.id;

      await request(app.getHttpServer())
        .patch(`/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: TicketStatus.IN_PROGRESS })
        .expect(403);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /tickets/:id/comments
  // ---------------------------------------------------------------------------
  describe('POST /tickets/:id/comments', () => {
    it('should add a comment when called by the ticket creator', async () => {
      await createUser(prisma, 'user@test.com', 'password123', UserRole.USER);
      const { accessToken } = await loginAs(
        app.getHttpServer(),
        'user@test.com',
        'password123',
      );

      const createRes = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Comment test',
          description: 'I need to comment on this',
        });

      const ticketId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .post(`/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'This is my first comment' })
        .expect(201);

      expect(res.body.content).toBe('This is my first comment');
    });

    it('should allow an AGENT to comment on their assigned ticket', async () => {
      await createUser(prisma, 'user@test.com', 'password123', UserRole.USER);
      const agent = await createUser(
        prisma,
        'agent@test.com',
        'password123',
        UserRole.AGENT,
      );

      const { accessToken: userToken } = await loginAs(
        app.getHttpServer(),
        'user@test.com',
        'password123',
      );
      const { accessToken: agentToken } = await loginAs(
        app.getHttpServer(),
        'agent@test.com',
        'password123',
      );

      const createRes = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Agent comment test',
          description: 'Agent will comment here',
        });

      const ticketId = createRes.body.id;

      // Assign the ticket to the agent first (AGENT can only comment on assigned tickets)
      await request(app.getHttpServer())
        .patch(`/tickets/${ticketId}/assign`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ assigneeId: agent.id });

      const res = await request(app.getHttpServer())
        .post(`/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ content: 'Agent response here' })
        .expect(201);

      expect(res.body.content).toBe('Agent response here');
    });

    it('should return 400 when content is empty', async () => {
      await createUser(prisma, 'user@test.com', 'password123', UserRole.USER);
      const { accessToken } = await loginAs(
        app.getHttpServer(),
        'user@test.com',
        'password123',
      );

      const createRes = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Empty comment', description: 'Empty comment test here' });

      const ticketId = createRes.body.id;

      await request(app.getHttpServer())
        .post(`/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '' })
        .expect(400);
    });

    it('should return 401 without a token', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';
      await request(app.getHttpServer())
        .post(`/tickets/${fakeId}/comments`)
        .send({ content: 'Anonymous comment' })
        .expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /tickets/:id/comments
  // ---------------------------------------------------------------------------
  describe('GET /tickets/:id/comments', () => {
    it('should return comments for a ticket', async () => {
      await createUser(prisma, 'user@test.com', 'password123', UserRole.USER);
      const { accessToken } = await loginAs(
        app.getHttpServer(),
        'user@test.com',
        'password123',
      );

      const createRes = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Get comments test',
          description: 'Testing get comments endpoint',
        });

      const ticketId = createRes.body.id;

      await request(app.getHttpServer())
        .post(`/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'First comment' });

      await request(app.getHttpServer())
        .post(`/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Second comment' });

      const res = await request(app.getHttpServer())
        .get(`/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('should return 401 without a token', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';
      await request(app.getHttpServer())
        .get(`/tickets/${fakeId}/comments`)
        .expect(401);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase, createUser } from './helpers/db.helper';
import { UserRole } from '@prisma/client';

describe('Users (e2e)', () => {
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
  // GET /users/agents
  // ---------------------------------------------------------------------------
  describe('GET /users/agents', () => {
    it('should return all users with AGENT role', async () => {
      await createUser(prisma, 'agent1@test.com', 'password123', UserRole.AGENT);
      await createUser(prisma, 'agent2@test.com', 'password123', UserRole.AGENT);
      await createUser(prisma, 'user@test.com', 'password123', UserRole.USER);

      // Login as a regular user to get a token
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'password123' });
      const { accessToken } = loginRes.body;

      const res = await request(app.getHttpServer())
        .get('/users/agents')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body.every((u: any) => u.role === UserRole.AGENT)).toBe(true);
      // Sensitive fields should not be exposed
      expect(res.body.every((u: any) => u.passwordHash === undefined)).toBe(true);
    });

    it('should return an empty array when there are no agents', async () => {
      await createUser(prisma, 'user@test.com', 'password123', UserRole.USER);
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'password123' });
      const { accessToken } = loginRes.body;

      const res = await request(app.getHttpServer())
        .get('/users/agents')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('should return 401 without a token', async () => {
      await request(app.getHttpServer()).get('/users/agents').expect(401);
    });

    it('should also be accessible by an AGENT', async () => {
      await createUser(prisma, 'agent@test.com', 'password123', UserRole.AGENT);
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'agent@test.com', password: 'password123' });
      const { accessToken } = loginRes.body;

      await request(app.getHttpServer())
        .get('/users/agents')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });
});

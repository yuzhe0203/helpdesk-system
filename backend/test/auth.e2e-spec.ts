import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase, createUser } from './helpers/db.helper';
import { UserRole } from '@prisma/client';

describe('Auth (e2e)', () => {
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
  // POST /auth/register
  // ---------------------------------------------------------------------------
  describe('POST /auth/register', () => {
    it('should register a new user and return user info', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'newuser@example.com', password: 'password123' })
        .expect(201);

      expect(res.body).toMatchObject({
        email: 'newuser@example.com',
        role: UserRole.USER,
      });
      expect(res.body.id).toBeDefined();
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('should return 409 when email is already registered', async () => {
      await createUser(prisma, 'taken@example.com', 'password123');
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'taken@example.com', password: 'password123' })
        .expect(409);
    });

    it('should return 400 when email is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'password123' })
        .expect(400);
    });

    it('should return 400 when password is too short', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'user@example.com', password: 'short' })
        .expect(400);
    });

    it('should return 400 when required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'user@example.com' })
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /auth/login
  // ---------------------------------------------------------------------------
  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await createUser(prisma, 'loginuser@example.com', 'password123');
    });

    it('should login and return accessToken and refreshToken', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'loginuser@example.com', password: 'password123' })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('should return 401 with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'loginuser@example.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('should return 401 with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' })
        .expect(401);
    });

    it('should return 400 when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'password123' })
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /auth/refresh
  // ---------------------------------------------------------------------------
  describe('POST /auth/refresh', () => {
    it('should return new accessToken and refreshToken', async () => {
      await createUser(prisma, 'refreshuser@example.com', 'password123');
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'refreshuser@example.com', password: 'password123' });

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: loginRes.body.refreshToken })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('should return 401 with an invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'this.is.invalid' })
        .expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /auth/logout
  // ---------------------------------------------------------------------------
  describe('POST /auth/logout', () => {
    it('should logout successfully with a valid access token', async () => {
      await createUser(prisma, 'logoutuser@example.com', 'password123');
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'logoutuser@example.com', password: 'password123' });

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .expect(201);
    });

    it('should return 401 without a token', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });

    it('should return 401 with an invalid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /auth/profile
  // ---------------------------------------------------------------------------
  describe('GET /auth/profile', () => {
    it('should return the current user profile', async () => {
      await createUser(prisma, 'profileuser@example.com', 'password123');
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'profileuser@example.com', password: 'password123' });

      const res = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        email: 'profileuser@example.com',
        role: UserRole.USER,
      });
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('should return 401 without a token', async () => {
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });
  });
});

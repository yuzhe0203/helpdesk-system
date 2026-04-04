import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt');

const mockedBcrypt = jest.mocked(bcrypt);

const mockUsersService = {
  findByEmail: jest.fn(),
  createUser: jest.fn(),
  updateRefreshToken: jest.fn(),
  findById: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
};

const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue('mock-secret'),
};

const mockUser = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  role: 'USER',
  passwordHash: 'stored-hash',
  refreshTokenHash: 'stored-refresh-hash',
  createdAt: new Date('2024-01-01'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
    mockConfigService.getOrThrow.mockReturnValue('mock-secret');
    mockJwtService.signAsync.mockResolvedValue('mock-token');

    mockedBcrypt.hash.mockResolvedValue('hashed-value' as never);
    mockedBcrypt.compare.mockResolvedValue(true as never);
  });

  // ─── register ───────────────────────────────────────────────────────────────

  describe('register', () => {
    it('should create a user and return id, email, role, createdAt', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockUsersService.createUser).toHaveBeenCalledWith(
        'test@example.com',
        'hashed-value',
      );
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
      });
    });

    it('should throw ConflictException if email is already registered', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── login ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('should return accessToken and refreshToken on success', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        'hashed-value',
      );
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'no@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── refresh ─────────────────────────────────────────────────────────────────

  describe('refresh', () => {
    const refreshPayload = {
      sub: mockUser.id,
      email: mockUser.email,
      role: 'USER',
      jti: 'some-jti',
    };

    it('should return new accessToken and refreshToken on success', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(refreshPayload);
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await service.refresh('valid-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        'hashed-value',
      );
    });

    it('should throw UnauthorizedException if verifyAsync throws', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('expired'));

      await expect(service.refresh('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(refreshPayload);
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.refresh('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user has no stored refresh token', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(refreshPayload);
      mockUsersService.findById.mockResolvedValue({
        ...mockUser,
        refreshTokenHash: null,
      });

      await expect(service.refresh('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token hash does not match', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(refreshPayload);
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.refresh('tampered-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── getUserProfile ──────────────────────────────────────────────────────────

  describe('getUserProfile', () => {
    it('should return userId, email, role', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.getUserProfile(mockUser.id);

      expect(result).toEqual({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.getUserProfile('bad-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── logout ──────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should clear the refresh token and return a message', async () => {
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.logout(mockUser.id);

      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        null,
      );
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });
});

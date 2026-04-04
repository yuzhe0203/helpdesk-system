import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CurrentUserPayload, UserRole } from '../common/types/user.types';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  getUserProfile: jest.fn(),
};

const mockUser: CurrentUserPayload = {
  userId: 'user-uuid-1',
  role: UserRole.USER,
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should call authService.register with the provided dto', async () => {
    const dto = { email: 'test@example.com', password: 'password123' };
    mockAuthService.register.mockResolvedValue({ id: '1', email: dto.email });

    await controller.register(dto);

    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
  });

  it('should call authService.login with the provided dto', async () => {
    const dto = { email: 'test@example.com', password: 'password123' };
    mockAuthService.login.mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });

    await controller.login(dto);

    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
  });

  it('should call authService.refresh with the token from dto', async () => {
    const dto = { refreshToken: 'my-refresh-token' };
    mockAuthService.refresh.mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });

    await controller.refresh(dto);

    expect(mockAuthService.refresh).toHaveBeenCalledWith('my-refresh-token');
  });

  it('should call authService.logout with the current user id', async () => {
    mockAuthService.logout.mockResolvedValue({ message: 'Logged out successfully' });

    await controller.logout(mockUser);

    expect(mockAuthService.logout).toHaveBeenCalledWith(mockUser.userId);
  });

  it('should call authService.getUserProfile with the current user id', async () => {
    mockAuthService.getUserProfile.mockResolvedValue({
      userId: mockUser.userId,
      email: 'test@example.com',
      role: UserRole.USER,
    });

    await controller.getProfile(mockUser);

    expect(mockAuthService.getUserProfile).toHaveBeenCalledWith(mockUser.userId);
  });
});

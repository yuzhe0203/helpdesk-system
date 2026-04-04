import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';

function createMockContext(userRole: string): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user: { role: userRole } }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  it('should return true when no roles metadata is set', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext('USER');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true when user has a required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = createMockContext('ADMIN');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return false when user does not have required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = createMockContext('USER');
    expect(guard.canActivate(context)).toBe(false);
  });
});
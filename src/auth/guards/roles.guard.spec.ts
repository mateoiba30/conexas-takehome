import { jest } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

function mockContext(role: string | undefined, requiredRoles: string[]): ExecutionContext {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(
    requiredRoles.length > 0 ? requiredRoles : undefined,
  );

  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles metadata is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = mockContext('regular', []);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when user role matches the required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const ctx = mockContext('admin', ['admin']);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies access when user role does not match the required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const ctx = mockContext('regular', ['admin']);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('allows access when user has one of multiple accepted roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'regular']);
    const ctx = mockContext('regular', ['admin', 'regular']);
    expect(guard.canActivate(ctx)).toBe(true);
  });
});

import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      this.logger.debug('RolesGuard: no roles required, allowing access');
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const allowed = requiredRoles.includes(user?.role);

    this.logger.debug(
      { userRole: user?.role, requiredRoles, allowed },
      'RolesGuard: access decision',
    );

    return allowed;
  }
}

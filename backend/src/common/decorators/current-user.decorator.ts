import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../types';

/**
 * Extrait l'utilisateur authentifié (directeur de prison) de la requête.
 * Usage : `@CurrentUser() user: AuthUser`
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  },
);

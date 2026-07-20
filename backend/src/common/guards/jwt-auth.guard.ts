import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthUser } from '../types';

/**
 * Guard JWT : vérifie le bearer token et attache l'utilisateur à req.user.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token d’authentification manquant');
    }

    const token = authHeader.substring('Bearer '.length).trim();
    try {
      const payload = this.jwtService.verify<{ sub: number; email: string; name?: string }>(token);
      const user: AuthUser = {
        userId: payload.sub,
        email: payload.email,
        name: payload.name,
      };
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }
}
